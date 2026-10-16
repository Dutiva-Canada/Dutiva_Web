import { supabase } from '@/lib/supabaseClient'

/**
 * Per-surface email notification toggle for the standalone portals
 * (notification_log-backed senders: pr-mentions-feed coverage digests,
 * health-habit-notify streak nudges). Absent row = enabled; the toggle writes
 * the row the first time a user touches it.
 */
export type PortalNotifySurface = 'pr' | 'health'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase client unavailable — check env vars.')
  return supabase
}

export async function loadNotifyPref(surface: PortalNotifySurface): Promise<boolean> {
  const sb = requireSupabase()
  const { data, error } = await sb
    .from('portal_notification_prefs')
    .select('email_enabled')
    .eq('surface', surface)
    .maybeSingle()
  if (error) throw error
  return data?.email_enabled ?? true
}

export async function setNotifyPref(
  surface: PortalNotifySurface,
  enabled: boolean,
): Promise<void> {
  const sb = requireSupabase()
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { error } = await sb.from('portal_notification_prefs').upsert(
    {
      user_id: user.id,
      surface,
      email_enabled: enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,surface' },
  )
  if (error) throw error
}

/* ---------- check-in reminders ----------

   The daily "haven't checked in yet" nudge is opt-IN — the opposite of
   email_enabled's opt-out — so it lives on its own column rather than
   reusing the row's presence. Migration 0227 adds `reminder_enabled`;
   until it lands the column probe answers false and the UI never offers
   the toggle (a dead switch pointing at a missing column is worse than
   no switch). */

let reminderCapable: boolean | null = null

/** One-shot probe — selecting a column that doesn't exist yet errors,
    and that's cached for the session. */
export async function remindersAvailable(): Promise<boolean> {
  if (reminderCapable !== null) return reminderCapable
  try {
    const sb = requireSupabase()
    const { error } = await sb
      .from('portal_notification_prefs')
      .select('reminder_enabled')
      .limit(0)
    reminderCapable = !error
  } catch {
    reminderCapable = false
  }
  return reminderCapable
}

/** Test-only: reset the cached probe between specs. */
export function resetRemindersProbe() {
  reminderCapable = null
}

/** Dev-preview only: pose as migrated so the reminder card renders in the
    harness — a live build still answers from the real probe. */
export function primeRemindersProbe(capable: boolean) {
  reminderCapable = capable
}

/** Absent row (or absent column) = off — this one never defaults on. */
export async function loadReminderPref(surface: PortalNotifySurface): Promise<boolean> {
  const sb = requireSupabase()
  const { data, error } = await sb
    .from('portal_notification_prefs')
    .select('reminder_enabled')
    .eq('surface', surface)
    .maybeSingle()
  if (error) throw error
  return data?.reminder_enabled === true
}

/** Writes only the reminder column — PostgREST's merge-upsert leaves a
    sibling email_enabled value untouched, so the two toggles stay
    independent. */
export async function setReminderPref(
  surface: PortalNotifySurface,
  enabled: boolean,
): Promise<void> {
  const sb = requireSupabase()
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { error } = await sb.from('portal_notification_prefs').upsert(
    {
      user_id: user.id,
      surface,
      reminder_enabled: enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,surface' },
  )
  if (error) throw error
}

/* ---------- timezone sync ----------
   The evening sweep computes "today" per user from migration 0229's `tz`
   column; without it "today" means the UTC date. The portal stamps its
   IANA zone on load — a fire-and-forget merge-upsert, once per session,
   that never creates a pref the person didn't ask for (the row's toggles
   keep their defaults). */

let tzSynced: string | null = null

export async function syncNotifyTz(surface: PortalNotifySurface): Promise<void> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (!tz || tzSynced === `${surface}:${tz}`) return
  tzSynced = `${surface}:${tz}`
  try {
    const sb = requireSupabase()
    const {
      data: { user },
    } = await sb.auth.getUser()
    if (!user) return
    await sb.from('portal_notification_prefs').upsert(
      { user_id: user.id, surface, tz, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,surface' },
    )
  } catch {
    /* Best-effort — a failed stamp just means the sweep falls back to UTC,
       the behaviour it always had. */
    tzSynced = null
  }
}

/** Test-only: reset the once-per-session tz stamp between specs. */
export function resetNotifyTz() {
  tzSynced = null
}
