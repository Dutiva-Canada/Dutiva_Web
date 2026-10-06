import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { postChatCompletion } from '../_shared/modelUpstream.ts'
import { activeModelRoute, routeApiKey } from '../_shared/aiRoute.ts'
import { fileSuggestion, textDedupeKey } from '../_shared/agentQueue.ts'
import {
  buildCompanionSignals,
  buildHabitStatuses,
  buildHealthFacts,
  chatPrompt,
  entryReactPrompt,
  habitPrompt,
  parseChatReply,
  parseHabit,
  reactPrompt,
  recapPrompt,
  reflectPrompt,
  resolveHabitRef,
  type CheckInNoteRow,
  type ChatReply,
  type HabitLogRowLite,
  type HabitRowLite,
  type JournalExcerptRow,
  type ReactEvent,
} from './handlers.ts'

/**
 * health-ai — the wellness portal's user-triggered model calls, all in
 * Mira's voice:
 *
 *   POST { kind:'reflect', lang? } → { prompt }   — one gentle journal prompt
 *   POST { kind:'recap',   lang? } → { summary }  — a short weekly summary
 *   POST { kind:'habit',   lang? } → { habit }    — one habit suggestion
 *   POST { kind:'react', event, today?, lang? } → { reply }
 *                                             — she reacts when the person
 *                                             does something: saved a
 *                                             check-in, marked a habit done.
 *                                             Her line persists to
 *                                             health_chat_messages.
 *   POST { kind:'entry_react', entryId, today?, lang? } → { reply }
 *                                             — responds to ONE journal
 *                                             entry the person explicitly
 *                                             shared ("Let Mira read this").
 *                                             Persists the same way.
 *   POST { kind:'chat', message, today?, lang? } → { reply, action, assistantId }
 *                                             — Mira, the portal companion:
 *                                             keeps company over the caller's
 *                                             own context and can execute
 *                                             whitelisted writes
 *                                             (mark/unmark a habit today, add a
 *                                             habit, log a check-in, write a
 *                                             journal entry). Both turns persist
 *                                             to health_chat_messages.
 *   POST { kind:'chat_history', limit? } → { turns }
 *   POST { kind:'chat_clear' }           → { cleared: true }
 *   POST { kind:'chat_feedback', messageId, rating } → { ok }
 *                                             — thumbs up/down on an assistant
 *                                             turn; history read/clear/feedback
 *                                             run through the function too, so
 *                                             the table's only writer is this
 *                                             code path.
 *
 * Auth is the portal contract only (JWT + health_access) — no scheduled path.
 *
 * PRIVACY: Mira reads what the person wrote — check-in notes and bounded
 * journal excerpts reach every kind (buildCompanionSignals), the
 * conversation is included on chat, and entry_react reads one entry the
 * person explicitly shared. Every row belongs to the caller; nothing is
 * shared across users. The wellness notice says this plainly.
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
    kind !== 'react' &&
    kind !== 'entry_react' &&
    kind !== 'chat' &&
    kind !== 'chat_history' &&
    kind !== 'chat_clear' &&
    kind !== 'chat_feedback'
  ) {
    return json({ error: 'unknown kind' }, 400)
  }

  /* The portal tracks habit "days" in the user's local timezone — the
     client sends its local YYYY-MM-DD so "mark it done" and "just checked
     in" land on the day the person sees, not the server's UTC date. */
  const today =
    typeof body.today === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.today)
      ? body.today
      : new Date().toISOString().slice(0, 10)

  /* History read/clear/feedback need no model — they run through this
     function so the table's only writer is this code path (a client can't
     file its own 'assistant' rows under the owner policy). */
  if (kind === 'chat_history') {
    const limit =
      typeof body.limit === 'number' && Number.isInteger(body.limit)
        ? Math.min(Math.max(body.limit, 1), 120)
        : 60
    const { data, error } = await admin
      .from('health_chat_messages')
      .select('id, role, content, action, feedback, created_at')
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
  if (kind === 'chat_feedback') {
    const messageId = typeof body.messageId === 'string' ? body.messageId : ''
    const rating = body.rating
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId) ||
      (rating !== 1 && rating !== -1 && rating !== 0 && rating !== null)
    ) {
      return json({ error: 'messageId (uuid) and rating (-1|0|1) required' }, 400)
    }
    const { error } = await admin
      .from('health_chat_messages')
      .update({ feedback: rating === 0 ? null : rating })
      .eq('id', messageId)
      .eq('user_id', portal.userId)
      .eq('role', 'assistant')
    if (error) return json({ error: error.message }, 500)
    return json({ ok: true })
  }
  if (kind === 'chat') {
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    if (message.length === 0 || message.length > 1200) {
      return json({ error: 'message must be 1–1200 characters' }, 400)
    }
    return await runChat(admin, portal.userId, message, today, lang)
  }
  if (kind === 'react') {
    const event = parseReactEvent(body.event)
    if (!event) return json({ error: 'bad event' }, 400)
    return await runReact(admin, portal.userId, event, today, lang)
  }
  if (kind === 'entry_react') {
    const entryId = typeof body.entryId === 'string' ? body.entryId : ''
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entryId)) {
      return json({ error: 'entryId must be a uuid' }, 400)
    }
    return await runEntryReact(admin, portal.userId, entryId, today, lang)
  }

  const route = await modelRoute(admin)
  if ('error' in route) return route.error
  const { found, keyResult } = route

  const ctx = await loadCompanionContext(admin, portal.userId, today)
  if ('error' in ctx) return ctx.error

  const prompt =
    kind === 'reflect'
      ? reflectPrompt(ctx.facts, ctx.signals, lang)
      : kind === 'recap'
        ? recapPrompt(ctx.facts, ctx.signals, lang)
        : habitPrompt(ctx.facts, ctx.habitNames, ctx.signals, lang)

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
   The companion surface. Context is the aggregate set plus per-habit
   done/streak status, the last CHAT_HISTORY turns, and the person's own
   recent words — check-in notes and truncated journal excerpts
   (buildCompanionSignals). Unlike the other kinds, free text the person
   wrote does enter this prompt — that is the product, and the wellness
   notice discloses it. */

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

