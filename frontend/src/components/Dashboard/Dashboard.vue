<template>
    <v-select 
            :items="schedule_prototype_ids" 
            v-model="current_schedule_prototype_id" 
            label="Select longitudinal study to review"
        />
    <template v-if="ready">
        <j-tabs :tabnames="['overview', 'participants']" v-if="can_display">
            <template #header_overview>
                Overview
            </template>
            <template #content_overview>
                <v-table class="j-dashboard-table" v-if="dashboard_summary">
                    <thead>
                        <tr>
                            <th style="max-width: 20em; min-width: 20em;" :colspan="td_span">
                                Number of active participants: {{ active_participant_total }}
                                <br/>
                                Number of dropped out participants: {{ dropout_participant_total }}
                                <br/>
                                Submissions to date: {{ dashboard_total_summary?.total_due }}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td :colspan="td_span">
                                <details open>
                                    <summary>Summary</summary>
                                    <v-table >
                                        <phase-headers :phase_ids="phase_ids"/>
                                        <tbody>
                                            <tr>
                                                <th style="max-width: 20em; min-width: 20em;">Completed</th>
                                                <td>
                                                    {{dashboard_total_summary?.total_complete}} ( {{ dashboard_total_summary?.percent_complete }} %)
                                                </td>
                                                <td v-for="p, i in phase_ids">
                                                    {{dashboard_summary[i].total_complete}} ({{ dashboard_summary[i]?.percent_complete }} %)
                                                </td>
                                            </tr>
                                            <tr>
                                                <th>Partially completed</th>
                                                <td>
                                                    {{dashboard_total_summary?.total_issues}} ( {{ dashboard_total_summary?.percent_issues }} %)
                                                </td>
                                                <td v-for="p, i in phase_ids">
                                                    {{dashboard_summary[i]?.total_issues}} ({{ dashboard_summary[i]?.percent_issues }} %)
                                                </td>
                                            </tr>
                                            <tr>
                                                <th>Not completed</th>
                                                <td>
                                                    {{dashboard_total_summary?.total_missing}} ( {{ dashboard_total_summary?.percent_missing }} %)
                                                </td>
                                                <td v-for="p, i in phase_ids">
                                                    {{dashboard_summary[i]?.total_missing}} ({{ dashboard_summary[i]?.percent_missing }} %)
                                                </td>
                                            </tr>
                                        </tbody>
                                    </v-table>
                                </details>
                            </td>
                        </tr>
                        <tr>
                            <td :colspan="td_span">
                                <details v-if="per_stimulus_summary">
                                    <summary>Data by indivual stimuli</summary>
                                    <v-table>
                                        <phase-headers :phase_ids="phase_ids"/>
                                        <tbody>
                                            <template v-for="stim, i in scheduled_stimuli">
                                                <tr :class="{'border-top':i===0}"
                                                    >
                                                    <th style="max-width: 20em; min-width: 20em;"> {{ stim}} Submitted </th>
                                                    <td>
                                                    {{per_stimulus_summary[(phase_ids.length * (scheduled_stimuli.length+1)) + i].total_complete}}
                                                    ({{ per_stimulus_summary[(phase_ids.length * (scheduled_stimuli.length+1)) + i].percent_complete }}%)
                                                    </td>
                                                    <td v-for="phase_id, j in phase_ids">
                                                        {{per_stimulus_summary[(j)*(scheduled_stimuli.length+1) + i].total_complete}}
                                                        ({{per_stimulus_summary[(j)*(scheduled_stimuli.length+1) + i].percent_complete}}%)     
                                                    </td>
                                                </tr>
                                                <tr :class="{'border-top':i===0}"
                                                    >
                                                    <th> {{ stim }} Missing </th>
                                                    <td>
                                                    {{per_stimulus_summary[(phase_ids.length * (scheduled_stimuli.length+1)) + i].total_missing}}
                                                    ({{per_stimulus_summary[(phase_ids.length * (scheduled_stimuli.length+1)) + i].percent_missing }}%)
                                                    </td>
                                                    <td v-for="phase_id, j in phase_ids">
                                                        {{per_stimulus_summary[(j)*(scheduled_stimuli.length+1) + i].total_missing}}
                                                        ({{per_stimulus_summary[(j)*(scheduled_stimuli.length+1) + i].percent_missing}}%)     
                                                    </td>
                                                </tr>
                                            </template>
                                        </tbody>
                                    </v-table>
                                </details>
                            </td>
                        </tr>
                        <tr>
                            <td colspan=2>
                                <details>
                                    <summary>Self-initiated</summary>
                                    <v-table>
                                        <tbody>
                                            <tr v-for="stim, i in self_initiated_summary">
                                                <th style="max-width: 20em; min-width: 20em;"> Self initiated {{ stim.stimulus_id }} </th>
                                                <td> {{ stim.count }}</td>
                                            </tr>
                                        </tbody>
                                    </v-table>
                                </details>
                            </td>
                        </tr>
                    </tbody>

                </v-table>
                <div>
                        <tr>

                                <j-btn :click="refresh_views" :arg0="null">Click to refresh dashboard data</j-btn>
                        </tr>
                </div>
                <div>
                        <tr>
                            <h3>
                                    Send emergency broadcast SMS
                            </h3>
                                <v-text-field v-model="emergency_sms" label="message"/>
                                <j-btn :click="send_emergency_sms" :arg0="null">Click to send message to all participants</j-btn>
                        </tr>
                </div>
            </template>
            <template #header_participants>
                View by Participant
            </template>
            <template #content_participants>
                <v-list>
                    <v-list-item>
                            <details>
                                <summary>Narrow results</summary>
                                <v-expansion-panels v-model="greater_panel">
                                    <v-expansion-panel value="filters" title="Specify Filters">
                                        <v-expansion-panel-text>
                                            <v-table class="j-dashboard-table" style="margin-left:10vw;">
                                                <tbody>
                                                        <tr>
                                                            <td>
                                                                <v-btn @click="reset_filters">Reset filters</v-btn>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <label>Participants flagged for outreach<input type="checkbox" v-model="missing_3"/></label>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <label>Participants with tests in a 48 hour range: <input type="checkbox" v-model="imminent"/></label>
                                                            </td>
                                                        </tr>
                                                        <!--
                                                        <tr>
                                                            <td>
                                                                <label>Participants who have not downloaded their tests: <input type="checkbox" v-model="downloaded"/></label>
                                                            </td>
                                                        </tr>
                                                        -->
                                                        <tr>
                                                            <td>
                                                                <label>Participants with suspect audio <input type="checkbox" v-model="suspect"/></label>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <label>Participants who have dropped out: <input type="checkbox" v-model="dropout"/></label>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <label>Gamers: <input type="checkbox" v-model="gamer"/></label>
                                                            </td>
                                                        </tr>
                                                        <tr v-if="dropout">
                                                            <td>
                                                                <v-combobox label="Reason for dropout"  :items="dropout_reasons" v-model="dropout_reason"/>
                                                            </td>
                                                        </tr>
                                                        <tr v-if="gamer">
                                                            <td>
                                                                <v-combobox label="Reason flagged as a gamer" :items="gamer_reasons"  v-model="gamer_reason"/>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <v-expansion-panels v-model="slider_panel">
                                                                <v-expansion-panel title="Click to filter by percent" value="1">
                                                                    <v-expansion-panel-text>
                                                                        <v-card>
                                                                            <v-card-title>
                                                                                <span
                                                                                    @click="perfect_gt = !perfect_gt"
                                                                                    class="j-dashboard-gt"
                                                                                >
                                                                                🔄</span> {{ perfect_gt? 'Greater than': 'Less than'}}
                                                                                 {{perfect_percent}}% Perfect <span class="j-dot j-visit-perfect"/>
                                                                            </v-card-title>
                                                                            <v-card-text>
                                                                                <v-slider
                                                                                    v-model="perfect_percent"
                                                                                    :color="perfect_gt ? 'grey' : 'green'"
                                                                                    thumb-color="green"
                                                                                    :track-color="perfect_gt ? 'green' : 'grey'"
                                                                                    min="0"
                                                                                    max="100"
                                                                                    step="1"
                                                                                ></v-slider>
                                                                            </v-card-text>
                                                                        </v-card>
                                                                        <v-card>
                                                                            <v-card-title>
                                                                                <span
                                                                                    @click="submitted_gt = !submitted_gt"
                                                                                    class="j-dashboard-gt"
                                                                                >
                                                                                🔄</span>{{ submitted_gt? 'Greater than': 'Less than'}}
                                                                                 {{submitted_percent}}% Submitted
                                                                                    <span class="j-dot j-visit-perfect"/>
                                                                                    <span class="j-dot j-visit-imperfect"/>
                                                                                    <span class="j-dot j-visit-multiple"/>
                                                                            </v-card-title>
                                                                            <v-card-text>
                                                                                <v-slider
                                                                                    v-model="submitted_percent"
                                                                                    :color="submitted_gt ? 'grey' : 'yellow'"
                                                                                    thumb-color="yellow"
                                                                                    :track-color="submitted_gt ? 'yellow' : 'grey'"
                                                                                    min="0"
                                                                                    max="100"
                                                                                    step="1"
                                                                                ></v-slider>
                                                                            </v-card-text>
                                                                        </v-card>
                                                                    </v-expansion-panel-text>
                                                                </v-expansion-panel>
                                                            </v-expansion-panels>
                                                        </tr>
                                                    </tbody>
                                                </v-table>
                                        </v-expansion-panel-text>
                                    </v-expansion-panel>
                                    <v-expansion-panel value="participant_id" title="Search by participant login code">
                                        <v-expansion-panel-text>
                                            <v-text-field v-model="participant_id" label="Enter participant login code"></v-text-field>
                                        </v-expansion-panel-text>
                                    </v-expansion-panel>
                                    <v-expansion-panel value="dashboard_code" title="Search by participant study id">
                                        <v-expansion-panel-text>
                                            <v-text-field v-model="dashboard_code" label="Enter participant study id"></v-text-field>
                                        </v-expansion-panel-text>
                                    </v-expansion-panel>
                                </v-expansion-panels>
                            </details>
                    </v-list-item>
                    <v-list-item>
                        <v-btn @click="query_participant_ids">Submit Query</v-btn>

                    </v-list-item>
                    <v-list-item v-if="participant_pages_ready">
                        <template v-if="participant_ids.length > 20">
                            <h2>Browse {{participant_ids.length}} participants' results by clicking on page numbers</h2>
                            <v-pagination v-model="active_page" :length="pages"/>
                        </template>
                        <template v-else-if="participant_ids.length >= 1">
                            <h2>Browse {{participant_ids.length}} participants' results by clicking on buton below</h2>
                            <v-btn @click="get_participant_page_data(1)">Click to load data of {{participant_ids.length}} participant's results </v-btn>
                        </template>
                    </v-list-item>
                    <v-list-item v-else-if="participant_ids.length = 0">
                        <h1>No participant data to show</h1>
                    </v-list-item>
                    <v-list-item v-else>
                        <v-progress-circular indeterminate/>
                    </v-list-item>
                    <v-list-item>
                        <v-table class="j-dashboard-table" v-if="participant_bubbles_ready && participant_pages_ready">
                            <thead>
                                <tr>
                                    <th>Participant study id</th>
                                    <th>Login code</th>
                                    <th>Edit participant</th>
                                    <th></th>
                                    <th v-for="phase in phase_ids">
                                        {{ phase }}
                                    </th>
                                    <th>
                                        Ad-lib tests
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="pvis in all_participant_data">
                                    <th>
                                        {{pvis.dashboard_code}}
                                        <span style="color:red; padding:1em;">{{ pvis.dropout? `DROPOUT: ${pvis.dropout_reason}`:'' }}</span>
                                        <span style="color:red; padding: 1em;">{{ pvis.gamer? `GAMER: ${pvis.gamer_reason}`:'' }}</span>
                                       <!--<participant-overview 
                                            :participant_id="pvis.login_code"
                                            :visit_phase_sequence_stimulus_map="pvis.visit_phase_sequence_stimulus_map"
                                            :self_initiated_stimulus_map="pvis.self_initiated_stimulus_map" 
                                            />-->
                                        <span  
                                         @click="download_participant_data(pvis.participant_id)">
                                         &nbsp;&nbsp; ⬇️&nbsp;&nbsp; 
                                        </span>
                                    </th>
                                    <th :style="{color: /*pvis.downloaded?*/ true? 'black' : 'red'}">
                                        {{ pvis.participant_id }}
                                    </th>
                                    <td>
                                        <message-schedule 
                                        :participant_id="pvis.participant_id" 
                                        :dashboard_code="pvis.dashboard_code"
                                        :phone_number="pvis.phone_number"
                                        />
                                    </td>
                                    <td>
                                        <v-btn @click="show_dropout_dialog(pvis.participant_id)" >
                                            Dropout participant {{ pvis.participant_id }}
                                        </v-btn>
                                    </td>
                                    <td v-for="phase, i in phase_ids">
                                        <template v-for="visit in pvis.scheduled?.[i]?.visits">
                                            <ViewVisit
                                            :participant_id="pvis.participant_id"
                                            :my="visit"
                                            />
                                        </template>
                                    </td>
                                    <td>
                                         <ViewVisit
                                            v-for="visit in pvis.self_initiated || []"
                                            :participant_id="pvis.participant_id"
                                            :my="visit"
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </v-table>
                        <v-progress-circular indeterminate v-else/>
                    </v-list-item>
                </v-list>
            </template>
        </j-tabs>
        <h2 v-else>
            You must create a schedule prototype before viewing uploaded results.
        </h2>
    </template>
    <v-progress-circular indeterminate v-else/>
    <v-dialog v-model="dialog_open">
        <v-card>
            <v-card-title>Download ready</v-card-title>
            <v-card-text><a :href="download_url" :download="download_name">{{ download_name }}</a></v-card-text>
            <v-card-actions>
                <v-btn @click="dialog_open=false">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
    <!--<v-btn @click="download_csv_data" v-if="current_schedule_prototype_id">Download only csv survey data for study {{ current_schedule_prototype_id }}</v-btn>-->
    <!--<v-btn @click="download_study_data" v-if="current_schedule_prototype_id">Download data for study {{ current_schedule_prototype_id }}</v-btn>-->
    <!--<v-btn @click="download_project_data">Download all data for project {{ project }}</v-btn>-->
    <v-dialog v-model="dropout_dialog">
        <v-card>
            <v-card-title>Dropout or Flag participants</v-card-title>
            <v-card-text>
                <div v-if="!specify_gamer">
                    <label>Mark dropout<input type="checkbox" v-model="specify_dropout"/></label>
                </div>
                <div v-if="!specify_dropout">
                    <label>Flag as gamer<input type="checkbox" v-model="specify_gamer"/></label>
                </div>
                <div v-if="specify_dropout">
                    <v-combobox label="Reason for dropout"  :items="dropout_reasons" v-model="specify_dropout_reason"/>
                </div>
                <div v-if="specify_gamer">
                    <v-combobox label="Reason flagged as a gamer" :items="gamer_reasons"  v-model="specify_gamer_reason"/>
                </div>
            </v-card-text>
            <v-card-actions>
                <v-btn @click="close_dropout_dialog">Close</v-btn>
                <j-btn v-if="specify_dropout && specify_dropout_reason" :click="dropout_participant" :arg0="[participant_to_flag!, specify_dropout_reason]">Mark as dropout</j-btn>
                <j-btn v-if="specify_gamer && specify_gamer_reason" :click="flag_gamer" :arg0="[participant_to_flag!, specify_gamer_reason]">Flag as gamer</j-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script setup lang=ts>

