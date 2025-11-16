<template>
    <v-list>
        <v-list-item v-for="f in file_urls">
            <Popup class="j-generic-popup">
                <template #content>
                    <iframe  :src="f"/>
                </template>
                <template #open>
                    View {{props.my.stimulus_id}} question answers
                </template>
            </Popup>
        </v-list-item>
    </v-list>
</template>
<script setup lang=ts>
import {computed} from 'vue'
import Popup from '../Popup.vue'
import type { BareStimulus } from '@/types/schedule'
import { get_src } from './dashboard_logic';
interface Props{
    my: BareStimulus
    files: string[]
}


const props = defineProps<Props>()

const file_urls = computed(()=>
    props.files.map(fl => get_src(props.my.schedule_id!, fl))
)

</script>