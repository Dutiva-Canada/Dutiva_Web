import { useCallback, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { alternatePathFor } from '@/seo/routes'
import { LangContext } from './context'
import type { LangContextValue } from './context'
import type { Lang } from './core'
import { HTML_LANG, buildLangContextValue, writeLang } from './lang'
import { common } from './messages/common'
import { landingChrome } from './messages/landing/chrome'
import { landingFooter } from './messages/landing/footer'
import { seoMetaMessages } from './messages/seoMeta'

/**
 * The catalogue available to every marketing page without a `LangScope`:
 * shared chrome (Header/Footer strings), the SEO meta copy `seo/routes.ts`
 * reads eagerly, and the legal disclaimer. Page-specific sections are merged
 * in by each page's own `LangScope`, so they ship inside the page's lazy
 * chunk — see LangScope.tsx for why.
 */
const MARKETING_CHROME = {
  ...common,
  ...seoMetaMessages,
  ...landingChrome,
  ...landingFooter,
} as const

/**
 * URL-scoped language provider for the public marketing surface. The route
 * decides the language (`/fr/…` → French, everything else → English), so a
 * crawler and a visitor sharing a URL always see the same language —
 * language is never inferred from cookies or browser settings.
 *
 * "Switching language" here means navigating to the same page's URL in the
 * other locale (from the SEO route registry); the persisted `dutiva-lang`
 * preference is updated so the app surface follows the visitor's last
 * explicit choice.
 */
export function ForcedLangProvider({
  lang,
  children,
}: {
  readonly lang: Lang
  readonly children: ReactNode
}) {
  const navigate = useNavigate()
  const { pathname, hash } = useLocation()

  useEffect(() => {
    document.documentElement.setAttribute('lang', HTML_LANG[lang])
  }, [lang])

  const other: Lang = lang === 'fr' ? 'en' : 'fr'
  const alternateHref = useMemo(() => {
    const alternate = alternatePathFor(pathname, other)
    return alternate ? `${alternate}${hash}` : undefined
  }, [pathname, hash, other])

  const updateLang = useCallback(
    (next: Lang) => {
      if (next === lang) return
      writeLang(next)
      navigate(alternateHref ?? (next === 'fr' ? '/fr' : '/'))
    },
    [lang, navigate, alternateHref],
  )

  const value = useMemo<LangContextValue>(
    () => buildLangContextValue(lang, updateLang, MARKETING_CHROME, alternateHref),
    [lang, updateLang, alternateHref],
  )

  return <LangContext value={value}>{children}</LangContext>
}
