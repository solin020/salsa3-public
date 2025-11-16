import type { TestPrototypeMeta } from "@/types"
import type { ResponseStimulus, SchedulePrototype, StimulusResult, Visit } from "@/types/schedule"

export function get_unique_stimuli(test_prototypes: TestPrototypeMeta[], schedule_prototype:SchedulePrototype<'database'>):ResponseStimulus[]{
    const groups: string[] = []
    const test_prototype_ids: string[] = []
    let x
    if ((x = schedule_prototype.prototype_selection)?.type==='fixed'){
        test_prototype_ids.push(x!.test_prototype_id)
    } else if ((x = schedule_prototype.prototype_selection)?.type==='per-patient'){
        groups.push(x!.group)
    }
    for (const phase of schedule_prototype.phases){
        let y
        if ((y = phase.prototype_selection)?.type==='fixed'){
            test_prototype_ids.push(y!.test_prototype_id)
        } else if ((y = phase.prototype_selection)?.type==='per-patient'){
            groups.push(y!.group)
        }
        for (const test of phase.spec.tests){
            let z
            if ((z = test.prototype_selection)?.type==='fixed'){
                test_prototype_ids.push(z!.test_prototype_id)
            } else if ((z = test.prototype_selection)?.type==='per-patient'){
                groups.push(z!.group)
            }
        }
    }
    const included_test_prototypes = test_prototypes.filter(
        tp => tp.groups.some((g) => groups.includes(g)) || test_prototype_ids.includes(tp.id)
    )
    const retval_dict: Map<string, ResponseStimulus> = new Map()
    for (const tp of included_test_prototypes){
        for (const stim of tp.response_stimuli){
            retval_dict.set(stim.id, stim)
        }
    }
    return Array.from(retval_dict.values())
}

class QualitySet {
    good_quality: number
    low_quality: number
    missed: number
    future: number
    dropout: number
    open: number
    duplicate: number
    constructor(){
        this.good_quality = 0
        this.low_quality = 0
        this.missed = 0
        this.future = 0
        this.dropout = 0
        this.open = 0
        this.duplicate = 0
    }
    insert(sr:StimulusResult<'parsed'>){
        if (sr.quality === 3){
            this.good_quality++
        } else if (sr.quality === 2){
            this.low_quality++
        } else if (sr.quality ===4){
            this.low_quality++
            this.duplicate++
        } else if(sr.quality === 1){
            this.missed ++
        } else if (sr.quality === 0){
            this.future ++
        } else if (sr.quality === 100){
            this.dropout ++ 
        } else if (sr.quality === 99){
            this.future ++
            this.open++
        } else if (sr.quality === 98){
            this.future ++
            this.open++
        }
    }
    insert_visit(results: StimulusResult<'parsed'>[]):(0|1|2|3|100|99|4|98){
        results
        if (results.every(sr => sr.quality===3)){
            this.good_quality++
            return 3
        } else if (results.some(sr => sr.quality===4)){
            this.low_quality++
            this.duplicate++
            return 4
        } else if (results.some(sr => ([3,2].includes(sr.quality)))){
            this.low_quality++
            return 2
        } else if(results.some(sr => sr.quality===100)){
            this.dropout++
            return 100
        } else if (results.some(sr => sr.quality===1)){
            this.missed++
            return 1
        } else if (results.some(sr => sr.quality===99)) {
            this.future++
            this.open++
            return 99
        }
        else if (results.some(sr => sr.quality===98)) {
            this.future++
            this.open++
            return 98
        }
        else {
            this.future++
            return 0
        }
    }
    get finished(){
        return this.low_quality + this.good_quality
    }
    get expected(){
        return this.low_quality + this.good_quality + this.missed
    }
    get future_expected(){
        return this.low_quality + this.good_quality + this.missed + this.future
    }
    get future_all(){
        return this.low_quality + this.good_quality + this.missed + this.future + this.dropout
    }
    get fraction_finished(){
        return this.finished / this.expected
    }
    get fraction_good(){
        return this.good_quality / (this.expected||Infinity)
    }
    get fraction_bad(){
        return this.low_quality / (this.expected||Infinity)
    }
    get fraction_missed(){
        return this.missed / (this.expected||Infinity)
    }
    get fraction_future(){
        return this.future / (this.expected||Infinity)
    }
    get fraction_dropout(){
        return this.dropout / (this.expected||Infinity)
    }
    get fraction_finished_future(){
        return this.finished / (this.future_expected||Infinity)
    }
    get fraction_good_future(){
        return this.good_quality / (this.future_expected||Infinity)
    }
    get fraction_finished_all(){
        return this.finished / (this.future_all||Infinity)
    }
    get fraction_good_all(){
        return this.good_quality / (this.future_all||Infinity)
    }
    
}

type VisitStats = {
    all_stimuli: {
        whole_schedule: QualitySet
        phases: Map<string, QualitySet>
    }
    by_stim_type:Map<string, {
        whole_schedule: QualitySet
        phases: Map<string, QualitySet>
    }>
    by_default_stim_type:Map<string, QualitySet>
}

