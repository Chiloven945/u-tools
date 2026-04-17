<script lang="ts" setup>
const {tools} = useToolRegistry()
const defaultToolId = computed(() => tools.value[0]?.id || 'name-grouping')

if (import.meta.server) {
  await navigateTo(`/${defaultToolId.value}`, {redirectCode: 302, replace: true})
}

if (import.meta.client) {
  navigateTo(`/${defaultToolId.value}`, {replace: true})
}
</script>

<template>
  <div/>
</template>
