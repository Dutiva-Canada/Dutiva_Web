import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { LangContext, useI18n } from './context'
import type { LangContextValue } from './context'
import type { Bi } from './core'
import { buildLangContextValue } from './lang'

/**
 * Merges extra message modules into the i18n catalogue for this subtree.
 *
 * The marketing surface's provider keeps only the eager chrome catalogue
 * (common + seo meta + header/footer); each lazy page wraps its root in a
 * `LangScope` carrying the section modules it `t()`s against, so those
 * strings bundle into the page's chunk instead of one eager
 * `messages-marketing` preload. Scopes nest: a child's entries are merged
 * over the parent catalogue.
 */
export function LangScope({
  messages,
  children,
}: {
  readonly messages: Record<string, Bi>
  readonly children: ReactNode
}) {
  const parent = useI18n()
  const value = useMemo<LangContextValue>(
    () =>
      buildLangContextValue(
        parent.lang,
        parent.setLang,
        { ...parent.catalogue, ...messages },
        parent.alternateHref,
      ),
    [parent, messages],
  )
  return <LangContext value={value}>{children}</LangContext>
}