export type ParticipantPhase = {
    tag:'dropout'
} | {
    tag: 'awaiting'
    phase: string
} | {
    tag: 'active'
    phase:string
} | {
    tag: 'complete'
}
type ParticipantPhaseMap = Map<string, ParticipantPhase>
export function participantPhaseEquals(pp1:ParticipantPhase, pp2:ParticipantPhase):boolean{
    if (pp1.tag === 'dropout' || pp1.tag === 'complete'){
        return pp1.tag === pp2.tag
    } else if (pp1.tag === 'active' || pp1.tag === 'awaiting'){
        return  pp1.tag === pp2.tag && pp1.phase === pp2.phase
    }
    return false
}

type ParticipantScheduleStructure = Map<string, Map<string|-1, Visit[]>>

//Check if any data present for participant (there will be a 2 or a 3 quality registered for any files they submit)
export function participant_has_data(pss: ParticipantScheduleStructure, participant_id: string){
    const inspectand = pss.get(participant_id)
    let retval = false
    if (inspectand){
        inspectand.forEach(
            (mm, k) => mm.forEach(
                (visit, ik) => visit.results.forEach(
                    rr => retval = retval || [2,3].includes(rr.quality))))
    }
    return retval
}
type FilterableParticipantScheduleStructure = [ParticipantPhase, {
    startTime: Date, 
    pid:string,
    phases: Map<string | -1, Visit[]>
}[]][]
type ParticipantsWithFilterProperties = [{
    phase:ParticipantPhase,
    quality: QualitySet
},{
    startTime: Date, 
    pid:string,
    phases: Map<string | -1, Visit[]>
}][]

function get_participant_phases(pss: ParticipantScheduleStructure):ParticipantsWithFilterProperties{
    const now = new Date()
    const participantPhaseMap = new Map<string, [Date, ParticipantPhase]>()
    const allParticipantsAndPhases:FilterableParticipantScheduleStructure= []
    let phase_order_found = false
    const phase_order: string[] = []
    founddropout: for (const [pid, phases] of pss.entries())  {
        const phaseTimes: {phasename:string, start:Date, end:Date}[] = []
        for (const [phasename, visits] of phases.entries()){
            const visitTimes: Date[] = []
            for (const visit of visits) {
                const resultTimes: Date[] = []
                for (const r of visit.results) {
                    if (r.quality === 100){
                        participantPhaseMap.set(pid, [r.formal_timestamp!, {tag:'dropout'}])
                        continue founddropout
                    }
                    if (r.real_timestamp){
                        resultTimes.push(r.real_timestamp)
                    } else if (r.formal_timestamp){
                        resultTimes.push(r.formal_timestamp)
                    }
                }
                resultTimes.sort((a, b) => (a>=b)?1:0)
                if (resultTimes.length === 0){
                    //If somehow there's errors and both formal timestamp and real timestamp are missing
                    resultTimes.push(new Date('1971-01-01'))
                }
                visitTimes.push(resultTimes.pop()!)
            }
            visitTimes.sort((a, b) => (a>=b)?1:0)
            if (visitTimes.length === 0){
                //If somehow there's errors and both formal timestamp and real timestamp are missing
                visitTimes.push(new Date('1971-01-01'))
            }
            const phaseStart = visitTimes[0]
            const phaseEnd = visitTimes.pop()!
            if (phasename !== -1){
                //Don't include self initiated tests (marked with phase -1)
                phaseTimes.push({phasename, start:phaseStart, end:phaseEnd})
            }
        }
        phaseTimes.sort((p1, p2) => (p1.start > p2.start)?1:0)
        const participantStart = phaseTimes[0]?.start || new Date('1971-01-01')
        for (const {phasename, start, end} of phaseTimes){
            if (!phase_order_found){
                phase_order.push(phasename)
            }
            if (now < start){
                participantPhaseMap.set(pid, [participantStart,{
                    tag:'awaiting',
                    phase:phasename
                }])
                break
            } else {
                if (now < end){
                    participantPhaseMap.set(pid, [participantStart,{
                        tag:'active',
                        phase:phasename
                    }])
                    break
                }
            }
        }
        if (!participantPhaseMap.has(pid)){
            participantPhaseMap.set(pid, [participantStart,{tag:'complete'}])
        }
        phase_order_found = true
    }
    for (const phase of phase_order){
        allParticipantsAndPhases.push([{tag:'active',phase }, []])
        allParticipantsAndPhases.push([{tag:'awaiting',phase }, []])
    }
    allParticipantsAndPhases.push([{tag:'complete'}, []])
    allParticipantsAndPhases.push([{tag:'dropout'}, []])
    found: for (const [pid, [startTime, phasepoint_p]] of participantPhaseMap.entries()){
        for (const [phasepoint_r, participants] of allParticipantsAndPhases){
            if (participantPhaseEquals(phasepoint_p, phasepoint_r)){
                participants.push({startTime, pid, phases:pss.get(pid)!})
                continue found
            }
        }
    }
    const sortedParticipants: ParticipantsWithFilterProperties = []
    for (const [phasepoint_r, participants] of allParticipantsAndPhases){
        for (const par of participants){
            sortedParticipants.push([{
                phase:phasepoint_r,
                quality:((()=>{
                    const qs = new QualitySet()
                    for (const [phase, visits] of par.phases.entries()){
                        //ignore self submits in stats
                        if (typeof phase === 'string'){
                            type zz = typeof visits[number]['quality']
                            visits.forEach(v => qs.insert_visit(v.results))
                        }
                    }
                    return qs
                })())
            },par])
        }
    }
    sortedParticipants.sort((a,b) => (a[1].startTime < b[1].startTime)?1:0)
    return sortedParticipants
}



