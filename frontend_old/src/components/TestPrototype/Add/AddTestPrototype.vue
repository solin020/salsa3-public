<template>
    <j-breadcrumbs 
        :tabnames="['metadata', 'stimuli', 'submit']"
        :enableds="enableds"
    >
        <template #header_metadata>Configuration</template>
        <template #content_metadata>
            <v-container fluid>
                <v-row>
                    <v-col cols="12" lg="6">
                        <v-card style="height:100%">
                            <v-card-title>
                                Settings
                            </v-card-title>
                            <v-text-field
                                v-model="my.id" label="Enter test prototype's name" :rules="[id_regex_test, unique_test_prototype_id]"/>
                            <v-checkbox
                                v-model="my.randomized" label="Randomize order of stimuli at breakpoints?"/>
                        </v-card>
                    </v-col>
                    <v-col cols="12" lg="6">
                        <v-card style="height:100%">
                            <v-card-title>
                                Randomization Groups:
                            </v-card-title>
                            <v-card-text>
                            <span class="j-tooltip">
                                ⓘ
                                <v-tooltip activator="parent" location="top">
                                    <p>When using the test prototype randomization feature in the scheduler,</p>
                                    <p>
                                        you are required to select a group of test prototypes to randomly
                                        sample from.
                                    </p>
                                    <p>
                                        Here, you can list what groups this particular
                                        test prototype should belong to.
                                    </p>
                                </v-tooltip>
                            </span>
                                <v-chip v-for="g in my.groups">
                                    <ruby style="ruby-position:under;">
                                        {{ g }}
                                        <rt
                                          @click="my.groups.splice(my.groups.indexOf(g), 1)"
                                          style="cursor:pointer;"
                                        >
                                          ❌
                                        </rt>
                                    </ruby>
                                </v-chip>
                                <br/>
                                <v-combobox
                                    v-model="new_group"
                                    label="Enter group name"
                                    :items="groups"
                                    :rules="[id_regex_test]"
                                    />
                                <br/>
                                <v-btn @click="my.groups.push(new_group)">Add group</v-btn>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-container>
        </template>
        <template #header_stimuli>Edit stimuli</template>
        <template #content_stimuli>
            <j-list 
                :items="my.stimuli" :mime_methods="upload_mime_methods"
                :is_special="is_special"
                >
                <template #preamble>
                    <h2>Drag stimuli files below or add manually</h2>
                </template>
                <template #renderer="{item:stim}">
                    <div class="j_icont">
                        <div class="j_imain">
                            <AddImage :my="stim" v-if="stim.type==='image'"/>
                            <AddVideo :my="stim" v-else-if="stim.type==='video'"/>
                            <AddRecording :my="stim" v-else-if="stim.type==='recording'"/>
                            <AddEma :my="stim" v-else-if="stim.type==='ema'"/>
                            <AddAudio :my="stim" v-if="stim.type==='audio'"/>
                            <div v-if="stim.type==='breakpoint'"><h1>Breakpoint {{ stim.id }}</h1></div>
                        </div>
                        <div class="j_idelete">
                            <v-btn @click="delete_stim(stim)">Delete stimulus {{ stim.id }}</v-btn>
                        </div>
                    </div>
                </template>
                <template #postamble>
                    <span class="j-tooltip">
                            ⓘ
                            <v-tooltip activator="parent" location="top">
                                <p>
                                    An Test prototype consists of a list of screens that play
                                    on the participant's phone in order. These screens are termed
                                    <em>stimuli</em>.
                                </p>
                                <ul>
                                    <li>
                                        <p>The <em>image</em> stimulus displays an image.</p>
                                    </li>
                                    <li>
                                        <p>The <em>video</em> plays a video.</p>
                                    </li>
                                    <li>
                                        <p>The <em>audio</em> stimulus plays an audio recording</p>
                                    </li>
                                    <li>
                                        <p>
                                            The <em>recording</em> stimulus displays microphone controls to make a recording
                                            on the participant's phone. Alternatively, these controls can be hidden
                                            and the recording done automatically.
                                        </p>
                                    </li>
                                    <li>
                                        <p>
                                            The <em>ema</em> stimulus is used to create an ema questionnaire. It itself
                                            expands into a list of screens of the individual questions.
                                        </p>
                                    </li>
                                    <li>
                                        <p>
                                            The <em>breakpoint</em> stimulus is not actually a screen, but is instead placed
                                            before any stimulus that logically can occur at the beginning of a test prototype.
                                        </p>
                                        <p2>It is used to indicate logical segments of the test prototype for the randomization feature. </p2>
                                        <p>There must be a breakpoint placed <em>before</em> the first stimulus every reorderable segment.</p>
                                    </li>
                                </ul>
                            </v-tooltip>
                        </span>
                    <br/>
                    <span>
                        <v-select v-model="StimulusType" label="Stimulus type" :items="['audio', 'video', 'image', 'recording', 'ema', 'breakpoint']"/>
                        <v-btn @click="add_stim()">Add stimulus ➕</v-btn>
                    </span>
                </template>
            </j-list>
        </template>
        <template #header_submit>Submit</template>
        <template #content_submit>
            <j-btn :click="submit_test_prototype" :arg0="null" :disabled="not_has_stimuli">Upload test prototype {{ my.id }}</j-btn>
        </template>
    </j-breadcrumbs>