import {inject, ref, type Ref, computed, watch, provide} from 'vue'
import { 
    schedule_prototype_list_key, project_key, test_prototypes_key, response_stimuli_key,
    close_all_key, phase_ids_key, current_schedule_prototype_key
 } from '@/injectkeys'
import ViewVisit from './ViewVisit.vue'
import MessageSchedule from './MessageSchedule.vue'

import JTabs from '../JTabs.vue'
import JBtn from '../JBtn.vue'
import PhaseHeaders from './PhaseHeaders.vue'
import type { StimulusResult, Visit, ScheduledResponse, ScheduledVisit,SelfInitiatedResponse, SelfInitiatedVisit, StimulusType} from '@/types/schedule'
import { get_unique_stimuli, type ParticipantPhase} from './dashboard_logic'




const ready = ref(false)


const schedule_prototypes = inject(schedule_prototype_list_key)!
const can_display = computed(()=>schedule_prototypes.value.length>0)

const test_prototypes = inject(test_prototypes_key)!
const project = inject(project_key)!

const schedule_prototype_ids = computed(()=>
    schedule_prototypes.value.map(s => s.schedule_id)
)
const current_schedule_prototype_id = ref(schedule_prototypes.value?.[0]?.schedule_id)
const current_schedule_prototype = computed(()=>
    schedule_prototypes.value.filter(s => s.schedule_id === current_schedule_prototype_id.value)[0]
)
provide(current_schedule_prototype_key, current_schedule_prototype)
const dropout_dialog = ref(false)


