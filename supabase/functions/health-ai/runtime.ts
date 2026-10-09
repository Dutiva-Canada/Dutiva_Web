import { type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { postChatCompletion, readUpstreamText } from '../_shared/modelUpstream.ts'
import { activeModelRoute, routeApiKey } from '../_shared/aiRoute.ts'
import {
  buildCompanionSignals,
  buildHabitStatuses,
  buildHealthFacts,
  chatPrompt,
  createReplyDeltaExtractor,
  entryReactPrompt,
  parseChatReply,
  reactPrompt,
  resolveHabitRef,
  type CheckInNoteRow,
  type ChatReply,
  type HabitLogRowLite,
  type HabitRowLite,
  type JournalExcerptRow,
  type ReactEvent,
} from './handlers.ts'

/* Runtime for health-ai — everything the serve() router delegates to: the
   model-backed kinds (chat, react, entry_react), their shared context load,
   action execution + undo, and the SSE plumbing. Kept out of index.ts so the
   router stays readable under the repo's file-size budget. Deno-only — the
   pure/prompt layer lives in handlers.ts where vitest can reach it. */

export const FACTS_DAYS = 14
export const UPSTREAM_TIMEOUT_MS = 45_000

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

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
  /** The local day a habit mark/unmark landed on — undo needs it back. */
  day?: string
  /** Set once chat_undo reverses the write — the client hides the chip. */
  undone?: boolean
}

/** The caller's own context, shared by every model kind: aggregate facts,
    per-habit status (for habit actions + streak lookups), and their own
    recent words — check-in notes plus bounded excerpts of journal entries
    they explicitly shared. Consent is enforced twice: the query selects
    only rows with shared_at set, and buildCompanionSignals filters again.
    Every row belongs to the caller. */
export interface CompanionContext {
  facts: ReturnType<typeof buildHealthFacts>
  statuses: ReturnType<typeof buildHabitStatuses>
  habitNames: string[]
  signals: string[]
}

export async function loadCompanionContext(
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
      .select('title, body, created_at, shared_at')
      .eq('user_id', userId)
      .not('shared_at', 'is', null)
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
export async function modelRoute(admin: SupabaseClient) {
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

/** One Server-Sent-Events channel: send() emits `data: {…}` events, close()
    ends the stream. The pump runs after the Response is already returned. */
function sseChannel() {
  const ts = new TransformStream<Uint8Array, Uint8Array>()
  const writer = ts.writable.getWriter()
  const encoder = new TextEncoder()
  return {
    response: new Response(ts.readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    }),
    send: (event: Record<string, unknown>) => {
      void writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
    },
    close: () => {
      void writer.close()
    },
  }
}

/* Persist both turns — history is server-side so the next device/session
   sees the same conversation, and the assistant row keeps what it did.
   The assistant id goes back so the client can attach feedback to it. */
async function persistChatTurns(
  admin: SupabaseClient,
  userId: string,
  message: string,
  reply: string,
  executed: ExecutedAction | null,
): Promise<{ userId: string | null; assistantId: string | null }> {
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
      content: reply,
      action: executed,
      created_at: new Date(Date.parse(nowIso) + 1).toISOString(),
    })
    .select('id')
    .single()
  return { userId: userRow?.id ?? null, assistantId: assistantRow?.id ?? null }
}

