import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

/**
 * PUBLIC (unauthenticated) read of beta cohort fill — aggregate seats taken
 * out of BETA_COHORT_LIMIT. Powers the landing-page spot counter.
 *
 * Returns only `{ taken, limit }`. No emails, companies, or per-row data —
 * the landing page must never learn who signed up.
 *
 * Eligibility matches create-beta-signup and migration 0067: rows with
 * status declined/bounced hold no seat. Fail-open to taken=0 on query
 * failure (admission is still gated server-side).
 *
 * Keep BETA_COHORT_LIMIT in sync with src/config/beta.ts;
 * src/canonicalFacts.test.ts fails the build on drift.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const BETA_COHORT_LIMIT = 15

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'GET' && req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ taken: 0, limit: BETA_COHORT_LIMIT })
  }

  const admin = createClient(supabaseUrl, serviceRoleKey)
  const { count, error } = await admin
    .from('beta_signups')
    .select('id', { count: 'exact', head: true })
    .not('status', 'in', '(declined,bounced)')

  if (error) {
    console.error('beta-cohort-status: count failed', error.message)
    return json({ taken: 0, limit: BETA_COHORT_LIMIT })
  }

  return json({ taken: count ?? 0, limit: BETA_COHORT_LIMIT })
})
