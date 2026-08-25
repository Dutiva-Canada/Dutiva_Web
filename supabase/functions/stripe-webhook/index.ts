import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { getCheckoutProfilePatch, getSubscriptionProfileUpdate, stringId } from './billing-event.ts'
import type { BillingPeriod, PriceLookup } from './billing-event.ts'
import { verifyStripeSignature } from './verify-signature.ts'

/**
 * Stripe webhook handler — keeps `public.profiles` in sync with Stripe.
 * Ported from the production dutiva-website repo's stripe-webhook function,
 * narrowed to this repo's three paid plans (starter/growth/pro, monthly or
 * annual — see src/config/plans.ts).
 *
 * Annual is wired but not reachable: `PAID_PLANS_DISABLED_DURING_BETA` is true,
 * so nothing on /pricing is purchasable and the annual toggle is hidden. The
 * annual price ids also do not exist in Stripe yet (TODO.md OA11).
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
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string | null,
  email: string | null,
  updates: Record<string, unknown>,
): Promise<{ ok: boolean }> {
  if (userId) {
    return applyProfileUpdate(
      supabase.from('profiles').update(updates).eq('id', userId),
      `profile update for user ${userId}`,
    )
  }

  if (!email) {
    console.error('[stripe-webhook] No user id or email available for profile update.')
    return { ok: false }
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
    return { ok: false }
  }

  return applyProfileUpdate(
    supabase.from('profiles').update(updates).eq('id', data.id),
    `profile update for ${email}`,
  )
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
  const supabase = createClient(supabaseUrl, supabaseKey)
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
    const { userId, email, updates } = getCheckoutProfilePatch(session)

    if (!updates.stripe_customer_id) {
      console.warn('[stripe-webhook] checkout.session.completed: customer is not a string ID.')
    }
    if (!updates.stripe_subscription_id) {
      console.warn('[stripe-webhook] checkout.session.completed: subscription is not a string ID.')
    }

    const result = await updateProfileByIdOrEmail(supabase, userId, email, updates)
    if (!result.ok) return fail('Could not apply checkout to profile.')
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
  }

  return json({ received: true })
})
