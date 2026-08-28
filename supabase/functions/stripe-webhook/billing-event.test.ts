import { describe, expect, it } from 'vitest'
import {
  getCheckoutProfilePatch,
  getSubscriptionProfileUpdate,
  normalizeBillingPeriod,
  normalizePlan,
  normalizeSubscriptionStatus,
  planSignupPayloadFromProfileUpdate,
  stringId,
} from './billing-event'

const priceLookup = {
  price_starter_monthly: { plan: 'starter', billingPeriod: 'monthly' as const },
  price_growth_monthly: { plan: 'growth', billingPeriod: 'monthly' as const },
  price_pro_monthly: { plan: 'pro', billingPeriod: 'monthly' as const },
  price_starter_annual: { plan: 'starter', billingPeriod: 'annual' as const },
  price_growth_annual: { plan: 'growth', billingPeriod: 'annual' as const },
  price_pro_annual: { plan: 'pro', billingPeriod: 'annual' as const },
}

describe('stripe webhook billing event helpers', () => {
  it('extracts string ids from expanded Stripe objects', () => {
    expect(stringId('cus_123')).toBe('cus_123')
    expect(stringId({ id: 'sub_123', object: 'subscription' })).toBe('sub_123')
    expect(stringId({ object: 'subscription' })).toBeNull()
  })

  it('normalizes supported plan labels and rejects unknown ones', () => {
    expect(normalizePlan('Growth')).toBe('growth')
    expect(normalizePlan('unknown')).toBeNull()
    expect(normalizePlan('enterprise')).toBeNull()
  })

  it('normalizes billing periods and rejects unknown ones', () => {
    expect(normalizeBillingPeriod('Annual')).toBe('annual')
    expect(normalizeBillingPeriod('monthly')).toBe('monthly')
    expect(normalizeBillingPeriod('weekly')).toBeNull()
    expect(normalizeBillingPeriod(undefined)).toBeNull()
  })

  it('falls back to the free plan for unrecognized metadata.plan', () => {
    const patch = getCheckoutProfilePatch({
      customer: 'cus_old',
      subscription: 'sub_old',
      metadata: { user_id: 'user_old', plan: 'enterprise' },
    })

    expect(patch).toEqual({
      userId: 'user_old',
      email: null,
      updates: {
        plan: 'free',
        subscription_status: 'active',
        billing_period: 'monthly',
        stripe_customer_id: 'cus_old',
        stripe_subscription_id: 'sub_old',
      },
    })
  })

  /* EF5. A checkout webhook NEVER carries line_items — it is an expandable
     field. The old code read it anyway and always got null, so metadata was
     doing the work unacknowledged. This asserts the resolved behaviour: even
     when a line_items payload is synthesized, server-set metadata decides. */
  it('resolves the checkout plan from server-set metadata, ignoring line_items', () => {
    const patch = getCheckoutProfilePatch({
      client_reference_id: 'user_from_pricing_table',
      customer: { id: 'cus_new' },
      subscription: { id: 'sub_new' },
      customer_details: { email: 'buyer@example.com' },
      line_items: { data: [{ price: { id: 'price_growth_monthly' } }] },
      metadata: { plan: 'starter', billing_interval: 'monthly' },
    })

    expect(patch).toEqual({
      userId: 'user_from_pricing_table',
      email: 'buyer@example.com',
      updates: {
        plan: 'starter',
        subscription_status: 'active',
        billing_period: 'monthly',
        stripe_customer_id: 'cus_new',
        stripe_subscription_id: 'sub_new',
      },
    })
  })

  it('records an annual checkout as annual', () => {
    const patch = getCheckoutProfilePatch({
      customer: 'cus_annual',
      subscription: 'sub_annual',
      metadata: { user_id: 'user_annual', plan: 'pro', billing_interval: 'annual' },
    })

    expect(patch.updates.plan).toBe('pro')
    expect(patch.updates.billing_period).toBe('annual')
  })

  /* Sessions created before the annual path existed carry no billing_interval;
     reading that as monthly matches what those checkouts actually were. */
  it('treats a checkout with no billing_interval as monthly', () => {
    const patch = getCheckoutProfilePatch({
      customer: 'cus_legacy',
      subscription: 'sub_legacy',
      metadata: { user_id: 'user_legacy', plan: 'growth' },
    })

    expect(patch.updates.billing_period).toBe('monthly')
  })

  it('falls back to checkout email when no user id is available', () => {
    const patch = getCheckoutProfilePatch({
      customer: 'cus_email',
      subscription: 'sub_email',
      customer_email: 'buyer@example.com',
      metadata: { plan: 'pro' },
    })

    expect(patch.userId).toBeNull()
    expect(patch.email).toBe('buyer@example.com')
    expect(patch.updates.plan).toBe('pro')
  })

  it('builds paid plan signup notification payloads only for recognized paid plans', () => {
    expect(
      planSignupPayloadFromProfileUpdate({
        plan: 'growth',
        subscription_status: 'active',
        billing_period: 'annual',
      }),
    ).toEqual({ plan: 'growth', billing_period: 'annual', source: 'stripe_checkout' })

    expect(
      planSignupPayloadFromProfileUpdate({
        plan: 'free',
        subscription_status: 'active',
        billing_period: 'monthly',
      }),
    ).toBeNull()

    expect(
      planSignupPayloadFromProfileUpdate({
        subscription_status: 'active',
        billing_period: 'monthly',
      }),
    ).toBeNull()
  })

  it('updates subscription events from price id, keeping the reported status', () => {
    const result = getSubscriptionProfileUpdate(
      {
        id: 'sub_123',
        customer: 'cus_123',
        status: 'past_due',
        items: { data: [{ price: { id: 'price_starter_monthly' } }] },
        metadata: {},
      },
      priceLookup,
    )

    expect(result).toEqual({
      customerId: 'cus_123',
      updates: {
        plan: 'starter',
        billing_period: 'monthly',
        subscription_status: 'past_due',
        stripe_subscription_id: 'sub_123',
      },
    })
  })

  /* Unlike a checkout session, subscription payloads DO carry the price — so
     this is the event where price-authoritative resolution genuinely works, and
     where a dashboard-side switch to an annual price reaches us at all. */
  it('prefers the subscribed annual price over a stale monthly metadata hint', () => {
    const result = getSubscriptionProfileUpdate(
      {
        id: 'sub_up',
        customer: 'cus_up',
        status: 'active',
        items: { data: [{ price: { id: 'price_pro_annual' } }] },
        metadata: { plan: 'starter', billing_interval: 'monthly' },
      },
      priceLookup,
    )

    expect(result.updates.plan).toBe('pro')
    expect(result.updates.billing_period).toBe('annual')
  })

  /* Absent, not defaulted: an unrecognized price must not quietly rewrite a
     stored 'annual' back to 'monthly'. */
  it('omits billing_period entirely when the price is unrecognized and metadata is silent', () => {
    const result = getSubscriptionProfileUpdate(
      {
        id: 'sub_unknown',
        customer: 'cus_unknown',
        status: 'active',
        items: { data: [{ price: { id: 'price_not_in_lookup' } }] },
        metadata: {},
      },
      priceLookup,
    )

    expect(result.updates).not.toHaveProperty('billing_period')
    expect(result.updates).not.toHaveProperty('plan')
  })
  it('maps Stripe statuses onto the ones profiles accepts, failing closed', () => {
    /* The check constraint on profiles.subscription_status accepts only these
       five; anything else would fail the write and lose the update. */
    expect(normalizeSubscriptionStatus('active')).toBe('active')
    expect(normalizeSubscriptionStatus('trialing')).toBe('trialing')
    expect(normalizeSubscriptionStatus('past_due')).toBe('past_due')
    expect(normalizeSubscriptionStatus('canceled')).toBe('canceled')
    expect(normalizeSubscriptionStatus('unpaid')).toBe('past_due')

    /* Never entitling: an unrecognized or in-between status reads as inactive
       rather than active. */
    expect(normalizeSubscriptionStatus('incomplete')).toBe('inactive')
    expect(normalizeSubscriptionStatus('incomplete_expired')).toBe('inactive')
    expect(normalizeSubscriptionStatus('paused')).toBe('inactive')
    expect(normalizeSubscriptionStatus('something_new_from_stripe')).toBe('inactive')
    expect(normalizeSubscriptionStatus(undefined)).toBe('inactive')
  })

  it('normalizes the status on a subscription update', () => {
    const result = getSubscriptionProfileUpdate(
      {
        id: 'sub_456',
        customer: 'cus_456',
        status: 'incomplete',
        items: { data: [{ price: { id: 'price_pro_monthly' } }] },
        metadata: {},
      },
      priceLookup,
    )

    expect(result.updates.subscription_status).toBe('inactive')
    expect(result.updates.plan).toBe('pro')
  })
})
