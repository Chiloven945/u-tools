<script lang="ts" setup>
import {useClipboard} from '@vueuse/core'
import {generateRandomInsertResults} from '~/composables/useRandomInsert'

const {t} = useI18n()
const {copy, copied} = useClipboard()
const toast = useToast()

const sourceText = ref('')
const symbolsText = ref('')
const countInput = ref<number | null>(1)
const seedInput = ref('')
const outputs = ref<string[]>([])

function resolveErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return t('tools.randomInsert.validation.invalidCount')
  }

  if (error.message === 'empty-source') {
    return t('tools.randomInsert.validation.emptySource')
  }

  if (error.message === 'empty-symbols') {
    return t('tools.randomInsert.validation.emptySymbols')
  }

  if (error.message === 'no-characters') {
    return t('tools.randomInsert.validation.noCharacters')
  }

  return t('tools.randomInsert.validation.invalidCount')
}

function showToast(options: { title: string, color?: 'success' | 'error' | 'warning' | 'info', icon?: string }) {
  toast.add({
    title: options.title,
    color: options.color ?? 'info',
    icon: options.icon
  })
}

function normalizePositiveInteger(value: number | null | undefined, fallback = 1) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback
}

function generateResults() {
  const totalCount = normalizePositiveInteger(countInput.value)
  countInput.value = totalCount

  try {
    const result = generateRandomInsertResults(
        sourceText.value,
        symbolsText.value,
        totalCount,
        {seed: seedInput.value || undefined}
    )

    outputs.value = result.outputs
    showToast({
      title: t('tools.randomInsert.generateSuccess', {count: outputs.value.length}),
      color: 'success',
      icon: 'i-lucide-circle-check-big'
    })
  } catch (error) {
    outputs.value = []
    showToast({
      title: resolveErrorMessage(error),
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  }
}

function resetAll() {
  sourceText.value = ''
  symbolsText.value = ''
  countInput.value = 1
  seedInput.value = ''
  outputs.value = []

  showToast({
    title: t('tools.randomInsert.resetSuccess'),
    color: 'success',
    icon: 'i-lucide-rotate-ccw'
  })
}

const allOutputText = computed(() => outputs.value.join('\n\n'))

async function copyAllResults() {
  if (!allOutputText.value) {
    showToast({
      title: t('tools.randomInsert.validation.noResults'),
      color: 'warning',
      icon: 'i-lucide-copy-x'
    })
    return
  }

  await copy(allOutputText.value)
  showToast({
    title: t('tools.randomInsert.copySuccess'),
    color: 'success',
    icon: 'i-lucide-copy-check'
  })
}

async function copySingleResult(text: string) {
  await copy(text)
  showToast({
    title: t('tools.randomInsert.copySingleSuccess'),
    color: 'success',
    icon: 'i-lucide-copy-check'
  })
}
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
    <SectionCard :description="t('tools.randomInsert.inputDescription')" :title="t('tools.randomInsert.inputTitle')">
      <div class="space-y-5">
        <UFormField :label="t('tools.randomInsert.sourceLabel')" required>
          <UTextarea
              v-model="sourceText"
              :placeholder="t('tools.randomInsert.sourcePlaceholder')"
              :rows="10"
              autoresize
              class="w-full"
          />
        </UFormField>

        <UFormField :label="t('tools.randomInsert.symbolsLabel')" required>
          <UTextarea
              v-model="symbolsText"
              :placeholder="t('tools.randomInsert.symbolsPlaceholder')"
              :rows="8"
              autoresize
              class="w-full"
          />
        </UFormField>

        <div class="grid gap-4 lg:grid-cols-2">
          <UFormField :help="t('tools.randomInsert.countHint')" :label="t('tools.randomInsert.countLabel')" required>
            <UInputNumber v-model="countInput" :min="1" :step="1" class="w-full" />
          </UFormField>

          <UFormField :help="t('tools.randomInsert.seedHint')" :label="t('tools.randomInsert.seedLabel')">
            <UInput v-model="seedInput" class="w-full"/>
          </UFormField>
        </div>

        <div class="flex flex-wrap gap-3">
          <UButton color="primary" icon="i-lucide-sparkles" @click="generateResults">
            {{ outputs.length ? t('common.regenerate') : t('common.generate') }}
          </UButton>
          <UButton color="neutral" icon="i-lucide-rotate-ccw" variant="outline" @click="resetAll">
            {{ t('common.reset') }}
          </UButton>
        </div>
      </div>
    </SectionCard>

    <SectionCard :description="t('tools.randomInsert.resultDescription')" :title="t('tools.randomInsert.resultTitle')">
      <template #actions>
        <UButton v-if="outputs.length" color="neutral" icon="i-lucide-copy" variant="ghost" @click="copyAllResults">
          {{ copied ? t('common.copied') : t('common.copy') }}
        </UButton>
      </template>

      <div v-if="outputs.length" class="space-y-4">
        <div
            v-for="(item, index) in outputs"
            :key="`${index}-${item}`"
            class="rounded-xl border border-default bg-elevated px-4 py-4"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="text-sm font-semibold text-highlighted">
              {{ t('tools.randomInsert.resultItemTitle', {index: index + 1}) }}
            </div>

            <UButton color="neutral" icon="i-lucide-copy" size="sm" variant="ghost" @click="copySingleResult(item)">
              {{ t('common.copy') }}
            </UButton>
          </div>

          <pre class="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-toned">{{ item }}</pre>
        </div>
      </div>

      <div v-else class="rounded-xl border border-dashed border-default bg-elevated/40 px-6 py-12 text-center">
        <div class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <UIcon class="size-6" name="i-lucide-wand-sparkles"/>
        </div>
        <h3 class="mt-4 text-lg font-semibold text-highlighted">{{ t('tools.randomInsert.emptyTitle') }}</h3>
        <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-toned">{{ t('tools.randomInsert.emptyDescription') }}</p>
      </div>
    </SectionCard>
  </div>
</template>
