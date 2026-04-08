export default defineNuxtPlugin(async (nuxtApp) => {
    const storageKey = 'u_tools_locale'
    const i18n = nuxtApp.$i18n

    const savedLocale = window.localStorage.getItem(storageKey)
    const cookieLocale = typeof i18n.getLocaleCookie === 'function' ? i18n.getLocaleCookie() : undefined
    const nextLocale = savedLocale || cookieLocale

    if (nextLocale && nextLocale !== i18n.locale.value) {
        await i18n.setLocale(nextLocale)
    }

    watch(
        () => i18n.locale.value,
        (value) => {
            window.localStorage.setItem(storageKey, value)
        },
        {immediate: true}
    )
})
