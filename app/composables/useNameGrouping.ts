import {z} from 'zod'

export interface GroupingOptions {
    dedupe: boolean
    seed?: string
}

export interface GroupingResult {
    groups: string[][]
    seedUsed: string
    rawCount: number
    usableCount: number
    removedCount: number
}

function hashSeed(input: string) {
    let h = 1779033703 ^ input.length

    for (let index = 0; index < input.length; index += 1) {
        h = Math.imul(h ^ input.charCodeAt(index), 3432918353)
        h = (h << 13) | (h >>> 19)
    }

    return () => {
        h = Math.imul(h ^ (h >>> 16), 2246822507)
        h = Math.imul(h ^ (h >>> 13), 3266489909)
        return (h ^= h >>> 16) >>> 0
    }
}

function createRandom(seed: string) {
    const seedValue = hashSeed(seed)()
    let state = seedValue || 0x6d2b79f5

    return () => {
        state += 0x6d2b79f5
        let value = state
        value = Math.imul(value ^ (value >>> 15), value | 1)
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296
    }
}

function shuffle<T>(items: T[], seed: string) {
    const random = createRandom(seed)
    const result = [...items]

    for (let index = result.length - 1; index > 0; index -= 1) {
        const target = Math.floor(random() * (index + 1))
        ;[result[index], result[target]] = [result[target], result[index]]
    }

    return result
}

const groupingSchema = z.object({
    names: z.array(z.string().min(1)).min(1),
    groupCount: z.number().int().min(1)
})

export function parseNames(input: string, dedupe: boolean) {
    const rawNames = input
        .split(/\r?\n/g)
        .map((item) => item.trim())
        .filter(Boolean)

    if (!dedupe) {
        return {
            rawCount: rawNames.length,
            names: rawNames,
            removedCount: 0
        }
    }

    const uniqueNames: string[] = []
    const seen = new Set<string>()

    for (const name of rawNames) {
        const key = name.toLocaleLowerCase()

        if (seen.has(key)) {
            continue
        }

        seen.add(key)
        uniqueNames.push(name)
    }

    return {
        rawCount: rawNames.length,
        names: uniqueNames,
        removedCount: rawNames.length - uniqueNames.length
    }
}

export function createGroups(input: string, groupCount: number, options: GroupingOptions): GroupingResult {
    const parsed = parseNames(input, options.dedupe)

    const validated = groupingSchema.parse({
        names: parsed.names,
        groupCount
    })

    if (validated.groupCount > validated.names.length) {
        throw new Error('too-many-groups')
    }

    const seedUsed = options.seed?.trim() || `${Date.now()}`
    const shuffled = shuffle(validated.names, seedUsed)
    const groups = Array.from({length: validated.groupCount}, () => [] as string[])

    shuffled.forEach((name, index) => {
        groups[index % validated.groupCount].push(name)
    })

    return {
        groups,
        seedUsed,
        rawCount: parsed.rawCount,
        usableCount: validated.names.length,
        removedCount: parsed.removedCount
    }
}
