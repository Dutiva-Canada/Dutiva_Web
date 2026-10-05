import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { postChatCompletion } from '../_shared/modelUpstream.ts'
import { activeModelRoute, routeApiKey } from '../_shared/aiRoute.ts'
import { fileSuggestion, textDedupeKey } from '../_shared/agentQueue.ts'
import {
  buildHabitStatuses,
  buildHealthFacts,
  chatPrompt,
  habitPrompt,
  parseChatReply,
  parseHabit,
  recapPrompt,
  reflectPrompt,
  resolveHabitRef,
  type CheckInRow,
  type ChatReply,
  type HabitLogRowLite,
  type HabitRowLite,
} from './handlers.ts'

/**
 * health-ai — the wellness portal's user-triggered model calls:
 *
 *   POST { kind:'reflect', lang? } → { prompt }   — one gentle journal prompt
 *   POST { kind:'recap',   lang? } → { summary }  — a short weekly summary
 *   POST { kind:'habit',   lang? } → { habit }    — one habit suggestion
 *   POST { kind:'chat', message, today?, lang? } → { reply, action }
 *                                             — the portal assistant: answers
 *                                             over the same aggregates and can
 *                                             execute whitelisted writes
 *                                             (mark/unmark a habit today, add a
 *                                             habit, log a check-in, write a
 *                                             journal entry). Both turns persist
 *                                             to health_chat_messages.
 *   POST { kind:'chat_history', limit? } → { turns }
 *   POST { kind:'chat_clear' }           → { cleared: true }
 *                                             — history read/clear run through
 *                                             the function too, so the table's
 *                                             only writer is this code path.
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
  if (
    kind !== 'reflect' &&
    kind !== 'recap' &&
    kind !== 'habit' &&
    kind !== 'chat' &&
    kind !== 'chat_history' &&
    kind !== 'chat_clear'
  ) {
    return json({ error: 'unknown kind' }, 400)
  }
  /* History read/clear need no model — they run through this function so the
     table's only writer is this code path (a client can't file its own
     'assistant' rows under the owner policy). */
  if (kind === 'chat_history') {
    const limit =
      typeof body.limit === 'number' && Number.isInteger(body.limit)
        ? Math.min(Math.max(body.limit, 1), 120)
        : 60
    const { data, error } = await admin
      .from('health_chat_messages')
      .select('id, role, content, action, created_at')
      .eq('user_id', portal.userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) return json({ error: error.message }, 500)
    return json({ turns: (data ?? []).reverse() })
  }
  if (kind === 'chat_clear') {
    const { error } = await admin
      .from('health_chat_messages')
      .delete()
      .eq('user_id', portal.userId)
    if (error) return json({ error: error.message }, 500)
    return json({ cleared: true })
  }
  if (kind === 'chat') {
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    if (message.length === 0 || message.length > 1200) {
      return json({ error: 'message must be 1–1200 characters' }, 400)
    }
    /* The portal tracks habit "days" in the user's local timezone — the
       client sends its local YYYY-MM-DD so "mark it done" lands on the day
       the person sees, not the server's UTC date. */
    const today =
      typeof body.today === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.today)
        ? body.today
        : new Date().toISOString().slice(0, 10)
    return await runChat(admin, portal.userId, message, today, lang)
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

/* ── kind 'chat' ──────────────────────────────────────────────────────────
   The conversational surface. Context is the same aggregate-only set the
   other kinds use plus per-habit done/streak status and the last CHAT_HISTORY
   turns — the person expects the assistant to know their portal, and it does,
   without note text or journal bodies ever entering the prompt. */

const CHAT_HISTORY = 20
const CHAT_LOG_DAYS = 90

interface ExecutedAction {
  type: string
  /** Human-facing subject — the habit name, entry title, etc. */
  detail: string
  ok: boolean
  /** Row id of the created/toggled row — lets the client offer undo. */
  refId?: string
}

