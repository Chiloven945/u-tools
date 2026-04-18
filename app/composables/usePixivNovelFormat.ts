import {
    applyPanguSpacing,
    clearFormatting,
    type ClearFormattingOptions,
    getArticleTextStats,
    insertBlankLinesBetweenParagraphs,
    prependParagraphPrefix,
    removeSpacingBetweenCjkAndLatin
} from '~/composables/useArticleFormat'

export type PixivHeadingMode = 'h1' | 'all'

export interface PixivRuleOptions {
    bold: boolean
    italic: boolean
    newPage: boolean
    headings: boolean
    links: boolean
}

export interface PixivConvertOptions {
    stripUnsupportedMarkdown: boolean
    convertHtml: boolean
    headingMode: PixivHeadingMode
    rules: PixivRuleOptions
}

const PIXIV_PLACEHOLDER_PREFIX = 'PIXIVLINKPLACEHOLDER'

function normalizeLineBreaks(input: string) {
    return input.replace(/\r\n?/g, '\n')
}

function decodeHtmlEntities(input: string) {
    return input
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
}

function stripHtmlTags(input: string) {
    return decodeHtmlEntities(input.replace(/<[^>]+>/g, ''))
}

function escapePixivText(input: string) {
    return input.replace(/\]/g, '\\]')
}

function toPixivLinkText(input: string) {
    return escapePixivText(input.replace(/\s+/g, ' ').trim())
}

function buildPixivTag(tagName: 'b' | 'i' | 'chapter', content: string) {
    const normalizedContent = content.replace(/\s+/g, ' ').trim()
    return normalizedContent ? `[${tagName}:${escapePixivText(normalizedContent)}]` : normalizedContent
}

function buildPixivLink(label: string, link: string) {
    const normalizedLabel = toPixivLinkText(label)
    const normalizedLink = link.trim()

    if (!normalizedLabel || !normalizedLink) return label

    return `[[jumpuri:${normalizedLabel} > ${normalizedLink}]]`
}

function collectLinkDefinitions(input: string) {
    const definitions = new Map<string, string>()
    const definitionPattern = /^\s{0,3}\[([^\]]+)\]:\s*(?:<([^>]+)>|(\S+))(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*$/gm

    let match: RegExpExecArray | null
    while ((match = definitionPattern.exec(input))) {
        const key = (match[1] || '').trim().toLowerCase()
        const url = (match[2] || match[3] || '').trim()
        if (key && url) definitions.set(key, url)
    }

    return definitions
}

function stripReferenceDefinitions(input: string) {
    return input.replace(/^\s{0,3}\[[^\]]+\]:\s*(?:<[^>]+>|\S+)(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*$/gm, '')
}

function convertInlineLinks(input: string) {
    return input.replace(
        /(?<!!)\[([^\]]+)\]\((<[^>]+>|[^)\s]+(?:\([^)]*\)[^)\s]*)?)(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\)/g,
        (_match, label: string, rawLink: string) => buildPixivLink(label, rawLink.replace(/^<|>$/g, ''))
    )
}

function convertReferenceLinks(input: string, definitions: Map<string, string>) {
    return input.replace(/(?<!!)\[([^\]]+)\]\s?\[([^\]]*)\]/g, (match, label: string, id: string) => {
        const key = (id || label).trim().toLowerCase()
        const resolvedLink = definitions.get(key)
        return resolvedLink ? buildPixivLink(label, resolvedLink) : match
    })
}

function convertAutomaticLinks(input: string) {
    return input.replace(/<((?:https?:\/\/|mailto:)[^>]+)>/g, (_match, link: string) => buildPixivLink(link, link))
}

function convertAtxHeadings(input: string, headingMode: PixivHeadingMode) {
    return input.replace(/^(\s{0,3})(#{1,6})[ \t]+(.+?)[ \t]*#*[ \t]*$/gm, (match, _indent: string, hashes: string, content: string) => {
        const level = hashes.length
        const shouldConvert = headingMode === 'all' ? level >= 1 && level <= 6 : level === 1
        return shouldConvert ? buildPixivTag('chapter', content) : match
    })
}

