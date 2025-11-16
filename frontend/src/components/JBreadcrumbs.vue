<template>
    <div>
        <template v-for="tabname,i in props.tabnames" :key="tabname">
            <span class="j-angle" v-if="i>0"> &gt; </span>
            <span
            :class="{'j-activecrumb': (tabname === active_tab),
                    'j-displaycrumb': i<=max_index,
                    'j-angle': i>max_index
            }"
            @click="changetabs(tabname)"
            >
                <slot :name="`header_${tabname}`"/>
            </span>
        </template>

    </div>
    <div v-for="tabname, i in props.tabnames"
            :key="tabname">
      <slot :name="`content_${tabname}`" v-if="active_tab==tabname"/>
      <div class="j-crumbadvance">
        <button 
          @click="precedetabs" 
          class="button-7 j-crumbbutton" 
          :disabled="i==0" 
          v-if="active_tab==tabname">&lt;</button>
        <button 
          @click="advancetabs" 
          class="button-7 j-crumbbutton"  
          :disabled="!(enableds[i].value) || i == (props.tabnames.length-1)" 
          v-if="active_tab==tabname">&gt;</button>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import {ref, type Ref, computed} from 'vue'
  const activeTab = ref("")
  const active_index = ref(0)
  const max_index = ref(0)
  const active_tab = computed(()=>props.tabnames[active_index.value])
  interface Props{
    tabnames: string[]
    enableds: Ref<boolean>[]
  }
  
  const props = defineProps<Props>()
  function changetabs(t: string){
    const t_index = props.tabnames.indexOf(t)
    if (t_index <= max_index.value){
        active_index.value = t_index
    }
  }
function advancetabs(){
  max_index.value += 1
  active_index.value += 1
}
function precedetabs(){
  active_index.value -= 1
}
  
</script>
