import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  Ban,
  Check,
  CircleCheck,
  Lock,
  Minus,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { useAuth } from '@/features/app/auth/authContext'
import { usePlan } from '@/features/app/billing/planContext'
import { setPendingCheckout, takePendingCheckout } from '@/features/app/billing/pendingCheckout'
import { supabase } from '@/lib/supabaseClient'
import {
  ANNUAL_BILLING_AVAILABLE,
  PAID_PLANS_DISABLED_DURING_BETA,
  PLAN_FEATURE_GATES_ENABLED,
  PLANS,
  annualPerMonth,
  annualTotal,
  getPlanById,
  isPurchasable,
  planDescKey,
  planFeatureKeys,
} from '@/config/plans'
import type { BillingPeriod, PlanDefinition } from '@/config/plans'
import { PLAN_COMPARISON } from '@/config/planComparison'
import type { ComparisonCell } from '@/config/planComparison'
import type { MarketingMessageKey } from '@/i18n/messages'
import { Seo } from '@/seo/Seo'
import { usePublicPath } from '@/seo/usePublicPath'
import { webApplicationNode } from '@/seo/jsonld'
import { MarketingPageShell, PageCta, PageHero, PageSection } from './MarketingPage'
import { ReviewTrustSignals } from '../ReviewTrustSignals'
import { TestimonialWall } from '../sections/TestimonialWall'

/** Full-width band with no heading — for the admin-bypass banner and checkout notice. */
function Band({ children }: { readonly children: ReactNode }) {
  return <section className="mx-auto max-w-[960px] px-6 py-2">{children}</section>
}

interface CheckoutResponse {
  url?: string
  bypass?: boolean
  message?: string
  error?: string
}

/** Segmented Monthly / Annual control; the annual segment advertises the saving. */
function BillingToggle({
  period,
  onChange,
}: {
  readonly period: BillingPeriod
  readonly onChange: (next: BillingPeriod) => void
}) {
  const { t } = useI18n()
  const seg = (active: boolean) =>
    'inline-flex cursor-pointer items-center gap-2 rounded-full border-0 px-4 py-2 text-sm font-semibold transition-colors ' +
    (active ? 'bg-bg-elevated text-text shadow-sm' : 'bg-transparent text-text-3 hover:text-text-2')
  return (
    <div className="flex justify-center">
      <div
        role="group"
        aria-label={t('pricing_eyebrow')}
        className="inline-flex items-center gap-1 rounded-full border border-border bg-bg-soft p-1"
      >
        <button
          type="button"
          aria-pressed={period === 'monthly'}
          onClick={() => onChange('monthly')}
          className={seg(period === 'monthly')}
        >
          {t('pricing_billing_monthly')}
        </button>
        <button
          type="button"
          aria-pressed={period === 'annual'}
          onClick={() => onChange('annual')}
          className={seg(period === 'annual')}
        >
          {t('pricing_billing_annual')}
          <span className="rounded-full bg-gold-subtle px-2 py-0.5 text-[0.625rem] font-semibold tracking-wide text-gold-strong">
            {t('pricing_billing_save')}
          </span>
        </button>
      </div>
    </div>
  )
}

