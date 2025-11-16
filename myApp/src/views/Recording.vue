<template>
  <reduced-layout>
    <template v-slot:content>
      <ion-card>
        <ion-card-content v-if="!hide_stop_button">
          <ion-text v-if="props.my.message">
            <p v-html="props.my.message" style="font-size:1.5rem;">
            </p>
          </ion-text>
          <template v-if="props.my.duration! > 0">
            <ion-text v-if="props.my.autoadvance" color="primary">
              <h3>Recording will finish in {{ props.my.duration }} seconds</h3>
            </ion-text>
          </template>
          <ion-list>
            <ion-item>
              <ion-text>
                <template v-if="!is_recording && hide_start_button">Starting microphone: </template>
                <template v-if="!is_recording" :style="{color:active_color}"><h3> Not recording</h3></template>
              </ion-text>
              <ion-text v-if="is_recording" :style="{color:active_color}"><h3>Recording in progress</h3></ion-text>
            </ion-item>
            <div/>
            <ion-item>
              <ion-icon :icon="micCircleOutline" :style="{color:active_color}"/>
              <ion-text size="large">{{seconds_elapsed}}</ion-text>
            </ion-item>
          </ion-list>
        </ion-card-content>
        <ion-card-content v-else-if="hide_stop_button">
          <ion-list>
            <ion-item><ion-text>Saving recording...</ion-text>
            </ion-item>
            <ion-item><ion-progress-bar type="indeterminate"></ion-progress-bar></ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>
    </template>
    <template v-slot:footer>
            <ion-button v-if="!is_recording && !props.my.autoplay && !hide_start_button" @click="audio_start()" size="large">
                  Begin Recording
            </ion-button>
            <ion-button v-else-if="finished && !props.my.hide_controls && !hide_stop_button" @click="audio_stop()" size="large">
                  Stop Recording
            </ion-button>
    </template>
  </reduced-layout>
</template>
<script setup lang="ts">
import { type Recording as RecordingType} from '../types'
import {ref, computed} from 'vue'
import {save_encrypt_message_response} from '../encryption/pgp'
import { VoiceRecorder} from 'capacitor-voice-recorder'
import { IonList, IonItem, IonButton, IonIcon,
  IonProgressBar, IonText, IonCard, IonCardContent
} from '@ionic/vue'
import {micCircleOutline, radioButtonOffOutline, radioButtonOnOutline, arrowForwardCircleOutline} from 'ionicons/icons'
import mime from 'mime'
import ReducedLayout from './ReducedLayout.vue'
import { salsaStore } from '../store'



const store = salsaStore()

const recording_permission = ref(false)
VoiceRecorder.hasAudioRecordingPermission().then(v => recording_permission.value=v.value)

interface Props{
    my:RecordingType
    uploads: {[key:string]:Buffer}
    advance_stimulus:()=>void
}


const props = defineProps<Props>()
const seconds_elapsed = ref(0)
const finished = computed(()=>{
  if (props.my.duration && (props.my.hide_early || props.my.autoadvance)){
    return seconds_elapsed.value >= props.my.duration
  } else {
    return true
  }
})

const max_time_elapsed = computed(()=>{
  if (props.my.max_duration){
    return seconds_elapsed.value >= props.my.max_duration
  } else{
    return false
  }
})

const q = ref<ReturnType<typeof setTimeout>>()

function timer_countup(){
  q.value = setTimeout(
    () =>{
      if(is_recording.value){
        seconds_elapsed.value += 1
        if (finished.value && props.my.autoadvance){
          advance()
        } else if(max_time_elapsed.value){
          advance()
        }
        timer_countup()
      }
    }
    ,1000)
}

function advance(){
  clearTimeout(q.value)
  audio_stop()
}

const is_recording=ref(false)
const hide_start_button = ref(false)
const hide_stop_button = ref(false)

async function audio_start(){
  hide_start_button.value=true
  if (!recording_permission.value){
    VoiceRecorder.requestAudioRecordingPermission().then(r => {
      if (!(r.value)){
        hide_start_button.value=false
        alert("SALSA will not work if it does not have microphone permission. Please go to your settings and give SALSA microphone permission.")
      } else{
        begin_rec()
      }
    })
  } else{
    begin_rec()
  }
}

function begin_rec(){
  VoiceRecorder.startRecording()
  timer_countup()
  active_color.value="red"
  is_recording.value=true
}

const active_color=ref("black")

function audio_stop(){
  hide_stop_button.value=true
  VoiceRecorder.stopRecording().then( async r =>{
    await save_encrypt_message_response({
      name: `${props.my.id}.${mime.getExtension(r.value.mimeType)}`,
      body: Uint8Array.from(atob(r.value.recordDataBase64), c => c.charCodeAt(0)),
      format:'binary'
    }, store.schedule_id, store.salsaid, store.test_prototype_id, store.sequence_no,
      store.public_key)
  })
  active_color.value="black"
  is_recording.value=false
  props.advance_stimulus()
}
if (props.my.autoplay){
  audio_start()
}
</script>