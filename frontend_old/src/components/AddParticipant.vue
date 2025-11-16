<template>
    <j-breadcrumbs 
        v-if="can_display"
        :tabnames="['metadata','schedule']" :enableds="[ref(true), ref(true)]">
        <template #header_metadata>
            Enter participant information
        </template>
        <template #content_metadata>
            <v-text-field
                style="width: 30vw;"
                :rules="[id_regex_test]" v-model="participant_id" label="Enter participant's login code"/>
            <v-text-field
                style="width: 30vw;"
                v-model="dashboard_code" label="Enter participant's study id (participants will not see this)"/>
            <v-text-field
                style="width: 30vw;"
                v-model="phone_number" label="Enter participant's phone number"/>
            <timezone-selector
                style="width: 30vw;"
                v-model="participant_timezone"/>
            <v-select
                style="width: 30vw;"
                label="Longitudinal study id" :items="schedule_prototype_ids" v-model="schedule_prototype_id"/>
        </template>
        <template #header_schedule>
            Preview schedule and deploy participant
        </template>
        <template #content_schedule>
            <h1>  Select the participant's start date below to view a preview of the participant's schedule before deploying </h1>
            <date-picker
                            v-model="start_date"
                            :attributes="preview_events"
                            :select-attribute="{dot:true}"
                            style="margin: 20px;"
                            :rows="3"
                            :columns="4"/>
            <br/>
            <v-btn @click="view_preview()">Preview participant schedule before deployment</v-btn>
            <br/>
            <j-btn :click="upload_participant" :arg0="undefined" :disabled="!(preview_schedule)">Save participant and deploy schedule</j-btn>
        </template>
    </j-breadcrumbs>
    <h2 v-else>
        You must create a schedule prototype before adding a participant 
    </h2>
</template>
<script setup lang="ts">
import type {SchedulePrototype, Timezone} from '../types/schedule'
import { DatePicker } from 'v-calendar'
import {schedule_prototype_list_key, test_prototypes_key, project_key} from '../injectkeys'
import {inject, ref, type Ref, computed} from 'vue'
import TimezoneSelector from './ScheduleDesigner/TimezoneSelector.vue'
import { prepare_schedule_for_participant } from './ScheduleDesigner/schedule_logic'
import JBtn from './JBtn.vue'
import { id_regex_test } from '@/regexes'
import JBreadcrumbs from './JBreadcrumbs.vue'

const schedule_prototypes = inject(schedule_prototype_list_key)!
const schedule_prototype_ids = computed(()=>schedule_prototypes.value.map(sp=>sp.schedule_id))
const test_prototypes = inject(test_prototypes_key)!
const test_prototype_ids = computed(()=>test_prototypes.value.map(tp=>tp.id))
const project = inject(project_key)!
const can_display = computed(()=>schedule_prototypes.value.length>0)


const participant_id = ref("")
const phone_number = ref("")
const dashboard_code = ref("")
const schedule_prototype_id = ref("")
const start_date = ref(new Date())
const participant_timezone = ref<Timezone>()



const schedule_prototype = computed(()=>schedule_prototypes.value.filter(sp=>
    sp.schedule_id==schedule_prototype_id.value
)[0])
const test_prototype_color_map = Object.fromEntries(test_prototype_ids.value.map( (tpid,i) => [tpid, rainbow(test_prototype_ids.value.length, i)]))

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
function view_preview(){
    if (!(participant_timezone.value)){
        alert('Please go back and set participant timezone')
    } else{
        preview_schedule.value = prepare_schedule_for_participant(
            schedule_prototype.value,
            test_prototypes,
            start_date.value,
            participant_id.value,
            participant_timezone.value
        )
    }
}

function upload_participant():Promise<Response>{
    if (!(participant_timezone.value)){
        alert('Please go back and set participant timezone')
        //@ts-ignore
        return undefined
    } else{
        const retval = fetch('/salsa/server/api/add-participant?' + new URLSearchParams({
                id: participant_id.value,
                project,
                phone_number: phone_number.value,
                schedule_prototype_id: preview_schedule.value!.schedule_id,
                twilio_nickname: schedule_prototype.value!.twilio_info,
                dashboard_code: dashboard_code.value,
                timezone:participant_timezone.value,
            }), {method:'POST', body: JSON.stringify(preview_schedule.value)})
        retval.then(r => {
            if (r.status===200){
                alert(`Participant ${participant_id.value} uploaded succesfully!`)
                participant_id.value=''
                phone_number.value=''
            }
        })
        return retval
    }

}


</script>