const commonNumberFormats = {
    integer: {
        style: 'decimal',
        maximumFractionDigits: 0
    },
    decimal: {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }
}

const commonDateTimeFormats = {
    datetimeShort: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    },
    timeShort: {
        hour: '2-digit',
        minute: '2-digit'
    }
} as const

export default defineI18nConfig(() => ({
    locale: 'zh-CN',
    fallbackLocale: 'en-US',
    missingWarn: false,
    fallbackWarn: false,
    datetimeFormats: {
        'en-US': {
            datetimeShort: {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            },
            timeShort: {
                hour: 'numeric',
                minute: '2-digit'
            }
        },
        'zh-CN': commonDateTimeFormats,
        'zh-TW': commonDateTimeFormats,
    },
    numberFormats: {
        'en-US': commonNumberFormats,
        'zh-CN': commonNumberFormats,
        'zh-TW': commonNumberFormats,
    }
}))
