import { describe, expect, it } from 'vitest'
import { requiresHumanFirstLine, suggestFirstLine } from './firstLineAssist'
import type { SupportCategory } from '@/config/support'

describe('requiresHumanFirstLine', () => {
  it('always escalates the sensitive categories', () => {
    for (const c of [
      'privacy',
      'security',
      'accessibility',
      'complaint',
      'billing',
      'account_access',
    ] as SupportCategory[]) {
      expect(requiresHumanFirstLine(c), c).toBe(true)
    }
  })
  it('does not escalate general categories or an unset category', () => {
    for (const c of ['product_question', 'technical', 'sales', 'other'] as SupportCategory[]) {
      expect(requiresHumanFirstLine(c), c).toBe(false)
    }
    expect(requiresHumanFirstLine('')).toBe(false)
  })
})

describe('suggestFirstLine', () => {
  it('offers no suggestions and flags escalation for a human-only category', () => {
    const result = suggestFirstLine('I need to delete my data', 'privacy', 'en')
    expect(result).toEqual({ escalate: true, articles: [] })
  })

  it('suggests matching Help Centre articles for an eligible category', () => {
    const result = suggestFirstLine('generate a document from a template', 'product_question', 'en')
    expect(result.escalate).toBe(false)
    expect(result.articles.map((a) => a.slug)).toContain('generate-a-document')
  })

  it('returns nothing until the query is long enough', () => {
    expect(suggestFirstLine('ab', 'product_question', 'en')).toEqual({
      escalate: false,
      articles: [],
    })
  })

  it('caps the number of suggestions', () => {
    const result = suggestFirstLine('support request help document account', 'other', 'en', 2)
    expect(result.articles.length).toBeLessThanOrEqual(2)
  })
})
