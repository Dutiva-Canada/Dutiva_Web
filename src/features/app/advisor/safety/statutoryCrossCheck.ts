import { normalizeText } from './text'
import { lookupStatutoryNoticeWeeks } from './statutoryNotice'
import type { Jurisdiction } from '@/features/app/documents/data/types'

/**
 * §5.2 (verification half) — cross-check a stated statutory notice figure
 * against the encoded schedule (`statutoryNotice.ts`), closing the gap the
 * 2026-08-08 RAG review confirmed: the notice table existed but was never
 * consulted anywhere in the chat path, so the model could state a wrong
 * Ontario figure and every gate passed.
 *
 * Deterministic, and deliberately tuned for PRECISION over recall (the
 * follow-up adversarial review executed the first version and produced
 * false mismatches on correct replies — a warning that quotes
 * authoritative-looking wrong numbers trains operators to ignore it):
 *
 * - A weeks figure counts as a *notice claim* only when a notice noun sits
 *   adjacent to it ("8 weeks of notice", "notice of 8 weeks", "préavis de
 *   8 semaines") — never because the word "notice" appears somewhere in
 *   the reply. A pregnancy-leave "17 weeks" is not a notice claim.
 * - A duration counts as *tenure* only with tenure context beside it
 *   ("4 years of service", "a 4-year employee", "employed for 18
 *   months") — a contractual "2 months of notice" is not tenure.
 * - Tenure candidates from the user message AND the reply pool together;
 *   anything other than exactly one distinct value is ambiguity → no
 *   check. A wrong guess is worse than no check.
 * - It only fires when the jurisdiction's schedule is populated (Ontario
 *   today; QC/FED are null pending legal review). Anything less is
 *   'unverifiable', never a guess.
 * - A mismatch does not rewrite prose; `safetyBackstop.ts` withholds the
 *   legal-basis surface and warns with the schedule's number and the
 *   claim actually made (the claim closest to the expected value).
 * - A range claim ("between 4 and 8 weeks") is consistent when the
 *   expected value falls inside it — common-law discussions legitimately
 *   run above the statutory floor.
 */

type CrossCheckVerdict = 'consistent' | 'mismatch' | 'unverifiable'

/** Why a turn is unverifiable — the backstop only warns on 'no-schedule':
    a reply that asserts a notice figure for a known tenure in a jurisdiction
    whose schedule is pending legal review (QC/FED) is a confident claim no
    encoded rule vouches for; the reader must be told to verify. 'no-claim'
    and 'no-tenure' mean the turn never asserted a checkable figure. */
export type UnverifiableReason = 'no-claim' | 'no-tenure' | 'no-schedule'

interface NoticeCrossCheckResult {
  verdict: CrossCheckVerdict
  /** Populated on mismatch: what the schedule says vs what the reply said
   *  (the claim nearest the expected value; `statedWeeks` is always a
   *  number the reply actually offered). */
  expectedWeeks?: number
  statedWeeks?: number
  /** Populated on unverifiable: which precondition failed. */
  reason?: UnverifiableReason
}

/* Tenure context that must appear within a short window of the duration —
 * or the 'N-year employee' form where the noun IS the context. */
const TENURE_CONTEXT =
  /(?:service|employment|employed|tenure|seniority|with (?:us|the company)|anciennete|de service|d emploi|en poste|travaille)/

const CONTEXT_WINDOW = 40

/** "4 years", "4-year", "2.5 years", "4 ans", with optional "and 3 months". */
const YEAR_TENURE =
  /\b(\d{1,2}(?:[.,]\d+)?)[\s-]*(?:years?|ans?)(?:[\s-]*(?:old)?)?(?:\s*(?:and|et)\s*(\d{1,2})\s*(?:months?|mois))?\b/g

/** Standalone "18 months" / "7 mois". */
const MONTH_TENURE = /\b(\d{1,3})\s*(?:months?|mois)\b/g

/** The 'N-year employee' form — the following noun is itself the context. */
const EMPLOYEE_NOUN = /^[\s-]*(?:employees?|employes?|worker|salarie)/

function hasTenureContext(normalized: string, matchIndex: number, matchLength: number): boolean {
  const windowStart = Math.max(0, matchIndex - CONTEXT_WINDOW)
  const windowEnd = Math.min(normalized.length, matchIndex + matchLength + CONTEXT_WINDOW)
  if (TENURE_CONTEXT.test(normalized.slice(windowStart, windowEnd))) return true
  return EMPLOYEE_NOUN.test(normalized.slice(matchIndex + matchLength))
}

