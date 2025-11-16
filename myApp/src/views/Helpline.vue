<template>
    <layout>
    <template v-slot:content>
    <ion-card>
        <ion-card-content>
        <ion-text color="secondary" style="font-size:16pt;">
            <p>
                If you are experiencing a crisis, please call the toll-free National Suicide & Crisis Lifeline at 988
                by pressing the button below.
            </p>
            <p>
                If you are experiencing any other kind of emergency,
                please dial 911.
            </p>
        </ion-text>
        </ion-card-content>
    </ion-card>
    </template>
    <template v-slot:footer>
        <a href="tel:988">
            <ion-button size="large" color="danger"> Dial 988</ion-button>
        </a>
    </template>
</layout>
</template>
<script setup lang="ts">
import {IonIcon,
IonText, IonCard, IonCardContent, IonButton} from '@ionic/vue'
import { alertCircleOutline} from 'ionicons/icons'
import Layout from './Layout.vue'


</script>