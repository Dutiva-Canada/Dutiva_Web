import { Link } from 'react-router-dom'
import { ArrowRight, Briefcase, ListOrdered, Radar } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { Seo } from '@/seo/Seo'
import { investorsMessages } from '@/i18n/messages/investors'
import { LangScope } from '@/i18n/LangScope'
import { MarketingPageShell, PageCta, PageHero, PageSection } from './MarketingPage'

/**
 * /investors (EN) · /fr/investisseurs (FR) — the public door to the
 * invite-only /invest portal. Describes the surface, states the access
 * model plainly, and links to the portal sign-in. Hedged by design:
 * informational tooling, never advice.
 */
const SCOPE = investorsMessages

export function InvestorsPage() {
  return (
    <LangScope messages={SCOPE}>
      <InvestorsPageInner />
    </LangScope>
  )
}

function InvestorsPageInner() {
  const { t } = useI18n()

  const features = [
    { icon: Briefcase, title: t('investors_f1_t'), body: t('investors_f1_b') },
    { icon: Radar, title: t('investors_f2_t'), body: t('investors_f2_b') },
    { icon: ListOrdered, title: t('investors_f3_t'), body: t('investors_f3_b') },
  ]

  return (
    <MarketingPageShell>
      <Seo route="investors" />
      <PageHero
        eyebrow={t('investors_eyebrow')}
        title={t('investors_h1')}
        intro={t('investors_intro')}
      />

      <section className="mx-auto max-w-[960px] px-4 py-8 sm:px-6">
        <div className="grid gap-4 min-[720px]:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="premium-card-soft p-[22px]">
              <f.icon size={20} strokeWidth={1.8} className="text-gold-strong" aria-hidden="true" />
              <h2 className="mt-3 text-[1.0625rem] font-semibold text-text">{f.title}</h2>
              <p className="mt-2 text-sm leading-[1.65] text-text-2">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <PageSection title={t('investors_access_t')}>
        <div className="premium-card-soft p-[22px]">
          <p className="max-w-[68ch] text-[0.9375rem] leading-[1.65] text-text-2">
            {t('investors_access_b')}
          </p>
          <Link
            to="/invest"
            className="mt-3.5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-opacity hover:opacity-80"
          >
            {t('investors_cta_btn')}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
          <p className="mt-5 border-t border-border pt-4 text-xs leading-[1.55] text-text-3">
            {t('investors_disclaimer')}
          </p>
        </div>
      </PageSection>

      <PageCta
        title={t('investors_cta_t')}
        body={t('investors_cta_p')}
        action={t('investors_cta_btn')}
        to="/invest"
      />
    </MarketingPageShell>
  )
}
