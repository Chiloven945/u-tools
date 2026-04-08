<script setup lang="ts">
const {t} = useI18n()
const settingsOpen = ref(false)
</script>

<template>
  <div class="min-h-screen bg-default">
    <div class="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[280px_1fr]">
      <aside class="border-b border-default bg-default/70 backdrop-blur lg:border-b-0 lg:border-r">
        <div class="sticky top-0 flex min-h-screen flex-col p-4 lg:p-6">
          <div>
            <div class="mb-6 flex items-center gap-3">
              <div
                  class="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20">
                <UIcon name="i-lucide-boxes" class="size-5"/>
              </div>
              <div>
                <p class="text-sm text-muted">{{ t('brand.subtitle') }}</p>
                <h1 class="text-lg font-semibold text-highlighted">{{ t('brand.name') }}</h1>
              </div>
            </div>

            <div class="space-y-2">
              <div class="rounded-2xl border border-default bg-elevated/70 p-4">
                <div class="flex items-center gap-2 text-sm font-medium text-highlighted">
                  <UIcon name="i-lucide-layout-panel-top" class="size-4"/>
                  <span>{{ t('nav.tools') }}</span>
                </div>
                <p class="mt-2 text-sm leading-6 text-toned">{{ t('home.toolTabsDescription') }}</p>
              </div>

              <button
                  type="button"
                  class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-toned transition hover:bg-elevated hover:text-highlighted"
                  @click="settingsOpen = true"
              >
                <UIcon name="i-lucide-settings-2" class="size-4"/>
                <span>{{ t('nav.settings') }}</span>
              </button>
            </div>
          </div>

          <div class="mt-auto pt-6">
            <div class="rounded-2xl border border-default bg-elevated/70 p-4">
              <p class="text-sm font-medium text-highlighted">{{ t('license.title') }}</p>
              <p class="mt-2 text-sm text-muted">AGPL-3.0</p>
              <p class="mt-2 text-xs leading-5 text-muted">{{ t('license.description') }}</p>
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
