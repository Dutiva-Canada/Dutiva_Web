import { describe, expect, it } from 'vitest'
import { answerExcerpt, classifyGeoAnswer } from './handlers'

const FP = { domains: ['dutiva.ca'], brands: ['Dutiva'] }

describe('classifyGeoAnswer', () => {
  it('is cited when the answer carries a Dutiva domain link', () => {
    expect(
      classifyGeoAnswer('Platforms include Dutiva (https://dutiva.ca/pr) for comms.', FP),
    ).toBe('cited')
    expect(classifyGeoAnswer('See dutiva.ca for details.', FP)).toBe('cited')
  })

  it('is mentioned when the brand name appears without a link', () => {
    expect(classifyGeoAnswer('Dutiva is a Canadian HR-compliance company.', FP)).toBe('mentioned')
    expect(classifyGeoAnswer('Options: dutiva, plus generic trackers.', FP)).toBe('mentioned')
  })

  it('is absent when neither appears', () => {
    expect(classifyGeoAnswer('Here are some HR tools: BambooHR, Collage.', FP)).toBe('absent')
    expect(classifyGeoAnswer('', FP)).toBe('absent')
  })

  it('does not count a substring inside another word', () => {
    expect(classifyGeoAnswer('dutivational content marketing tips', FP)).toBe('absent')
  })

  it('domain match wins over a bare brand mention', () => {
    expect(classifyGeoAnswer('Dutiva — https://dutiva.ca — is one option.', FP)).toBe('cited')
  })
})

describe('answerExcerpt', () => {
  it('collapses whitespace and caps length with an ellipsis', () => {
    const long = 'word  '.repeat(60)
    const out = answerExcerpt(long)
    expect(out.length).toBeLessThanOrEqual(220)
    expect(out.endsWith('…')).toBe(true)
    expect(answerExcerpt('a\n\nb\tc')).toBe('a b c')
  })
})
