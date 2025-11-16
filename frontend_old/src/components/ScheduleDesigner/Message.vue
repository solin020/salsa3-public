<template>
    <v-card>
        <v-card-title>Associated Messages</v-card-title>
        <v-list>
            <v-list-item>
                <v-select :items="[...(props.level!=='base'?[{
                title:'Inherit',
                value:'inherit'
            }]:[]),{
                title:'Specify message list',
                value:'fixed'
            },{
                title:'No message',
                value:'none'
            }]" v-model="props.my.type" />
            </v-list-item>
            <template v-if="props.my.type==='fixed'">
                <v-list-item v-for="m, i in props.my.messages">
                    <v-text-field label="message" v-model="m.message"/>
                    <interval :my="m.interval"/>
                    <v-select v-model="m.condition"
                        :items="[{
                            title:'Always send',
                            value:'unconditional'
                        },{
                            title:'Send if test submitted',
                            value:'incomplete'
                        },{
                            title:'Send if test not submitted',
                            value:'complete'
                        }]"
                    /><span @click="delete_message(i)">❌</span>
                </v-list-item>
                <v-list-item>
                    <v-btn @click="add_message">Add message</v-btn>
                </v-list-item>
            </template>
        </v-list>
    </v-card>
</template>
<script setup lang="ts" generic="Level extends ('entry'|'phase'|'base')">
import Interval from './Interval.vue'
import type { AssociatedMessages } from '../../types/schedule'

const props = defineProps<{
    my:AssociatedMessages<Level>,
    level:Level
}>()



function add_message(){
    if (props.my.type==='fixed'){
        if (!(props.my.messages)){
            props.my.messages = []
        }
        props.my.messages.push({
        message:'You have a test scheduled. Please open the salsa app.',
        interval:{count:0, unit:'days'},
        condition:'unconditional'
    })
    }

}
function delete_message(i:number){
    if (props.my.type==='fixed'){
        props.my.messages.splice(i,1)
    }
}
</script>