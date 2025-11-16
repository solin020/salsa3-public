<template>
<input type="number" v-model="props.my.count" step="1" style="font-size:24pt;"/> <v-select
    style="width: 7em; display:inline-block; vertical-align:top;" 
    label="Unit"
    v-model="props.my.unit"
    :items="[{
        title:'Minutes',
        value:'minutes'
    },{
        title:'Hours',
        value:'hours'
    },{
        title:'Days',
        value:'days'
    }]"
/>


</template>
<script setup lang="ts">
import type  {Interval} from '../../types/schedule'

const props = defineProps<{my:Interval}>()

</script>