import type { Lang } from '@/i18n/core'
import { pick } from '@/i18n/core'
import { landing } from '@/i18n/messages/landing'
import type { LandingMessageKey } from './useLanding'

/**
 * Homepage Q&A pairs. The visible section and FAQPage JSON-LD both
 * derive from this list so they cannot drift apart.
 */
export const HOME_FAQ_ITEMS = [
  { q: 'landing_faq1_q', a: 'landing_faq1_a' },
  { q: 'landing_faq2_q', a: 'landing_faq2_a' },
  { q: 'landing_faq3_q', a: 'landing_faq3_a' },
  { q: 'landing_faq4_q', a: 'landing_faq4_a' },
  { q: 'landing_faq5_q', a: 'landing_faq5_a' },
  { q: 'landing_faq6_q', a: 'landing_faq6_a' },
] as const satisfies readonly { q: LandingMessageKey; a: LandingMessageKey }[]

export function homeFaqEntries(lang: Lang): { question: string; answer: string }[] {
  return HOME_FAQ_ITEMS.map((item) => ({
    question: pick(landing[item.q], lang),
    answer: pick(landing[item.a], lang),
  }))
}
