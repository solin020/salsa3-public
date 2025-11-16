<template>
    <span ref="tooltipspan" class="j-tooltip">
    <slot name="anchor">ⓘ</slot>
    <teleport to="body">
        <div ref="popupdiv" class="j-overlay-background" :style="{display:(isOpen?'block':'none')}"><slot/></div>
    </teleport>
    </span>
</template>
<script lang="ts" setup>
import {ref, onMounted} from 'vue'
const isOpen = ref(false)
const tooltipspan = ref<HTMLSpanElement|null>()
const popupdiv = ref<HTMLDivElement|null>()
onMounted(()=>{
    tooltipspan.value!.addEventListener('mouseenter', ()=>{
        console.log(`why didn't this fire?`)
        const coords = tooltipspan.value!.getBoundingClientRect()
        popupdiv.value!.style.top = coords.top + "px";
        popupdiv.value!.style.left = coords.left + "px";
        isOpen.value=true
    })
    popupdiv.value!.addEventListener('mouseleave', ()=>{
        isOpen.value=false

    })
})
</script>
<style>
.j-overlay-background{
    background: white;
    border: solid blue 1px;
    border-radius: 5px;
    opacity: 1;
    color:darkblue;
    font-size:12pt;
    top: 26pt;
    position:fixed;
    z-index:2147483646;
    overflow: scroll;
}
</style>