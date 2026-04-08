<script setup lang="ts">
import {useClipboard} from '@vueuse/core'
import {ZodError} from 'zod'
import {createGroups, type GroupingResult, parseNames} from '~/composables/useNameGrouping'

const {t} = useI18n()
const {copy, copied} = useClipboard()

const namesInput = ref('')
const groupCountInput = ref('2')
const seedInput = ref('')
const dedupe = ref(true)
const errorMessage = ref('')
const successMessage = ref('')
const result = ref<GroupingResult | null>(null)

const parsedPreview = computed(() => parseNames(namesInput.value, dedupe.value))

const statItems = computed(() => {
  const groups = result.value?.groups ?? []
  const sizes = groups.map((group) => group.length)
  const largest = sizes.length ? Math.max(...sizes) : 0
  const smallest = sizes.length ? Math.min(...sizes) : 0

  return [
    {
      label: t('tools.nameGrouping.summaryNames'),
      value: result.value?.usableCount ?? 0,
      icon: 'i-lucide-users'
    },
    {
      label: t('tools.nameGrouping.summaryGroups'),
      value: groups.length,
      icon: 'i-lucide-layout-grid'
    },
    {
      label: t('tools.nameGrouping.summaryLargest'),
      value: largest,
      icon: 'i-lucide-arrow-up-right'
    },
    {
      label: t('tools.nameGrouping.summarySmallest'),
      value: smallest,
      icon: 'i-lucide-arrow-down-right'
    }
  ]
})

function resolveValidationMessage(error: unknown) {
  if (error instanceof Error && error.message === 'too-many-groups') {
    return t('tools.nameGrouping.validation.tooManyGroups')
  }

  if (error instanceof ZodError) {
    const issue = error.issues[0]

    if (issue?.path[0] === 'groupCount') {
      return t('tools.nameGrouping.validation.invalidGroupCount')
    }

    return t('tools.nameGrouping.validation.emptyNames')
  }

  return t('tools.nameGrouping.validation.invalidGroupCount')
}

function generateGroups() {
  errorMessage.value = ''
  successMessage.value = ''

  const nextGroupCount = Number.parseInt(groupCountInput.value, 10)

  try {
    result.value = createGroups(namesInput.value, nextGroupCount, {
      dedupe: dedupe.value,
      seed: seedInput.value
    })
  } catch (error) {
    result.value = null
    errorMessage.value = resolveValidationMessage(error)
  }
}

function resetAll() {
  namesInput.value = ''
  groupCountInput.value = '2'
  seedInput.value = ''
  dedupe.value = true
  errorMessage.value = ''
  successMessage.value = ''
  result.value = null
}

const copyText = computed(() => {
  if (!result.value) return ''

  return result.value.groups
      .map((group, index) => `${t('common.group', {index: index + 1})}\n${group.join('\n')}`)
      .join('\n\n')
})

