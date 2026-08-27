/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
/**
 * Sitemap `lastmod` for public pages. Only real authored dates — or the max
 * of children's authored dates on collection indexes — never the build date.
 * A lastmod that moves on every build teaches crawlers to ignore it.
 */
import type { Lang } from '@/i18n/core'
import { latestChangelogDate } from '@/features/marketing/changelog/changelogEntries'
import { ALL_ARTICLES, BLOG_ARTICLES, GUIDE_ARTICLES } from '@/features/marketing/articles'
import { loadPolicyEdition, policyDoc } from '@/features/marketing/legal/policyContent'
import { HELP_ARTICLES } from '@/features/support/help/helpCenterData'
import { maxIsoDate, parseDisplayDate } from '@/seo/dates'
import { LEGAL_ROWS, SEO_ROUTES } from '@/seo/routes'

const policyDateCache = new Map<string, Promise<string | undefined>>()

function policyLastmod(slug: string, lang: Lang): Promise<string | undefined> {
  const cacheKey = `${slug}:${lang}`
  const cached = policyDateCache.get(cacheKey)
  if (cached) return cached
  const pending = (async () => {
    const doc = policyDoc(slug)
    if (!doc) return undefined
    const resolved = await loadPolicyEdition(doc, lang)
    return resolved ? parseDisplayDate(resolved.edition.lastUpdated) : undefined
  })()
  policyDateCache.set(cacheKey, pending)
  return pending
}

async function maxPolicyLastmod(lang: Lang): Promise<string | undefined> {
  const dates = await Promise.all(LEGAL_ROWS.map((row) => policyLastmod(row.slug, lang)))
  return maxIsoDate(dates)
}

/**
 * Pages that carry a real authored date supply a sitemap lastmod. Collection
 * indexes use the newest child date. Static marketing pages use `updated` on
 * the SEO route when the page copy has a known content date.
 */
export async function lastmodFor(key: string, lang: Lang): Promise<string | undefined> {
  if (key.startsWith('legalDoc:')) {
    return policyLastmod(key.slice('legalDoc:'.length), lang)
  }
  /* `guideDoc:<slug>` / `blogDoc:<slug>` — minted in allPublicPages(). Both
     locales share one date: the article is authored bilingually in a single
     record, so an EN/FR split would be fictional. */
  const articleMatch = /^(?:guide|blog)Doc:(.+)$/.exec(key)
  if (articleMatch) {
    return ALL_ARTICLES.find((a) => a.slug === articleMatch[1])?.updated
  }
  if (key.startsWith('helpDoc:')) {
    return HELP_ARTICLES.find((a) => a.slug === key.slice('helpDoc:'.length))?.updated
  }
  if (key === 'changelog') return latestChangelogDate()
  if (key === 'guides') return maxIsoDate(GUIDE_ARTICLES.map((a) => a.updated))
  if (key === 'blog') return maxIsoDate(BLOG_ARTICLES.map((a) => a.updated))
  if (key === 'help') return maxIsoDate(HELP_ARTICLES.map((a) => a.updated))
  if (key === 'legal') return maxPolicyLastmod(lang)
  /* Homepage shows the guide cards and the latest product copy. */
  if (key === 'home') {
    return maxIsoDate([latestChangelogDate(), ...GUIDE_ARTICLES.map((a) => a.updated)])
  }
  return SEO_ROUTES.find((r) => r.id === key)?.updated
}
