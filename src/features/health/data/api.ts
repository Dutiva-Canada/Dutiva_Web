import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFn, invokeEdgeFnStream } from '@/lib/edgeStream'
import { todayDayKey } from './healthStats'
import {
  checkInFromRow,
  habitFromRow,
  habitLogFromRow,
  journalFromRow,
  memoryFromRow,
  type HealthCheckIn,
  type HealthHabit,
  type HealthJournalEntry,
  type HealthMemory,
  type HealthState,
} from './types'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase client unavailable — check env vars.')
  return supabase
}

async function requireUserId(): Promise<string> {
  const client = requireSupabase()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) throw new Error('Not signed in.')
  return user.id
}

/** Grant gate — true when the signed-in user has a health_access row. */
export async function hasHealthAccess(): Promise<boolean> {
  const client = requireSupabase()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) return false
  const { data, error } = await client
    .from('health_access')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) throw error
  return !!data
}

/* Row caps — every stat the portal derives fits inside these windows
   (14-day charts, streaks, today's ticks), so the fetch stays bounded as
   the account ages. A check-in streak longer than CHECKIN_CAP days would
   under-report at the cap's edge; journal gets a pager instead since
   bodies are heavy and the archive is browsed. Totals come from head
   counts so capped lists never show a wrong number. */
const CHECKIN_CAP = 400
const JOURNAL_CAP = 100
const HABIT_CAP = 200
const HABIT_LOG_CAP = 1500
const MEMORY_CAP = 300
export const JOURNAL_PAGE = 50

