import { useCallback, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { alternatePathFor } from '@/seo/routes'
import { LangContext } from './context'
import type { LangContextValue } from './context'
import type { Lang } from './core'
import { HTML_LANG, buildLangContextValue, writeLang } from './lang'
import { workspaceMessages } from './messages/workspace'

/**
 * URL-scoped language for the public demo workspace (`/demo`, `/fr/demo`).
 * Same contract as ForcedLangProvider, but loads the workspace catalogue so
 * doclib / advisor / shell keys resolve — the demo surface is the app UI.
 */
export function ForcedWorkspaceLangProvider({
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
      navigate(alternateHref ?? (next === 'fr' ? '/fr/demo' : '/demo'))
    },
    [lang, navigate, alternateHref],
  )

  const value = useMemo<LangContextValue>(
    () => buildLangContextValue(lang, updateLang, workspaceMessages, alternateHref),
    [lang, updateLang, alternateHref],
  )

  return <LangContext value={value}>{children}</LangContext>
}
