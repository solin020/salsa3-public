<template>
  <v-btn v-if="!editorOpen" @click="editorOpen=true">Click to Open Editor</v-btn>
  <div v-show="editorOpen" style="
    display: grid; 
    grid-template-columns: 2fr 1fr 1fr; 
    column-gap: 1.5em; 
    width: 100vw; 
    height: 100vh; 
    position: fixed; 
    top: 0px; left: 0px;
    overflow-y: scroll;
    background-color: white;
    z-index: 2000000000;
  "
  ref="editorBackground"
  >
    <dialog-tree :docname="props.docname" :close-editor="closeEditor" :background="editorBackground!"
    :xmlstring="props.xmlstring"/>
  </div>
</template>
<script setup lang="ts">
import {ref, type Ref} from 'vue'
import DialogTree from './DialogTree.vue';
const editorOpen = ref(false)
const editorBackground  =  ref<HTMLDivElement|null>(null)
const props = defineProps<{docname:string|undefined, xmlstring: Ref<string>}>()
function closeEditor(){
    editorOpen.value=false
}
</script>