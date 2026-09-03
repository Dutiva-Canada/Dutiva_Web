import { supportQueueSortRank } from '@/config/planEntitlements'
import { RESPONSE_TARGETS, SUPPORT_HOURS } from '@/config/support'
import type {
  ResponseTarget,
  SupportCategory,
  SupportImpact,
  SupportPriority,
  SupportUrgency,
} from '@/config/support'

/**
 * Pure support triage logic: suggested priority from what the customer
 * describes, and initial-response due dates against the published targets and
 * Ontario business calendar. No side effects and no `Date.now()` inside the
 * core helpers — callers pass the submission time — so every branch is
 * deterministically testable.
 *
 * Customers never force `critical`: intake is clamped to `high`, and a human
 * raises to `critical` in triage only for a confirmed/credible platform
 * outage, active security incident, widespread auth failure, severe
 * data-access issue, or time-sensitive privacy incident.
 *
 * Plan → queue ordering comes from `planEntitlements` `supportPriority` /
 * `SUPPORT_PRIORITY_RANK` via `supportQueueSortRank`. Growth/Pro keep a
 * product-ticket floor at `high` (1-business-day target); Starter is paid
 * queue rank without that floor (2 business days — matches entitled table).
 */

const PRIORITY_RANK: Record<SupportPriority, number> = {
  low: 0,
  standard: 1,
  high: 2,
  critical: 3,
}
const RANKED_PRIORITIES: readonly SupportPriority[] = ['low', 'standard', 'high', 'critical']

/** The highest priority customer-supplied input alone may produce. */
export const MAX_CUSTOMER_PRIORITY: SupportPriority = 'high'

function priorityFromRank(rank: number): SupportPriority {
  const clamped = Math.min(RANKED_PRIORITIES.length - 1, Math.max(0, rank))
  // `clamped` is always a valid index; the fallback only satisfies
  // noUncheckedIndexedAccess and is never reached.
  return RANKED_PRIORITIES[clamped] ?? 'standard'
}

export interface TriageInput {
  category: SupportCategory
  impact: SupportImpact
  urgency: SupportUrgency
}

/** Categories whose handling must not change because someone paid. */
const RESTRICTED_FROM_PAID_FLOOR: ReadonlySet<SupportCategory> = new Set([
  'privacy',
  'security',
  'accessibility',
  'complaint',
])

export type RequesterPlan = 'free' | 'starter' | 'growth' | 'pro' | null

/**
 * Queue rank for admin sort: lower = sooner.
 * Maps `planEntitlements.supportPriority` (Pro highest → Growth priority →
 * Starter paid → Free standard). Unknown / null sorts with Free.
 */
export function supportQueueRank(plan: RequesterPlan): number {
  return supportQueueSortRank(plan ?? 'free')
}

/**
 * Growth and Pro product tickets floor at `high` (1-business-day initial
 * reply — entitled `supportResponseTarget`). Starter stays at the suggested
 * priority (paid queue rank, 2-business-day target). Privacy / security /
 * accessibility / complaint keep their existing suggestPriority result —
 * paying does not change restricted handling.
 */
export function applyPaidSupportFloor(
  priority: SupportPriority,
  plan: RequesterPlan,
  category: SupportCategory,
): SupportPriority {
  if (plan !== 'growth' && plan !== 'pro') return priority
  if (RESTRICTED_FROM_PAID_FLOOR.has(category)) return priority
  if (PRIORITY_RANK[priority] >= PRIORITY_RANK.high) return priority
  return 'high'
}

/**
 * Suggested initial priority from category + impact + urgency. Deliberately
 * capped at `high`; `critical` is a human triage decision, not selectable from
 * the form.
 */
export function suggestPriority({ category, impact, urgency }: TriageInput): SupportPriority {
  const impactRank: number =
    impact === 'blocking' ? 2 : impact === 'major' || impact === 'minor' ? 1 : 0

  /* Categories that route to a restricted/priority path get a floor so they
     surface sooner in the queue, but still never auto-critical. */
  const categoryFloor: number =
    category === 'security'
      ? 2
      : category === 'account_access' ||
          category === 'accessibility' ||
          category === 'privacy' ||
          category === 'billing' ||
          category === 'complaint'
        ? 1
        : 0

  let rank = Math.max(impactRank, categoryFloor)

  /* Urgency nudges, but only for something that actually has impact — an
     "urgent" feature request is still a feature request. */
  if (urgency === 'urgent' && impact !== 'none') rank += 1

  return priorityFromRank(Math.min(rank, PRIORITY_RANK[MAX_CUSTOMER_PRIORITY]))
}

export function responseTargetFor(priority: SupportPriority): ResponseTarget {
  return RESPONSE_TARGETS[priority]
}

