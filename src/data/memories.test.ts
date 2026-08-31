import { describe, expect, it } from 'vitest'
import { demoTodayISO } from './calendar'
import { assertSeedMemoryFactSemantics, memoryThreads, seedMemoryFacts } from './memories'
import { isCanonicalMemoryDate } from './memoryDates'

describe('isCanonicalMemoryDate', () => {
  it('accepts a valid YYYY-MM-DD value', () => {
    expect(isCanonicalMemoryDate('2026-07-05')).toBe(true)
  })

  it('rejects relative labels', () => {
    expect(isCanonicalMemoryDate('Today')).toBe(false)
    expect(isCanonicalMemoryDate('Aujourd’hui')).toBe(false)
    expect(isCanonicalMemoryDate('Yesterday')).toBe(false)
    expect(isCanonicalMemoryDate('Hier')).toBe(false)
  })

  it('rejects non-ISO prose and malformed calendar dates', () => {
    expect(isCanonicalMemoryDate('Jul 5')).toBe(false)
    expect(isCanonicalMemoryDate('banana')).toBe(false)
    expect(isCanonicalMemoryDate('2026-99-99')).toBe(false)
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
    expect(p2.effectiveAt).toBe('2018-03-01')
    expect(p2.learnedAt).toBe('2026-07-02')
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
      }
      if (fact.confidence === 'inferred') {
        expect(fact.confirmation).toBeNull()
      }
    }
  })

  it('stores canonical ISO dates on every temporal field', () => {
    for (const fact of seedMemoryFacts) {
      expect(isCanonicalMemoryDate(fact.learnedAt)).toBe(true)
      if (fact.effectiveAt != null) {
        expect(isCanonicalMemoryDate(fact.effectiveAt)).toBe(true)
      }
      if (fact.confirmation !== null) {
        expect(isCanonicalMemoryDate(fact.confirmation.at)).toBe(true)
        expect(fact.confirmation.at >= fact.learnedAt.slice(0, 10)).toBe(true)
      }
    }
  })

  it('does not confirm counsel review with a later date than its source supports', () => {
    const c2 = seedMemoryFacts.find((f) => f.id === 'c2')!
    expect(c2.statement.en).not.toMatch(/still outstanding/i)
    expect(c2.learnedAt).toBe('2026-07-05')
    expect(c2.confirmation?.at).toBe('2026-07-05')
  })

  it('marks Devon PIP memory as sensitive', () => {
    const d1 = seedMemoryFacts.find((f) => f.id === 'd1')!
    expect(d1.sensitive).toBe(true)
    expect(d1.learnedAt).toBe('2026-06-22')
    expect(d1.confirmation?.at).toBe('2026-06-22')
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
})

describe('memoryThreads', () => {
  it('stores resumedAt instead of a relative nav label', () => {
    expect(memoryThreads[0]?.resumedAt).toBe(demoTodayISO)
    expect(memoryThreads[0]).not.toHaveProperty('navSub')
  })
})
