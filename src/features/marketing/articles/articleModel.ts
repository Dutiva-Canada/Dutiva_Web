import { bi } from '@/i18n/core'
import type { Bi, Lang } from '@/i18n/core'

/**
 * Content model for Dutiva's public editorial pages — the `/guides` and
 * `/blog` article collections.
 *
 * This module is pure data (no React), so the SEO registry (`src/seo/routes.ts`)
 * can consume it directly the way it consumes `legalHubData` and
 * `helpCenterData`. Adding an article here gives it a prerendered, indexable
 * URL in both locales automatically — the registry, sitemap, and prerender
 * manifest all derive from `ALL_ARTICLES`.
 *
 * **Which collection does an article belong to?** The two split on what the
 * reader is doing, not on how fresh the writing is:
 *
 *   - `/guides` — the documents and decisions an employer *produces*. The
 *     contract clause, the probation period, the accommodation process, the
 *     termination notice and the file behind it. The reader already knows they
 *     have something to write; the guide is about getting it right. These are
 *     the articles the landing page teases and the ones that feed `/templates`.
 *   - `/blog` — the regimes and obligations that *apply* to an employer before
 *     anything is drafted. Which employment regime governs the workplace, which
 *     written policies are actually required, which records must be kept and
 *     for how long, which leaves exist. The reader is orienting, not drafting.
 *
 * Ask "is this about a document they are writing, or about a rule they are
 * under?" and the answer places the article. Blog articles display a
 * month-year date derived from `updated` (cards and article pages) so
 * crawlers and readers can see freshness; bump `updated` only on
 * substantive edits — the same rule that feeds sitemap `lastmod`. Guides
 * stay undated in the UI: a stale timestamp on a compliance how-to is worse
 * than none. There is still no publishing cadence to promise.
 *
 * Keeping the collections disjoint is *also* an SEO constraint, and the
 * stricter of the two: both indexes once listed the same six titles, and a
 * title under both prefixes ships duplicate pages competing with each other in
 * search. `src/seo/seo.test.ts` fails the build if the collections converge.
 *
 * Editorial rules (docs/SEO_GEO_IMPLEMENTATION.md, docs/CANONICAL_FACTS.md):
 *
 *   - Articles explain concepts, decision points, and what to document. They
 *     deliberately do **not** publish statutory figures — notice-week tables,
 *     dollar thresholds, or deadline counts — because those go stale, vary by
 *     jurisdiction and fact pattern, and become compliance representations the
 *     moment they are wrong. Name the statute, describe the shape of the rule,
 *     and send the reader to the official text and to a professional.
 *   - Nothing here is legal advice, and every article says so through the
 *     shared disclaimer the page renders.
 *   - Product claims must match `docs/CANONICAL_FACTS.md`: 16 templates, three
 *     jurisdictions (ON / QC / FED), beta with paid plans not yet sold.
 *
 * Slugs are public URLs and must stay stable. They must also be unique across
 * both locale slug spaces within a collection — `src/seo/seo.test.ts` enforces
 * this, the same way it does for policy documents.
 */

export type ArticleCollection = 'guide' | 'blog'

export type ArticleBlock = { type: 'p'; text: Bi } | { type: 'li'; text: Bi }

export interface ArticleSection {
  /** Optional H2 within the article. */
  heading?: Bi
  blocks: ArticleBlock[]
}

export interface Article {
  /** English slug — also the article's stable id. */
  slug: string
  /** Localized French slug; unique across both slug spaces in its collection. */
  frSlug: string
  collection: ArticleCollection
  /** Short topic label shown above the title and on index cards. */
  topic: Bi
  /** Approximate reading time in minutes, shown on index cards. */
  readingMinutes: number
  /**
   * ISO date (YYYY-MM-DD) the article's substance last changed. Feeds
   * `sitemap.xml` `lastmod` through the SEO registry, the same way policy
   * documents feed theirs from their displayed dates. Bump it only when the
   * content materially changes — a `lastmod` that moves on every build teaches
   * crawlers to ignore it.
   */
  updated: string
  title: Bi
  /** One-line blurb for cards and the SEO meta description. */
  summary: Bi
}

/**
 * An article's prose is deliberately **not** a field on `Article`. The SEO
 * registry (`src/seo/routes.ts`) reads every article to build
 * `allPublicPages()`, and the router imports that registry — so anything
 * hanging off this interface is in the eager entry graph of every public page.
 * With the sections inline that was ~200kB of prose downloaded to render a
 * landing page.
 *
 * Bodies live in `blogContent.ts` / `guideContent.ts`, keyed by English slug,
 * and are reached through `articleSections()` in `./content` — a module only
 * `ArticlePage` imports. `ArticlePage` is a lazy route, so the prose rides its
 * chunk and still resolves synchronously during prerender.
 *
 * The cost of the split is that an article is now authored in two places.
 * `articles.test.ts` asserts the two key sets match exactly in both
 * directions: metadata with no sections renders a title over nothing, and
 * sections with no metadata is a page with no URL.
 */
export type ArticleSectionsBySlug = Record<string, readonly ArticleSection[]>

export const p = (en: string, fr: string): ArticleBlock => ({ type: 'p', text: bi(en, fr) })
export const li = (en: string, fr: string): ArticleBlock => ({ type: 'li', text: bi(en, fr) })

/* ------------------------------------------------------------------ */
/* Rendering helpers                                                   */
/* ------------------------------------------------------------------ */

export type ArticleBlockGroup = { kind: 'p'; text: Bi } | { kind: 'list'; items: Bi[] }

/**
 * Collapses a flat block list into renderable groups so consecutive `li`
 * blocks become one semantic `<ul>` rather than a run of single-item lists.
 * Mirrors `groupHelpBlocks` in the Help Centre.
 */
export function groupArticleBlocks(blocks: ArticleBlock[]): ArticleBlockGroup[] {
  const groups: ArticleBlockGroup[] = []
  for (const block of blocks) {
    const last = groups.at(-1)
    if (block.type === 'li') {
      if (last?.kind === 'list') last.items.push(block.text)
      else groups.push({ kind: 'list', items: [block.text] })
    } else {
      groups.push({ kind: 'p', text: block.text })
    }
  }
  return groups
}

/* ------------------------------------------------------------------ */
/* Locale-aware paths                                                  */
/* ------------------------------------------------------------------ */

/** Index pathname for a collection, per locale. Kept in one place so the
    article paths below and the SEO registry cannot disagree. */
export const COLLECTION_INDEX: Record<ArticleCollection, Record<Lang, string>> = {
  guide: { en: '/guides', fr: '/fr/guides' },
  blog: { en: '/blog', fr: '/fr/blogue' },
}

/** Canonical pathname of an article in a locale. */
export function articlePath(article: Article, lang: Lang): string {
  const base = COLLECTION_INDEX[article.collection][lang]
  return `${base}/${lang === 'fr' ? article.frSlug : article.slug}`
}
