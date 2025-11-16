<template>
    <reduced-layout>
        <template v-slot:content>
            <ion-card>
                <ion-card-header>
                    <ion-card-subtitle style="font-size:1.5rem;">{{ props.my.label }}</ion-card-subtitle>
                </ion-card-header>
                <ion-card-content>
                    <ion-range
                        :min="props.my.min"
                        :max="props.my.max"
                        :pin="true"
                        :ticks="true"
                        :snaps="true"
                        v-model="answer"
                        label-placement="stacked"
                    >
                        <ion-chip slot="start">{{ props.my.min }}</ion-chip>
                        <ion-chip slot="end">{{ props.my.max }}</ion-chip>
                    </ion-range>
                </ion-card-content>
            </ion-card>
        </template>
        <template v-slot:footer>
            <ion-toolbar>
                <ion-buttons slot="end">
                    <ion-button @click="submit_answer()" fill="solid" color="primary" :disabled="answer == null">
                        <ion-icon :icon="arrowForwardCircleOutline" size="large"/>
                    </ion-button>
                </ion-buttons>
                <ion-buttons slot="start">
                    <ion-button @click="reverse_ema_click()" :disabled="!reverse_ema" fill="solid" color="primary">
                        <ion-icon :icon="arrowBackCircleOutline" size="large"/>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </template>
    </reduced-layout>
</template>
<script setup lang="ts">
import {type Slider as SliderType} from '../types'
import { IonRange, IonChip, IonButton, IonIcon,
    IonCardHeader, IonCardSubtitle, IonCard, IonCardContent,
    IonButtons, IonToolbar
 } from '@ionic/vue'
import { arrowForwardCircleOutline, arrowBackCircleOutline } from 'ionicons/icons'
import {ref} from 'vue'
import ReducedLayout from './ReducedLayout.vue'

interface Props{
    my: SliderType
    question_responses:{[key:string]:(number|string|string[]|null)}
    continue_ema:()=>void
    reverse_ema?:()=>void
}

function reverse_ema_click(){
    if (props.reverse_ema){
        props.question_responses[props.my.id]=answer.value
        props.reverse_ema()
    } 
}


const props = defineProps<Props>()
const answer = ref(props.question_responses[props.my.id] as number)

function submit_answer(){
    if (answer.value !== null){
        props.question_responses[props.my.id]=answer.value
        props.continue_ema()
    }
}
</script>