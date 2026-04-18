<script lang="ts" setup>
import {useClipboard} from '@vueuse/core'
import {
  applyPanguSpacing,
  clearFormatting,
  type ClearFormattingOptions,
  convertMarkdownAndHtmlToPixiv,
  getArticleTextStats,
  insertBlankLinesBetweenParagraphs,
  type PixivConvertOptions,
  type PixivHeadingMode,
  prependParagraphPrefix
} from '~/composables/usePixivNovelFormat'

const {t} = useI18n()
const toast = useToast()
const {copy, copied} = useClipboard()

type WorkspaceTabId = 'format' | 'pixiv' | 'cleanup'
type IndentPresetId = 'fullWidthSpace' | 'tab' | 'doubleSpace' | 'custom'

const editorText = ref('')
const activeTab = ref<WorkspaceTabId>('pixiv')
const dragActive = ref(false)
const supportedDialogOpen = ref(false)

const pixivSpecificationUrl = 'https://www.pixiv.help/hc/zh-cn/articles/235584168-%E5%8F%AF%E5%9C%A8%E5%B0%8F%E8%AF%B4%E6%AD%A3%E6%96%87%E5%86%85%E4%BD%BF%E7%94%A8%E7%9A%84pixiv%E5%B0%8F%E8%AF%B4%E6%96%87%E5%AD%97%E6%A0%B7%E5%BC%8F%E7%89%B9%E6%AE%8A%E6%A0%87%E7%AD%BE%E7%AE%80%E4%BB%8B'
const markdownSpecificationUrl = 'https://daringfireball.net/projects/markdown/'

const indentPreset = ref<IndentPresetId>('fullWidthSpace')
const customIndentToken = ref('')
const indentCountInput = ref<number | null>(2)
const blankLineCountInput = ref<number | null>(1)
const treatExistingBlankLinesAsParagraphs = ref(false)
const headingMode = ref<PixivHeadingMode>('all')
const convertHtml = ref(true)
const stripUnsupportedMarkdown = ref(true)

const pixivRules = reactive({
  bold: true,
  italic: true,
  newPage: true,
  headings: true,
  links: true
})

