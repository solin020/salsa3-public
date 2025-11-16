<template>
    <v-app>
        <v-app-bar style="background-image: var(--salsablue); color: white; background-repeat:no-repeat; filter: none; text-shadow: 0 -1px 0 rgba(0,0,0,0.3);">
            <v-app-bar-title>Salsa 2 Coordinator Interface for {{ email }}</v-app-bar-title>
        </v-app-bar>
        <v-main>
            <br/>
            <v-select style="display:inline-block; width:30rem;" label="Choose project" :items="projects" v-model="current_project"/>
            <CoordinatorProject :projectname="current_project" v-if="current_project"/>
        </v-main>
    </v-app>
</template>
<script lang="ts" setup>
import {DefaultService} from '@/client'
import CoordinatorProject from '@/components/CoordinatorProject.vue'
import {ref, type Ref, provide} from 'vue'
import {coordinator_id_key} from './injectkeys'

const projects: Ref<string[]> = ref([])
const current_project = ref("")
const email = ref("")
DefaultService.getYourEmailSalsaServerApiGetYourEmailGet().then(r => {
    email.value = r
    provide(coordinator_id_key, r)
    //@ts-expect-error
    window.embed_coordinator_id = r
}).then ( q => 
    DefaultService.coordinatorGetProjectsSalsaServerApiCoordinatorGetProjectsGet().then(
        p => projects.value = p
    )
)

</script>
