import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { postChatCompletion } from '../_shared/modelUpstream.ts'
import { activeModelRoute, routeApiKey } from '../_shared/aiRoute.ts'
import {
  claimAiUsage,
  finalizeAiUsage,
  prAiPolicy,
  usageLimitBody,
  type UsageDbClient,
  type UsageDecision,
} from '../_shared/aiUsage.ts'
import { answerExcerpt, classifyGeoAnswer } from './handlers.ts'
import { makeCorsHeaders, withCors } from '../_shared/cors.ts'
import { secretEquals } from '../_shared/secretEqual.ts'

/**
 * pr-geo-check — run the tracked GEO prompts through the configured model
 * route and record whether the answer cites or mentions the brand.
 *
 *   POST {}                   → all prompts (cron) or the caller's (JWT)
 *   POST { promptId?: string } → one prompt (JWT path only)
 *
 * Auth is dual, matching the monitor-law-changes contract:
 *   - x-trigger-secret === SUPPORT_NOTIFY_SECRET, or bearer === service key
 *     → scheduled sweep over every tracked prompt (pg_cron, migration 0195)
 *   - otherwise a portal JWT with a pr_access grant → the caller's prompts
 *     only, for the "Run checks now" button.
 *
 * The route is `pr_geo` with `advisor_chat` as the shared fallback — same
 * contract as invest-ai. What this measures is what one configured model
 * says about the brand from its own knowledge; results are directional, not
 * a report of what ChatGPT/Perplexity show specific users, so rows carry
 * checked_via='auto' to keep them distinct from human spot-checks.
 */

const CORS = { allowHeaders: 'authorization, x-client-info, apikey, content-type, x-trigger-secret' }
const corsHeaders = makeCorsHeaders(CORS)

const MAX_PROMPTS_SCHEDULED = 100
const MAX_PROMPTS_MANUAL = 25
const CRON_LOCK_JOB = 'pr-geo-check'
const CRON_LOCK_TTL_SECONDS = 600

/* The footprint a "Dutiva" answer should contain to count as cited. Kept
   here (not per-prompt) so every check measures the same brand. */
const BRAND_DOMAINS = ['dutiva.ca']
const BRAND_NAMES = ['Dutiva']

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}

function isAuthorizedTrigger(req: Request): boolean {
  const sharedSecret = Deno.env.get('SUPPORT_NOTIFY_SECRET') ?? ''
  if (sharedSecret !== '' && secretEquals(req.headers.get('x-trigger-secret') ?? '', sharedSecret)) return true
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (token === '') return false
  return secretEquals(token, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
}

async function portalUserId(
  admin: SupabaseClient,
  req: Request,
): Promise<{ userId: string } | { error: Response }> {
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!token) return { error: json({ error: 'Missing bearer token' }, 401) }
  const { data: userData, error: userError } = await admin.auth.getUser(token)
  if (userError || !userData?.user) return { error: json({ error: 'Invalid user token' }, 401) }
  const { data: access, error: accessError } = await admin
    .from('pr_access')
    .select('user_id')
    .eq('user_id', userData.user.id)
    .maybeSingle()
  if (accessError) return { error: json({ error: accessError.message }, 500) }
  if (!access) return { error: json({ error: 'PR access not granted', code: 'no_access' }, 403) }
  return { userId: userData.user.id }
}

interface PromptRow {
  id: string
  user_id: string
  prompt: string
  note: string
  checked_via: string
  /** Absent when 0232 hasn't been applied — hasNoteSource is the flag. */
  note_source?: string
}

