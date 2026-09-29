/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import type { Lang } from '@/i18n/core'
import type { PublicJobPosting } from './data/jobBoardApi'

/**
 * Pure job-board filtering — extracted from the page so the search, facet,
 * and sort semantics are unit-testable without rendering. URL params are the
 * source of truth: the board serializes this state into `?q=&loc=&type=&org=&dept=&sort=`
 * and back so every view is shareable.
 */

export type Workplace = 'remote' | 'hybrid' | 'onsite'
export type BoardSort = 'newest' | 'relevance'

export interface BoardFilter {
  q: string
  location: string
  workplace: Workplace | ''
  employer: string
  department: string
  sort: BoardSort
}

export const EMPTY_FILTER: BoardFilter = {
  q: '',
  location: '',
  workplace: '',
  employer: '',
  department: '',
  sort: 'newest',
}

/**
 * Derived work arrangement. `type`/`location` are employer free text, so the
 * facet classifies by keyword rather than trusting a fixed vocabulary:
 * "Remote (Canada)", "Hybride — Montréal", "On-site, Toronto" all land right.
 */
export function workplaceType(posting: Pick<PublicJobPosting, 'location' | 'type'>): Workplace {
  const haystack = `${posting.location} ${posting.type}`.toLowerCase()
  if (/remote|télétravail|telework|à distance|a distance/.test(haystack)) return 'remote'
  if (/hybrid|hybride/.test(haystack)) return 'hybrid'
  return 'onsite'
}

/** schema.org employmentType code, when the free-text type classifies
    (employers type "Full-time", "Temps partiel", "Contract", …). */
export function employmentTypeCode(type: string): string | undefined {
  const t = type.toLowerCase()
  if (/full.?time|temps plein/.test(t)) return 'FULL_TIME'
  if (/part.?time|temps partiel/.test(t)) return 'PART_TIME'
  if (/contract|contractuel|contrat\b/.test(t)) return 'CONTRACT'
  if (/intern|stage\b/.test(t)) return 'INTERN'
  if (/temporary|temporaire/.test(t)) return 'TEMPORARY'
  return undefined
}

/** Accent-insensitive, case-insensitive substring match. */
function matches(text: string, q: string): boolean {
  const fold = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
  return fold(text).includes(fold(q))
}

export function filterPostings(
  postings: PublicJobPosting[],
  filter: BoardFilter,
): PublicJobPosting[] {
  const q = filter.q.trim()
  let out = postings.filter((p) => {
    if (filter.location && p.location !== filter.location) return false
    if (filter.employer && p.organizationName !== filter.employer) return false
    if (filter.department && p.department !== filter.department) return false
    if (filter.workplace && workplaceType(p) !== filter.workplace) return false
    if (!q) return true
    return [p.title, p.department, p.location, p.organizationName, p.type].some((t) =>
      matches(t, q),
    )
  })
  out = sortPostings(out, filter)
  return out
}

/**
 * Relevance: title hits outrank department/location hits, then more hits
 * break ties, then recency. Only meaningful when a query is active — the UI
 * hides the option otherwise (there is nothing to be relevant *to*).
 */
export function relevanceScore(p: PublicJobPosting, q: string): number {
  const needle = q.trim()
  if (!needle) return 0
  let score = 0
  if (matches(p.title, needle)) score += 4
  if (matches(p.department, needle)) score += 2
  if (matches(p.organizationName, needle)) score += 2
  if (matches(p.location, needle)) score += 1
  if (matches(p.type, needle)) score += 1
  return score
}

function timeOf(p: PublicJobPosting): number {
  const t = p.postedDate ? Date.parse(p.postedDate) : NaN
  return Number.isNaN(t) ? 0 : t
}

export function sortPostings(postings: PublicJobPosting[], filter: BoardFilter): PublicJobPosting[] {
  const out = [...postings]
  if (filter.sort === 'relevance' && filter.q.trim()) {
    const q = filter.q
    out.sort((a, b) => relevanceScore(b, q) - relevanceScore(a, q) || timeOf(b) - timeOf(a))
    return out
  }
  out.sort((a, b) => timeOf(b) - timeOf(a))
  return out
}

export interface BoardFacets {
  locations: string[]
  employers: string[]
  departments: string[]
  workplaces: Workplace[]
}

/** Distinct facet values present in the current result set, alpha-sorted
    (locale-aware so French accents sort sanely). */
export function boardFacets(postings: PublicJobPosting[], lang: Lang): BoardFacets {
  const collator = new Intl.Collator(lang === 'fr' ? 'fr-CA' : 'en-CA')
  const uniq = (xs: string[]) => [...new Set(xs)].sort(collator.compare)
  const workplaces = new Set<Workplace>()
  for (const p of postings) workplaces.add(workplaceType(p))
  const order: Workplace[] = ['remote', 'hybrid', 'onsite']
  return {
    locations: uniq(postings.map((p) => p.location).filter(Boolean)),
    employers: uniq(postings.map((p) => p.organizationName).filter(Boolean)),
    departments: uniq(postings.map((p) => p.department).filter(Boolean)),
    workplaces: order.filter((w) => workplaces.has(w)),
  }
}

/* ── URL params ────────────────────────────────────────────────────────── */

const PARAM_KEYS: Record<Exclude<keyof BoardFilter, 'sort'>, string> & { sort: string } = {
  q: 'q',
  location: 'loc',
  workplace: 'type',
  employer: 'org',
  department: 'dept',
  sort: 'sort',
}

export function filterFromParams(params: URLSearchParams): BoardFilter {
  const workplace = params.get(PARAM_KEYS.workplace)
  const sort = params.get(PARAM_KEYS.sort)
  return {
    q: params.get(PARAM_KEYS.q) ?? '',
    location: params.get(PARAM_KEYS.location) ?? '',
    workplace:
      workplace === 'remote' || workplace === 'hybrid' || workplace === 'onsite'
        ? workplace
        : '',
    employer: params.get(PARAM_KEYS.employer) ?? '',
    department: params.get(PARAM_KEYS.department) ?? '',
    sort: sort === 'relevance' ? 'relevance' : 'newest',
  }
}

export function filterToParams(filter: BoardFilter): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, param] of Object.entries(PARAM_KEYS) as [keyof BoardFilter, string][]) {
    const value = filter[key]
    /* Defaults stay out of the URL — 'newest' is the implicit sort. */
    if (value && !(key === 'sort' && value === 'newest')) params.set(param, value)
  }
  return params
}

export function isFilterActive(filter: BoardFilter): boolean {
  return Boolean(
    filter.q.trim() ||
      filter.location ||
      filter.workplace ||
      filter.employer ||
      filter.department,
  )
}

/** "CA$85,000–CA$95,000/yr" / "85 000 $–95 000 $/an" — range collapses
    when min == max; returns null when no salary is published (cards hide
    the row entirely rather than showing a placeholder). */
export function salaryLabel(posting: PublicJobPosting, lang: Lang): string | null {
  const { salaryMin, salaryMax, salaryPeriod } = posting
  if (salaryMin == null && salaryMax == null) return null
  const fmt = new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  })
  const period =
    salaryPeriod === 'hour' ? (lang === 'fr' ? 'h' : 'hr') : lang === 'fr' ? 'an' : 'yr'
  if (salaryMin != null && salaryMax != null && salaryMin !== salaryMax)
    return `${fmt.format(salaryMin)}–${fmt.format(salaryMax)}/${period}`
  return `${fmt.format(salaryMin ?? salaryMax ?? 0)}/${period}`
}
