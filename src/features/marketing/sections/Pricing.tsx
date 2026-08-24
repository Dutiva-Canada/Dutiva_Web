import { Check, ChevronRight } from 'lucide-react'
import { SectionIntro } from '../SectionIntro'
import { usePublicPath } from '@/seo/usePublicPath'
import { PAID_PLANS_DISABLED_DURING_BETA } from '@/config/plans'
import { useLanding } from '../useLanding'
import type { LandingMessageKey } from '../useLanding'

interface Plan {
  name: LandingMessageKey
  /** Monthly price in CAD; null renders the localized "Free" amount. */
  price: string | null
  desc: LandingMessageKey
  features: LandingMessageKey[]
  cta: LandingMessageKey
  /** Growth is the highlighted "most popular" plan. */
  popular?: boolean
}

/** Mirrors config/plans.ts's `isPurchasable` — this teaser hand-copies the
 *  plan catalogue rather than importing it (see the PLANS comment there), so
 *  the beta gate is re-derived from the same price === null / flag rule
 *  rather than duplicated as a second source of truth. The link itself stays
 *  clickable either way — it only ever scrolls to the beta-signup form, so
 *  disabling it would remove exactly the interest-capture the beta wants. */
function isPurchasable(plan: Plan): boolean {
  return plan.price === null || !PAID_PLANS_DISABLED_DURING_BETA
}

const PLANS: Plan[] = [
  {
    name: 'landing_free_name',
    price: null,
    desc: 'landing_free_desc',
    features: ['landing_free_f1', 'landing_free_f2', 'landing_free_f3'],
    cta: 'landing_free_cta',
  },
  {
    name: 'landing_starter_name',
    price: '$24',
    desc: 'landing_starter_desc',
    features: ['landing_starter_f1', 'landing_starter_f2', 'landing_starter_f3'],
    cta: 'landing_starter_cta',
  },
  {
    name: 'landing_growth_name',
    price: '$49',
    desc: 'landing_growth_desc',
    features: ['landing_growth_f1', 'landing_growth_f2', 'landing_growth_f3'],
    cta: 'landing_growth_cta',
    popular: true,
  },
  {
    name: 'landing_pro_name',
    price: '$99',
    desc: 'landing_pro_desc',
    features: ['landing_pro_f1', 'landing_pro_f2', 'landing_pro_f3'],
    cta: 'landing_pro_cta',
  },
]

export function Pricing() {
  /* pricing_beta_only_badge / pricing_cta_beta_only live in the global
     pricingMessages catalogue (shared with the standalone /pricing page),
     not the landing-only module `lt` resolves against — pulled from `t`
     instead, which useLanding() already exposes via its useI18n() spread. */
  const { lt, t } = useLanding()
  const { p } = usePublicPath()
  return (
    <section id="pricing" className="mx-auto max-w-[1200px] scroll-mt-[80px] px-6 py-16">
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
      <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-4">
        {PLANS.map((plan) => {
          const purchasable = isPurchasable(plan)
          return (
            <div
              key={plan.name}
              className={[
                plan.popular
                  ? 'flex flex-col rounded-[14px] border border-gold-border bg-bg-soft p-6 shadow-[0_0_0_1px_rgba(var(--dutiva-gold-rgb),0.12)]'
                  : 'flex flex-col rounded-[14px] border border-border bg-bg-elevated p-6',
                purchasable ? '' : 'opacity-60',
              ].join(' ')}
            >
              {!purchasable ? (
                <div className="flex min-h-7 items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-text">{lt(plan.name)}</span>
                  <span className="rounded-full border border-border bg-bg px-2.5 py-0.5 text-[0.6875rem] font-semibold text-text-3">
                    {t('pricing_beta_only_badge')}
                  </span>
                </div>
              ) : plan.popular ? (
                <div className="flex min-h-7 items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-text">{lt(plan.name)}</span>
                  <span className="rounded-full border border-gold-border bg-gold-subtle px-2.5 py-0.5 text-[0.6875rem] font-semibold text-gold-strong">
                    {lt('landing_growth_popular')}
                  </span>
                </div>
              ) : (
                <div className="min-h-7 text-sm font-semibold text-text">{lt(plan.name)}</div>
              )}
              <div
                className={`my-1 font-display text-[1.875rem] font-semibold tracking-[-0.02em] ${
                  plan.popular ? 'text-gold-strong' : 'text-text'
                }`}
              >
                {plan.price ?? lt('landing_free_amt')}
                {plan.price !== null && (
                  <span className="text-base font-normal text-text-3">{lt('landing_mo')}</span>
                )}
              </div>
              <p className="mb-5 text-sm text-text-2">{lt(plan.desc)}</p>
              <ul className="m-0 mb-6 grid flex-1 list-none gap-2 p-0">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm text-text-2">
                    <Check size={15} className="mt-0.5 flex-none text-gold-strong" />
                    {lt(feature)}
                  </li>
                ))}
              </ul>
              <a
                href="#start"
                className={`${plan.popular ? 'gold-button' : 'ghost-button'} w-full`}
              >
                {purchasable ? lt(plan.cta) : t('pricing_cta_beta_only')}
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
