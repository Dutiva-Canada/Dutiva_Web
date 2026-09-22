import { describe, expect, it } from 'vitest'
import { seoDescription } from './seo'

describe('seoDescription', () => {
  it('passes short text through unchanged', () => {
    expect(seoDescription('Lead the product team.')).toBe('Lead the product team.')
  })

  it('collapses newlines and extra whitespace', () => {
    expect(seoDescription('Lead the\nproduct   team.')).toBe('Lead the product team.')
  })

  it('truncates at a word boundary inside 155 chars, not mid-word', () => {
    const long = `${'alpha '.repeat(30)}omega`
    const result = seoDescription(long)
    expect(result.length).toBeLessThanOrEqual(156) // 155 + ellipsis
    expect(result.endsWith('…')).toBe(true)
    // The cut lands on a word boundary — no truncated "al" fragment
    expect(result.slice(0, -1).trim().endsWith('alpha')).toBe(true)
  })

  it('strips trailing punctuation before the ellipsis', () => {
    const text = 'A'.repeat(150) + '. ' + 'B'.repeat(50)
    const result = seoDescription(text)
    expect(result).toBe('A'.repeat(150) + '…')
  })
})
