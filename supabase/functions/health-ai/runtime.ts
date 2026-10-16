import { type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { fileSuggestion, textDedupeKey } from '../_shared/agentQueue.ts'
import {
  postChatCompletion,
  readUpstreamCompletion,
  readUpstreamText,
  routeBodyExtras,
  routeMaxTokens,
  type ApiKeyResult,
} from '../_shared/modelUpstream.ts'
import { activeModelRoute, routeApiKey, type ResolvedRoute } from '../_shared/aiRoute.ts'
import {
  buildCompanionSignals,
  buildHealthRepairNote,
  buildHabitStatuses,
  buildHealthFacts,
  chatPrompt,
  detectHealthFlags,
  entryReactPrompt,
  HEALTH_FALLBACK_EN,
  HEALTH_FALLBACK_FR,
  HEALTH_REACT_FALLBACK_EN,
  HEALTH_REACT_FALLBACK_FR,
  lowMoodPatchEligible,
  parseChatReply,
  reactPrompt,
  resolveHabitRef,
  type CheckInNoteRow,
  type ChatReply,
  type HabitLogRowLite,
  type HabitStatus,
  type HealthFacts,
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
/* The reasoning pass streams to the thinking panel live, so a longer honest
   call stays transparent — 45s was starving deep replies. */
export const UPSTREAM_TIMEOUT_MS = 120_000

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
  /** Durable facts the person asked Mira to hold — health_memories rows,
      user-written or review-accepted. Context, never permission. */
  memories: string[]
  /** Row counts behind the context — chat echoes them back so the reply's
      "what she drew on" line can say plainly what was in scope. */
  counts: { checkins: number; habits: number; journals: number; memories: number }
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
    { data: memories, error: mError },
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
    admin
      .from('health_memories')
      .select('text')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(24),
  ])
  if (ciError) return { error: json({ error: ciError.message }, 500) }
  if (hError) return { error: json({ error: hError.message }, 500) }
  if (lError) return { error: json({ error: lError.message }, 500) }
  if (jError) return { error: json({ error: jError.message }, 500) }
  if (mError) return { error: json({ error: mError.message }, 500) }

  const habitRows = (habits ?? []) as HabitRowLite[]
  const logRows = (logs ?? []) as HabitLogRowLite[]
  const noteRows = (checkIns ?? []) as CheckInNoteRow[]
  return {
    facts: buildHealthFacts(noteRows, habitRows, logRows, FACTS_DAYS, new Date().toISOString()),
    statuses: buildHabitStatuses(habitRows, logRows, today, logsSince),
    habitNames: habitRows.map((h) => h.name),
    signals: buildCompanionSignals(noteRows, (journals ?? []) as JournalExcerptRow[]),
    memories: ((memories ?? []) as { text: string }[]).map((m) => m.text),
    counts: {
      checkins: noteRows.length,
      habits: habitRows.length,
      /* Bounded excerpts only — the query already filters to shared_at. */
      journals: (journals ?? []).length,
      memories: (memories ?? []).length,
    },
  }
}

/** Model-route + key resolution, shared by the model-backed kinds. */
export async function modelRoute(
  admin: SupabaseClient,
): Promise<{ error: Response } | { found: ResolvedRoute; keyResult: Extract<ApiKeyResult, { apiKey: unknown }> }> {
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
  threadId: string | null,
  reasoning: string,
): Promise<{ userId: string | null; assistantId: string | null }> {
  const nowIso = new Date().toISOString()
  const { data: userRow } = await admin
    .from('health_chat_messages')
    .insert({
      user_id: userId,
      role: 'user',
      content: message,
      thread_id: threadId,
      created_at: nowIso,
    })
    .select('id')
    .single()
  const { data: assistantRow } = await admin
    .from('health_chat_messages')
    .insert({
      user_id: userId,
      role: 'assistant',
      content: reply,
      action: executed,
      thread_id: threadId,
      reasoning: reasoning || null,
      created_at: new Date(Date.parse(nowIso) + 1).toISOString(),
    })
    .select('id')
    .single()
  /* A named thread takes its title from the first user message — set only
     while the title is still null, so a later turn never renames it. */
  if (threadId) {
    await admin
      .from('health_chat_threads')
      .update({ title: message.slice(0, 80) })
      .eq('id', threadId)
      .eq('user_id', userId)
      .is('title', null)
  }
  return { userId: userRow?.id ?? null, assistantId: assistantRow?.id ?? null }
}

