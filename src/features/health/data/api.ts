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
   counts so capped lists never show a wrong number. Habit logs share one
   pool across habits — 3,000 covers ~8 years of one habit or ~2 years of
   ten before the oldest marks start clipping a streak's math. */
const CHECKIN_CAP = 400
const JOURNAL_CAP = 100
const HABIT_CAP = 200
const HABIT_LOG_CAP = 3000
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

/* The consent ledger reads its own query — filtering the state.entries
   window (newest JOURNAL_CAP) would hide shares that paged out while Mira
   can still read them. Bounded all the same: the shared set is small in
   practice, but "all my shares" should never page. */
export async function listSharedJournalEntries(
  limit = 200,
): Promise<HealthJournalEntry[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('health_journal_entries')
    .select('*')
    .not('shared_at', 'is', null)
    .order('shared_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map(journalFromRow)
}

/* Local-day columns — migration 0229 adds `day` to health_checkins and
   health_habits in one migration. Same probe contract as journal images
   and weekly targets: an unapplied migration means the column insert
   would 400 the whole write, so the key goes out only once the probe
   sees it. Without it the row keeps the created_at::date shape every
   reader already falls back to. */
let localDaysCapable: boolean | null = null

export async function localDaysAvailable(): Promise<boolean> {
  if (localDaysCapable !== null) return localDaysCapable
  try {
    const client = requireSupabase()
    const { error } = await client.from('health_checkins').select('day').limit(0)
    localDaysCapable = !error
  } catch {
    localDaysCapable = false
  }
  return localDaysCapable
}

/** Test-only: reset the cached probe between specs. */
export function resetLocalDaysProbe() {
  localDaysCapable = null
}

/** Dev-preview only: pose as migrated — a live build still answers from
    the real probe. */
export function primeLocalDaysProbe(capable: boolean) {
  localDaysCapable = capable
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
      /* The writer's local day (migration 0229) — stored so the server's
         facts bucket it on the same calendar the writer saw, not UTC. */
      ...((await localDaysAvailable()) ? { day: todayDayKey() } : {}),
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
      body: input.body.trim(),
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
  patch: { title?: string; body?: string; imagePath?: string | null },
): Promise<void> {
  const client = requireSupabase()
  const { error } = await client
    .from('health_journal_entries')
    .update({
      ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
      ...(patch.body !== undefined ? { body: patch.body.trim() } : {}),
      ...(patch.imagePath !== undefined ? { image_path: patch.imagePath } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}

/* ---------- journal photo attachments ----------

   One photo per entry, stored in the private `health-journal-images`
   bucket at `<uid>/<entry>/<file>`; the row's `image_path` column is the
   link. The bucket and its policies ship in migration 0226 — until it's
   applied, `journalImagesAvailable()` answers false and the UI simply
   doesn't offer photos (no dead button pointing at a missing bucket).
   Nothing here ever reaches Mira: her context is text excerpts only. */

const JOURNAL_IMAGE_BUCKET = 'health-journal-images'
let journalImageCapable: boolean | null = null

/** One-shot capability probe — a private bucket that doesn't exist yet
    answers with an error, and that's cached for the session. */
export async function journalImagesAvailable(): Promise<boolean> {
  if (journalImageCapable !== null) return journalImageCapable
  try {
    const client = requireSupabase()
    const userId = await requireUserId()
    const { error } = await client.storage
      .from(JOURNAL_IMAGE_BUCKET)
      .list(userId, { limit: 1 })
    journalImageCapable = !error
  } catch {
    journalImageCapable = false
  }
  return journalImageCapable
}

/** Test-only: reset the cached probe between specs. */
export function resetJournalImagesProbe() {
  journalImageCapable = null
}

const JOURNAL_IMAGE_MAX = 5242880 // keep in step with the bucket limit

export async function uploadJournalImage(entryId: string, file: File): Promise<string> {
  if (file.size > JOURNAL_IMAGE_MAX) throw new Error('journal image too large')
  const client = requireSupabase()
  const userId = await requireUserId()
  const ext = file.name.includes('.') ? (file.name.split('.').pop() ?? 'jpg') : 'jpg'
  const path = `${userId}/${entryId}/${crypto.randomUUID()}.${ext.toLowerCase()}`
  const { error } = await client.storage.from(JOURNAL_IMAGE_BUCKET).upload(path, file)
  if (error) throw error
  return path
}

/** Six hours — long enough that a written session won't see a thumb die. */
export async function signJournalImage(path: string): Promise<string> {
  const client = requireSupabase()
  const { data, error } = await client.storage
    .from(JOURNAL_IMAGE_BUCKET)
    .createSignedUrl(path, 21600)
  if (error || !data?.signedUrl) throw error ?? new Error('No signed URL')
  return data.signedUrl
}

export async function removeJournalImage(path: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.storage.from(JOURNAL_IMAGE_BUCKET).remove([path])
  if (error) throw error
}

/* ---------- voice-call transcription ---------- 

   The fallback path for browsers whose Web Speech recognition is missing
   or unbacked (Firefox has no SpeechRecognition; Brave ships the
   constructor but no service): MediaRecorder captures the audio and the
   `health-transcribe` edge function forwards it to the configured
   provider's /audio/transcriptions endpoint. The text then enters the
   chat pipeline like typed input. Same contract as the journal-image
   probe — until the function AND its `health_transcribe` route row exist,
   `healthVoiceTranscribeAvailable()` answers false and the call
   affordance never appears. */

const HEALTH_VOICE_FN = 'health-transcribe'
let voiceTranscribeCapable: boolean | null = null

/** One-shot probe — POST {ping:true} answers ok only when the function is
    deployed AND a health_transcribe model route resolves. */
export async function healthVoiceTranscribeAvailable(): Promise<boolean> {
  if (voiceTranscribeCapable !== null) return voiceTranscribeCapable
  try {
    const client = requireSupabase()
    const { data, error } = await client.functions.invoke(HEALTH_VOICE_FN, {
      body: { ping: true },
    })
    voiceTranscribeCapable = !error && (data as { ok?: boolean } | null)?.ok === true
  } catch {
    voiceTranscribeCapable = false
  }
  return voiceTranscribeCapable
}

/** Test-only: reset the cached probe between specs. */
export function resetHealthVoiceProbe() {
  voiceTranscribeCapable = null
}

/** One recorded utterance → its transcript text. Raw fetch rather than
    functions.invoke so the audio rides multipart, not JSON. */
export async function transcribeHealthAudio(blob: Blob, lang: 'en' | 'fr'): Promise<string> {
  const base = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? ''
  const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? ''
  const client = requireSupabase()
  const {
    data: { session },
  } = await client.auth.getSession()
  const form = new FormData()
  form.append('file', blob)
  form.append('lang', lang)
  const res = await fetch(`${base}/functions/v1/${HEALTH_VOICE_FN}`, {
    method: 'POST',
    headers: {
      apikey: anon,
      Authorization: `Bearer ${session?.access_token ?? anon}`,
    },
    body: form,
  })
  if (!res.ok) throw new Error(`${HEALTH_VOICE_FN} ${res.status}`)
  const data = (await res.json()) as { text?: string }
  return (data.text ?? '').trim()
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.from('health_journal_entries').delete().eq('id', id)
  if (error) throw error
}

/* ---------- daily habits ---------- */

export async function addHabit(name: string, weeklyTarget?: number): Promise<HealthHabit> {
  const client = requireSupabase()
  const userId = await requireUserId()
  /* Omit the key entirely when unset — before migration 0228 lands, even
     a null weekly_target would fail the insert as an unknown column. */
  const { data, error } = await client
    .from('health_habits')
    .insert({
      user_id: userId,
      name: name.trim(),
      /* The local creation day (migration 0229) — streak math floors logs
         at the habit's own day, not created_at's UTC date. */
      ...((await localDaysAvailable()) ? { day: todayDayKey() } : {}),
      ...(weeklyTarget ? { weekly_target: weeklyTarget } : {}),
    })
    .select()
    .single()
  if (error) throw error
  return habitFromRow(data)
}

/* Optional weekly cadence — migration 0228's column. The probe pattern is
   the same contract as journal images: the UI never offers the control
   before the column exists. */
let habitTargetCapable: boolean | null = null

export async function habitTargetsAvailable(): Promise<boolean> {
  if (habitTargetCapable !== null) return habitTargetCapable
  try {
    const client = requireSupabase()
    const { error } = await client.from('health_habits').select('weekly_target').limit(0)
    habitTargetCapable = !error
  } catch {
    habitTargetCapable = false
  }
  return habitTargetCapable
}

/** Test-only: reset the cached probe between specs. */
export function resetHabitTargetsProbe() {
  habitTargetCapable = null
}

/** Dev-preview only: pose as migrated so gated controls render in the
    harness — a live build still answers from the real probe. */
export function primeHabitTargetsProbe(capable: boolean) {
  habitTargetCapable = capable
}

/** Set or clear a habit's weekly target — null hands it back to the
    daily-streak model. */
export async function setHabitTarget(id: string, weeklyTarget: number | null): Promise<void> {
  const client = requireSupabase()
  const { error } = await client
    .from('health_habits')
    .update({ weekly_target: weeklyTarget })
    .eq('id', id)
  if (error) throw error
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
  try {
    const raw = (onDelta
      ? await invokeHealthAiStream(body, onDelta)
      : await invokeHealthAi(body)) as { reply?: string; assistantId?: string | null }
    if (typeof raw.reply !== 'string' || raw.reply.trim() === '') {
      throw new Error('Empty reaction from health-ai')
    }
    return { reply: raw.reply, assistantId: raw.assistantId ?? null }
  } catch (err) {
    /* A failed call must not keep the slot it stamped — that would silence
       the next legitimate nudge for 90 seconds on top of losing this one. */
    lastReactionAt = 0
    throw err
  }
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

/* ---------- your data — full export and delete-all ----------

   The state fetch above is capped for the dashboard; "everything" on the
   data page means every row, so export walks each table in 1000-row
   pages. Rows come back in their stored shape minus user_id — the file
   is the person's own data, not a curated digest.

   Delete-all relies on owner-scoped RLS rather than a service-role path:
   every health_* table already carries an owner `for all` policy, so a
   direct authenticated delete can't reach another user's rows. Two
   deliberate leftovers get named in the UI copy instead of silently
   skipped: notification prefs (settings, not content) stay put, and
   agent_suggestions only grants a delete under migration 0227 — until
   then the flow falls back to resolving every pending suggestion so the
   review queue still empties. */

const EXPORT_PAGE = 1000

type RawRow = Record<string, unknown>

/** The tables export/delete walk — a literal union so the typed client's
    `from()` resolves each row shape. */
type HealthTable =
  | 'health_checkins'
  | 'health_journal_entries'
  | 'health_habits'
  | 'health_habit_logs'
  | 'health_memories'
  | 'health_chat_threads'
  | 'health_chat_messages'

async function collectPages(
  fetchPage: (from: number, to: number) => Promise<RawRow[]>,
): Promise<RawRow[]> {
  const out: RawRow[] = []
  for (let from = 0; ; from += EXPORT_PAGE) {
    const page = await fetchPage(from, from + EXPORT_PAGE - 1)
    out.push(...page)
    if (page.length < EXPORT_PAGE) return out
  }
}

/** Everything the Health portal stores for the caller — seven tables,
    every row, user_id stripped (the file itself says whose it is). */
export interface HealthDataExport {
  exportedAt: string
  checkIns: RawRow[]
  journalEntries: RawRow[]
  habits: RawRow[]
  habitLogs: RawRow[]
  memories: RawRow[]
  chatThreads: RawRow[]
  chatMessages: RawRow[]
}

export async function exportHealthData(): Promise<HealthDataExport> {
  const client = requireSupabase()
  const page =
    (table: HealthTable, orderCol: string) =>
    async (from: number, to: number): Promise<RawRow[]> => {
      const { data, error } = await client
        .from(table)
        .select('*')
        .order(orderCol, { ascending: true })
        /* id tiebreak — rows sharing a timestamp must not drift across
           page boundaries. */
        .order('id')
        .range(from, to)
      if (error) throw error
      return (data ?? []).map((row) => {
        const { user_id: _uid, ...rest } = row as RawRow
        return rest
      })
    }
  const [checkIns, journalEntries, habits, habitLogs, memories, chatThreads, chatMessages] =
    await Promise.all([
      collectPages(page('health_checkins', 'created_at')),
      collectPages(page('health_journal_entries', 'created_at')),
      collectPages(page('health_habits', 'created_at')),
      collectPages(page('health_habit_logs', 'day')),
      collectPages(page('health_memories', 'created_at')),
      collectPages(page('health_chat_threads', 'created_at')),
      collectPages(page('health_chat_messages', 'created_at')),
    ])
  return {
    exportedAt: new Date().toISOString(),
    checkIns,
    journalEntries,
    habits,
    habitLogs,
    memories,
    chatThreads,
    chatMessages,
  }
}

/** Journal only, fully paged — the readable-text export shouldn't pay
    for a seven-table sweep it never uses. */
export async function listAllJournalEntries(): Promise<HealthJournalEntry[]> {
  const client = requireSupabase()
  const out: HealthJournalEntry[] = []
  for (let from = 0; ; from += EXPORT_PAGE) {
    const { data, error } = await client
      .from('health_journal_entries')
      .select('*')
      .order('created_at', { ascending: true })
      .order('id')
      .range(from, from + EXPORT_PAGE - 1)
    if (error) throw error
    out.push(...(data ?? []).map(journalFromRow))
    if (!data || data.length < EXPORT_PAGE) return out
  }
}

/** The same export content, shaped for reading — journal entries as a
    markdown document. Kept separate from exportHealthData so the JSON
    stays the raw record. */
export function journalToMarkdown(
  entries: Pick<HealthJournalEntry, 'title' | 'body' | 'createdAt'>[],
  lang: 'en' | 'fr',
): string {
  const fmt = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const sorted = [...entries].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  return sorted
    .map((e) => {
      const d = new Date(e.createdAt)
      const when = Number.isNaN(d.getTime()) ? e.createdAt : fmt.format(d)
      return `# ${e.title || when}\n\n*${when}*\n\n${e.body}`
    })
    .join('\n\n---\n\n')
}

/** Ordered so children land before parents; every table has an `id`
    column, so `not id is null` is the whole-row filter RLS then narrows
    to the caller. */
const HEALTH_DATA_TABLES = [
  'health_chat_messages',
  'health_chat_threads',
  'health_habit_logs',
  'health_habits',
  'health_journal_entries',
  'health_checkins',
  'health_memories',
] as const

/** Removes every stored object under `<uid>/` in the journal-images
    bucket — rows' image_path values plus orphans (an upload whose entry
    row was later lost). Tolerates the bucket not existing: migration
    0226 may still be unapplied, and a missing bucket means nothing was
    ever stored. */
async function removeJournalImageObjects(userId: string): Promise<void> {
  const client = requireSupabase()
  try {
    const { data: top } = await client.storage
      .from(JOURNAL_IMAGE_BUCKET)
      .list(userId, { limit: 1000 })
    const paths: string[] = []
    for (const item of top ?? []) {
      if (item.id) {
        paths.push(`${userId}/${item.name}`)
        continue
      }
      /* A folder entry (id null) is an entry directory — list inside it. */
      const { data: inner } = await client.storage
        .from(JOURNAL_IMAGE_BUCKET)
        .list(`${userId}/${item.name}`, { limit: 1000 })
      for (const file of inner ?? []) {
        if (file.id) paths.push(`${userId}/${item.name}/${file.name}`)
      }
    }
    if (paths.length) {
      await client.storage.from(JOURNAL_IMAGE_BUCKET).remove(paths)
    }
  } catch {
    /* No bucket means nothing stored — rows are deleted regardless. */
  }
}

/** Deletes every Health row and journal image the caller owns. What it
    does NOT touch — and the UI says so: the sign-in account, the health
    access grant, email-notification prefs, and the server-side
    notification log (a send journal, not user content). */
export async function deleteAllHealthData(): Promise<void> {
  const client = requireSupabase()
  const userId = await requireUserId()
  await removeJournalImageObjects(userId)
  for (const table of HEALTH_DATA_TABLES) {
    const { error } = await client.from(table).delete().not('id', 'is', null)
    if (error) throw error
  }
  /* Suggestions are filed by functions, not the user — but they're still
     the person's review queue. Migration 0227 adds the owner delete
     policy; before that lands this delete silently matches zero rows, so
     the update below resolves anything still pending — the queue empties
     either way. */
  await client.from('agent_suggestions').delete().eq('surface', 'health')
  const { error: resolveError } = await client
    .from('agent_suggestions')
    .update({
      status: 'dismissed',
      resolved_at: new Date().toISOString(),
      resolved_action: 'data_delete',
    })
    .eq('surface', 'health')
    .eq('status', 'pending')
  if (resolveError) throw resolveError
}