// ── Ontario business calendar ────────────────────────────────────────────
//
// Foundation-level simplifications, refined in the notification/scheduling
// phase (see docs/SUPPORT_ARCHITECTURE.md):
//   1. Dates are interpreted as UTC calendar dates. Callers pass a Date
//      normalized to the intended America/Toronto calendar day; a raw
//      timestamp near midnight UTC could otherwise resolve to the wrong local
//      day. Tests use UTC-midnight dates, which are unambiguous.
//   2. Only the nominal statutory dates are modelled. Observed/substitute days
//      (when a fixed-date holiday falls on a weekend) are not yet added, so a
//      response-due date in such a week may land one day early.
//   3. `initialResponseDueDate` is date-granular; end-of-business-hours clock
//      time (e.g. a critical ticket submitted after 17:00 ET) is layered on
//      with the DST-aware scheduling work, not here.

function iso(year: number, month1: number, day: number): string {
  return `${year}-${String(month1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Nth (1-based) `weekday` (0=Sun…6=Sat) of `month1` (1-based) in `year`. */
function nthWeekday(year: number, month1: number, weekday: number, n: number): string {
  const first = new Date(Date.UTC(year, month1 - 1, 1)).getUTCDay()
  const offset = (weekday - first + 7) % 7
  return iso(year, month1, 1 + offset + (n - 1) * 7)
}

/** Monday on or before `day` in `month1`. */
function mondayOnOrBefore(year: number, month1: number, day: number): string {
  const dow = new Date(Date.UTC(year, month1 - 1, day)).getUTCDay()
  const back = (dow - 1 + 7) % 7
  return iso(year, month1, day - back)
}

/** Good Friday = Easter Sunday − 2, via the Anonymous Gregorian computus. */
function goodFriday(year: number): string {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  const easter = new Date(Date.UTC(year, month - 1, day))
  easter.setUTCDate(easter.getUTCDate() - 2)
  return iso(easter.getUTCFullYear(), easter.getUTCMonth() + 1, easter.getUTCDate())
}

const holidayCache = new Map<number, ReadonlySet<string>>()

/** The nine Ontario statutory (public) holidays for a year, as yyyy-mm-dd. */
export function ontarioStatutoryHolidays(year: number): ReadonlySet<string> {
  const cached = holidayCache.get(year)
  if (cached) return cached
  const set = new Set<string>([
    iso(year, 1, 1), // New Year's Day
    nthWeekday(year, 2, 1, 3), // Family Day — 3rd Monday of February
    goodFriday(year), // Good Friday
    mondayOnOrBefore(year, 5, 24), // Victoria Day — Monday on/before May 24
    iso(year, 7, 1), // Canada Day
    nthWeekday(year, 9, 1, 1), // Labour Day — 1st Monday of September
    nthWeekday(year, 10, 1, 2), // Thanksgiving — 2nd Monday of October
    iso(year, 12, 25), // Christmas Day
    iso(year, 12, 26), // Boxing Day
  ])
  holidayCache.set(year, set)
  return set
}

function toISODate(date: Date): string {
  return iso(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}

/** A Dutiva business day: a configured weekday that isn't an Ontario holiday. */
export function isBusinessDay(date: Date): boolean {
  const dow = date.getUTCDay()
  if (!(SUPPORT_HOURS.businessDays as readonly number[]).includes(dow)) return false
  return !ontarioStatutoryHolidays(date.getUTCFullYear()).has(toISODate(date))
}

function startOfNextDay(date: Date): Date {
  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1))
  return next
}

/** Advance to the next business day at 00:00 UTC (date granularity). */
export function nextBusinessDay(from: Date): Date {
  let cursor = startOfNextDay(from)
  while (!isBusinessDay(cursor)) cursor = startOfNextDay(cursor)
  return cursor
}

/** Advance `count` business days from `from`, skipping weekends and holidays. */
export function addBusinessDays(from: Date, count: number): Date {
  let cursor = from
  for (let i = 0; i < count; i += 1) cursor = nextBusinessDay(cursor)
  return cursor
}

/**
 * Initial-response due date for a priority, at business-day granularity.
 * Business-hours targets (critical) resolve to the same business day when
 * submitted on one, otherwise the next business day — the precise 4-hour,
 * DST-aware clock time is layered on in the notification/scheduling phase.
 */
export function initialResponseDueDate(from: Date, priority: SupportPriority): Date {
  const target = responseTargetFor(priority)
  if (target.unit === 'business_hours') {
    // Return a fresh Date (never the caller's `from` by reference).
    return isBusinessDay(from) ? new Date(from.getTime()) : nextBusinessDay(from)
  }
  return addBusinessDays(from, target.amount)
}
