'use server'

import { cookies, headers } from 'next/headers'

const COOKIE_NAME = 'NEXT_LOCALE'
const defaultLocale = 'zh'
const supportedLocales = ['zh', 'en', 'ja']

export async function getUserLocale() {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get(COOKIE_NAME)?.value
  if (localeCookie && supportedLocales.includes(localeCookie)) {
    return localeCookie
  }

  // Detect from accept-language header
  const headersList = await headers()
  const acceptLanguage = headersList.get('accept-language')
  if (acceptLanguage) {
    // Basic detection
    const langs = acceptLanguage
      .split(',')
      .map((l) => l.split(';')[0].trim().toLowerCase())
    for (const lang of langs) {
      if (lang.startsWith('zh')) return 'zh'
      if (lang.startsWith('en')) return 'en'
      if (lang.startsWith('ja') || lang.startsWith('jp')) return 'ja'
    }
  }

  return defaultLocale
}

export async function setUserLocale(locale: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, locale, {
    maxAge: 365 * 24 * 60 * 60, // 1 year
    path: '/',
  })
}
