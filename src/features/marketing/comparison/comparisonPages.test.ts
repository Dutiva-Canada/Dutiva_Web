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

  it('states Citation Canada quote-only pricing without inventing plan prices', () => {
    const pricing = COMPARISON_PAGES.hrdownloads.dimensions.find((d) => d.id === 'pricing')
    expect(pricing?.competitor.en).toMatch(/Custom quote required/)
    expect(pricing?.competitor.en).not.toMatch(/\$\d+/)
  })
})
