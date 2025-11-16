<template>
    <layout>
    <template v-slot:content>
    <ion-card>
        <ion-card-content>
        <ion-text color="secondary" style="font-size:16pt;">
            <p>
                This concludes today’s
                check-in.
            </p>
            <p>
                You will get a text message
                reminder when your next
                scheduled check-in is
                available.
            </p>
            <p>Press  the                     
                <ion-icon :icon="cloudUploadOutline"/>
                button above 
                either now or later when you have internet or wifi available to upload your test data.
            </p>

            <p>Thank you!</p>
        </ion-text>
        </ion-card-content>
    </ion-card>
    </template>
</layout>
</template>
<script setup lang="ts">
import {IonIcon,
IonText, IonCard, IonCardContent} from '@ionic/vue'
import { cloudUploadOutline} from 'ionicons/icons'
import Layout from './Layout.vue'
import { salsaStore } from '../store'

const store = salsaStore()

function go_to_uploads(){
    store.current_component='Uploads'
}

</script>