type SelfInitiatedSummary = {
    stimulus_id: string,
    count:number
}[]

const self_initiated_summary = ref<SelfInitiatedSummary|null>()


type PerStimulusSummary = {
    percent_complete: number
    percent_missing: number
    phase_id?: string
    stimulus_id: string
    total_complete: number
    total_due: number
    total_missing: number
    total_scheduled: number
}[]
const per_stimulus_summary = ref<PerStimulusSummary|null>()

type DashboardSummary = {
    percent_complete: number
    percent_issues: number
    percent_missing: number
    phase?: string
    total_complete: number
    total_dropout: number
    total_due: number
    total_issues: number
    total_missing: number
    total_scheduled: number
}[]
const dashboard_summary = ref<DashboardSummary|null>()
const dashboard_total_summary = computed(()=>{
    if (dashboard_summary.value){
        for (const ds of dashboard_summary.value){
            if (! ds.phase){
                return ds
            }
        }
    }
})
const phase_ids = computed(()=>{
    const retval: string[] = []
    if (dashboard_summary.value){
        for (const ds of dashboard_summary.value){
            if ( ds.phase){
                retval.push(ds.phase)
            }
        }
    }
    console.log('phase ids', retval)
    return retval
})
provide(phase_ids_key, phase_ids)







const participant_to_flag = ref<string|null>()
const specify_dropout = ref<boolean>(false)
const specify_gamer = ref<boolean>(false)
const specify_dropout_reason = ref<string>('')
const specify_gamer_reason = ref<string>('')
function show_dropout_dialog(participant_id: string){
    participant_to_flag.value = participant_id
    specify_dropout.value = false
    specify_gamer.value = false
    specify_dropout_reason.value = ''
    specify_gamer_reason.value = ''
    dropout_dialog.value = true
}
function close_dropout_dialog(){
    participant_to_flag.value = null
    dropout_dialog.value = false
    specify_dropout.value = false
    specify_gamer.value = false
    specify_dropout_reason.value = ''
    specify_gamer_reason.value = ''

}

