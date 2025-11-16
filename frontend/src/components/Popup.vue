<template>
    <VBtn @click="outer_open_dialog" :disabled="props?.disabled"><slot name="open">Open</slot></VBtn>
    <dialog ref="dialogref">
        <template v-if="dialog_open">
            <VBtn @click="outer_close_dialog"><slot name="close">Close</slot></VBtn>
            <br/>
            <slot name="content"></slot>
        </template>
    </dialog>
</template>
<script lang="ts" setup>
import {ref, type Ref, watch} from "vue"
const dialogref: Ref<HTMLDialogElement|null> = ref(null)
const dialog_open = ref(false)
function outer_open_dialog(){
    if (props?.controlFromOutside){
        props.controlFromOutside.value=true
    } else{
    open_dialog()
    }
}
function outer_close_dialog(){
    if (props?.controlFromOutside){
        props.controlFromOutside.value=false
    } else{
    close_dialog()
    }
}

function open_dialog(){
    if (dialogref.value){

        dialog_open.value=true
        dialogref.value.showModal()
    }
}
interface Props{
    afterclose?: Function
    disabled?:boolean
    controlFromOutside?: Ref<boolean>
}
const props = defineProps<Props>()
if (props?.controlFromOutside){
    watch( props.controlFromOutside, (newValue, oldValue)=>{
        if (newValue && (!oldValue)){
            open_dialog()
        }
        else if (oldValue && !(newValue)){
            close_dialog()
        }
    })
}


function close_dialog(){
    if (dialogref.value){
        dialog_open.value=false
        dialogref.value.close()
        if (props.afterclose){
            props.afterclose()
        }
    }
}
</script>