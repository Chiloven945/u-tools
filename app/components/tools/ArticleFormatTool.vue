<script lang="ts" setup>
import {useClipboard} from '@vueuse/core'
import {
  applyPanguSpacing,
  clearFormatting,
  type ClearFormattingOptions,
  getArticleTextStats,
  insertBlankLinesBetweenParagraphs,
  prependParagraphPrefix
} from '~/composables/useArticleFormat'

const {t} = useI18n()
const toast = useToast()
const {copy, copied} = useClipboard()

type OperationPanelId = 'indent' | 'blankLines' | 'cleanup' | 'spacing'
type IndentPresetId = 'fullWidthSpace' | 'tab' | 'doubleSpace' | 'custom'

const editorText = ref('')
const activePanel = ref<OperationPanelId>('indent')
const indentPreset = ref<IndentPresetId>('fullWidthSpace')
const customIndentToken = ref('')
const indentCountInput = ref<number | null>(2)
const blankLineCountInput = ref<number | null>(1)
const treatExistingBlankLinesAsParagraphs = ref(false)
const cleanupOptions = reactive<ClearFormattingOptions>({
  removeLeadingIndent: true,
  removeBlankLines: false,
  trimLineEndSpaces: true,
  removePanguSpacing: false
})

const history = ref<string[]>([''])
const historyIndex = ref(0)
const historyLimit = 100
let manualCommitTimer: ReturnType<typeof setTimeout> | null = null
let suppressHistoryWatch = false

const stats = computed(() => getArticleTextStats(editorText.value))

const operationPanels = computed<Array<{ id: OperationPanelId, label: string, icon: string }>>(() => [
  {id: 'indent', label: t('tools.articleFormat.panels.indent'), icon: 'i-lucide-indent-increase'},
  {id: 'blankLines', label: t('tools.articleFormat.panels.blankLines'), icon: 'i-lucide-separator-horizontal'},
  {id: 'cleanup', label: t('tools.articleFormat.panels.cleanup'), icon: 'i-lucide-eraser'},
  {id: 'spacing', label: t('tools.articleFormat.panels.spacing'), icon: 'i-lucide-languages'}
])

const indentPresets = computed<Array<{ id: IndentPresetId, label: string, token: string }>>(() => [
  {id: 'fullWidthSpace', label: t('tools.articleFormat.indent.presets.fullWidthSpace'), token: '　'},
  {id: 'tab', label: t('tools.articleFormat.indent.presets.tab'), token: '\t'},
  {id: 'doubleSpace', label: t('tools.articleFormat.indent.presets.doubleSpace'), token: '  '},
  {id: 'custom', label: t('tools.articleFormat.indent.presets.custom'), token: customIndentToken.value}
])

const resolvedIndentToken = computed(() => {
  const activePreset = indentPresets.value.find((item) => item.id === indentPreset.value)
  return activePreset?.token ?? '　'
})

function showToast(options: { title: string, color?: 'success' | 'error' | 'warning' | 'info', icon?: string }) {
  toast.add({
    title: options.title,
    color: options.color ?? 'info',
    icon: options.icon
  })
}

function clearPendingManualCommit() {
  if (manualCommitTimer) {
    clearTimeout(manualCommitTimer)
    manualCommitTimer = null
  }
}

function flushPendingManualCommit() {
  if (!manualCommitTimer) return

  clearTimeout(manualCommitTimer)
  pushHistorySnapshot(editorText.value)
  manualCommitTimer = null
}

function pushHistorySnapshot(value: string) {
  if (history.value[historyIndex.value] === value) return

  let nextHistory = history.value.slice(0, historyIndex.value + 1)
  nextHistory.push(value)

  if (nextHistory.length > historyLimit) {
    nextHistory = nextHistory.slice(nextHistory.length - historyLimit)
  }

  history.value = nextHistory
  historyIndex.value = history.value.length - 1
}

function replaceEditorText(value: string) {
  suppressHistoryWatch = true
  editorText.value = value
  nextTick(() => {
    suppressHistoryWatch = false
  })
}

