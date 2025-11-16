<template>
    <v-list>
        <v-list-item v-for="[original_file, file_url] in file_urls">
            <Popup class="j-generic-popup">
                <template #content>
                    <iframe  :src="file_url"/>
                </template>
                <template #open>
                    View {{props.my.stimulus_id}} question answers
                </template>
            </Popup>
        </v-list-item>
    </v-list>
</template>
<script setup lang=ts>
import {ref} from 'vue'
import Popup from '../Popup.vue'
import type { BareStimulus } from '@/types/schedule'
interface Props{
    my: BareStimulus
}


const props = defineProps<Props>()

const file_urls = ref<string[]>([])

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