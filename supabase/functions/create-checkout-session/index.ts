import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { bypassesPaywall } from '../_shared/adminAccess.ts'
import { readStripeSecretKey } from '../_shared/stripeSecret.ts'

/**
 * Starts a Stripe Checkout subscription session for the signed-in account.
 * Ported from the production dutiva-website repo's create-checkout-session
 * function, narrowed to this repo's three paid plans (starter/growth/pro —
 * see src/config/plans.ts) and adapted to the bearer-JWT + service-role
 * pattern the other dutiva-* functions use (see advisor-chat).
 *
 * An internal Dutiva account (../_shared/adminAccess.ts, mirroring
 * src/lib/billing/adminAccess.ts since Deno functions can't import from
 * src/) never reaches Stripe — it gets a `bypass: true` response instead,
 * which is the actual "automatically bypass the paywall" behavior
 * PlanProvider also implements client-side.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const ALLOWED_PLANS = ['starter', 'growth', 'pro'] as const
type PlanId = (typeof ALLOWED_PLANS)[number]

/**
 * Mirrors `BillingPeriod` in src/config/plans.ts. Deno functions cannot import
 * from src/, so this is a deliberate duplicate — keep the two in step.
 */
const ALLOWED_PERIODS = ['monthly', 'annual'] as const
type BillingPeriod = (typeof ALLOWED_PERIODS)[number]

const PRICE_ENV_KEYS: Record<BillingPeriod, Record<PlanId, string>> = {
  monthly: {
    starter: 'STRIPE_PRICE_STARTER_MONTHLY',
    growth: 'STRIPE_PRICE_GROWTH_MONTHLY',
    pro: 'STRIPE_PRICE_PRO_MONTHLY',
  },
  annual: {
    starter: 'STRIPE_PRICE_STARTER_ANNUAL',
    growth: 'STRIPE_PRICE_GROWTH_ANNUAL',
    pro: 'STRIPE_PRICE_PRO_ANNUAL',
  },
}

function normalizePlan(value: unknown): PlanId | null {
  const plan = String(value ?? '').toLowerCase()
  return (ALLOWED_PLANS as readonly string[]).includes(plan) ? (plan as PlanId) : null
}

/**
 * Absent or unrecognized reads as `monthly`, which is what every caller sent
 * before the annual path existed. Failing closed to the cheaper interval is the
 * safe direction: the alternative would bill a year up front on a typo.
 */
function normalizePeriod(value: unknown): BillingPeriod {
  const period = String(value ?? '').toLowerCase()
  return (ALLOWED_PERIODS as readonly string[]).includes(period)
    ? (period as BillingPeriod)
    : 'monthly'
}

async function stripePost(path: string, params: Record<string, string>, secretKey: string) {
  const body = new URLSearchParams(params).toString()
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })
  return res.json() as Promise<{ id?: string; url?: string; error?: { message?: string } }>
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const stripeKey = readStripeSecretKey(Deno.env.get('STRIPE_SECRET_KEY'))
  if (!stripeKey) return json({ error: 'Payments not configured.' }, 503)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Server configuration missing' }, 500)
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const adminClient = createClient(supabaseUrl, serviceRoleKey)
  const token = authHeader.replace('Bearer ', '')

  const { data: userData, error: userError } = await userClient.auth.getUser(token)
  const user = userData?.user
  if (userError || !user) return json({ error: 'Unauthorized' }, 401)

  if (bypassesPaywall(user.email)) {
    return json({
      bypass: true,
      message: 'Internal Dutiva access already includes full plan access — no checkout needed.',
    })
  }

  let body: { plan?: string; billingPeriod?: string; period?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid body.' }, 400)
  }

  const plan = normalizePlan(body.plan)
  if (!plan) return json({ error: 'Invalid plan.' }, 400)
  /* `billingPeriod` is the key PricingPage.tsx already sends; `period` is
     accepted as an alias so a caller using the shorter name is not silently
     billed monthly. Anything else falls back to monthly — see normalizePeriod. */
  const period = normalizePeriod(body.billingPeriod ?? body.period)

  const priceId = (Deno.env.get(PRICE_ENV_KEYS[period][plan]) ?? '')
    .trim()
    .replace(/^["']|["']$/g, '')
  /* 503 rather than a fallback to the monthly price: silently billing a
     different interval than the customer chose is worse than not starting the
     checkout at all. Until the annual price IDs exist in Stripe, an annual
     request fails loudly and visibly. */
  if (!priceId.startsWith('price_')) {
    return json({ error: `Missing Stripe price ID for the ${period} ${plan} plan.` }, 503)
  }

  const { data: profile } = await adminClient
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle()

  let customerId = profile?.stripe_customer_id as string | undefined
  if (!customerId) {
    let customer: { id?: string; error?: { message?: string } }
    try {
      customer = await stripePost(
        '/customers',
        { email: user.email ?? '', 'metadata[user_id]': user.id },
        stripeKey,
      )
    } catch (err) {
      console.error(
        '[create-checkout-session] stripe customer request failed:',
        err instanceof Error ? err.message : 'unknown',
      )
      return json({ error: 'Could not start checkout.' }, 502)
    }
    customerId = customer.id
    if (!customerId) {
      console.error(
        '[create-checkout-session] stripe customer missing id:',
        customer.error?.message ?? 'no error body',
      )
      return json({ error: 'Could not start checkout.' }, 502)
    }
    const { error: upsertError } = await adminClient
      .from('profiles')
      .upsert({ id: user.id, account_email: user.email, stripe_customer_id: customerId })
    if (upsertError) {
      console.error('[create-checkout-session] profile upsert failed:', upsertError.message)
      return json({ error: 'Could not save billing profile.' }, 500)
    }
  }

  const siteUrl = Deno.env.get('SITE_URL') ?? 'https://dutiva.ca'
  let session: { url?: string; error?: { message?: string } }
  try {
    session = await stripePost(
      '/checkout/sessions',
      {
        customer: customerId as string,
        mode: 'subscription',
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        success_url: `${siteUrl}/pricing?checkout=success&plan=${plan}`,
        cancel_url: `${siteUrl}/pricing?checkout=cancelled`,
        'metadata[user_id]': user.id,
        'metadata[plan]': plan,
        'metadata[billing_interval]': period,
        'subscription_data[metadata][user_id]': user.id,
        'subscription_data[metadata][plan]': plan,
        'subscription_data[metadata][billing_interval]': period,
      },
      stripeKey,
    )
  } catch (err) {
    console.error(
      '[create-checkout-session] stripe session request failed:',
      err instanceof Error ? err.message : 'unknown',
    )
    return json({ error: 'Could not start checkout.' }, 502)
  }

  if (!session.url) {
    console.error(
      '[create-checkout-session] stripe session missing url:',
      session.error?.message ?? 'no error body',
    )
    return json({ error: 'Could not start checkout.' }, 502)
  }

  return json({ url: session.url })
})
