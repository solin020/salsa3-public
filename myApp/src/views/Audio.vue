<template>
    <reduced-layout>
        <template v-slot:content>
            <ion-loading v-if="!media_ready"/>
            <audio v-else
                :src="my_src"
                :controls="'controls'? !props.my.hide_controls : undefined"
                :autoplay="'autoplay'? props.my.autoplay : undefined"
                @ended="ended()"
                style="width:100vw;
                        position:relative;
                        left:50%;
                        top:30%;
                        transform: translate(-50%,-50%)"/>
            <ion-text v-if="props.my.hide_controls" style="position:fixed;
                                                           top:40%;">
                Make sure to turn up your volume if you can't hear the story playing.
            </ion-text>
        </template>
        <template v-slot:footer v-if="show_continue && !props.my.autoadvance">
            <ion-button @click="advance_stimulus()">
                <ion-icon :icon="arrowForwardCircleOutline" size="large"/>
            </ion-button>
        </template>
    </reduced-layout>
</template>
<script setup lang="ts">
import { type Audio as AudioType} from '../types'
import {ref} from 'vue'
import { Filesystem, Directory, Encoding} from '@capacitor/filesystem'
import { IonButton, IonIcon, IonText, IonLoading,
} from '@ionic/vue'
import { arrowForwardCircleOutline } from 'ionicons/icons'
import ReducedLayout from './ReducedLayout.vue'
import { salsaStore } from '../store'

const store = salsaStore()

interface Props{
    my:AudioType
    uploads: {[key:string]:Buffer}
    advance_stimulus: ()=>void
}
const props = defineProps<Props>()
const my_src = ref("")
const media_ready = ref(false)
const show_continue = ref(false)
console.log('component created?')

Filesystem.readFile({
    directory:Directory.External,
    path:`testprototypes/${store.test_prototype_id}/${props.my.uri}`,
    encoding: Encoding.UTF8
}).then(b64data => {
    my_src.value= b64data.data.toString()
    media_ready.value = true
    if (!props.my.hide_early){
        show_continue.value = true
    }
})

function ended(){
    if (!props.my.autoadvance){
        show_continue.value = true
    } else{
        props.advance_stimulus()
    }
}

</script>