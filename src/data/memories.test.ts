import { describe, expect, it } from 'vitest'
import { demoTodayISO } from './calendar'
import {
  assertSeedMemoryFactSemantics,
  assertSeedMemoryThreadSemantics,
  memoryThreads,
  seedMemoryFacts,
} from './memories'
import { isCanonicalMemoryDate, MEMORY_DATE_YEAR_MAX, MEMORY_DATE_YEAR_MIN } from './memoryDates'

describe('isCanonicalMemoryDate', () => {
  it('accepts valid calendar dates including leap days', () => {
    expect(isCanonicalMemoryDate('2026-07-05')).toBe(true)
    expect(isCanonicalMemoryDate('2024-02-29')).toBe(true)
    expect(isCanonicalMemoryDate('2000-02-29')).toBe(true)
  })

  it('enforces the supported year range', () => {
    expect(isCanonicalMemoryDate(`${MEMORY_DATE_YEAR_MIN}-01-01`)).toBe(true)
    expect(isCanonicalMemoryDate(`${MEMORY_DATE_YEAR_MAX}-12-31`)).toBe(true)
    expect(isCanonicalMemoryDate(`${MEMORY_DATE_YEAR_MIN - 1}-12-31`)).toBe(false)
    expect(isCanonicalMemoryDate(`${MEMORY_DATE_YEAR_MAX + 1}-01-01`)).toBe(false)
  })

  it('rejects invalid format strings', () => {
    for (const value of [
      '',
      'Today',
      'Yesterday',
      'Aujourd’hui',
      'Hier',
      '2026-7-05',
      '2026-07-5',
      '26-07-05',
      '2026/07/05',
    ]) {
      expect(isCanonicalMemoryDate(value)).toBe(false)
    }
  })

  it('rejects values with trailing suffixes or timestamps', () => {
    for (const value of [
      '2026-07-05banana',
      '2026-07-05foobar',
      '2026-07-05T',
      '2026-07-05T12:00:00Z',
      '2026-07-05T99:99:99',
      '2026-07-05 whatever',
    ]) {
      expect(isCanonicalMemoryDate(value)).toBe(false)
    }
  })

  it('rejects impossible calendar dates', () => {
    for (const value of [
      '2026-00-10',
      '2026-13-01',
      '2026-01-00',
      '2026-01-32',
      '2026-02-29',
      '2025-02-29',
      '2026-02-30',
      '2026-04-31',
      'banana',
    ]) {
      expect(isCanonicalMemoryDate(value)).toBe(false)
    }
  })
})

