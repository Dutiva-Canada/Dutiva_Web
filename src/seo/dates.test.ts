import { describe, expect, it } from 'vitest'
import { formatArticleMonthYear, parseDisplayDate } from './dates'

describe('parseDisplayDate', () => {
  it('parses English and French display dates to ISO', () => {
    expect(parseDisplayDate('June 1, 2026')).toBe('2026-06-01')
    expect(parseDisplayDate('1er juin 2026')).toBe('2026-06-01')
  })
})

describe('formatArticleMonthYear', () => {
  it('formats ISO dates as month-year in both locales', () => {
    expect(formatArticleMonthYear('2026-08-01', 'en')).toBe('August 2026')
    expect(formatArticleMonthYear('2026-08-01', 'fr').toLowerCase()).toContain('août')
    expect(formatArticleMonthYear('2026-08-01', 'fr')).toContain('2026')
  })

  it('returns the input when the ISO string is unparseable', () => {
    expect(formatArticleMonthYear('not-a-date', 'en')).toBe('not-a-date')
  })
})
