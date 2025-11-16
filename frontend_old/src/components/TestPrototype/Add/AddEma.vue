<template>
    <j-list :items="props.my.form">
        <template #preamble>
            <h2>Questions:</h2>
        </template>
        <template #renderer="{item:current_question}">
            <div class="j_icont">
                <div class="j_imain">
                    <AddSlider
                        :my="current_question"
                        v-if="current_question.type==='slider'"/>
                    <AddTextbox
                        :my="current_question"
                        v-else-if="current_question.type==='textbox'"/>
                    <AddSingleChoiceRadio
                        :my="current_question"
                        v-else-if="current_question.type==='single-choice-radio'"/>
                    <AddSingleChoiceDropdown
                        :my="current_question"
                        v-else-if="current_question.type==='single-choice-dropdown'"/>
                    <AddMultipleChoiceCheckbox
                        :my="current_question"
                        v-else-if="current_question.type==='multiple-choice-checkbox'"/>
                </div>
                <div class="j_idelete">
                    <v-btn @click="delete_question(current_question)">Delete Question {{ current_question.id}}</v-btn>
                </div>
            </div>
        </template>
        <template #postamble>
            <span class="j-tooltip">
                    ⓘ
                    <v-tooltip activator="parent" location="top">
                        <p>
                            An EMA questionnaire consists of a list of elements
                            that the user can respond to.
                        </p>
                        <ul>
                            <li>
                                <p>The <em>textbox</em> is simply a text input.</p>
                            </li>
                            <li>
                                <p>The <em>slider</em> allows them to select a number on a sliding scale (like rating things 1-10).</p>
                            </li>
                            <li>
                                <p>The <em>single-choice-radio</em> presents a multiple choice question that only one answer may be provided to.</p>
                            </li>
                            <li>
                                <p>
                                    The <em>multiple-choice-checkbox</em> presents a mulitple choice question that multiple answers
                                    may be provided to.
                                </p>
                            </li>
                            <li>
                                <p>
                                    The <em>single-choice-dropdown</em> presents a dropdown menu that lets the user select one
                                    answer to, it resembles the US state selectors seen on a lot of web forms.
                                </p>
                            </li>
                        </ul>
                    </v-tooltip>
                </span>
            <br/>
            <span>
                <v-select v-model="questiontype" label="Question type" :items="[
                    {
                        value: 'textbox',
                        title: 'Textbox'
                    }, 
                    {
                        value: 'slider',
                        title: 'Number slider'
                    }, 
                    {
                        value: 'single-choice-radio',
                        title: 'Multiple Choice Single Answer'
                    }, 
                    {
                        value: 'single-choice-dropdown',
                        title: 'Dropdown Menu'
                    }, 
                    {
                        value: 'multiple-choice-checkbox',
                        title: 'Multiple Choice Multiple Answer'
                    }
                    ]"
                    />

                <v-btn @click="add_question()">Add question ➕</v-btn> 
            </span>
        </template>
    </j-list>
</template>
<script setup lang="ts">
import {type Ema, 
        type QuestionType,
        type Slider as SliderType,
        type Textbox as TextboxType,
        type SingleChoiceRadio as SingleChoiceRadioType,
        type SingleChoiceDropdown as SingleChoiceDropdownType,
        type MultipleChoiceCheckbox as MultipleChoiceCheckboxType,
    } from '@/types'
import AddSlider from './AddSlider.vue';
import AddSingleChoiceDropdown from './AddSingleChoiceDropdown.vue';
import AddSingleChoiceRadio from './AddSingleChoiceRadio.vue';
import AddMultipleChoiceCheckbox from './AddMultipleChoiceCheckbox.vue';
import AddTextbox from './AddTextbox.vue';
import JList from '@/components/JList.vue';
import {ref, type Ref, computed, type ComputedRef} from 'vue'
import { id_regex_test } from '@/regexes';

interface Props {
    my:Ema
}
const props = defineProps<Props>()
const questiontype = ref("")

const unique_id = function*(){
    let i = 1
    while(true){
        yield i
        i += 1
    }
}()

function add_question(){
    const type = questiontype.value
    const id = `${type}_${unique_id.next().value}`
    const options: string[] = []
    const label = ''
    const min = 0;
    const max = 100;
    if (type==='textbox'){
        props.my.form.push({
            type,
            id,
            label,
        })
    }
    else if (type==='slider'){
        props.my.form.push({
            type,
            id,
            label,
            min,
            max
        })
    }
    else if (type==='single-choice-dropdown'){
        props.my.form.push({
            type,
            id,
            label,
            options
        })
    }
    else if (type==='multiple-choice-checkbox'){
        props.my.form.push({
            type,
            id,
            label,
            options
        })
    }
    else if (type==='single-choice-radio'){
        props.my.form.push({
            type,
            id,
            label,
            options
        })
    }
}
function delete_question(q:QuestionType){
    props.my.form.splice(props.my.form.indexOf(q),1)
}

function question_id_unique(sid:string){
    return props.my.form.map(q => q.id).includes(sid) || "Question must have a unique id"
}


</script>
<style>
.j_question_grid{
    display: grid;
    grid-template-columns: 1fr 1fr;
    overflow: hidden;
}
.j_edit_area{
    grid-column: 1 / 2;
    background-color:white;
    margin-right:20px;
}
.j_user_area{
    grid-column: 2 / 3;
    background-color: white;
}
.j_continue_button{
    position:absolute;
    bottom: 20px;
}
</style>