<script lang="ts" setup>
const {t} = useI18n()
const route = useRoute()
const settingsOpen = ref(false)
const githubUrl = 'https://github.com/your-org/u-tools'

const {tools, normalizeToolId} = useToolRegistry()

const activeToolId = computed(() => normalizeToolId(route.query.tool))

const navigation = computed(() =>
    tools.value.map((tool) => ({
      ...tool,
      to: {
        path: '/',
        query: {
          tool: tool.id
        }
      }
    }))
)

function isActive(toolId: string) {
  return activeToolId.value === toolId
}
</script>

<template>
  <div class="min-h-screen">
    <div class="mx-auto grid min-h-screen max-w-425 lg:grid-cols-[260px_1fr]">
      <aside class="border-b border-default bg-default/70 backdrop-blur lg:border-b-0 lg:border-r">
        <div class="sticky top-0 flex min-h-screen flex-col p-4 lg:p-6">
          <div>
            <div class="mb-6 flex items-center gap-3">
              <div
                  class="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20">
                <UIcon class="size-5" name="i-lucide-boxes"/>
              </div>
              <div>
                <p class="text-sm text-muted">{{ t('brand.subtitle') }}</p>
                <h1 class="text-lg font-semibold text-highlighted">{{ t('brand.name') }}</h1>
              </div>
            </div>

            <nav class="space-y-2">
              <NuxtLink
                  v-for="item in navigation"
                  :key="item.id"
                  :class="isActive(item.id) ? 'bg-elevated text-highlighted ring-1 ring-default' : ''"
                  :to="item.to"
                  class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-toned transition hover:bg-elevated hover:text-highlighted"
              >
                <UIcon :name="item.icon" class="size-4"/>
                <span>{{ item.label }}</span>
              </NuxtLink>

              <button
                  class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-toned transition hover:bg-elevated hover:text-highlighted"
                  type="button"
                  @click="settingsOpen = true"
              >
                <UIcon class="size-4" name="i-lucide-settings-2"/>
                <span>{{ t('nav.settings') }}</span>
              </button>
            </nav>
          </div>

          <div class="mt-auto pt-6">
            <div class="rounded-2xl border border-default bg-elevated/70 p-4">
              <p class="text-sm font-medium text-highlighted">{{ t('license.title') }}</p>
              <p class="mt-2 text-sm text-muted">AGPL-3.0</p>
              <p class="mt-2 text-xs leading-5 text-muted">
                {{ t('license.description') }}
              </p>

              <div class="mt-4 flex justify-start">
                <UButton
                    :label="t('common.github')"
                    :to="githubUrl"
                    color="neutral"
                    icon="i-lucide-github"
                    rel="noopener noreferrer"
                    target="_blank"
                    variant="ghost"
                />
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main class="min-w-0">
        <div class="p-4 lg:p-8">
          <slot/>
        </div>
      </main>
    </div>

    <SettingsDialog :open="settingsOpen" @close="settingsOpen = false"/>
  </div>
</template>
