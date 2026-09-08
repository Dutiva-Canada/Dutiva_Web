/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { Link, Outlet } from 'react-router-dom'
import { ArrowRight, Globe } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { Lang } from '@/i18n/core'
import { HTML_LANG, writeLang } from '@/i18n/lang'
import { careersMessages as M } from '@/i18n/messages/careers'
import { usePublicPath } from '@/seo/usePublicPath'
import { useCareersPath } from './useCareersPath'

/**
 * Thin shell for the public careers surface (/careers, /fr/carrieres). Simpler
 * than the marketing header — just the Dutiva wordmark, a language toggle,
 * and a link to the candidate portal — so the job board reads as its own
 * product, not a marketing page. The footer is minimal: copyright and a
 * privacy link.
 *
 * Language is URL-scoped (ForcedLangProvider): the toggle renders a real link
 * to the same page's URL in the other locale, so EN/FR pages cross-reference
 * each other crawlably.
 */
export function CareersLayout() {
  const { x, L, lang, alternateHref } = useI18n()
  const { legalDoc } = usePublicPath()
  const paths = useCareersPath()

  const other: Lang = lang === 'fr' ? 'en' : 'fr'
  const label = lang === 'en' ? 'FR' : 'EN'

  return (
    <div className="surface-app min-h-screen bg-bg text-text">
      <header className="sticky top-0 z-30 border-b border-border bg-bg-elevated backdrop-blur-[18px]">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3 sm:px-6">
          <Link to={paths.board} className="flex items-center gap-2">
            <span className="font-display text-lg font-bold text-text">
              Duti<span className="text-gold-strong">va</span>
            </span>
            <span className="text-[0.625rem] font-semibold tracking-[0.28em] text-text-3">
              {x(M.careers_portal_title)}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {alternateHref && (
              <Link
                to={alternateHref}
                className="inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-[10px] border border-control-border bg-bg-elevated px-3 font-sans text-[0.8125rem] font-semibold text-text transition-[border-color,background-color,color] duration-[160ms] ease-in-out hover:border-gold-border"
                aria-label={`${label} · ${L('Toggle language', 'Changer de langue')}`}
                hrefLang={HTML_LANG[other]}
                onClick={() => writeLang(other)}
              >
                <Globe size={15} aria-hidden="true" />
                {label}
              </Link>
            )}
            <Link
              to={paths.portal}
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-text transition-[border-color] hover:border-gold-border"
            >
              {x(M.careers_auth_signin_tab)}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-bg">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
          <p className="text-xs text-text-3">
            {L('\u00A9 2026 Dutiva Canada Inc.', '\u00A9 2026 Dutiva Canada Inc.')}
          </p>
          <Link
            to={legalDoc('privacy')}
            className="text-xs text-text-2 transition-opacity hover:opacity-80"
          >
            {L('Privacy', 'Confidentialit\u00E9')}
          </Link>
        </div>
      </footer>
    </div>
  )
}
