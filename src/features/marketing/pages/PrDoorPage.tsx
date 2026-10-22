import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, Megaphone, Newspaper } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { Seo } from '@/seo/Seo'
import { prDoorMessages } from '@/i18n/messages/prDoor'
import { LangScope } from '@/i18n/LangScope'
import { MarketingPageShell, PageCta, PageHero, PageSection } from './MarketingPage'

/**
 * /public-relations (EN) · /fr/relations-publiques (FR) — the public door to
 * the invite-only /pr portal. Describes the surface, states the access model
 * plainly, and links to the portal sign-in. Hedged by design: a planning and
 * tracking desk that never publishes on its own.
 */
const SCOPE = prDoorMessages

export function PrDoorPage() {
  return (
    <LangScope messages={SCOPE}>
      <PrDoorPageInner />
    </LangScope>
  )
}

function PrDoorPageInner() {
  const { t } = useI18n()

  const features = [
    { icon: Megaphone, title: t('pr_door_f1_t'), body: t('pr_door_f1_b') },
    { icon: Newspaper, title: t('pr_door_f2_t'), body: t('pr_door_f2_b') },
    { icon: BarChart3, title: t('pr_door_f3_t'), body: t('pr_door_f3_b') },
  ]

  return (
    <MarketingPageShell surface="portal">
      <Seo route="prDoor" />
      <PageHero eyebrow={t('pr_door_eyebrow')} title={t('pr_door_h1')} intro={t('pr_door_intro')} />

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

      <PageSection title={t('pr_door_access_t')}>
        <div className="premium-card-soft p-[22px]">
          <p className="max-w-[68ch] text-[0.9375rem] leading-[1.65] text-text-2">
            {t('pr_door_access_b')}
          </p>
          <Link
            to="/pr"
            className="mt-3.5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-opacity hover:opacity-80"
          >
            {t('pr_door_cta_btn')}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
          <p className="mt-5 border-t border-border pt-4 text-xs leading-[1.55] text-text-3">
            {t('pr_door_disclaimer')}
          </p>
        </div>
      </PageSection>

      <PageCta
        title={t('pr_door_cta_t')}
        body={t('pr_door_cta_p')}
        action={t('pr_door_cta_btn')}
        to="/pr"
      />
    </MarketingPageShell>
  )
}