/** The caller's own context, shared by every model kind: aggregate facts,
    per-habit status (for habit actions + streak lookups), and their own
    recent words — check-in notes plus bounded journal excerpts. The
    journal select is bounded at fetch too; buildCompanionSignals trims
    further. Every row belongs to the caller. */
interface CompanionContext {
  facts: ReturnType<typeof buildHealthFacts>
  statuses: ReturnType<typeof buildHabitStatuses>
  habitNames: string[]
  signals: string[]
}

async function loadCompanionContext(
  admin: SupabaseClient,
  userId: string,
  today: string,
): Promise<CompanionContext | { error: Response }> {
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
    { data: journals, error: jError },
  ] = await Promise.all([
    admin
      .from('health_checkins')
      .select('mood, energy, note, created_at')
      .eq('user_id', userId)
      .gte('created_at', factsSince),
    admin.from('health_habits').select('id, name').eq('user_id', userId),
    admin
      .from('health_habit_logs')
      .select('habit_id, day')
      .eq('user_id', userId)
      .gte('day', logsSince),
    admin
      .from('health_journal_entries')
      .select('title, body, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(6),
  ])
  if (ciError) return { error: json({ error: ciError.message }, 500) }
  if (hError) return { error: json({ error: hError.message }, 500) }
  if (lError) return { error: json({ error: lError.message }, 500) }
  if (jError) return { error: json({ error: jError.message }, 500) }

  const habitRows = (habits ?? []) as HabitRowLite[]
  const logRows = (logs ?? []) as HabitLogRowLite[]
  const noteRows = (checkIns ?? []) as CheckInNoteRow[]
  return {
    facts: buildHealthFacts(noteRows, habitRows, logRows, FACTS_DAYS, new Date().toISOString()),
    statuses: buildHabitStatuses(habitRows, logRows, today),
    habitNames: habitRows.map((h) => h.name),
    signals: buildCompanionSignals(noteRows, (journals ?? []) as JournalExcerptRow[]),
  }
}

/** Model-route + key resolution, shared by the model-backed kinds. */
async function modelRoute(admin: SupabaseClient) {
  const found = await activeModelRoute(admin, ['health_ai', 'advisor_chat'])
  if ('error' in found) {
    return {
      error: json(
        found.error === 'no_route'
          ? { error: 'No active AI route', code: 'no_route' }
          : { error: found.error },
        found.error === 'no_route' ? 503 : 500,
      ),
    }
  }
  const keyResult = routeApiKey(found)
  if ('missingSecret' in keyResult) {
    return {
      error: json(
        { error: `Provider secret ${keyResult.missingSecret} not configured`, code: 'no_key' },
        503,
      ),
    }
  }
  return { found, keyResult }
}

