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
            <div class="text-sm text-muted">AGPL-3.0</div>
            <h2 class="mt-1 text-xl font-semibold text-highlighted">{{ t('license.title') }}</h2>
            <p class="mt-2 text-sm text-toned">{{ t('license.description') }}</p>
          </div>
          <UButton color="neutral" icon="i-lucide-x" variant="ghost" @click="emit('close')"/>
        </div>

        <div class="space-y-4 rounded-xl border border-default bg-elevated p-4">
          <div>
            <div class="text-sm font-medium text-highlighted">GNU Affero General Public License v3.0</div>
            <p class="mt-1 text-sm text-toned">AGPL-3.0</p>
          </div>

          <p class="text-sm leading-6 text-toned">
            {{ t('license.description') }}
          </p>

          <div class="flex flex-wrap items-center gap-2 pt-1">
            <UBadge color="neutral" variant="subtle">Open Source</UBadge>
            <UBadge color="neutral" variant="subtle">Copyleft</UBadge>
            <UBadge color="neutral" variant="subtle">Commercial Use</UBadge>
            <UBadge color="neutral" variant="subtle">Source Disclosure</UBadge>
          </div>

          <div class="pt-1">
            <UButton
                :label="t('common.github')"
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
