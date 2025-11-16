<template>
    <div>
        <div v-if="my">
            <div v-if="edit_mode">
                <v-btn @click="edit_mode=false">View this test prototype</v-btn>
                <add-test-prototype :my="my" :edit_existing="true"/>
            </div>
            <div v-else>
                <div>
                    <v-card>
                        <v-card-title>Groups:</v-card-title>
                        <v-card-text>
                            <v-list>
                                <v-list-item v-for="g in props.tp.groups">{{g}}</v-list-item>
                            </v-list>
                        </v-card-text>
                    </v-card>
                </div>
                <div>
                    <v-btn @click="edit_mode=true">Edit this test prototype</v-btn>
                </div>
                <div>
                    <v-btn @click="simulate_test()">Open test simulation window</v-btn>
                </div>
                <div v-if="test_ready">
			<h1>Not implemented</h1>
                </div>
            </div>
        </div>
        <div v-else>
            <v-progress-circular indeterminate/>
        </div>
    </div>
</template>
<script setup lang="ts">
import AddTestPrototype from '../Add/AddTestPrototype.vue'
import {type Ema as EmaType, type Image as ImageType, type Audio as AudioType, 
        type Video as VideoType, type Recording as RecordingType, type TestPrototype as TestPrototypeType,
    type Stimulus as StimType, type TestPrototypeMeta} from '@/types'
import {ref, type Ref, inject, provide, computed, type ComputedRef}from 'vue'
import { project_key, sim_test_prototype_id_key } from '@/injectkeys'
import { DefaultService } from '@/client'
import upload_message_response from '@/pgp'
import Popup from '@/components/Popup.vue'
import JBtn from '@/components/JBtn.vue'


console.log('test prototype setup')
const active_idx = ref(0)


interface Props{
    tp: TestPrototypeMeta
}
const props = defineProps<Props>()
const project = inject(project_key)!
const my:Ref<TestPrototypeType|null> = ref(null)

const upload_files: Ref<File[]> = ref([])
const current_stimulus:ComputedRef<StimType|undefined> = computed(() =>{
    if(my.value){
        return my.value.stimuli[active_idx.value]
    }
})
const edit_mode = ref(false)
//This exceedingly nasty code loads all of the test prototype's files into the browser
DefaultService.getTestPrototypeFilesSalsaServerGetTestPrototypeFilesGet(props.tp.id).then((pathlist) => {
        const full_pathlist = pathlist.map(
            filepath => ('/salsa/server/get-test-prototype-file?' + (new URLSearchParams({
                id:props.tp.id,
                filepath: filepath
            })).toString())
        )
        const metadatapath = full_pathlist.filter(s => s.endsWith('metadata.json'))[0]

        fetch(metadatapath).then( r=> r.json()).then( s=>{
            let tp: TestPrototypeType = s
            let filecount = 0
            for (let i=0; i<tp.stimuli.length;i++){
                const stim = tp.stimuli[i]
                if (['image', 'video', 'audio'].includes(stim.type)){
                    // @ts-expect-error
                    const this_stim: (ImageType|VideoType|AudioType) = stim

                    const filepath = full_pathlist.filter(s => s.endsWith(this_stim.uri))[0]
                    fetch(filepath).then(r => r.blob()).then( b=>{
                        console.log(filepath, 'filepath retrieved')
                        this_stim.file = [new File([b], this_stim.uri)]
                        filecount += 1
                        if(filecount===full_pathlist.length-1){
                            my.value = tp
                        }
                    })
                }
            }
            //if the test prototype has no media (for example if there is only an ema questionnaire)
            if (full_pathlist.length === 1){
                my.value = tp
            }
        })
    }
)

const test_ready=ref(false)
async function simulate_test(){
    const dbs = await window.indexedDB.databases()
    dbs.forEach(db => { window.indexedDB.deleteDatabase(db.name!) })
    test_ready.value=true
}

//@ts-expect-error
window.embed_test_prototype_id = props.tp.id

</script>
