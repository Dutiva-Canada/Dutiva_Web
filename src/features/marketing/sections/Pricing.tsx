import { Check, ChevronRight } from 'lucide-react'
import { SectionIntro } from '../SectionIntro'
import { usePublicPath } from '@/seo/usePublicPath'
import {
  PAID_PLANS_DISABLED_DURING_BETA,
  PLANS,
  isPurchasable,
  planDescKey,
  planFeatureKeys,
} from '@/config/plans'
import { useLanding } from '../useLanding'

/**
 * Landing pricing teaser — prices and CTAs mirror `src/config/plans.ts`.
 * Feature bullets and descriptions switch with `PLAN_FEATURE_GATES_ENABLED`
 * via `planFeatureKeys` / `planDescKey` so quiet-beta copy stays truthful
 * while gates are off.
 */
export function Pricing() {
  /* pricing_beta_only_badge / pricing_cta_beta_only live in the global
     pricingMessages catalogue (shared with the standalone /pricing page),
     not the landing-only module `lt` resolves against — pulled from `t`
     instead, which useLanding() already exposes via its useI18n() spread. */
  const { lt, t } = useLanding()
  const { p } = usePublicPath()
  return (
    <section
      id="pricing"
      className="mx-auto max-w-[1200px] scroll-mt-[80px] px-4 py-12 sm:px-6 sm:py-16"
    >
      <SectionIntro
        badge={lt('landing_price_badge')}
        title={lt('landing_price_title')}
        sub={lt('landing_price_sub')}
      />
      {PAID_PLANS_DISABLED_DURING_BETA ? (
        <p className="mb-6 max-w-[68ch] rounded-xl border border-gold-border bg-gold-subtle px-4 py-3 text-sm leading-6 text-text-2">
          {t('pricing_beta_banner')}
        </p>
      ) : null}
      <div className="marketing-auto-grid marketing-auto-grid--230 gap-4">
        {PLANS.map((plan) => {
          const purchasable = isPurchasable(plan)
          const hasPrice = plan.monthlyPrice > 0
          return (
            <div
              key={plan.id}
              className={[
                plan.popular
                  ? 'flex flex-col rounded-[14px] border border-gold-border bg-bg-soft p-6 shadow-[0_0_0_1px_rgba(var(--dutiva-gold-rgb),0.12)]'
                  : 'flex flex-col rounded-[14px] border border-border bg-bg-elevated p-6',
                purchasable ? '' : 'opacity-60',
              ].join(' ')}
            >
              {!purchasable ? (
                <div className="flex min-h-7 items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-text">{t(plan.nameKey)}</span>
                  <span className="rounded-full border border-border bg-bg px-2.5 py-0.5 text-[0.6875rem] font-semibold text-text-3">
                    {t('pricing_beta_only_badge')}
                  </span>
                </div>
              ) : plan.popular ? (
                <div className="flex min-h-7 items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-text">{t(plan.nameKey)}</span>
                  <span className="rounded-full border border-gold-border bg-gold-subtle px-2.5 py-0.5 text-[0.6875rem] font-semibold text-gold-strong">
                    {lt('landing_growth_popular')}
                  </span>
                </div>
              ) : (
                <div className="min-h-7 text-sm font-semibold text-text">{t(plan.nameKey)}</div>
              )}
              <div
                className={`my-1 font-display text-[1.875rem] font-semibold tracking-[-0.02em] ${
                  plan.popular ? 'text-gold-strong' : 'text-text'
                }`}
              >
                {hasPrice ? `$${plan.monthlyPrice}` : lt('landing_free_amt')}
                {hasPrice ? (
                  <span className="text-base font-normal text-text-3">{lt('landing_mo')}</span>
                ) : null}
              </div>
              <p className="mb-5 text-sm text-text-2">{t(planDescKey(plan))}</p>
              {plan.noteKey ? (
                <p className="-mt-3 mb-5 text-xs leading-5 text-text-3">{t(plan.noteKey)}</p>
              ) : null}
              <ul className="m-0 mb-6 grid flex-1 list-none gap-2 p-0">
                {planFeatureKeys(plan).map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm text-text-2">
                    <Check size={15} className="mt-0.5 flex-none text-gold-strong" />
                    {t(feature)}
                  </li>
                ))}
              </ul>
              <a
                href={hasPrice ? p('pricing') : '#start'}
                className={`${plan.popular ? 'gold-button' : 'ghost-button'} w-full`}
              >
                {purchasable ? t(plan.ctaKey) : t('pricing_cta_beta_only')}
              </a>
            </div>
          )
        })}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-text-3">
        <span className="inline-flex items-center gap-1.5">
          <Check size={15} className="text-gold-strong" />
          {lt('landing_price_foot1')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Check size={15} className="text-gold-strong" />
          {lt('landing_price_foot2')}
        </span>
        <a
          href={p('pricing')}
          className="ml-auto inline-flex items-center gap-1 font-semibold text-gold-strong transition-opacity hover:opacity-80"
        >
          {lt('landing_price_compare')}
          <ChevronRight size={14} />
        </a>
      </div>
    </section>
  )
}