function convertSetextHeadings(input: string, headingMode: PixivHeadingMode) {
    return input.replace(/(^|\n)([^\n]+)\n([=-]{3,})[ \t]*(?=\n|$)/g, (match, boundary: string, content: string, marker: string) => {
        const level = marker.startsWith('=') ? 1 : 2
        const shouldConvert = headingMode === 'all' ? level >= 1 && level <= 2 : level === 1

        if (!shouldConvert) return match

        return `${boundary}${buildPixivTag('chapter', content)}`
    })
}

function convertHorizontalRules(input: string) {
    return input.replace(/^[ \t]{0,3}(?:(?:\*[ \t]*){3,}|(?:-[ \t]*){3,}|(?:_[ \t]*){3,})$/gm, '[newpage]')
}

function protectConvertedLinks(input: string) {
    const placeholders: string[] = []
    const text = input.replace(/\[\[jumpuri:[\s\S]*?\]\]/g, (match) => {
        const placeholder = `${PIXIV_PLACEHOLDER_PREFIX}${placeholders.length}END`
        placeholders.push(match)
        return placeholder
    })

    return {text, placeholders}
}

function restorePlaceholders(input: string, placeholders: string[]) {
    return input.replace(new RegExp(`${PIXIV_PLACEHOLDER_PREFIX}(\\d+)END`, 'g'), (_match, index: string) => placeholders[Number(index)] || '')
}

function convertStrong(input: string) {
    return input
        .replace(/\*\*(?=\S)([^\n]*?\S)\*\*/g, (_match, content: string) => buildPixivTag('b', content))
        .replace(/__(?=\S)([^\n]*?\S)__/g, (_match, content: string) => buildPixivTag('b', content))
}

function convertEmphasis(input: string) {
    return input
        .replace(/(^|[^*])\*(?=\S)([^\n*]*?\S)\*(?!\*)/g, (_match, prefix: string, content: string) => `${prefix}${buildPixivTag('i', content)}`)
        .replace(/(^|[^_])_(?=\S)([^\n_]*?\S)_(?!_)/g, (_match, prefix: string, content: string) => `${prefix}${buildPixivTag('i', content)}`)
}

function convertSupportedHtml(input: string, options: PixivConvertOptions) {
    let nextText = normalizeLineBreaks(input)

    nextText = nextText
        .replace(/<\s*br\s*\/?>/gi, '\n')
        .replace(/<\s*\/p\s*>/gi, '\n\n')
        .replace(/<\s*p\b[^>]*>/gi, '')
        .replace(/<\s*\/div\s*>/gi, '\n')
        .replace(/<\s*div\b[^>]*>/gi, '')
        .replace(/<\s*\/li\s*>/gi, '\n')
        .replace(/<\s*li\b[^>]*>/gi, '• ')
        .replace(/<\s*\/?(?:ul|ol|blockquote|section|article)\b[^>]*>/gi, '\n')

    if (options.rules.newPage) {
        nextText = nextText.replace(/<\s*hr\b[^>]*\/?>/gi, '[newpage]')
    }

    if (options.rules.links) {
        nextText = nextText.replace(/<\s*a\b[^>]*href\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>([\s\S]*?)<\s*\/a\s*>/gi, (_match, href1: string, href2: string, href3: string, label: string) => {
            const href = href1 || href2 || href3 || ''
            return buildPixivLink(stripHtmlTags(label), decodeHtmlEntities(href))
        })
    }

    if (options.rules.headings) {
        nextText = nextText.replace(/<\s*h([1-6])\b[^>]*>([\s\S]*?)<\s*\/h\1\s*>/gi, (match, rawLevel: string, content: string) => {
            const level = Number(rawLevel)
            const shouldConvert = options.headingMode === 'all' ? level >= 1 && level <= 6 : level === 1
            return shouldConvert ? buildPixivTag('chapter', stripHtmlTags(content)) : match
        })
    }

    if (options.rules.bold) {
        nextText = nextText
            .replace(/<\s*(?:strong|b)\b[^>]*>([\s\S]*?)<\s*\/\s*(?:strong|b)\s*>/gi, (_match, content: string) => buildPixivTag('b', stripHtmlTags(content)))
    }

    if (options.rules.italic) {
        nextText = nextText
            .replace(/<\s*(?:em|i)\b[^>]*>([\s\S]*?)<\s*\/\s*(?:em|i)\s*>/gi, (_match, content: string) => buildPixivTag('i', stripHtmlTags(content)))
    }

    return nextText
}

