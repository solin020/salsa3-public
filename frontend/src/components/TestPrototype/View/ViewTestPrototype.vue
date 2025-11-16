<template>
    <div>
        <div v-if="my">
            <div>
                <add-test-prototype :my="my" :edit_existing="true" :type="my.schedule_type"/>
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
//This exceedingly nasty code loads all of the test prototype's files into the browser
fetch('/salsa/server/get-test-prototype-files?' + new URLSearchParams({'id':props.tp.id, 'project':project})).then(r=>(r.json())).then((pathlist:string[]) => {
        const full_pathlist = pathlist.map(
            filepath => ('/salsa/server/get-test-prototype-file?' + (new URLSearchParams({
                id:props.tp.id,
                project: project,
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
                        console.log(full_pathlist, filecount)
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
