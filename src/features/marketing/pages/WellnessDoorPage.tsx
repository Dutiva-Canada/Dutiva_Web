import { Link } from 'react-router-dom'
import { ArrowRight, HeartPulse, NotebookPen, TrendingUp } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { Seo } from '@/seo/Seo'
import { wellnessDoorMessages } from '@/i18n/messages/wellnessDoor'
import { LangScope } from '@/i18n/LangScope'
import { MarketingPageShell, PageCta, PageHero, PageSection } from './MarketingPage'

/**
 * /wellbeing (EN) · /fr/bien-etre (FR) — the public door to the invite-only
 * /wellness portal. Describes the surface, states the access model plainly,
 * and links to the portal sign-in. Hedged by design: non-clinical
 * self-tracking, never medical advice or a crisis service.
 */
const SCOPE = wellnessDoorMessages

export function WellnessDoorPage() {
  return (
    <LangScope messages={SCOPE}>
      <WellnessDoorPageInner />
    </LangScope>
  )
}

function WellnessDoorPageInner() {
  const { t } = useI18n()

  const features = [
    { icon: HeartPulse, title: t('wellness_door_f1_t'), body: t('wellness_door_f1_b') },
    { icon: NotebookPen, title: t('wellness_door_f2_t'), body: t('wellness_door_f2_b') },
    { icon: TrendingUp, title: t('wellness_door_f3_t'), body: t('wellness_door_f3_b') },
  ]

  return (
    <MarketingPageShell surface="portal">
      <Seo route="wellnessDoor" />
      <PageHero
        eyebrow={t('wellness_door_eyebrow')}
        title={t('wellness_door_h1')}
        intro={t('wellness_door_intro')}
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

      <PageSection title={t('wellness_door_access_t')}>
        <div className="premium-card-soft p-[22px]">
          <p className="max-w-[68ch] text-[0.9375rem] leading-[1.65] text-text-2">
            {t('wellness_door_access_b')}
          </p>
          <Link
            to="/wellness"
            className="mt-3.5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-opacity hover:opacity-80"
          >
            {t('wellness_door_cta_btn')}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
          <p className="mt-5 border-t border-border pt-4 text-xs leading-[1.55] text-text-3">
            {t('wellness_door_disclaimer')}
          </p>
        </div>
      </PageSection>

      <PageCta
        title={t('wellness_door_cta_t')}
        body={t('wellness_door_cta_p')}
        action={t('wellness_door_cta_btn')}
        to="/wellness"
      />
    </MarketingPageShell>
  )
}