function PriceCard({
  plan,
  period,
  onCheckout,
  onPrepareSignIn,
  waitlistHref,
  signInHref,
  isLoading,
  signedIn,
}: {
  readonly plan: PlanDefinition
  readonly period: BillingPeriod
  readonly onCheckout: (plan: PlanDefinition) => void
  /** Paid, signed-out: remember the plan before the sign-in link is followed. */
  readonly onPrepareSignIn: (plan: PlanDefinition) => void
  readonly waitlistHref: string
  readonly signInHref: string
  readonly isLoading: boolean
  /** Paid plans read "Sign in to continue" instead of their own CTA when
   *  signed out — the click lands on the sign-in gate either way, and the
   *  plan's own wording ("Start Growth") otherwise reads like it starts
   *  checkout directly. */
  readonly signedIn: boolean
}) {
  const { t } = useI18n()
  const hasPrice = plan.monthlyPrice > 0
  const perMonth = period === 'annual' ? annualPerMonth(plan.monthlyPrice) : plan.monthlyPrice
  const purchasable = isPurchasable(plan)
  const ctaLabel = !purchasable
    ? t('pricing_cta_beta_only')
    : hasPrice && !signedIn
      ? t('pricing_cta_signin_first')
      : t(plan.ctaKey)
  const accessibleName = `${ctaLabel} — ${t(plan.nameKey)}`
  const ctaClass = [
    'mt-8 inline-flex w-full items-center justify-center gap-2 px-4 py-3 text-sm',
    plan.popular ? 'gold-button' : 'ghost-button',
    isLoading || !purchasable ? 'cursor-not-allowed opacity-60' : '',
  ].join(' ')
  const ctaInner = (
    <>
      {isLoading ? t('pricing_cta_processing') : ctaLabel}
      {purchasable ? <ArrowRight size={16} className="shrink-0" /> : null}
    </>
  )

  return (
    <div
      className={[
        plan.popular
          ? 'relative flex h-full flex-col rounded-2xl border border-gold-border bg-bg-soft p-6 shadow-[0_0_0_1px_rgba(var(--dutiva-gold-rgb),0.12)]'
          : 'relative flex h-full flex-col rounded-2xl border border-border bg-bg-elevated p-6',
        purchasable ? '' : 'opacity-60',
      ].join(' ')}
    >
      {!purchasable ? (
        <div className="absolute left-6 top-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-elevated px-2.5 py-0.5 text-[0.6875rem] font-semibold text-text-3">
          {t('pricing_beta_only_badge')}
        </div>
      ) : plan.popular ? (
        <div className="absolute left-6 top-3 inline-flex items-center gap-1.5 rounded-full border border-gold-border bg-gold-subtle px-2.5 py-0.5 text-[0.6875rem] font-semibold text-gold-strong">
          <Sparkles size={12} />
          {t('landing_growth_popular')}
        </div>
      ) : null}

      <div className="mt-4 text-lg font-semibold text-text">{t(plan.nameKey)}</div>
      <p className="mt-2 text-sm leading-6 text-text-2">{t(planDescKey(plan))}</p>
      {plan.noteKey ? (
        <p className="mt-2 text-xs leading-5 text-text-3">{t(plan.noteKey)}</p>
      ) : null}

      <div className="mt-6 flex items-end gap-2">
        <div
          className={`font-display text-4xl font-semibold tracking-[-0.02em] ${
            plan.popular ? 'text-gold-strong' : 'text-text'
          }`}
        >
          {hasPrice ? `$${perMonth}` : t('landing_free_amt')}
        </div>
        {hasPrice ? <div className="pb-1 text-sm text-text-2">CAD{t('pricing_mo')}</div> : null}
      </div>
      {/* Reserve the line in both periods so card heights stay aligned. */}
      <p className="mt-1 min-h-[1.125rem] text-xs text-text-3">
        {hasPrice && period === 'annual'
          ? `$${annualTotal(plan.monthlyPrice)} ${t('pricing_billed_yearly')}`
          : ''}
      </p>

      <ul className="m-0 mt-5 flex-1 list-none space-y-3 p-0">
        {planFeatureKeys(plan).map((key) => (
          <li key={key} className="flex items-start gap-3 text-sm text-text-2">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold-subtle text-gold-strong">
              <Check size={13} />
            </span>
            {t(key)}
          </li>
        ))}
      </ul>

      {!purchasable ? (
        <button type="button" disabled className={ctaClass} aria-label={accessibleName}>
          {ctaInner}
        </button>
      ) : plan.id === 'free' ? (
        <a href={waitlistHref} className={ctaClass} aria-label={accessibleName}>
          {ctaInner}
        </a>
      ) : !signedIn ? (
        <a
          href={signInHref}
          className={ctaClass}
          aria-label={accessibleName}
          onClick={() => onPrepareSignIn(plan)}
        >
          {ctaInner}
        </a>
      ) : (
        <button
          type="button"
          onClick={() => onCheckout(plan)}
          disabled={isLoading}
          className={ctaClass}
          aria-label={accessibleName}
        >
          {ctaInner}
        </button>
      )}
    </div>
  )
}

