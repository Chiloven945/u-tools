import pangu from 'pangu'

export interface ClearFormattingOptions {
    removeLeadingIndent: boolean
    removeBlankLines: boolean
    trimLineEndSpaces: boolean
    removePanguSpacing: boolean
}

const CJK = String.raw`(?:\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul})`
const LATIN_OR_NUMBER_TOKEN = String.raw`(?:[A-Za-z0-9]+(?:[A-Za-z0-9_./:@#%&=+\-]*[A-Za-z0-9])?)`

function normalizeLineBreaks(input: string) {
    return input.replace(/\r\n?/g, '\n')
}

function toRepeatedToken(token: string, count: number) {
    return new Array(Math.max(1, count)).fill(token).join('')
}

export function prependParagraphPrefix(input: string, token: string, count: number) {
    const safeInput = normalizeLineBreaks(input)
    const prefix = toRepeatedToken(token, count)

    return safeInput
        .split('\n')
        .map((line) => (line.trim().length ? `${prefix}${line}` : line))
        .join('\n')
}

export function insertBlankLinesBetweenParagraphs(
    input: string,
    blankLineCount: number,
    treatExistingBlankLinesAsParagraphs: boolean
) {
    const safeInput = normalizeLineBreaks(input)
    const lines = safeInput.split('\n')
    const separator = new Array(Math.max(0, blankLineCount)).fill('')

    if (!lines.length) return ''

    if (treatExistingBlankLinesAsParagraphs) {
        return lines
            .flatMap((line, index) => (index === lines.length - 1 ? [line] : [line, ...separator]))
            .join('\n')
    }

    const nonEmptyLines = lines.filter((line) => line.trim().length)

    return nonEmptyLines
        .flatMap((line, index) => (index === nonEmptyLines.length - 1 ? [line] : [line, ...separator]))
        .join('\n')
}

export function removeSpacingBetweenCjkAndLatin(input: string) {
    const safeInput = normalizeLineBreaks(input)

    return safeInput
        .replace(new RegExp(`(${CJK})[ \t\u3000]+(${LATIN_OR_NUMBER_TOKEN})`, 'gu'), '$1$2')
        .replace(new RegExp(`(${LATIN_OR_NUMBER_TOKEN})[ \t\u3000]+(${CJK})`, 'gu'), '$1$2')
}

export function applyPanguSpacing(input: string) {
    return pangu.spacingText(normalizeLineBreaks(input))
}

export function clearFormatting(input: string, options: ClearFormattingOptions) {
    let nextText = normalizeLineBreaks(input)

    if (options.removeLeadingIndent) {
        nextText = nextText.replace(/^[\t \u3000]+/gm, '')
    }

    if (options.trimLineEndSpaces) {
        nextText = nextText.replace(/[\t \u3000]+$/gm, '')
    }

    if (options.removePanguSpacing) {
        nextText = removeSpacingBetweenCjkAndLatin(nextText)
    }

    if (options.removeBlankLines) {
        nextText = nextText
            .split('\n')
            .filter((line) => line.trim().length)
            .join('\n')
    }

    return nextText
}

export function getArticleTextStats(input: string) {
    const normalized = normalizeLineBreaks(input)
    const lines = normalized.length ? normalized.split('\n') : []
    const paragraphs = lines.filter((line) => line.trim().length)
    const characters = normalized.length

    return {
        lines: lines.length,
        paragraphs: paragraphs.length,
        characters
    }
}
