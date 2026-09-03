import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import type { Database } from '../_shared/database.types.ts'
import {
  cancellationOrganizationBilling,
  getCheckoutProfilePatch,
  getSubscriptionProfileUpdate,
  normalizeBillingPeriod,
  organizationBillingFromProfileUpdate,
  planSignupPayloadFromProfileUpdate,
  stringId,
} from './billing-event.ts'
import type {
  BillingPeriod,
  OrganizationBillingApply,
  PriceLookup,
  ProfileUpdate,
} from './billing-event.ts'
import { advisorPackGrantFromSession, grantAdvisorPackEntitlements } from './advisorPack.ts'
import { verifyStripeSignature } from './verify-signature.ts'

/**
 * Stripe webhook handler — keeps `public.profiles` in sync with Stripe for
 * 0089 workspace membership, and dual-writes paid entitlements to
 * organizations via `apply_organization_billing` (0107).
 *
 * Paid monthly checkout is live (`PAID_PLANS_DISABLED_DURING_BETA` is false).
 * Annual remains hidden via `ANNUAL_BILLING_AVAILABLE` until annual Stripe
 * price ids exist (TODO.md EF4a; OA11 closed for monthly).
 *
 * An internal Dutiva account never has Stripe events to process for it: the
 * paywall bypass (src/lib/billing/adminAccess.ts) is checked before
 * create-checkout-session ever calls Stripe, so no subscription is created
 * for that account in the first place.
 */

const PRICE_ENV_KEYS: Record<string, { plan: string; billingPeriod: BillingPeriod }> = {
  STRIPE_PRICE_STARTER_MONTHLY: { plan: 'starter', billingPeriod: 'monthly' },
  STRIPE_PRICE_GROWTH_MONTHLY: { plan: 'growth', billingPeriod: 'monthly' },
  STRIPE_PRICE_PRO_MONTHLY: { plan: 'pro', billingPeriod: 'monthly' },
  STRIPE_PRICE_STARTER_ANNUAL: { plan: 'starter', billingPeriod: 'annual' },
  STRIPE_PRICE_GROWTH_ANNUAL: { plan: 'growth', billingPeriod: 'annual' },
  STRIPE_PRICE_PRO_ANNUAL: { plan: 'pro', billingPeriod: 'annual' },
}

const OPERATOR_EMAIL = Deno.env.get('SUPPORT_OPERATOR_EMAIL') ?? 'support@dutiva.ca'

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function buildPriceLookup(): PriceLookup {
  const lookup: PriceLookup = {}
  for (const [envKey, match] of Object.entries(PRICE_ENV_KEYS)) {
    const priceId = Deno.env.get(envKey)?.trim()
    if (priceId) lookup[priceId] = { plan: match.plan, billingPeriod: match.billingPeriod }
  }
  return lookup
}

/**
 * Every profile write goes through here so a failure is never silent. A
 * rejected write used to be discarded — the handler still answered Stripe
 * `{received: true}`, so a customer could be charged with no entitlement and
 * nothing anywhere would say so. Returning the error lets the caller answer
 * non-2xx, which is what makes Stripe retry.
 */
async function applyProfileUpdate(
  // deno-lint-ignore no-explicit-any
  query: any,
  context: string,
): Promise<{ ok: boolean }> {
  const { error } = await query
  if (error) {
    console.error(`[stripe-webhook] ${context} failed:`, error.message, error.code ?? '')
    return { ok: false }
  }
  return { ok: true }
}

