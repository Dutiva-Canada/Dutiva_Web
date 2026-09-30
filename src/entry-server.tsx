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
import { HeadSinkContext } from '@/seo/Seo'
import type { HeadSink } from '@/seo/Seo'
import { lastmodFor } from '@/seo/lastmod'
import { serializeHead } from '@/seo/head'
import type { HeadData } from '@/seo/head'
import { allPublicPages } from '@/seo/publicPages'
import { langOfPath } from '@/seo/routes'
import { seoRoute } from '@/seo/routes'
import { getActiveJobPostingsForSitemap } from '@/seo/careersSitemap'
import type { SitemapJobPosting } from '@/seo/careersSitemap'
import { PrerenderJobPostingContext } from '@/features/careers/prerenderJobPosting'
import { ORG, ORG_DESCRIPTION, SITE_ORIGIN, FOUNDER } from '@/seo/site'
import { ThemeProvider } from '@/lib/theme'
import { AppBootSkeleton } from '@/features/app/shell/AppBootSkeleton'

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
export { llmQuestionsMarkdown } from '@/seo/llmQuestions'

export interface RenderedPage {
  html: string
  head: HeadData | null
}

const MAX_REDIRECTS = 3

export async function renderPage(
  pathname: string,
  redirectCount = 0,
  jobPosting: SitemapJobPosting | null = null,
): Promise<RenderedPage> {
  if (redirectCount > MAX_REDIRECTS) {
    throw new Error(`Too many redirects while prerendering ${pathname}`)
  }

  const sink: HeadSink = { head: null }
  const handler = createStaticHandler(routes)
  const context = await handler.query(new Request(`${SITE_ORIGIN}${pathname}`))
  if (context instanceof Response) {
    if (context.status >= 300 && context.status < 400) {
      const location = context.headers.get('Location')
      if (!location) {
        throw new Error(`Redirect without Location header while prerendering ${pathname}`)
      }
      const nextPathname = new URL(location, SITE_ORIGIN).pathname
      return renderPage(nextPathname, redirectCount + 1)
    }
    throw new Error(`Unexpected ${context.status} response while prerendering ${pathname}`)
  }
  const router = createStaticRouter(handler.dataRoutes, context)

  const { prelude } = await prerender(
    <ThemeProvider>
      <HeadSinkContext value={sink}>
        {/* Careers job detail pages get their posting injected so the static
            render emits real content — the client fetch path never runs in a
            static render. */}
        <PrerenderJobPostingContext value={jobPosting}>
          <StaticRouterProvider router={router} context={context} />
        </PrerenderJobPostingContext>
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

/**
 * Static boot skeleton for dist/app.html — painted instantly by the HTML
 * itself while the client bundle downloads, so the signed-in shell never
 * shows a blank white first paint. Same component RequireAdminSession
 * renders during the resolution window, so boot → gate is seamless.
 */
export async function renderAppBootHtml(): Promise<string> {
  const { prelude } = await prerender(
    <div role="status" aria-label="Loading your workspace · Chargement de votre espace de travail">
      <AppBootSkeleton />
    </div>,
  )
  return readStream(prelude)
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
  /** ISO 8601, only where the content carries a real authored date. */
  lastmod?: string
  /** Careers job detail pages carry their posting so renderPage can emit
      the rendered content (and head) instead of the client loading state. */
  jobPosting?: SitemapJobPosting
}

/**
 * Every public page × locale, from the SEO route registry — the single
 * input for prerendering, sitemap.xml, and llms.txt generation.
 *
 * Dynamic careers job detail pages (`/careers/jobs/:postingId`) are added
 * at build time by querying Supabase for active postings. When Supabase is
 * not configured (local build without `.env`), job detail URLs are omitted
 * from the manifest and sitemap — the static `/careers` index page still
 * lists them at runtime.
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

  /* Dynamic careers job detail pages — one EN/FR pair per active posting,
     addressed by the posting's slug (0186). Closed postings never reach the
     view, so filled roles drop out of the sitemap on the next build. */
  const careersRoute = seoRoute('careers')
  const jobPostings = await getActiveJobPostingsForSitemap()
  for (const posting of jobPostings) {
    const enPath = `${careersRoute.path.en}/jobs/${posting.slug}`
    const frPath = `${careersRoute.path.fr}/jobs/${posting.slug}`
    const title = {
      en: `${posting.title} | Dutiva Careers`,
      fr: `${posting.title} | Carrières Dutiva`,
    }
    const description = {
      en: posting.description.slice(0, 155),
      fr: posting.description.slice(0, 155),
    }
    const lastmod = posting.postedDate ?? undefined
    for (const lang of ['en', 'fr'] as const) {
      entries.push({
        key: `careersJob:${posting.id}`,
        lang,
        htmlLang: HTML_LANG[lang],
        path: lang === 'en' ? enPath : frPath,
        indexable: true,
        alternates: { en: enPath, fr: frPath },
        title: title[lang],
        description: description[lang],
        lastmod,
        jobPosting: posting,
      })
    }
  }

  return entries
}

export { langOfPath }
