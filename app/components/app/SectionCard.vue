<script lang="ts" setup>
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <UCard>
    <div class="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 class="text-base font-semibold text-highlighted">{{ title }}</h2>
        <p v-if="description" class="mt-1 text-sm text-toned">{{ description }}</p>
      </div>
      <slot name="actions"/>
    </div>
    <slot/>
  </UCard>
</template>