function applyEditorTransform(transformer: (currentText: string) => string, successMessage: string) {
  flushPendingManualCommit()
  const nextText = transformer(editorText.value)

  if (nextText === editorText.value) {
    showToast({
      title: t('tools.articleFormat.messages.noChanges'),
      color: 'warning',
      icon: 'i-lucide-sparkles'
    })
    return
  }

  replaceEditorText(nextText)
  pushHistorySnapshot(nextText)

  showToast({
    title: successMessage,
    color: 'success',
    icon: 'i-lucide-circle-check-big'
  })
}

function normalizePositiveInteger(value: number | null | undefined, fallback = 1) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback
}

function applyIndent() {
  if (!resolvedIndentToken.value) {
    showToast({
      title: t('tools.articleFormat.validation.emptyIndentToken'),
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
    return
  }

  const count = normalizePositiveInteger(indentCountInput.value)
  indentCountInput.value = count

  applyEditorTransform(
      (currentText) => prependParagraphPrefix(currentText, resolvedIndentToken.value, count),
      t('tools.articleFormat.messages.indentApplied', {count})
  )
}

function applyBlankLines() {
  const count = normalizePositiveInteger(blankLineCountInput.value)
  blankLineCountInput.value = count

  applyEditorTransform(
      (currentText) => insertBlankLinesBetweenParagraphs(currentText, count, treatExistingBlankLinesAsParagraphs.value),
      t('tools.articleFormat.messages.blankLinesApplied', {count})
  )
}

function applyCleanup() {
  if (!Object.values(cleanupOptions).some(Boolean)) {
    showToast({
      title: t('tools.articleFormat.validation.noCleanupOption'),
      color: 'warning',
      icon: 'i-lucide-list-checks'
    })
    return
  }

  applyEditorTransform(
      (currentText) => clearFormatting(currentText, cleanupOptions),
      t('tools.articleFormat.messages.cleanupApplied')
  )
}

function applySpacing() {
  applyEditorTransform(
      (currentText) => applyPanguSpacing(currentText),
      t('tools.articleFormat.messages.spacingApplied')
  )
}

function resetAll() {
  clearPendingManualCommit()
  replaceEditorText('')
  history.value = ['']
  historyIndex.value = 0
  indentPreset.value = 'fullWidthSpace'
  customIndentToken.value = ''
  indentCountInput.value = 2
  blankLineCountInput.value = 1
  treatExistingBlankLinesAsParagraphs.value = false
  cleanupOptions.removeLeadingIndent = true
  cleanupOptions.removeBlankLines = false
  cleanupOptions.trimLineEndSpaces = true
  cleanupOptions.removePanguSpacing = false

  showToast({
    title: t('tools.articleFormat.messages.resetApplied'),
    color: 'success',
    icon: 'i-lucide-rotate-ccw'
  })
}

function undo() {
  flushPendingManualCommit()

  if (historyIndex.value === 0) {
    showToast({
      title: t('tools.articleFormat.validation.cannotUndo'),
      color: 'warning',
      icon: 'i-lucide-undo-2'
    })
    return
  }

  historyIndex.value -= 1
  replaceEditorText(history.value[historyIndex.value] ?? '')
}

function redo() {
  flushPendingManualCommit()

  if (historyIndex.value >= history.value.length - 1) {
    showToast({
      title: t('tools.articleFormat.validation.cannotRedo'),
      color: 'warning',
      icon: 'i-lucide-redo-2'
    })
    return
  }

  historyIndex.value += 1
  replaceEditorText(history.value[historyIndex.value] ?? '')
}

async function copyCurrentText() {
  if (!editorText.value) {
    showToast({
      title: t('tools.articleFormat.validation.emptyText'),
      color: 'warning',
      icon: 'i-lucide-copy-x'
    })
    return
  }

  await copy(editorText.value)
  showToast({
    title: t('tools.articleFormat.messages.copyApplied'),
    color: 'success',
    icon: 'i-lucide-copy-check'
  })
}

function selectPanel(panelId: OperationPanelId) {
  activePanel.value = panelId
}

function selectIndentPreset(presetId: IndentPresetId) {
  indentPreset.value = presetId
}

function handleEditorKeydown(event: KeyboardEvent) {
  if (!(event.metaKey || event.ctrlKey)) return

  if (event.key.toLowerCase() === 'z' && !event.shiftKey) {
    event.preventDefault()
    undo()
    return
  }

  if (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey)) {
    event.preventDefault()
    redo()
  }
}

watch(editorText, (value) => {
  if (suppressHistoryWatch) return

  clearPendingManualCommit()
  manualCommitTimer = setTimeout(() => {
    pushHistorySnapshot(value)
    manualCommitTimer = null
  }, 350)
})

onBeforeUnmount(() => {
  clearPendingManualCommit()
})
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_380px]">
    <SectionCard
        :description="t('tools.articleFormat.editorDescription')"
        :title="t('tools.articleFormat.editorTitle')"
    >
      <template #actions>
        <div class="flex flex-wrap items-center gap-2">
          <UBadge color="neutral" variant="soft">{{ t('tools.articleFormat.stats.characters') }} {{
              stats.characters
            }}
          </UBadge>
          <UBadge color="neutral" variant="soft">{{ t('tools.articleFormat.stats.lines') }} {{ stats.lines }}</UBadge>
          <UBadge color="neutral" variant="soft">{{ t('tools.articleFormat.stats.paragraphs') }} {{
              stats.paragraphs
            }}
          </UBadge>
        </div>
      </template>

      <div class="space-y-4">
        <div class="flex flex-wrap gap-2">
          <UButton
              :disabled="historyIndex === 0"
              color="neutral"
              icon="i-lucide-undo-2"
              variant="outline"
              @click="undo"
          >
            {{ t('tools.articleFormat.actions.undo') }}
          </UButton>
          <UButton
              :disabled="historyIndex >= history.length - 1"
              color="neutral"
              icon="i-lucide-redo-2"
              variant="outline"
              @click="redo"
          >
            {{ t('tools.articleFormat.actions.redo') }}
          </UButton>
          <UButton :icon="copied ? 'i-lucide-copy-check' : 'i-lucide-copy'" color="neutral" variant="outline"
                   @click="copyCurrentText">
            {{ copied ? t('common.copied') : t('common.copy') }}
          </UButton>
          <UButton color="neutral" icon="i-lucide-rotate-ccw" variant="ghost" @click="resetAll">
            {{ t('common.reset') }}
          </UButton>
        </div>

        <UTextarea
            v-model="editorText"
            :placeholder="t('tools.articleFormat.editorPlaceholder')"
            :rows="24"
            :ui="{
              base: 'min-h-[26rem] text-[15px] leading-7 font-medium'
            }"
            autoresize
            class="w-full"
            @keydown="handleEditorKeydown"
        />
      </div>
    </SectionCard>

    <SectionCard
        :description="t('tools.articleFormat.workbenchDescription')"
        :title="t('tools.articleFormat.workbenchTitle')"
    >
      <div class="space-y-5">
        <div class="grid grid-cols-2 gap-2">
          <UButton
              v-for="panel in operationPanels"
              :key="panel.id"
              :color="activePanel === panel.id ? 'primary' : 'neutral'"
              :icon="panel.icon"
              :variant="activePanel === panel.id ? 'soft' : 'ghost'"
              class="justify-start"
              @click="selectPanel(panel.id)"
          >
            {{ panel.label }}
          </UButton>
        </div>

        <div v-if="activePanel === 'indent'" class="space-y-4">
          <div>
            <p class="text-sm font-medium text-highlighted">{{ t('tools.articleFormat.indent.symbolTitle') }}</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <UButton
                  v-for="preset in indentPresets"
                  :key="preset.id"
                  :color="indentPreset === preset.id ? 'primary' : 'neutral'"
                  :variant="indentPreset === preset.id ? 'soft' : 'outline'"
                  @click="selectIndentPreset(preset.id)"
              >
                {{ preset.label }}
              </UButton>
            </div>
          </div>

          <UFormField v-if="indentPreset === 'custom'" :label="t('tools.articleFormat.indent.customLabel')">
            <UInput v-model="customIndentToken" :placeholder="t('tools.articleFormat.indent.customPlaceholder')"
                    class="w-full"/>
          </UFormField>

          <div class="rounded-2xl border border-default bg-elevated px-4 py-4">
            <div class="text-sm font-medium text-highlighted">{{ t('tools.articleFormat.indent.countLabel') }}</div>
            <div class="mt-3">
              <UInputNumber
                  v-model="indentCountInput"
                  :min="1"
                  :step="1"
                  class="w-full"
                  orientation="horizontal"
              />
            </div>
          </div>

          <UButton class="w-full justify-center" color="primary" icon="i-lucide-indent-increase" @click="applyIndent">
            {{ t('tools.articleFormat.indent.apply') }}
          </UButton>
        </div>

        <div v-else-if="activePanel === 'blankLines'" class="space-y-4">
          <div class="rounded-2xl border border-default bg-elevated px-4 py-4">
            <div class="text-sm font-medium text-highlighted">{{ t('tools.articleFormat.blankLines.countLabel') }}</div>
            <p class="mt-1 text-sm text-toned">{{ t('tools.articleFormat.blankLines.countHint') }}</p>
            <div class="mt-3">
              <UInputNumber
                  v-model="blankLineCountInput"
                  :min="1"
                  :step="1"
                  class="w-full"
                  orientation="horizontal"
              />
            </div>
          </div>

          <div class="rounded-2xl border border-default bg-elevated px-4 py-4">
            <UCheckbox v-model="treatExistingBlankLinesAsParagraphs"
                       :label="t('tools.articleFormat.blankLines.treatEmptyLineAsParagraph')"/>
            <p class="mt-2 text-sm text-toned">{{ t('tools.articleFormat.blankLines.treatEmptyLineHint') }}</p>
          </div>

          <UButton class="w-full justify-center" color="primary" icon="i-lucide-separator-horizontal"
                   @click="applyBlankLines">
            {{ t('tools.articleFormat.blankLines.apply') }}
          </UButton>
        </div>

        <div v-else-if="activePanel === 'cleanup'" class="space-y-4">
          <div class="space-y-3 rounded-2xl border border-default bg-elevated px-4 py-4">
            <UCheckbox v-model="cleanupOptions.removeLeadingIndent"
                       :label="t('tools.articleFormat.cleanup.removeLeadingIndent')"/>
            <UCheckbox v-model="cleanupOptions.removeBlankLines"
                       :label="t('tools.articleFormat.cleanup.removeBlankLines')"/>
            <UCheckbox v-model="cleanupOptions.trimLineEndSpaces"
                       :label="t('tools.articleFormat.cleanup.trimLineEndSpaces')"/>
            <UCheckbox v-model="cleanupOptions.removePanguSpacing"
                       :label="t('tools.articleFormat.cleanup.removePanguSpacing')"/>
          </div>

          <UButton class="w-full justify-center" color="primary" icon="i-lucide-eraser" @click="applyCleanup">
            {{ t('tools.articleFormat.cleanup.apply') }}
          </UButton>
        </div>

        <div v-else class="space-y-4">
          <div class="rounded-2xl border border-default bg-elevated px-4 py-4">
            <p class="text-sm font-medium text-highlighted">{{ t('tools.articleFormat.spacing.title') }}</p>
            <p class="mt-1 text-sm text-toned">{{ t('tools.articleFormat.spacing.description') }}</p>
          </div>

          <UButton class="w-full justify-center" color="primary" icon="i-lucide-languages" @click="applySpacing">
            {{ t('tools.articleFormat.spacing.apply') }}
          </UButton>
        </div>
      </div>
    </SectionCard>
  </div>
</template>
