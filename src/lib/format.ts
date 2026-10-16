import type { Bi } from '@/i18n/core'

/** Fill `{placeholder}` slots in a catalogue string. */
export function fill(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (out, [key, value]) => out.replaceAll(`{${key}}`, String(value)),
    template,
  )
}

/** Fill `{placeholder}` slots in both halves of a `Bi` — toast messages are
    stored as pairs (so a live language toggle re-localizes them), which
    means interpolation must happen before the locale resolves, not after. */
export function fillBi(msg: Bi, values: Record<string, string | number>): Bi {
  return { en: fill(msg.en, values), fr: fill(msg.fr, values) }
}

/** Currency amount, whole units. */
export function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * A calendar date as YYYY-MM-DD in the user's LOCAL timezone. Date-only
 * records (due dates, issue dates, "today") mean the user's local day —
 * `toISOString().slice(0, 10)` yields the UTC day, which runs ahead of every
 * Canadian timezone for the whole evening and marks tomorrow's items overdue.
 */
export function localDateISO(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Today as YYYY-MM-DD in the user's local timezone. */
export function localTodayISO(): string {
  return localDateISO()
}

/** The local calendar day `days` from today (DST-safe — setDate, not ms math). */
export function localDatePlusDaysISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return localDateISO(d)
}

/**
 * The local calendar day of a stored ISO value, as YYYY-MM-DD. Full
 * timestamps (timestamptz) resolve to the user's local day; date-only
 * strings pass through as the literal stored date — parsing 'YYYY-MM-DD'
 * would shift it back a day west of UTC. Use this whenever a stored
 * timestamp's *day* is shown or compared; never `iso.slice(0, 10)`, which
 * reads the UTC day.
 */
export function localDayOfISO(iso: string): string {
  if (!iso.includes('T')) return iso.slice(0, 10)
  const parsed = new Date(iso)
  return Number.isNaN(parsed.getTime()) ? iso.slice(0, 10) : localDateISO(parsed)
}

/** Compact age of an ISO timestamp — the caller maps the unit onto its
    message keys. null when the input isn't a parseable past timestamp. */
export function relativeTime(
  iso: string,
  now: Date = new Date(),
): { unit: 'now' | 'min' | 'hr' | 'day'; n: number } | null {
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t) || t > now.getTime()) return null
  const mins = Math.floor((now.getTime() - t) / 60000)
  if (mins < 1) return { unit: 'now', n: 0 }
  if (mins < 60) return { unit: 'min', n: mins }
  const hrs = Math.floor(mins / 60)
  if (hrs < 48) return { unit: 'hr', n: hrs }
  return { unit: 'day', n: Math.floor(hrs / 24) }
}
