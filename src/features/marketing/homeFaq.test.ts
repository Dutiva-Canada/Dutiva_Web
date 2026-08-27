import { describe, expect, it } from 'vitest'
import { landing } from '@/i18n/messages/landing'
import { HOME_FAQ_ITEMS, homeFaqEntries } from './homeFaq'

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

describe('homeFaq', () => {
  it('keeps English answers in the 40–70 word lift range', () => {
    for (const item of HOME_FAQ_ITEMS) {
      const words = wordCount(landing[item.a].en)
      expect(words, item.a).toBeGreaterThanOrEqual(40)
      expect(words, item.a).toBeLessThanOrEqual(70)
    }
  })

  it('phrases every heading as a question', () => {
    for (const item of HOME_FAQ_ITEMS) {
      expect(landing[item.q].en).toMatch(/\?$/)
      expect(landing[item.q].fr).toMatch(/\?$/)
    }
  })

  it('returns one entry per visible pair', () => {
    expect(homeFaqEntries('en')).toHaveLength(HOME_FAQ_ITEMS.length)
    expect(homeFaqEntries('en')[0]!.question).toBe(landing.landing_faq1_q.en)
    expect(homeFaqEntries('fr')[0]!.question).toBe(landing.landing_faq1_q.fr)
  })

  it('covers the buyer prompts engines keep missing', () => {
    const questions = HOME_FAQ_ITEMS.map((item) => landing[item.q].en)
    expect(questions).toContain('What does Dutiva actually do?')
    expect(questions).toContain('How do I get started with Dutiva?')
    expect(questions).toContain('Is Dutiva reputable?')
    expect(questions).toContain('How do I contact Dutiva support?')
  })
})
