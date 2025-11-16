<template>
    <v-card>
        <v-card-title>
            <span v-if="!toggleable">Test time of day </span>
            <!--@vue-ignore-->
            <v-btn v-if="toggleable && ! props.my.timing" @click="props.my.timing = {type:'fixed',hour:9,minute:0}">
                Add default timing
            </v-btn>
            <!--@vue-ignore-->
            <v-btn  v-if="toggleable && props.my.timing" @click="props.my.timing=undefined">
                Remove timing
            </v-btn>
        </v-card-title>
        <v-card-text v-if="props.my.timing">
            <span class="j-tooltip">
                ⓘ
                <v-tooltip activator="parent" location="top">
                    <p>There are several ways to specify what time of day the participant recieves their test prototype and reminder SMS at.</p>
                    <ul>
                        <li>
                            <p>With the <em>Specific time</em> option, you may specify exactly what time of day the prototype becomes available.</p>
                        </li>
                        <li>
                            <p>
                               With the <em>Variable random time selection</em> option, you can have it instead be
                               a random selection within a time range. 
                            </p>
                               <p>The randomization is different across all participants.</p>
                            <p>
                               For example, one patient might recieve their test prototypes at 9:30 AM,
                               6:12 PM, and 3:15 PM, whereas another recieves it at 10:14 AM, 12:21 PM,
                               and 4:32 PM.
                            </p>
                        </li>
                        <li>
                            <p>
                                Instead, with the <em>Fixed random time selection</em> option, you can create a random
                                selection which is shared across all participants. 
                            </p>
                            <p>
                              For example, each patient across a schedule would their test prototypes at the same
                              random times of 9:30 AM, 6:12 PM, and 3:15 PM.                   
                            </p>
                        </li>
                        <li>
                            <p>With the <em>Inherit</em> option, the timing selection from the containing phase or schedule is copied.</p>
                        </li>
                    </ul>
                </v-tooltip>
            </span>
            <v-select :items="[...(props.level!=='base'?[{
                title:'Inherit',
                value:'inherit'
            }]:[]),{
                title:'Specific time',
                value:'fixed'
            },{
                title:'Variable random time selection',
                value:'per-patient'
            },{
                title:'Fixed random time selection',
                value:'same-across-patients'
            }]" v-model="props.my.timing.type" :rules="[validate]"/>
            <template v-if="props.my.timing.type==='fixed'">
                <label>Scheduled time</label>
                <!--@vue-ignore-->
                <input type="time" @input="(e) => [props.my.timing.hour, props.my.timing.minute] = parse_time(e)"/>
            </template>
            <template v-if="['per-patient','same-across-patients'].includes(props.my.timing.type)">
                <label>Earliest random time</label>
                <!--@vue-ignore-->
                <input type="time" @input="(e) => [props.my.timing.min_hour, props.my.timing.min_minute] = parse_time(e)"/>
                <label>Latest random time</label>
                <!--@vue-ignore-->
                <input type="time" @input="(e) => [props.my.timing.max_hour, props.my.timing.max_minute] = parse_time(e)"/>
            </template>
        </v-card-text>
    </v-card>
</template>
<script setup lang='ts' generic="Level extends ('entry'|'phase'|'base')">
import type {Timing, SchedulePrototype} from '../../types/schedule'
import {ref, type Ref} from 'vue'

interface Props{
    my: (Level extends 'base'? SchedulePrototype<'website'> : 
        Level extends 'phase' ? SchedulePrototype<'website'>['phases'][number]['spec'] :
        SchedulePrototype<'website'>['phases'][number]['spec']['tests'][number]
    )
    parent_phase: Level extends 'entry' ? SchedulePrototype<'website'>['phases'][number] : undefined
    parent_schedule: Level extends ('phase'|'entry') ? SchedulePrototype<'website'> : undefined
    level : Level
}
const props = defineProps<Props>()
const toggleable = (props.level!=='entry') ? true : false



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
            return !!(props.parent_schedule?.timing || props.parent_phase?.spec?.timing) || 
            'There must be a timing defined in the schedule or parent phase for this test to inherit its timing from'
        } else if (props.level === 'phase') {
            return !!(props.parent_schedule?.timing) || 
            'There must be a timing defined in the schedule for this phase to inherit its timing from'
        } 
    }
    return true
}

function parse_time(e:Event){
    const [hour, minute] = ((e.target! as HTMLInputElement).value.split(':')).map(s => parseInt(s))
    return [hour, minute]
}

</script>