export enum Quality {
    FUTURE=0,
    COMPLETE=1,
    PARTIAL=2,
    INCOMPLETE=3,
    DROPPED=100,
    OPEN=99,
    DUPLICATE=4,
    PASTOPEN=98,
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
export type SubmissionQuality = 'perfect'|'imperfect'|'recent'|'impending'|'future'|'missing'|'dropout'|'multiple'|'suspect'

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
            associated_messages: AssociatedMessages<'entry'>
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
            associated_messages: AssociatedMessages<'entry'>
            prototype_selection:TestPrototypeChoice<Location, 'entry'>
        }[]
    }
) : {
    cadence: ("daily"|"weekly")
    tests:{
        formal_timestamp: string
        real_timestamp: Location extends "result" ? Date : undefined
        response_stimuli: ResponseStimulus[]
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
    associated_messages: AssociatedMessages<'base'> 
    prototype_selection: TestPrototypeChoice<Location, 'base'>
    default_results: Location extends ("result") ? Result[] : undefined
    default_selection?: DefaultTestPrototypeChoice<Location>
    twilio_info: Location extends ("database"|"website") ? string : undefined
    phases: 
    {
        id:string
        spec:PhaseSpec<Location>
        prototype_selection: TestPrototypeChoice<Location, 'phase'>
        associated_messages: AssociatedMessages<'phase'> 
    }[]
}
    

export type Timezone = (
    'Pacific/Guam'|'Pacific/Honolulu'|'America/Adak'|'America/Anchorage'|
    'America/Los_Angeles'|'America/Phoenix'|'America/Denver'|
    'America/Chicago'|'America/New_York'|'America/Puerto_Rico'|'Pacific/Samoa'
)

export type DashboardByParticipantsData = {
    "n-registered-participants": number
    "n-completed-visits": number
    participants: {
        pid: string
        task_id: string
        task_name: string
        task_data: {[key:string]:number[]}
    }[]
}
export type ResponseStimulus = {
    id:string,
    type:'recording'|'ema'
}

export type StimulusResult<T extends 'parsed'|'unparsed'> = {
    project: string
    participant_id: string
    real_timestamp?: T extends 'parsed'? Date : string
    miscellaneous?: any
    test_prototype_id: string
    schedule_id?: string
    stimulus_id: string
    sequence_no: number
    formal_timestamp?: T extends 'parsed'? Date : string
    schedule_prototype_id: string
    quality: number
}
export type Visit = {
    phase: string | -1
    results: StimulusResult<'parsed'>[]
    quality?: 0|1|2|3|100|99|4|98
    sequence_no:number
}

export type Interval = {
    count:number
    unit:(
        'minutes'|
        'hours'|
        'days'
    )
}
export type AssociatedMessages<Level extends ('entry'|'phase'|'base')> = {
    type:'fixed',
    messages : {
        interval:Interval,
        message:string,
        condition:('complete' | 'incomplete' | 'unconditional'|'missing2')
    }[]
} | {
    type:'none'
} | (Level extends 'base'? never:{
    type:'inherit'
} )

export type ScheduledResponse = {
    phase_id: string
    quality: '0'|'3'
    real_timestamp?: string
    schedule_id: string
    sequence_no: number
    status: SubmissionQuality
    stimulus_id: string
    test_prototype_id: string
}

export type ScheduledVisit = {
phase_id: string
scheduled_time: string
sequence_no: number
status: SubmissionQuality
visit: ScheduledResponse[]
real_timestamp: string
test_prototype_id: string
}

export type SelfInitiatedResponse = {
    quality: '0'|'3'
    inspected: boolean
    miscellaneous?: any
    real_timestamp?: string
    schedule_id: string
    stimulus_id: string
    test_prototype_id: string
}
export type SelfInitiatedVisit = {
real_time: string
schedule_id: string
visit: SelfInitiatedResponse []
}
export type BareStimulus = {
    schedule_id:string, stimulus_id: string, quality: ('0'|'3'|'2'), real_timestamp?:string
}

export type Visit2 = {
    participant_id: string
    test_prototype_id: string
    formal_timestamp: string
    sequence_no: number
    real_timestamp?: string
    srs: BareStimulus[]
    schedule_ids: string[]
    quality: SubmissionQuality
}
