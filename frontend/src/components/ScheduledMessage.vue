<template>
    <div>
        <h2>Message Scheduled at {{ new Date(props.my_scheduled_message.time).toLocaleString()}}</h2>
        <VBtn @click="cancel_message">Cancel Message</VBtn>
    </div>
</template>
<script lang="ts" setup>
import {DefaultService, type MessageSchedule as ScheduledMessageType} from '@/client'
import {reload_messages_key} from '@/injectkeys'
import {inject} from 'vue'

interface Props{
    my_scheduled_message: ScheduledMessageType
}
const props = defineProps<Props>()
const reload_messages = inject(reload_messages_key)!
function cancel_message(){
    DefaultService.coordinatorDeleteMessageSalsaServerApiDeleteMessagePost(props.my_scheduled_message.schedule_id).then(
        r => reload_messages()
    )
}

</script>