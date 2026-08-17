/*
 *   Copyright (c) 2026 
 *   All rights reserved.
 */
import { useMemo } from 'react'
import { useI18n } from '@/i18n/context'
import { legalDocPath, legalRowBySlug, seoRoute } from './routes'
import type { SeoRouteId } from './routes'

/**
 * Locale-aware pathnames for internal links on the public surface. English
 * pages link to unprefixed URLs, French pages to their `/fr` equivalents,
 * so navigation always stays in the visitor's language (and crawlers see
 * locale-consistent link graphs).
 */
export function usePublicPath() {
  const { lang } = useI18n()
  return useMemo(
    () => ({
      /** Pathname of a registry route in the current language. */
      p: (id: SeoRouteId) => seoRoute(id).path[lang],
      /** Pathname of a policy document (`/legal/<slug>` or `/fr/juridique/<frSlug>`). */
      legalDoc: (slug: string) => {
        const row = legalRowBySlug(slug)
        return row ? legalDocPath(row, lang) : seoRoute('legal').path[lang]
      },
      /** Homepage (optionally with a landing-section hash anchor). */
      home: (hash?: string) => `${lang === 'fr' ? '/fr' : '/'}${hash ? `#${hash}` : ''}`,
    }),
    [lang],
  )
}
