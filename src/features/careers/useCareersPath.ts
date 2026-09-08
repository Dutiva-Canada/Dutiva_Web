/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { useMemo } from 'react'
import { useI18n } from '@/i18n/context'
import { seoRoute } from '@/seo/routes'

/**
 * Locale-aware pathnames for the public careers surface. The job board lives
 * under URL-scoped language (ForcedLangProvider), so internal links must
 * resolve to `/careers` or `/fr/carrieres` based on the current locale.
 *
 * The candidate portal (`/careers/portal`) has no locale URLs — it uses
 * LangProvider (persisted preference) — so its path is always the same
 * regardless of locale.
 */
export function useCareersPath() {
  const { lang } = useI18n()
  return useMemo(() => {
    const board = seoRoute('careers').path[lang]
    return {
      /** Job board index in the current locale. */
      board,
      /** Job detail page in the current locale. */
      jobDetail: (postingId: string) => `${board}/jobs/${postingId}`,
      /** Candidate portal — no locale URL (preference-scoped language). */
      portal: '/careers/portal',
      /** Apply form — inside the portal, no locale URL. */
      apply: (postingId: string) => `/careers/portal/jobs/${postingId}/apply`,
    }
  }, [lang])
}
