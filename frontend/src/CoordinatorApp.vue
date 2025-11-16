<template>
    <v-app>
        <v-app-bar style="background-image: var(--salsablue); color: white; background-repeat:no-repeat; filter: none; text-shadow: 0 -1px 0 rgba(0,0,0,0.3);">
            <v-app-bar-title>Salsa 3 Coordinator Interface for {{ email }}</v-app-bar-title>
            <v-btn @click="change_password">Change your password</v-btn>
        </v-app-bar>
        <v-main>
            <br/>
            <v-select style="display:inline-block; width:30rem;" label="Choose project" :items="projects" v-model="current_project"/>
            <CoordinatorProject :projectname="current_project" v-if="current_project" :key="current_project"/>
        </v-main>
    </v-app>
    <Password mode="update" ref="updatePassword"/>
</template>
<script lang="ts" setup>
import {DefaultService} from '@/client'
import CoordinatorProject from '@/components/CoordinatorProject.vue'
import Password from './Password.vue'
import {ref, type Ref, provide, watch} from 'vue'
import {coordinator_id_key} from './injectkeys'

const projects: Ref<string[]> = ref([])
const current_project = ref("")


const email = ref("")
const updatePassword = ref<InstanceType<typeof Password>|null>(null)
async function change_password(){
    const updateInfo = await updatePassword.value!.update_password()
    if (updateInfo){
        fetch('/salsa/server/update-coordinator-password?'+ new URLSearchParams({
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


watch(current_project, async (newProject, oldProject) => {
  console.log('new project', newProject, oldProject)
})
DefaultService.getYourEmailSalsaServerApiGetYourEmailGet().then(r => {
    email.value = r
    provide(coordinator_id_key, r)
    //@ts-expect-error
    window.embed_coordinator_id = r
}).then ( q => 
    DefaultService.coordinatorGetProjectsSalsaServerApiCoordinatorGetProjectsGet().then(
        p => {
            projects.value = p
            current_project.value = p[0]
        }
    )
)

</script>
