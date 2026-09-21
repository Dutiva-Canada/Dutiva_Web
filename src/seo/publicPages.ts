/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import type { Bi, Lang } from '@/i18n/core'
import { pick } from '@/i18n/core'
import { legalHubMessages } from '@/i18n/messages/legalHub'
import type { LegalHubRow } from '@/features/marketing/legal/legalHubData'
import { HELP_ARTICLES } from '@/features/support/help/helpCenterData'
import { ALL_ARTICLES, articlePath } from '@/features/marketing/articles'
import { formatMetaDescription } from './metaDescription'
import {
  LEGAL_ROWS,
  SEO_ROUTES,
  articleDescription,
  articleTitle,
  helpDocDescription,
  helpDocPath,
  helpDocTitle,
  legalDocPath,
} from './routes'

/**
 * The titled page registry — every public page with localized title and meta
 * description, driving the sitemap, llms.txt, and the prerender manifest.
 *
 * Separate from `routes.ts` on purpose: resolving legal-document titles needs
 * the `legalHub` message module, and `routes.ts` sits in the client entry
 * chunk. This module is imported only by the SSR entry and by lazy pages
 * (PolicyPage), so the catalogue weight never reaches the marketing eager
 * graph.
 */

/** Localized document title / short description from the message catalogue. */
export function legalDocTitle(row: LegalHubRow, lang: Lang): string {
  return pick(legalHubMessages[row.titleKey], lang)
}

export function legalDocDescription(row: LegalHubRow, lang: Lang): string {
  const title = legalDocTitle(row, lang)
  const desc = pick(legalHubMessages[row.descKey], lang)
  const suffix =
    lang === 'fr'
      ? ' Document officiel Dutiva Canada Inc.'
      : ' Official Dutiva Canada Inc. policy document.'
  return formatMetaDescription(`${title}: ${desc}`, lang, suffix)
}

export interface PublicPage {
  /** Registry route id, or `legalDoc:<slug>` for policy documents. */
  key: string
  path: Record<Lang, string>
  title: Bi
  description: Bi
  indexable: boolean
}

/** Every public page (static routes + the 26 policy documents), one entry per
    EN/FR pair. Drives the sitemap, llms.txt, and prerender manifest. */
export function allPublicPages(): PublicPage[] {
  const staticPages: PublicPage[] = SEO_ROUTES.map((r) => ({
    key: r.id,
    path: r.path,
    title: r.title,
    description: r.description,
    indexable: r.indexable,
  }))
  const legalPages: PublicPage[] = LEGAL_ROWS.map((row) => ({
    key: `legalDoc:${row.slug}`,
    path: { en: legalDocPath(row, 'en'), fr: legalDocPath(row, 'fr') },
    title: {
      en: `${legalDocTitle(row, 'en')} | Dutiva`,
      fr: `${legalDocTitle(row, 'fr')} | Dutiva`,
    },
    description: {
      en: legalDocDescription(row, 'en'),
      fr: legalDocDescription(row, 'fr'),
    },
    indexable: true,
  }))
  const helpPages: PublicPage[] = HELP_ARTICLES.map((article) => ({
    key: `helpDoc:${article.slug}`,
    path: { en: helpDocPath(article, 'en'), fr: helpDocPath(article, 'fr') },
    title: {
      en: `${helpDocTitle(article, 'en')} | Dutiva Help`,
      fr: `${helpDocTitle(article, 'fr')} | Aide Dutiva`,
    },
    description: {
      en: helpDocDescription(article, 'en'),
      fr: helpDocDescription(article, 'fr'),
    },
    indexable: true,
  }))
  /* Editorial articles — `/guides/<slug>` and `/blog/<slug>`, keyed by
     collection so the two never collide even if a slug were ever reused. */
  const articlePages: PublicPage[] = ALL_ARTICLES.map((article) => ({
    key: `${article.collection}Doc:${article.slug}`,
    path: { en: articlePath(article, 'en'), fr: articlePath(article, 'fr') },
    title: {
      en: `${articleTitle(article, 'en')} | Dutiva`,
      fr: `${articleTitle(article, 'fr')} | Dutiva`,
    },
    description: {
      en: articleDescription(article, 'en'),
      fr: articleDescription(article, 'fr'),
    },
    indexable: true,
  }))
  return [...staticPages, ...legalPages, ...helpPages, ...articlePages]
}
