import { describe, expect, it } from 'vitest'
import { formatArticleMonthYear, maxIsoDate, parseDisplayDate } from './dates'

describe('parseDisplayDate', () => {
  it('parses English and French display dates to ISO', () => {
    expect(parseDisplayDate('June 1, 2026')).toBe('2026-06-01')
    expect(parseDisplayDate('1er juin 2026')).toBe('2026-06-01')
    expect(parseDisplayDate('le 1er juin 2026')).toBe('2026-06-01')
    expect(parseDisplayDate('26 août 2026')).toBe('2026-08-26')
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

describe('maxIsoDate', () => {
  it('returns the latest defined ISO date', () => {
    expect(maxIsoDate(['2026-07-16', undefined, '2026-08-26', '2026-08-01'])).toBe('2026-08-26')
  })

  it('returns undefined when nothing qualifies', () => {
    expect(maxIsoDate([undefined, undefined])).toBeUndefined()
    expect(maxIsoDate([])).toBeUndefined()
  })
})
