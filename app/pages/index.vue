<script lang="ts" setup>
const route = useRoute()
const {tools, normalizeToolId} = useToolRegistry()

const activeToolId = computed(() => normalizeToolId(route.query.tool))

const activeTool = computed(
    () => tools.value.find((tool) => tool.id === activeToolId.value) || tools.value[0]
)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="text-sm text-primary">{{ activeTool.description }}</p>
        <h1 class="mt-2 text-3xl font-semibold text-highlighted lg:text-4xl">{{ activeTool.label }}</h1>
      </div>
    </div>

    <NameGroupingTool v-if="activeToolId === 'name-grouping'"/>
    <RandomInsertTool v-else-if="activeToolId === 'random-insert'"/>
  </div>
</template>
