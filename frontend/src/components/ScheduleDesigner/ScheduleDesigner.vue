<template>
    <j-breadcrumbs 
        v-if="can_display"
        :tabnames="['metadata', 'phases', 'submit']" 
        :enableds="enableds">
        <template #header_metadata>
            Configuration
        </template>
        <template #content_metadata>
            <v-card>
                <v-card-text>
                    <v-form>
                        <v-text-field
                            style="width: 30vw;"
                            density="compact" v-model="my.schedule_id" label="Enter Longitudinal study name"/>
                        <v-select
                            style="width: 30vw;"
                        density="compact" :items="[twilio_nicknames]" label="Select twilio config nickname" v-model="my.twilio_info"/>
                    </v-form>
                </v-card-text>
            </v-card>
            <v-card>
                <v-card-title>
                    Schedule level defaults
                </v-card-title>
                <v-card-text>
                    <prototype-selection
                        :level="'base'"
                        :parent_phase="undefined"
                        :my="my"
                        :parent_schedule="undefined"
                    />
                    <timing-selection
                        :level="'base'"
                        :parent_phase="undefined"
                        :my="my"
                        :parent_schedule="undefined"
                    />
                    <message
                        level="base"
                        :my="my.associated_messages"
                    />
                    <br/>
                    <j-tooltip>
                                        
                        <p>
                            By default Salsa will not show anything if a participant
                            tries to use it on an unscheduled day.
                        </p>
                        <p>
                            Use this option if you want to want them to access
                            a default test prototype instead.
                        </p>
                    </j-tooltip>
                    <v-btn v-if="!my.default_selection"
                        @click="my.default_selection={type:'fixed', test_prototype_id:''}"
                        >Specify ad lib tests</v-btn>
                    <template v-if="my.default_selection">
                        <v-btn @click="my.default_selection=undefined">Remove ad lib tests</v-btn>
                        <v-select
                            label="Ad lib test type"
                            :items="[
                            {
                                title:'Give participant a group of ad lib tests that they may choose from',
                                value:'choose'
                            }]"
                            @update:model-value="(e) => set_default(e)"
                        />
                        <v-select v-if="my.default_selection.type==='fixed'"
                            :items="test_prototype_ids"
                            label="test prototype id"
                            v-model="my.default_selection.test_prototype_id"
                        />
                        <v-select v-else-if="my.default_selection.type==='choose'"
                            :items="groups"
                            label="test prototype group name"
                            v-model="my.default_selection.group"
                        />
                    </template>
                    <br/>
                </v-card-text>
            </v-card>
        </template>
        <template #header_phases>
            Specify Phases
        </template>
        <template #content_phases>
            <j-list :items=my.phases :fixed_order="true">
                <template #preamble>
                    Phases
                </template>
                <template #renderer="{item:phase}">
                    <div class="j_icont">
                        <div class="j_imain">
                            <!--@vue-ignore-->
                            <j-list 
                                :fixed_order="true"
                                :items="phase.spec.tests" 
                            >
                                <template #preamble>
                                    <h2>Test dates ({{ phase.spec.cadence }})</h2>
                                </template>
                                <template #renderer="{item:test, idx}">
                                    <v-card variant="outlined">
                                            <v-card-text>
                                                <template v-if="phase.spec.cadence==='daily'">
                                                    Years after startdate: <v-number-input control-variant="stacked" density="compact"  :step="1" :min="0" v-model="phase.spec.tests[idx].datetime.year"/><br>
                                                    Days after startdate: <v-number-input control-variant="stacked" density="compact"  :step="1" :min="0" v-model="phase.spec.tests[idx].datetime.day"/><br>
                                                </template>
                                                <template v-else-if="phase.spec.cadence==='weekly'">
                                                    Weeks after startdate: <v-number-input control-variant="stacked" density="compact"  :step="1" :min="0" v-model="phase.spec.tests[idx].datetime.week"/>
                                                    Weekday: <v-select
                                                        :items="weekday_items"
                                                        item-title="title"
                                                        item-value="value"
                                                        v-model="phase.spec.tests[idx].datetime.weekday"
                                                    /><br>
                                                </template>

                                                </v-card-text>
                                        </v-card>
                                        <prototype-selection 
                                                    :level="'entry'" 
                                                    :my="phase.spec.tests[idx]"
                                                    :parent_phase="phase"
                                                    :parent_schedule="my"
                                                />
                                        <timing-selection 
                                            :level="'entry'" 
                                            :my="phase.spec.tests[idx]"
                                            :parent_phase="phase"
                                            :parent_schedule="my"
                                        />
                                        <message
                                            level="entry"
                                            :my="phase.spec.tests[idx].associated_messages"
                                        />
                                </template>
                                <template #postamble>
                                    <v-card>
                                        <v-card-title>
                                            Phase level defaults
                                        </v-card-title>
                                        <v-card-text>
                                            <prototype-selection
                                                    :level="'phase'"
                                                    :parent_phase="undefined"
                                                    :my="phase"
                                                    :parent_schedule="my"
                                                />
                                            <timing-selection
                                                    :level="'phase'"
                                                    :parent_phase="undefined"
                                                    :my="phase.spec"
                                                    :parent_schedule="my"
                                                />
                                            <message
                                                level="phase"
                                                :my="phase.associated_messages"
                                            />
                                        </v-card-text>
                                    </v-card>
                                    <v-btn @click="add_test(phase.spec)">Add a new testdate</v-btn>
                                    <div class="j_idelete">
                                        <v-btn @click="delete_phase(phase)">Delete phase</v-btn>
                                    </div>
                                </template>
                            </j-list>
                        </div> 
                    </div>
                </template>
                <template #postamble>
                    <v-card variant="outlined">
                        <v-select label="Phase schedule type" :items="['weekly', 'daily']" v-model="phase_schedule_type"/>
                        <j-tooltip >
                            <p>
                                The "daily" option allows you to specify how many days and years
                                after the participant's start date each test prototype should be scheduled.
                            </p>
                            <p>
                                The "weekly" option allows you to specify on which week day and how many weeks
                                after the participant's start date each test prototype should be scheduled.
                            </p>
                        </j-tooltip>
                        <v-btn @click="add_phase">Add a new phase</v-btn>
                    </v-card>
                </template>
            </j-list>
        </template>
        <template #header_submit>
            Preview and submit
        </template>
        <template #content_submit>
            <v-container fluid>
                <v-row>
                    <v-col :cols="12" :lg="9">
                        <v-card variant="outlined">
                            <v-card-title>
                                Select sample start date below to view a preview of the schedule
                            </v-card-title>
                            <v-card-text>
                                <date-picker
                                    v-model="sample_startdate"
                                    :attributes="preview_events"
                                    style="margin: 20px;"
                                    :select-attribute="{dot:true}"
                                    :rows="3"
                                    :columns="4"/>
                            </v-card-text>
                            <v-card-actions>
                            </v-card-actions>
                        </v-card>
                    </v-col>
                    <v-col :cols="12" :lg="3">
                        <v-btn @click="generate_preview()">Generate preview schedule</v-btn>
                        <br/>
                        <j-btn :click="upload_schedule" :arg0="undefined" >Upload schedule</j-btn>
                    </v-col>
                </v-row>
            </v-container>
        </template>
    </j-breadcrumbs>
    <h2 v-else>
        You must create test prototypes before designing a longitudinal study
    </h2>
