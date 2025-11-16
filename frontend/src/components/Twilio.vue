<template>
    <br/>
    <v-container style="width: 100 vw;" class="bg-surface-variant">
        <v-row>
            <v-col :cols="2" :lg="12">
                <span style="font-size:24pt;">Add a new Twilio configuration</span>
            </v-col>
        </v-row>
        <v-row no-gutters>
            <v-col :cols="2" :lg="2">
                <v-text-field label="Config nickname" v-model="new_tw_nickname"/>
            </v-col>
            <v-col :cols="2" :lg="2">
                <v-text-field label="Phone number" v-model="new_tw_phone_number"/>
            </v-col>
            <v-col :cols="2" :lg="2">
                <v-select label="Linked dialogtree" :items="phone_test_prototypes" v-model="new_tw_answer_script"/>
            </v-col>
            <v-col :cols="2" :lg="2">
                <v-checkbox label="Require participant login" v-model="new_tw_require_caller_login"/>
            </v-col>
            <v-col :cols="2" :lg="2">
                <v-checkbox label="Lookup participant script" v-model="new_tw_lookup_participant_script"/>
            </v-col>
        </v-row>
        <v-row no-gutters>
            <v-col :cols="4" :lg="2">
                <v-text-field label="Account sid" v-model="new_tw_account_sid"/>
            </v-col>
        </v-row><v-row no-gutters>
            <v-col :cols="4" :lg="2">
                <v-text-field label="Auth token" v-model="new_tw_auth_token"/>
            </v-col>
        </v-row>
        <v-row>
            <v-col :cols="2" :lg="6">
                <j-btn :click="upload_new" :arg0="undefined" style="color:black;">Save new Twilio configuration</j-btn>
            </v-col>
        </v-row>
        <v-row>
            <v-col :cols="2" :lg="12">
                <span style="font-size:24pt;">View and edit saved Twilio configurations</span>
            </v-col>
        </v-row>
        <template v-for = "tw, idx in twilio_infos" no-gutters>
            <v-row >
                <v-col :cols="2" :lg="2">
                    Nickname:  {{tw.nickname}}
                </v-col>
                <v-col :cols="2" :lg="2">
                    <template v-if="active_idx===idx">
                        <v-text-field label="Phone number" v-model="tw.phone_number"/>
                    </template>
                    <template v-else>
                        Phone number: {{tw.phone_number}}
                    </template>
                </v-col>
                <v-col :cols="2" :lg="2">
                    <template v-if="active_idx===idx">
                        <v-select :items="phone_test_prototypes" label="Linked dialogtree" v-model="tw.answer_script"/>
                    </template>
                    <template v-else>
                        Linked dialogtree: {{tw.answer_script}}
                    </template>
                </v-col>
                <v-col :cols="2" :lg="2">
                    <template v-if="active_idx===idx">
                        <v-checkbox  label="Require participant login" v-model="tw.require_caller_login"/>
                    </template>
                    <template v-else>
                        Require participant login?: {{tw.require_caller_login}}
                    </template>
                </v-col>
                <v-col :cols="2" :lg="2">
                    <template v-if="active_idx===idx">
                        <v-checkbox  label="Lookup participant script" v-model="tw.lookup_participant_script"/>
                    </template>
                    <template v-else>
                        Lookup participant script?: {{tw.lookup_participant_script}}
                    </template>
                </v-col>
                <v-row>
                    <v-col :cols="4" :lg="2">
                        <template v-if="active_idx===idx">
                            <v-text-field label="Account sid" v-model="tw.account_sid"/>
                        </template>
                        <template v-else>
                            Account sid: {{tw.account_sid}}
                        </template>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col :cols="4" :lg="4">
                        <template v-if="active_idx===idx">
                            <v-text-field label="Auth token" v-model="tw.auth_token"/>
                        </template>
                        <template v-else>
                            Auth token: {{tw.auth_token}}
                        </template>
                    </v-col>
                </v-row>
                <v-row>
                <v-col :cols="2" :lg="2" v-if="active_idx===idx">
                    <j-btn :click="upload_existing" :arg0="tw" style="color:black;">Update</j-btn>
                </v-col>
                <v-col :cols="2" :lg="2">
                    <template v-if="active_idx===idx">
                        <v-btn @click="active_idx=undefined" style="color:black;">Go back</v-btn>
                    </template>
                    <template v-else>
                        <v-btn @click="active_idx=idx" style="color:black;">Edit?</v-btn>
                    </template>
                </v-col>
                </v-row>
            </v-row>

        </template>
    </v-container>
</template>
<script setup lang="ts">
import {inject, ref, type Ref, computed} from 'vue'
import { twilio_key, project_key, reload_twilio_key, test_prototypes_key } from '@/injectkeys'
import type { TwilioInfo } from '@/types'
import JBtn from './JBtn.vue'

const twilio_infos = inject(twilio_key)!
const project = inject(project_key)!
const reload_twilio = inject(reload_twilio_key)!
const test_prototypes = inject(test_prototypes_key)!
const phone_test_prototypes = computed(()=>{
    const retval = []
    for (const tp of test_prototypes.value){
        if (tp.schedule_type==='phone'){
            retval.push(tp.id)
        }
    }
    retval.push('')
    return retval
})
const new_tw_nickname = ref("")
const new_tw_account_sid = ref("")
const new_tw_auth_token = ref("")
const new_tw_phone_number = ref("")
const new_tw_answer_script = ref("")
const new_tw_require_caller_login=ref(false)
const new_tw_lookup_participant_script=ref(false)
const active_idx: Ref<number|undefined> = ref()

function upload_new(){
    return upload_to_twilio(new_tw_nickname.value, new_tw_account_sid.value, new_tw_auth_token.value, new_tw_phone_number.value,
       new_tw_answer_script.value, new_tw_require_caller_login.value, new_tw_lookup_participant_script.value

    )
}
function upload_existing(tw: TwilioInfo){
    return upload_to_twilio(tw.nickname, tw.account_sid, tw.auth_token, tw.phone_number,
       tw.answer_script, tw.require_caller_login, tw.lookup_participant_script
    )

}

function upload_to_twilio(nickname:string, account_sid:string, auth_token:string, phone_number:string, answer_script:string,
    require_caller_login:boolean, lookup_participant_script:boolean
){
    const retval = fetch('/salsa/server/api/add-twilio-info?' + 
        new URLSearchParams({project, nickname, account_sid, auth_token, phone_number,
            answer_script, require_caller_login: ''+require_caller_login, lookup_participant_script: ''+lookup_participant_script
        }),
        {method:'POST'}
    )
    retval.then((r) => r.status === 200? reload_twilio() : undefined)
    active_idx.value=undefined
    return retval
}


</script>