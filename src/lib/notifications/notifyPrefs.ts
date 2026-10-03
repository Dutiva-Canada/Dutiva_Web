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
