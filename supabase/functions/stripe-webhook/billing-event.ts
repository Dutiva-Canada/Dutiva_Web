/**
 * Pure helpers for turning a Stripe checkout/subscription event payload into
 * a `public.profiles` patch (0089 workspace membership) and an optional
 * `apply_organization_billing` payload (org source of truth — 0107).
 * Adapted from the production dutiva-website repo's `billing-event.ts`,
 * narrowed to this repo's four plans (free/starter/growth/pro — see
 * src/config/plans.ts) instead of starter/growth/advanced/enterprise.
 */
/** Mirrors `BillingPeriod` in src/config/plans.ts (Deno cannot import src/). */
export type BillingPeriod = 'monthly' | 'annual'

export type ProfileUpdate = {
  subscription_status: string
  billing_period?: BillingPeriod
  stripe_subscription_id?: string | null
  stripe_customer_id?: string | null
  plan?: string
}

export type CheckoutProfilePatch = {
  userId: string | null
  email: string | null
  updates: ProfileUpdate
}

export type PriceLookup = Record<string, { plan: string; billingPeriod: BillingPeriod }>
export type PlanSignupNotificationPayload = {
  plan: string
  billing_period: BillingPeriod
  source: 'stripe_checkout'
}

/** Args for `apply_organization_billing` (plan vocabulary includes free). */
export type OrganizationBillingApply = {
  plan: string
  subscriptionStatus: string
  billingPeriod: BillingPeriod
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
  billingOwnerUserId?: string | null
}

const ALLOWED_PLANS = new Set(['starter', 'growth', 'pro'])
const ORG_PLANS = new Set(['free', 'starter', 'growth', 'pro'])
const ALLOWED_PERIODS = new Set<string>(['monthly', 'annual'])

export function stringId(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'string' && id.trim() ? id : null
  }
  return null
}

export function normalizePlan(value: unknown): string | null {
  const plan = String(value ?? '').toLowerCase()
  return ALLOWED_PLANS.has(plan) ? plan : null
}

export function normalizeBillingPeriod(value: unknown): BillingPeriod | null {
  const period = String(value ?? '').toLowerCase()
  return ALLOWED_PERIODS.has(period) ? (period as BillingPeriod) : null
}

/**
 * Stripe's subscription statuses are a wider set than `profiles`'
 * `subscription_status` check constraint accepts, so writing one through
 * verbatim (`incomplete`, `unpaid`, `paused`, …) fails the constraint and
 * loses the update. Map onto the accepted set instead, failing closed:
 * anything unrecognized becomes `inactive` rather than something that reads
 * as entitled.
 */
const STATUS_MAP: Record<string, string> = {
  active: 'active',
  trialing: 'trialing',
  past_due: 'past_due',
  canceled: 'canceled',
  // Payment is outstanding but the subscription still exists — the same
  // state `invoice.payment_failed` records.
  unpaid: 'past_due',
  incomplete: 'inactive',
  incomplete_expired: 'inactive',
  paused: 'inactive',
}

export function normalizeSubscriptionStatus(value: unknown): string {
  return STATUS_MAP[String(value ?? '').toLowerCase()] ?? 'inactive'
}

/*
 * EF5 — `inferCheckoutPrice()` used to live here. It read `session.line_items`
 * to resolve the plan from the purchased price rather than from metadata, and
 * it had never executed once: `line_items` is an EXPANDABLE field on a Checkout
 * Session. Stripe never includes it in a `checkout.session.completed` webhook
 * payload, and no configuration makes it do so — it is only available by
 * retrieving the session with `expand[]=line_items`. So the price branch was
 * always null and the metadata fallback always did the work.
 *
 * It is deleted rather than fixed, deliberately. Fixing it would mean an extra
 * Stripe API call from inside the webhook, which buys nothing here:
 *
 *  - `metadata.plan` and `metadata.billing_interval` are set SERVER-SIDE by
 *    create-checkout-session, from a plan id it normalized itself, against the
 *    same env price id it passed to Stripe. Setting them requires the secret
 *    key, so they are not customer-editable. The old comment's "client-editable
 *    metadata" was describing a risk this repo's checkout does not have.
 *  - The price-authoritative check still happens where it actually works. A
 *    subscription checkout also emits `customer.subscription.*`, and
 *    `getSubscriptionProfileUpdate` resolves the plan from
 *    `subscription.items.data[0].price` — which IS present on that payload —
 *    against the same `priceLookup`. So a price the lookup does not recognize
 *    is still caught, one event later, without a synchronous API call in a
 *    handler whose failure mode is a Stripe retry storm.
 *
 * The "never silently grant a paid plan" property is unchanged: an unrecognized
 * or absent `metadata.plan` still falls through to `'free'`.
 */