async function runChat(
  admin: SupabaseClient,
  userId: string,
  message: string,
  today: string,
  lang: 'en' | 'fr',
): Promise<Response> {
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

  const logsSince = new Date(
    new Date(`${today}T12:00:00Z`).getTime() - CHAT_LOG_DAYS * 86_400_000,
  )
    .toISOString()
    .slice(0, 10)
  const factsSince = new Date(Date.now() - FACTS_DAYS * 86_400_000).toISOString()

  const [
    { data: checkIns, error: ciError },
    { data: habits, error: hError },
    { data: logs, error: lError },
    { data: historyRows, error: histError },
  ] = await Promise.all([
    admin
      .from('health_checkins')
      .select('mood, energy, created_at')
      .eq('user_id', userId)
      .gte('created_at', factsSince),
    admin.from('health_habits').select('id, name').eq('user_id', userId),
    admin
      .from('health_habit_logs')
      .select('habit_id, day')
      .eq('user_id', userId)
      .gte('day', logsSince),
    admin
      .from('health_chat_messages')
      .select('role, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(CHAT_HISTORY),
  ])
  if (ciError) return json({ error: ciError.message }, 500)
  if (hError) return json({ error: hError.message }, 500)
  if (lError) return json({ error: lError.message }, 500)
  if (histError) return json({ error: histError.message }, 500)

  const habitRows = (habits ?? []) as HabitRowLite[]
  const logRows = (logs ?? []) as HabitLogRowLite[]
  const facts = buildHealthFacts(
    (checkIns ?? []) as CheckInRow[],
    habitRows,
    logRows,
    FACTS_DAYS,
    new Date().toISOString(),
  )
  const statuses = buildHabitStatuses(habitRows, logRows, today)

  const history = ((historyRows ?? []) as { role: string; content: string }[])
    .reverse()
    .map((r) => ({
      role: r.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: r.content.slice(0, 1500),
    }))

  let upstream: Response
  try {
    upstream = await postChatCompletion(
      found.provider,
      keyResult.apiKey,
      {
        model: found.modelName,
        messages: [
          chatPrompt(facts, statuses, today, lang),
          ...history,
          { role: 'user', content: message },
        ],
        temperature: 0.4,
        max_tokens: 500,
      },
      UPSTREAM_TIMEOUT_MS,
    )
  } catch (e) {
    return json(
      { error: `Upstream call failed: ${e instanceof Error ? e.message : 'timeout'}`, code: 'upstream' },
      502,
    )
  }
  if (!upstream.ok) return json({ error: `Upstream returned ${upstream.status}`, code: 'upstream' }, 502)
  const payload = (await upstream.json()) as { choices?: { message?: { content?: string } }[] }
  const parsed: ChatReply | null = parseChatReply(payload.choices?.[0]?.message?.content)
  if (!parsed) return json({ error: 'Model returned no usable reply', code: 'unparseable' }, 502)

  let executed: ExecutedAction | null = null
  if (parsed.action) {
    executed = await executeChatAction(admin, userId, parsed.action, statuses, today)
  }

  /* Persist both turns — history is server-side so the next device/session
     sees the same conversation, and the assistant row keeps what it did. */
  const nowIso = new Date().toISOString()
  await admin.from('health_chat_messages').insert([
    { user_id: userId, role: 'user', content: message, created_at: nowIso },
    {
      user_id: userId,
      role: 'assistant',
      content: parsed.reply,
      action: executed,
      created_at: new Date(Date.parse(nowIso) + 1).toISOString(),
    },
  ])

  return json({ reply: parsed.reply, action: executed })
}

/** Execute a whitelisted action on the caller's own rows. Everything here is
    additive or same-day-undoable — no deletes of history, nothing
    irreversible. A failure reports ok:false so the reply can still land. */
async function executeChatAction(
  admin: SupabaseClient,
  userId: string,
  action: NonNullable<ChatReply['action']>,
  statuses: ReturnType<typeof buildHabitStatuses>,
  today: string,
): Promise<ExecutedAction> {
  switch (action.type) {
    case 'mark_habit_done':
    case 'unmark_habit_done': {
      const target = resolveHabitRef(action.habit, statuses)
      if (!target) return { type: action.type, detail: action.habit, ok: false }
      if (action.type === 'mark_habit_done') {
        const { error } = await admin
          .from('health_habit_logs')
          .upsert(
            { user_id: userId, habit_id: target.id, day: today },
            { onConflict: 'habit_id,day', ignoreDuplicates: true },
          )
        return { type: action.type, detail: target.name, ok: !error, refId: target.id }
      }
      const { error } = await admin
        .from('health_habit_logs')
        .delete()
        .eq('habit_id', target.id)
        .eq('day', today)
      return { type: action.type, detail: target.name, ok: !error, refId: target.id }
    }
    case 'add_habit': {
      const { data, error } = await admin
        .from('health_habits')
        .insert({ user_id: userId, name: action.name })
        .select('id')
        .single()
      return { type: action.type, detail: action.name, ok: !error, refId: data?.id }
    }
    case 'add_checkin': {
      const { data, error } = await admin
        .from('health_checkins')
        .insert({
          user_id: userId,
          mood: action.mood,
          energy: action.energy ?? null,
          note: action.note ?? '',
        })
        .select('id')
        .single()
      return { type: action.type, detail: `mood ${action.mood}/5`, ok: !error, refId: data?.id }
    }
    case 'add_journal_entry': {
      const { data, error } = await admin
        .from('health_journal_entries')
        .insert({
          user_id: userId,
          title: action.title ?? '',
          body: action.body,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()
      return {
        type: action.type,
        detail: action.title ?? '',
        ok: !error,
        refId: data?.id,
      }
    }
  }
}