const scheduled_stimuli = computed(()=>{
    const r = new Set<string>()
    if (per_stimulus_summary.value){
        for (const pss of per_stimulus_summary.value){
            if (!pss.stimulus_id){continue}
            r.add(pss.stimulus_id)
        }
    }
    const retval =  Array.from(r.keys())
    return retval
})

const unique_stimuli = computed(()=>
    get_unique_stimuli(test_prototypes.value, current_schedule_prototype.value)
)

const td_span = computed(()=>phase_ids.value.length + 2)

const active_page = ref(-1)
watch(active_page, (newNo) =>{
    if (newNo >= 0){
        get_participant_page_data(newNo)
    }
})


const default_stimuli = computed(()=>{
    const x = current_schedule_prototype.value.default_selection
    if (x){
        if (x.type==='fixed'){
            return test_prototypes.value.filter( tp =>
            tp.id === x.test_prototype_id
            )[0].response_stimuli
        } else if (x.type==='random' || x.type==='choose'){
            const retval: Map<string,{
                id: string;
                    type: StimulusType;
            }> = new Map()
            test_prototypes.value.filter( tp =>
                x.test_prototype_ids.includes(tp.id)
            ).forEach(ttp => ttp.response_stimuli.forEach(rr => retval.set(rr.id, rr)))
            return Array.from(retval.values())
        } else{
            return []
        }
    } else{
        return []
    }
})

