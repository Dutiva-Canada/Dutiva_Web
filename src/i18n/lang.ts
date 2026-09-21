import { readPref, writePref } from '@/lib/prefs'
import type { LangContextValue } from './context'
import { pick } from './core'
import type { Bi, Lang } from './core'
import type { MessageKey } from './messages'

export const LANG_KEY = 'dutiva-lang'

/** BCP 47 tags for <html lang> — Canadian English / Canadian French. */
export const HTML_LANG: Record<Lang, string> = { en: 'en-CA', fr: 'fr-CA' }

export function readLang(): Lang {
  return readPref(LANG_KEY, 'en') === 'fr' ? 'fr' : 'en'
}

export function writeLang(next: Lang): void {
  writePref(LANG_KEY, next)
}

/**
 * Shared context assembly for both providers (stored-pref and URL-forced).
 *
 * `catalogue` is deliberately a parameter rather than the full merged
 * `messages` object: `LangProvider` passes `workspaceMessages`,
 * `ForcedLangProvider` passes `marketingMessages` (src/i18n/messages), so
 * each surface's bundle only pulls in its own group's modules — see
 * src/i18n/messages/index.ts for why that split exists.
 *
 * `t()` is still typed `MessageKey` (the full union) because scoping it per
 * surface is the larger half of TODO.md EF6a, not done here. That gap means
 * a call site *could* ask this catalogue for a key from the other surface —
 * today's audit found none, but a future one could compile fine and then
 * find nothing at runtime. Degrade rather than throw: log loudly, return the
 * raw key so the page still renders. `pick()` on `undefined` would otherwise
 * throw reading `.en`/`.fr`, turning one scope mistake into a crashed page.
 */
export function buildLangContextValue(
  lang: Lang,
  setLang: (next: Lang) => void,
  catalogue: Record<string, Bi>,
  alternateHref?: string,
): LangContextValue {
  const t = (key: MessageKey): string => {
    const entry = catalogue[key]
    if (!entry) {
      console.error(`[i18n] "${key}" is not in this surface's message catalogue.`)
      return key
    }
    return pick(entry, lang)
  }

  return {
    lang,
    setLang,
    catalogue,
    t,
    L: (en, fr) => (lang === 'fr' ? fr : en),
    x: (v) => pick(v, lang),
    alternateHref,
  }
}
