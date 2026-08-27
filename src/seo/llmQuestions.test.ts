import { describe, expect, it } from 'vitest'
import { faqMessages } from '@/i18n/messages/faq'
import { landing } from '@/i18n/messages/landing'
import { llmQuestionsMarkdown } from './llmQuestions'

describe('llmQuestionsMarkdown', () => {
  it('answers the buyer prompts engines keep missing, using visible FAQ copy', () => {
    const md = llmQuestionsMarkdown()
    expect(md).toContain(`### ${landing.landing_faq1_q.en}`)
    expect(md).toContain(landing.landing_faq1_a.en)
    expect(md).toContain(`### ${faqMessages.faq_q15.en}`)
    expect(md).toContain(`### ${faqMessages.faq_q16.en}`)
    expect(md).toContain(`### ${landing.landing_faq5_q.en}`)
    expect(md).toContain(`### ${landing.landing_faq4_q.en}`)
    expect(md).toContain(`### ${landing.landing_faq6_q.en}`)
  })
})