const TRUST_ITEMS = [
  { icon: Lock, key: 'pricing_trust_stripe' },
  { icon: Wallet, key: 'pricing_trust_nosetup' },
  { icon: Ban, key: 'pricing_trust_cancel' },
  { icon: ShieldCheck, key: 'pricing_trust_privacy' },
] as const

function TrustBand() {
  const { t } = useI18n()
  return (
    <div className="mx-auto max-w-[960px] px-6">
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 rounded-2xl border border-border bg-bg-elevated px-6 py-4">
        {TRUST_ITEMS.map(({ icon: Icon, key }) => (
          <span key={key} className="inline-flex items-center gap-2 text-sm text-text-2">
            <Icon size={16} className="shrink-0 text-gold-strong" aria-hidden="true" />
            {t(key)}
          </span>
        ))}
      </div>
    </div>
  )
}

function CellView({ cell }: { readonly cell: ComparisonCell }) {
  const { t } = useI18n()
  if (cell === true) {
    return (
      <>
        <Check size={16} className="text-gold-strong" aria-hidden="true" />
        <span className="sr-only">{t('pricing_included')}</span>
      </>
    )
  }
  if (cell === false) {
    return (
      <>
        <Minus size={16} className="text-text-3" aria-hidden="true" />
        <span className="sr-only">{t('pricing_not_included')}</span>
      </>
    )
  }
  return <span className="text-text-2">{t(cell)}</span>
}

