<template>
    <v-list>
        <v-list-item v-for="[original_file, file_url] in file_urls">
            <template v-if="original_file.endsWith('.wav') || original_file.endsWith('.adts') || original_file.endsWith('.flac')">
                Listen to {{ original_file.split('=').pop() }}:
                <br/>
                <span>&#9;</span><audio  :src="file_url" controls style="display: inline-block;"/>
            </template>

            <Popup v-else class="j-generic-popup">
                <template #content>
                    <iframe  :src="file_url"/>
                </template>
                <template #open>
                    View {{ original_file.split('=').pop() }}
                </template>
            </Popup>
        </v-list-item>
        <v-list-item >
            <details>
                <summary>View transcript</summary>
                <template v-for="t in props.other_data?.call_info.transcript">

                </template>
                <dl>
                    <template v-for="t in props.other_data?.call_info.transcript" v>
                        <template v-if="t[0] ==='chatbot'">
                            <dt>Chatbot: </dt>
                            <dd>{{ t[1] }}</dd>
                        </template>
                        <template v-else-if="t[0] ==='user'">
                            <dt>User:</dt>
                            <dd>{{ t[1] }}</dd>
                        </template>
                    </template>
                </dl>
            </details>
        </v-list-item>
    </v-list>
</template>
<script setup lang=ts>
import {computed, ref, type Ref} from 'vue'
import type { BareStimulus } from '@/types/schedule'
import Popup from '../Popup.vue'

type CallData = {
    call_info:{
        transcript:['chatbot'|'user'|'executing-node-id'|'prompt'|'goodbye'|'continuation'|'run-return-value', string][]
    }
}
interface Props{
    my: BareStimulus
    other_data?: CallData
}
const props = defineProps<Props>()

const file_urls = ref<string[][]>([])

function get_visit_files(){
    fetch(`/salsa/server/get-visit-files?${new URLSearchParams({
        schedule_id:props.my.schedule_id, 
        stimulus_id: props.my.stimulus_id})}`).then( r=>
    r.json()
    ).then( s=>
        file_urls.value = s
    )
}
get_visit_files()





</script>