</template>
<script setup lang="ts">
import AddEma from '@/components/TestPrototype/Add/AddEma.vue'
import AddRecording from '@/components/TestPrototype/Add/AddRecording.vue'
import AddAudio from '@/components/TestPrototype/Add/AddAudio.vue'
import AddImage from '@/components/TestPrototype/Add/AddImage.vue'
import AddVideo from '@/components/TestPrototype/Add/AddVideo.vue'
import {type Ema as EmaType, type Image as ImageType, type Audio as AudioType, 
        type Video as VideoType, type Recording as RecordingType, type TestPrototype as TestPrototypeType,
        type VideoRecording as VideoRecordingType, type PictureCapture as PictureCaptureType,
        type Stimulus as StimulusType} from '@/types'
import JList from '@/components/JList.vue'
import JBtn from '@/components/JBtn.vue'
import {ref, type Ref, inject, computed, type ComputedRef, reactive}from 'vue'
import { project_key, 
         test_prototypes_key, 
         reload_test_prototypes_key, 
         groups_key,
         reload_groups_key } from '@/injectkeys'
import { id_regex_test } from '@/regexes'
import JBreadcrumbs from '../../JBreadcrumbs.vue'


const test_prototypes = inject(test_prototypes_key)!
const reload_test_prototypes = inject(reload_test_prototypes_key)!
const groups = inject(groups_key)!
const reload_groups = inject(reload_groups_key)!


interface Props {
    my?:TestPrototypeType
    edit_existing?:boolean
}
const props = defineProps<Props>()

let my:TestPrototypeType = reactive({id:'', stimuli:[],  groups:[], randomized:false})
if (props.my){
    my = props.my
}
function reset(){
    alert(`Test prototype ${my.id} uploaded succesfully!`)
    console.log('tried reset')
    my.stimuli = []
    my.id = ''
    my.groups=[]
}

const id_maker = function*(){
    let i = 1
    while(true){
        yield i
        i+=1
    }
}()


