import { describe, expect, it } from 'vitest'
import {
  assessLawUpdate,
  CUSTOMER_FACING_EVENT_TYPES,
  isLawChangeEvent,
  selectRelevantUpdates,
  toSupportedJurisdiction,
} from './lawUpdateRelevance'
import type { SupportedJurisdiction } from './lawUpdateRelevance'

/**
 * The jurisdiction strings below are the fourteen distinct values actually
 * present in `law_updates.jurisdiction` in production, not invented examples.
 */
const PRODUCTION_JURISDICTIONS = [
  'Alberta',
  'British Columbia',
  'Federal',
  'Manitoba',
  'New Brunswick',
  'Newfoundland and Labrador',
  'Northwest Territories',
  'Nova Scotia',
  'Nunavut',
  'Ontario',
  'Prince Edward Island',
  'Quebec',
  'Saskatchewan',
  'Yukon',
] as const

describe('toSupportedJurisdiction', () => {
  it('maps the three supported jurisdictions', () => {
    expect(toSupportedJurisdiction('Ontario')).toBe('ON')
    expect(toSupportedJurisdiction('Quebec')).toBe('QC')
    expect(toSupportedJurisdiction('Federal')).toBe('FED')
  })

  it('accepts Québec with its accent', () => {
    /* The monitor writes "Quebec", but the accented form is the correct
       French spelling and could arrive from another writer. */
    expect(toSupportedJurisdiction('Québec')).toBe('QC')
  })

  it('is case- and whitespace-insensitive', () => {
    expect(toSupportedJurisdiction('  ONTARIO ')).toBe('ON')
    expect(toSupportedJurisdiction('federal')).toBe('FED')
  })

  it('returns null for every jurisdiction Dutiva does not support', () => {
    const unsupported = PRODUCTION_JURISDICTIONS.filter(
      (j) => !['Ontario', 'Quebec', 'Federal'].includes(j),
    )
    /* All eleven others — monitoring is wider than coverage, and an unmapped
       jurisdiction must never reach a customer-facing channel. */
    expect(unsupported).toHaveLength(11)
    for (const jurisdiction of unsupported) {
      expect(toSupportedJurisdiction(jurisdiction)).toBeNull()
    }
  })

  it('fails closed on missing or malformed input', () => {
    expect(toSupportedJurisdiction(null)).toBeNull()
    expect(toSupportedJurisdiction(undefined)).toBeNull()
    expect(toSupportedJurisdiction('')).toBeNull()
    expect(toSupportedJurisdiction('Onterio')).toBeNull()
  })

  it('agrees with the client-side filter the Knowledge panel uses', async () => {
    /* The panel filters `law_updates` by monitor display name, and this module
       maps those names to codes. They are separate copies because an edge
       function and the client cannot share a module — so if one gains a
       jurisdiction and the other does not, the product would notify about a
       jurisdiction it does not display, or vice versa. */
    const { MONITOR_JURISDICTION_NAMES, CUSTOMER_FACING_EVENT_TYPE } =
      await import('@/features/app/guidance/monitoringCoverage')
    for (const name of MONITOR_JURISDICTION_NAMES) {
      expect(toSupportedJurisdiction(name)).not.toBeNull()
    }
    expect(CUSTOMER_FACING_EVENT_TYPES).toContain(CUSTOMER_FACING_EVENT_TYPE)
    expect(CUSTOMER_FACING_EVENT_TYPES).toHaveLength(1)
  })

  it('covers exactly the product Jurisdiction union', () => {
    /* Pinned against src/features/app/documents/data/types.ts. The type is
       duplicated because edge functions cannot import from src/, so this test
       is what stops the two drifting apart. */
    const codes = new Set(
      PRODUCTION_JURISDICTIONS.map(toSupportedJurisdiction).filter(
        (c): c is SupportedJurisdiction => c !== null,
      ),
    )
    expect([...codes].sort()).toEqual(['FED', 'ON', 'QC'])
  })
})

