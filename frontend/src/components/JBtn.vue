<template>
    <v-btn @click="reclick" :disabled="props.disabled">
        <v-progress-circular  v-if="loading_flag" indeterminate/>
        <div :class="{j_showgreen:succeed_flag}">
            <slot/>
            <span :class="{j_hide:!succeed_flag, j_indicator:succeed_flag}">✅</span>
        </div>
    </v-btn>
</template>
<script lang="ts" setup generic="T">
import { ref } from 'vue';
interface Props<T>{
    click: (arg0:T)=>Promise<Response>;
    arg0:T;
    disabled?:boolean
}
const props = withDefaults(defineProps<Props<T>>(),
    {arg0:undefined})
const succeed_flag = ref(false)
const loading_flag = ref(false)

function reclick(){
    props.click(props.arg0).then((r) =>{
        console.log('status', r.status)
        if (!String(r.status).startsWith('2')){
            throw r
        }
        loading_flag.value = false
        succeed_flag.value=true
        setTimeout(() => {succeed_flag.value=false},1000)
    }).catch( (e:Response) => {
        if (!e.statusText){
            loading_flag.value = false
            return
        }
        loading_flag.value = false
        alert(e.statusText)
    })
    loading_flag.value = true
}
</script>
<style>
.j_hide{
    display: None
}

.j_indicator{
    display:inline;
}
.j_showgreen{
    background-color:rgb(137, 204, 125);
}


</style>