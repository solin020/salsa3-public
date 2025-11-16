<template>
  <div class="j_tabcontainer">
      <span v-for="tabname in props.tabnames" 
          :class="{j_activetab: (tabname === activeTab), j_displaytab:true}"
          :key="tabname"
          @click="changetabs(tabname)"
          >
          <slot :name="`header_${tabname}`"/>
      </span>
      <div class="j_folderline"/>
  </div>
  <div v-for="tabname in props.tabnames"
          :key="tabname">
    <slot :name="`content_${tabname}`" v-if="activeTab==tabname"/>
  </div>
</template>

<script setup lang="ts">
import {ref, type Ref} from 'vue'
const activeTab = ref("")
interface Props{
  tabnames: string[]
}

const props = defineProps<Props>()
function changetabs(t: string){
  if (t === activeTab.value){
    activeTab.value = ''
  } else{
    activeTab.value = t
  }
}

</script>
<style src="@/css/jtabs.css">
</style>