function ComparisonTable({ priceFor }: { readonly priceFor: (plan: PlanDefinition) => string }) {
  const { t } = useI18n()
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <caption className="sr-only">{t('pricing_compare_title')}</caption>
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className="px-5 py-4 text-sm font-semibold text-text-3">
              {t('pricing_feature_col')}
            </th>
            {PLANS.map((plan) => (
              <th
                key={plan.id}
                scope="col"
                className={`px-4 py-4 text-center ${plan.popular ? 'bg-gold-subtle' : ''}`}
              >
                <div
                  className={`text-sm font-semibold ${plan.popular ? 'text-gold-strong' : 'text-text'}`}
                >
                  {t(plan.nameKey)}
                </div>
                <div className="mt-0.5 text-xs font-normal text-text-3">{priceFor(plan)}</div>
              </th>
            ))}
          </tr>
        </thead>
        {/* One <tbody> per feature group; the heading spans the row group it
            introduces (scope="rowgroup") so screen readers associate it with
            the rows below, not the columns. */}
        {PLAN_COMPARISON.map((group) => (
          <tbody key={group.headingKey}>
            <tr className="bg-bg-soft">
              <th
                scope="rowgroup"
                colSpan={1 + PLANS.length}
                className="px-5 py-2.5 text-left text-xs font-semibold tracking-wider text-gold-strong uppercase"
              >
                {t(group.headingKey)}
              </th>
            </tr>
            {group.rows.map((row) => (
              <tr key={row.labelKey} className="border-t border-border">
                <th scope="row" className="px-5 py-3 text-left text-sm font-normal text-text-2">
                  {t(row.labelKey)}
                </th>
                {PLANS.map((plan) => (
                  <td
                    key={plan.id}
                    className={`px-4 py-3 text-center text-sm ${plan.popular ? 'bg-gold-subtle' : ''}`}
                  >
                    <span className="inline-flex items-center justify-center">
                      <CellView cell={row.cells[plan.id]} />
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  )
}

const FAQ_ITEMS: { q: MarketingMessageKey; a: MarketingMessageKey }[] = [
  { q: 'pricing_faq_legal_q', a: 'pricing_faq_legal_a' },
  { q: 'pricing_faq_jur_q', a: 'pricing_faq_jur_a' },
  { q: 'pricing_faq_billing_q', a: 'pricing_faq_billing_a' },
  { q: 'pricing_faq_annual_q', a: 'pricing_faq_annual_a' },
  { q: 'pricing_faq_switch_q', a: 'pricing_faq_switch_a' },
  { q: 'pricing_faq_refund_q', a: 'pricing_faq_refund_a' },
  { q: 'pricing_faq_multiclient_q', a: 'pricing_faq_multiclient_a' },
  {
    q: 'pricing_faq_packs_q',
    a: PLAN_FEATURE_GATES_ENABLED ? 'pricing_faq_packs_a_entitled' : 'pricing_faq_packs_a',
  },
]

const ENTITLED_FOOTNOTES: MarketingMessageKey[] = [
  'pricing_fn_active_employees',
  'pricing_fn_rollover',
  'pricing_fn_documents',
  'pricing_fn_signatures',
  'pricing_fn_initial_reply',
  'pricing_fn_review_before_use',
]

/**
 * /pricing — the full plan comparison page the landing page's Pricing section
 * and the header nav link to. Monthly/annual toggle drives the displayed
 * price and is carried into checkout; the feature table sits below the cards.
 * Checkout goes through the `create-checkout-session` Supabase function; an
 * internal Dutiva account bypasses it (adminAccess.ts) without a public banner.
 */
export function PricingPage() {
  const { t, lang } = useI18n()
  const { p, home } = usePublicPath()
  const { status } = useAuth()
  const { isAdmin, plan: currentPlan, stripeCustomerId } = usePlan()
  const [period, setPeriod] = useState<BillingPeriod>('monthly')
  /* Annual prices are not in Stripe yet. Hide the toggle independently of
     whether monthly checkout is open, so we never quote a yearly total
     nobody can buy. */
  const effectivePeriod: BillingPeriod = ANNUAL_BILLING_AVAILABLE ? period : 'monthly'
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [notice, setNotice] = useState<{
    tone: 'success' | 'error'
    text: string
    planId?: string | null
  } | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const noticeRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!notice) return
    noticeRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
  }, [notice])

  /* create-checkout-session's success_url/cancel_url land back here with
     ?checkout=success|cancelled (see supabase/functions/create-checkout-session).
     Show the matching notice once, then strip the param so a page refresh
     doesn't re-show it. The webhook that actually grants the plan runs async
     on Stripe's side, so "success" here means "checkout completed", not yet
     "plan visible below" — the copy says so rather than implying it's instant. */
  useEffect(() => {
    const checkout = searchParams.get('checkout')
    if (checkout !== 'success' && checkout !== 'cancelled') return

    setNotice({
      tone: checkout === 'success' ? 'success' : 'error',
      text: t(
        checkout === 'success'
          ? 'pricing_checkout_return_success'
          : 'pricing_checkout_return_cancelled',
      ),
      planId: checkout === 'success' ? searchParams.get('plan') : null,
    })

    const next = new URLSearchParams(searchParams)
    next.delete('checkout')
    next.delete('plan')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, t])

  const resumeCheckout = useRef(false)

  /* After magic-link from a paid CTA, finish checkout instead of leaving
     the visitor on the waitlist screen. */
  useEffect(() => {
    if (resumeCheckout.current) return
    if (status !== 'signed-in') return
    if (PAID_PLANS_DISABLED_DURING_BETA) return
    const planId = takePendingCheckout()
    const pending = getPlanById(planId)
    if (!pending || !isPurchasable(pending) || pending.monthlyPrice === 0) return
    resumeCheckout.current = true
    void handleCheckout(pending)
    // handleCheckout is recreated each render; we only resume once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  async function handleCheckout(plan: PlanDefinition) {
    setNotice(null)

    if (plan.id === 'free') {
      window.location.href = home('start')
      return
    }

    if (status !== 'signed-in') {
      setPendingCheckout(plan.id)
      window.location.href = '/app/welcome'
      return
    }

    /* Annual checkout is now wired in code — create-checkout-session resolves
       STRIPE_PRICE_*_ANNUAL, the webhook's price lookup knows the annual ids,
       and migration 0043 widens profiles.billing_period to accept 'annual'.
       What is still missing is outside this repo: the annual Price objects do
       not exist in Stripe and the env vars are unset (TODO.md OA11), and
       migration 0043 is unapplied. The function fails closed with a 503 in that
       state, so this guard is what turns that into an intelligible notice
       instead of a failed request. Remove it once OA11 is done — not before. */
    if (effectivePeriod === 'annual') {
      setNotice({ tone: 'error', text: t('pricing_annual_soon') })
      return
    }

    if (!supabase) {
      setNotice({ tone: 'error', text: t('pricing_checkout_unavailable') })
      return
    }

    setCheckoutPlanId(plan.id)
    try {
      /* Carry the chosen period so the backend can pick the matching Stripe
         price. Annual price ids still need wiring in the edge function before
         annual checkout settles (see ANNUAL_MONTHS_BILLED in config/plans). */
      const { data, error } = await supabase.functions.invoke<CheckoutResponse>(
        'create-checkout-session',
        { body: { plan: plan.id, billingPeriod: effectivePeriod } },
      )
      if (error) throw error

      if (data?.bypass) {
        setNotice({ tone: 'success', text: data.message ?? t('pricing_checkout_bypassed') })
        return
      }
      if (data?.url) {
        window.location.href = data.url
        return
      }
      throw new Error(data?.error ?? 'Checkout session missing url')
    } catch {
      setNotice({ tone: 'error', text: t('pricing_checkout_error') })
    } finally {
      setCheckoutPlanId(null)
    }
  }

  async function handleManageBilling() {
    setNotice(null)
    if (!supabase) {
      setNotice({ tone: 'error', text: t('pricing_checkout_unavailable') })
      return
    }
    setPortalLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke<CheckoutResponse>(
        'create-portal-session',
        { body: {} },
      )
      if (error) throw error
      if (data?.url) {
        window.location.href = data.url
        return
      }
      throw new Error(data?.error ?? 'Portal session missing url')
    } catch {
      setNotice({ tone: 'error', text: t('pricing_portal_error') })
    } finally {
      setPortalLoading(false)
    }
  }

  const priceFor = (plan: PlanDefinition): string => {
    if (plan.monthlyPrice === 0) return t('landing_free_amt')
    const perMonth =
      effectivePeriod === 'annual' ? annualPerMonth(plan.monthlyPrice) : plan.monthlyPrice
    return `$${perMonth}${t('pricing_mo')}`
  }

  /* Offer nodes mirror the plan cards (same PLANS catalogue, monthly CAD
     prices) — schema pricing can never drift from the page. */
  const offers = PLANS.map((plan) => ({ name: t(plan.nameKey), priceCad: plan.monthlyPrice }))
  return (
    <MarketingPageShell>
      <Seo route="pricing" extraNodes={[webApplicationNode(lang, offers)]} />
      <PageHero eyebrow={t('pricing_eyebrow')} title={t('pricing_h1')} intro={t('pricing_intro')} />

      {notice ? (
        <Band>
          <div ref={noticeRef}>
            {notice.tone === 'success' && notice.planId ? (
              <div
                role="status"
                className="premium-card-soft flex flex-wrap items-center gap-4 border-gold-border p-5"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-subtle text-gold-strong">
                  <CircleCheck size={18} />
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text">
                      {t('pricing_checkout_return_success_heading')}
                    </span>
                    {getPlanById(notice.planId) && (
                      <span className="badge">{t(getPlanById(notice.planId)!.nameKey)}</span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm leading-6 text-text-2">{notice.text}</p>
                </div>
                <Link
                  to="/app/welcome"
                  className="gold-button inline-flex items-center gap-2 px-5 py-3 text-sm"
                >
                  {t('pricing_checkout_return_go')}
                  <ArrowRight size={16} className="shrink-0" />
                </Link>
              </div>
            ) : (
              <div
                role={notice.tone === 'error' ? 'alert' : 'status'}
                className={
                  notice.tone === 'success'
                    ? 'rounded-xl border border-gold-border bg-gold-subtle px-4 py-3 text-sm text-gold-strong'
                    : 'rounded-xl border border-risk-border bg-risk-bg px-4 py-3 text-sm text-risk-fg'
                }
              >
                {notice.text}
              </div>
            )}
          </div>
        </Band>
      ) : null}

      {!isAdmin && stripeCustomerId ? (
        <PageSection title={t('pricing_current_plan')}>
          <div className="flex flex-wrap items-center gap-4">
            <span className="badge">
              {t(getPlanById(currentPlan)?.nameKey ?? 'landing_free_name')}
            </span>
            <button
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="ghost-button inline-flex items-center gap-2 px-5 py-3 text-sm"
            >
              {portalLoading ? t('pricing_cta_processing') : t('pricing_manage_billing')}
            </button>
          </div>
        </PageSection>
      ) : null}

      {PAID_PLANS_DISABLED_DURING_BETA ? (
        <Band>
          <div className="premium-card-soft flex flex-wrap items-center gap-4 border-gold-border p-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-subtle text-gold-strong">
              <Sparkles size={18} />
            </span>
            <p className="text-sm leading-6 text-text-2">{t('pricing_beta_banner')}</p>
          </div>
        </Band>
      ) : null}

      {/* ── Plans (billing toggle + cards) ─────────────────────────────────── */}
      <section className="mx-auto max-w-[1200px] px-6 pt-4 pb-2">
        {!ANNUAL_BILLING_AVAILABLE ? null : (
          <BillingToggle period={effectivePeriod} onChange={setPeriod} />
        )}
        <div className="mt-8 grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <PriceCard
              key={plan.id}
              plan={plan}
              period={effectivePeriod}
              onCheckout={handleCheckout}
              onPrepareSignIn={(next) => setPendingCheckout(next.id)}
              waitlistHref={home('start')}
              signInHref="/app/welcome"
              isLoading={checkoutPlanId === plan.id}
              signedIn={status === 'signed-in'}
            />
          ))}
        </div>
      </section>

      <div className="pt-8">
        <TrustBand />
      </div>

      <div className="mx-auto max-w-[1200px] px-6 pt-6">
        <ReviewTrustSignals />
      </div>

      {/* ── Full feature comparison ────────────────────────────────────────── */}
      <PageSection title={t('pricing_compare_title')}>
        <p className="-mt-3 mb-6 max-w-[62ch] text-sm leading-6 text-text-2">
          {t('pricing_compare_sub')}
        </p>
        <ComparisonTable priceFor={priceFor} />
        <p className="mt-4 max-w-[68ch] text-xs leading-5 text-text-3">
          {t(PLAN_FEATURE_GATES_ENABLED ? 'pricing_compare_note_entitled' : 'pricing_compare_note')}
        </p>
        {PLAN_FEATURE_GATES_ENABLED ? (
          <ul className="mt-3 max-w-[68ch] list-disc space-y-2 pl-5 text-xs leading-5 text-text-3">
            {ENTITLED_FOOTNOTES.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
        ) : null}
      </PageSection>

      <TestimonialWall />

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <PageSection title={t('pricing_faq_title')}>
        <div className="grid gap-4 md:grid-cols-2">
          {FAQ_ITEMS.map((item) => (
            <div key={item.q} className="premium-card-soft p-5">
              <div className="text-sm font-semibold text-text">{t(item.q)}</div>
              <p className="mt-2 text-sm leading-6 text-text-2">{t(item.a)}</p>
            </div>
          ))}
        </div>
      </PageSection>

      <PageCta
        title={t('pricing_cta_title')}
        body={t('pricing_cta_body')}
        action={t('landing_free_cta')}
        href={home('start')}
      />
      {/* A pricing question is a sales enquiry, so it goes to the ticketed
          intake pre-set to that topic rather than a raw mailto — the sender
          gets a reference and the request lands in the queue instead of an
          inbox. `?topic=` is the deep link ContactPage already understands. */}
      <div className="mx-auto -mt-12 mb-16 flex max-w-[1200px] justify-center px-6">
        <Link
          to={`${p('contact')}?topic=sales`}
          className="text-sm font-semibold text-text-2 transition-opacity hover:opacity-80"
        >
          {t('pricing_cta_ask')}
        </Link>
      </div>
    </MarketingPageShell>
  )
}
