<template>
    <thead>
        <tr>
            <th/>
            <th>All</th>
            <th v-for="phase_id in props.phase_ids">{{ phase_id }}</th>
        </tr>
    </thead>
</template>
<script setup lang=ts>
interface Props{
    phase_ids: string[]
}
const props=defineProps<Props>()
</script>