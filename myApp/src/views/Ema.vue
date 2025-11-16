<template>
    <Textbox v-if="current_question.type==='textbox'"
        :my="current_question"
        :continue_ema="continue_ema"
        :reverse_ema="question_number>0 ? reverse_ema : undefined"
        :question_responses="question_responses"
        :key="current_question.id"
    />
    <Slider  v-if="current_question.type==='slider'"
        :my="current_question"
        :continue_ema="continue_ema"
        :reverse_ema="question_number>0 ? reverse_ema : undefined"
        :question_responses="question_responses"
        :key="current_question.id"
    />
    <SingleChoiceDropdown  v-if="current_question.type==='single-choice-dropdown'"
        :my="current_question"
        :continue_ema="continue_ema"
        :reverse_ema="question_number>0 ? reverse_ema : undefined"
        :question_responses="question_responses"
        :key="current_question.id"
    />
    <SingleChoiceRadio  v-if="current_question.type==='single-choice-radio'"
        :my="current_question"
        :continue_ema="continue_ema"
        :reverse_ema="question_number>0 ? reverse_ema : undefined"
        :question_responses="question_responses"
        :key="current_question.id"
    />
    <MultipleChoiceCheckbox  v-if="current_question.type==='multiple-choice-checkbox'"
        :my="current_question"
        :continue_ema="continue_ema"
        :reverse_ema="question_number>0 ? reverse_ema : undefined"
        :question_responses="question_responses"
        :key="current_question.id"
    />
</template>
<script setup lang="ts">
import { type Ema as EmaType} from '../types'
import SingleChoiceDropdown from './SingleChoiceDropdown.vue'
import SingleChoiceRadio from './SingleChoiceRadio.vue'
import Slider from './Slider.vue'
import Textbox from './Textbox.vue'
import {computed, ref} from 'vue'
import MultipleChoiceCheckbox from './MultipleChoiceCheckbox.vue'
import { save_encrypt_message_response } from '@/encryption/pgp'
import { salsaStore } from '../store'


const store = salsaStore()

interface Props{
    my:EmaType
    uploads: {[key:string]:Buffer}
    advance_stimulus:()=>void
}
const props = defineProps<Props>()

const qr_object: {[key:string]:(number|string|string[]|null)}  = {}
for (const k of props.my.form){
    qr_object[k.id] = null
}

const question_responses = ref(qr_object)
const question_number = ref(0)
const current_question = computed(()=>props.my.form[question_number.value])
async function continue_ema(){
    if (question_number.value >= props.my.form.length - 1){
        await save_encrypt_message_response(
            {
                name: `${props.my.id}.json`,
                body: JSON.stringify(question_responses.value),
                format:'string'
            }, 
            store.schedule_id, store.salsaid, store.test_prototype_id, store.sequence_no,
            store.public_key
        )
        props.advance_stimulus()
    } else{
        question_number.value = question_number.value + 1
    }

}
async function reverse_ema(){
    if (question_number.value>0){
        question_number.value = question_number.value - 1
    }
}

</script>