const all_stimuli = computed(()=>
    new Map([...unique_stimuli.value, ...default_stimuli.value].map(
        s => [s.id, s]
    ))
)

provide(response_stimuli_key, all_stimuli)





type AllParticipantData = {
    scheduled:{
        phase:string,
        visits: ScheduledVisit[]
    }[]
    participant_id: string
    dashboard_code: string
    downloaded: boolean
    dropout: boolean
    self_initiated: ScheduledVisit[]
    phone_number: string,
    gamer?: boolean,
    dropout_reason?: string,
    gamer_reason?: string,

}[]
const all_participant_data = ref<AllParticipantData>([])



const participant_ids = ref<string[]>([])

const data: Ref<StimulusResult<'parsed'>[]> = ref([])
async function get_data(){
    ready.value=false
    await fetch('/salsa/server/api/get-self-initiated-summary?' + 
        new URLSearchParams({
            project: project,
            schedule_prototype_id: current_schedule_prototype_id.value
        })
    ).then(
        r => r.json()
    ).then(
        s => self_initiated_summary.value = s
    )
    await fetch('/salsa/server/api/get-per-stimulus-summary?' + 
        new URLSearchParams({
            project: project,
            schedule_prototype_id: current_schedule_prototype_id.value
        })
    ).then(
        r => r.json()
    ).then(
        s => per_stimulus_summary.value = s
    )
    await fetch('/salsa/server/api/get-dashboard-summary?' + 
        new URLSearchParams({
            project: project,
            schedule_prototype_id: current_schedule_prototype_id.value
        })
    ).then(
        r => r.json()
    ).then(
        s => dashboard_summary.value = s
    )
    await fetch('/salsa/server/api/participant-query?' + new URLSearchParams({
        project: project,
        schedule_prototype_id: current_schedule_prototype_id.value,
        dropout:'false'})
    ).then(
        r => r.json()
    ).then(s =>{
        participant_ids.value = s
        active_participant_total.value = s.length
        }
    )
    await fetch('/salsa/server/api/participant-query?' + new URLSearchParams({
        project: project,
        schedule_prototype_id: current_schedule_prototype_id.value,
        dropout:'true'})
    ).then(
        r => r.json()
    ).then(s =>{
        dropout_participant_total.value = s.length
        }
    )
    ready.value = true
}
get_data()
watch(current_schedule_prototype, ()=>{
    if (current_schedule_prototype.value.schedule_id){
        get_data()
    }
})

