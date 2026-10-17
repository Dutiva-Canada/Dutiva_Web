import { describe, expect, it } from 'vitest'
import { AGENT_RUN_STALE_MS, isQuoteStale, quoteStaleMs } from './freshness'

/* Fixed clocks: session checks use a Wednesday mid-session; the off-hours
   checks use a Saturday (no quarter-hour sync runs). */
const WED_MIDDAY = Date.parse('2026-10-21T15:00:00Z') // Wed 11:00 ET
const SATURDAY = Date.parse('2026-10-24T15:00:00Z')

describe('isQuoteStale', () => {
  it('flags a 2h-old quote mid-session but not a 30min one', () => {
    expect(isQuoteStale(new Date(WED_MIDDAY - 2 * 3_600_000).toISOString(), WED_MIDDAY)).toBe(true)
    expect(isQuoteStale(new Date(WED_MIDDAY - 30 * 60_000).toISOString(), WED_MIDDAY)).toBe(false)
  })

  it('holds a 2h-old quote as fresh outside the session', () => {
    expect(isQuoteStale(new Date(SATURDAY - 2 * 3_600_000).toISOString(), SATURDAY)).toBe(false)
    expect(isQuoteStale(new Date(SATURDAY - 27 * 3_600_000).toISOString(), SATURDAY)).toBe(true)
  })

  it('a missing timestamp is not stale — it is absent', () => {
    expect(isQuoteStale(null, WED_MIDDAY)).toBe(false)
    expect(isQuoteStale(undefined, WED_MIDDAY)).toBe(false)
  })

  it('thresholds: 90min in session, ~26h off-session', () => {
    expect(quoteStaleMs(WED_MIDDAY)).toBe(90 * 60_000)
    expect(quoteStaleMs(SATURDAY)).toBe(26 * 3_600_000)
    expect(AGENT_RUN_STALE_MS).toBe(26 * 3_600_000)
  })
})