describe('isLawChangeEvent', () => {
  it('accepts only a change', () => {
    expect(isLawChangeEvent('change')).toBe(true)
  })

  it('rejects operational events', () => {
    /* first_seen says we started watching; redirect is our plumbing; broken is
       a report about Dutiva's own scrapers failing. None is legal news, and
       broken in particular would alarm a customer about nothing they can act
       on. */
    expect(isLawChangeEvent('first_seen')).toBe(false)
    expect(isLawChangeEvent('redirect')).toBe(false)
    expect(isLawChangeEvent('broken')).toBe(false)
  })

  it('fails closed on missing input', () => {
    expect(isLawChangeEvent(null)).toBe(false)
    expect(isLawChangeEvent(undefined)).toBe(false)
    expect(isLawChangeEvent('')).toBe(false)
  })

  it('keeps the customer-facing set to just "change"', () => {
    /* Widening this is a product decision, not a refactor — if a future event
       type belongs in a customer's inbox, that should be an explicit change
       with its own reasoning, not a quiet addition. */
    expect(CUSTOMER_FACING_EVENT_TYPES).toEqual(['change'])
  })
})

describe('assessLawUpdate', () => {
  it('accepts a real change in a supported jurisdiction', () => {
    expect(assessLawUpdate({ jurisdiction: 'Ontario', eventType: 'change' })).toEqual({
      relevant: true,
      jurisdiction: 'ON',
      reason: 'relevant',
    })
  })

  it('rejects a change in an unsupported jurisdiction', () => {
    const verdict = assessLawUpdate({ jurisdiction: 'Yukon', eventType: 'change' })
    expect(verdict.relevant).toBe(false)
    expect(verdict.reason).toBe('unsupported-jurisdiction')
  })

  it('rejects an operational event in a supported jurisdiction', () => {
    const verdict = assessLawUpdate({ jurisdiction: 'Ontario', eventType: 'broken' })
    expect(verdict.relevant).toBe(false)
    expect(verdict.reason).toBe('not-a-law-change')
    /* Still resolves the code — the row is ours, it just is not news. */
    expect(verdict.jurisdiction).toBe('ON')
  })

  it('reports the jurisdiction problem first when a row fails both tests', () => {
    expect(assessLawUpdate({ jurisdiction: 'Alberta', eventType: 'broken' }).reason).toBe(
      'unsupported-jurisdiction',
    )
  })
})

describe('selectRelevantUpdates', () => {
  const batch = [
    { id: 'on-change', jurisdiction: 'Ontario', eventType: 'change' },
    { id: 'qc-change', jurisdiction: 'Quebec', eventType: 'change' },
    { id: 'fed-change', jurisdiction: 'Federal', eventType: 'change' },
    { id: 'ab-change', jurisdiction: 'Alberta', eventType: 'change' },
    { id: 'on-broken', jurisdiction: 'Ontario', eventType: 'broken' },
    { id: 'on-first', jurisdiction: 'Ontario', eventType: 'first_seen' },
  ]

  it('returns only real changes in the requested jurisdictions', () => {
    expect(selectRelevantUpdates(batch, ['ON']).map((u) => u.id)).toEqual(['on-change'])
  })

  it('handles a recipient covering several jurisdictions', () => {
    expect(selectRelevantUpdates(batch, ['ON', 'FED']).map((u) => u.id)).toEqual([
      'on-change',
      'fed-change',
    ])
  })

  it('never leaks an unsupported jurisdiction, even if asked for everything', () => {
    const ids = selectRelevantUpdates(batch, ['ON', 'QC', 'FED']).map((u) => u.id)
    expect(ids).not.toContain('ab-change')
    expect(ids).toEqual(['on-change', 'qc-change', 'fed-change'])
  })

  it('sends nothing to a recipient with no jurisdiction on file', () => {
    /* Not "everything" — an unknown jurisdiction is a gap to fill, and
       defaulting to the whole country would spam people about laws that do not
       apply to them. */
    expect(selectRelevantUpdates(batch, [])).toEqual([])
  })

  it('returns an empty batch unchanged', () => {
    expect(selectRelevantUpdates([], ['ON'])).toEqual([])
  })
})
