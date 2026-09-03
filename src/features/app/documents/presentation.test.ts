import { describe, expect, it } from 'vitest'
import { defaultOrgProfile, templateByTid } from './data'
import { allTemplates } from './catalogue'
import {
  compareTemplatesForOrg,
  displayTemplateTitle,
  filterTemplates,
  presentApplicability,
  reviewLevelInfo,
} from './presentation'

const tplT01 = templateByTid.get('T01')!

describe('reviewLevelInfo', () => {
  it('maps low/medium/high to review-level labels, not risk wording', () => {
    expect(reviewLevelInfo('low').label.en).toBe('Standard review')
    expect(reviewLevelInfo('medium').label.en).toBe('Careful review')
    expect(reviewLevelInfo('high').label.en).toBe('Legal review recommended')
    expect(reviewLevelInfo('low').label.fr).toBe('Révision standard')
    expect(reviewLevelInfo('low').label.en.toLowerCase()).not.toContain('risk')
  })
})

describe('presentApplicability', () => {
  it('uses Required only when the engine size trigger fires', () => {
    const t15 = allTemplates.find((t) => t.tid === 'T15')
    expect(t15).toBeDefined()
    if (!t15) return

    const below = presentApplicability(t15, { ...defaultOrgProfile, headcount: 42 })
    expect(below.kind).toBe('available')
    expect(below.label.en).not.toMatch(/required/i)

    const required = presentApplicability(t15, { ...defaultOrgProfile, headcount: 60 })
    expect(required.kind).toBe('required')
    expect(required.label.en).toBe('Required based on your profile')
  })

  it('marks jurisdiction mismatch as not matched without inventing Required', () => {
    const result = presentApplicability(tplT01, {
      ...defaultOrgProfile,
      primaryJurisdiction: 'QC',
      sector: 'prof_services',
    })
    expect(result.kind).toBe('not_matched')
    expect(result.label.en).toBe('Not matched to your profile')
  })

  it('recommends matching Ontario templates without size triggers for the default profile', () => {
    const t05 = templateByTid.get('T05')!
    const result = presentApplicability(t05, defaultOrgProfile)
    expect(result.kind).toBe('recommended')
    expect(result.label.en).toBe('Recommended for your organization')
    expect(result.reason.en.toLowerCase()).toContain('ontario')
  })
})

describe('filterTemplates + ranking', () => {
  it('derives filtered counts from the catalogue', () => {
    const filtered = filterTemplates(allTemplates, {
      query: 'offer',
      category: 'all',
      jurisdiction: 'all',
      reviewLevel: 'all',
    })
    expect(filtered.length).toBeGreaterThan(0)
    expect(filtered.length).toBeLessThan(allTemplates.length)
    expect(filtered.every((t) => /offer/i.test(`${t.name.en} ${t.desc.en}`))).toBe(true)
  })

  it('ranks required ahead of recommended', () => {
    const t15 = allTemplates.find((t) => t.tid === 'T15')!
    const t05 = templateByTid.get('T05')!
    const org = { ...defaultOrgProfile, headcount: 60 }
    const ordered = [t05, t15].sort((a, b) => compareTemplatesForOrg(a, b, org))
    expect(ordered[0]?.tid).toBe('T15')
    expect(presentApplicability(t05, org).kind).toBe('recommended')
    expect(presentApplicability(t15, org).kind).toBe('required')
  })
})

describe('displayTemplateTitle', () => {
  it('strips jurisdiction parentheticals when metadata already shows them', () => {
    expect(displayTemplateTitle('Offer of employment letter (Ontario)', ['ON'])).toBe(
      'Offer of employment letter',
    )
  })
})
