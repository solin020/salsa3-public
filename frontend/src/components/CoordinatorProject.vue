<template @schedulecalls="addParticipant(s, e, m, a, ev)">
    <JTabs :tabnames="[
            'dashboard', 
            'addparticipant', 
            'addtestprototype', 
            'viewtestprototypes', 
            'scheduledesigner',
            'twilioinfo']">
        <template #header_dashboard> View participant dashboard</template>
        <template #content_dashboard> 
            <Dashboard/>
        </template>
        <template #header_addparticipant> Add a new participant</template>
        <template #content_addparticipant>  <add-participant/></template>
        <template #header_addtestprototype> Add a new test prototype </template>
        <template #content_addtestprototype> <AddTestPrototype/> </template>
        <template #header_viewtestprototypes> View test prototypes </template>
        <template #content_viewtestprototypes><ViewTestPrototypes/></template>
        <template #header_scheduledesigner>Longitudinal Study Designer</template>
        <template #content_scheduledesigner><ScheduleDesigner/></template>
        <template #header_twilioinfo>Configure Twilio</template>
        <template #content_twilioinfo><Twilio/></template>
    </JTabs>
</template>
<script setup lang="ts">
import AddTestPrototype from '@/components/TestPrototype/Add/AddTestPrototype.vue'
import ViewTestPrototypes from './TestPrototype/View/ViewTestPrototypes.vue'
import ScheduleDesigner from './ScheduleDesigner/ScheduleDesigner.vue'
import AddParticipant from './AddParticipant.vue'
import Twilio from './Twilio.vue'
import JTabs from '@/components/JTabs.vue'
import Dashboard from  '@/components/Dashboard/Dashboard.vue'
import {DefaultService, type Participant as ParticipantType} from '../client'
import {ref, type Ref, provide} from 'vue'
import { reload_participants_key, project_key, 
    participant_list_key, test_prototypes_key, groups_key, reload_groups_key,
    reload_test_prototypes_key, twilio_key, reload_twilio_key,
    schedule_prototype_list_key, reload_schedule_prototypes_key } from '@/injectkeys'
import { type TestPrototypeMeta, type TwilioInfo} from '@/types'
import type { SchedulePrototype } from '@/types/schedule'


interface Props{
    projectname: string
}
const props = defineProps<Props>()

provide(project_key, props.projectname)

const participants: Ref<ParticipantType[]> = ref([]) 
provide(participant_list_key, participants)
function reload_participants() {DefaultService.getParticipantSalsaServerApiGetParticipantsGet(props.projectname).then(
    p => participants.value=p
)}
provide(reload_participants_key, reload_participants)
reload_participants()

const test_prototypes: Ref<TestPrototypeMeta[]> = ref([])
provide(test_prototypes_key, test_prototypes)
function reload_test_prototypes(){
    fetch('/salsa/server/get-test-prototypes?' + new URLSearchParams({project: props.projectname})).then(
        r => r.json()
    ).then(
        r => test_prototypes.value = r 
   )
}
provide(reload_test_prototypes_key, reload_test_prototypes)
reload_test_prototypes()

const groups: Ref<string[]> = ref([])
provide(groups_key, groups)
function reload_groups(){
    fetch('/salsa/server/api/get-groups?' + new URLSearchParams({project: props.projectname})).then(
        r => r.json()
    ).then(
        r => groups.value = r 
   )
}
provide(reload_groups_key, reload_groups)
reload_groups()


const twilio_info: Ref<TwilioInfo[]> = ref([])
provide(twilio_key, twilio_info)
function reload_twilio(){
    fetch('/salsa/server/api/get-twilio-info?' + new URLSearchParams({project: props.projectname})).then(
        r => r.json()
    ).then(
        r => twilio_info.value = r 
   )
}
provide(reload_twilio_key, reload_twilio)
reload_twilio()

const schedule_prototypes: Ref<SchedulePrototype<'database'>[]> = ref([])
provide(schedule_prototype_list_key, schedule_prototypes)
function reload_schedule_prototypes(){
    fetch('/salsa/server/api/get-schedules?' + new URLSearchParams({project:props.projectname})).then(
        r => r.json()
    ).then(
        r => {schedule_prototypes.value = r}
    )
}
provide(reload_schedule_prototypes_key, reload_schedule_prototypes)
reload_schedule_prototypes()




</script>