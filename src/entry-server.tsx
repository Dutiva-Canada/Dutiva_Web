/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
/* oxlint-disable react/only-export-components -- build-time server entry,
   not a fast-refresh module: it exports render + manifest functions. */
import { prerender } from 'react-dom/static'
import { StaticRouterProvider, createStaticHandler, createStaticRouter } from 'react-router-dom'
import { routes } from '@/app/routes'
import type { Lang } from '@/i18n/core'
import { HTML_LANG } from '@/i18n/lang'
import { loadPolicyEdition, policyDoc } from '@/features/marketing/legal/policyContent'
import { latestChangelogDate } from '@/features/marketing/changelog/changelogEntries'
import { ALL_ARTICLES } from '@/features/marketing/articles'
import { HeadSinkContext } from '@/seo/Seo'
import type { HeadSink } from '@/seo/Seo'
import { parseDisplayDate } from '@/seo/dates'
import { serializeHead } from '@/seo/head'
import type { HeadData } from '@/seo/head'
import { allPublicPages, langOfPath } from '@/seo/routes'
import { ORG, ORG_DESCRIPTION, SITE_ORIGIN, FOUNDER } from '@/seo/site'
import { ThemeProvider } from '@/lib/theme'

/**
 * Build-time prerender entry (scripts/prerender.mjs). Renders a public URL
 * over the exact same route table as the browser (src/app/routes.tsx) with
 * react-dom/static's `prerender`, which waits for Suspense — lazy route
 * chunks and `use()`-loaded policy editions resolve before HTML is emitted.
 * Page metadata is collected through the HeadSink instead of a DOM.
 *
 * This module runs only at build time in Node; it is never shipped to the
 * browser.
 */

export { serializeHead, HTML_LANG, SITE_ORIGIN, ORG, ORG_DESCRIPTION, FOUNDER }

export interface RenderedPage {
  html: string
  head: HeadData | null
}

export async function renderPage(pathname: string): Promise<RenderedPage> {
  const sink: HeadSink = { head: null }
  const handler = createStaticHandler(routes)
  const context = await handler.query(new Request(`${SITE_ORIGIN}${pathname}`))
  if (context instanceof Response) {
    throw new Error(`Unexpected ${context.status} response while prerendering ${pathname}`)
  }
  const router = createStaticRouter(handler.dataRoutes, context)

  const { prelude } = await prerender(
    <ThemeProvider>
      <HeadSinkContext value={sink}>
        <StaticRouterProvider router={router} context={context} />
      </HeadSinkContext>
    </ThemeProvider>,
  )

  return { html: await readStream(prelude), head: sink.head }
}

async function readStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let html = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    html += decoder.decode(value, { stream: true })
  }
  return html + decoder.decode()
}

export interface ManifestEntry {
  /** Registry key (route id or `legalDoc:<slug>`). */
  key: string
  lang: Lang
  htmlLang: string
  path: string
  indexable: boolean
  /** Reciprocal alternate pathnames (includes self). */
  alternates: { en: string; fr: string }
  title: string
  description: string
  /** ISO 8601, only where the content carries a real date (policy docs). */
  lastmod?: string
}

/**
 * Every public page × locale, from the SEO route registry — the single
 * input for prerendering, sitemap.xml, and llms.txt generation.
 */
export async function buildPrerenderManifest(): Promise<ManifestEntry[]> {
  const entries: ManifestEntry[] = []
  for (const page of allPublicPages()) {
    for (const lang of ['en', 'fr'] as const) {
      entries.push({
        key: page.key,
        lang,
        htmlLang: HTML_LANG[lang],
        path: page.path[lang],
        indexable: page.indexable,
        alternates: { en: page.path.en, fr: page.path.fr },
        title: page.title[lang],
        description: page.description[lang],
        lastmod: await lastmodFor(page.key, lang),
      })
    }
  }
  return entries
}

/** Pages that carry a real, authored date supply a sitemap lastmod; the rest
    carry none, because a lastmod that moves on every build teaches crawlers to
    ignore it. Two sources qualify: policy documents display a "Last updated"
    date (reused here, parsed to ISO), and editorial articles declare `updated`
    on the article record. Everything else is undefined by design. */
async function lastmodFor(key: string, lang: Lang): Promise<string | undefined> {
  if (key.startsWith('legalDoc:')) {
    const doc = policyDoc(key.slice('legalDoc:'.length))
    if (!doc) return undefined
    const resolved = await loadPolicyEdition(doc, lang)
    return resolved ? parseDisplayDate(resolved.edition.lastUpdated) : undefined
  }
  /* `guideDoc:<slug>` / `blogDoc:<slug>` — minted in allPublicPages(). Both
     locales share one date: the article is authored bilingually in a single
     record, so an EN/FR split would be fictional. */
  const articleMatch = key.match(/^(?:guide|blog)Doc:(.+)$/)
  if (articleMatch) {
    return ALL_ARTICLES.find((a) => a.slug === articleMatch[1])?.updated
  }
  if (key === 'changelog') return latestChangelogDate()
  return undefined
}

export { langOfPath }
