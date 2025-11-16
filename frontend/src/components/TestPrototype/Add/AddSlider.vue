<template>
    <div class="j_question_grid">
        <div class="j_edit_area">
            <h2>Editing Question {{ props.my.id }}</h2>
            <div class="j_divider"/>
            <v-text-field v-model="props.my.label" label="User visible prompt"/>
            <v-text-field v-model="props.my.min" label="Minimum slider value"/>
            <v-text-field v-model="props.my.max" label="Maximum slider value"/>
        </div>
        <div class="j_user_area">
            <h2>What the user sees</h2>
            <div class="j_phone_sim">
                <h2>{{ props.my.label }}</h2>
                <v-slider
                thumb-label="always"
                :min="props.my.min"
                :max="props.my.max"
                style="
                    width: 80%;
                    margin-top:100px;
                "
                :show-ticks="'always'"
                :step="1"
                />
                <v-btn :disabled="true" class="j_continue_button">Continue</v-btn>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import {type Slider} from '@/types'
import { ref } from 'vue';
interface Props {
    my:Slider
}
const props = defineProps<Props>()

</script>