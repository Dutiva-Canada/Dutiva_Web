import { parseISODate } from './aggregation'

/** Fill `{placeholder}` slots in a catalogue string. */
export function fill(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (out, [key, value]) => out.replaceAll(`{${key}}`, String(value)),
    template,
  )
}

/** Locale for Intl formatting from the app language. */
export function intlLocale(lang: string): string {
  return lang === 'fr' ? 'fr-CA' : 'en-CA'
}

/** Currency amount, whole units. */
export function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

/** Short day-of-month date off a YYYY-MM-DD string ('Jul 25' / '25 juill.'). */
export function formatDayISO(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(parseISODate(iso))
}

/** Signed delta for display: +8 / −3 (typographic minus). */
export function formatSignedDelta(delta: number): string {
  return delta >= 0 ? `+${delta}` : `−${Math.abs(delta)}`
}

/** Localized percentage with one decimal: 9.8% / 9,8 %. */
export function formatPct(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

/** Signed one-decimal number, localized: +0.4 / −1.4 (−1,4 in fr). */
export function formatSignedDecimal(value: number, locale: string): string {
  const body = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.abs(value))
  return value >= 0 ? `+${body}` : `−${body}`
}