function stripUnsupportedMarkdownSyntax(input: string) {
    return normalizeLineBreaks(input)
        .replace(/^\s{0,3}\[[^\]]+\]:\s*(?:<[^>]+>|\S+)(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*$/gm, '')
        .replace(/!\[([^\]]*)\]\((?:<[^>]+>|[^)]+)\)/g, '$1')
        .replace(/!\[([^\]]*)\]\s?\[[^\]]*\]/g, '$1')
        .replace(/^[ \t]{0,3}>[ \t]?/gm, '')
        .replace(/^[ \t]{0,3}(?:[*+-]|\d+\.)[ \t]+/gm, '')
        .replace(/^(```|~~~)[^\n]*\n?/gm, '')
        .replace(/^[ \t]{4}/gm, '')
        .replace(/(^|[^`])`([^`]+)`/g, '$1$2')
        .replace(/~~(?=\S)([^\n]*?\S)~~/g, '$1')
        .replace(/\\([\\`*_{}\[\]()#+\-.!])/g, '$1')
        .replace(/^\s*[-=]{3,}\s*$/gm, '')
        .replace(/^\s{0,3}#{1,6}[ \t]*/gm, '')
}

function cleanupExtraSpacing(input: string) {
    return input
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/^\n+|\n+$/g, '')
}

export function convertMarkdownAndHtmlToPixiv(input: string, options: PixivConvertOptions) {
    let nextText = normalizeLineBreaks(input)

    if (options.convertHtml) {
        nextText = convertSupportedHtml(nextText, options)
    }

    const linkDefinitions = collectLinkDefinitions(nextText)

    if (options.rules.links) {
        nextText = convertInlineLinks(nextText)
        nextText = convertReferenceLinks(nextText, linkDefinitions)
        nextText = convertAutomaticLinks(nextText)
    }

    nextText = stripReferenceDefinitions(nextText)

    if (options.rules.headings) {
        nextText = convertSetextHeadings(nextText, options.headingMode)
        nextText = convertAtxHeadings(nextText, options.headingMode)
    }

    if (options.rules.newPage) {
        nextText = convertHorizontalRules(nextText)
    }

    const {text: protectedText, placeholders} = protectConvertedLinks(nextText)
    nextText = protectedText

    if (options.rules.bold) {
        nextText = convertStrong(nextText)
    }

    if (options.rules.italic) {
        nextText = convertEmphasis(nextText)
    }

    nextText = restorePlaceholders(nextText, placeholders)

    if (options.stripUnsupportedMarkdown) {
        nextText = stripUnsupportedMarkdownSyntax(nextText)
    }

    return cleanupExtraSpacing(nextText)
}

export interface PixivFormatState {
    indentToken: string
    indentCount: number
    blankLineCount: number
    treatExistingBlankLinesAsParagraphs: boolean
    cleanupOptions: ClearFormattingOptions
    usePanguSpacing: boolean
    pixivOptions: PixivConvertOptions
}

export function applyPixivNovelFormatting(input: string, state: PixivFormatState) {
    let nextText = normalizeLineBreaks(input)

    if (state.pixivOptions.rules.bold || state.pixivOptions.rules.italic || state.pixivOptions.rules.newPage || state.pixivOptions.rules.headings || state.pixivOptions.rules.links) {
        nextText = convertMarkdownAndHtmlToPixiv(nextText, state.pixivOptions)
    }

    if (state.usePanguSpacing) {
        nextText = applyPanguSpacing(nextText)
    }

    if (state.indentToken && state.indentCount > 0) {
        nextText = prependParagraphPrefix(nextText, state.indentToken, state.indentCount)
    }

    if (state.blankLineCount > 0) {
        nextText = insertBlankLinesBetweenParagraphs(nextText, state.blankLineCount, state.treatExistingBlankLinesAsParagraphs)
    }

    return clearFormatting(nextText, state.cleanupOptions)
}

export {
    applyPanguSpacing,
    clearFormatting,
    getArticleTextStats,
    insertBlankLinesBetweenParagraphs,
    prependParagraphPrefix,
    removeSpacingBetweenCjkAndLatin
}

export type {ClearFormattingOptions}
