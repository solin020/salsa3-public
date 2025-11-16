<template>
    <v-card>
        <v-card-title>
            <span v-if="!toggleable">Test prototype</span>
            <!--@vue-ignore-->
            <v-btn v-if="toggleable && !props.my.prototype_selection" @click="props.my.prototype_selection = {type:'per-patient', group:'', replace_after_sampling:false}">
                Add default test
            </v-btn>
            <!--@vue-ignore-->
            <v-btn  v-if="toggleable && props.my.prototype_selection" @click="props.my.prototype_selection=undefined">
                Remove default test
            </v-btn>
        </v-card-title>
        <v-card-text v-if="props.my.prototype_selection">
            <j-tooltip>
                <p>There are several ways to specify what test prototype is displayed to the participant on which day</p>
                <ul>
                    <li>
                        <p>With the <em>Specific test prototype</em> option, you may specify exactly which prototype is shown.</p>
                    </li>
                    <li>
                        <p>
                           With the <em>Variable random prototype selection</em> option, you can have it instead be
                           a random selection from one of the test prototype groups you have saved previously
                           in the <em>Add Test Prototype</em> tab. 
                        </p>
                           <p>The randomization is different across all participants.</p>
                        <p>
                           For example, if you have a group of test PrototypeSelection
                           numbered 1-5, with this option, participant_1 could be scheduled them in the order
                           <strong>5,3,1,2,4</strong>, where as participant_2 would have the schedule
                           <strong>3,4,5,2,1</strong>
                        </p>
                    </li>
                    <li>
                        <p>
                            Instead, with the <em>Fixed random prototype selection</em> option, you can create a random
                            selection which is shared across all participants. 
                        </p>
                        <p>
                           For example, if you have a group of test PrototypeSelection
                           numbered 1-5, with this option, participant_1 could be scheduled them in the order
                           <strong>5,3,1,2,4</strong>, and  participant_2 would also have the schedule
                           <strong>5,3,1,2,4</strong>
                        </p>
                    </li>
                    <li>
                        <p>With the <em>Inherit</em> option, the test prototype selection from the containing phase or schedule is copied.</p>
                        <p>If you use one of the randomization options with selection without replacement, this feature guarantees
                            that all of the random selections inheriting from the same source are different.
                        </p>
                    </li>
                </ul>
            </j-tooltip>
            <v-select :items="[...(props.level!=='base'?[{
                title:'Inherit',
                value:'inherit'
            }]:[]),{
                title:'Specific test prototype',
                value:'fixed'
            },{
                title:'Variable random prototype selection',
                value:'per-patient'
            },{
                title:'Fixed random prototype selection',
                value:'same-across-patients'
            }]" v-model="props.my.prototype_selection.type" :rules="[validate]"/>
            <template v-if="props.my.prototype_selection.type==='fixed'">
                <v-select :items="test_prototype_ids" v-model="props.my.prototype_selection.test_prototype_id" label="Test prototype id"/>
            </template>
            <template v-if="props.my.prototype_selection.type === 'per-patient' || props.my.prototype_selection.type === 'same-across-patients'">
                <v-select :items="groups" v-model="props.my.prototype_selection.group" label="Group to randomly draw from"/>
                <v-checkbox v-model="props.my.prototype_selection.replace_after_sampling" label="Sample with replacement?" :disabled="props.level==='entry'"/>
            </template>
        </v-card-text>
    </v-card>
</template>
<script setup lang='ts' generic="Level extends ('entry'|'phase'|'base')">
import type {TestPrototypeChoice, SchedulePrototype} from '../../types/schedule'
import {inject, computed, ref, type Ref} from 'vue'
import { test_prototypes_key, groups_key } from '@/injectkeys';
import JTooltip from '../JTooltip.vue';



interface Props{
    my: (Level extends 'base'? SchedulePrototype<'website'> : 
        Level extends 'phase' ? SchedulePrototype<'website'>['phases'][number] :
        SchedulePrototype<'website'>['phases'][number]['spec']['tests'][number]
    )    
    parent_phase: Level extends 'entry' ? SchedulePrototype<'website'>['phases'][number] : undefined
    parent_schedule: Level extends ('phase'|'entry') ? SchedulePrototype<'website'> : undefined
    level : Level
}
const props = defineProps<Props>()
const toggleable = (props.level!=='entry') ? true : false

const test_prototypes = inject(test_prototypes_key)!
const groups = inject(groups_key)!
const test_prototype_ids = computed(()=>test_prototypes.value.map(tp=>tp.id))




const name = ((level)=>{
    switch (level){
        case 'entry': return 'Test'
        case 'phase': return 'Phase'
        case 'base': return 'Schedule'
    }
})(props.level)


function validate(type:string){
    if (type === 'inherit'){
        if (props.level === 'entry'){
            return !!(props.parent_schedule?.prototype_selection || props?.parent_phase?.prototype_selection) || 
            'There must be a test prototype defined in the schedule or parent phase for this test to inherit its timing from'
        } else if (props.level === 'phase') {
            return !!(props.parent_schedule?.prototype_selection) || 
            'There must be a test prototype defined in the schedule for this phase to inherit its timing from'
        } 
    }
    return true
}

</script>