</template>
<script setup lang="ts">
import type {PhaseSpec, SchedulePrototype} from 'src/types/schedule'
import {VNumberInput} from 'vuetify/labs/components'
import {DatePicker } from 'v-calendar'
import PrototypeSelection from './PrototypeSelection.vue'
import Message from './Message.vue'
import TimingSelection from './TimingSelection.vue'
import {ref, type Ref, computed, inject} from 'vue'
import { prepare_schedule_for_participant,
    prepare_schedule_for_upload,
 } from './schedule_logic'
import { test_prototypes_key, twilio_key, project_key, reload_schedule_prototypes_key, schedule_prototype_list_key, groups_key } from '@/injectkeys'
import JBtn from '../JBtn.vue'
import JBreadcrumbs from '../JBreadcrumbs.vue'
import JList from '../JList.vue'
import JTooltip from '../JTooltip.vue'

const test_prototypes = inject(test_prototypes_key)!
const test_prototype_ids = computed(()=>test_prototypes.value.map(tp=>tp.id))
const twilios = inject(twilio_key)!
const twilio_nicknames = computed(()=>twilios.value.map(t=>t.nickname))
const project = inject(project_key)!
const reload_schedules = inject(reload_schedule_prototypes_key)!
const groups = inject(groups_key)!


const sample_startdate = ref(new Date())
const schedule_prototypes = inject(schedule_prototype_list_key)!

