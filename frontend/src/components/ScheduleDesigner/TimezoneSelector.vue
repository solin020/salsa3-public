<template>
    <div>
        <v-select :items="Array.from(tz_dict.entries()).map(([k,v], i) => ({name:v, abbr:k}))"
            label="Select timezone"
            item-title="name"
            item-value="abbr"
            v-model="tz"/>
        <h2>{{tz}}</h2>
    </div>
</template>
<script setup lang="ts">
import { tz_dict } from './timezone';
import { type Timezone } from '@/types/schedule'
const tz = defineModel<Timezone>()




</script>