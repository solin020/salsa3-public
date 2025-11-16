<template>
    <reduced-layout>
        <template v-slot:content>
            <ion-loading v-if="!media_ready"/>
            <img :src="my_src" 
                 style="width:100vw;
                        position:relative;
                        left:50%;
                        top:60%;
                        transform: translate(-50%,-50%)"/>
        </template>
        <template v-slot:footer v-if="media_ready &&
          !props.my.autoadvance && 
          !(props.my.hide_early && !finished)"
        >
            <ion-button @click="advance()">
                <ion-icon :icon="arrowForwardCircleOutline" size="large"/>
            </ion-button>
        </template>
    </reduced-layout>
</template>
<script setup lang="ts">
import { type Image as ImageType} from '../types'
import {ref, computed, type Ref} from 'vue'
import { Filesystem, Directory, Encoding} from '@capacitor/filesystem'
import { IonLoading, IonButton, IonIcon
} from '@ionic/vue'
import { arrowForwardCircleOutline } from 'ionicons/icons'
import ReducedLayout from './ReducedLayout.vue'
import {salsaStore} from '../store'

const store = salsaStore()

interface Props{
    my:ImageType
    uploads: {[key:string]:Buffer}
    advance_stimulus:()=>void
}
const props = defineProps<Props>()
const my_src = ref("")
const media_ready = ref(false)
console.log('render called', props.my)


const seconds_elapsed = ref(0)
const finished = computed(()=>{
  if (props.my.duration){
    return seconds_elapsed.value >= props.my.duration
  } else {
    return true
  }
})
const q: Ref<ReturnType<typeof setTimeout>| null> = ref(null)

function advance(){
    clearTimeout(q.value!)
    props.advance_stimulus()
}

function timer_countup(){
  q.value = setTimeout(
    () =>{
    console.log(`image at  ${seconds_elapsed.value}`)
    seconds_elapsed.value += 1
    if (finished.value && props.my.autoadvance){
        advance()
    } else{
        timer_countup()
    }
    }
    ,1000)
}

Filesystem.readFile({
    directory:Directory.External,
    path:`testprototypes/${store.test_prototype_id}/${props.my.uri}`,
    encoding: Encoding.UTF8
}).then(b64data => {
    my_src.value= b64data.data.toString()
    media_ready.value=true
    timer_countup()
})

</script>