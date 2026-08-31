/**
 * Statutory notice schedule for prompt grounding — the server's copy.
 *
 * MIRROR of the Ontario bands in
 * src/features/app/advisor/safety/statutoryNotice.ts (ESA, 2000 s.57). The
 * app cannot import across the src/ ↔ supabase/functions/ boundary, so —
 * same discipline as the crisis phrases and the score formula — the two
 * copies are pinned to each other by a drift test
 * (noticeSchedule.test.ts). Change them together.
 *
 * Why this exists (2026-08-08 RAG review): the notice table was authored as
 * §5.2's grounding half but was never consulted anywhere in the chat path —
 * the model answered notice questions from parametric memory even when the
 * table knew the answer. When the turn is recognizably an Ontario notice
 * question, the schedule is now injected into the system prompt as
 * authoritative, so the figure is looked up, not generated. Québec and
 * Federal stay uninjected until their bands pass legal review
 * (docs/notice-bands-review-pack.md).
 *
 * Pure and dependency-free so it runs in Deno and under vitest.
 */

export interface NoticeBand {
  minMonths: number
  weeks: number
}

/** Ontario ESA, 2000 s.57 — statutory notice of individual termination. */
export const ONTARIO_NOTICE_BANDS: readonly NoticeBand[] = [
  { minMonths: 0, weeks: 0 },
  { minMonths: 3, weeks: 1 },
  { minMonths: 12, weeks: 2 },
  { minMonths: 36, weeks: 3 },
  { minMonths: 48, weeks: 4 },
  { minMonths: 60, weeks: 5 },
  { minMonths: 72, weeks: 6 },
  { minMonths: 84, weeks: 7 },
  { minMonths: 96, weeks: 8 },
]

/** Mirror of statutoryNotice.ts#lookupStatutoryNoticeWeeks for Ontario. */
export function ontarioNoticeWeeks(completedMonths: number): number | null {
  if (!Number.isFinite(completedMonths) || completedMonths < 0) return null
  let weeks: number | null = null
  for (const band of ONTARIO_NOTICE_BANDS) {
    if (completedMonths >= band.minMonths) weeks = band.weeks
    else break
  }
  return weeks
}

const NOTICE_TERMS: readonly string[] = [
  'notice',
  'termination',
  'terminate',
  'dismiss',
  'fired',
  'firing',
  'let go',
  'pay in lieu',
  'preavis',
  'cessation',
  'licenciement',
  'congedie',
]

/** True when the message is plausibly about termination notice. */
export function isNoticeQuestion(message: string): boolean {
  const normalized = message.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  return NOTICE_TERMS.some((t) => normalized.includes(t))
}

/**
 * The prompt block carrying the Ontario schedule, or '' when the turn is
 * not an Ontario notice question. Appended after the retrieved-guidance
 * block; framed exactly like it — authoritative for this turn.
 */
export function noticeScheduleBlock(message: string, jurisdictions: readonly string[]): string {
  if (!jurisdictions.includes('ON') || !isNoticeQuestion(message)) return ''
  /* Band label: this band's floor to just under the next band's floor
     ("1 to under 3 years"), open-ended on the last ("8 years or more"). */
  const monthsLabel = (months: number) =>
    months < 12 ? `${months} months` : `${months / 12} year${months === 12 ? '' : 's'}`
  const ladder = ONTARIO_NOTICE_BANDS.map((b, i) => {
    if (b.minMonths === 0) return '- under 3 months of employment: 0 weeks (no statutory notice)'
    const next = ONTARIO_NOTICE_BANDS[i + 1]
    const label = next
      ? `${monthsLabel(b.minMonths)} to under ${monthsLabel(next.minMonths)}`
      : `${monthsLabel(b.minMonths)} or more`
    return `- ${label}: ${b.weeks} week${b.weeks === 1 ? '' : 's'}`
  }).join('\n')
  return (
    '\n\nStatutory schedule (authoritative for this turn) — Ontario ESA, 2000 s.57, minimum ' +
    'notice of INDIVIDUAL termination by completed employment. Use exactly these values; this ' +
    'is the statutory floor only, never common-law reasonable notice, and mass-termination ' +
    'rules differ:\n' +
    ladder
  )
}
