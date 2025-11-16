<template>
    <v-list>
        <v-list-item v-for="[original_file, file_url] in file_urls">
            <template v-if="original_file.endsWith('.wav') || original_file.endsWith('.adts')">
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
        <v-list-item v-if="props.mos">
            <dl>
                <dt>MOS score</dt>
                <dd>{{ props.mos.mos }}</dd>
                <dt>SNR score</dt>
                <dd>{{ props.mos.snr }}</dd>
                <dt>Word count</dt>
                <dd>{{ props.mos.word_count }}</dd>
                <dt>Words per minute</dt>
                <dd>{{ props.mos.word_per_min }}</dd>
                <dt>Words per second</dt>
                <dd>{{ props.mos.word_per_sec }}</dd>
            </dl>
            <details>
                <summary>View transcript</summary>
                <p>
                    {{ props.mos.prediction }}
                </p>
            </details>
        </v-list-item>
    </v-list>
</template>
<script setup lang=ts>
import {computed, ref, type Ref} from 'vue'
import type { BareStimulus } from '@/types/schedule'
import { get_src } from './dashboard_logic';
import type { Mos } from '@/types'
import Popup from '../Popup.vue'

interface Props{
    my: BareStimulus
    files: string[]
    mos?: Mos
}
const props = defineProps<Props>()

const file_urls = computed(()=>
    props.files.map(fl => [fl, get_src(props.my.schedule_id!, fl)])
)

function calculate_span_style(score:number) {
    return {
        
        'background-color': `oklab(from red 1 ${0.4 - (0.8*score)} 0.4)`
    }
}



</script>