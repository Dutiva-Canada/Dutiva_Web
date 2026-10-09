import type { Lang } from '@/i18n/core'
import type { FormatSpec } from './widgetSpec'

/**
 * Shared number formatting for calculators, charts and table cells.
 * `currency` is CAD; `percent` expects the value in percent units
 * (15 → "15 %"); a `{ prefix, suffix, decimals }` object mirrors the
 * ChatChart fence format. NaN/Infinity render as an em dash — a formula
 * that can't produce a number shows a gap, not garbage.
 */
export function formatValue(value: number, format: FormatSpec | undefined, lang: Lang): string {
  if (!Number.isFinite(value)) return '—'
  const locale = lang === 'fr' ? 'fr-CA' : 'en-CA'

  if (format === 'currency') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 2,
    }).format(value)
  }
  if (format === 'percent') {
    return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 2 }).format(
      value / 100,
    )
  }
  if (typeof format === 'object' && format !== null) {
    const { prefix = '', suffix = '', decimals } = format
    const body =
      decimals === undefined
        ? new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)
        : new Intl.NumberFormat(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }).format(value)
    return `${prefix}${body}${suffix}`
  }
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)
}
