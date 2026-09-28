import type { Lang } from '@/i18n/core'
import { pick } from '@/i18n/core'
import { HELP_ARTICLES, helpCategory } from './helpCenterData'
import { articlePlainText } from './helpContent'
import type { HelpArticle } from './helpCenterData'

/**
 * Client-side Help Centre search. The article set is small and bundled, so a
 * plain in-memory scan is simpler and faster than any index. Matching is
 * accent- and case-insensitive (so "resilie" finds "résilié" and vice versa)
 * and requires every query term to appear somewhere in the article — title,
 * summary, keywords, category label, or body — in the active language.
 *
 * Results are ranked by the strongest field a term matched (title beats
 * summary beats body), so the most on-topic article surfaces first.
 */

/** Lowercase and strip diacritics (U+0300–U+036F) for locale-tolerant matching. */
export function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

interface Indexed {
  article: HelpArticle
  title: string
  summary: string
  /** Keywords + category label + body text, all normalized. */
  rest: string
}

function indexArticle(article: HelpArticle, lang: Lang): Indexed {
  /* Bodies come from helpContent, not from the article record — see that
     module for why they are not a field on HelpArticle. */
  const bodyText = articlePlainText(article, lang)
  const rest = [
    article.keywords ? pick(article.keywords, lang) : '',
    pick(helpCategory(article.category).title, lang),
    bodyText,
  ].join(' ')
  return {
    article,
    title: normalizeText(pick(article.title, lang)),
    summary: normalizeText(pick(article.summary, lang)),
    rest: normalizeText(rest),
  }
}

/** Per-term field weight; a term missing everywhere disqualifies the article. */
function scoreTerm(entry: Indexed, term: string): number {
  if (entry.title.includes(term)) return 3
  if (entry.summary.includes(term)) return 2
  if (entry.rest.includes(term)) return 1
  return 0
}

interface HelpSearchResult {
  article: HelpArticle
  score: number
}

interface SearchOptions {
  /**
   * `'all'` (default) requires every term to match — right for the Help Centre
   * search box, where people type keywords. `'any'` includes an article if at
   * least one term matches and ignores terms shorter than 3 chars — better for
   * the first-line assist, where people type whole-sentence questions.
   */
  mode?: 'all' | 'any'
}

/**
 * Articles matching `query`, best first. Empty / too-short query → `[]` (the
 * caller shows the browse view or nothing).
 */
export function searchHelpArticles(
  query: string,
  lang: Lang,
  opts: SearchOptions = {},
): HelpSearchResult[] {
  const mode = opts.mode ?? 'all'
  const minLen = mode === 'any' ? 3 : 1
  const terms = normalizeText(query)
    .split(/\s+/)
    .filter((t) => t.length >= minLen)
  if (terms.length === 0) return []

  const results: HelpSearchResult[] = []
  for (const article of HELP_ARTICLES) {
    const entry = indexArticle(article, lang)
    let total = 0
    let matched = 0
    for (const term of terms) {
      const termScore = scoreTerm(entry, term)
      if (termScore > 0) matched += 1
      total += termScore
    }
    const include = mode === 'all' ? matched === terms.length : matched > 0
    if (include) results.push({ article, score: total })
  }

  // Highest score first; ties keep the authored (category) order for stability.
  return results.sort((a, b) => b.score - a.score)
}
