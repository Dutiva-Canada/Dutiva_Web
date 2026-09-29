import type { Bi } from '@/i18n/core'

/**
 * Wrap single-language user input into a `Bi`, flagging the untranslated side
 * for review. Returns undefined for empty input.
 */
export function biInput(value: string, lang: 'en' | 'fr'): Bi | undefined {
  const text = value.trim()
  if (!text) return undefined
  return lang === 'fr'
    ? { en: `[EN review] ${text}`, fr: text }
    : { en: text, fr: `[FR review] ${text}` }
}