const can_display = computed(()=>test_prototypes.value.length>0)

const phase_schedule_type: Ref<'daily'|'weekly'> = ref('weekly')





const my: Ref<SchedulePrototype<'website'>> = ref({
    schedule_id:'',
    phases:[],
    twilio_info:'',
    participant_timezone:undefined,
    allow_unscheduled:true,
    default_results:undefined,
    prototype_selection:undefined,
    participant_id:undefined,
    associated_messages:{type:'none'}
})



function set_default(type:('fixed'|'random'|'choose')){
    if (type==='fixed'){
        my.value.default_selection = {
            type:'fixed',
            test_prototype_id:''
        }
    }
    else if (type==='random'){
        my.value.default_selection = {
            type:'random',
            group:''
        }
    }
    else if (type==='choose'){
        my.value.default_selection = {
            type:'choose',
            group:''
        }
    }
}

const preview_schedule: Ref<SchedulePrototype<'device'>|undefined> = ref() 
const preview_events = computed(()=>{
    if (preview_schedule.value){
        const retval: {popover:{label:string}, dates:Date, highlight:{style:{backgroundColor:string}}}[] = []
        for (const phase of preview_schedule.value.phases){
            for (const test of phase.spec.tests){
                console.log(phase.spec.tests)
                const [date_s, time_s, ] = test.formal_timestamp.split(' ')
                const [hour_i, minute_i] = time_s.split(':').map(s => parseInt(s))
                const [year_i, month_i, day_i] = date_s.split('/').map(s => parseInt(s))
                const calendar_date = new Date(year_i, month_i-1, day_i, hour_i, minute_i)
                retval.push({
                    highlight: {
                        style:{
                            backgroundColor:test_prototype_color_map[test.prototype_selection.test_prototype_id]
                        }
                    } ,
                    dates:calendar_date,
                    popover:{label:`${calendar_date.toLocaleTimeString(navigator.language, {hour12:true, hour: '2-digit', minute:'2-digit'})} - ${test.prototype_selection.test_prototype_id}`},
                })
            }
        } 
        console.log('events', retval)
        return retval
    }
})

const unique_id = function*(){
    let i = 1
    while (true){
        yield i
        i += 1
    }
}()

function add_test(spec: PhaseSpec<'website'>){
    if (spec.cadence === 'daily'){
        const t = spec.tests[spec.tests.length-1]
        if (t) {
            spec.tests.push({
                datetime:{
                    year: t.datetime.year,
                    day: t.datetime.day+1
                },
                timing: {...t.timing},
                prototype_selection:{...t.prototype_selection},
                sequence_no:undefined,
                associated_messages:{type:'inherit'}
            })
        }else{
            spec.tests.push({
                datetime:{
                    year: 0,
                    day: 1
                },
                timing: {
                    type:'inherit'
                },
                prototype_selection:{type:'inherit'},
                sequence_no:undefined,
                associated_messages:{type:'inherit'}
            })
        }
    } else if (spec.cadence === 'weekly'){
        const t = spec.tests[spec.tests.length-1]
        if (t) {
            spec.tests.push({
                datetime:{
                    week: t.datetime.week+1,
                    weekday: t.datetime.weekday
                },
                prototype_selection:{...t.prototype_selection},
                timing: {...t.timing},
                sequence_no:undefined,
                associated_messages:{type:'inherit'}

            })
        }else{
            spec.tests.push({
                datetime:{
                    week: 1,
                    weekday: 1
                },
                timing: {
                    type:'inherit'            
                },
                prototype_selection:{type:'inherit'},
                sequence_no:undefined,
                associated_messages:{type:'inherit'}

            })
        }
    }
}