export function inferSubscriptionPrice(subscription: Record<string, unknown>): string | null {
  const items = subscription.items as
    { data?: Array<{ price?: unknown; plan?: unknown }> } | undefined
  const item = items?.data?.[0]
  return stringId(item?.price) ?? stringId(item?.plan)
}

export function getCheckoutProfilePatch(session: Record<string, unknown>): CheckoutProfilePatch {
  const metadata = (session.metadata ?? {}) as Record<string, unknown>
  // Server-set metadata is the single source here — see the EF5 note above.
  // Default to the free plan: never silently grant a paid plan for a checkout
  // whose metadata we don't recognize.
  const plan = normalizePlan(metadata.plan) ?? 'free'
  // An older session, created before the annual path existed, carries no
  // billing_interval at all. Reading that as 'monthly' matches what those
  // checkouts actually were.
  const billingPeriod = normalizeBillingPeriod(metadata.billing_interval) ?? 'monthly'

  return {
    userId: stringId(metadata.user_id) ?? stringId(session.client_reference_id),
    email:
      stringId(session.customer_email) ??
      stringId((session.customer_details as { email?: unknown } | undefined)?.email),
    updates: {
      plan,
      subscription_status: 'active',
      billing_period: billingPeriod,
      stripe_customer_id: stringId(session.customer),
      stripe_subscription_id: stringId(session.subscription),
    },
  }
}

export function planSignupPayloadFromProfileUpdate(
  updates: ProfileUpdate,
): PlanSignupNotificationPayload | null {
  const plan = normalizePlan(updates.plan)
  if (!plan) return null
  const billingPeriod = normalizeBillingPeriod(updates.billing_period) ?? 'monthly'
  return { plan, billing_period: billingPeriod, source: 'stripe_checkout' }
}

export function getSubscriptionProfileUpdate(
  subscription: Record<string, unknown>,
  priceLookup: PriceLookup = {},
): { customerId: string | null; updates: ProfileUpdate } {
  const metadata = (subscription.metadata ?? {}) as Record<string, unknown>
  const priceId = inferSubscriptionPrice(subscription)
  const priceMatch = priceId ? priceLookup[priceId] : null
  // Prefer the actual subscribed price over metadata. Unlike a checkout session,
  // `subscription.items.data[0].price` IS carried on this payload, so this is
  // the event where price-authoritative resolution genuinely works — and where
  // a plan or interval change made in the Stripe dashboard (rather than through
  // our own checkout) reaches us at all.
  const plan = priceMatch?.plan ?? normalizePlan(metadata.plan) ?? null
  const billingPeriod =
    priceMatch?.billingPeriod ?? normalizeBillingPeriod(metadata.billing_interval) ?? null
  const updates: ProfileUpdate = {
    subscription_status: normalizeSubscriptionStatus(subscription.status ?? 'active'),
    stripe_subscription_id: stringId(subscription.id),
  }

  if (plan) updates.plan = plan
  // Left absent rather than defaulted, so an unrecognized price cannot quietly
  // rewrite a stored 'annual' back to 'monthly'.
  if (billingPeriod) updates.billing_period = billingPeriod

  return {
    customerId: stringId(subscription.customer),
    updates,
  }
}

/**
 * Build `apply_organization_billing` args from a profile patch. Returns null
 * when plan cannot be determined — callers must supply defaults from the
 * existing profile/org row for partial subscription updates.
 */
export function organizationBillingFromProfileUpdate(
  updates: ProfileUpdate,
  options: {
    billingOwnerUserId?: string | null
    defaultPlan?: string | null
    defaultBillingPeriod?: BillingPeriod | null
  } = {},
): OrganizationBillingApply | null {
  const planRaw = updates.plan ?? options.defaultPlan ?? null
  const plan = planRaw && ORG_PLANS.has(planRaw) ? planRaw : null
  if (!plan) return null

  const billingPeriod =
    normalizeBillingPeriod(updates.billing_period) ??
    normalizeBillingPeriod(options.defaultBillingPeriod) ??
    'monthly'

  return {
    plan,
    subscriptionStatus: normalizeSubscriptionStatus(updates.subscription_status),
    billingPeriod,
    stripeCustomerId: updates.stripe_customer_id,
    stripeSubscriptionId: updates.stripe_subscription_id,
    billingOwnerUserId: options.billingOwnerUserId ?? null,
  }
}

/** Cancellation mirror: free + canceled on the org (and profile via 0107 dual-write). */
export function cancellationOrganizationBilling(
  customerId: string | null,
  billingOwnerUserId?: string | null,
): OrganizationBillingApply {
  return {
    plan: 'free',
    subscriptionStatus: 'canceled',
    billingPeriod: 'monthly',
    stripeCustomerId: customerId,
    billingOwnerUserId: billingOwnerUserId ?? null,
  }
}