export function count_visits(
        data:StimulusResult<'parsed'>[], 
        expected_stimuli:ResponseStimulus[], 
        expected_default_stimuli:ResponseStimulus[],
        schedule_prototype: SchedulePrototype<'database'>
    ):[VisitStats, ParticipantScheduleStructure, ParticipantsWithFilterProperties]{

    const now =  new Date()
    const visit_map: Map<string, {phase:string|-1, results:typeof data}> = new Map()
    const dashboard_code_map: Map<string, string> = new Map()
    const phases = schedule_prototype.phases.map(p => p.id)
    const phase_map: Map<number, string> = new Map()
    const expected_default_stimuli_ids = expected_default_stimuli.map(ds => ds.id)
    const expected_stimuli_ids = expected_stimuli.map(es => es.id)
    const p_s_s = new Map()
    for (const phase of schedule_prototype.phases){
        for (const test of phase.spec.tests){
            phase_map.set(test.sequence_no, phase.id)
        }
    }
    for (const sr of data){
        if (sr.stimulus_id === 'randomization_report'){
            continue
        }
        //validation in case the database ends up corrupt somehow
        if (sr.sequence_no === -1 && !(expected_default_stimuli_ids.includes(sr.stimulus_id))){
            sr.stimulus_id = 'unknown'
        } else if (!expected_stimuli_ids.includes(sr.stimulus_id)){
            sr.stimulus_id = 'unknown'
        }
        const synthetic_id: string = sr.sequence_no === -1 ?
            sr.schedule_id! :
            `${sr.participant_id}|${sr.sequence_no}`
        let k
        if (k=visit_map.get(synthetic_id)){
            k.results.push(sr)
        } else{
            const insval: {phase:string|-1, results: typeof data} = {
                phase: sr.sequence_no === -1 ? -1 : phase_map.get(sr.sequence_no) || 'unknown',
                results:[sr]
            }
            visit_map.set(synthetic_id, insval)
        }
        if (!p_s_s.has(sr.participant_id)){
            p_s_s.set(sr.participant_id, new Map(
                phases.map(p => [p, []])
            ))
        }
    }
    const participant_schedule_structure: ParticipantScheduleStructure = new Map()
    const visit_stats:VisitStats = {
        all_stimuli: {
            whole_schedule: new QualitySet(),
            phases: new Map(phases.map(p => [p, new QualitySet()]))

        },
        by_stim_type:new Map(
            expected_stimuli_ids.map(
                es => ([es, {
                    whole_schedule: new QualitySet(),
                    phases: new Map(phases.map(p => [p, new QualitySet()]))
                }])
            )
        ),
        by_default_stim_type:new Map (expected_default_stimuli_ids.map(
            ds => [ds, new QualitySet()]
        ))
    }
    for (const visit of visit_map.values()){
        const participant_id = visit.results[0].participant_id
        const sequence_no = visit.results[0].sequence_no
        if (!participant_schedule_structure.has(participant_id)){
            participant_schedule_structure.set(participant_id, new Map(
                ([...phases, -1] as (string|-1)[]).map(p => [p, []])
            ))
        }
        const this_participant = participant_schedule_structure.get(participant_id)
        if (visit.phase===-1 || visit.phase ==='unknown'){
            for (const sr of visit.results){
                const qs = visit_stats.by_default_stim_type.get(sr.stimulus_id)
                if (qs){
                    qs.insert(sr)
                }
            }
            this_participant?.get(-1)?.push(
                {
                    phase:-1,
                    results:visit.results,
                    quality:3,
                    sequence_no:-1
                }
            )
        } else {
            const v_phase = visit.phase
            const quality = visit_stats.all_stimuli.whole_schedule.insert_visit(visit.results)
            this_participant?.get(v_phase)?.push(
                {
                    phase: v_phase,
                    results: visit.results,
                    quality,
                    sequence_no
                }
            )
            visit_stats.all_stimuli.phases.get(v_phase)?.insert_visit(visit.results)
            for (const sr of visit.results){
                if (sr.stimulus_id !== 'unknown'){
                    const insand = visit_stats.by_stim_type.get(sr.stimulus_id)
                    insand?.whole_schedule.insert(sr)
                    insand?.phases.get(v_phase)?.insert(sr)
                }
            }
        }
    }
    return [visit_stats, participant_schedule_structure, get_participant_phases(participant_schedule_structure)]
}

export function get_src(schedule_id:string, filepath:string):string{
    return `/salsa/server/get-visit-file?${new URLSearchParams({schedule_id, filepath})}`
}