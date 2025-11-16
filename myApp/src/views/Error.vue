<template>
    <ion-page>
        <ion-content>
            <ion-card style="top: 20vh; position:relative;">
                <ion-card-content>
                    <ion-text color="danger" >
                        <p style="font-size:1.5rem;">Incorrect Login. Please try again.</p>
                    </ion-text>                
                </ion-card-content>
            </ion-card>
        </ion-content>
        <ion-footer class="j_footer">
            <ion-button @click="go_to_login()" size="large">Go back</ion-button>
        </ion-footer>
    </ion-page>
</template>
<script setup lang="ts">
import {IonPage, IonContent, IonButton, IonText,  IonCard, IonCardContent, IonFooter} from '@ionic/vue'
import { salsaStore } from '../store'

const store = salsaStore()

async function go_to_login(){
    if (store.schedule){
        await store.reset_salsaid()
        store.current_component='HomePage'
    } else{
        store.current_component='Login'
    }
}

</script>