async function updateProfileByIdOrEmail(
  supabase: SupabaseClient<Database>,
  userId: string | null,
  email: string | null,
  updates: Record<string, unknown>,
): Promise<{ ok: boolean; userId: string | null }> {
  if (userId) {
    const result = await applyProfileUpdate(
      supabase.from('profiles').update(updates).eq('id', userId),
      `profile update for user ${userId}`,
    )
    return { ...result, userId }
  }

  if (!email) {
    console.error('[stripe-webhook] No user id or email available for profile update.')
    return { ok: false, userId: null }
  }

  // Do NOT interpolate an externally-influenced email into a PostgREST
  // .or() filter string (filter-injection risk) — a parameterized .eq()
  // instead.
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('account_email', email.trim().toLowerCase())
    .maybeSingle()
  if (error) console.error('[stripe-webhook] profile lookup error:', error.message)
  if (!data?.id) {
    console.error('[stripe-webhook] Could not resolve profile by checkout email:', email)
    return { ok: false, userId: null }
  }

  const result = await applyProfileUpdate(
    supabase.from('profiles').update(updates).eq('id', data.id),
    `profile update for ${email}`,
  )
  return { ...result, userId: data.id }
}

async function enqueuePlanSignupNotification(
  supabase: SupabaseClient<Database>,
  updates: ProfileUpdate,
): Promise<void> {
  const payload = planSignupPayloadFromProfileUpdate(updates)
  if (!payload) return

  const { error } = await supabase.from('support_notifications').insert({
    ticket_id: null,
    kind: 'plan_signup',
    audience: 'operator',
    recipient: OPERATOR_EMAIL,
    language: 'en',
    payload,
  })
  if (error) {
    console.error('[stripe-webhook] could not enqueue plan signup alert:', error.message)
  }
}

/** Service-role RPC helper — new org billing RPCs are not yet in database.types. */
async function rpc(
  supabase: SupabaseClient<Database>,
  fn: string,
  params: Record<string, unknown>,
): Promise<{ data: unknown; error: { message: string } | null }> {
  // deno-lint-ignore no-explicit-any
  return await (supabase as any).rpc(fn, params)
}

