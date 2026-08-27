/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
/**
 * Q&A block for `llms.txt`. Answers are the same strings as the visible
 * homepage / FAQ pairs so answer engines do not get a second, drifting
 * corpus.
 */
import { faqMessages } from '@/i18n/messages/faq'
import { landing } from '@/i18n/messages/landing'

const PAIRS: readonly { question: string; answer: string }[] = [
  { question: landing.landing_faq1_q.en, answer: landing.landing_faq1_a.en },
  { question: faqMessages.faq_q15.en, answer: faqMessages.faq_a15.en },
  { question: faqMessages.faq_q16.en, answer: faqMessages.faq_a16.en },
  { question: landing.landing_faq5_q.en, answer: landing.landing_faq5_a.en },
  { question: landing.landing_faq4_q.en, answer: landing.landing_faq4_a.en },
  { question: landing.landing_faq6_q.en, answer: landing.landing_faq6_a.en },
]

/** English markdown `### question` blocks for `llms.txt`. */
export function llmQuestionsMarkdown(): string {
  return PAIRS.map((pair) => `### ${pair.question}\n\n${pair.answer}`).join('\n\n')
}