const project = inject(project_key)!
const new_group = ref('')
function delete_stim(stim:StimulusType){
    my.stimuli.splice(my.stimuli.indexOf(stim), 1)
}
const StimulusType = ref("")
function add_stim(){
    const type = StimulusType.value
    const id = `${type}_${id_maker.next().value}`
    const uri = ''
    const autoadvance = false
    const duration = 0
    const file: File[] = []
    if (type==='audio'){
        my.stimuli.push({
            type,
            id,
            uri,
            autoadvance,
            duration,
            file
        })
    }
    else if (type==='video'){
        my.stimuli.push({
            type,
            id,
            uri,
            autoadvance,
            duration,
            file
        })
    }
    else if (type==='image'){
        my.stimuli.push({
            type,
            id,
            uri,
            autoadvance,
            duration,
            file
        })
    }
    else if (type==='ema'){
        my.stimuli.push({
            type,
            id,
            form:[]
        })
    }
    else if (type==='recording'){
        my.stimuli.push({
            type,
            id,
            autoadvance,
            duration,
        })
    }
    else if (type==='breakpoint'){
        my.stimuli.push({type,id})
    }
}
function accept_image(f:File, idx:number){
    const new_stimulus:ImageType = {
        id: f.name,
        type:'image',
        uri:f.name,
        file:[f],
        autoadvance:false,
        duration:0
    }
    if (idx===-1){
        my.stimuli.push(new_stimulus)
    } else{
        my.stimuli
        my.stimuli.splice(idx,0, new_stimulus)
    }
}
function accept_video(f:File, idx:number){
    const new_stimulus:VideoType = {
        id: f.name,
        type:'video',
        uri:f.name,
        file:[f],
        autoadvance:false,
        duration:0
    }
    if (idx===-1){
        my.stimuli.push(new_stimulus)
    } else{
        my.stimuli
        my.stimuli.splice(idx,0, new_stimulus)
    }
}
function accept_audio(f:File, idx:number){
    const new_stimulus:AudioType = {
        id: f.name,
        type:'audio',
        uri:f.name,
        file:[f],
        autoadvance:false,
        duration:0
    }
    if (idx===-1){
        my.stimuli.push(new_stimulus)
    } else{
        my.stimuli
        my.stimuli.splice(idx,0, new_stimulus)
    }
}
const upload_mime_methods = new Map()
upload_mime_methods.set('image/png', accept_image)
upload_mime_methods.set('image/jpeg', accept_image)
upload_mime_methods.set('audio/wav', accept_audio)
upload_mime_methods.set('video/mp4', accept_video)



function stimulus_id_is_unique(sid:string){
    return !(my.stimuli.map(s => s.id).includes(sid))|| "Stimulus id must be unique"
}

function unique_test_prototype_id(sid:string){
    return !(test_prototypes.value.map(s => s.id).includes(sid))|| 'Test prototype must have a unique id'
}

const test_prototype_id_ready = computed(()=>{
    return Boolean(my.id) && (props.edit_existing || !(test_prototypes.value.map(s => s.id).includes(my.id)))
})




const not_has_stimuli = computed(() => !(my.stimuli.length>0))

const enableds: Ref<boolean>[] = [
    test_prototype_id_ready,
    ref(true),
    ref(true)
]

async function submit_test_prototype(){
    const fdata = new FormData()
    const json_obj = []
    for (let s of my.stimuli){
        if (s.type === 'image' || s.type === 'video' || s.type === 'audio'){
            fdata.append(s.file[0].name, s.file[0])
            const {file:_, ...pushval} = s
            json_obj.push(pushval)
        } else {
            json_obj.push(s)
        }
    }
    console.log('json_obj', json_obj)
    fdata.append('metadata.json', JSON.stringify(json_obj))

    const response = fetch('/salsa/server/add-test-prototype?' + new URLSearchParams({
        project: project,
        id: my.id,
        groups: JSON.stringify(my.groups),
        randomized:String(my.randomized)
    }), {
        method:'POST',
        body:fdata
    })
    response.then(() => reload_test_prototypes(), reload_groups())
    response.then(() => reset())
    return response
}

function is_special(s:StimulusType){
    return s.type==='breakpoint'
}

</script>
<style src="@/css/jview.css"/>
<style>
.ipt{
    background-color: white;
    border: solid black;
}
.btn {
    background-color: grey;
    &:hover{
        border: inset 3px black;
    }
}
</style>