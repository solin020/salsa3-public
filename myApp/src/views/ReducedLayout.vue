<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>

            </ion-toolbar>
        </ion-header>
        <ion-content overflow-scroll="true">
            <slot name="content"/>
        </ion-content>
        <ion-footer class="j_footer">
            <slot name="footer"/>
        </ion-footer>
    </ion-page>
</template>
<script setup lang="ts">
import {IonPage, IonContent,  IonFooter, IonHeader, IonToolbar} from '@ionic/vue'

</script>
<style>
.j_footer{
    text-align: center;
    padding-bottom:30px;
}
</style>
