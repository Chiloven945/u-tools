<script lang="ts" setup>
const route = useRoute()
const {tools, normalizeToolId} = useToolRegistry()

const activeToolId = computed(() => normalizeToolId(route.query.tool))

const activeTool = computed(
    () => tools.value.find((tool) => tool.id === activeToolId.value) || tools.value[0]
)
</script>

<template>
  <div>
    <NameGroupingTool v-if="activeToolId === 'name-grouping'"/>
    <RandomInsertTool v-else-if="activeToolId === 'random-insert'"/>
    <NameGroupingTool v-else-if="activeTool?.id === 'name-grouping'"/>
  </div>
</template>
