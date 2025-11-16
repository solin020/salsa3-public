<template>
    <ion-page>
        <ion-content overflow-scroll="true">
            <ion-card style="width:80vw;
                        max-height: 80vh;
                        overflow-y: scroll;
                        position:fixed;
                        left:0%;
                        top:10%;">
                <ion-card-header>
                    <ion-card-title>Login</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                    <ion-text color="tertiary">
                        Enter the response code that your study coordinator gave to you.
                    </ion-text>
                    <ion-input placeholder="enter code here" v-model="enterid" style="font-size:1.5rem;"/>
                    <br/>
                    <ion-accordion-group>
                        <ion-accordion>
                            <ion-item slot="header" color="light">
                                <ion-icon :icon="settings"/>
                            </ion-item>
                            <div slot="content">
                                <ion-input
                                    placeholder="Enter domain name of your Salsa installation"
                                    v-model="enterdomain"
                                >
                                </ion-input>
                            </div>
                        </ion-accordion>
                    </ion-accordion-group>
                    <ion-button v-if="enterid && enterdomain && !loading_begin" @click="set_salsaid">Submit</ion-button>
                    <ion-list v-if="loading_begin">
                        <ion-item v-if="store.getting_schedule">
                            <ion-text>Downloading schedule</ion-text>
                        </ion-item>
                        <ion-item v-if="store.downloading">
                            <ion-text>{{store.downloading_message}}</ion-text>
                        </ion-item>
                        <ion-item v-if="store.unzipping">
                            <ion-text>{{store.unzipping_message}}</ion-text>
                        </ion-item>
                    </ion-list>
                </ion-card-content>
            </ion-card>
        </ion-content>
    </ion-page>
</template>
<script lang="ts" setup>
import {IonPage, IonButton, IonContent, IonCardHeader, IonCardTitle, IonText, IonInput,
     IonList, IonItem, IonCardContent, IonCard, IonSelect, IonSelectOption, IonIcon,
     IonAccordionGroup, IonAccordion
} from '@ionic/vue'
import {ref} from 'vue'
import { settings} from 'ionicons/icons'
import { salsaStore } from '../store'


const store = salsaStore()

const enterid = ref('')
const loading_begin = ref(false)

const builtin_sites:{
    name:string,
    domain:string
}[] = [{
        name: 'University of Washington',
        domain:'huginn-gateway.bime.washington.edu'
    },{
        name: 'University of Minnesota',
        domain: 'rxinformatics.net'

}]
const enterdomain = ref('rxinformatics.net')


async function set_salsaid(){
    store.old_salsaid = store.salsaid
    store.old_salsadomain = store.salsa_domain
    loading_begin.value = true
    console.log('got to set_salsaid2')
    try{
        await store.set_salsaid(enterid.value.trim(), enterdomain.value)
    } catch {
        if (store.downloads_remaining>0 || store.unzipping){
            store.schedule = null
        }
        store.current_component='Error'
    }
}

</script>