import type { SharedMessageKey } from '@/i18n/messages'

export type PlanId = 'free' | 'starter' | 'growth' | 'pro'

/** Free waitlist seats receive product access for this many months once admitted. */
export const FREE_PLAN_ACCESS_MONTHS = 3

export interface PlanDefinition {
  id: PlanId
  /** Monthly price in CAD; 0 for the free plan. */
  monthlyPrice: number
  nameKey: SharedMessageKey
  descKey: SharedMessageKey
  noteKey?: SharedMessageKey
  featureKeys: SharedMessageKey[]
  ctaKey: SharedMessageKey
  popular?: boolean
  /**
   * Env var name the `create-checkout-session` Supabase function reads the
   * Stripe price id from (see supabase/functions/create-checkout-session).
   * `null` for the free plan, which never goes through Stripe checkout.
   */
  stripePriceEnvVar: string | null
}

/**
 * Canonical plan catalogue — same four tiers already shown on the landing
 * page's Pricing section (src/features/marketing/sections/Pricing.tsx).
 * Reuses that section's `landing_*` i18n keys so the standalone /pricing
 * page and the landing teaser can never drift out of copy sync.
 */
export const PLANS: PlanDefinition[] = [
  {
    id: 'free',
    monthlyPrice: 0,
    nameKey: 'landing_free_name',
    descKey: 'landing_free_desc',
    noteKey: 'landing_free_note',
    featureKeys: ['landing_free_f1', 'landing_free_f2', 'landing_free_f3'],
    ctaKey: 'landing_free_cta',
    stripePriceEnvVar: null,
  },
  {
    id: 'starter',
    monthlyPrice: 24,
    nameKey: 'landing_starter_name',
    descKey: 'landing_starter_desc',
    featureKeys: ['landing_starter_f1', 'landing_starter_f2', 'landing_starter_f3'],
    ctaKey: 'landing_starter_cta',
    stripePriceEnvVar: 'STRIPE_PRICE_STARTER_MONTHLY',
  },
  {
    id: 'growth',
    monthlyPrice: 49,
    nameKey: 'landing_growth_name',
    descKey: 'landing_growth_desc',
    featureKeys: ['landing_growth_f1', 'landing_growth_f2', 'landing_growth_f3'],
    ctaKey: 'landing_growth_cta',
    popular: true,
    stripePriceEnvVar: 'STRIPE_PRICE_GROWTH_MONTHLY',
  },
  {
    id: 'pro',
    monthlyPrice: 99,
    nameKey: 'landing_pro_name',
    descKey: 'landing_pro_desc',
    featureKeys: ['landing_pro_f1', 'landing_pro_f2', 'landing_pro_f3'],
    ctaKey: 'landing_pro_cta',
    stripePriceEnvVar: 'STRIPE_PRICE_PRO_MONTHLY',
  },
]

export function getPlanById(id?: string | null): PlanDefinition | undefined {
  return PLANS.find((plan) => plan.id === id)
}

/**
 * True while checkout is held closed. Currently `false`: monthly paid plans
 * are the public path in (support membership). The 15-person free cohort
 * stays a waitlist. Flip back only if checkout must be taken down.
 */
export const PAID_PLANS_DISABLED_DURING_BETA = false

/**
 * When false, PlanGate does not block product features — every admitted
 * account (waitlist cohort and paid) gets the full product. Paying buys
 * support, not extra modules. Flip to `true` only when per-plan limits are
 * actually enforced and advertised.
 */
export const PLAN_FEATURE_GATES_ENABLED = false

/**
 * Annual Stripe prices are not live yet. Keep the /pricing annual toggle
 * hidden independently of checkout, so we never quote a yearly total nobody
 * can buy. Flip after STRIPE_PRICE_*_ANNUAL secrets exist and annual is ready
 * to sell (EF4a; OA11 closed 2026-08-27).
 */
export const ANNUAL_BILLING_AVAILABLE = false

/** False for a paid plan while `PAID_PLANS_DISABLED_DURING_BETA` is set; the free plan is always "purchasable" (it joins the waitlist). */
export function isPurchasable(plan: PlanDefinition): boolean {
  return plan.monthlyPrice === 0 || !PAID_PLANS_DISABLED_DURING_BETA
}

export type BillingPeriod = 'monthly' | 'annual'

/**
 * Annual billing charges for 10 of 12 months (two months free) — a plain,
 * adjustable convention. NOTE: the create-checkout-session Supabase function
 * still needs the annual Stripe price ids wired before annual checkout can
 * settle; until then the toggle drives the displayed price and the checkout
 * call carries the chosen period for the backend to honour.
 */
export const ANNUAL_MONTHS_BILLED = 10

/** Effective per-month price when billed annually, rounded to the dollar (CAD). */
export function annualPerMonth(monthlyPrice: number): number {
  return Math.round((monthlyPrice * ANNUAL_MONTHS_BILLED) / 12)
}

/**
 * Total charged once per year on the annual plan (CAD). Derived from the
 * rounded per-month figure (× 12) so the displayed "$X/mo" and "billed $Y/yr"
 * always reconcile exactly rather than drifting by a dollar after rounding.
 */
export function annualTotal(monthlyPrice: number): number {
  return annualPerMonth(monthlyPrice) * 12
}

const PLAN_RANK: Record<PlanId, number> = { free: 0, starter: 1, growth: 2, pro: 3 }

export function normalizePlanId(value?: string | null): PlanId {
  const normalized = String(value ?? '').toLowerCase()
  return normalized === 'starter' || normalized === 'growth' || normalized === 'pro'
    ? normalized
    : 'free'
}

/** True if `currentPlan` meets or exceeds `requiredPlan` in the plan hierarchy. */
export function hasPlanAccess(currentPlan: PlanId, requiredPlan: PlanId): boolean {
  return PLAN_RANK[currentPlan] >= PLAN_RANK[requiredPlan]
}

/** Stripe subscription statuses that keep paid entitlements active. */
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing'])

/** True when a paid profile row should receive gated features. */
export function hasActiveSubscription(subscriptionStatus: string): boolean {
  return ACTIVE_SUBSCRIPTION_STATUSES.has(subscriptionStatus)
}

/** Plan tier plus an active subscription — used by PlanGate in production mode. */
export function hasPaidPlanAccess(
  currentPlan: PlanId,
  requiredPlan: PlanId,
  subscriptionStatus: string,
): boolean {
  return hasPlanAccess(currentPlan, requiredPlan) && hasActiveSubscription(subscriptionStatus)
}
