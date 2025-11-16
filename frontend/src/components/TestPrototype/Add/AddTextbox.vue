<template>
    <div class="j_question_grid">
        <div class="j_edit_area">
            <h2>Editing Question {{ props.my.id }}</h2>
            <div class="j_divider"/>
            <v-text-field label="User visible prompt" v-model="props.my.label"/>
        </div>
        <div class="j_user_area">
            <h2>What the user sees</h2>
            <div class="j_phone_sim">
                <h2>{{ props.my.label }}</h2>
                <v-text-field/>
                <v-btn :disabled="true" class="j_continue_button">Continue</v-btn>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import {type Textbox} from '@/types'
interface Props {
    my:Textbox
}
const props = defineProps<Props>()

</script>