export async function runChat(
  admin: SupabaseClient,
  userId: string,
  message: string,
  today: string,
  lang: 'en' | 'fr',
  stream: boolean,
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
        stream,
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

  if (stream) {
    /* SSE out, SSE in — but only the reply text streams through. The model's
       output is one JSON object; createReplyDeltaExtractor emits its reply
       field without the scaffolding, so the action JSON never leaks into
       the bubble. The done event carries the parsed payload + row ids. */
    const sse = sseChannel()
    const extractor = createReplyDeltaExtractor()
    void (async () => {
      try {
        const fullText = await readUpstreamText(upstream, (piece) => {
          const visible = extractor.push(piece)
          if (visible) sse.send({ type: 'delta', text: visible })
        })
        const parsed: ChatReply | null = parseChatReply(fullText)
        if (!parsed) {
          sse.send({ type: 'error', error: 'Model returned no usable reply', code: 'unparseable' })
          return
        }
        const executed = parsed.action
          ? await executeChatAction(admin, userId, parsed.action, ctx.statuses, today)
          : null
        const ids = await persistChatTurns(admin, userId, message, parsed.reply, executed)
        sse.send({ type: 'done', reply: parsed.reply, action: executed, ...ids })
      } catch (e) {
        sse.send({ type: 'error', error: e instanceof Error ? e.message : 'stream failed' })
      } finally {
        sse.close()
      }
    })()
    return sse.response
  }

  const payload = (await upstream.json()) as { choices?: { message?: { content?: string } }[] }
  const parsed: ChatReply | null = parseChatReply(payload.choices?.[0]?.message?.content)
  if (!parsed) return json({ error: 'Model returned no usable reply', code: 'unparseable' }, 502)

  const executed = parsed.action
    ? await executeChatAction(admin, userId, parsed.action, ctx.statuses, today)
    : null
  const ids = await persistChatTurns(admin, userId, message, parsed.reply, executed)

  return json({
    reply: parsed.reply,
    action: executed,
    ...ids,
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
        return { type: action.type, detail: target.name, ok: !error, refId: target.id, day: today }
      }
      const { error } = await admin
        .from('health_habit_logs')
        .delete()
        .eq('habit_id', target.id)
        .eq('day', today)
      return { type: action.type, detail: target.name, ok: !error, refId: target.id, day: today }
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

/* ── kind 'chat_undo' ────────────────────────────────────────────────────
   Reverses what an assistant turn's action wrote. The action payload sits
   on the assistant message row (that is where the client found it), so the
   undo call names the message; the write is then marked undone on that
   same row so a reload doesn't offer the chip again. Every inverse is a
   same-shape write on the caller's own rows: delete what was added,
   restore what was toggled. */

/** The inverse of executeChatAction. Returns false when the action carries
    nothing reversible — old rows without `day`, writes that already failed. */
async function undoChatAction(
  admin: SupabaseClient,
  userId: string,
  action: ExecutedAction,
): Promise<boolean> {
  switch (action.type) {
    case 'mark_habit_done': {
      if (typeof action.day !== 'string') return false
      const { error } = await admin
        .from('health_habit_logs')
        .delete()
        .eq('user_id', userId)
        .eq('habit_id', action.refId as string)
        .eq('day', action.day)
      return !error
    }
    case 'unmark_habit_done': {
      if (typeof action.day !== 'string') return false
      const { error } = await admin
        .from('health_habit_logs')
        .upsert(
          { user_id: userId, habit_id: action.refId as string, day: action.day },
          { onConflict: 'habit_id,day', ignoreDuplicates: true },
        )
      return !error
    }
    /* add_habit removes the habit row — its logs cascade; the add_* cases
       delete the row the action created. */
    case 'add_habit':
    case 'add_checkin':
    case 'add_journal_entry': {
      const table =
        action.type === 'add_habit'
          ? 'health_habits'
          : action.type === 'add_checkin'
            ? 'health_checkins'
            : 'health_journal_entries'
      const { error } = await admin
        .from(table)
        .delete()
        .eq('id', action.refId as string)
        .eq('user_id', userId)
      return !error
    }
    default:
      return false
  }
}

export async function runChatUndo(
  admin: SupabaseClient,
  userId: string,
  messageId: string,
): Promise<Response> {
  const { data: msg, error } = await admin
    .from('health_chat_messages')
    .select('id, action')
    .eq('id', messageId)
    .eq('user_id', userId)
    .eq('role', 'assistant')
    .maybeSingle()
  if (error) return json({ error: error.message }, 500)
  const action = (msg?.action ?? null) as ExecutedAction | null
  if (!msg || !action || !action.ok || action.undone === true || !action.refId) {
    return json({ error: 'Nothing to undo', code: 'not_undoable' }, 400)
  }
  if (!(await undoChatAction(admin, userId, action))) {
    return json({ error: 'Nothing to undo', code: 'not_undoable' }, 400)
  }
  const { error: markError } = await admin
    .from('health_chat_messages')
    .update({ action: { ...action, undone: true } })
    .eq('id', messageId)
    .eq('user_id', userId)
  if (markError) return json({ error: markError.message }, 500)
  return json({ ok: true })
}

/* ── kinds 'react' / 'entry_react' ─────────────────────────────────────────
   Mira reacts to what the person just did (and to a journal entry they
   explicitly shared). No action grammar — one short plain-text line. The
   reply persists to health_chat_messages so the reaction still exists on
   the next visit; the originating page renders it inline too. */

export function parseReactEvent(raw: unknown): ReactEvent | null {
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
    reaction kinds; differs from runChat in prompt shape only, and in
    streaming the text IS the reply — deltas go straight through. */
async function reactToModel(
  admin: SupabaseClient,
  userId: string,
  prompt: string,
  maxTokens: number,
  stream: boolean,
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
        stream,
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

  if (stream) {
    const sse = sseChannel()
    void (async () => {
      try {
        const reply = (
          await readUpstreamText(upstream, (piece) => {
            if (piece) sse.send({ type: 'delta', text: piece })
          })
        ).trim()
        if (!reply) {
          sse.send({ type: 'error', error: 'Model returned empty text', code: 'empty' })
          return
        }
        const { data: row } = await admin
          .from('health_chat_messages')
          .insert({ user_id: userId, role: 'assistant', content: reply })
          .select('id')
          .single()
        sse.send({ type: 'done', reply, assistantId: row?.id ?? null })
      } catch (e) {
        sse.send({ type: 'error', error: e instanceof Error ? e.message : 'stream failed' })
      } finally {
        sse.close()
      }
    })()
    return sse.response
  }

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

export async function runReact(
  admin: SupabaseClient,
  userId: string,
  event: ReactEvent,
  today: string,
  lang: 'en' | 'fr',
  stream: boolean,
): Promise<Response> {
  const ctx = await loadCompanionContext(admin, userId, today)
  if ('error' in ctx) return ctx.error
  /* The client names the habit; the streak is resolved server-side from the
     rows already fetched, so the reaction can say "three days running". */
  const streak =
    event.type === 'habit_marked'
      ? (resolveHabitRef(event.habit, ctx.statuses)?.streak ?? null)
      : null
  return await reactToModel(
    admin,
    userId,
    reactPrompt(event, streak, ctx.signals, today, lang),
    160,
    stream,
  )
}

export async function runEntryReact(
  admin: SupabaseClient,
  userId: string,
  entryId: string,
  today: string,
  lang: 'en' | 'fr',
  stream: boolean,
): Promise<Response> {
  /* Explicit per-entry consent — only the entry the person shared is read,
     and only because they pressed the button. The button press IS the
     consent: stamp shared_at on the row so the excerpt also joins the
     companion context until they revoke it. */
  const sharedAt = new Date().toISOString()
  const { data: entry, error: entryError } = await admin
    .from('health_journal_entries')
    .select('title, body')
    .eq('id', entryId)
    .eq('user_id', userId)
    .maybeSingle()
  if (entryError) return json({ error: entryError.message }, 500)
  if (!entry) return json({ error: 'Entry not found' }, 404)
  await admin
    .from('health_journal_entries')
    .update({ shared_at: sharedAt })
    .eq('id', entryId)
    .eq('user_id', userId)

  const ctx = await loadCompanionContext(admin, userId, today)
  if ('error' in ctx) return ctx.error
  const e = entry as { title?: string; body?: string }
  return await reactToModel(
    admin,
    userId,
    entryReactPrompt(e.title ?? '', e.body ?? '', ctx.signals, today, lang),
    300,
    stream,
  )
}