const cleanupOptions = reactive<ClearFormattingOptions>({
  removeLeadingIndent: false,
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

const workspaceTabs = computed<Array<{ id: WorkspaceTabId, label: string, icon: string }>>(() => [
  {id: 'pixiv', label: t('tools.pixivNovelFormat.tabs.pixiv'), icon: 'i-lucide-sparkles'},
  {id: 'format', label: t('tools.pixivNovelFormat.tabs.format'), icon: 'i-lucide-align-left'},
  {id: 'cleanup', label: t('tools.pixivNovelFormat.tabs.cleanup'), icon: 'i-lucide-eraser'}
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

const headingModeItems = computed<Array<{ id: PixivHeadingMode, label: string }>>(() => [
  {id: 'all', label: t('tools.pixivNovelFormat.pixiv.headingModes.all')},
  {id: 'h1', label: t('tools.pixivNovelFormat.pixiv.headingModes.h1')}
])

const pixivRuleItems = computed<Array<{ key: keyof typeof pixivRules, icon: string, label: string }>>(() => [
  {key: 'bold', icon: 'i-lucide-bold', label: t('tools.pixivNovelFormat.pixiv.rules.bold')},
  {key: 'italic', icon: 'i-lucide-italic', label: t('tools.pixivNovelFormat.pixiv.rules.italic')},
  {key: 'newPage', icon: 'i-lucide-separator-horizontal', label: t('tools.pixivNovelFormat.pixiv.rules.newPage')},
  {key: 'headings', icon: 'i-lucide-heading', label: t('tools.pixivNovelFormat.pixiv.rules.headings')},
  {key: 'links', icon: 'i-lucide-link', label: t('tools.pixivNovelFormat.pixiv.rules.links')}
])

const supportedConversionCards = computed(() => [
  {
    key: 'bold',
    icon: 'i-lucide-bold',
    title: t('tools.pixivNovelFormat.pixiv.supportedCards.bold.title'),
    examples: ['**text**', '__text__', '<strong>text</strong>', '<b>text</b>'],
    result: '[b:text]'
  },
  {
    key: 'italic',
    icon: 'i-lucide-italic',
    title: t('tools.pixivNovelFormat.pixiv.supportedCards.italic.title'),
    examples: ['*text*', '_text_', '<em>text</em>', '<i>text</i>'],
    result: '[i:text]'
  },
  {
    key: 'newPage',
    icon: 'i-lucide-separator-horizontal',
    title: t('tools.pixivNovelFormat.pixiv.supportedCards.newPage.title'),
    examples: ['---', '***', '___', '<hr>'],
    result: '[newpage]'
  },
  {
    key: 'heading',
    icon: 'i-lucide-heading',
    title: t('tools.pixivNovelFormat.pixiv.supportedCards.heading.title'),
    examples: ['# Heading', 'Heading\n===', '<h1>Heading</h1>', '<h2>Heading</h2>'],
    result: '[chapter:text]',
    note: t('tools.pixivNovelFormat.pixiv.supportedCards.heading.note')
  },
  {
    key: 'link',
    icon: 'i-lucide-link',
    title: t('tools.pixivNovelFormat.pixiv.supportedCards.link.title'),
    examples: ['[text](link)', '[text][ref]', '<https://example.com>', '<a href="link">text</a>'],
    result: '[[jumpuri:text > link]]'
  },
  {
    key: 'html',
    icon: 'i-lucide-code-xml',
    title: t('tools.pixivNovelFormat.pixiv.supportedCards.html.title'),
    examples: ['<p>paragraph</p>', '<br>', '<strong>', '<em>', '<a>', '<hr>', '<h1>–<h6>'],
    result: t('tools.pixivNovelFormat.pixiv.supportedCards.html.result'),
    note: t('tools.pixivNovelFormat.pixiv.supportedCards.html.note')
  }
])

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

function getPixivOptions(): PixivConvertOptions {
  return {
    stripUnsupportedMarkdown: stripUnsupportedMarkdown.value,
    convertHtml: convertHtml.value,
    headingMode: headingMode.value,
    rules: {
      bold: pixivRules.bold,
      italic: pixivRules.italic,
      newPage: pixivRules.newPage,
      headings: pixivRules.headings,
      links: pixivRules.links
    }
  }
}

function applyPixivConversion() {
  if (!Object.values(pixivRules).some(Boolean)) {
    showToast({
      title: t('tools.pixivNovelFormat.validation.noPixivRule'),
      color: 'warning',
      icon: 'i-lucide-list-checks'
    })
    return
  }

  applyEditorTransform(
      (currentText) => convertMarkdownAndHtmlToPixiv(currentText, getPixivOptions()),
      t('tools.pixivNovelFormat.messages.pixivApplied')
  )
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

function applySpacing() {
  applyEditorTransform(
      (currentText) => applyPanguSpacing(currentText),
      t('tools.articleFormat.messages.spacingApplied')
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

function resetAll() {
  clearPendingManualCommit()
  replaceEditorText('')
  history.value = ['']
  historyIndex.value = 0
  activeTab.value = 'pixiv'
  indentPreset.value = 'fullWidthSpace'
  customIndentToken.value = ''
  indentCountInput.value = 2
  blankLineCountInput.value = 1
  treatExistingBlankLinesAsParagraphs.value = false
  headingMode.value = 'all'
  convertHtml.value = true
  stripUnsupportedMarkdown.value = true
  pixivRules.bold = true
  pixivRules.italic = true
  pixivRules.newPage = true
  pixivRules.headings = true
  pixivRules.links = true
  cleanupOptions.removeLeadingIndent = false
  cleanupOptions.removeBlankLines = false
  cleanupOptions.trimLineEndSpaces = true
  cleanupOptions.removePanguSpacing = false

  showToast({
    title: t('tools.pixivNovelFormat.messages.resetApplied'),
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

function selectIndentPreset(presetId: IndentPresetId) {
  indentPreset.value = presetId
}

function selectTab(tabId: WorkspaceTabId) {
  activeTab.value = tabId
}

function selectHeadingMode(mode: PixivHeadingMode) {
  headingMode.value = mode
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

function isSupportedDropFile(file: File) {
  const lowerName = file.name.toLowerCase()
  return lowerName.endsWith('.md') || lowerName.endsWith('.txt') || file.type === 'text/markdown' || file.type === 'text/plain'
}

function handleDragEnter() {
  dragActive.value = true
}

function handleDragLeave(event: DragEvent) {
  const currentTarget = event.currentTarget as HTMLElement | null
  const relatedTarget = event.relatedTarget as Node | null

  if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget)) return
  dragActive.value = false
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  dragActive.value = true
}

async function handleDrop(event: DragEvent) {
  event.preventDefault()
  dragActive.value = false

  const file = event.dataTransfer?.files?.[0]
  if (!file) return

  if (!isSupportedDropFile(file)) {
    showToast({
      title: t('tools.pixivNovelFormat.validation.unsupportedFile'),
      color: 'warning',
      icon: 'i-lucide-triangle-alert'
    })
    return
  }

  const content = await file.text()
  flushPendingManualCommit()
  replaceEditorText(content)
  pushHistorySnapshot(content)

  showToast({
    title: t('tools.pixivNovelFormat.messages.fileLoaded', {name: file.name}),
    color: 'success',
    icon: 'i-lucide-file-check'
  })
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
  <div class="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_420px]">
    <SectionCard
        :description="t('tools.pixivNovelFormat.editorDescription')"
        :title="t('tools.pixivNovelFormat.editorTitle')"
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
          <UButton
              :icon="copied ? 'i-lucide-copy-check' : 'i-lucide-copy'"
              color="neutral"
              variant="outline"
              @click="copyCurrentText"
          >
            {{ copied ? t('common.copied') : t('common.copy') }}
          </UButton>
          <UButton color="neutral" icon="i-lucide-rotate-ccw" variant="ghost" @click="resetAll">
            {{ t('common.reset') }}
          </UButton>
        </div>

        <div
            :class="dragActive ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-default'"
            class="rounded-2xl border border-dashed p-2 transition"
            @dragenter="handleDragEnter"
            @dragleave="handleDragLeave"
            @dragover="handleDragOver"
            @drop="handleDrop"
        >
          <div v-if="dragActive"
               class="flex min-h-20 items-center justify-center rounded-xl bg-primary/5 px-4 text-sm text-primary">
            {{ t('tools.pixivNovelFormat.dropzoneActive') }}
          </div>

          <UTextarea
              v-model="editorText"
              :placeholder="t('tools.pixivNovelFormat.editorPlaceholder')"
              :rows="24"
              :ui="{
              base: 'min-h-[28rem] text-[15px] leading-7 font-medium'
            }"
              autoresize
              class="w-full"
              @keydown="handleEditorKeydown"
          />
        </div>
      </div>
    </SectionCard>

    <SectionCard
        :description="t('tools.pixivNovelFormat.workbenchDescription')"
        :title="t('tools.pixivNovelFormat.workbenchTitle')"
    >
      <div class="space-y-5">
        <div class="grid grid-cols-3 gap-2">
          <UButton
              v-for="tab in workspaceTabs"
              :key="tab.id"
              :color="activeTab === tab.id ? 'primary' : 'neutral'"
              :icon="tab.icon"
              :variant="activeTab === tab.id ? 'soft' : 'ghost'"
              class="justify-start"
              @click="selectTab(tab.id)"
          >
            {{ tab.label }}
          </UButton>
        </div>

        <div v-if="activeTab === 'pixiv'" class="space-y-4">
          <div class="rounded-2xl border border-default bg-elevated px-4 py-4">
            <div>
              <p class="text-sm font-medium text-highlighted">{{
                  t('tools.pixivNovelFormat.pixiv.supportedTitle')
                }}</p>
              <p class="mt-1 text-sm text-toned">{{ t('tools.pixivNovelFormat.pixiv.supportedDescription') }}</p>
            </div>

            <div class="mt-4">
              <UButton
                  class="w-full justify-center"
                  color="primary"
                  icon="i-lucide-book-open"
                  variant="soft"
                  @click="supportedDialogOpen = true"
              >
                {{ t('tools.pixivNovelFormat.pixiv.supportedOpen') }}
              </UButton>
            </div>

            <div class="mt-3 grid gap-2 sm:grid-cols-2">
              <UButton
                  :to="pixivSpecificationUrl"
                  class="w-full justify-center"
                  color="neutral"
                  icon="i-lucide-external-link"
                  rel="noopener noreferrer"
                  target="_blank"
                  variant="outline"
              >
                {{ t('tools.pixivNovelFormat.pixiv.supportedPixivSpec') }}
              </UButton>
              <UButton
                  :to="markdownSpecificationUrl"
                  class="w-full justify-center"
                  color="neutral"
                  icon="i-lucide-file-text"
                  rel="noopener noreferrer"
                  target="_blank"
                  variant="outline"
              >
                {{ t('tools.pixivNovelFormat.pixiv.supportedMarkdownSpec') }}
              </UButton>
            </div>
          </div>

          <div class="space-y-3 rounded-2xl border border-default bg-elevated px-4 py-4">
            <p class="text-sm font-medium text-highlighted">{{ t('tools.pixivNovelFormat.pixiv.rulesTitle') }}</p>
            <div class="grid gap-3 sm:grid-cols-2">
              <label
                  v-for="rule in pixivRuleItems"
                  :key="rule.key"
                  class="flex items-center justify-between gap-3 rounded-xl border border-default px-3 py-3"
              >
                <div class="flex min-w-0 items-center gap-2">
                  <UIcon :name="rule.icon" class="size-4 text-primary"/>
                  <span class="text-sm text-highlighted">{{ rule.label }}</span>
                </div>
                <USwitch v-model="pixivRules[rule.key]"/>
              </label>
            </div>
          </div>

          <div class="space-y-3 rounded-2xl border border-default bg-elevated px-4 py-4">
            <p class="text-sm font-medium text-highlighted">{{ t('tools.pixivNovelFormat.pixiv.optionsTitle') }}</p>

            <label class="flex items-center justify-between gap-3 rounded-xl border border-default px-3 py-3">
              <div>
                <p class="text-sm text-highlighted">{{ t('tools.pixivNovelFormat.pixiv.convertHtml') }}</p>
                <p class="mt-1 text-sm text-toned">{{ t('tools.pixivNovelFormat.pixiv.convertHtmlHint') }}</p>
              </div>
              <USwitch v-model="convertHtml"/>
            </label>

            <label class="flex items-center justify-between gap-3 rounded-xl border border-default px-3 py-3">
              <div>
                <p class="text-sm text-highlighted">{{ t('tools.pixivNovelFormat.pixiv.stripUnsupportedMarkdown') }}</p>
                <p class="mt-1 text-sm text-toned">{{
                    t('tools.pixivNovelFormat.pixiv.stripUnsupportedMarkdownHint')
                  }}</p>
              </div>
              <USwitch v-model="stripUnsupportedMarkdown"/>
            </label>

            <div class="rounded-xl border border-default px-3 py-3">
              <p class="text-sm text-highlighted">{{ t('tools.pixivNovelFormat.pixiv.headingModeTitle') }}</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <UButton
                    v-for="item in headingModeItems"
                    :key="item.id"
                    :color="headingMode === item.id ? 'primary' : 'neutral'"
                    :variant="headingMode === item.id ? 'soft' : 'outline'"
                    @click="selectHeadingMode(item.id)"
                >
                  {{ item.label }}
                </UButton>
              </div>
            </div>
          </div>

          <UButton class="w-full justify-center" color="primary" icon="i-lucide-sparkles" @click="applyPixivConversion">
            {{ t('tools.pixivNovelFormat.pixiv.apply') }}
          </UButton>
        </div>

        <div v-else-if="activeTab === 'format'" class="space-y-4">
          <div class="rounded-2xl border border-default bg-elevated px-4 py-4">
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

            <UFormField v-if="indentPreset === 'custom'" :label="t('tools.articleFormat.indent.customLabel')"
                        class="mt-4">
              <UInput v-model="customIndentToken" :placeholder="t('tools.articleFormat.indent.customPlaceholder')"
                      class="w-full"/>
            </UFormField>

            <div class="mt-4 rounded-xl border border-default px-3 py-3">
              <div class="text-sm text-highlighted">{{ t('tools.articleFormat.indent.countLabel') }}</div>
              <div class="mt-3">
                <UInputNumber v-model="indentCountInput" :min="1" :step="1" class="w-full" orientation="horizontal"/>
              </div>
            </div>

            <UButton class="mt-4 w-full justify-center" color="primary" icon="i-lucide-indent-increase"
                     @click="applyIndent">
              {{ t('tools.articleFormat.indent.apply') }}
            </UButton>
          </div>

          <div class="rounded-2xl border border-default bg-elevated px-4 py-4">
            <div class="rounded-xl border border-default px-3 py-3">
              <div class="text-sm text-highlighted">{{ t('tools.articleFormat.blankLines.countLabel') }}</div>
              <p class="mt-1 text-sm text-toned">{{ t('tools.articleFormat.blankLines.countHint') }}</p>
              <div class="mt-3">
                <UInputNumber v-model="blankLineCountInput" :min="1" :step="1" class="w-full" orientation="horizontal"/>
              </div>
            </div>

            <div class="mt-4 rounded-xl border border-default px-3 py-3">
              <UCheckbox v-model="treatExistingBlankLinesAsParagraphs"
                         :label="t('tools.articleFormat.blankLines.treatEmptyLineAsParagraph')"/>
              <p class="mt-2 text-sm text-toned">{{ t('tools.articleFormat.blankLines.treatEmptyLineHint') }}</p>
            </div>

            <UButton class="mt-4 w-full justify-center" color="primary" icon="i-lucide-separator-horizontal"
                     @click="applyBlankLines">
              {{ t('tools.articleFormat.blankLines.apply') }}
            </UButton>
          </div>

          <div class="rounded-2xl border border-default bg-elevated px-4 py-4">
            <div class="rounded-xl border border-default px-3 py-3">
              <p class="text-sm font-medium text-highlighted">{{ t('tools.articleFormat.spacing.title') }}</p>
              <p class="mt-1 text-sm text-toned">{{ t('tools.articleFormat.spacing.description') }}</p>
            </div>

            <UButton class="mt-4 w-full justify-center" color="primary" icon="i-lucide-languages" @click="applySpacing">
              {{ t('tools.articleFormat.spacing.apply') }}
            </UButton>
          </div>
        </div>

        <div v-else class="space-y-4">
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
      </div>
    </SectionCard>
  </div>

  <UModal
      :open="supportedDialogOpen"
      :ui="{
      overlay: 'bg-black/35 backdrop-blur-[2px]',
      content: 'bg-(--ui-bg)/90 backdrop-blur-[4px] sm:max-w-4xl rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden'
    }"
      @update:open="value => { supportedDialogOpen = value }"
  >
    <template #content>
      <div class="flex max-h-[90vh] flex-col p-4 sm:p-6">
        <div class="mb-5 flex items-start justify-between gap-4">
          <div>
            <div class="text-sm text-muted">{{ t('tools.pixivNovelFormat.tab') }}</div>
            <h2 class="mt-1 text-xl font-semibold text-highlighted">
              {{ t('tools.pixivNovelFormat.pixiv.supportedModalTitle') }}</h2>
            <p class="mt-2 text-sm text-toned">{{ t('tools.pixivNovelFormat.pixiv.supportedModalDescription') }}</p>
          </div>
          <UButton
              :aria-label="t('common.closeDialog')"
              color="neutral"
              icon="i-lucide-x"
              variant="ghost"
              @click="supportedDialogOpen = false"
          />
        </div>

        <div class="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          <div class="grid gap-2 sm:grid-cols-2">
            <UButton
                :to="pixivSpecificationUrl"
                class="w-full justify-center"
                color="neutral"
                icon="i-lucide-external-link"
                rel="noopener noreferrer"
                target="_blank"
                variant="outline"
            >
              {{ t('tools.pixivNovelFormat.pixiv.supportedPixivSpec') }}
            </UButton>
            <UButton
                :to="markdownSpecificationUrl"
                class="w-full justify-center"
                color="neutral"
                icon="i-lucide-file-text"
                rel="noopener noreferrer"
                target="_blank"
                variant="outline"
            >
              {{ t('tools.pixivNovelFormat.pixiv.supportedMarkdownSpec') }}
            </UButton>
          </div>

          <div class="rounded-2xl border border-default bg-elevated px-4 py-3">
            <p class="text-sm text-toned">{{ t('tools.pixivNovelFormat.pixiv.supportedModalTip') }}</p>
          </div>

          <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div
                v-for="item in supportedConversionCards"
                :key="item.key"
                class="rounded-2xl border border-default bg-elevated p-4"
            >
              <div class="flex items-start gap-3">
                <div class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <UIcon :name="item.icon" class="size-4"/>
                </div>

                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-highlighted">{{ item.title }}</p>

                  <div class="mt-3 space-y-2">
                    <div
                        v-for="example in item.examples"
                        :key="example"
                        class="rounded-xl border border-default bg-default px-3 py-2 text-sm text-toned break-words"
                    >
                      {{ example }}
                    </div>
                  </div>

                  <div class="mt-3 rounded-xl border border-default bg-default px-3 py-3">
                    <p class="text-xs text-muted">{{ t('tools.pixivNovelFormat.pixiv.supportedResultLabel') }}</p>
                    <div class="mt-1 break-words text-sm font-medium text-highlighted">{{ item.result }}</div>
                  </div>

                  <p v-if="item.note" class="mt-3 text-sm text-toned">{{ item.note }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-5 flex justify-end">
          <UButton color="neutral" variant="outline" @click="supportedDialogOpen = false">{{
              t('common.close')
            }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
