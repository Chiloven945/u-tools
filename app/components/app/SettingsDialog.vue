<script setup lang="ts">
import {appLocales} from '~/i18n/locales.config'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const {t, locale, setLocale} = useI18n()

const selectedLocale = computed({
  get: () => locale.value,
  set: async (value: string) => {
    if (!value || value === locale.value) return
    await setLocale(value)
  }
})

const localeOptions = computed(() =>
    appLocales.map((item) => ({
      value: item.code,
      label: item.name
    }))
)
</script>

<template>
  <UModal
      :open="props.open"
      :ui="{
      overlay: 'bg-black/35 backdrop-blur-[2px]',
      content: 'bg-(--ui-bg)/90 backdrop-blur-[4px] sm:max-w-2xl rounded-2xl shadow-2xl'
    }"
      @update:open="value => { if (!value) emit('close') }"
  >
    <template #content>
      <div class="p-4 sm:p-6">
        <div class="mb-5 flex items-start justify-between gap-4">
          <div>
            <div class="text-sm text-muted">{{ t('nav.settings') }}</div>
            <h2 class="mt-1 text-xl font-semibold text-highlighted">{{ t('settings.title') }}</h2>
            <p class="mt-2 text-sm text-toned">{{ t('settings.description') }}</p>
          </div>
          <UButton color="neutral" variant="ghost" icon="i-lucide-x" @click="emit('close')"/>
        </div>

        <div class="space-y-4 rounded-2xl border border-default bg-elevated p-4">
          <div>
            <div class="text-sm font-medium text-highlighted">{{ t('settings.language') }}</div>
            <p class="mt-1 text-sm text-toned">{{ t('settings.languageDescription') }}</p>
          </div>

          <USelect
              v-model="selectedLocale"
              :items="localeOptions"
              value-key="value"
              class="w-full"
              size="lg"
          />
        </div>

        <div class="mt-5 flex justify-end">
          <UButton color="neutral" variant="outline" @click="emit('close')">{{ t('common.close') }}</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
