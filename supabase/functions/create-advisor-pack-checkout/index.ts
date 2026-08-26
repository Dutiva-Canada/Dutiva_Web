import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { bypassesPaywall } from '../_shared/adminAccess.ts'
import { readStripeSecretKey, stripeSecretDiagnostic } from '../_shared/stripeSecret.ts'

/**
 * One-time Stripe Checkout for prepaid Advisor reply packs.
 *
 * Internal @dutiva.ca accounts skip payment (founder testing must not buy
 * fake packs). Everyone else pays; this does not change `profiles.plan`.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const PACK_ENV: Record<50 | 200, string> = {
  50: 'STRIPE_PRICE_ADVISOR_PACK_50',
  200: 'STRIPE_PRICE_ADVISOR_PACK_200',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function normalizePack(value: unknown): 50 | 200 | null {
  const n = Number(value)
  return n === 50 || n === 200 ? n : null
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

  const rawStripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  const stripeKey = readStripeSecretKey(rawStripeKey)
  if (!stripeKey) {
    console.error(
      '[create-advisor-pack-checkout] stripe secret unusable',
      stripeSecretDiagnostic(rawStripeKey),
    )
    return json({ error: 'Payments not configured.' }, 503)
  }

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
      message: 'Internal Dutiva accounts skip Advisor reply packs.',
    })
  }

  let body: { pack?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid body.' }, 400)
  }

  const pack = normalizePack(body.pack)
  if (!pack) return json({ error: 'Invalid pack.' }, 400)

  const priceId = (Deno.env.get(PACK_ENV[pack]) ?? '').trim().replace(/^["']|["']$/g, '')
  if (!priceId.startsWith('price_')) {
    return json({ error: `Missing Stripe price ID for the ${pack}-reply pack.` }, 503)
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
        '[create-advisor-pack-checkout] stripe customer request failed:',
        err instanceof Error ? err.message : 'unknown',
      )
      return json({ error: 'Could not start checkout.' }, 502)
    }
    customerId = customer.id
    if (!customerId) {
      console.error(
        '[create-advisor-pack-checkout] stripe customer missing id:',
        customer.error?.message ?? 'no error body',
      )
      return json({ error: 'Could not start checkout.' }, 502)
    }
    const { error: upsertError } = await adminClient
      .from('profiles')
      .upsert({ id: user.id, account_email: user.email, stripe_customer_id: customerId })
    if (upsertError) {
      console.error('[create-advisor-pack-checkout] profile upsert failed:', upsertError.message)
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
        mode: 'payment',
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        success_url: `${siteUrl}/app/advisor?pack=success`,
        cancel_url: `${siteUrl}/app/advisor?pack=cancelled`,
        'metadata[kind]': 'advisor_pack',
        'metadata[pack]': String(pack),
        'metadata[user_id]': user.id,
        client_reference_id: user.id,
      },
      stripeKey,
    )
  } catch (err) {
    console.error(
      '[create-advisor-pack-checkout] stripe session request failed:',
      err instanceof Error ? err.message : 'unknown',
    )
    return json({ error: 'Could not start checkout.' }, 502)
  }

  if (!session.url) {
    console.error(
      '[create-advisor-pack-checkout] stripe session missing url:',
      session.error?.message ?? 'no error body',
    )
    return json({ error: 'Could not start checkout.' }, 502)
  }

  return json({ url: session.url })
})
