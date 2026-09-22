import { describe, expect, it } from 'vitest'
import { formatCareersDate } from './dates'

describe('formatCareersDate', () => {
  it('formats an English date for the en page locale', () => {
    expect(formatCareersDate('2026-03-01', 'en')).toBe('Mar 1, 2026')
  })

  it('formats a French date for the fr page locale', () => {
    expect(formatCareersDate('2026-03-01', 'fr')).toBe('1 mars 2026')
  })

  it('does not shift a date-only value back a day in western timezones', () => {
    // 'YYYY-MM-DD' must not parse as UTC midnight — Toronto (UTC-5) would
    // otherwise render Feb 28 for a March 1 closing date.
    expect(formatCareersDate('2026-03-01', 'en')).toContain('Mar 1')
    expect(formatCareersDate('2026-03-01', 'en')).not.toContain('Feb')
  })

  it('formats full ISO timestamps', () => {
    const result = formatCareersDate('2026-01-20T15:30:00Z', 'en')
    expect(result).toMatch(/Jan 20, 2026/)
  })

  it('returns the raw string when the value cannot be parsed', () => {
    expect(formatCareersDate('not-a-date', 'en')).toBe('not-a-date')
  })
})
