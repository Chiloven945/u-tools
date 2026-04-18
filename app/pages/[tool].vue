<script lang="ts" setup>
const route = useRoute()
const {tools, normalizeToolId} = useToolRegistry()

const requestedToolId = computed(() => route.params.tool)
const activeToolId = computed(() => normalizeToolId(requestedToolId.value))
const isValidToolPath = computed(() => {
  const raw = requestedToolId.value
  const current = Array.isArray(raw) ? raw[0] : raw
  return current === activeToolId.value
})

if (import.meta.client) {
  watchEffect(() => {
    if (!isValidToolPath.value) {
      navigateTo(`/${activeToolId.value}`, {replace: true})
    }
  })
}

if (import.meta.server && !isValidToolPath.value) {
  await navigateTo(`/${activeToolId.value}`, {redirectCode: 302, replace: true})
}

const activeTool = computed(
    () => tools.value.find((tool) => tool.id === activeToolId.value) || tools.value[0]
)
</script>

<template>
  <div>
    <NameGroupingTool v-if="activeToolId === 'name-grouping'"/>
    <RandomInsertTool v-else-if="activeToolId === 'random-insert'"/>
    <ArticleFormatTool v-else-if="activeToolId === 'article-format'"/>
    <NameGroupingTool v-else-if="activeTool?.id === 'name-grouping'"/>
    <ArticleFormatTool v-else-if="activeTool?.id === 'article-format'"/>
  </div>
</template>
