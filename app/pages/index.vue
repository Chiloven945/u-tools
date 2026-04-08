<script setup lang="ts">
const {t} = useI18n()

const currentTool = ref('name-grouping')

const toolTabs = computed(() => [
  {
    id: 'name-grouping',
    label: t('tools.nameGrouping.tab'),
    description: t('tools.nameGrouping.description'),
    icon: 'i-lucide-users-round'
  }
])
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-3xl border border-default bg-elevated/70 p-6 shadow-sm lg:p-8">
      <p class="text-sm text-primary">{{ t('home.eyebrow') }}</p>
      <h1 class="mt-3 text-3xl font-semibold text-highlighted lg:text-4xl">{{ t('home.title') }}</h1>
      <p class="mt-4 max-w-3xl text-sm leading-7 text-toned lg:text-base">
        {{ t('home.description') }}
      </p>
    </section>

    <div class="grid gap-6 xl:grid-cols-[280px_1fr]">
      <SectionCard :title="t('home.toolTabsTitle')" :description="t('home.toolTabsDescription')">
        <div class="space-y-3">
          <button
              v-for="tool in toolTabs"
              :key="tool.id"
              type="button"
              class="w-full rounded-2xl border px-4 py-4 text-left transition"
              :class="tool.id === currentTool
              ? 'border-primary/30 bg-primary/10 text-highlighted ring-1 ring-primary/20'
              : 'border-default bg-default/70 text-toned hover:bg-elevated hover:text-highlighted'"
              @click="currentTool = tool.id"
          >
            <div class="flex items-start gap-3">
              <div class="mt-0.5 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UIcon :name="tool.icon" class="size-5"/>
              </div>
              <div class="min-w-0">
                <div class="font-medium">{{ tool.label }}</div>
                <p class="mt-1 text-sm leading-6 text-muted">{{ tool.description }}</p>
              </div>
            </div>
          </button>

          <div class="rounded-2xl border border-dashed border-default bg-default/40 p-4 text-sm text-muted">
            {{ t('tools.comingSoon') }}
          </div>
        </div>
      </SectionCard>

      <NameGroupingTool v-if="currentTool === 'name-grouping'"/>
    </div>
  </div>
</template>