export async function loadHealthState(): Promise<HealthState> {
  const client = requireSupabase()
  const [
    checkInsRes,
    checkInsCountRes,
    entriesRes,
    entriesCountRes,
    habitsRes,
    habitLogsRes,
    memoriesRes,
    reviewRes,
  ] = await Promise.all([
    client
      .from('health_checkins')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(CHECKIN_CAP),
    client.from('health_checkins').select('id', { count: 'exact', head: true }),
    client
      .from('health_journal_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(JOURNAL_CAP),
    client.from('health_journal_entries').select('id', { count: 'exact', head: true }),
    client
      .from('health_habits')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(HABIT_CAP),
    client
      .from('health_habit_logs')
      .select('*')
      .order('day', { ascending: false })
      .limit(HABIT_LOG_CAP),
    client
      .from('health_memories')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(MEMORY_CAP),
    client
      .from('agent_suggestions')
      .select('id', { count: 'exact', head: true })
      .eq('surface', 'health')
      .eq('status', 'pending'),
  ])
  for (const res of [
    checkInsRes,
    checkInsCountRes,
    entriesRes,
    entriesCountRes,
    habitsRes,
    habitLogsRes,
    memoriesRes,
    reviewRes,
  ]) {
    if (res.error) throw res.error
  }
  return {
    checkIns: (checkInsRes.data ?? []).map(checkInFromRow),
    checkInsTotal: checkInsCountRes.count ?? undefined,
    entries: (entriesRes.data ?? []).map(journalFromRow),
    entriesTotal: entriesCountRes.count ?? undefined,
    habits: (habitsRes.data ?? []).map(habitFromRow),
    habitLogs: (habitLogsRes.data ?? []).map(habitLogFromRow),
    memories: (memoriesRes.data ?? []).map(memoryFromRow),
    pendingReview: reviewRes.count ?? undefined,
    lastLoadedAt: new Date().toISOString(),
  }
}

/** Older journal pages — the state fetch keeps the newest JOURNAL_CAP rows;
    the journal's "load earlier" walks back from the oldest shown. The id
    tiebreaker keeps same-timestamp rows (a fast double-save, a bulk import)
    from slipping between pages. */
export async function listJournalEntriesBefore(
  before: { createdAt: string; id: string },
  limit: number = JOURNAL_PAGE,
): Promise<HealthJournalEntry[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('health_journal_entries')
    .select('*')
    .or(
      `created_at.lt.${before.createdAt},and(created_at.eq.${before.createdAt},id.lt.${before.id})`,
    )
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map(journalFromRow)
}

export async function addCheckIn(input: {
  mood: number
  energy?: number | null
  note?: string
}): Promise<HealthCheckIn> {
  const client = requireSupabase()
  const userId = await requireUserId()
  const { data, error } = await client
    .from('health_checkins')
    .insert({
      user_id: userId,
      mood: input.mood,
      energy: input.energy ?? null,
      note: (input.note ?? '').trim(),
    })
    .select()
    .single()
  if (error) throw error
  return checkInFromRow(data)
}

export async function deleteCheckIn(id: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.from('health_checkins').delete().eq('id', id)
  if (error) throw error
}

/** Revise a saved check-in — mood/energy/note overwrite; created_at keeps
    the moment it was logged (an edit changes the record, not the day). */
export async function updateCheckIn(
  id: string,
  patch: { mood: number; energy?: number | null; note?: string },
): Promise<void> {
  const client = requireSupabase()
  const { error } = await client
    .from('health_checkins')
    .update({
      mood: patch.mood,
      energy: patch.energy ?? null,
      ...(patch.note !== undefined ? { note: patch.note.trim() } : {}),
    })
    .eq('id', id)
  if (error) throw error
}

/* ---------- memories — things the person asked Mira to hold ---------- */

/** Add a memory by hand (source 'manual'). Mira's own proposals go through
    the review queue and arrive with source 'mira'. */
export async function addHealthMemory(
  text: string,
  source: 'manual' | 'mira' = 'manual',
): Promise<HealthMemory> {
  const client = requireSupabase()
  const userId = await requireUserId()
  const { data, error } = await client
    .from('health_memories')
    .insert({ user_id: userId, text: text.trim().slice(0, 500), source })
    .select()
    .single()
  if (error) throw error
  return memoryFromRow(data)
}

export async function deleteHealthMemory(id: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.from('health_memories').delete().eq('id', id)
  if (error) throw error
}

/** Revise a stored memory's text — source provenance stays as filed. */
export async function updateHealthMemory(id: string, text: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client
    .from('health_memories')
    .update({ text: text.trim().slice(0, 500) })
    .eq('id', id)
  if (error) throw error
}

export async function addJournalEntry(input: {
  title?: string
  body: string
}): Promise<HealthJournalEntry> {
  const client = requireSupabase()
  const userId = await requireUserId()
  const now = new Date().toISOString()
  const { data, error } = await client
    .from('health_journal_entries')
    .insert({
      user_id: userId,
      title: (input.title ?? '').trim(),
      body: input.body,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()
  if (error) throw error
  return journalFromRow(data)
}

export async function updateJournalEntry(
  id: string,
  patch: { title?: string; body?: string },
): Promise<void> {
  const client = requireSupabase()
  const { error } = await client
    .from('health_journal_entries')
    .update({
      ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
      ...(patch.body !== undefined ? { body: patch.body } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.from('health_journal_entries').delete().eq('id', id)
  if (error) throw error
}

/* ---------- daily habits ---------- */

export async function addHabit(name: string): Promise<HealthHabit> {
  const client = requireSupabase()
  const userId = await requireUserId()
  const { data, error } = await client
    .from('health_habits')
    .insert({ user_id: userId, name: name.trim() })
    .select()
    .single()
  if (error) throw error
  return habitFromRow(data)
}

export async function deleteHabit(id: string): Promise<void> {
  const client = requireSupabase()
  /* The log rows cascade on habit_id, so this removes its history too. */
  const { error } = await client.from('health_habits').delete().eq('id', id)
  if (error) throw error
}

/** Rename a habit — keeps the log history, unlike delete-and-recreate. */
export async function updateHabit(id: string, name: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client
    .from('health_habits')
    .update({ name: name.trim() })
    .eq('id', id)
  if (error) throw error
}

/** Mark a habit done/not-done on a day. `day` is local YYYY-MM-DD — the
    portal tracks "did it today" in the user's own timezone, so the toggle
    upserts by the (habit_id, day) uniqueness the migration enforces. */
export async function setHabitDone(
  habitId: string,
  day: string,
  done: boolean,
): Promise<void> {
  const client = requireSupabase()
  if (!done) {
    const { error } = await client
      .from('health_habit_logs')
      .delete()
      .eq('habit_id', habitId)
      .eq('day', day)
    if (error) throw error
    return
  }
  const userId = await requireUserId()
  const { error } = await client
    .from('health_habit_logs')
    .upsert(
      { user_id: userId, habit_id: habitId, day },
      { onConflict: 'habit_id,day', ignoreDuplicates: true },
    )
  if (error) throw error
}

/* ---------- health-ai: Mira's model assists — every kind reads the user's
   own check-in notes and bounded excerpts of shared journal entries
   server-side, plus the aggregates. Disclosed in the wellness notice.
   --------------------------------------------------------------------- */

/** The invoke path — one JSON response per request. */
async function invokeHealthAi(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  return invokeEdgeFn(requireSupabase(), 'health-ai', body)
}

/** Streaming path — see src/lib/edgeStream.ts for the event contract.
    onReasoning receives the thinking trace as it streams, cumulative. */
async function invokeHealthAiStream(
  body: Record<string, unknown>,
  onDelta: (text: string) => void,
  signal?: AbortSignal,
  onReasoning?: (text: string) => void,
): Promise<Record<string, unknown>> {
  return invokeEdgeFnStream(requireSupabase(), 'health-ai', body, onDelta, signal, onReasoning)
}

/** One journal prompt built from the user's stats and their own recent
    words — a suggestion to write about, not advice. */
export async function healthAiPrompt(lang: 'en' | 'fr'): Promise<string> {
  const client = requireSupabase()
  const { data, error } = await client.functions.invoke('health-ai', {
    body: { kind: 'reflect', lang },
  })
  if (error) throw error
  const raw = (data as { prompt?: string } | null) ?? {}
  if (typeof raw.prompt !== 'string' || raw.prompt.trim() === '') {
    throw new Error('Empty prompt from health-ai')
  }
  return raw.prompt
}

/** A short weekly summary over the same context — describes what the
    numbers and the notes say, never advises. */
export async function healthAiRecap(lang: 'en' | 'fr'): Promise<string> {
  const client = requireSupabase()
  const { data, error } = await client.functions.invoke('health-ai', {
    body: { kind: 'recap', lang },
  })
  if (error) throw error
  const raw = (data as { summary?: string } | null) ?? {}
  if (typeof raw.summary !== 'string' || raw.summary.trim() === '') {
    throw new Error('Empty recap from health-ai')
  }
  return raw.summary
}

export interface HabitSuggestion {
  name: string
  why: string
  /** agent_suggestions row id — null when the queue write didn't land. */
  suggestionId: string | null
}

/** One small habit the user isn't already tracking — suggested from habit
    names, streaks, and what the user has been writing. The user still adds
    (or dismisses) it. */
export async function healthAiHabit(lang: 'en' | 'fr'): Promise<HabitSuggestion> {
  const client = requireSupabase()
  const { data, error } = await client.functions.invoke('health-ai', {
    body: { kind: 'habit', lang },
  })
  if (error) throw error
  const raw = (data as {
    habit?: { name?: string; why?: string }
    suggestionId?: string | null
  } | null) ?? {}
  if (!raw.habit || typeof raw.habit.name !== 'string' || raw.habit.name.trim() === '') {
    throw new Error('Empty habit suggestion from health-ai')
  }
  return {
    name: raw.habit.name,
    why: raw.habit.why ?? '',
    suggestionId: raw.suggestionId ?? null,
  }
}

/* ---------- chat — Mira, the portal companion ---------- */

/** A write the companion executed on the user's own rows during a turn —
    additive or undoable by design (see health-ai's action grammar). */
export interface HealthChatAction {
  type:
    | 'mark_habit_done'
    | 'unmark_habit_done'
    | 'add_habit'
    | 'add_checkin'
    | 'add_journal_entry'
    | 'propose_memory'
  /** Human-facing subject — the habit name, entry title, "mood 3/5". */
  detail: string
  ok: boolean
  /** Row the action created/toggled — chat_undo needs it. */
  refId?: string
  /** Local day a habit mark/unmark landed on — undo needs it back. */
  day?: string
  /** Set once the write was reversed via chat_undo. */
  undone?: boolean
}

export interface HealthChatTurn {
  id: string
  role: 'user' | 'assistant'
  content: string
  action: HealthChatAction | null
  /** The model's thinking trace — set on assistant turns when the route
      reasons; null when it doesn't. */
  reasoning?: string | null
  /** Thumbs rating the user left on an assistant turn: 1 | -1 | null. */
  feedback: number | null
  /** Why a downvote landed — set when feedback is -1. */
  feedbackReason?: string | null
  createdAt: string
  /** Client-only — an optimistic user turn whose send threw; the bubble
      keeps the text and offers a retry instead of vanishing. */
  failed?: boolean
  /** Client-only — the reader pressed Stop mid-stream; the partial reply
      is kept but flagged so it can't pass for a complete answer. */
  stopped?: boolean
  /** Client-only — the sent message matched the distress screen; the page
      pins the crisis line under the bubble until dismissed. */
  distress?: boolean
  /** What the reply could see, echoed back with it — the "drew on" line.
      Only present on turns this session wrote; not persisted. */
  contextUsed?: HealthChatContext | null
}

/** Row counts the reply was generated over — surfaced under fresh answers
    as the "drew on" transparency line. Counts only, never content. */
export interface HealthChatContext {
  checkins: number
  habits: number
  memories: number
  journals: number
}

/** A named conversation — the default thread (threadId null) always exists;
    these are extra ones the user started from the switcher. */
export interface HealthChatThread {
  id: string
  title: string | null
  createdAt: string
  /** Newest message stamp in this thread — the switcher dots a thread whose
      activity the reader hasn't opened yet. */
  lastActivityAt?: string | null
}

/** Options every chat call shares — thread scope plus abort for the
    streaming path's stop button. */
export interface HealthChatCallOpts {
  threadId?: string | null
  signal?: AbortSignal
  /** Live thinking trace — cumulative text per reasoning piece. Streamed
      path only. */
  onReasoning?: (text: string) => void
}

/** One turn of the portal conversation. The server writes both sides to
    health_chat_messages, so history is consistent across sessions — the
    caller only sends the message, the day (local), and the locale. Mira
    replies over the caller's own context assembled server-side: numbers,
    habit status, recent check-in notes and excerpts of shared journal
    entries, and the conversation itself. assistantId is the persisted
    row's id — the client needs it to attach feedback. Pass onDelta to
    stream the reply into the UI as it generates. */
export interface HealthChatSendResult {
  reply: string
  action: HealthChatAction | null
  /** The persisted user-row id — adopting it onto the optimistic turn is
     what keeps the history poll from re-adding it as a duplicate. */
  userId: string | null
  assistantId: string | null
  /** Short follow-up prompts the reply suggested — ephemeral chips, never
      persisted with the turn. */
  suggests: string[]
  /** The thinking trace behind the reply — null when none was emitted. */
  reasoning: string | null
  /** What the reply could see — counts only, for the "drew on" line. */
  context: HealthChatContext | null
}

function toHealthChatResult(raw: {
  reply?: string
  action?: HealthChatAction | null
  userId?: string | null
  assistantId?: string | null
  suggests?: unknown
  reasoning?: unknown
  context?: unknown
}): HealthChatSendResult {
  if (typeof raw.reply !== 'string' || raw.reply.trim() === '') {
    throw new Error('Empty reply from health-ai')
  }
  const c = raw.context as Partial<HealthChatContext> | null | undefined
  return {
    reply: raw.reply,
    action: raw.action ?? null,
    userId: raw.userId ?? null,
    assistantId: raw.assistantId ?? null,
    suggests: Array.isArray(raw.suggests)
      ? [...new Set(raw.suggests.filter((s): s is string => typeof s === 'string'))].slice(0, 3)
      : [],
    reasoning: typeof raw.reasoning === 'string' && raw.reasoning ? raw.reasoning : null,
    context: c && typeof c === 'object'
      ? {
          checkins: Number(c.checkins) || 0,
          habits: Number(c.habits) || 0,
          memories: Number(c.memories) || 0,
          journals: Number(c.journals) || 0,
        }
      : null,
  }
}

export async function sendHealthChat(
  message: string,
  lang: 'en' | 'fr',
  onDelta?: (text: string) => void,
  opts?: HealthChatCallOpts,
): Promise<HealthChatSendResult> {
  const body = {
    kind: 'chat',
    message,
    lang,
    today: todayDayKey(),
    threadId: opts?.threadId ?? null,
  }
  const raw = (onDelta
    ? await invokeHealthAiStream(body, onDelta, opts?.signal, opts?.onReasoning)
    : await invokeHealthAi(body)) as Parameters<typeof toHealthChatResult>[0]
  return toHealthChatResult(raw)
}

/** Re-run the thread's last user turn — the server drops the stale pair
    and answers fresh. Same payload shape as sendHealthChat. */
export async function regenerateHealthChat(
  lang: 'en' | 'fr',
  onDelta?: (text: string) => void,
  opts?: HealthChatCallOpts,
): Promise<HealthChatSendResult> {
  const body = {
    kind: 'chat_regenerate',
    lang,
    today: todayDayKey(),
    threadId: opts?.threadId ?? null,
  }
  const raw = (onDelta
    ? await invokeHealthAiStream(body, onDelta, opts?.signal, opts?.onReasoning)
    : await invokeHealthAi(body)) as Parameters<typeof toHealthChatResult>[0]
  return toHealthChatResult(raw)
}

/** The user's named conversations — the default thread isn't listed; it's
    always selectable as "main". `activity` maps a thread id (or 'main')
    to its newest message stamp — the switcher dots unseen activity. */
export async function listHealthChatThreads(): Promise<{
  threads: HealthChatThread[]
  activity: Record<string, string>
}> {
  const data = await invokeHealthAi({ kind: 'chat_threads' })
  const rows = (((data as { threads?: unknown } | null)?.threads ?? []) as Record<
    string,
    unknown
  >[])
  const activity = ((data as { activity?: unknown } | null)?.activity ?? {}) as Record<
    string,
    string
  >
  return {
    activity,
    threads: rows.map((r) => ({
      id: String(r.id ?? ''),
      title: typeof r.title === 'string' ? r.title : null,
      createdAt: String(r.created_at ?? ''),
      lastActivityAt: typeof activity[String(r.id ?? '')] === 'string' ? activity[String(r.id)] : null,
    })),
  }
}

/** Start a named conversation — untitled until its first message lands. */
export async function newHealthChatThread(): Promise<HealthChatThread> {
  const data = await invokeHealthAi({ kind: 'chat_thread_new' })
  const t = (data as { thread?: Record<string, unknown> } | null)?.thread
  if (!t?.id) throw new Error('Thread creation failed')
  return {
    id: String(t.id),
    title: typeof t.title === 'string' ? t.title : null,
    createdAt: String(t.created_at ?? ''),
  }
}

/** Rename a named conversation — an empty title resets to untitled. */
export async function renameHealthChatThread(threadId: string, title: string): Promise<void> {
  await invokeHealthAi({ kind: 'chat_thread_rename', threadId, title })
}

/** Delete a named conversation and its messages — the default thread can't
    be deleted, only cleared. */
export async function deleteHealthChatThread(threadId: string): Promise<void> {
  await invokeHealthAi({ kind: 'chat_thread_delete', threadId })
}

/** Delete one turn — the privacy escape short of clearing the thread. A
    user turn also drops the reply row paired with it server-side. */
export async function deleteHealthChatTurn(messageId: string): Promise<void> {
  await invokeHealthAi({ kind: 'chat_turn_delete', messageId })
}

/** Reverses the write an assistant turn's action made — unmark the habit,
    remove the added row. The turn keeps a record marked undone. */
export async function undoHealthChatAction(messageId: string): Promise<void> {
  await invokeHealthAi({ kind: 'chat_undo', messageId })
}

/* ---------- reactions — Mira noticing what the user just did ---------- */

export type HealthReactEvent =
  | { type: 'checkin_saved'; mood: number; energy?: number | null; note?: string }
  | { type: 'checkin_edited'; mood: number; energy?: number | null; note?: string }
  | { type: 'habit_marked'; habit: string }
  | { type: 'habit_added'; habit: string }
  | { type: 'memory_added'; text: string }

/* Reactions fire a model call per qualifying action — someone checking off
   three habits shouldn't produce three calls. A floor between calls keeps
   the noise and the bill down; a skipped reaction resolves reply:null and
   the page simply stays quiet. */
const REACTION_MIN_INTERVAL_MS = 90_000
let lastReactionAt = 0

/** Test hook — the throttle is module state, which carries between tests. */
export function resetHealthReactionThrottle(): void {
  lastReactionAt = 0
}

/** One short reaction to something the user just did elsewhere in the
    portal — a saved check-in or a habit marked done. The line is written
    into the conversation too (assistant turn), so it survives the session.
    Callers treat this as best-effort: a failed or throttled reaction never
    blocks the action it responds to — reply comes back null then, and the
    page shows nothing. onDelta streams the line in as it generates. */
export async function sendHealthReaction(
  event: HealthReactEvent,
  lang: 'en' | 'fr',
  onDelta?: (text: string) => void,
): Promise<{ reply: string | null; assistantId: string | null }> {
  if (Date.now() - lastReactionAt < REACTION_MIN_INTERVAL_MS) {
    return { reply: null, assistantId: null }
  }
  lastReactionAt = Date.now()
  const body = { kind: 'react', event, lang, today: todayDayKey() }
  const raw = (onDelta
    ? await invokeHealthAiStream(body, onDelta)
    : await invokeHealthAi(body)) as { reply?: string; assistantId?: string | null }
  if (typeof raw.reply !== 'string' || raw.reply.trim() === '') {
    throw new Error('Empty reaction from health-ai')
  }
  return { reply: raw.reply, assistantId: raw.assistantId ?? null }
}

/** Share ONE journal entry with Mira — explicit per-entry consent; the
    function stamps shared_at on the row (that's the consent record), reads
    only this entry's body, and the excerpt joins her context until the
    share is revoked. Her reply lands in the conversation and is returned
    here for inline display. onDelta streams it in. */
export async function shareEntryWithMira(
  entryId: string,
  lang: 'en' | 'fr',
  onDelta?: (text: string) => void,
): Promise<{ reply: string; assistantId: string | null }> {
  const body = { kind: 'entry_react', entryId, lang, today: todayDayKey() }
  const raw = (onDelta
    ? await invokeHealthAiStream(body, onDelta)
    : await invokeHealthAi(body)) as { reply?: string; assistantId?: string | null }
  if (typeof raw.reply !== 'string' || raw.reply.trim() === '') {
    throw new Error('Empty reply from health-ai')
  }
  return { reply: raw.reply, assistantId: raw.assistantId ?? null }
}

/** Revoke a journal entry's sharing — her context stops seeing its excerpt
    right away. Direct table write on the caller's own row, same path as
    editing the entry. */
export async function unshareEntryFromMira(entryId: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client
    .from('health_journal_entries')
    .update({ shared_at: null })
    .eq('id', entryId)
  if (error) throw error
}

/** Thumbs up/down on one assistant turn (1 | -1 | 0 to clear). A downvote
    may carry a one-tap `reason` so the signal says why. Routed through the
    function — it constrains the write to the caller's own assistant rows. */
export async function rateHealthChatTurn(
  messageId: string,
  rating: 1 | -1 | 0,
  reason?: string,
): Promise<void> {
  await invokeHealthAi({ kind: 'chat_feedback', messageId, rating, reason })
}

export async function loadHealthChatHistory(
  limit = 60,
  before?: string,
  threadId?: string | null,
): Promise<HealthChatTurn[]> {
  const data = await invokeHealthAi({
    kind: 'chat_history',
    limit,
    before,
    threadId: threadId ?? null,
  })
  const rows = (((data as { turns?: unknown } | null)?.turns ?? []) as Record<string, unknown>[])
  return rows.map((r) => ({
    id: String(r.id ?? ''),
    role: (r.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
    content: String(r.content ?? ''),
    action: (r.action as HealthChatAction | null) ?? null,
    reasoning: typeof r.reasoning === 'string' ? r.reasoning : null,
    feedback: r.feedback === 1 || r.feedback === -1 ? r.feedback : null,
    feedbackReason: typeof r.feedback_reason === 'string' ? r.feedback_reason : null,
    createdAt: String(r.created_at ?? ''),
  }))
}

/** Clears the current conversation for the signed-in user — scoped to the
    thread when one is selected. Routed through the function so the table's
    writer stays server-side. */
export async function clearHealthChat(threadId?: string | null): Promise<void> {
  await invokeHealthAi({ kind: 'chat_clear', threadId: threadId ?? null })
}
