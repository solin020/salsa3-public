<template>
    <v-app>
        <v-app-bar style="background-image: var(--salsablue); color: white; background-repeat:no-repeat; filter: none; text-shadow: 0 -1px 0 rgba(0,0,0,0.3);">
            <v-app-bar-title>Salsa 2 Adminstrator interface for {{ email }}</v-app-bar-title>
            <v-btn @click="change_password" style="color:black; background-color:white;">Change your password</v-btn>
        </v-app-bar>
        <v-main>
            <j-tabs :tabnames="['admins', 'coordinators', 'config']">
                <template #header_admins> View admins </template>
                <template #content_admins>
                    <j-list :items="admins" :fixed_order="true" :uneditable="true">
                        <template #preamble>
                            <h2>Admins::</h2>
                        </template>
                        <template #renderer="{item:admin}">
                            <v-card>
                                <v-card-title>{{admin.id}}</v-card-title>
                                <v-card-actions>
                                    <j-btn :click="delete_admin" :arg0="{admin:admin.id}">Revoke admin privileges from {{admin.id}}</j-btn>
                                </v-card-actions>
                            </v-card>
                        </template>
                        <template #postamble>
                            <v-card>
                                <v-card-title>Add a new admin</v-card-title>
                                <v-card-text>
                                    <v-text-field :rules="[outer_admin_regex_text]" v-model="new_admin" label="admin email"/>
                                </v-card-text>
                                <v-card-actions>
                                    <v-btn @click="add_admin" :arg0="undefined" :disabled="!admin_ok">Add admin</v-btn>
                                </v-card-actions>
                            </v-card>
                        </template>
                    </j-list>
                </template>
                <template #header_coordinators> View coordinators </template>
                <template #content_coordinators>
                    <j-list :items="coordinators" :fixed_order="true" :uneditable="true">
                        <template #preamble>
                            View Existing Coordinators (click to edit):
                        </template>
                        <template #renderer="{item:coordinator}">
                            <v-card>
                                <v-card-title>Coordinator Project Assignments</v-card-title>
                                <v-card-text>
                                    <v-card color="indigo" variant="outlined">
                                        <v-card-title>{{ coordinator.id }}'s existing projects </v-card-title>
                                        <v-card-actions>
                                            <j-btn v-for="project in coordinator.projects" :click="delete_coordinator_project" :arg0="{id:coordinator.id, project}">
                                                Remove <code>{{ coordinator.id }}</code> from project {{ project }}
                                            </j-btn>
                                            <j-btn :click="change_coordinator_password" :arg0="{id:coordinator.id}">
                                                Change password for <code>{{ coordinator.id }}</code>
                                            </j-btn>
                                            <j-btn :click="delete_coordinator" :arg0="{id:coordinator.id}">
                                                Delete coordinator <code>{{ coordinator.id }}</code>
                                            </j-btn>
                                        </v-card-actions>
                                    </v-card>
                                    <v-card color="indigo" variant="outlined">
                                        <v-card-title>Add <code>{{ coordinator.id }}</code> to another project</v-card-title>
                                        <v-card-text>
                                            <v-combobox :items="projects" label='New project name' :rules="[id_regex_test]" v-model="existing_coordinator_project"/>
                                        </v-card-text>
                                        <v-card-actions>
                                            <j-btn :click="add_existing_coordinator" :arg0="{id:coordinator.id}">Add <code>{{ coordinator.id }}</code> to  project: <code>{{existing_coordinator_project}}</code></j-btn>
                                        </v-card-actions>
                                    </v-card>
                                </v-card-text>
                            </v-card>
                        </template>
                        <template #postamble>
                            <v-card>
                                <v-card-title>Add a new coordinator</v-card-title>
                                <v-card-text>
                                    <v-text-field :rules="[outer_coordinator_regex_text]" label="New Coordinator email" v-model="new_coordinator_id"/>
                                    <br/>
                                    <v-combobox :items="projects"  label="New coordinator's project"  v-model="new_coordinator_project"/>
                                </v-card-text>
                                <v-card-actions>
                                    <j-btn :click="add_coordinator" :disabled="!coordinator_ok" :arg0="{}">Add new coordinator to project: {{ new_coordinator_project }}</j-btn>
                                </v-card-actions>
                            </v-card>
                        </template>
                    </j-list>
                </template>
                <template #header_config>
                    Update configuration
                </template>
                <template #content_config>
                    <v-card>
                        <v-card-title>Config parameters</v-card-title>
                        <v-card-text>
                            <v-list>
                                <v-list-item>
                                    <v-text-field v-model="new_tts_url" label="Text to Speech URL"/>
                                    <j-btn :click="set_config" :arg0="{varname:'tts_url', varval:new_tts_url}">Change Text to Speech URL</j-btn>
                                </v-list-item>
                                <v-list-item>
                                    <v-select v-model="new_tts_type" :items="['self-hosted', 'openai']" label="TTS type"/>
                                    <j-btn :click="set_config" :arg0="{varname:'tts_type', varval:new_tts_type}">Change Text to Speech type</j-btn>
                                </v-list-item>
                                <v-list-item>
                                    <v-text-field v-model="new_tts_model" label="TTS model name"/>
                                    <j-btn :click="set_config" :arg0="{varname:'tts_model', varval:new_tts_model}">Change Text to Speech model name</j-btn>
                                </v-list-item>
                                <v-list-item>
                                    <v-text-field v-model="new_stt_url" label="Speech to Text URL"/>
                                    <j-btn :click="set_config" :arg0="{varname:'stt_url', varval:new_stt_url}">Speech to Text URL</j-btn>
                                </v-list-item>
                                <v-list-item>
                                    <v-select v-model="new_stt_type" :items="['self-hosted', 'openai']" label="STT type"/>
                                    <j-btn :click="set_config" :arg0="{varname:'stt_type', varval:new_stt_type}">Change Speech to Text type</j-btn>
                                </v-list-item>
                                <v-list-item>
                                    <v-text-field v-model="new_stt_model" label="STT model name"/>
                                    <j-btn :click="set_config" :arg0="{varname:'stt_model', varval:new_stt_model}">Change Speech to Text model name</j-btn>
                                </v-list-item>
                                <v-list-item>
                                    <v-text-field v-model="new_public_url" label="Website URL"/>
                                    <j-btn :click="set_config" :arg0="{varname:'public_url', varval:new_public_url}">Change Website URL</j-btn>
                                </v-list-item>
                                <v-list-item>
                                    <v-text-field v-model="new_wss_url" label="Websocket URL"/>
                                    <j-btn :click="set_config" :arg0="{varname:'wss_url', varval:new_wss_url}">Change Websocket URL</j-btn>
                                </v-list-item>
                                <v-list-item>
                                    <v-text-field v-model="new_ollama_url" label="Ollama Instance URL"/>
                                    <j-btn :click="set_config" :arg0="{varname:'ollama_url', varval:new_ollama_url}">Change Ollama Instance URL</j-btn>
                                </v-list-item>
                                <v-list-item>
                                    <v-select v-model="new_llm_type" :items="['ollama', 'openai']" label="LLM type"/>
                                    <j-btn :click="set_config" :arg0="{varname:'llm_type', varval:new_llm_type}">Change LLM type</j-btn>
                                </v-list-item>
                                <v-list-item>
                                    <v-text-field v-model="new_llm_model" label="LLM Model Name"/>
                                    <j-btn :click="set_config" :arg0="{varname:'llm_model', varval:new_llm_model}">Change LLM Model Name</j-btn>
                                </v-list-item>
                                <v-list-item>
                                    <v-text-field v-model="new_gpg_key_name" label="GPG key name"/>
                                    <j-btn :click="set_config" :arg0="{varname:'gpg_key_name', varval:new_gpg_key_name}">Change GPG key name</j-btn>
                                </v-list-item>
                                <v-list-item>
                                    <v-text-field v-model="new_gpg_passphrase" label="GPG key passphrase"/>
                                    <j-btn :click="set_config" :arg0="{varname:'gpg_passphrase', varval:new_gpg_passphrase}">Change GPG key passphrase</j-btn>
                                </v-list-item>
                                <v-list-item>
                                    <v-text-field v-model="new_api_key" label="Openai key"/>
                                    <j-btn :click="set_config" :arg0="{varname:'api_key', varval:new_api_key}">Change Openai key</j-btn>
                                </v-list-item>
                            </v-list>
                        </v-card-text>
                    </v-card>
                </template>
            </j-tabs>
            <Password mode="new" ref="passwordEntry"/>
            <Password mode="update" ref="updatePassword"/>
        </v-main>
    </v-app>
