import { locales, type Locale, defaultLocale } from '@/i18n/config'

export function normalizeLocale(value: string | null | undefined): Locale {
  if (!value) return defaultLocale
  const lower = value.toLowerCase()
  return (locales as readonly string[]).includes(lower) ? (lower as Locale) : defaultLocale
}

export function extractLocaleFromPath(pathname: string): { locale: Locale | null; rest: string } {
  const match = pathname.match(/^\/(en|ar)(\/.*)?$/i)
  if (!match) return { locale: null, rest: pathname }
  return { locale: normalizeLocale(match[1]), rest: match[2] || '/' }
}
