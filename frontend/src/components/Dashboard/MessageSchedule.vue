<template>
    <span 
        ref="parent_span"
        :style="{
            'background-color':'white',
            'border': '2px solid black',
            'font-size': '12pt'
        }">
        📝
            <v-overlay
                location-strategy="static"
                activator="parent"
                v-model="details_open"
            >
            <v-btn @click.stop="close()">Close</v-btn>
            <v-expansion-panels>
                <v-expansion-panel title="Edit participant's study code?">
                    <v-expansion-panel-text>
                        <v-card class="j-schedulecard">
                            <v-card-title>Login code: {{ props.participant_id }} Study code: {{props.dashboard_code}}</v-card-title>
                            <v-list>
                                <v-list-item>
                                    <v-text-field v-model="new_dashboard_code" label="New study code"/>
                                </v-list-item>
                                <v-list-item>
                                    <j-btn :click="update_dashboard_code" :arg0="null">Update study code</j-btn>
                                </v-list-item>
                            </v-list>
                        </v-card>
                    </v-expansion-panel-text>
                </v-expansion-panel>
                <v-expansion-panel title="Edit participant's phone number?">
                    <v-expansion-panel-text>
                        <v-card class="j-schedulecard">
                            <v-card-title>Login code: {{ props.participant_id }} Current Phone Number: {{props.phone_number}}</v-card-title>
                            <v-list>
                                <v-list-item>
                                    <v-text-field v-model="new_phone_number" label="New phone number"/>
                                </v-list-item>
                                <v-list-item>
                                    <j-btn :click="update_phone_number" :arg0="null">Update phone number</j-btn>
                                </v-list-item>
                            </v-list>
                        </v-card>
                    </v-expansion-panel-text>
                </v-expansion-panel>
                <v-expansion-panel title="Edit participant's timezone?">
                        <v-expansion-panel-text>
                            <v-card class="j-schedulecard">
                                    <v-card-title>Text Message Schedule for {{ props.participant_id }}</v-card-title>
                                    <v-card-title>Current Timezone: {{tz_dict.get(old_timezone!) }}</v-card-title>
                                    <v-card-subtitle>
                                        New Timezone: <timezone-selector
                                            style="width: 30vw;"
                                            v-model="timezone"/>
                                    </v-card-subtitle>
                                    <v-card-subtitle>
                                        <j-btn :click="update_timezone" :arg0="undefined">Update Participant Timezone</j-btn>
                                    </v-card-subtitle>
                                    <v-list>
                                        <v-table>
                                            <thead>
                                                <tr>
                                                    <th>Intended clock time on device</th>
                                                    <th>Time the message will be sent in Universal Time (Greenwich mean)</th>
                                                    <th>Message</th>
                                                    <th>Message send condition</th>
                                                    <th>Already sent?</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="message in messages">
                                                    <td>
                                                        {{new Date(message.their_time).toLocaleString()}}
                                                    </td>
                                                    <td>
                                                        {{ new Date(message.utc_time).toLocaleString() }}
                                                    </td>
                                                    <td>
                                                        {{message.message}}
                                                    </td>
                                                    <td>
                                                        {{message.condition}}
                                                    </td>
                                                    <td>
                                                        {{message.sent}}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </v-table>
                                    </v-list>
                            </v-card>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
            </v-expansion-panels>
            </v-overlay>
    </span>
</template>
<script setup lang="ts">
import {ref, type Ref} from 'vue'
import TimezoneSelector from '../ScheduleDesigner/TimezoneSelector.vue'
import type { Timezone } from '@/types/schedule';
import JBtn from '../JBtn.vue';
import { tz_dict } from '../ScheduleDesigner/timezone';


type Message = {
    message:string,
    sent:boolean,
    condition:string,
    utc_time: string,
    their_time: string
}
type MessageScheduleInfo = {
    messages:Message[],
    timezone:Timezone
}

const props = defineProps<
    {
        participant_id:string
        dashboard_code:string
        phone_number: string
    }
>()



const messages = ref<Message[]>([])
const timezone  = ref<Timezone>("America/Los_Angeles")
const old_timezone: Ref<Timezone|null> = ref(null)
const new_dashboard_code = ref(props.dashboard_code)
const new_phone_number = ref(props.phone_number)
const details_open = ref(false)

async function update_dashboard_code(arg0:null){
    const fetchval = fetch('/salsa/server/api/update-dashboard-code?' + new URLSearchParams({
        participant_id:props.participant_id,
        dashboard_code:new_dashboard_code.value
    }), {method:'POST'})
    return fetchval
}

async function update_phone_number(arg0:null){
    const fetchval = fetch('/salsa/server/api/change-phone-number?' + new URLSearchParams({
        participant_id:props.participant_id,
        phone_number:new_phone_number.value
    }), {method:'POST'})
    return fetchval
}

async function get_message_schedule(){
    const s: MessageScheduleInfo = await (await 
        fetch('/salsa/server/api/get-messages?' + new URLSearchParams({participant_id:props.participant_id}))
    ).json()
    messages.value=s.messages
    timezone.value=s.timezone
    old_timezone.value=s.timezone
}
get_message_schedule()
function update_timezone(arg0: undefined){
    const fetchval = fetch('/salsa/server/api/update-timezone?' + new URLSearchParams({
        participant_id:props.participant_id,
        timezone:timezone.value
    }), {method:'POST'})
    fetchval.then(()=>get_message_schedule())
    return fetchval
}
function close(){
    details_open.value=false
}

</script>
<style>
.j-schedulecard{
    width: 80vw;
    height:75vh;
    overflow-y: scroll;

}
</style>