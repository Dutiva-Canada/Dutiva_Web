import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFn, invokeEdgeFnStream } from '@/lib/edgeStream'
import { todayDayKey } from './healthStats'
import {
  checkInFromRow,
  habitFromRow,
  habitLogFromRow,
  journalFromRow,
  type HealthCheckIn,
  type HealthHabit,
  type HealthJournalEntry,
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

export async function loadHealthState(): Promise<HealthState> {
  const client = requireSupabase()
  const [checkInsRes, entriesRes, habitsRes, habitLogsRes] = await Promise.all([
    client.from('health_checkins').select('*').order('created_at', { ascending: false }),
    client.from('health_journal_entries').select('*').order('created_at', { ascending: false }),
    client.from('health_habits').select('*').order('created_at', { ascending: false }),
    client.from('health_habit_logs').select('*').order('day', { ascending: false }),
  ])
  for (const res of [checkInsRes, entriesRes, habitsRes, habitLogsRes]) {
    if (res.error) throw res.error
  }
  return {
    checkIns: (checkInsRes.data ?? []).map(checkInFromRow),
    entries: (entriesRes.data ?? []).map(journalFromRow),
    habits: (habitsRes.data ?? []).map(habitFromRow),
    habitLogs: (habitLogsRes.data ?? []).map(habitLogFromRow),
    lastLoadedAt: new Date().toISOString(),
  }
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

/** Streaming path — see src/lib/edgeStream.ts for the event contract. */
async function invokeHealthAiStream(
  body: Record<string, unknown>,
  onDelta: (text: string) => void,
): Promise<Record<string, unknown>> {
  return invokeEdgeFnStream(requireSupabase(), 'health-ai', body, onDelta)
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
  type: 'mark_habit_done' | 'unmark_habit_done' | 'add_habit' | 'add_checkin' | 'add_journal_entry'
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
  /** Thumbs rating the user left on an assistant turn: 1 | -1 | null. */
  feedback: number | null
  createdAt: string
  /** Client-only — an optimistic user turn whose send threw; the bubble
      keeps the text and offers a retry instead of vanishing. */
  failed?: boolean
}

/** One turn of the portal conversation. The server writes both sides to
    health_chat_messages, so history is consistent across sessions — the
    caller only sends the message, the day (local), and the locale. Mira
    replies over the caller's own context assembled server-side: numbers,
    habit status, recent check-in notes and excerpts of shared journal
    entries, and the conversation itself. assistantId is the persisted
    row's id — the client needs it to attach feedback. Pass onDelta to
    stream the reply into the UI as it generates. */
export async function sendHealthChat(
  message: string,
  lang: 'en' | 'fr',
  onDelta?: (text: string) => void,
): Promise<{ reply: string; action: HealthChatAction | null; assistantId: string | null }> {
  const body = { kind: 'chat', message, lang, today: todayDayKey() }
  const raw = (onDelta
    ? await invokeHealthAiStream(body, onDelta)
    : await invokeHealthAi(body)) as {
    reply?: string
    action?: HealthChatAction | null
    assistantId?: string | null
  }
  if (typeof raw.reply !== 'string' || raw.reply.trim() === '') {
    throw new Error('Empty reply from health-ai')
  }
  return { reply: raw.reply, action: raw.action ?? null, assistantId: raw.assistantId ?? null }
}

/** Reverses the write an assistant turn's action made — unmark the habit,
    remove the added row. The turn keeps a record marked undone. */
export async function undoHealthChatAction(messageId: string): Promise<void> {
  await invokeHealthAi({ kind: 'chat_undo', messageId })
}

/* ---------- reactions — Mira noticing what the user just did ---------- */

export type HealthReactEvent =
  | { type: 'checkin_saved'; mood: number; energy?: number | null; note?: string }
  | { type: 'habit_marked'; habit: string }

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

/** Thumbs up/down on one assistant turn (1 | -1 | 0 to clear). Routed
    through the function — it constrains the write to the caller's own
    assistant rows. */
export async function rateHealthChatTurn(messageId: string, rating: 1 | -1 | 0): Promise<void> {
  await invokeHealthAi({ kind: 'chat_feedback', messageId, rating })
}

export async function loadHealthChatHistory(
  limit = 60,
  before?: string,
): Promise<HealthChatTurn[]> {
  const data = await invokeHealthAi({ kind: 'chat_history', limit, before })
  const rows = (((data as { turns?: unknown } | null)?.turns ?? []) as Record<string, unknown>[])
  return rows.map((r) => ({
    id: String(r.id ?? ''),
    role: (r.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
    content: String(r.content ?? ''),
    action: (r.action as HealthChatAction | null) ?? null,
    feedback: r.feedback === 1 || r.feedback === -1 ? r.feedback : null,
    createdAt: String(r.created_at ?? ''),
  }))
}

/** Clears the whole conversation for the signed-in user — routed through the
    function so the table's writer stays server-side. */
export async function clearHealthChat(): Promise<void> {
  await invokeHealthAi({ kind: 'chat_clear' })
}