</template>
<script lang="ts" setup>
import {DefaultService, type Coordinator, type Annotator, type Participant} from './client'
import {ref, type Ref, watch} from 'vue'
import JBtn from './components/JBtn.vue'
import JTabs from './components/JTabs.vue'
import JList from './components/JList.vue'
import Password from './Password.vue'
import { id_regex_test } from './regexes'

const admins: Ref<{id:string}[]> = ref([])
const coordinators: Ref<Coordinator[]> = ref([])
const projects: Ref<string[]> = ref([])
const new_admin = ref("")
const new_coordinator_id = ref("")
const new_coordinator_project = ref("")
const existing_coordinator_project = ref("")
const admin_ok = ref(false)
const passwordEntry = ref<InstanceType<typeof Password> | null>(null)
const updatePassword = ref<InstanceType<typeof Password> | null>(null)

async function change_password(){
    const updateInfo = await updatePassword.value!.update_password()
    if (updateInfo){
        fetch('/salsa/server/update-admin-password?'+ new URLSearchParams({
            'id': email.value,
            'old_password':updateInfo.oldPassword,
            'new_password': updateInfo.newPassword,

        }), {method:'POST'}).then((res)=>{
                if (!res.ok) {
                    throw new Error(``);
                }
            alert('Please reload webpage to login with new password.')
        }).catch(()=>alert('password update failed.'))
    }
}

