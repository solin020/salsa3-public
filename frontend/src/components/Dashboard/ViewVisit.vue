<template>
    <span 
        ref="parent_span"
        class="j-dot" 
        :class="visit_class">
        {{ props.my.sequence_no>=0 ? props.my.sequence_no : ' ' }}
        <v-overlay
            location-strategy="static"
            activator="parent"
            v-model="details_open"
        >
            <v-card class="j-hovercard">
                <v-card-title>
                    Participant: {{props.participant_id}}  {{ 
                        props.my.sequence_no >= 0 ? `Visit # ${props.my.sequence_no}` : '' }}
                </v-card-title>
                <v-card-subtitle v-if="props.my.formal_timestamp">
                    Scheduled at: {{ props.my.formal_timestamp.toLocaleString() }}
                </v-card-subtitle>
                <v-card-subtitle v-if="props.my.real_timestamp">
                    Completed at: {{ props.my.real_timestamp.toLocaleString() }}
                </v-card-subtitle>
                <v-card-subtitle v-else-if="props.my.formal_timestamp">
                    Not yet submitted
                </v-card-subtitle>
                <v-card-subtitle v-if="schedule_ids.length===1">
                    Submission id: {{ schedule_ids[0] }}
                </v-card-subtitle>
                <template v-else-if="schedule_ids.length>1">
                    <v-card-subtitle style="color: red;">
                        DUPLICATED SUBMISSIONS
                    </v-card-subtitle>
                    <v-card-subtitle v-for="schedule_id in schedule_ids">
                        Submission id: {{ schedule_id }}
                    </v-card-subtitle>
                </template>
                <v-card-subtitle>
                    Test prototype id: {{ props.my.test_prototype_id }}
                </v-card-subtitle>
                <template v-if="Array.from(randomization_reports.entries()).length > 0">
                    <v-card-subtitle v-if="schedule_ids.length===1">
                        <p>Randomization order:</p>
                        <p v-for="r in randomization_reports.get(schedule_ids[0])!">{{ r }}</p>
                    </v-card-subtitle>
                    <v-card-subtitle v-else-if="schedule_ids.length>1">
                        <template v-for="schedule_id in schedule_ids">
                            <p>Randomization order for {{ schedule_id }}:</p>
                            <p v-for="r in randomization_reports.get(schedule_id)!">{{ r }}</p>
                        </template>
                    </v-card-subtitle>
                </template>
                <v-list>
                    <v-list-subheader>Tasks</v-list-subheader>
                    <v-list-item v-for="sr in props.my.visit" variant="outlined">
                        <template v-if="sr.quality === 'perfect' || sr.quality === 'suspect'">
                            <v-card>
                                <v-card-subtitle v-if="sr.quality === 'suspect'" style="color:red;">
                                    QUALITY ISSUES
                                </v-card-subtitle>
                                <v-card-title v-if="sr.stimulus_type!=='dialogtree'">
                                    {{ sr.stimulus_id }}
                                </v-card-title>
                                <v-card-subtitle>
                                    Submission id: {{ sr.schedule_id }}
                                </v-card-subtitle>
                                <v-card-text>
                                    <ViewEma :my="sr"
                                        v-if="sr.stimulus_type==='ema'"
                                    />
                                    <ViewRecording :my="sr"
                                        :other_data="sr.other_data"
                                        v-else-if="sr.stimulus_type==='recording'"
                                    />
                                    <ViewDialogtree :my="sr"
                                        :other_data="sr.other_data"
                                        v-else-if="sr.stimulus_type==='dialogtree'"
                                    />
                                </v-card-text>
                            </v-card>
                        </template>
                        <template v-else-if="props.my.quality === 'missing' && sr.quality === 'missing'">
                            <v-card>
                                <v-card-title>
                                    {{ sr.stimulus_id }}
                                </v-card-title>
                                <v-card-text>
                                    Past due
                                </v-card-text>
                            </v-card>
                        </template>
                        <template v-else-if="props.my.quality === 'recent' && sr.quality === 'missing'">
                            <v-card>
                                <v-card-title>
                                    {{ sr.stimulus_id }}
                                </v-card-title>
                                <v-card-text>
                                    Sent within the last 2 days but not yet completed
                                </v-card-text>
                            </v-card>
                        </template>
                        <template v-else-if="props.my.quality === 'impending' && sr.quality === 'missing'">
                            <v-card>
                                <v-card-title>
                                    {{ sr.stimulus_id }}
                                </v-card-title>
                                <v-card-text>
                                    About to be sent within the next two days
                                </v-card-text>
                            </v-card>
                        </template>
                        <template v-else-if="props.my.quality === 'future' && sr.quality === 'missing'">
                            <v-card>
                                <v-card-title>
                                    {{ sr.stimulus_id }}
                                </v-card-title>
                                <v-card-text>
                                    Not yet due
                                </v-card-text>
                            </v-card>
                        </template>
                        <template v-else-if="props.my.quality === 'dropout' && sr.quality === 'missing'">
                            <v-card>
                                <v-card-title>
                                    {{ sr.stimulus_id }}
                                </v-card-title>
                                <v-card-text>
                                    Participant Dropped out
                                </v-card-text>
                            </v-card>
                        </template>
                        <template v-else>
                            <v-card>
                                <v-card-title>
                                    {{ sr.stimulus_id }}
                                </v-card-title>
                                <v-card-text>
                                    {{ sr.quality }} {{ sr.real_timestamp }} {{sr.schedule_id}} {{ sr.stimulus_id }}
                                </v-card-text>
                            </v-card>
                        </template>
                    </v-list-item>
                    <template v-if="schedule_ids.length>1">

                    </template>
                    <v-list-item v-for="schedule_id in schedule_ids">
                        <v-btn @click="download_data(schedule_id)" >Download data for {{schedule_id}}</v-btn>
                    </v-list-item>
                </v-list>
                <v-card-actions>
                    <v-btn @click="download_data(schedule_ids[0])" v-if="schedule_ids.length===1">Download data</v-btn>
                    <v-btn @click.stop="close()">Close</v-btn>
                </v-card-actions>
            </v-card>
        </v-overlay>
    </span>
    <v-dialog v-model=dialog_open>
        <v-card>
            <v-card-title>Download ready</v-card-title>
            <v-card-text><a :href="download_url" :download="download_name">{{ download_name }}</a></v-card-text>
            <v-card-actions>
                <v-btn @click="dialog_open=false">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script setup lang=ts>
