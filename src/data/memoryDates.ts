/**
 * Canonical date validation for Advisor Memory fixtures and persistence.
 * Accepts YYYY-MM-DD (and optional time suffix); rejects relative labels
 * and malformed values.
 */

const RELATIVE_DATE_LABEL = /\b(Today|Yesterday|Aujourd|Hier)\b/i

/** True when `value` is a valid YYYY-MM-DD calendar date (optional time suffix allowed). */
export function isCanonicalMemoryDate(value: string): boolean {
  if (value.length === 0 || RELATIVE_DATE_LABEL.test(value)) return false

  const dayPart = value.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayPart)) return false

  const year = Number(dayPart.slice(0, 4))
  const month = Number(dayPart.slice(5, 7))
  const day = Number(dayPart.slice(8, 10))
  if (month < 1 || month > 12 || day < 1 || day > 31) return false

  const parsed = new Date(`${dayPart}T12:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return false

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() + 1 === month &&
    parsed.getUTCDate() === day
  )
}