const active_participant_total = ref<number>(0)
const dropout_participant_total = ref<number>(0)




const phasesToInclude = ref<Map<ParticipantPhase, boolean>>(new Map())


const perfect_percent = ref<number>(50)
const submitted_percent = ref<number>(50)
const perfect_gt = ref(true)
const submitted_gt = ref(true)
const slider_panel = ref<number|null>()
const greater_panel = ref<'participant_id'|'dashboard_code'|'filters'>('participant_id')
watch(greater_panel, () => {
    reset_filters()
    dashboard_code.value = ''
    participant_id.value = ''
})

function enforce_perfect_submitted_invariants(){
    const p_p = perfect_percent.value
    const s_p = submitted_percent.value
    if (s_p! < p_p!){
        submitted_percent.value = perfect_percent.value
    }
}
watch(perfect_percent, ()=>enforce_perfect_submitted_invariants())
watch(submitted_percent, ()=>enforce_perfect_submitted_invariants())




const before_phase = ref<string|null>()
const after_phase = ref<string|null>()
const dropout = ref<boolean>(false)
const downloaded = ref<boolean|null>()
const suspect = ref<boolean|null>()
const gamer = ref<boolean|null>()
const dropout_reason = ref<string|null>()
const dropout_reasons = ['Scheduled exit', 'Salsa technical issue', 'Loss to follow up',
    'Participant withdrawal', 'Investigator decision', 'Inappropriate enrollment',
    'Early study closure', 'Death', 'Other'
]
const gamer_reasons = ['Misaligning Data (i.e., zipcode, birthdate)', 'IP Risk Score', 
    'Failed Duplicate Check', 'Other'
]
const gamer_reason = ref<string|null>()
const imminent = ref<boolean|null>()
const missing_3 = ref<boolean|null>()
function reset_filters(){
    slider_panel.value = null
    perfect_percent.value = 50
    submitted_percent.value = 50
    perfect_gt.value = true
    submitted_gt.value = true
    before_phase.value = null
    after_phase.value = null
    dropout.value = false
    downloaded.value = null
    imminent.value = null
    missing_3.value = null
    gamer.value = null
    gamer_reason.value = null
    dropout_reason.value = null
}
const participant_id = ref('')
const dashboard_code = ref('')
const pages = computed(()=>{
    if (participant_ids.value){
        return Math.ceil(participant_ids.value.length / 20)
    } else{
        return 0
    }
})