/** All tenure-context durations (months) in one text, with matched spans. */
function tenureCandidates(text: string): { values: Set<number>; spans: [number, number][] } {
  const normalized = normalizeText(text)
  const values = new Set<number>()
  const spans: [number, number][] = []

  for (const match of normalized.matchAll(YEAR_TENURE)) {
    const index = match.index ?? 0
    if (!hasTenureContext(normalized, index, match[0].length)) continue
    const years = Number.parseFloat(match[1]!.replace(',', '.'))
    const extraMonths = match[2] ? Number.parseInt(match[2], 10) : 0
    if (Number.isFinite(years)) {
      values.add(Math.floor(years * 12) + extraMonths)
      spans.push([index, index + match[0].length])
    }
  }

  /* Standalone month counts too — NOT gated on the year scan (the first
     version's gate silently discarded "…the other has 6 months", defeating
     the ambiguity rule); only spans already consumed by a combined
     year-and-month phrase are excluded. */
  for (const match of normalized.matchAll(MONTH_TENURE)) {
    const index = match.index ?? 0
    const end = index + match[0].length
    if (spans.some(([s, e]) => index >= s && end <= e)) continue
    if (!hasTenureContext(normalized, index, match[0].length)) continue
    const months = Number.parseInt(match[1]!, 10)
    if (Number.isFinite(months)) values.add(months)
  }

  return { values, spans }
}

/**
 * Completed tenure in months across the turn (user message AND reply pooled
 * — the first version let a non-tenure user duration override the reply's
 * explicit tenure), or null unless exactly one distinct tenure-context
 * value exists. Ambiguity → null; a wrong guess is worse than no check.
 */
export function extractTenureMonths(...texts: string[]): number | null {
  const pooled = new Set<number>()
  for (const text of texts) {
    for (const value of tenureCandidates(text).values) pooled.add(value)
  }
  if (pooled.size !== 1) return null
  return [...pooled][0]!
}

/* A notice claim needs the notice noun ADJACENT to the figure, in either
 * order. Ranges accept -, –, to, a, and/et ("between 4 and 8 weeks"). */
const RANGE = String.raw`(\d{1,2})(?:\s*(?:-|–|to|a|and|et|ou)\s*(\d{1,2}))?`
const NOTICE_NOUN = String.raw`(?:notice|termination pay|pay in lieu|preavis)`
/* normalizeText strips apostrophes, so "8 weeks' notice" arrives as
 * "8 weeks notice" — plain adjacency covers the possessive form. */
const WEEKS_THEN_NOUN = new RegExp(
  String.raw`\b${RANGE}\s*(?:weeks?|semaines?)\s*(?:of\s+|de\s+)?(?:written\s+|working\s+)?${NOTICE_NOUN}`,
  'g',
)
const NOUN_THEN_WEEKS = new RegExp(
  String.raw`${NOTICE_NOUN}\s*(?:period\s*)?(?:of|is|of at least|de|d au moins)?\s*(?:at least\s*)?(?:between\s*)?${RANGE}\s*(?:weeks?|semaines?)\b`,
  'g',
)

/** Every distinct weeks claim made with a notice noun adjacent to it. */
export function extractNoticeWeeksClaims(text: string): { min: number; max: number }[] {
  const normalized = normalizeText(text)
  const claims: { min: number; max: number }[] = []
  const seen = new Set<string>()
  for (const pattern of [WEEKS_THEN_NOUN, NOUN_THEN_WEEKS]) {
    for (const match of normalized.matchAll(pattern)) {
      const a = Number.parseInt(match[1]!, 10)
      const b = match[2] ? Number.parseInt(match[2], 10) : a
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue
      const claim = { min: Math.min(a, b), max: Math.max(a, b) }
      const key = `${claim.min}-${claim.max}`
      if (!seen.has(key)) {
        seen.add(key)
        claims.push(claim)
      }
    }
  }
  return claims
}

/** Cross-check the reply's notice claims against the statutory schedule. */
export function crossCheckNoticeFigure(input: {
  jurisdiction: Jurisdiction
  userMessage: string
  reply: string
}): NoticeCrossCheckResult {
  const claims = extractNoticeWeeksClaims(input.reply)
  if (claims.length === 0) return { verdict: 'unverifiable', reason: 'no-claim' }

  const tenureMonths = extractTenureMonths(input.userMessage, input.reply)
  if (tenureMonths === null) return { verdict: 'unverifiable', reason: 'no-tenure' }

  const expectedWeeks = lookupStatutoryNoticeWeeks(input.jurisdiction, tenureMonths)
  if (expectedWeeks === null) return { verdict: 'unverifiable', reason: 'no-schedule' }

  /* Consistent when ANY claim covers the expected value: replies often state
     both the statutory floor and a common-law range above it, and the floor
     being present is exactly what the table can vouch for. */
  const covered = claims.some((c) => expectedWeeks >= c.min && expectedWeeks <= c.max)
  if (covered) return { verdict: 'consistent', expectedWeeks }

  /* Report the claim NEAREST the expected value (the one most plausibly
     meant as the statutory figure), quoting its nearest bound — always a
     number the reply actually offered. */
  const nearest = claims.reduce((best, c) => {
    const distance = Math.min(Math.abs(c.min - expectedWeeks), Math.abs(c.max - expectedWeeks))
    const bestDistance = Math.min(
      Math.abs(best.min - expectedWeeks),
      Math.abs(best.max - expectedWeeks),
    )
    return distance < bestDistance ? c : best
  }, claims[0]!)
  const statedWeeks =
    Math.abs(nearest.min - expectedWeeks) <= Math.abs(nearest.max - expectedWeeks)
      ? nearest.min
      : nearest.max
  return { verdict: 'mismatch', expectedWeeks, statedWeeks }
}
