/**
 * Canonical date validation for Advisor Memory fixtures and persistence.
 * Advisor Memory stores date-only values in strict `YYYY-MM-DD` form.
 */

const CANONICAL_DAY = /^(\d{4})-(\d{2})-(\d{2})$/

/** Inclusive lower bound — four-digit years avoid JavaScript `Date` 0–99 year coercion. */
export const MEMORY_DATE_YEAR_MIN = 1900

/** Inclusive upper bound for Advisor Memory HR employment dates. */
export const MEMORY_DATE_YEAR_MAX = 9999

/** True when `value` is a valid canonical `YYYY-MM-DD` calendar date within the supported year range. */
export function isCanonicalMemoryDate(value: string): boolean {
  const match = CANONICAL_DAY.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (year < MEMORY_DATE_YEAR_MIN || year > MEMORY_DATE_YEAR_MAX) return false

  const parsed = new Date(Date.UTC(year, month - 1, day))
  if (Number.isNaN(parsed.getTime())) return false

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() + 1 === month &&
    parsed.getUTCDate() === day
  )
}