function outer_admin_regex_text(s:string){
    const retval = id_regex_test(s)
    if (retval===true){
        admin_ok.value = true
    } else{
        admin_ok.value = false
    }
    return retval
}
const coordinator_ok = ref(false)
function outer_coordinator_regex_text(s:string){
    const retval = id_regex_test(s)
    if (retval===true){
        coordinator_ok.value = true
    } else{
        coordinator_ok.value = false
    }
    return retval
}

const new_tts_url = ref('')
const new_stt_url = ref('')
const new_ollama_url = ref('')
const new_public_url = ref('')
const new_wss_url = ref('')
const new_llm_model = ref('')
const new_api_key = ref('')
const new_tts_type = ref<'self-hosted'|'openai'>('self-hosted')
const new_stt_type = ref<'self-hosted'|'openai'>('self-hosted')
const new_llm_type = ref<'ollama'|'openai'>('ollama')
const new_stt_model = ref('')
const new_tts_model = ref('')
const new_gpg_key_name = ref('')
const new_gpg_passphrase = ref('')

type ConfigType = {
    tts_url:string
    stt_url :string
    ollama_url:string
    public_url:string
    wss_url:string
    llm_model:string
    api_key:string
    tts_type:'self-hosted'|'openai'
    stt_type:'self-hosted'|'openai'
    llm_type:'ollama'|'openai'
    stt_model:string
    tts_model:string
    gpg_key_name:string
    gpg_passphrase:string

}