function add_phase(){
    my.value.phases.push({
        id: `phase_${unique_id.next().value}`,
        prototype_selection:undefined,
        associated_messages:{type:'inherit'},
        spec: {
            cadence: phase_schedule_type.value,
            tests:[]
        }
    })
}

function delete_phase(p:SchedulePrototype<'website'>['phases'][number]){
    for (let i = 0; i<my.value.phases.length; i++){
        if (my.value.phases[i].id === p.id){
            my.value.phases.splice(i, 1)
            break
        }
    }
}



function rainbow(numOfSteps:number, step:number) {
    // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
    // Adam Cole, 2011-Sept-14
    // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
    let [r, g, b] = [0,0,0]
    let h = step / numOfSteps
    let i = ~~(h * 6)
    let f = h * 6 - i
    let q = 1 - f
    switch(i % 6){
        case 0: r = 1; g = f; b = 0; break
        case 1: r = q; g = 1; b = 0; break
        case 2: r = 0; g = 1; b = f; break
        case 3: r = 0; g = q; b = 1; break
        case 4: r = f; g = 0; b = 1; break
        case 5: r = 1; g = 0; b = q; break
    }
    let c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2)
    return (c)
}

const test_prototype_color_map = Object.fromEntries(test_prototype_ids.value.map( (tpid,i) => [tpid, rainbow(test_prototype_ids.value.length, i)]))

function generate_preview(){
    console.log(my)
    const intermediate = prepare_schedule_for_upload(
            my.value,
            test_prototypes
        )
    console.log('intermediate', intermediate)
    preview_schedule.value=prepare_schedule_for_participant(
        intermediate, test_prototypes, sample_startdate.value, 'test_participant', 'America/Chicago'
    )
    console.log(preview_schedule.value)
}

function upload_schedule(){
    const body = prepare_schedule_for_upload(
        my.value, 
        test_prototypes
    )
    const retval = fetch('/salsa/server/api/add-schedule?' + new URLSearchParams({
            id: my.value.schedule_id,
            project: project
        }),
        {
            method:'POST',
            body:JSON.stringify(body)
        }
    )
    retval.then(r=>reload_schedules())
    return retval
}

const schedule_prototype_id_ready = computed(()=>{
    return Boolean(my.value.schedule_id) && !(schedule_prototypes.value.map(s => s.schedule_id).includes(my.value.schedule_id))
})

const phases_ready = computed(()=>{
    const phases = my.value.phases
    return phases.length > 0 && phases.every(p=> p.spec.tests.length>0)
})

const enableds = [schedule_prototype_id_ready, ref(true), ref(true)]

const weekday_items = [{
    title:'Sunday',
    value:0
},{
    title:'Monday',
    value:1
},{
    title:'Tuesday',
    value:2
},{
    title:'Wednesday',
    value:3
},{
    title:'Thursday',
    value:4
},{
    title:'Friday',
    value:5
},{
    title:'Saturday',
    value:6
}]
function get_weekday(n:number):string{
    return weekday_items.filter(i => i.value===n)[0].title
}

function test_render_daily(t:SchedulePrototype<'website'>['phases'][number]['spec']['tests'][number]){
    //@ts-ignore-error
    return `Year: ${t.datetime.year!} Day: ${t.datetime.day!}`
}
function test_render_weekly(t:SchedulePrototype<'website'>['phases'][number]['spec']['tests'][number]){
    //@ts-ignore-error
    return `Week: ${t.datetime.week!} Weekday: ${get_weekday(t.datetime.weekday!)}`

}

</script>