const handler = async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Server configuration missing' }, 500)
  const admin = createClient(supabaseUrl, serviceRoleKey)

  const scheduled = isAuthorizedTrigger(req)
  let userId: string | null = null
  if (!scheduled) {
    const portal = await portalUserId(admin, req)
    if ('error' in portal) return portal.error
    userId = portal.userId
  }

  let promptId: string | null = null
  try {
    const body = await req.json()
    if (typeof body?.promptId === 'string') promptId = body.promptId
  } catch {
    /* empty body = all prompts in scope */
  }

  let instanceId: string | null = null
  if (scheduled) {
    instanceId = crypto.randomUUID()
    const { data: acquired, error: lockError } = await admin.rpc('acquire_cron_lock', {
      p_job_name: CRON_LOCK_JOB,
      p_instance_id: instanceId,
      p_ttl_seconds: CRON_LOCK_TTL_SECONDS,
    })
    if (lockError) {
      console.warn('[pr-geo-check] acquire_cron_lock failed; continuing without lock:', lockError.message)
    } else if (!acquired) {
      return json({ skipped: 'locked' })
    }
  }

  try {
    const found = await activeModelRoute(admin, ['pr_geo', 'advisor_chat'])
    if ('error' in found) {
      return json(
        found.error === 'no_route'
          ? { error: 'No active AI route', code: 'no_route' }
          : { error: found.error },
        found.error === 'no_route' ? 503 : 500,
      )
    }
    const route = found
    const keyResult = routeApiKey(route)
    if ('missingSecret' in keyResult) {
      return json({ error: `Provider secret ${keyResult.missingSecret} not configured`, code: 'no_key' }, 503)
    }

    const selectFor = <T extends string>(cols: T) => {
      let q = admin
        .from('pr_geo_prompts')
        .select(cols)
        .order('checked_at', { ascending: true, nullsFirst: true })
      if (userId) q = q.eq('user_id', userId)
      if (promptId) q = q.eq('id', promptId)
      return q.limit(scheduled ? MAX_PROMPTS_SCHEDULED : MAX_PROMPTS_MANUAL)
    }
    /* 0232 not applied yet — the column doesn't exist (42703). Fall back to
       the pre-migration shape: every row reads as machine-noted, so auto
       excerpts overwrite notes the way they always did, and the update
       writes no note_source. */
    let prompts: PromptRow[] | null
    let hasNoteSource = true
    const first = await selectFor('id, user_id, prompt, note, checked_via, note_source')
    if (first.error && (first.error.code === '42703' || /note_source/.test(first.error.message))) {
      hasNoteSource = false
      const retry = await selectFor('id, user_id, prompt, note, checked_via')
      prompts = (retry.data ?? null) as PromptRow[] | null
      if (retry.error) return json({ error: retry.error.message }, 500)
    } else {
      if (first.error) return json({ error: first.error.message }, 500)
      prompts = first.data
    }

    /* One usage claim per user per sweep — the batch of upstream calls is
       one billable operation, not 25 separate requests. A denied or
       unreachable guardrail stops that user's checks this run; they retry
       on the next sweep. */
    const claims = new Map<string, { claimId: string; t0: number } | UsageDecision>()
    const claimFor = async (uid: string) => {
      const cached = claims.get(uid)
      if (cached) return cached
      const decision = await claimAiUsage(admin as unknown as UsageDbClient, prAiPolicy(), {
        userId: uid,
        organizationId: null,
        provider: route.providerKey,
        model: route.modelName,
      })
      const entry = decision.kind === 'allowed' ? { claimId: decision.claimId, t0: Date.now() } : decision
      if (decision.kind === 'unavailable') {
        console.error(`[pr-geo-check] guardrail unavailable for ${uid}: ${decision.reason}`)
      }
      claims.set(uid, entry)
      return entry
    }
    const settleClaims = () => {
      for (const m of claims.values()) {
        if (!('kind' in m)) {
          void finalizeAiUsage(admin as unknown as UsageDbClient, m.claimId, {
            status: 'completed',
            latencyMs: Date.now() - m.t0,
          })
        }
      }
    }

    /* The manual path claims up front so a limit surfaces as a clean 429
       instead of a results row per skipped prompt. */
    if (userId) {
      const m = await claimFor(userId)
      if ('kind' in m) {
        settleClaims()
        return m.kind === 'denied'
          ? json(usageLimitBody(m), 429)
          : json({ error: 'AI temporarily unavailable', code: 'usage_unavailable' }, 503)
      }
    }

    const results = []
    for (const p of (prompts ?? []) as PromptRow[]) {
      const m = await claimFor(p.user_id)
      if ('kind' in m) {
        results.push({ id: p.id, error: 'usage_limited' })
        continue
      }
      try {
        const upstream = await postChatCompletion(
          route.provider,
          keyResult.apiKey,
          {
            model: route.modelName,
            /* The tracked prompt goes in raw — the answer should be what a
               real user asking it would get, not a coached response. */
            messages: [{ role: 'user', content: p.prompt }],
            temperature: 0.3,
            max_tokens: 700,
          },
          45_000,
        )
        if (!upstream.ok) {
          results.push({ id: p.id, error: `upstream_${upstream.status}` })
          continue
        }
        const payload = (await upstream.json()) as {
          choices?: { message?: { content?: string } }[]
        }
        const answer = payload.choices?.[0]?.message?.content ?? ''
        const result = classifyGeoAnswer(answer, {
          domains: BRAND_DOMAINS,
          brands: BRAND_NAMES,
        })
        const now = new Date().toISOString()
        /* note_source, not checked_via, decides whose words survive:
           checked_via records how the last CHECK ran (it flips to 'auto'
           here), while note_source records who wrote the note — a manual
           spot-check observation is preserved through every sweep, and a
           machine excerpt refreshes each run. hasNoteSource=false means
           0232 isn't applied — every row behaves as an auto note, the
           pre-migration semantics. */
        const manualNote = hasNoteSource && p.note_source === 'manual'
        const { error: upErr } = await admin
          .from('pr_geo_prompts')
          .update({
            result,
            note: manualNote ? p.note : answerExcerpt(answer),
            ...(hasNoteSource ? { note_source: manualNote ? 'manual' : 'auto' } : {}),
            checked_at: now,
            checked_via: 'auto',
            updated_at: now,
          })
          .eq('id', p.id)
        if (upErr) results.push({ id: p.id, error: upErr.message })
        else results.push({ id: p.id, result })
      } catch (e) {
        results.push({ id: p.id, error: e instanceof Error ? e.message : 'check_failed' })
      }
    }

    settleClaims()
    return json({
      checked: results.filter((r) => 'result' in r).length,
      prompts: (prompts ?? []).length,
      model: route.modelName,
      results,
    })
  } finally {
    if (instanceId) {
      await admin.rpc('release_cron_lock', {
        p_job_name: CRON_LOCK_JOB,
        p_instance_id: instanceId,
      })
    }
  }
}

Deno.serve(async (req) => withCors(req, await handler(req), CORS))