import ViewEma from './ViewEma.vue'
import ViewRecording from './ViewRecording.vue'
import ViewDialogtree from './ViewDialogtree.vue'

import {ref, computed, inject, type Ref, watch} from 'vue'
import { response_stimuli_key, test_prototypes_key } from '@/injectkeys'
import type {  ScheduledVisit } from '@/types/schedule'




const props = defineProps<{
    my:(ScheduledVisit )
    participant_id?: string
}>()
const emit = defineEmits<{
  (e: 'open'): void
  (e: 'close'): void
}>()
const dialog_open = ref(false)

const stimuli_map = inject(response_stimuli_key)!
const test_prototypes = inject(test_prototypes_key)!
const details_open = ref(false)

const schedule_ids_set = new Set<string>()
for (const v of props.my.visit){
    if (v.schedule_id){
        schedule_ids_set.add(v.schedule_id)
    }
}
const schedule_ids = Array.from(schedule_ids_set.keys())









function close(){
    details_open.value=false
}



const visit_class = computed(()=>{
     
    switch(props.my.quality){
        case 'perfect' : return 'j-visit-perfect'
        case 'imperfect' : return 'j-visit-imperfect'
        case 'missing' : return 'j-visit-missing'
        case 'future' : return 'j-visit-future'
        case 'recent' : return 'j-visit-recent'
        case 'impending' : return 'j-visit-impending'
        case 'dropout' : return 'j-visit-dropout'
        case 'multiple' : return 'j-visit-multiple'
        case 'suspect': return 'j-visit-suspect'
    }
})






const file_urls: Ref<Map<string, string[]>> = ref(new Map())







const randomization_reports: Ref<Map<string, string[]>> = ref(new Map())



const parent_span=ref()

const download_url = ref('')
const download_name = ref('')

async function download_data(schedule_id:string){
    const retval = await(
        await fetch(`/salsa/server/get-visit-zip?${new URLSearchParams({schedule_id})}`)
    ).blob()
    download_url.value = URL.createObjectURL(retval)
    download_name.value = `${props.participant_id}|${schedule_id}.zip`
    dialog_open.value=true
}

</script>
<style>
.j-dot{
    height: 25px;
    width: 25px;
    border-radius: 50%;
    display: inline-block;
    text-align: center;
    &:hover{
        box-shadow: 0 10px 10px rgb(0 0 0 / 0.4);
    }
}
.j-hovercard{
    width: 600px;
    height:75vh;
    overflow-y: scroll;

}
.j-hiddencard{
    display: none;
}
.j-visit-perfect {
    background-color:seagreen;
    color:white;
}
.j-visit-suspect {
    background-color:deeppink;
    color:black;
}
.j-visit-imperfect {
    background-color:gold;
    color:black;
}
.j-visit-missing {
    background-color:maroon;
    color:white;
}
.j-visit-future {
    background-color:white;
    border:2px solid black;
}
.j-visit-recent {
    background-color:lightblue;
    color:black;
}
.j-visit-impending{
    background-color:blue;
    color: white;
}
.j-visit-dropout{
    background-color:darkgrey;
    color: white;
}
.j-visit-multiple{
    background:repeating-linear-gradient(
                            to bottom,
                            yellow,
                            red 2em,
                            red);
    color: black;
}

</style>