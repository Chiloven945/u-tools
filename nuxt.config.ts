import {appLocales} from './app/i18n/locales.config'

export default defineNuxtConfig({
    compatibilityDate: '2026-04-05',
    srcDir: 'app/',
    devtools: {enabled: true},
    modules: ['@nuxt/ui', '@pinia/nuxt', '@nuxtjs/i18n'],
    css: ['~/assets/css/main.css'],
    ui: {
        fonts: false
    },
    i18n: {
        restructureDir: 'app/i18n',
        strategy: 'no_prefix',
        defaultLocale: 'zh-CN',
        lazy: true,
        langDir: 'locales',
        locales: appLocales,
        detectBrowserLanguage: {
            useCookie: true,
            cookieKey: 'u_tools_locale',
            alwaysRedirect: false,
            fallbackLocale: 'zh-CN'
        },
        vueI18n: './app/i18n/i18n.config.ts'
    },
    app: {
        head: {
            title: 'u-tools',
            meta: [
                {name: 'viewport', content: 'width=device-width, initial-scale=1'},
                {
                    name: 'description',
                    content: 'A clean multi-tool website built with Nuxt UI 4. The first tool groups names randomly.'
                }
            ]
        }
    },
    typescript: {
        strict: true,
        typeCheck: false
    }
})
