export interface AppLocaleDefinition {
    code: string
    language: string
    file: string
    name: string
}

export const appLocales: AppLocaleDefinition[] = [
    {
        code: 'en-US',
        language: 'en-US',
        file: 'en-US.json',
        name: 'English (US)'
    },
    {
        code: 'zh-CN',
        language: 'zh-CN',
        file: 'zh-CN.json',
        name: '简体中文（中国大陆）'
    },
    {
        code: 'zh-TW',
        language: 'zh-TW',
        file: 'zh-TW.json',
        name: '繁體中文（台灣）'
    }
]