async function resolveUserBillingOrganization(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string | null> {
  const { data, error } = await rpc(supabase, 'resolve_user_billing_organization', {
    p_user_id: userId,
  })
  if (error) {
    console.error(
      `[stripe-webhook] resolve_user_billing_organization failed for ${userId}:`,
      error.message,
    )
    return null
  }
  return typeof data === 'string' && data.trim() ? data : null
}

/**
 * Prefer org already linked by Stripe customer id; else resolve via the
 * profile that owns that customer id.
 */
async function resolveOrganizationForCustomer(
  supabase: SupabaseClient<Database>,
  customerId: string,
): Promise<{ organizationId: string | null; billingOwnerUserId: string | null }> {
  // deno-lint-ignore no-explicit-any
  const { data: orgByCustomer, error: orgError } = await (supabase as any)
    .from('organizations')
    .select('id, billing_owner_user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  if (orgError) {
    console.error('[stripe-webhook] org lookup by stripe_customer_id failed:', orgError.message)
  }
  if (orgByCustomer?.id) {
    return {
      organizationId: orgByCustomer.id as string,
      billingOwnerUserId: (orgByCustomer.billing_owner_user_id as string | null) ?? null,
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  if (profileError) {
    console.error(
      '[stripe-webhook] profile lookup by stripe_customer_id failed:',
      profileError.message,
    )
  }
  if (!profile?.id) {
    return { organizationId: null, billingOwnerUserId: null }
  }

  const organizationId = await resolveUserBillingOrganization(supabase, profile.id)
  return { organizationId, billingOwnerUserId: profile.id }
}

async function loadProfileBillingDefaults(
  supabase: SupabaseClient<Database>,
  opts: { userId?: string | null; customerId?: string | null },
): Promise<{ plan: string; billingPeriod: BillingPeriod } | null> {
  let query = supabase.from('profiles').select('plan, billing_period')
  if (opts.userId) query = query.eq('id', opts.userId)
  else if (opts.customerId) query = query.eq('stripe_customer_id', opts.customerId)
  else return null

  const { data, error } = await query.maybeSingle()
  if (error) {
    console.error('[stripe-webhook] profile billing defaults lookup failed:', error.message)
    return null
  }
  if (!data) return null
  const plan = typeof data.plan === 'string' ? data.plan : 'free'
  const billingPeriod = normalizeBillingPeriod(data.billing_period) ?? 'monthly'
  return { plan, billingPeriod }
}

async function applyOrganizationBilling(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  apply: OrganizationBillingApply,
): Promise<{ ok: boolean }> {
  const { error } = await rpc(supabase, 'apply_organization_billing', {
    p_organization_id: organizationId,
    p_plan: apply.plan,
    p_subscription_status: apply.subscriptionStatus,
    p_billing_period: apply.billingPeriod,
    p_stripe_customer_id: apply.stripeCustomerId ?? null,
    p_stripe_subscription_id: apply.stripeSubscriptionId ?? null,
    p_billing_owner_user_id: apply.billingOwnerUserId ?? null,
  })
  if (error) {
    console.error(
      `[stripe-webhook] apply_organization_billing failed for org ${organizationId}:`,
      error.message,
    )
    return { ok: false }
  }
  return { ok: true }
}

/**
 * After a successful profile write: mirror to the billing org when one
 * resolves. Missing org is a warning only — profile entitlement already
 * landed; backfill covers later org creation.
 */
async function dualWriteOrganizationBilling(
  supabase: SupabaseClient<Database>,
  opts: {
    userId?: string | null
    customerId?: string | null
    apply: OrganizationBillingApply
    context: string
  },
): Promise<{ ok: boolean }> {
  let organizationId: string | null = null
  let billingOwnerUserId = opts.apply.billingOwnerUserId ?? null

  if (opts.customerId) {
    const resolved = await resolveOrganizationForCustomer(supabase, opts.customerId)
    organizationId = resolved.organizationId
    billingOwnerUserId = billingOwnerUserId ?? resolved.billingOwnerUserId
  }
  if (!organizationId && opts.userId) {
    organizationId = await resolveUserBillingOrganization(supabase, opts.userId)
    billingOwnerUserId = billingOwnerUserId ?? opts.userId
  }

  if (!organizationId) {
    console.warn(
      `[stripe-webhook] ${opts.context}: no billing organization resolved; profile write kept.`,
    )
    return { ok: true }
  }

  return applyOrganizationBilling(supabase, organizationId, {
    ...opts.apply,
    billingOwnerUserId,
  })
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!webhookSecret || !supabaseUrl || !supabaseKey) {
    return json({ error: 'Webhook not configured.' }, 503)
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  const valid = await verifyStripeSignature(body, sig, webhookSecret)
  if (!valid) return json({ error: 'Invalid signature.' }, 400)

  const event = JSON.parse(body)
  const supabase = createClient<Database>(supabaseUrl, supabaseKey)
  const priceLookup = buildPriceLookup()

  if (event.id) {
    const { error: dedupError } = await supabase
      .from('stripe_webhook_events')
      .insert({ event_id: event.id, event_type: event.type ?? 'unknown' })

    if (dedupError) {
      if (dedupError.code === '23505') {
        return json({ received: true, duplicate: true })
      }
      return fail('Could not record webhook dedup claim.')
    }
  }

  /**
   * Answer non-2xx so Stripe retries, and release the dedup claim first —
   * otherwise the retry would match the row this delivery just inserted, be
   * dismissed as a duplicate, and the failed write would never be reapplied.
   */
  async function fail(message: string) {
    if (event.id) {
      await supabase.from('stripe_webhook_events').delete().eq('event_id', event.id)
    }
    return json({ error: message }, 500)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const packGrant = advisorPackGrantFromSession(session as Record<string, unknown>)
    if (packGrant) {
      const packResult = await grantAdvisorPackEntitlements(
        { rpc: (fn, params) => rpc(supabase, fn, params) },
        packGrant,
        (userId) => resolveUserBillingOrganization(supabase, userId),
      )
      if (!packResult.ok) {
        console.error('[stripe-webhook] Advisor pack grant failed:', packResult.reason)
        return fail('Could not credit Advisor pack.')
      }
      if (!packResult.orgId) {
        console.warn(
          `[stripe-webhook] Advisor pack credited for user ${packGrant.userId} without org; org pack skipped.`,
        )
      }
      return json({ received: true, pack: true, org_pack: packResult.orgGranted })
    }

    const { userId, email, updates } = getCheckoutProfilePatch(session)

    if (!updates.stripe_customer_id) {
      console.warn('[stripe-webhook] checkout.session.completed: customer is not a string ID.')
    }
    if (!updates.stripe_subscription_id) {
      console.warn('[stripe-webhook] checkout.session.completed: subscription is not a string ID.')
    }

    const result = await updateProfileByIdOrEmail(supabase, userId, email, updates)
    if (!result.ok) return fail('Could not apply checkout to profile.')
    await enqueuePlanSignupNotification(supabase, updates)

    const orgApply = organizationBillingFromProfileUpdate(updates, {
      billingOwnerUserId: result.userId,
    })
    if (orgApply) {
      const orgResult = await dualWriteOrganizationBilling(supabase, {
        userId: result.userId,
        customerId: updates.stripe_customer_id ?? null,
        apply: orgApply,
        context: 'checkout.session.completed',
      })
      if (!orgResult.ok) return fail('Could not apply checkout to organization.')
    }
  }

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated'
  ) {
    const sub = event.data.object
    const { customerId, updates } = getSubscriptionProfileUpdate(sub, priceLookup)

    if (!customerId) {
      return fail('Subscription event missing customer id.')
    }
    const result = await applyProfileUpdate(
      supabase.from('profiles').update(updates).eq('stripe_customer_id', customerId),
      `subscription update for customer ${customerId}`,
    )
    if (!result.ok) return fail('Could not apply subscription to profile.')

    const defaults = await loadProfileBillingDefaults(supabase, { customerId })
    const orgApply = organizationBillingFromProfileUpdate(updates, {
      defaultPlan: defaults?.plan ?? null,
      defaultBillingPeriod: defaults?.billingPeriod ?? null,
    })
    if (orgApply) {
      const orgResult = await dualWriteOrganizationBilling(supabase, {
        customerId,
        apply: { ...orgApply, stripeCustomerId: orgApply.stripeCustomerId ?? customerId },
        context: event.type,
      })
      if (!orgResult.ok) return fail('Could not apply subscription to organization.')
    } else {
      console.warn(
        `[stripe-webhook] ${event.type}: could not build org billing payload for ${customerId}.`,
      )
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object
    const customerId = stringId(invoice.customer)
    if (!customerId) {
      return fail('Payment failed event missing customer id.')
    }
    const result = await applyProfileUpdate(
      supabase
        .from('profiles')
        .update({ subscription_status: 'past_due' })
        .eq('stripe_customer_id', customerId),
      `past_due flag for customer ${customerId}`,
    )
    if (!result.ok) return fail('Could not flag the profile past due.')

    const defaults = await loadProfileBillingDefaults(supabase, { customerId })
    const orgApply = organizationBillingFromProfileUpdate(
      {
        plan: defaults?.plan ?? 'free',
        billing_period: defaults?.billingPeriod ?? 'monthly',
        subscription_status: 'past_due',
        stripe_customer_id: customerId,
      },
      {},
    )
    if (orgApply) {
      const orgResult = await dualWriteOrganizationBilling(supabase, {
        customerId,
        apply: orgApply,
        context: 'invoice.payment_failed',
      })
      if (!orgResult.ok) return fail('Could not flag the organization past due.')
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object
    const customerId = stringId(sub.customer)
    if (!customerId) {
      return fail('Subscription deletion missing customer id.')
    }
    const result = await applyProfileUpdate(
      supabase
        .from('profiles')
        .update({ plan: 'free', subscription_status: 'canceled' })
        .eq('stripe_customer_id', customerId),
      `cancellation for customer ${customerId}`,
    )
    if (!result.ok) return fail('Could not apply the cancellation.')

    const orgResult = await dualWriteOrganizationBilling(supabase, {
      customerId,
      apply: cancellationOrganizationBilling(customerId),
      context: 'customer.subscription.deleted',
    })
    if (!orgResult.ok) return fail('Could not apply the organization cancellation.')
  }

  return json({ received: true })
})
