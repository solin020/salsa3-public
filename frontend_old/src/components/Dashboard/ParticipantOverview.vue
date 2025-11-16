<template>
<span 
        ref="parent_span"
        :style="{
            'background-color':'white',
            'border': '2px solid black',
            'font-size': '24pt'
        }">
        🔎
            <v-overlay
                location-strategy="static"
                activator="parent"
                v-model="details_open"
            >
                <v-card class="j-schedulecard">
                    <v-card-title>Overview for {{ props.participant_id }}</v-card-title>
                    <v-card-subtitle>                            
                        <v-btn @click.stop="close()">Close</v-btn>
                    </v-card-subtitle>
                    <v-table class="j-dashboard-table">
                        <thead>
                            <th class="j-ptheader">Stimulus</th>
                            <th class="j-ptheader" v-for="pid in phase_ids">{{ pid }}</th>
                            <th class="j-ptheader">Self-initiated</th>
                        </thead>
                        <tbody>
                            <tr v-for="us in all_stimuli.keys()">
                                <td>{{ us }}: </td>
                                <td v-for="phase in current_schedule_prototype.phases">
                                        <template v-for="test in phase.spec.tests!">
                                            <ViewVisit
                                                :my="props.visit_phase_sequence_stimulus_map.get(`${phase.id}|${test.sequence_no}|${us}`)!"
                                            />
                                        </template>
                                 </td>
                                 <td>
                                    <template v-for="visit_map in props.self_initiated_stimulus_map || []">
                                        <template v-if="visit_map.get('us')">
                                            <ViewVisit
                                                :my="visit_map.get('us')!"
                                            />
                                        </template>
                                    </template>
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-card>
            </v-overlay>
    </span>
</template>
<script setup lang="ts">
import {ref, inject} from 'vue'
import { response_stimuli_key, phase_ids_key, current_schedule_prototype_key } from '@/injectkeys'
import type { Visit2} from '@/types/schedule'
import ViewVisit from './ViewVisit.vue'
const details_open = ref(false)
const props = defineProps<{
    participant_id:string
    visit_phase_sequence_stimulus_map: Map<string, Visit2>
    self_initiated_stimulus_map: Map<string, Visit2>[]
}>()
function close(){
    details_open.value=false
}
const all_stimuli = inject(response_stimuli_key)!
const phase_ids = inject(phase_ids_key)!
const current_schedule_prototype = inject(current_schedule_prototype_key)!




</script>
<style>
.j-ptheader{
    text-align:left;
}
</style>