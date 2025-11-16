<template>
    <reduced-layout>
        <template v-slot:content>
            <ion-card style=" margin: 0;
  position: absolute;
  top: 50%;
  overflow-y:scroll;
  -ms-transform: translateY(-50%);
  transform: translateY(-50%);">
                <ion-card-header>
                    <ion-card-subtitle style="font-size:1.5rem;">{{ props.my.label }}</ion-card-subtitle>
                </ion-card-header>
                <ion-card-content>
                    <ion-list>
                        <ion-item>
                            <ion-radio-group v-model="answer" style="max-width: 90vw; overflow-x:scroll"><ion-radio color="tertiary"   v-for="option in props.my.options" :value="option" label-placement="start"><p class="ion-text-wrap" style="text-align: left !important; font-size:1.5rem;">{{ option.trim() }}</p></ion-radio></ion-radio-group>
                        </ion-item>
                    </ion-list>
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
import {type SingleChoiceRadio as SingleChoiceRadioType} from '../types'
import { IonRadioGroup, IonRadio, IonButton, IonList, IonItem, IonIcon, 
    IonCardHeader, IonCardSubtitle, IonCardContent, IonCard,
    IonButtons, IonToolbar } from '@ionic/vue'
import {ref} from 'vue'
import { arrowForwardCircleOutline, arrowBackCircleOutline } from 'ionicons/icons'
import ReducedLayout from './ReducedLayout.vue'

interface Props{
    my: SingleChoiceRadioType
    question_responses:{[key:string]:(number|string|string[]|null)}
    continue_ema:()=>void
    reverse_ema?:()=>void
}
const props = defineProps<Props>()
const answer = ref(props.question_responses[props.my.id] as string)


function submit_answer(){
    if (answer.value !== null){
        props.question_responses[props.my.id] = answer.value
        props.continue_ema()
    }
}
function reverse_ema_click(){
    if (props.reverse_ema){
        props.question_responses[props.my.id]=answer.value
        props.reverse_ema()
    } 
}


</script>