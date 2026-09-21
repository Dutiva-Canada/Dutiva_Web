import { createContext, useContext } from 'react'
import type { Bi, Lang } from './core'
import type { MessageKey } from './messages'

export interface LangContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  /**
   * The catalogue `t()` resolves against. Exposed so `LangScope` can merge a
   * page's own message modules on top of the surface catalogue — that is
   * what keeps each lazy marketing page's strings inside its own chunk
   * instead of one eager `messages-marketing` bundle.
   */
  catalogue: Record<string, Bi>
  /** Look up a UI-chrome string by key. */
  t: (key: MessageKey) => string
  /** Inline bilingual pair — mirrors the prototype's `L(en, fr)`. */
  L: (en: string, fr: string) => string
  /** Resolve a bilingual data field ({ en, fr }). */
  x: (value: Bi) => string
  /**
   * On public pages (URL-scoped language, see ForcedLangProvider) the same
   * page's pathname in the other language — the language toggle renders it
   * as a real link so the EN/FR pair reference each other crawlably.
   * Undefined in the app surface, where language is a client preference.
   */
  alternateHref?: string
}

export const LangContext = createContext<LangContextValue | null>(null)

export function useI18n(): LangContextValue {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useI18n must be used within a LangProvider')
  return ctx
}
