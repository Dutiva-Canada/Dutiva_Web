import { ChevronDown } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { MarketingMessageKey } from '@/i18n/messages'
import { Seo } from '@/seo/Seo'
import { MarketingPageShell, PageCta, PageHero, PageSection } from './MarketingPage'

const GROUPS: {
  titleKey: MarketingMessageKey
  items: { q: MarketingMessageKey; a: MarketingMessageKey }[]
}[] = [
  {
    titleKey: 'faq_g_title',
    items: [
      { q: 'faq_q1', a: 'faq_a1' },
      { q: 'faq_q2', a: 'faq_a2' },
      { q: 'faq_q3', a: 'faq_a3' },
      { q: 'faq_q13', a: 'faq_a13' },
    ],
  },
  {
    titleKey: 'faq_c_title',
    items: [
      { q: 'faq_q4', a: 'faq_a4' },
      { q: 'faq_q5', a: 'faq_a5' },
      { q: 'faq_q6', a: 'faq_a6' },
    ],
  },
  {
    titleKey: 'faq_d_title',
    items: [
      { q: 'faq_q7', a: 'faq_a7' },
      { q: 'faq_q8', a: 'faq_a8' },
      { q: 'faq_q9', a: 'faq_a9' },
    ],
  },
  {
    titleKey: 'faq_p_title',
    items: [
      { q: 'faq_q10', a: 'faq_a10' },
      { q: 'faq_q11', a: 'faq_a11' },
      { q: 'faq_q12', a: 'faq_a12' },
      { q: 'faq_q14', a: 'faq_a14' },
    ],
  },
  {
    titleKey: 'faq_choose_title',
    items: [
      { q: 'landing_faq1_q', a: 'landing_faq1_a' },
      { q: 'faq_q15', a: 'faq_a15' },
      { q: 'faq_q16', a: 'faq_a16' },
      { q: 'landing_faq5_q', a: 'landing_faq5_a' },
      { q: 'landing_faq4_q', a: 'landing_faq4_a' },
      { q: 'landing_faq6_q', a: 'landing_faq6_a' },
    ],
  },
]

/** /faq — four question groups of native no-JS <details> accordions (faq_* strings). */
export function FaqPage() {
  const { t } = useI18n()
  /* FAQPage JSON-LD is built from the exact GROUPS rendered below, so the
     markup can never diverge from the visible questions and answers. */
  const faqEntries = GROUPS.flatMap((group) =>
    group.items.map((item) => ({ question: t(item.q), answer: t(item.a) })),
  )
  return (
    <MarketingPageShell>
      <Seo route="faq" faq={faqEntries} />
      <PageHero eyebrow={t('faq_eyebrow')} title={t('faq_h1')} intro={t('faq_intro')} />

      {GROUPS.map((group) => (
        <PageSection key={group.titleKey} title={t(group.titleKey)}>
          <div className="grid gap-3">
            {group.items.map((item) => (
              <details key={item.q} className="group premium-card-soft overflow-hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-[22px] py-[18px] text-[0.9375rem] font-semibold text-text [&::-webkit-details-marker]:hidden">
                  {t(item.q)}
                  <ChevronDown
                    size={16}
                    className="flex-none text-text-3 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                  />
                </summary>
                <p className="px-[22px] pb-[18px] text-sm leading-[1.6] text-text-2">{t(item.a)}</p>
              </details>
            ))}
          </div>
        </PageSection>
      ))}

      <PageCta
        title={t('faq_closing_t')}
        body={t('faq_closing_p')}
        action={t('faq_closing_btn')}
        href="mailto:support@dutiva.ca"
      />
    </MarketingPageShell>
  )
}
