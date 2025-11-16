<template>
    <v-app>
        <v-app-bar style="background-image: var(--salsablue); color: white; background-repeat:no-repeat; filter: none; text-shadow: 0 -1px 0 rgba(0,0,0,0.3);">
            <v-app-bar-title>Salsa 2 Adminstrator interface for {{ email }}</v-app-bar-title>
        </v-app-bar>
        <v-main>
            <j-tabs :tabnames="['admins', 'coordinators']">
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
                                    <v-text-field :rules="[id_regex_test]" v-model="new_admin" label="admin email"/>
                                </v-card-text>
                                <v-card-actions>
                                    <j-btn :click="add_admin" :arg0="undefined">Add admin</j-btn>
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
                                            <j-btn v-for="project in coordinator.projects" :click="delete_coordinator" :arg0="{id:coordinator.id, project}">
                                                Remove {{ coordinator.id }} from project {{ project }}
                                            </j-btn>
                                        </v-card-actions>
                                    </v-card>
                                    <v-card color="indigo" variant="outlined">
                                        <v-card-title>Add {{coordinator.id}} to another project</v-card-title>
                                        <v-card-text>
                                            <v-combobox :items="projects" label='New project name' :rules="[id_regex_test]" v-model="existing_coordinator_project"/>
                                        </v-card-text>
                                        <v-card-actions>
                                            <j-btn :click="add_existing_coordinator" :arg0="{id:coordinator.id}">Add {{ coordinator.id }} to  project: {{existing_coordinator_project}}</j-btn>
                                        </v-card-actions>
                                    </v-card>
                                </v-card-text>
                            </v-card>
                        </template>
                        <template #postamble>
                            <v-card>
                                <v-card-title>Add a new coordinator</v-card-title>
                                <v-card-text>
                                    <v-text-field :rules="[id_regex_test]" label="New Coordinator email" v-model="new_coordinator_id"/>
                                    <br/>
                                    <v-combobox :items="projects" :rules="[id_regex_test]" label="New coordinator's project"  v-model="new_coordinator_project"/>
                                </v-card-text>
                                <v-card-actions>
                                    <j-btn :click="add_coordinator" :arg0="{}">Add new coordinator to project: {{ new_coordinator_project }}</j-btn>
                                </v-card-actions>
                            </v-card>
                        </template>
                    </j-list>
                </template>
            </j-tabs>
        </v-main>
    </v-app>
</template>
<script lang="ts" setup>
import {DefaultService, type Coordinator, type Annotator, type Participant} from './client'
import {ref, type Ref} from 'vue'
import JBtn from './components/JBtn.vue'
import JTabs from './components/JTabs.vue'
import JList from './components/JList.vue'
import { id_regex_test } from './regexes'

const admins: Ref<{id:string}[]> = ref([])
const coordinators: Ref<Coordinator[]> = ref([])
const projects: Ref<string[]> = ref([])
const new_admin = ref("")
const new_coordinator_id = ref("")
const new_coordinator_project = ref("")
const existing_coordinator_project = ref("")

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

function add_admin(arg0:undefined){
    const response = fetch('/salsa/server/api/add-admin?' + 
        new URLSearchParams({id:new_admin.value}),
        {method:'POST'}
    )
    response.then(() => reload_admins())
    return response
}

function delete_admin(arg0:{admin:string}){
    const response = fetch(
        '/salsa/server/api/delete-admin?' + 
        new URLSearchParams({...arg0}),
        {method: 'DELETE'}
    )
    response.then(() => reload_admins())
    return response
}

function reload_coordinators(){
    DefaultService.getCoordinatorsSalsaServerApiGetCoordinatorsGet().then(
        r => coordinators.value=r
    )
}
reload_coordinators()

function add_coordinator(){
    const response = fetch(
        '/salsa/server/api/add-coordinator?' + 
        new URLSearchParams({
            id:new_coordinator_id.value,
            project:new_coordinator_project.value
        }),
        {method:'POST'}
    )
    response.then(
        () => reload_coordinators()
    )
    return response
}

function add_existing_coordinator(arg0:{id:string}){
    let response = fetch('/salsa/server/api/add-coordinator?' + 
        new URLSearchParams({...arg0}),
        {method:'POST'}
    )
    response.then(() => reload_coordinators())
    return response
}

function delete_coordinator(arg0:{id:string, project:string}){
    const response = fetch('/salsa/server/api/delete-coordinator?' + 
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
