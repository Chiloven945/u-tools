<script lang="ts" setup>
import type {NavigationMenuItem} from '@nuxt/ui'

const {t} = useI18n()
const route = useRoute()

const open = ref(true)
const settingsOpen = ref(false)
const licenseOpen = ref(false)
const githubUrl = 'https://github.com/Chiloven945/u-tools'

const {tools, normalizeToolId} = useToolRegistry()

const activeToolId = computed(() => normalizeToolId(route.query.tool))
const activeTool = computed(
    () => tools.value.find((tool) => tool.id === activeToolId.value) || tools.value[0]
)

const toolNavigationItems = computed<NavigationMenuItem[]>(() =>
    tools.value.map((tool) => ({
      label: tool.label,
      icon: tool.icon,
      active: activeToolId.value === tool.id,
      to: {
        path: '/',
        query: {
          tool: tool.id
        }
      }
    }))
)

const settingsNavigationItems = computed<NavigationMenuItem[]>(() => [
  {
    label: t('nav.settings'),
    icon: 'i-lucide-settings-2',
    active: settingsOpen.value,
    onSelect(event?: Event) {
      event?.preventDefault?.()
      settingsOpen.value = true
    }
  }
])

const sidebarNavigationUi = {
  root: 'w-full',
  list: 'w-full gap-1',
  link: 'p-1.5 overflow-hidden',
  linkLabel: 'truncate'
} as const
</script>

<template>
  <div class="flex min-h-screen flex-1 bg-neutral-950">
    <USidebar
        v-model:open="open"
        :ui="{
          container: 'h-full'
        }"
        collapsible="icon"
        side="left"
        variant="inset"
    >
      <template #header>
        <div
            :class="open ? '' : 'justify-center'"
            class="flex min-w-0 items-center gap-3"
        >
          <div
              class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20"
          >
            <UIcon class="size-6" name="i-lucide-boxes"/>
          </div>

          <div v-if="open" class="min-w-0">
            <p class="truncate text-xs text-muted">{{ t('brand.subtitle') }}</p>
            <p class="truncate text-lg font-semibold text-highlighted">{{ t('brand.name') }}</p>
          </div>
        </div>
      </template>

      <div class="flex h-full flex-col">
        <UNavigationMenu
            :items="toolNavigationItems"
            :ui="sidebarNavigationUi"
            class="w-full"
            orientation="vertical"
        />

        <div class="mt-auto border-t border-default pt-4">
          <UNavigationMenu
              :items="settingsNavigationItems"
              :ui="sidebarNavigationUi"
              class="w-full"
              orientation="vertical"
          />
        </div>
      </div>
    </USidebar>

    <div
        class="flex flex-1 flex-col overflow-hidden bg-default lg:peer-data-[variant=floating]:my-4 peer-data-[variant=inset]:m-4 lg:peer-data-[variant=inset]:not-peer-data-[collapsible=offcanvas]:ms-0 peer-data-[variant=inset]:rounded-xl peer-data-[variant=inset]:shadow-sm peer-data-[variant=inset]:ring peer-data-[variant=inset]:ring-default"
    >
      <header
          class="flex h-(--ui-header-height) shrink-0 items-center justify-between gap-4 border-b border-default px-4">
        <div class="flex min-w-0 items-center gap-3">
          <UButton
              aria-label="Toggle sidebar"
              color="neutral"
              icon="i-lucide-panel-left"
              variant="ghost"
              @click="open = !open"
          />

          <div class="min-w-0">
            <p class="truncate text-xs text-primary">{{ activeTool.description }}</p>
            <h1 class="truncate text-lg font-semibold text-highlighted sm:text-xl">{{ activeTool.label }}</h1>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <UButton
              aria-label="AGPL-3.0"
              color="neutral"
              icon="i-lucide-scroll-text"
              square
              variant="ghost"
              @click="licenseOpen = true"
          />

          <UButton
              :to="githubUrl"
              aria-label="GitHub"
              color="neutral"
              icon="i-lucide-github"
              rel="noopener noreferrer"
              square
              target="_blank"
              variant="ghost"
          />
        </div>
      </header>

      <main class="min-h-0 min-w-0 flex-1 overflow-auto">
        <div class="p-4 lg:p-8">
          <slot/>
        </div>
      </main>
    </div>

    <SettingsDialog :open="settingsOpen" @close="settingsOpen = false"/>
    <LicenseDialog :github-url="githubUrl" :open="licenseOpen" @close="licenseOpen = false"/>
  </div>
</template>
