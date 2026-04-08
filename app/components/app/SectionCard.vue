<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <section class="rounded-3xl border border-default bg-elevated/70 p-5 shadow-sm sm:p-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-highlighted">{{ title }}</h2>
        <p v-if="description" class="mt-2 text-sm leading-6 text-toned">{{ description }}</p>
      </div>
      <slot name="actions"/>
    </div>

    <div class="mt-5">
      <slot/>
    </div>
  </section>
</template>
