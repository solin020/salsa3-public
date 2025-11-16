<template>
    <layout>
        <template v-slot:content>
            <ion-card v-if="show_uploads">
                <ion-card-header>
                    <ion-card-title>Uploads</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                    <ion-list>
                        <ion-item v-if="store.uploading_flag">
                            <ion-progress-bar :value="store.progress" ></ion-progress-bar>
                            <ion-text color="secondary">{{ store.upload_message }} uploads complete</ion-text>
                        </ion-item>
                        <ion-item v-else>
                            <ion-text>{{ store.initial_message}}</ion-text>
                        </ion-item>
                        <ion-item v-for="u in store.uploads">
                            <ion-text>{{ u.name }} {{ u.date.toLocaleDateString() }}</ion-text>
                        </ion-item>
                    </ion-list>
                </ion-card-content>
            </ion-card>
            <ion-card v-else>
                <ion-card-title>Retrieving files...</ion-card-title>
                <ion-card-content>
                    <ion-progress-bar type="indeterminate"/>
                </ion-card-content>
            </ion-card>
        </template>
        <template v-slot:footer>
            <ion-button @click="store.upload()" size="large" v-if="!store.uploading_flag && store.uploads_total>0">Press to upload test results</ion-button>
            <ion-text @click="store.upload()" size="large" v-else-if="store.uploads_total===0">No files to upload at this time</ion-text>
        </template>
    </layout>
</template>
<script setup lang="ts">
import {IonButton, IonList, IonText,IonCard, IonCardContent,IonCardHeader, 
    IonCardTitle, IonProgressBar, IonItem} from '@ionic/vue'
import Layout from './Layout.vue'
import {Filesystem, Directory, Encoding} from '@capacitor/filesystem'
import {ref, type Ref, computed} from 'vue'
import { salsaStore } from '../store'

console.log('Uploads setup called')

const store = salsaStore()




const show_uploads = ref(false)
store.update_uploads().then( () =>{
    store.uploads_total = store.uploads.length
    show_uploads.value=true
})



</script>