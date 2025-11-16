<template>
    <v-dialog v-model="password_dialog_open">
    <v-card v-if="props.mode==='new'">
        <v-card-title>Enter new password</v-card-title>
        <v-card-text>
            <v-list>
                <v-list-item>
                    <label for="pass">New Password</label>
                    <v-text-field :rules="[outer_password_regex_test]" v-model="password_enter" type="password"/>
                </v-list-item>
                <v-list-item>
                    <label for="pass2">Re-enter password</label>
                    <v-text-field  :rules="[password_match_test]" v-model="password_verify" type="password" id="pass2" name="password" minlength="8"/>
                </v-list-item>
                <v-list-item>
                    <v-btn @click="password_resolve(password_enter)" :disabled="!(password_first_check && password_second_check)">Finish</v-btn>
                </v-list-item>
                <v-list-item>
                    <v-btn @click="password_reject('Cancelled')">Cancel</v-btn>
                </v-list-item>
            </v-list>
        </v-card-text>
    </v-card>
    <v-card v-else="props.mode==='update'">
        <v-card-title>Update password</v-card-title>
        <v-card-text>
            <v-list>
                <v-list-item>
                    <label for="pass">Old Password</label>
                    <v-text-field v-model="old_password" type="password"/>
                </v-list-item>
                <v-list-item>
                    <label for="pass">New Password</label>
                    <v-text-field :rules="[outer_password_regex_test]" v-model="password_enter" type="password"/>
                </v-list-item>
                <v-list-item>
                    <label for="pass2">Re-enter new password</label>
                    <v-text-field  :rules="[password_match_test]" v-model="password_verify" type="password" id="pass2" name="password" minlength="8"/>
                </v-list-item>
                <v-list-item>
                    <v-btn @click="update_password_resolve({oldPassword:old_password, newPassword:password_enter})" :disabled="!(password_first_check && password_second_check)">Finish</v-btn>
                </v-list-item>
                <v-list-item>
                    <v-btn @click="password_reject('Cancelled')">Cancel</v-btn>
                </v-list-item>
            </v-list>
        </v-card-text>
    </v-card>
    </v-dialog>
</template>
<script setup lang="ts">
import {ref} from 'vue'
import {password_regex_test } from './regexes'


const props = defineProps<{mode:'new'|'update'}>()

const password_first_check = ref(false)
const password_second_check = ref(false)
const old_password = ref('')
const password_enter = ref('')
const password_verify = ref('')
const password_dialog_open = ref(false)
let password_promise : Promise<string>|null =null
let update_password_promise: Promise<{oldPassword:string, newPassword:string}>|null = null
let password_resolve : ((retval:string) => void) = (s:string)=>{}
let update_password_resolve: ((s:{oldPassword:string, newPassword:string})=>void) = (s:{oldPassword:string, newPassword:string})=>{}
let password_reject : ((reason:string) => void) = (s:string)=>{}
function password_match_test(s:string){
    const retval =  (s===password_enter.value)||'passwords do not match'
    if (retval === true){
        password_second_check.value = true
    } else{
        password_second_check.value = false
    }
    return retval
}
function outer_password_regex_test(s:string){
    const retval = password_regex_test(s)
    if (retval === true){
        password_first_check.value = true
    } else{
        password_first_check.value = false
    }
    return retval
}


async function get_password():Promise<string|undefined>{
    password_dialog_open.value = true
    password_promise = new Promise<string>((resolve, reject) =>{
        password_resolve = resolve
        password_reject = reject
    })
    let retval = undefined 
    try{
        retval = await password_promise
    } catch{
        
    } finally{
        password_dialog_open.value = false
        password_enter.value = ''
        password_verify.value = ''
        password_first_check.value = false
        password_second_check.value = false
        return retval
    }
}
async function update_password():Promise<{oldPassword:string, newPassword:string}|undefined>{
    password_dialog_open.value = true
    update_password_promise = new Promise<{oldPassword:string, newPassword:string}>((resolve, reject) =>{
        update_password_resolve = resolve
        password_reject = reject
    })
    let retval = undefined
    try{
        retval = await update_password_promise
    } catch{
        
    } finally{
        password_dialog_open.value = false
        password_enter.value = ''
        password_verify.value = ''
        old_password.value = ''
        password_first_check.value = false
        password_second_check.value = false
        return retval
    }
}
defineExpose({get_password, update_password})
</script>
