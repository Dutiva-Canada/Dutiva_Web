import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { postChatCompletion } from '../_shared/modelUpstream.ts'
import { activeModelRoute, routeApiKey } from '../_shared/aiRoute.ts'
import { fileSuggestion, textDedupeKey } from '../_shared/agentQueue.ts'
import {
  buildHealthFacts,
  habitPrompt,
  parseHabit,
  recapPrompt,
  reflectPrompt,
  type CheckInRow,
  type HabitLogRowLite,
  type HabitRowLite,
} from './handlers.ts'

/**
 * health-ai — the wellness portal's user-triggered model calls:
 *
 *   POST { kind:'reflect', lang? } → { prompt }   — one gentle journal prompt
 *   POST { kind:'recap',   lang? } → { summary }  — a short weekly summary
 *   POST { kind:'habit',   lang? } → { habit }    — one habit suggestion
 *
 * Auth is the portal contract only (JWT + health_access) — no scheduled path.
 *
 * PRIVACY: the model is fed aggregates only (counts, averages, streak
 * lengths — buildHealthFacts). Check-in notes and journal bodies are never
 * selected, let alone sent. The recap can only describe what the Insights
 * page already shows.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-trigger-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const FACTS_DAYS = 14
const UPSTREAM_TIMEOUT_MS = 45_000

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
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
    .from('health_access')
    .select('user_id')
    .eq('user_id', userData.user.id)
    .maybeSingle()
  if (accessError) return { error: json({ error: accessError.message }, 500) }
  if (!access) return { error: json({ error: 'Health access not granted', code: 'no_access' }, 403) }
  return { userId: userData.user.id }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Server configuration missing' }, 500)
  const admin = createClient(supabaseUrl, serviceRoleKey)

  const portal = await portalUserId(admin, req)
  if ('error' in portal) return portal.error

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    body = {}
  }
  const kind = body.kind
  const lang = body.lang === 'fr' ? 'fr' : 'en'
  if (kind !== 'reflect' && kind !== 'recap' && kind !== 'habit') {
    return json({ error: 'kind must be "reflect", "recap", or "habit"' }, 400)
  }

  const found = await activeModelRoute(admin, ['health_ai', 'advisor_chat'])
  if ('error' in found) {
    return json(
      found.error === 'no_route'
        ? { error: 'No active AI route', code: 'no_route' }
        : { error: found.error },
      found.error === 'no_route' ? 503 : 500,
    )
  }
  const keyResult = routeApiKey(found)
  if ('missingSecret' in keyResult) {
    return json({ error: `Provider secret ${keyResult.missingSecret} not configured`, code: 'no_key' }, 503)
  }

  /* Aggregates only — mood/energy numbers, never the note text. */
  const since = new Date(Date.now() - FACTS_DAYS * 86_400_000).toISOString()
  const [{ data: checkIns, error: ciError }, { data: habits, error: hError }, { data: logs, error: lError }] =
    await Promise.all([
      admin
        .from('health_checkins')
        .select('mood, energy, created_at')
        .eq('user_id', portal.userId)
        .gte('created_at', since),
      admin.from('health_habits').select('id, name').eq('user_id', portal.userId),
      admin
        .from('health_habit_logs')
        .select('habit_id, day')
        .eq('user_id', portal.userId)
        .gte('day', since.slice(0, 10)),
    ])
  if (ciError) return json({ error: ciError.message }, 500)
  if (hError) return json({ error: hError.message }, 500)
  if (lError) return json({ error: lError.message }, 500)

  const facts = buildHealthFacts(
    (checkIns ?? []) as CheckInRow[],
    (habits ?? []) as HabitRowLite[],
    (logs ?? []) as HabitLogRowLite[],
    FACTS_DAYS,
    new Date().toISOString(),
  )

  const habitNames = ((habits ?? []) as HabitRowLite[]).map((h) => h.name)
  const prompt =
    kind === 'reflect'
      ? reflectPrompt(facts, lang)
      : kind === 'recap'
        ? recapPrompt(facts, lang)
        : habitPrompt(facts, habitNames, lang)

  let upstream: Response
  try {
    upstream = await postChatCompletion(
      found.provider,
      keyResult.apiKey,
      {
        model: found.modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: kind === 'reflect' ? 120 : kind === 'recap' ? 300 : 120,
      },
      UPSTREAM_TIMEOUT_MS,
    )
  } catch (e) {
    return json({ error: `Upstream call failed: ${e instanceof Error ? e.message : 'timeout'}`, code: 'upstream' }, 502)
  }
  if (!upstream.ok) {
    return json({ error: `Upstream returned ${upstream.status}`, code: 'upstream' }, 502) }
  const payload = (await upstream.json()) as { choices?: { message?: { content?: string } }[] }
  const text = (payload.choices?.[0]?.message?.content ?? '').trim()
  if (!text) return json({ error: 'Model returned empty text', code: 'empty' }, 502)

  if (kind === 'habit') {
    const habit = parseHabit(text)
    if (!habit) return json({ error: 'Model returned no usable habit', code: 'unparseable' }, 502)
    /* File for review — deduped on the habit name so re-suggesting returns
       the same pending row rather than a twin. */
    const filed = await fileSuggestion(admin, {
      userId: portal.userId,
      surface: 'health',
      kind: 'habit',
      title: habit.name,
      payload: { name: habit.name, why: habit.why },
      dedupeKey: textDedupeKey(habit.name),
    })
    return json({ habit, suggestionId: filed?.id ?? null })
  }
  return kind === 'reflect' ? json({ prompt: text }) : json({ summary: text })
})
