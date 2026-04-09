export interface RandomInsertOptions {
    seed?: string
}

export interface RandomInsertResult {
    outputs: string[]
}

function splitLines(text: string) {
    return text.split(/\r\n|\r|\n/)
}

export function parseInsertSymbols(text: string) {
    return splitLines(text)
        .map((line) => line.trim())
        .filter(Boolean)
}

export function countNonWhitespaceCharacters(text: string) {
    let count = 0

    for (const character of text) {
        if (!/\s/.test(character)) {
            count += 1
        }
    }

    return count
}

function hashSeed(seed: string) {
    let hash = 1779033703 ^ seed.length

    for (let index = 0; index < seed.length; index += 1) {
        hash = Math.imul(hash ^ seed.charCodeAt(index), 3432918353)
        hash = (hash << 13) | (hash >>> 19)
    }

    return () => {
        hash = Math.imul(hash ^ (hash >>> 16), 2246822507)
        hash = Math.imul(hash ^ (hash >>> 13), 3266489909)
        hash ^= hash >>> 16
        return hash >>> 0
    }
}

function createSeededRandom(seed: string) {
    let value = hashSeed(seed)()

    return () => {
        value += 0x6d2b79f5
        let t = value
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function createRandom(seed?: string) {
    if (!seed) {
        return () => Math.random()
    }

    return createSeededRandom(seed)
}

function shuffleList<T>(items: T[], random: () => number) {
    const list = [...items]

    for (let index = list.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(random() * (index + 1))
        ;[list[index], list[swapIndex]] = [list[swapIndex], list[index]]
    }

    return list
}

export function buildBalancedSymbolPool(symbols: string[], totalNeeded: number, random: () => number) {
    const symbolCount = symbols.length
    const baseCount = Math.floor(totalNeeded / symbolCount)
    const remainder = totalNeeded % symbolCount
    const indexOrder = shuffleList(
        Array.from({length: symbolCount}, (_, index) => index),
        random
    )

    const counts = Array.from({length: symbolCount}, () => baseCount)

    for (let index = 0; index < remainder; index += 1) {
        counts[indexOrder[index]] += 1
    }

    const pool: string[] = []

    counts.forEach((count, index) => {
        for (let repeat = 0; repeat < count; repeat += 1) {
            pool.push(symbols[index])
        }
    })

    return shuffleList(pool, random)
}

export function insertBalancedRandomSymbols(sourceText: string, symbols: string[], random: () => number) {
    const nonWhitespaceCount = countNonWhitespaceCharacters(sourceText)
    const symbolPool = buildBalancedSymbolPool(symbols, nonWhitespaceCount, random)

    let poolIndex = 0
    let output = ''

    for (const character of sourceText) {
        if (/\s/.test(character)) {
            output += character
            continue
        }

        output += symbolPool[poolIndex]
        output += character
        poolIndex += 1
    }

    return output
}

export function generateRandomInsertResults(
    sourceText: string,
    symbolsText: string,
    generateCount: number,
    options: RandomInsertOptions = {}
): RandomInsertResult {
    const symbols = parseInsertSymbols(symbolsText)

    if (!sourceText) {
        throw new Error('empty-source')
    }

    if (!symbols.length) {
        throw new Error('empty-symbols')
    }

    if (!Number.isInteger(generateCount) || generateCount < 1 || generateCount > 10000) {
        throw new Error('invalid-count')
    }

    if (countNonWhitespaceCharacters(sourceText) === 0) {
        throw new Error('no-characters')
    }

    const random = createRandom(options.seed)
    const outputs = Array.from({length: generateCount}, () =>
        insertBalancedRandomSymbols(sourceText, symbols, random)
    )

    return {
        outputs
    }
}
