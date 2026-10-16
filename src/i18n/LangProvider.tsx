import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { LangContext } from './context'
import type { LangContextValue } from './context'
import type { Lang } from './core'
import { HTML_LANG, buildLangContextValue, readLang, writeLang } from './lang'
import { messages } from './messages'

/**
 * Preference-scoped language provider for the app surface (/workspace…): language
 * follows the persisted `dutiva-lang` preference and toggles in place.
 * Public marketing routes instead use ForcedLangProvider, where the URL is
 * the source of truth (/fr… → French).
 *
 * Passes the full merged `messages` catalogue rather than the narrower
 * `workspaceMessages` (src/i18n/messages/workspace.ts). `/workspace` is already
 * behind a lazy route boundary and off the marketing critical path
 * (TODO.md EF6/EF6b), so trimming its bundle here has no measurable eager-
 * graph payoff — and `src/test/renderApp.tsx`, this provider's other
 * consumer, is reused by every page's tests regardless of surface
 * (including 17 marketing page test files, e.g. TemplateUsagePage.test.tsx),
 * so scoping it down would make those tests fail on marketing-only keys for
 * no bundle-size benefit. ForcedLangProvider is the one that matters for
 * EF6a and is scoped to `marketingMessages`.
 */
export function LangProvider({ children }: { readonly children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(readLang)

  useEffect(() => {
    document.documentElement.setAttribute('lang', HTML_LANG[lang])
  }, [lang])

  const updateLang = useCallback((next: Lang) => {
    writeLang(next)
    setLang(next)
  }, [])

  const value = useMemo<LangContextValue>(
    () => buildLangContextValue(lang, updateLang, messages),
    [lang, updateLang],
  )

  return <LangContext value={value}>{children}</LangContext>
}
