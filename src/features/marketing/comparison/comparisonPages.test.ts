import { describe, expect, it } from 'vitest'
import { COMPARISON_PAGES } from './comparisonPages'

describe('comparisonPages', () => {
  it('names the Citation Canada rebrand on the HRdownloads page', () => {
    expect(COMPARISON_PAGES.hrdownloads.intro.en).toMatch(/Citation Canada \(formerly HRdownloads\)/)
    expect(COMPARISON_PAGES.hrdownloads.competitorNote.en).toMatch(/rebranded from HRdownloads/)
  })

  it('states SixFifty US-only jurisdiction scope from public materials', () => {
    const statute = COMPARISON_PAGES.sixfifty.dimensions.find((d) => d.id === 'statute')
    expect(statute?.competitor.en).toMatch(/US federal, state, and local/)
    expect(statute?.competitor.en).toMatch(/no Canadian/)
  })

  it('describes Citation Canada interactive pricing without inventing plan prices', () => {
    const pricing = COMPARISON_PAGES.hrdownloads.dimensions.find((d) => d.id === 'pricing')
    expect(pricing?.competitor.en).toMatch(/Interactive starting prices/)
    expect(pricing?.competitor.en).toMatch(/Get a quote/)
    expect(pricing?.competitor.en).not.toMatch(/\$\d+/)
  })

  it('cites SixFifty published starting prices from their pricing page', () => {
    const pricing = COMPARISON_PAGES.sixfifty.dimensions.find((d) => d.id === 'pricing')
    expect(pricing?.competitor.en).toMatch(/\$75\/mo/)
    expect(pricing?.competitor.en).toMatch(/\$5,000\/yr/)
    expect(pricing?.competitor.en).toMatch(/Book a demo/)
  })
})
