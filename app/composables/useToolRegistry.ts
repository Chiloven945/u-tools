export interface ToolDefinition {
    id: string
    label: string
    description: string
    icon: string
}

function readStringValue(value: unknown) {
    if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : ''
    return typeof value === 'string' ? value : ''
}

export function useToolRegistry() {
    const {t} = useI18n()

    const tools = computed<ToolDefinition[]>(() => [
        {
            id: 'name-grouping',
            label: t('tools.nameGrouping.tab'),
            description: t('tools.nameGrouping.description'),
            icon: 'i-lucide-users-round'
        },
        {
            id: 'random-insert',
            label: t('tools.randomInsert.tab'),
            description: t('tools.randomInsert.description'),
            icon: 'i-lucide-wand-sparkles'
        },
        {
            id: 'article-format',
            label: t('tools.articleFormat.tab'),
            description: t('tools.articleFormat.description'),
            icon: 'i-lucide-file-text'
        }
    ])

    function normalizeToolId(value: unknown) {
        const requestedToolId = readStringValue(value)
        const fallbackToolId = tools.value[0]?.id || 'name-grouping'

        if (!requestedToolId) {
            return fallbackToolId
        }

        return tools.value.some((tool) => tool.id === requestedToolId) ? requestedToolId : fallbackToolId
    }

    return {
        tools,
        normalizeToolId
    }
}
