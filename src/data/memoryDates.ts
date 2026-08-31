/**
 * Canonical date validation for Advisor Memory fixtures and persistence.
 * Accepts YYYY-MM-DD (and optional time suffix); rejects relative labels,
 * unpadded components, and impossible calendar dates.
 */

const RELATIVE_DATE_LABEL = /\b(Today|Yesterday|Aujourd|Hier)\b/i
const CANONICAL_DAY = /^(\d{4})-(\d{2})-(\d{2})$/

/** True when `value` is a valid YYYY-MM-DD calendar date (optional time suffix allowed). */
export function isCanonicalMemoryDate(value: string): boolean {
  if (value.length === 0 || RELATIVE_DATE_LABEL.test(value)) return false

  const dayPart = value.slice(0, 10)
  const match = CANONICAL_DAY.exec(dayPart)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return false

  const parsed = new Date(`${dayPart}T12:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return false

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() + 1 === month &&
    parsed.getUTCDate() === day
  )
}