async function reload_config(){
    const config_params: ConfigType = await (await fetch('/salsa/server/admin/get-config').then(r => r.json()))
    new_tts_url.value = config_params.tts_url
    new_stt_url.value = config_params.stt_url
    new_ollama_url.value = config_params.ollama_url
    new_public_url.value = config_params.public_url
    new_wss_url.value = config_params.wss_url
    new_llm_model.value = config_params.llm_model
    new_api_key.value = config_params.api_key
    new_llm_type.value = config_params.llm_type
    new_stt_type.value = config_params.stt_type
    new_tts_type.value = config_params.tts_type
    new_stt_model.value = config_params.stt_model
    new_tts_model.value = config_params.tts_model
    new_gpg_key_name.value = config_params.gpg_key_name
    new_gpg_passphrase.value = config_params.gpg_passphrase
}
reload_config()
async function set_config(arg0:{varname: keyof ConfigType, varval: string}){
    const retval = await fetch('/salsa/server/admin/set-config?' + new URLSearchParams({...arg0}), {method:'POST'})
    await reload_config()
    return retval
}


const email = ref("")
DefaultService.getYourEmailSalsaServerApiGetYourEmailGet().then(
    r => email.value = r
)

function reload_projects(){
    DefaultService.adminGetProjectsSalsaServerApiAdminGetProjectsGet().then(
        r => projects.value=Array.from(new Set(r))
    )
}
reload_projects()

function reload_admins(){
    DefaultService.getAdminsSalsaServerApiGetAdminsGet().then(
        r => admins.value=r.map(id => ({id}))
    )
}
reload_admins()

async function add_admin(){
    const password = await passwordEntry.value!.get_password()
    if(password){
    const response = fetch('/salsa/server/api/add-admin?' + 
        new URLSearchParams({id:new_admin.value, password}),
        {method:'POST'}
    )
    response.then(() => reload_admins()).catch((r)=>{alert(r)})
    }
}

function delete_admin(arg0:{admin:string}){
    if (!(window.confirm(`Are you sure you want to delete ${arg0.admin}?`))){
        throw 'Delete admin cancelled.'
    }
    const response = fetch(
        '/salsa/server/api/delete-admin?' + 
        new URLSearchParams({id:arg0.admin}),
        {method: 'DELETE'}
    )
    response.then(() => reload_admins())
    return response
}
async function change_coordinator_password(arg0:{id:string}){
    const password = await passwordEntry.value!.get_password()
    if(password){
    const response = fetch('/salsa/server/admin-change-coordinator-password?' + 
        new URLSearchParams({id:arg0.id, password}),
        {method:'POST'}
    )
    return response
    } else{
        throw 'Change coordinator password cancelled.'
    }
}

function delete_coordinator(arg0:{id:string}){
    if (!(window.confirm(`Are you sure you want to delete ${arg0.id}?`))){
        throw 'Delete coordinator cancelled.'
    }
    const response = fetch(
        '/salsa/server/api/delete-coordinator?' + 
        new URLSearchParams({id:arg0.id}),
        {method: 'DELETE'}
    )
    response.then(() => reload_admins())
    return response
}
async function add_existing_coordinator(arg0:{id:string}){
    return fetch('/salsa/server/add-coordinator-project?' + new URLSearchParams({
        id:arg0.id,
        project:existing_coordinator_project.value
    }), {method:'POST'})

}

function reload_coordinators(){
    DefaultService.getCoordinatorsSalsaServerApiGetCoordinatorsGet().then(
        r => coordinators.value=r
    )
}
reload_coordinators()

async function add_coordinator(arg0:{}){
    const password = await passwordEntry.value!.get_password()
    if(!password){throw 'Add coordinator cancelled.'}
    const response = fetch(
        '/salsa/server/add-coordinator?' + 
        new URLSearchParams({
            id:new_coordinator_id.value,
            project:new_coordinator_project.value,
            password
        }),
        {method:'POST'}
    )
    response.then(
        () => reload_coordinators()
    )
    return response
}



function delete_coordinator_project(arg0:{id:string, project:string}){
    if (!(window.confirm(`Are you sure you want to remove ${arg0.project} from ${arg0.id}?`))){
        throw 'Delete coordinator from project cancelled.'
    }
    const response = fetch('/salsa/server/delete-coordinator-project?' + 
        new URLSearchParams({...arg0}), 
        {method:'DELETE'}
    )
    response.then(
        () => reload_coordinators()
    )
    return response
}
</script>
<style>

</style>
