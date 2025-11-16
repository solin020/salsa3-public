import { type TwilioInfo } from "."
export enum Quality {
    FUTURE=0,
    COMPLETE=1,
    PARTIAL=2,
    INCOMPLETE=3,
    DROPPED=100
}

type Result = {
    timestamp:Date
    stimulus_id:string
    test_prototype_id:string
    sequence_no:number
    quality:{[key:string]:Quality}
}

type ScheduleLocation = ('website' | 'database' | 'device' | 'result')
type ScheduleLevel = ('base'|'phase'|'entry')


export type DefaultTestPrototypeChoice<Location extends ScheduleLocation> = 
    Location extends 'website'? {
        type:('random'|'choose')
        group: string
    } | {
        type: 'fixed'
        test_prototype_id:string
    } : {
        type:('random'|'choose')
        test_prototype_ids: string[]
    } | {
        type: 'fixed'
        test_prototype_id:string
    }

export type TestPrototypeChoice<
    Location extends ScheduleLocation,
    Level extends ScheduleLevel
    > = Location extends ("device"|"result")? 
        (Level extends ("phase"|"base") ? 
            undefined |  {type:"fixed"; test_prototype_id:string, stimuli:string[]}:
            {type:"fixed"; test_prototype_id:string}
        )
    : Location extends "database" ? 
    ( 
        TestPrototypeChoice<'device', Level> | 
        {
            type: "per-patient"
            replace_after_sampling: Level extends ('base'| 'phase') ? boolean : true
            group:string
        }
      | 
      (Level extends ('entry'|'phase') ? 
        {
            type: "inherit"
        } : undefined
      )
    )
: (TestPrototypeChoice<"database", Level> | 
    {
        type: "same-across-patients"
        replace_after_sampling: Level extends ('base'| 'phase') ? boolean : true
        group:string
    }
)

export type Timing<
    Location extends ScheduleLocation,
    Level extends ScheduleLevel
    > = Location extends ("device"|"result")? 
        (Level extends ("phase"|"base") ? 
            undefined |  {type:"fixed"; hour:number, minute:number}:
            {type:"fixed"; hour:number, minute:number}
        )
    : Location extends "database" ? 
    ( 
        Timing<'device', Level> | 
        {
            type: "per-patient"
            min_hour:number
            min_minute:number
            max_hour:number
            max_minute:number
        }
      | 
      (Level extends ('entry'|'phase') ? 
        {
            type: "inherit"
        } : undefined
      )
    )
: (Timing<"database", Level> | 
    {
        type: "same-across-patients"
        min_hour:number
        min_minute:number
        max_hour:number
        max_minute:number
    }
)





export enum Weekday {
    SUNDAY =0,
    MONDAY= 1,
    TUESDAY= 2,
    WEDNESDAY= 3,
    THURSDAY= 4,
    FRIDAY= 5,
    SATURDAY= 6,
}


export type PhaseSpec<Location extends ScheduleLocation> = Location extends ("website"|"database") ? (
    {            
        cadence: "daily"
        timing?:Timing<Location, 'phase'>
        tests:{
            datetime: {
                year: number
                day: number
                } 
            timing: Timing<Location, 'entry'>
            sequence_no: Location extends 'website'? undefined: number 
            prototype_selection:TestPrototypeChoice<Location, 'entry'>
        }[]
    }
    | 
    {
        cadence: "weekly"
        timing?:Timing<Location, 'phase'>
        tests:{
            datetime: {
                week: number
                weekday: Weekday
                } 
            timing: Timing<Location, 'entry'>
            sequence_no: Location extends 'website'? undefined: number 
            prototype_selection:TestPrototypeChoice<Location, 'entry'>
        }[]
    }
) : {
    cadence: ("daily"|"weekly")
    tests:{
        formal_timestamp: string
        real_timestamp: Location extends "result" ? Date : undefined
        response_stimuli: string[]
        sequence_no: number
        prototype_selection:TestPrototypeChoice<Location, 'entry'>
        results: Location extends "result" ? Result[] : undefined
        attempted?:boolean
        
    }[]

}



export type SchedulePrototype<Location extends ScheduleLocation> = {
    schedule_id:string
    participant_timezone: Location extends ("device"|"result") ? Timezone : undefined
    participant_id: Location extends ("device"|"result") ? string : undefined
    timing?:Timing<Location, 'base'>
    prototype_selection: TestPrototypeChoice<Location, 'base'>
    default_results: Location extends ("result") ? Result[] : undefined
    default_selection?: DefaultTestPrototypeChoice<Location>
    twilio_info: Location extends ("database"|"website") ? string : undefined
    phases: 
    {
        phase_id:string
        spec:PhaseSpec<Location>
        prototype_selection: TestPrototypeChoice<Location, 'phase'>
    }[]
}
    

export type Timezone = (
    'Pacific/Guam'|'Pacific/Honolulu'|'America/Adak'|'America/Anchorage'|
    'America/Los_Angeles'|'America/Phoenix'|'America/Denver'|
    'America/Chicago'|'America/New_York'|'America/Puerto_Rico'|'Pacific/Samoa'
)