async function copyResult() {
  if (!copyText.value) return
  await copy(copyText.value)
  successMessage.value = t('tools.nameGrouping.copySuccess')
}
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
    <SectionCard :title="t('tools.nameGrouping.inputTitle')" :description="t('tools.nameGrouping.inputDescription')">
      <div class="space-y-5">
        <div class="grid gap-4 md:grid-cols-3">
          <div class="rounded-2xl border border-default bg-default/70 p-4">
            <div class="text-sm text-muted">{{ t('tools.nameGrouping.stats.rawCount') }}</div>
            <div class="mt-2 text-2xl font-semibold text-highlighted">{{ parsedPreview.rawCount }}</div>
          </div>
          <div class="rounded-2xl border border-default bg-default/70 p-4">
            <div class="text-sm text-muted">{{ t('tools.nameGrouping.stats.usableCount') }}</div>
            <div class="mt-2 text-2xl font-semibold text-highlighted">{{ parsedPreview.names.length }}</div>
          </div>
          <div class="rounded-2xl border border-default bg-default/70 p-4">
            <div class="text-sm text-muted">{{ t('tools.nameGrouping.stats.duplicatesRemoved') }}</div>
            <div class="mt-2 text-2xl font-semibold text-highlighted">{{ parsedPreview.removedCount }}</div>
          </div>
        </div>

        <UFormField :label="t('tools.nameGrouping.namesLabel')" required>
          <UTextarea
              v-model="namesInput"
              :rows="16"
              :placeholder="t('tools.nameGrouping.namesPlaceholder')"
              class="w-full"
              autoresize
          />
        </UFormField>

        <div class="grid gap-4 lg:grid-cols-2">
          <UFormField :label="t('tools.nameGrouping.groupCountLabel')" :help="t('tools.nameGrouping.groupCountHint')"
                      required>
            <UInput v-model="groupCountInput" type="number" min="1" step="1" class="w-full"/>
          </UFormField>

          <UFormField
              :label="`${t('tools.nameGrouping.seedLabel')}（${t('common.optional')}）`"
              :help="t('tools.nameGrouping.seedHint')"
          >
            <UInput v-model="seedInput" class="w-full"/>
          </UFormField>
        </div>

        <div class="rounded-2xl border border-default bg-default/70 p-4">
          <UCheckbox v-model="dedupe" :label="t('tools.nameGrouping.dedupeLabel')"/>
          <p class="mt-2 text-sm text-toned">{{ t('tools.nameGrouping.dedupeHint') }}</p>
        </div>

        <UAlert v-if="errorMessage" color="error" variant="subtle" :title="errorMessage"/>
        <UAlert v-if="successMessage" color="success" variant="subtle" :title="successMessage"/>

        <div class="flex flex-wrap gap-3">
          <UButton color="primary" icon="i-lucide-sparkles" @click="generateGroups">
            {{ result ? t('common.regenerate') : t('common.generate') }}
          </UButton>
          <UButton color="neutral" variant="outline" icon="i-lucide-rotate-ccw" @click="resetAll">
            {{ t('common.reset') }}
          </UButton>
        </div>
      </div>
    </SectionCard>

    <SectionCard :title="t('tools.nameGrouping.resultTitle')" :description="t('tools.nameGrouping.resultDescription')">
      <template #actions>
        <div class="flex flex-wrap gap-2">
          <UBadge v-if="result?.seedUsed" color="secondary" variant="subtle">seed: {{ result.seedUsed }}</UBadge>
          <UButton
              v-if="result"
              color="neutral"
              variant="ghost"
              icon="i-lucide-copy"
              @click="copyResult"
          >
            {{ copied ? t('common.copied') : t('common.copy') }}
          </UButton>
        </div>
      </template>

      <div v-if="result" class="space-y-6">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div
              v-for="item in statItems"
              :key="item.label"
              class="rounded-2xl border border-default bg-default/70 p-4"
          >
            <div class="flex items-center gap-2 text-sm text-muted">
              <UIcon :name="item.icon" class="size-4"/>
              <span>{{ item.label }}</span>
            </div>
            <div class="mt-2 text-2xl font-semibold text-highlighted">{{ item.value }}</div>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div
              v-for="(group, index) in result.groups"
              :key="index"
              class="rounded-2xl border border-default bg-default/70 p-4"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="text-base font-semibold text-highlighted">{{ t('common.group', {index: index + 1}) }}</div>
              <UBadge color="primary" variant="subtle">{{ group.length }}</UBadge>
            </div>

            <ul class="mt-4 space-y-2">
              <li
                  v-for="member in group"
                  :key="member"
                  class="rounded-xl border border-default bg-elevated px-3 py-2 text-sm text-toned"
              >
                {{ member }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div v-else class="rounded-3xl border border-dashed border-default bg-default/40 px-6 py-12 text-center">
        <div class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <UIcon name="i-lucide-users-round" class="size-6"/>
        </div>
        <h3 class="mt-4 text-lg font-semibold text-highlighted">{{ t('tools.nameGrouping.emptyTitle') }}</h3>
        <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-toned">{{ t('tools.nameGrouping.emptyDescription') }}</p>
      </div>
    </SectionCard>
  </div>
</template>