const participant_pages_ready = ref(true)
async function query_participant_ids(){
    participant_pages_ready.value = false
    const urlParamsInit:{
        [key:string]:(number|string|boolean)
    } = {
        project:project,
        schedule_prototype_id:current_schedule_prototype_id.value
    }
    let min_perfect = null
    let max_perfect = null
    let min_submitted = null
    let max_submitted = null

    if (slider_panel.value){
        if (perfect_gt.value){
            min_perfect = perfect_percent.value
            max_perfect = 100
        } else{
            min_perfect = 0
            max_perfect = perfect_percent.value
        }
        if (submitted_gt.value){
            min_submitted = submitted_percent.value
            max_submitted = 100
        } else{
            min_submitted = 0
            max_submitted = submitted_percent.value
        }
    } 
    
    const vals: [string, 
        string|number|boolean|null|undefined
][] = [
        ['min_perfect', min_perfect], 
        ['max_perfect', max_perfect], 
        ['min_submitted', min_submitted], 
        ['max_submitted', max_submitted],
        ['before_phase', before_phase.value], 
        ['after_phase', after_phase.value], 
        ['dropout', (() => {
            if (participant_id.value || dashboard_code.value || gamer.value){
                return null
            } else if (dropout.value === null || dropout.value === undefined){
                return false
            } else{
                return dropout.value
            }
        })()], 
        ['gamer', (() => {
            if (participant_id.value || dashboard_code.value || dropout.value){
                return null
            } else if (gamer.value === null || gamer.value === undefined){
                return false
            } else{
                return gamer.value
            }
        })()], 
        ['dropout_reason', dropout_reason.value],
        ['gamer_reason', gamer_reason.value],
        ['downloaded', downloaded.value], 
        ['imminent', imminent.value],
        ['missing_3', missing_3.value],
        ['participant_id', participant_id.value],
        ['dashboard_code', dashboard_code.value],
        ['suspect', suspect.value],
    ]
    for (let [name, vval] of vals){
        if (name === 'participant_id' && vval === ''){
            vval = null
        }
        if (name === 'dashboard_code' && vval === ''){
            vval = null
        }
        if (name === 'gamer' && vval === ''){
            vval = null
        }
        if (name === 'dropout_reason' && vval === ''){
            vval = null
        }
        if (name === 'gamer_reason' && vval === ''){
            vval = null
        }
        if (name === 'suspect' && vval === false){
            vval = null
        }
        if (name === 'downloaded' && vval === true){
            vval = false
        }

       if (!(vval === null || vval === undefined)){
            urlParamsInit[name] = vval
       }
    }

    //@ts-expect-error
    const urlParamString = new URLSearchParams(urlParamsInit)
    fetch('/salsa/server/api/participant-query?' + urlParamString).then(
        r => r.json()
    ).then(
        s => {
            all_participant_data.value = []
            participant_ids.value = s
            participant_pages_ready.value = true
            active_page.value = 0
        }
    )
}

