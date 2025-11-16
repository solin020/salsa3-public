import type {SchedulePrototype, TestPrototypeChoice, Timezone, Timing} from 'src/types/schedule.d.ts'
import type { TestPrototypeMeta } from '@/types';
import {computed, inject, type Ref} from 'vue'




function getRandomInt(min:number, max:number):number {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

function get_random_time(min_hour:number, min_minute:number, max_hour:number, max_minute:number):[number,number]{
    const minute_span = (max_hour-min_hour)*60 + (max_minute-min_minute)
    const minute_index = Math.round(Math.random() * minute_span)
    const ret_hour = min_hour + Math.floor((minute_index+min_minute)/60)
    const ret_minute = (minute_index+min_minute)%60
    return [ret_hour, ret_minute]
}

function time_generator(min_hour:number, min_minute:number, max_hour:number, max_minute:number){
    return function* (){
        while(true){
            yield get_random_time(min_hour, min_minute, max_hour, max_minute)

        }
    }()
}
  
function shuffle<T>(ipt: T[] ):T[]{
    const retval: T[] = []
    while (ipt.length>0){
        retval.push(ipt.splice(getRandomInt(0,ipt.length),1)[0])
    }
    return retval
}
  
function with_replacement_sample(sampland:string[]){
    console.log('with replacement called')
    console.log('sampland', sampland)
    function* inner(){
        while (true){
            const retval = sampland[getRandomInt(0, sampland.length)]
            console.log('with', retval)
            yield retval
        }
    }
    return inner()
}
function without_replacement_sample(tp_ids:string[]){
    console.log('without replacement called')
    console.log('sampland', tp_ids)
    const sampland = shuffle(tp_ids)
    function* inner(){
        let i = 0
        while (true){
            const retval =  sampland[i % sampland.length]
            console.log('without', retval)
            yield retval
            i += 1
        }
    }
    return inner()
}


function get_test_prototype_generator(
    t:TestPrototypeChoice<'website',('entry'|'base'|'phase')>|undefined,
    tp: Ref<TestPrototypeMeta[]>
):()=>string{
    function get_groups(group:string){
        const retval = tp.value.filter(t => t.groups.includes(group)).map(t => t.id)
        console.log('get groups', retval)
        return retval
    }
    console.log('get_prototype_generator', t)
    if (!t){
        return ()=>(console.log('undefined gen'), '')
    } else{
        switch(t.type){
            case 'fixed': return ()=>(console.log('fixed gen'), t.test_prototype_id)
            case 'per-patient': {
                const gen = t.replace_after_sampling ? 
                                with_replacement_sample(get_groups(t.group)) : 
                                without_replacement_sample(get_groups(t.group))
                console.log('gen the generator')
                const retfun =  ()=>{return gen.next().value!}
                retfun.stage='per-patient'
                return retfun
            }
            case 'inherit': return ()=>(console.log('inherited gen'), '')
            case 'same-across-patients': {
                console.log('got to same across patients')
                console.log('t replace', t.replace_after_sampling)
                const gen = t.replace_after_sampling ? 
                                with_replacement_sample(get_groups(t.group)) : 
                                without_replacement_sample(get_groups(t.group))
                const retfun =  ()=>{return gen.next().value!}
                retfun.stage='same-across-patients'
                return retfun
            }
        }
    }
}


function get_timing_generator(t:Timing<'website', ('entry'|'phase'|'base')>):()=>[number,number]{
    if (!t){
        return ()=>([9, 0])
    } else{
        switch(t.type){
            case 'fixed': return ()=>([t.hour, t.minute])
            case 'per-patient': {
                console.log('got to per timing')
                const gen = time_generator(t.min_hour, t.min_minute, t.max_hour, t.max_minute)
                const retfun = ()=>{return gen.next().value!}
                retfun.stage='per-patient'
                return retfun
            }
            case 'inherit': return ()=>([9, 0])
            case 'same-across-patients': {
                console.log('got to same timing')
                const gen = time_generator(t.min_hour, t.min_minute, t.max_hour, t.max_minute)
                const retfun =  ()=>{return gen.next().value!}
                retfun.stage='same-across-patients'
                return retfun
            }
        }
    }
}

function* counter(){
    let i = 0 
    while (true){
        yield i
        i++
    }
}


//This function takes care of all across-patient randomization and calculates the sequence
//numbers for each test
export function prepare_schedule_for_upload(
    ws:SchedulePrototype<'website'>,
    tp: Ref<TestPrototypeMeta[]>
):SchedulePrototype<'database'>{
    const base_prototype_generator = get_test_prototype_generator(ws.prototype_selection, tp)
    const base_timing_generator = get_timing_generator(ws.timing)
    const sequence_no_generator = counter()
    return {
        ...ws,
        default_selection: function(ds){
            if(ds){
                if(ds.type==='fixed'){
                    return ds
                } else if (ds.type==='choose'){
                    return {
                        type:ds.type,
                        test_prototype_ids: tp.value.filter(ttp => ttp.groups.includes(ds.group)).map(ttp => ttp.id)
                    }
                } else if (ds.type==='random'){
                    return {
                        type:ds.type,
                        test_prototype_ids: tp.value.filter(ttp => ttp.groups.includes(ds.group)).map(ttp => ttp.id)
                    }
                }
            } else{
                return undefined
            }
        }(ws.default_selection),
        prototype_selection: ws.prototype_selection?.type==='same-across-patients' ? 
            undefined : 
            ws.prototype_selection,
        timing: ws.timing?.type==='same-across-patients' ? 
            undefined : 
            ws.timing,
        //@ts-ignore
        phases: ws.phases.map(
            p => {
                const phase_prototype_generator = (p.prototype_selection?.type === 'same-across-patients')?
                    get_test_prototype_generator(p.prototype_selection, tp) :
                    base_prototype_generator
                const phase_timing_generator = (p.spec.timing?.type === 'same-across-patients')?
                    (console.log('btg'), get_timing_generator(p.spec.timing)) :
                    base_timing_generator
                return {
                    ...p,
                    prototype_selection: p.prototype_selection?.type==='same-across-patients' ? 
                        undefined : 
                        p.prototype_selection,
                    spec: {
                        ... p.spec,
                        timing: p.spec.timing?.type==='same-across-patients' ? 
                            undefined : 
                            p.spec.timing,
                        tests: p.spec.tests.map( 
                            e => {
                                const entry_prototype_generator = e.prototype_selection.type === 'inherit' ? 
                                    phase_prototype_generator :
                                    get_test_prototype_generator(e.prototype_selection, tp) 
                                const entry_timing_generator = e.timing.type === 'inherit' ? 
                                    (console.log('ptg'), phase_timing_generator) :
                                    get_timing_generator(e.timing) 
                                console.log('etype', e.prototype_selection.type)
                                //@ts-ignore
                                console.log('etmtype', entry_timing_generator.stage)

                                return {
                                    datetime:e.datetime,
                                    sequence_no:sequence_no_generator.next().value!,
                                    prototype_selection: (
                                        e.prototype_selection.type === 'same-across-patients' ||
                                        e.prototype_selection.type === 'inherit' && Reflect.get(entry_prototype_generator, 'stage') === 'same-across-patients'
                                    ) ? 
                                        {
                                            type:"fixed", 
                                            test_prototype_id:(console.log('upload'), entry_prototype_generator())} : 
                                        e.prototype_selection,
                                    timing: (
                                        e.timing.type === 'same-across-patients' ||
                                        e.timing.type === 'inherit' && Reflect.get(entry_timing_generator, 'stage') === 'same-across-patients'
                                    ) ? 
                                    (([hour, minute])=>({type:'fixed', hour, minute})
                                        )((console.log('what???'),entry_timing_generator())) : 
                                    e.timing,
                                    associated_messages:e.associated_messages,
                                }
                            }
                        )
                    }
                }
            }
        )
    }
}
function get_postgres_timestamp(year:number, month:number, day:number, hour:number, minute:number, timezone:string){
    const pad_hour = hour.toString().padStart(2,"0")
    const pad_minute = minute.toString().padStart(2,"0")
    return `${year}/${month+1}/${day} ${pad_hour}:${pad_minute} ${timezone}`
}


//This function takes care of all per-patient randomization and calculates the patient specific testing
//times based on start date
export function prepare_schedule_for_participant(
    ws:SchedulePrototype<'database'>,
    tp: Ref<TestPrototypeMeta[]>,
    start_date:Date,
    participant_id: string,
    participant_timezone: Timezone
):SchedulePrototype<'device'>{
    //@ts-ignore
    const base_prototype_generator = get_test_prototype_generator(ws.prototype_selection, tp, console.log('got to base!'))
    const base_timing_generator = get_timing_generator(ws.timing,)
    return {
        schedule_id: ws.schedule_id,
        participant_id,
        participant_timezone,
        default_results: undefined,
        twilio_info:undefined,
        prototype_selection:undefined,
        default_selection:ws.default_selection,
        associated_messages:ws.associated_messages,
        timing:undefined,
        phases: ws.phases.map(
            p => {
                const phase_prototype_generator = p.prototype_selection ? 
                    get_test_prototype_generator(p.prototype_selection, tp) :
                    base_prototype_generator
                const phase_timing_generator = p.spec.timing ? 
                    get_timing_generator(p.spec.timing) :
                    base_timing_generator
                return {
                    id:p.id,
                    prototype_selection: undefined,
                    associated_messages:p.associated_messages,
                    spec: {
                        cadence: p.spec.cadence,
                        timing:undefined,
                        tests: p.spec.tests.map( 
                            (e,i) => {
                                const entry_prototype_generator = e.prototype_selection.type === 'inherit' ? 
                                    phase_prototype_generator:
                                    //@ts-ignore
                                    get_test_prototype_generator(e.prototype_selection, tp, console.log('got to entry!')) 
                                const entry_timing_generator = e.timing.type === 'inherit' ? 
                                    phase_timing_generator:
                                    get_timing_generator(e.timing) 
                                //@ts-ignore
                                console.log('etmtype2', entry_timing_generator.stage)
                                const base_date = (
                                    p.spec.cadence==='daily'? 
                                    new Date(start_date.getFullYear() + p.spec.tests[i].datetime.year,
                                            start_date.getMonth(),
                                            start_date.getDate() + p.spec.tests[i].datetime.day
                                        ) : 
                                    new Date(
                                        start_date.getFullYear(),
                                        start_date.getMonth(),
                                        start_date.getDate() + (
                                            (p.spec.tests[i].datetime.week*7) + p.spec.tests[i].datetime.weekday - start_date.getDay()
                                        )
                                    )
                                )
                                const test_timing = e.timing.type==='fixed' ? e.timing :
                                    (([hour,minute])=>({
                                        type:'fixed',hour,minute
                                    }))(entry_timing_generator())
                                const prototype_selection: {type:'fixed',test_prototype_id:string } = e.prototype_selection.type!=='fixed' ? 
                                    {
                                        type:"fixed", 
                                        test_prototype_id:entry_prototype_generator()} : 
                                    e.prototype_selection
                                const response_stimuli = tp.value.filter(
                                    t => t.id===prototype_selection.test_prototype_id
                                )[0].response_stimuli

                                return {
                                    results: undefined,
                                    // The formal timestamp gets inserted directly into the postgres database
                                    // It has a form like 5/15/2025 13:25 America/Chicago
                                    // These timestamps are anchored to the participant's timezone
                                    // To ensure that the tests are being delivered at the appropriate time for where they are
                                    formal_timestamp: ((d)=>
                                        get_postgres_timestamp(d.getFullYear(),d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), participant_timezone)
                                    )(
                                        p.spec.cadence==='daily'? 
                                        //Generate a timestamp based on year, month, and day
                                        new Date(start_date.getFullYear() + p.spec.tests[i].datetime.year,
                                                start_date.getMonth(),
                                                start_date.getDate() + p.spec.tests[i].datetime.day,
                                                test_timing.hour,
                                                test_timing.minute
                                            ) : 
                                        //Generate a timestamp fixed to a specific week
                                        new Date(
                                            start_date.getFullYear(),
                                            start_date.getMonth(),
                                            start_date.getDate() + (
                                                //The trick right here guarantees that the generated day of the week matches e.datetime.weekday, a number
                                                //from 0 for Sunday to 6 for Saturday
                                                (p.spec.tests[i].datetime.week*7) + p.spec.tests[i].datetime.weekday - start_date.getDay()
                                            ),
                                            test_timing.hour,
                                            test_timing.minute
                                        )
                                    ),
                                    real_timestamp: undefined,
                                    //This takes care of random selections that are tagged 'per-patient'
                                    //and are unique for every patient
                                    prototype_selection,
                                    response_stimuli,
                                    associated_messages:e.associated_messages,
                                    sequence_no: e.sequence_no
                                }
                            }
                        )
                    }
                }
            }
        )
    }
}