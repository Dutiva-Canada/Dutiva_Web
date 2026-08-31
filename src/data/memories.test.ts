import { describe, expect, it } from 'vitest'
import { demoTodayISO } from './calendar'
import { seedMemoryFacts } from './memories'

describe('seedMemoryFacts', () => {
  it('aligns memory scenario today with the demo calendar anchor', () => {
    expect(demoTodayISO).toBe('2026-07-11')
  })

  it('records Jordan service length as 8 years from March 2018', () => {
    const p2 = seedMemoryFacts.find((f) => f.id === 'p2')!
    expect(p2.statement.en).toContain('8 years')
    expect(p2.statement.fr).toContain('8 ans')
    expect(p2.confidence).toBe('confirmed')
  })

  it('states the Ontario ESA minimum as 8 weeks with conditional severance', () => {
    const c4 = seedMemoryFacts.find((f) => f.id === 'c4')!
    expect(c4.statement.en).toContain('8 weeks')
    expect(c4.statement.en).toContain('statutory severance may also apply')
    expect(c4.statement.fr).toContain('8 semaines')
    expect(c4.statement.fr).toContain('indemnité de cessation d’emploi')
    expect(c4.confidence).toBe('inferred')
    expect(c4.source.type).toBe('inference')
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
  })

  it('does not seed confirmed facts from inference-only sources', () => {
    for (const fact of seedMemoryFacts) {
      if (fact.confidence === 'confirmed') {
        expect(fact.source.type).not.toBe('inference')
      }
      if (fact.confidence === 'inferred') {
        expect(fact.confirmedAt).toBeNull()
      }
    }
  })

  it('stores ISO dates instead of relative Today labels', () => {
    for (const fact of seedMemoryFacts) {
      expect(fact.learnedAt).toMatch(/^\d{4}-\d{2}-\d{2}/)
      if (fact.confirmedAt !== null) {
        expect(fact.confirmedAt).toMatch(/^\d{4}-\d{2}-\d{2}/)
      }
      expect(fact.learnedAt).not.toMatch(/Today|Aujourd/i)
      if (fact.confirmedAt !== null) {
        expect(fact.confirmedAt).not.toMatch(/Today|Aujourd/i)
      }
    }
  })

  it('marks Devon PIP memory as sensitive', () => {
    const d1 = seedMemoryFacts.find((f) => f.id === 'd1')!
    expect(d1.sensitive).toBe(true)
  })
})
