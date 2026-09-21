import { useSearchParams } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { Seo } from '@/seo/Seo'
import { supportMessages as M } from '@/i18n/messages/support'
import type { SupportCategory } from '@/config/support'
import { PublicSupportForm } from '@/features/support/PublicSupportForm'
import { MarketingPageShell, PageHero } from './MarketingPage'
import { supportMessages } from '@/i18n/messages/support'
import { LangScope } from '@/i18n/LangScope'

/** `?topic=` deep links (from the Help Centre, footer, or legal pages) preselect a category. */
const TOPIC_MAP: Record<string, SupportCategory> = {
  security: 'security',
  privacy: 'privacy',
  accessibility: 'accessibility',
  product: 'product_question',
  sales: 'sales',
}

/** /contact (EN) · /fr/contact (FR) — public, unauthenticated support intake. */
const SCOPE = supportMessages

export function ContactPage() {
  return (
    <LangScope messages={SCOPE}>
      <ContactPageInner />
    </LangScope>
  )
}

function ContactPageInner() {
  const { x } = useI18n()
  const [params] = useSearchParams()
  const topic = TOPIC_MAP[params.get('topic') ?? '']

  return (
    <MarketingPageShell>
      <Seo route="contact" />
      <PageHero
        eyebrow={x(M.support_contact_eyebrow)}
        title={x(M.support_contact_h1)}
        intro={x(M.support_contact_intro)}
      />
      <section className="mx-auto max-w-[720px] px-6 pt-2 pb-20">
        <div className="premium-card p-[clamp(20px,3.5vw,36px)]">
          <PublicSupportForm initialTopic={topic} />
        </div>
      </section>
    </MarketingPageShell>
  )
}
