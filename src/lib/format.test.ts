import { describe, expect, it } from 'vitest'
import { relativeTime } from './format'

const now = new Date('2026-03-01T12:00:00Z')

describe('relativeTime', () => {
  it('buckets minutes, hours and days', () => {
    expect(relativeTime('2026-03-01T11:59:40Z', now)).toEqual({ unit: 'now', n: 0 })
    expect(relativeTime('2026-03-01T11:30:00Z', now)).toEqual({ unit: 'min', n: 30 })
    expect(relativeTime('2026-03-01T06:00:00Z', now)).toEqual({ unit: 'hr', n: 6 })
    expect(relativeTime('2026-02-26T12:00:00Z', now)).toEqual({ unit: 'day', n: 3 })
  })

  it('returns null for future or unparseable timestamps', () => {
    expect(relativeTime('2026-03-02T00:00:00Z', now)).toBeNull()
    expect(relativeTime('not-a-date', now)).toBeNull()
  })
})
