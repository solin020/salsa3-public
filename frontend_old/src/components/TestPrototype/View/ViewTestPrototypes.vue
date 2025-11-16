<template>
    <v-select 
        class="j-input"
        v-model="test_id" :items="test_prototype_ids" label="Select Test Prototype"/>
    <template v-for="tp in test_prototypes">
        <ViewTestPrototype  :tp="tp" v-if="test_id===tp.id"/>
    </template>
</template>
<script setup lang="ts">
import {ref, type Ref, inject, computed} from 'vue'
import { project_key, test_prototypes_key } from '@/injectkeys'
import ViewTestPrototype from './ViewTestPrototype.vue'
const project = inject(project_key)!
const test_prototypes = inject(test_prototypes_key)!
const test_prototype_ids = computed(()=>test_prototypes.value.map(tp=>tp.id))

const test_id = ref('')

</script>