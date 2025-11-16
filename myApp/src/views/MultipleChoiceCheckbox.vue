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
                        <ion-item v-for="option in props.my.options">
                            <ion-checkbox color="tertiary" label-placement="end" @ion-change="toggle_choice(option)">{{ option }}</ion-checkbox>
                        </ion-item>
                    </ion-list>
                </ion-card-content>
            </ion-card>
        </template>
        <template v-slot:footer>
            <ion-toolbar>
                <ion-buttons slot="end">
                    <ion-button @click="submit_answer()" fill="solid" color="primary" :disabled="answers == null">
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
import {type MultipleChoiceCheckbox as MultipleChoiceCheckboxType} from '../types'
import { IonCheckbox, IonItem, IonList, IonButton, IonIcon, 
    IonCardHeader, IonCardSubtitle, IonCardContent, IonCard,
    IonButtons, IonToolbar} from '@ionic/vue'
import { arrowForwardCircleOutline, arrowBackCircleOutline } from 'ionicons/icons'
import {ref, type Ref} from 'vue'
import ReducedLayout from './ReducedLayout.vue'

interface Props{
    my: MultipleChoiceCheckboxType
    question_responses:{[key:string]:(number|string|string[]|null)}
    continue_ema:()=>void
    reverse_ema?:()=>void
}
const props = defineProps<Props>()
const answers: Ref<string[]> = ref(props.question_responses[props.my.id] as string[])


function submit_answer(){
    if (answers.value !== null ){
        props.question_responses[props.my.id] = answers.value
        props.continue_ema()
    }
}

function toggle_choice(option:string){
    const ans = answers.value
    if (ans.includes(option)){
        ans.splice(ans.indexOf(option), 1)
    } else {
        ans.push(option)
    }
}

function reverse_ema_click(){
    if (props.reverse_ema){
        props.question_responses[props.my.id]=answers.value
        props.reverse_ema()
    } 
}
</script>
