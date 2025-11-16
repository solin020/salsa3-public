<template>
    <div class="j_mediadisplay">
        <div class="j_mediainput">
            <h3>{{ my.id }}</h3>
            <div v-if="no_file"><input type="file" @input="submit_file($event)" class="j_mediainput" accept="video/mp4"/></div>
            <div><input type="checkbox" v-model="props.my.autoplay"/>Automatically play video?</div>
            <div><input type="checkbox" v-model="props.my.autoadvance"/>Automatically move on when video is done?</div>
            <div><input type="checkbox" v-model="props.my.hide_early"/>Prevent participant from moving on before video is done playing?</div>
            <div>
                <input type="checkbox" v-model="props.my.hide_controls"
                :disabled="!props.my.autoplay"
                />
                Prevent participant from accessing video controls?
            </div>
            Select video file: <input type="file" 
            accept="video/mp4"
            @change="(e) => props.my.file = [(e.target! as HTMLInputElement).files![0]]" />
        </div>
        <div class="j_media">
            <div class="j_phone_sim">
                <video :src="videosrc" controls  style="width:90%;"/>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import {type Video as VideoType} from '@/types'
import { ref, type Ref, computed } from 'vue';
interface Props {
    my:VideoType
}

function submit_file(e:Event){
    // @ts-expect-error
    const file: File = e.target.files[0]
    props.my.file = [file]
    props.my.uri = file.name
}

const props = defineProps<Props>()
const videosrc = computed<string>(() =>{
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