export async function runChat(
  admin: SupabaseClient,
  userId: string,
  message: string,
  today: string,
  lang: 'en' | 'fr',
  stream: boolean,
  advice: boolean,
  threadId: string | null = null,
  opts?: {
    /** Message-row ids this reply supersedes — excluded from the history
        window so a stale answer can't anchor a re-ask. */
    excludeIds?: string[]
    /** Cleanup that may only run once the fresh pair persists — a
        regenerate's stale-pair delete lives here so a failed call loses
        nothing. */
    afterPersist?: () => Promise<void>
  },
): Promise<Response> {
  const route = await modelRoute(admin)
  if ('error' in route) return route.error
  const { found, keyResult } = route

  /* Context history scopes to the same thread — a named conversation must
     not leak turns from the default one into the model window. */
  let histQuery = admin
    .from('health_chat_messages')
    .select('role, content')
    .eq('user_id', userId)
  histQuery = threadId === null
    ? histQuery.is('thread_id', null)
    : histQuery.eq('thread_id', threadId)
  if (opts?.excludeIds?.length) {
    histQuery = histQuery.not('id', 'in', `(${opts.excludeIds.join(',')})`)
  }
  const runAfterPersist = async () => {
    if (!opts?.afterPersist) return
    try {
      await opts.afterPersist()
    } catch (e) {
      console.warn('afterPersist cleanup failed', e)
    }
  }
  const [ctx, { data: historyRows, error: histError }] = await Promise.all([
    loadCompanionContext(admin, userId, today),
    histQuery.order('created_at', { ascending: false }).limit(CHAT_HISTORY),
  ])
  if ('error' in ctx) return ctx.error
  if (histError) return json({ error: histError.message }, 500)

  const history = ((historyRows ?? []) as { role: string; content: string }[])
    .reverse()
    .map((r) => ({
      role: r.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: r.content.slice(0, 1500),
    }))

  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    chatPrompt(ctx.facts, ctx.statuses, ctx.signals, today, lang, advice, ctx.memories),
    ...history,
    { role: 'user', content: message },
  ]

  /* Post-generation boundary — runs on every reply, either tier. The
     clinical line binds everyone (never diagnose, never name illness,
     medication, or treatment); external replies also get the directed-
     suggestion screen — the external register sanctions one small
     offered suggestion, not directives. A flag buys ONE non-streamed
     repair round; a still-flagged reply is replaced with the fixed
     fallback and loses its suggests and action — both came from the same
     drifted payload, and an unasked action is half the leak. */
  const screenReply = async (draft: ChatReply): Promise<{ reply: ChatReply; reasoning: string }> => {
    const flags = detectHealthFlags(draft.reply, lang, advice)
    if (flags.length === 0) return { reply: draft, reasoning: '' }
    console.warn('health-ai reply crossed a boundary line', JSON.stringify(flags))
    try {
      const repair = await postChatCompletion(
        found.provider,
        keyResult.apiKey,
        {
          model: found.modelName,
          messages: [
            ...messages,
            { role: 'assistant', content: JSON.stringify({ reply: draft.reply, suggests: draft.suggests ?? [] }) },
            { role: 'user', content: buildHealthRepairNote(flags, advice) },
          ],
          temperature: 0.4,
          max_tokens: routeMaxTokens(found.config, 3000),
          ...routeBodyExtras(found.config),
        },
        UPSTREAM_TIMEOUT_MS,
      )
      if (repair.ok) {
        const payload = (await repair.json()) as {
          choices?: { message?: { content?: string; reasoning_content?: string } }[]
        }
        const msg = payload.choices?.[0]?.message ?? {}
        const repaired = parseChatReply(typeof msg.content === 'string' ? msg.content : null)
        if (repaired && detectHealthFlags(repaired.reply, lang, advice).length === 0) {
          return {
            reply: repaired,
            reasoning:
              typeof msg.reasoning_content === 'string' ? msg.reasoning_content : '',
          }
        }
      }
    } catch (e) {
      console.warn('health-ai repair call failed; suppressing flagged reply', e)
    }
    console.warn('health-ai boundary-flagged reply suppressed', JSON.stringify(flags))
    return {
      reply: {
        ...draft,
        reply: lang === 'fr' ? HEALTH_FALLBACK_FR : HEALTH_FALLBACK_EN,
        suggests: [],
        action: null,
      },
      reasoning: '',
    }
  }

  let upstream: Response
  try {
    upstream = await postChatCompletion(
      found.provider,
      keyResult.apiKey,
      {
        model: found.modelName,
        messages,
        temperature: 0.4,
        /* Reasoning params from the route share this budget — headroom so a
           thinking pass can't starve the reply. Route config wins; the
           default leaves room for a fuller read when the person asks for
           their numbers or a plan. */
        max_tokens: routeMaxTokens(found.config, 3000),
        stream,
        ...routeBodyExtras(found.config),
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
    /* SSE out, SSE in — but the reply text no longer streams mid-flight:
       it buffers through readUpstreamCompletion so the boundary screen
       sees the whole reply before a word reaches the bubble, then leaves
       as one delta. Reasoning still streams live to the thinking panel;
       the action JSON never did reach the bubble anyway. The done event
       carries the parsed payload + row ids. */
    const sse = sseChannel()
    void (async () => {
      try {
        const { text: fullText, reasoning } = await readUpstreamCompletion(
          upstream,
          () => {},
          (piece) => sse.send({ type: 'reasoning', text: piece }),
        )
        const draft: ChatReply | null = parseChatReply(fullText)
        if (!draft) {
          sse.send({ type: 'error', error: 'Model returned no usable reply', code: 'unparseable' })
          return
        }
        const screened = await screenReply(draft)
        const parsed = screened.reply
        const allReasoning = [reasoning, screened.reasoning].filter(Boolean).join('\n\n')
        sse.send({ type: 'delta', text: parsed.reply })
        const executed = parsed.action
          ? await executeChatAction(admin, userId, parsed.action, ctx.statuses, today)
          : null
        const ids = await persistChatTurns(
          admin, userId, message, parsed.reply, executed, threadId, allReasoning,
        )
        await runAfterPersist()
        sse.send({
          type: 'done',
          reply: parsed.reply,
          action: executed,
          suggests: parsed.suggests,
          reasoning: allReasoning || null,
          /* What the reply could see — counts only, surfaced as the "drew
             on" line under the answer. */
          context: ctx.counts,
          ...ids,
        })
      } catch (e) {
        sse.send({ type: 'error', error: e instanceof Error ? e.message : 'stream failed' })
      } finally {
        sse.close()
      }
    })()
    return sse.response
  }

  const payload = (await upstream.json()) as {
    choices?: { message?: { content?: string; reasoning_content?: string } }[]
  }
  const msg = payload.choices?.[0]?.message ?? {}
  const draft: ChatReply | null = parseChatReply(msg.content)
  if (!draft) return json({ error: 'Model returned no usable reply', code: 'unparseable' }, 502)

  const screened = await screenReply(draft)
  const parsed = screened.reply
  const reasoning = [typeof msg.reasoning_content === 'string' ? msg.reasoning_content : '', screened.reasoning]
    .filter(Boolean)
    .join('\n\n')

  const executed = parsed.action
    ? await executeChatAction(admin, userId, parsed.action, ctx.statuses, today)
    : null
  const ids = await persistChatTurns(
    admin, userId, message, parsed.reply, executed, threadId, reasoning,
  )
  await runAfterPersist()

  return json({
    reply: parsed.reply,
    action: executed,
    suggests: parsed.suggests,
    reasoning: reasoning || null,
    context: ctx.counts,
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
    /* Not a write — a proposal. The memory lands in the review queue and
       only becomes real if the person accepts it there. */
    case 'propose_memory': {
      const filed = await fileSuggestion(admin, {
        userId,
        surface: 'health',
        kind: 'memory',
        title: action.text,
        payload: { text: action.text },
        source: 'model',
        dedupeKey: textDedupeKey(action.text),
      })
      return {
        type: action.type,
        detail: action.text,
        ok: filed != null,
        refId: filed?.id,
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
    /* A memory proposal is reversible while it sits in the queue — undo
       dismisses the pending suggestion row. Once resolved it stays: the
       person already decided. */
    case 'propose_memory': {
      const { data, error } = await admin
        .from('agent_suggestions')
        .update({
          status: 'dismissed',
          resolved_at: new Date().toISOString(),
          resolved_action: 'undone',
        })
        .eq('id', action.refId as string)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .select('id')
      return !error && (data?.length ?? 0) > 0
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

/* parseReactEvent lives in handlers.ts — pure, so vitest can reach it. */

/** Model call → plain text → persist an assistant turn. Shared by both
    reaction kinds; differs from runChat in prompt shape only. The reply
    buffers for the boundary screen in either mode — a reaction is one or
    two sentences, too small to earn a repair round, so a flag goes
    straight to the fixed one-liner. */
async function reactToModel(
  admin: SupabaseClient,
  userId: string,
  prompt: string,
  maxTokens: number,
  stream: boolean,
  lang: 'en' | 'fr',
  advice: boolean,
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

  /* A flagged reaction goes straight to the fixed one-liner — no repair
     round for a two-sentence reply. */
  const screenText = (raw: string): string => {
    const flags = detectHealthFlags(raw, lang, advice)
    if (flags.length === 0) return raw
    console.warn('health-ai reaction crossed a boundary line; fixed reply substituted', JSON.stringify(flags))
    return lang === 'fr' ? HEALTH_REACT_FALLBACK_FR : HEALTH_REACT_FALLBACK_EN
  }

  if (stream) {
    const sse = sseChannel()
    void (async () => {
      try {
        /* The text buffers through the screen — nothing streams to the
           bubble until the boundary check has seen all of it. */
        const draft = (await readUpstreamText(upstream, () => {})).trim()
        if (!draft) {
          sse.send({ type: 'error', error: 'Model returned empty text', code: 'empty' })
          return
        }
        const reply = screenText(draft)
        sse.send({ type: 'delta', text: reply })
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
  const draft = (payload.choices?.[0]?.message?.content ?? '').trim()
  if (!draft) return json({ error: 'Model returned empty text', code: 'empty' }, 502)
  const reply = screenText(draft)

  const { data: row } = await admin
    .from('health_chat_messages')
    .insert({ user_id: userId, role: 'assistant', content: reply })
    .select('id')
    .single()
  return json({ reply, assistantId: row?.id ?? null })
}

/* ── Proactive pattern suggestions ─────────────────────────────────────────
   Not a sweep cron — a rule that fires on the moments that carry the data
   (a check-in saved or revised). When the window shows a sustained low
   patch, one gentle habit proposal lands in the review queue — deduped
   while pending, cooled for 30 days once resolved (dismissed means "don't
   ask again"; accepted means they took it). Proposed, never added. */

const LOW_MOOD_SUGGEST_KEY = 'auto:low-mood-walk'
const LOW_MOOD_COOLDOWN_MS = 30 * 86_400_000

async function maybeFilePatternSuggestion(
  admin: SupabaseClient,
  userId: string,
  facts: HealthFacts,
  statuses: HabitStatus[],
  lang: 'en' | 'fr',
): Promise<void> {
  /* The eligibility rule itself lives in handlers (pure, tested) — what
     stays here is the filing machinery: resolved-cooldown lookup, dedupe,
     best-effort insert. */
  if (!lowMoodPatchEligible(facts, statuses)) return
  try {
    const since = new Date(Date.now() - LOW_MOOD_COOLDOWN_MS).toISOString()
    const { data: resolved } = await admin
      .from('agent_suggestions')
      .select('id')
      .eq('user_id', userId)
      .eq('surface', 'health')
      .eq('kind', 'habit')
      .eq('dedupe_key', LOW_MOOD_SUGGEST_KEY)
      .gte('resolved_at', since)
      .limit(1)
    if ((resolved ?? []).length > 0) return
    const name = lang === 'fr' ? 'Une courte marche en soirée' : 'A short evening walk'
    const why =
      lang === 'fr'
        ? 'Vos bilans sont plus bas dernièrement — une petite habitude dehors est le point de départ le plus doux.'
        : 'Your check-ins have been running low lately — a small outside habit is the gentlest place to start.'
    await fileSuggestion(admin, {
      userId,
      surface: 'health',
      kind: 'habit',
      title: name,
      payload: { name, why },
      source: 'rule',
      dedupeKey: LOW_MOOD_SUGGEST_KEY,
    })
  } catch {
    /* best-effort — a failed filing never touches the reaction */
  }
}

export async function runReact(
  admin: SupabaseClient,
  userId: string,
  event: ReactEvent,
  today: string,
  lang: 'en' | 'fr',
  stream: boolean,
  advice: boolean,
): Promise<Response> {
  const ctx = await loadCompanionContext(admin, userId, today)
  if ('error' in ctx) return ctx.error
  /* The proactive rule rides the check-in moments — the context is already
     loaded, and the filing happens before the model call so a slow or
     failed reply never delays it. Bounded: two indexed reads + one insert. */
  if (event.type === 'checkin_saved' || event.type === 'checkin_edited') {
    await maybeFilePatternSuggestion(admin, userId, ctx.facts, ctx.statuses, lang)
  }
  /* The client names the habit; the streak is resolved server-side from the
     rows already fetched, so the reaction can say "three days running" —
     or "90+", honestly, when the run outlives the fetched window. */
  const marked = event.type === 'habit_marked' ? resolveHabitRef(event.habit, ctx.statuses) : null
  return await reactToModel(
    admin,
    userId,
    reactPrompt(
      event,
      marked?.streak ?? null,
      ctx.signals,
      today,
      lang,
      advice,
      ctx.memories,
      marked?.streakCapped ?? false,
    ),
    160,
    stream,
    lang,
    advice,
  )
}

export async function runEntryReact(
  admin: SupabaseClient,
  userId: string,
  entryId: string,
  today: string,
  lang: 'en' | 'fr',
  stream: boolean,
  advice: boolean,
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
    entryReactPrompt(e.title ?? '', e.body ?? '', ctx.signals, today, lang, advice, ctx.memories),
    300,
    stream,
    lang,
    advice,
  )
}