async function runChat(
  admin: SupabaseClient,
  userId: string,
  message: string,
  today: string,
  lang: 'en' | 'fr',
): Promise<Response> {
  const route = await modelRoute(admin)
  if ('error' in route) return route.error
  const { found, keyResult } = route

  const [ctx, { data: historyRows, error: histError }] = await Promise.all([
    loadCompanionContext(admin, userId, today),
    admin
      .from('health_chat_messages')
      .select('role, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(CHAT_HISTORY),
  ])
  if ('error' in ctx) return ctx.error
  if (histError) return json({ error: histError.message }, 500)

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
          chatPrompt(ctx.facts, ctx.statuses, ctx.signals, today, lang),
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
    executed = await executeChatAction(admin, userId, parsed.action, ctx.statuses, today)
  }

  /* Persist both turns — history is server-side so the next device/session
     sees the same conversation, and the assistant row keeps what it did.
     The assistant id goes back so the client can attach feedback to it. */
  const nowIso = new Date().toISOString()
  const { data: userRow } = await admin
    .from('health_chat_messages')
    .insert({ user_id: userId, role: 'user', content: message, created_at: nowIso })
    .select('id')
    .single()
  const { data: assistantRow } = await admin
    .from('health_chat_messages')
    .insert({
      user_id: userId,
      role: 'assistant',
      content: parsed.reply,
      action: executed,
      created_at: new Date(Date.parse(nowIso) + 1).toISOString(),
    })
    .select('id')
    .single()

  return json({
    reply: parsed.reply,
    action: executed,
    userId: userRow?.id ?? null,
    assistantId: assistantRow?.id ?? null,
  })
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

/* ── kinds 'react' / 'entry_react' ─────────────────────────────────────────
   Mira reacts to what the person just did (and to a journal entry they
   explicitly shared). No action grammar — one short plain-text line. The
   reply persists to health_chat_messages so the reaction still exists on
   the next visit; the originating page renders it inline too. */

function parseReactEvent(raw: unknown): ReactEvent | null {
  if (typeof raw !== 'object' || raw === null) return null
  const ev = raw as Record<string, unknown>
  if (ev.type === 'checkin_saved') {
    const mood = Number(ev.mood)
    if (!Number.isInteger(mood) || mood < 1 || mood > 5) return null
    const energy = ev.energy == null ? null : Number(ev.energy)
    if (energy !== null && (!Number.isInteger(energy) || energy < 1 || energy > 5)) {
      return null
    }
    return {
      type: 'checkin_saved',
      mood,
      energy,
      note: typeof ev.note === 'string' ? ev.note.slice(0, 2000) : undefined,
    }
  }
  if (ev.type === 'habit_marked') {
    if (typeof ev.habit !== 'string' || ev.habit.trim() === '') return null
    return { type: 'habit_marked', habit: ev.habit.trim().slice(0, 120) }
  }
  return null
}

/** Model call → plain text → persist an assistant turn. Shared by both
    reaction kinds; differs from runChat in prompt shape only. */
async function reactToModel(
  admin: SupabaseClient,
  userId: string,
  prompt: string,
  maxTokens: number,
): Promise<Response> {
  const route = await modelRoute(admin)
  if ('error' in route) return route.error
  const { found, keyResult } = route

  let upstream: Response
  try {
    upstream = await postChatCompletion(
      found.provider,
      keyResult.apiKey,
      {
        model: found.modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: maxTokens,
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
  const reply = (payload.choices?.[0]?.message?.content ?? '').trim()
  if (!reply) return json({ error: 'Model returned empty text', code: 'empty' }, 502)

  const { data: row } = await admin
    .from('health_chat_messages')
    .insert({ user_id: userId, role: 'assistant', content: reply })
    .select('id')
    .single()
  return json({ reply, assistantId: row?.id ?? null })
}

async function runReact(
  admin: SupabaseClient,
  userId: string,
  event: ReactEvent,
  today: string,
  lang: 'en' | 'fr',
): Promise<Response> {
  const ctx = await loadCompanionContext(admin, userId, today)
  if ('error' in ctx) return ctx.error
  /* The client names the habit; the streak is resolved server-side from the
     rows already fetched, so the reaction can say "three days running". */
  const streak =
    event.type === 'habit_marked'
      ? (resolveHabitRef(event.habit, ctx.statuses)?.streak ?? null)
      : null
  return await reactToModel(admin, userId, reactPrompt(event, streak, ctx.signals, today, lang), 160)
}

async function runEntryReact(
  admin: SupabaseClient,
  userId: string,
  entryId: string,
  today: string,
  lang: 'en' | 'fr',
): Promise<Response> {
  /* Explicit per-entry consent — only the entry the person shared is read,
     and only because they pressed the button. */
  const { data: entry, error: entryError } = await admin
    .from('health_journal_entries')
    .select('title, body')
    .eq('id', entryId)
    .eq('user_id', userId)
    .maybeSingle()
  if (entryError) return json({ error: entryError.message }, 500)
  if (!entry) return json({ error: 'Entry not found' }, 404)

  const ctx = await loadCompanionContext(admin, userId, today)
  if ('error' in ctx) return ctx.error
  const e = entry as { title?: string; body?: string }
  return await reactToModel(
    admin,
    userId,
    entryReactPrompt(e.title ?? '', e.body ?? '', ctx.signals, today, lang),
    300,
  )
}
