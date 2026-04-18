<script lang="ts" setup>
const props = defineProps<{
  open: boolean
  githubUrl: string
}>()

const emit = defineEmits<{
  close: []
}>()

const {t} = useI18n()
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
            <div class="text-sm text-muted">{{ t('license.summarySubtitle') }}</div>
            <h2 class="mt-1 text-xl font-semibold text-highlighted">{{ t('license.title') }}</h2>
            <p class="mt-2 text-sm text-toned">{{ t('license.description') }}</p>
          </div>
          <UButton :aria-label="t('common.closeDialog')" color="neutral" icon="i-lucide-x" variant="ghost"
                   @click="emit('close')"/>
        </div>

        <div class="space-y-4 rounded-xl border border-default bg-elevated p-4">
          <div>
            <div class="text-sm font-medium text-highlighted">{{ t('license.summaryTitle') }}</div>
            <p class="mt-1 text-sm text-toned">{{ t('license.summarySubtitle') }}</p>
          </div>

          <p class="text-sm leading-6 text-toned">
            {{ t('license.summaryDescription') }}
          </p>

          <div class="flex flex-wrap items-center gap-2 pt-1">
            <UBadge color="neutral" variant="subtle">{{ t('license.badges.openSource') }}</UBadge>
            <UBadge color="neutral" variant="subtle">{{ t('license.badges.keepLicense') }}</UBadge>
            <UBadge color="neutral" variant="subtle">{{ t('license.badges.commercialUse') }}</UBadge>
            <UBadge color="neutral" variant="subtle">{{ t('license.badges.sourceDisclosure') }}</UBadge>
          </div>

          <div class="pt-1">
            <UButton
                :label="t('license.viewSource')"
                :to="props.githubUrl"
                color="neutral"
                icon="i-lucide-github"
                rel="noopener noreferrer"
                target="_blank"
                variant="outline"
            />
          </div>
        </div>

        <div class="mt-5 flex justify-end">
          <UButton color="neutral" variant="outline" @click="emit('close')">{{ t('common.close') }}</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