describe('seedMemoryFacts', () => {
  it('aligns memory scenario today with the demo calendar anchor', () => {
    expect(demoTodayISO).toBe('2026-07-11')
  })

  it('records Jordan service length as 8 years from March 2018', () => {
    const p2 = seedMemoryFacts.find((f) => f.id === 'p2')!
    expect(p2.statement.en).toContain('8 years')
    expect(p2.statement.fr).toContain('8 ans')
    expect(p2.confidence).toBe('confirmed')
    expect(p2.effectiveAt).toBeUndefined()
    expect(p2.learnedAt).toBe('2026-07-02')
  })

  it('does not assign effectiveAt from legacy hire dates without source evidence', () => {
    for (const id of ['p1', 'p2', 'p8', 'a1']) {
      expect(seedMemoryFacts.find((f) => f.id === id)?.effectiveAt).toBeUndefined()
    }
  })

  it('states the Ontario ESA minimum as 8 weeks with conditional severance', () => {
    const c4 = seedMemoryFacts.find((f) => f.id === 'c4')!
    expect(c4.statement.en).toContain('8 weeks')
    expect(c4.statement.en).toContain('statutory severance may also apply')
    expect(c4.statement.fr).toContain('8 semaines')
    expect(c4.statement.fr).toContain('indemnité de cessation d’emploi')
    expect(c4.confidence).toBe('inferred')
    expect(c4.source.type).toBe('inference')
    expect(c4.confirmation).toBeNull()
  })

  it('stores the termination clause as a confirmed document fact, not a legal conclusion', () => {
    const p4 = seedMemoryFacts.find((f) => f.id === 'p4')!
    expect(p4.statement.en).toBe('Employment agreement contains no termination clause')
    expect(p4.confidence).toBe('confirmed')
    expect(p4.source.type).toBe('document')
  })

  it('keeps the common-law estimate inferred with a preliminary caveat', () => {
    const p7 = seedMemoryFacts.find((f) => f.id === 'p7')!
    expect(p7.confidence).toBe('inferred')
    expect(p7.statement.en).toContain('Preliminary')
    expect(p7.statement.en).toContain('counsel review')
    expect(p7.confirmation).toBeNull()
  })

  it('does not seed confirmed facts from inference-only sources', () => {
    for (const fact of seedMemoryFacts) {
      if (fact.confidence === 'confirmed') {
        expect(fact.source.type).not.toBe('inference')
        expect(fact.confirmation).not.toBeNull()
        expect(fact.confirmation!.source.type).not.toBe('inference')
      }
      if (fact.confidence === 'inferred') {
        expect(fact.confirmation).toBeNull()
      }
    }
  })

  it('stores canonical YYYY-MM-DD dates on every temporal field', () => {
    for (const fact of seedMemoryFacts) {
      expect(isCanonicalMemoryDate(fact.learnedAt)).toBe(true)
      if (fact.effectiveAt != null) {
        expect(isCanonicalMemoryDate(fact.effectiveAt)).toBe(true)
      }
      if (fact.confirmation !== null) {
        expect(isCanonicalMemoryDate(fact.confirmation.at)).toBe(true)
        expect(fact.confirmation.at >= fact.learnedAt).toBe(true)
      }
    }
  })

  it('rejects malformed learnedAt values in semantic validation', () => {
    const bad = seedMemoryFacts.map((f) =>
      f.id === 'p1' ? { ...f, learnedAt: '2026-07-05T12:00:00Z' } : f,
    )
    expect(() => assertSeedMemoryFactSemantics(bad)).toThrow(/canonical YYYY-MM-DD date/)
  })

  it('rejects malformed effectiveAt values in semantic validation', () => {
    const bad = seedMemoryFacts.map((f) =>
      f.id === 'p1' ? { ...f, effectiveAt: '2026-02-30' } : f,
    )
    expect(() => assertSeedMemoryFactSemantics(bad)).toThrow(/canonical YYYY-MM-DD date/)
  })

  it('rejects malformed confirmation dates in semantic validation', () => {
    const bad = seedMemoryFacts.map((f) =>
      f.id === 'p4' && f.confirmation
        ? {
            ...f,
            confirmation: {
              ...f.confirmation,
              at: '2026-04-31',
            },
          }
        : f,
    )
    expect(() => assertSeedMemoryFactSemantics(bad)).toThrow(/canonical YYYY-MM-DD date/)
  })

  it('rejects confirmation dates before the fact was learned', () => {
    const bad = seedMemoryFacts.map((f) =>
      f.id === 'p4' && f.confirmation
        ? {
            ...f,
            learnedAt: '2026-07-05',
            confirmation: {
              ...f.confirmation,
              at: '2026-07-04',
            },
          }
        : f,
    )
    expect(() => assertSeedMemoryFactSemantics(bad)).toThrow(
      /confirmation cannot precede when the fact was learned/,
    )
  })

  it('rejects confirmed facts without confirmation provenance', () => {
    const bad = seedMemoryFacts.map((f) =>
      f.id === 'p4' ? { ...f, confirmation: null } : f,
    ) as typeof seedMemoryFacts
    expect(() => assertSeedMemoryFactSemantics(bad)).toThrow(
      /confirmed facts must include confirmation provenance/,
    )
  })

  it('does not confirm counsel review with a later date than its source supports', () => {
    const c2 = seedMemoryFacts.find((f) => f.id === 'c2')!
    expect(c2.statement.en).not.toMatch(/still outstanding/i)
    expect(c2.learnedAt).toBe('2026-07-05')
    expect(c2.confirmation?.at).toBe('2026-07-05')
  })

  it('uses the real Amara case record without a fabricated July 11 review source', () => {
    const a2 = seedMemoryFacts.find((f) => f.id === 'a2')!
    expect(a2.statement.en).not.toMatch(/\bactive\b/i)
    expect(a2.source.detail.en).toBe('CASE-2026-0138')
    expect(a2.confirmation?.source.detail.en).toBe('CASE-2026-0138')
    expect(a2.learnedAt).toBe('2026-04-03')
    expect(a2.confirmation?.at).toBe('2026-04-03')
  })

  it('limits the termination-letter memory to what the draft document supports', () => {
    const c3 = seedMemoryFacts.find((f) => f.id === 'c3')!
    expect(c3.statement.en).toBe('Termination letter draft dated Jul 5')
    expect(c3.statement.en).not.toMatch(/held|not sent/i)
    expect(c3.source.type).toBe('document')
  })

  it('marks Devon PIP memory as sensitive', () => {
    const d1 = seedMemoryFacts.find((f) => f.id === 'd1')!
    expect(d1.sensitive).toBe(true)
    expect(d1.learnedAt).toBe('2026-06-22')
    expect(d1.confirmation?.at).toBe('2026-06-22')
    expect(d1.effectiveAt).toBeUndefined()
  })

  it('passes runtime seed semantics validation', () => {
    expect(() => assertSeedMemoryFactSemantics(seedMemoryFacts)).not.toThrow()
  })

  it('rejects inferred facts that carry confirmation', () => {
    const bad = seedMemoryFacts.map((f) =>
      f.id === 'p7'
        ? {
            ...f,
            confirmation: {
              at: '2026-07-11',
              source: { type: 'manual' as const, detail: f.source.detail },
            },
          }
        : f,
    )
    expect(() => assertSeedMemoryFactSemantics(bad)).toThrow(
      /inferred facts must not carry confirmation/,
    )
  })

  it('rejects confirmed facts sourced only from inference', () => {
    const bad = seedMemoryFacts.map((f) =>
      f.id === 'p4' ? { ...f, source: { type: 'inference' as const, detail: f.source.detail } } : f,
    )
    expect(() => assertSeedMemoryFactSemantics(bad)).toThrow(/inference alone/)
  })

  it('rejects confirmation provenance sourced only from inference', () => {
    const bad = seedMemoryFacts.map((f) =>
      f.id === 'p4' && f.confirmation
        ? {
            ...f,
            confirmation: {
              ...f.confirmation,
              source: { type: 'inference' as const, detail: f.confirmation.source.detail },
            },
          }
        : f,
    ) as typeof seedMemoryFacts
    expect(() => assertSeedMemoryFactSemantics(bad)).toThrow(
      /confirmation cannot be sourced from inference alone/,
    )
  })
})

describe('memoryThreads', () => {
  it('stores resumedAt as a canonical YYYY-MM-DD date', () => {
    expect(memoryThreads[0]?.resumedAt).toBe(demoTodayISO)
    expect(isCanonicalMemoryDate(memoryThreads[0]!.resumedAt)).toBe(true)
    expect(memoryThreads[0]).not.toHaveProperty('navSub')
  })

  it('rejects malformed resumedAt values in semantic validation', () => {
    const bad = memoryThreads.map((t) =>
      t.id === memoryThreads[0]!.id ? { ...t, resumedAt: '2026-04-31' } : t,
    )
    expect(() => assertSeedMemoryThreadSemantics(bad)).toThrow(/canonical YYYY-MM-DD date/)
  })
})
