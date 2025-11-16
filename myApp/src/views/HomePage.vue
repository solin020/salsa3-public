<template>
    <layout>
      <template v-slot:content>
        <ion-card>
          <ion-card-header>
            <ion-card-title>Click arrow below to take a test</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-text>Logged in as {{ store.salsaid }}</ion-text>
          </ion-card-content>
        </ion-card>
      </template>
      <template v-slot:footer>
        <ion-button  @click="search_schedule()"><ion-icon :icon="caretForwardCircleOutline" size="large"/></ion-button>
        <ion-modal :is-open="is_open">
          <ion-card>
                <ion-card-header>
                    <ion-card-title>              
                      <p>You have no test scheduled today!</p>
                      <p>
                        If you would like to do your own activity,
                        click on an activity below and then click "start test"
                      </p>
                  </ion-card-title>
                </ion-card-header>
                <ion-card-content>
                    <ion-list>
                        <ion-item>
                            <ion-select v-model="ad_lib_test" interface="action-sheet"
                            style="font-size:1.5rem;"
                            label="Click to choose test"
                              :interface-options="{
                                header: 'Choose which test you would like to take',
                                subHeader: 'Scroll down if there are many options'
                              }">
                                <ion-select-option v-for="at in selectable_test_prototypes" :value="at" style="font-size:1.5rem;">
                                    {{ at }}
                                </ion-select-option>
                            </ion-select>
                        </ion-item>
                        <ion-item>
                          <ion-button size="large" @click="ad_lib_begin()" :disabled="!ad_lib_test">Start test: {{ ad_lib_test }} ➡</ion-button>
                        </ion-item>
                        <ion-item>
                          <ion-button size="large" @click="cancel()">Go back ↵</ion-button>
                        </ion-item>
                    </ion-list>
                </ion-card-content>
            </ion-card>
        </ion-modal>

      </template>
    </layout>
</template>

<script setup lang="ts">
import { IonText, IonButton, IonIcon, IonCard, IonCardHeader, IonCardContent,IonCardTitle,
    IonSelect, IonSelectOption, IonList, IonItem, IonModal
} from '@ionic/vue'
import {caretForwardCircleOutline} from 'ionicons/icons'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import Layout from './Layout.vue'
import { salsaStore } from '../store'
import type { SchedulePrototype } from '@/types/schedule'
import type { Stimulus, TestPrototype } from '@/types'
import { save_encrypt_message_response } from '@/encryption/pgp'
import {ref, computed, type Ref} from 'vue'

const store = salsaStore()
store.update_uploads()
const selectable_test_prototypes: Ref<string[]>  = ref([])


const is_open = ref(false)

function cancel(){is_open.value=false}

function getRandomInt(min:number, max:number):number {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

function shuffle<T>(ipt: T[] ):T[]{
    const retval: T[] = []
    while (ipt.length>0){
        retval.push(ipt.splice(getRandomInt(0,ipt.length),1)[0])
    }
    return retval
}

const ad_lib_test: Ref<string> = ref('')



async function ad_lib_begin(){
  store.taking_scheduled = false
  is_open.value=false
  store.test_prototype_id=ad_lib_test.value
  store.sequence_no=-1
  selectable_test_prototypes.value=[]
  await begin()
}


async function search_schedule(){
  try {
    const now = new Date().getTime()
    const entries: SchedulePrototype<'device'>['phases'][number]['spec']['tests'] = []
    for (const phase of store.schedule!.phases){
      for (const test of phase.spec.tests){
        entries.push(test)
      }
    }
    find_date:{
      for (const ts of entries){
        const [date_s, time_s, timezone_s] = ts.formal_timestamp.split(' ')
        let [year_i, month_i, day_i] = date_s.split('/').map(d=>parseInt(d))
        month_i = month_i-1
        const [hour_i, minute_i] = time_s.split(':').map(t=>parseInt(t))
        const ts_start = new Date(year_i, month_i, day_i, hour_i, minute_i).getTime()
        const diff = now-ts_start
        //Tests may be taken up to two days late 
        if (diff > 0 && diff < (86400*1000*2) && !(ts.attempted)){
          store.test_prototype_id=ts.prototype_selection.test_prototype_id
          store.sequence_no = ts.sequence_no
          store.current_test_prototype = ts
          break find_date
        }
      }
      if (store.schedule!.default_selection){
        const ds =store.schedule!.default_selection

        if (ds.type==='fixed'){
          store.test_prototype_id = ds.test_prototype_id
          store.sequence_no = -1
        } else if (ds.type==='random'){
          store.test_prototype_id = ds.test_prototype_ids[Math.floor(Math.random() * ds.test_prototype_ids.length)]
          store.sequence_no = -1 
        } else if (ds.type==='choose'){
          selectable_test_prototypes.value = ds.test_prototype_ids
          is_open.value = true
        }
        return

      } else {
        throw 'no test scheduled for today'
      }

    }
    store.taking_scheduled = true
    await begin()
  } catch (error){
    console.log(error)
    if (error === 'no test scheduled for today'){
      alert('No test scheduled for today.')
    } else{
      alert('An internal error occurred')
    }
  }
}

async function begin(){
    store.schedule_id = crypto.randomUUID()
    console.log('before read file')
    const metadata = await Filesystem.readFile({
      path: `testprototypes/${store.test_prototype_id}/metadata.json`,
      directory: Directory.External,
      encoding: Encoding.UTF8
    })
    const tp: TestPrototype = JSON.parse(metadata.data.toString())
    const breakpoints = tp.stimuli.map(
      (s, i) => [s,i] as [Stimulus, number]).filter(
      ([s,i])=> s.type === 'breakpoint').map(
      ([s,i]) =>i
    )
    if (tp.randomized){
      store.randomization_order = shuffle(breakpoints)
      await save_encrypt_message_response(
            {
                name: `randomization_report.json`,
                body: JSON.stringify(store.randomization_order),
                format:'string'
            }, 
            store.schedule_id, store.salsaid, store.test_prototype_id, store.sequence_no,
            store.public_key
        )
    } else{
      store.randomization_order = breakpoints.reverse()
    }
    store.todays_test_prototype = tp
    store.current_component='TestPrototype'
}

</script>


