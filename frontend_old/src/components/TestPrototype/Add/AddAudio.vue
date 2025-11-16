<template>
    <div class="j_mediadisplay">
        <div class="j_mediainput">
            <h3>{{ my.id }}</h3>
            <div v-if="no_file"><input type="file" @input="submit_file($event)" class="j_mediainput" accept="audio/wav"/></div>
            <div><input type="checkbox" v-model="props.my.autoplay"/>Automatically play audio?</div>
            <div><input type="checkbox" v-model="props.my.autoadvance"/>Automatically move on when audio is done?</div>
            <div><input type="checkbox" v-model="props.my.hide_early"/>Prevent participant from moving on before audio is done playing?</div>
            <div>
                <input :disabled="props.my.autoplay" type="checkbox" v-model="props.my.hide_controls"/>Prevent participant from accessing audio controls?
            </div>
            Select audio file: <input type="file" 
            accept="audio/wav"
            @change="(e) => props.my.file = [(e.target! as HTMLInputElement).files![0]]" />
        </div>
        <div class="j_media">
            <div class="j_phone_sim">
                <audio :src="audiosrc" controls/>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import {type Audio as AudioType} from '@/types'
import { ref, type Ref, computed } from 'vue';
interface Props {
    my:AudioType
}
const props = defineProps<Props>()
function submit_file(e:Event){
    // @ts-expect-error
    const file: File = e.target.files[0]
    props.my.file = [file]
    props.my.uri = file.name
}
const audiosrc = computed<string>(() =>{
    if (props.my.file.length>0){
        return URL.createObjectURL(props.my.file[0])
    } else {
        return ''
    }
  }
)
const no_file = computed(() => props.my.file.length===0)


</script>
<style src='@/css/mediadisplay.css'/>