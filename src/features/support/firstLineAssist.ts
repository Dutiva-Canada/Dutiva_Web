import type { Lang } from '@/i18n/core'
import type { SupportCategory } from '@/config/support'
import { searchHelpArticles } from './help/helpSearch'
import type { HelpArticle } from './help/helpCenterData'

/**
 * First-line self-service assist for the intake forms: before a request is
 * sent, surface the Help Centre articles most likely to answer it, so simple
 * questions are deflected instead of becoming tickets.
 *
 * The safety-critical half is the escalation policy. Some matters are ALWAYS
 * handled by a person and are never auto-answered — privacy, security,
 * accessibility, complaints, billing disputes, and account recovery. For those
 * categories this returns no suggestions and signals `escalate`, so the UI can
 * set that expectation plainly. This is retrieval-only (no generative model),
 * which is deliberate: the public intake is unauthenticated, and a generated
 * "answer" to a compliance question carries cost, abuse, and accuracy risk. A
 * future generative first-line would plug in HERE, behind auth + rate limits,
 * and must keep this same escalation gate.
 */

/** Categories that must reach a human — never an automated first-line answer. */
const HUMAN_ONLY_CATEGORIES: ReadonlySet<SupportCategory> = new Set<SupportCategory>([
  'privacy',
  'security',
  'accessibility',
  'complaint',
  'billing',
  'account_access',
])

export function requiresHumanFirstLine(category: SupportCategory | ''): boolean {
  return category !== '' && HUMAN_ONLY_CATEGORIES.has(category)
}

interface FirstLineResult {
  /** True when the matter must go to a person; no suggestions are offered. */
  escalate: boolean
  /** Up to `limit` suggested Help Centre articles (empty when escalating). */
  articles: HelpArticle[]
}

const DEFAULT_LIMIT = 3
const MIN_QUERY_LENGTH = 3

export function suggestFirstLine(
  query: string,
  category: SupportCategory | '',
  lang: Lang,
  limit = DEFAULT_LIMIT,
): FirstLineResult {
  if (requiresHumanFirstLine(category)) return { escalate: true, articles: [] }
  if (query.trim().length < MIN_QUERY_LENGTH) return { escalate: false, articles: [] }
  // `any` mode: people type whole-sentence questions here, so match on any
  // meaningful term rather than requiring every word to appear.
  const articles = searchHelpArticles(query, lang, { mode: 'any' })
    .slice(0, limit)
    .map((r) => r.article)
  return { escalate: false, articles }
}
