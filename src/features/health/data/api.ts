import { supabase } from '@/lib/supabaseClient'
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

/* ---------- health-ai: gentle model assists (aggregates only) ---------- */

/** One journal prompt built from mood/energy/habit AGGREGATES — the model
    never sees note text or journal bodies. A suggestion to write about,
    not advice. */
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

/** A short weekly summary of the same aggregates — describes the numbers,
    never advises. */
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
