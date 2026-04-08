<script lang="ts" setup>
import {useClipboard} from '@vueuse/core'
import {ZodError} from 'zod'
import {createGroups, type GroupingResult} from '~/composables/useNameGrouping'

const {t} = useI18n()
const {copy, copied} = useClipboard()

const namesInput = ref('')
const groupCountInput = ref('2')
const seedInput = ref('')
const dedupe = ref(true)
const errorMessage = ref('')
const successMessage = ref('')
const result = ref<GroupingResult | null>(null)

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
  <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
    <SectionCard :description="t('tools.nameGrouping.inputDescription')" :title="t('tools.nameGrouping.inputTitle')">
      <div class="space-y-5">
        <UFormField :label="t('tools.nameGrouping.namesLabel')" required>
          <UTextarea
              v-model="namesInput"
              :placeholder="t('tools.nameGrouping.namesPlaceholder')"
              :rows="16"
              autoresize
              class="w-full"
          />
        </UFormField>

        <div class="grid gap-4 lg:grid-cols-2">
          <UFormField
              :help="t('tools.nameGrouping.groupCountHint')"
              :label="t('tools.nameGrouping.groupCountLabel')"
              required
          >
            <UInput v-model="groupCountInput" class="w-full" min="1" step="1" type="number"/>
          </UFormField>

          <UFormField :help="t('tools.nameGrouping.seedHint')" :label="t('tools.nameGrouping.seedLabel')">
            <UInput v-model="seedInput" class="w-full"/>
          </UFormField>
        </div>

        <div class="rounded-xl border border-default bg-elevated px-4 py-3.5">
          <UCheckbox v-model="dedupe" :label="t('tools.nameGrouping.dedupeLabel')"/>
          <p class="mt-2 text-sm text-toned">{{ t('tools.nameGrouping.dedupeHint') }}</p>
        </div>

        <UAlert v-if="errorMessage" :title="errorMessage" color="error" variant="subtle"/>
        <UAlert v-if="successMessage" :title="successMessage" color="success" variant="subtle"/>

        <div class="flex flex-wrap gap-3">
          <UButton color="primary" icon="i-lucide-sparkles" @click="generateGroups">
            {{ result ? t('common.regenerate') : t('common.generate') }}
          </UButton>
          <UButton color="neutral" icon="i-lucide-rotate-ccw" variant="outline" @click="resetAll">
            {{ t('common.reset') }}
          </UButton>
        </div>
      </div>
    </SectionCard>

    <SectionCard :description="t('tools.nameGrouping.resultDescription')" :title="t('tools.nameGrouping.resultTitle')">
      <template #actions>
        <UButton v-if="result" color="neutral" icon="i-lucide-copy" variant="ghost" @click="copyResult">
          {{ copied ? t('common.copied') : t('common.copy') }}
        </UButton>
      </template>

      <div v-if="result" class="grid gap-4 md:grid-cols-2">
        <div
            v-for="(group, index) in result.groups"
            :key="index"
            class="rounded-xl border border-default bg-elevated px-4 py-4"
        >
          <div class="text-base font-semibold text-highlighted">{{ t('common.group', {index: index + 1}) }}</div>

          <ul class="mt-4 space-y-2">
            <li
                v-for="member in group"
                :key="member"
                class="rounded-xl border border-default bg-default px-3 py-2 text-sm text-toned"
            >
              {{ member }}
            </li>
          </ul>
        </div>
      </div>

      <div v-else class="rounded-xl border border-dashed border-default bg-elevated/40 px-6 py-12 text-center">
        <div class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <UIcon class="size-6" name="i-lucide-users-round"/>
        </div>
        <h3 class="mt-4 text-lg font-semibold text-highlighted">{{ t('tools.nameGrouping.emptyTitle') }}</h3>
        <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-toned">{{ t('tools.nameGrouping.emptyDescription') }}</p>
      </div>
    </SectionCard>
  </div>
</template>