const participant_bubbles_ready = ref(true)
async function get_participant_page_data(page:number){
    participant_bubbles_ready.value = false
    const begin_point = (page-1) * 20
    const end_point = (page) * 20
    const this_pages_participant_ids = participant_ids.value.slice(begin_point, end_point)
    await fetch('/salsa/server/api/get-dashboard2-data?' + new URLSearchParams({
        project: project,
        schedule_prototype_id: current_schedule_prototype_id.value,
        participant_ids: JSON.stringify(this_pages_participant_ids)
    })).then(
        r => r.json()
    ).then(
        s => {
            all_participant_data.value = s
            participant_bubbles_ready.value = true
        }
    )
}























const dialog_open = ref(false)
const download_url = ref('')
const download_name = ref('')



async function download_participant_data(participant_id:string){
    const resp =  (await (
        await fetch(`/salsa/server/get-participant-zip?${new URLSearchParams({participant_id})}`)
    ).blob())
    download_url.value = URL.createObjectURL(resp)
    download_name.value = `${participant_id}.zip`
    dialog_open.value=true
}

async function download_csv_data(){
    const resp =  (await (
        await fetch(`/salsa/server/get-schedule-csv?${new URLSearchParams({
            project,
            schedule_prototype_id: current_schedule_prototype_id.value
        })}`)
    ).blob())
    download_url.value = URL.createObjectURL(resp)
    download_name.value = `${current_schedule_prototype_id.value}.zip`
    dialog_open.value=true
}

async function download_study_data(){
    const resp =  (await (
        await fetch(`/salsa/server/get-study-zip?${new URLSearchParams({
            project,
            schedule_prototype_id: current_schedule_prototype_id.value
        })}`)
    ).blob())
    download_url.value = URL.createObjectURL(resp)
    download_name.value = `${current_schedule_prototype_id.value}.zip`
    dialog_open.value=true
}

async function download_project_data(){
    const resp =  (await (
        await fetch(`/salsa/server/get-project-zip?${new URLSearchParams({project})}`)
    ).blob())
    download_url.value = URL.createObjectURL(resp)
    download_name.value = `${project}.zip`
    dialog_open.value=true
}

async function dropout_participant(arg0: [string, string]): Promise<Response>{
    const [id, reason] = arg0
    const proceed = confirm(`Are you sure you want to drop out participant ${id}`)
    //@ts-expect-error
    if (!proceed){return}
    const retval =  fetch('/salsa/server/api/drop-participant?' + new URLSearchParams({id, reason}),{method:'PATCH'})
    retval.then(r => {
        if (r.status===200){
            alert(`Participant ${id} dropped out succesfully! Please reload webpage`)
        }
    })
    return retval
}

async function flag_gamer(arg0: [string, string]): Promise<Response>{
    const [id, reason] = arg0
    const proceed = confirm(`Are you sure you want to drop out participant ${id}`)
    //@ts-expect-error
    if (!proceed){return}
    const retval =  fetch('/salsa/server/api/flag-gamer?' + new URLSearchParams({id, reason}),{method:'PATCH'})
    retval.then(r => {
        if (r.status===200){
            alert(`Participant ${id} flagged out succesfully! Please reload webpage`)
        }
    })
    return retval
}

const emergency_sms = ref('')
function send_emergency_sms(arg0:null){
    const proceed = confirm(`Are you sure you want to send to all participants this message: ${emergency_sms.value}`)
    if (proceed){
        const fetchval =  fetch('/salsa/server/api/send-emergency-sms?' + new URLSearchParams({
        project,
        schedule_prototype_id: current_schedule_prototype_id.value,
        message: emergency_sms.value
    }), {method:'POST'})
    return fetchval
    }
    else return new Promise(()=>{}) as Promise<Response>

}
function refresh_views(arg0:null){
    const fetchval =  fetch('/salsa/server/refresh')
    return fetchval
}

</script>
<style>
.blank_row_before {
    border-top:10px solid #FFFFFF;
}
.j-dashboard-table th
.j-dashboard-table td  {
    text-align: left;
}
.j-download{
    color: blue;
    text-decoration: underline;
    cursor:pointer;
}
.j-download-empty{
    color: grey;
    text-decoration: underline;
}
.j-dashboard-gt{
    border: 3px solid white;
    &:hover{
        border: 3px inset black;
    }
}

</style>