<template>
    <template v-if="current_stimulus">
        <Audio v-if="current_stimulus.type==='audio'" 
            :my="current_stimulus" 
            :uploads="uploads"
            :advance_stimulus="advance_stimulus"
            :key="current_stimulus.id"
        />
        <Video v-if="current_stimulus.type==='video'" 
            :my="current_stimulus" 
            :uploads="uploads"
            :advance_stimulus="advance_stimulus"
            :key="current_stimulus.id"
        />
        <Image v-if="current_stimulus.type==='image'" 
            :my="current_stimulus" 
            :uploads="uploads"
            :advance_stimulus="advance_stimulus"
            :key="current_stimulus.id"
        />
        <Ema v-if="current_stimulus.type==='ema'" 
            :my="current_stimulus" 
            :uploads="uploads"
            :advance_stimulus="advance_stimulus"
            :key="current_stimulus.id"
        />
        <Recording v-if="current_stimulus.type==='recording'" 
            :my="current_stimulus" 
            :uploads="uploads"
            :advance_stimulus="advance_stimulus"
            :key="current_stimulus.id"
        />
    </template>

</template>
<script setup lang="ts">
import Ema from './Ema.vue'
import Recording from './Recording.vue'
import Image from './Image.vue'
import Video from './Video.vue'
import Audio from './Audio.vue'
import {computed, ref, type Ref} from 'vue'
import { salsaStore } from '../store'


const store = salsaStore()




const stimulus_number = ref(-1)
function advance_stimulus(){

    console.log('randomization_order', store.randomization_order)
    const next = stimulus_number.value + 1
    const stim_length = store.todays_test_prototype!.stimuli.length
    const rand_length = store.randomization_order.length
    if (next>=stim_length||store.todays_test_prototype!.stimuli[next].type==='breakpoint'){
        if (rand_length>0){
            console.log('jumped')
            stimulus_number.value = store.randomization_order.pop()! + 1
        } else{
            console.log('test prototype done 2')
            if (store.taking_scheduled){
                store.current_test_prototype!.attempted=true
                store.write_schedule().then(()=>store.current_component='Uploads').catch(e => console.log('error', e))
            } else{
                store.current_component='Uploads'
            }
        }
    } else{
        stimulus_number.value = next
        console.log('stimulus advanced')
    }
}
advance_stimulus()
const current_stimulus = computed(() => store.todays_test_prototype!.stimuli[stimulus_number.value])
const uploads: Ref<{[key:string]:Buffer}> = ref({})



</script>