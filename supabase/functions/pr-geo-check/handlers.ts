/**
 * pr-geo-check/handlers.ts — pure helpers so vitest can cover the answer
 * classifier directly (edge index.ts imports these).
 */

export type GeoCheckResult = 'cited' | 'mentioned' | 'absent'

/**
 * Classify one model answer against the brand's footprint.
 *
 *   cited     — the answer carries a Dutiva link/domain (dutiva.ca)
 *   mentioned — the brand name appears as a word, without a link
 *   absent    — neither
 *
 * Directional by design: this measures what one configured model says about
 * the brand in its own answer, not what any specific assistant shows a user.
 */
export function classifyGeoAnswer(
  answer: string,
  opts: { domains: string[]; brands: string[] },
): GeoCheckResult {
  const lower = answer.toLowerCase()
  for (const domain of opts.domains) {
    if (domain !== '' && lower.includes(domain.toLowerCase())) return 'cited'
  }
  for (const brand of opts.brands) {
    if (brand === '') continue
    const re = new RegExp(`\\b${escapeRe(brand)}\\b`, 'i')
    if (re.test(answer)) return 'mentioned'
  }
  return 'absent'
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** First ~220 chars of the answer, whitespace-collapsed — stored as the
    check note so the row keeps a record of what the model actually said. */
export function answerExcerpt(answer: string, max = 220): string {
  const flat = answer.replace(/\s+/g, ' ').trim()
  if (flat.length <= max) return flat
  return `${flat.slice(0, max - 1).trimEnd()}…`
}
