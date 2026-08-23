import { supabase } from '@/lib/supabaseClient'

/** Org-level Dutiva Signature reminder cadence (migration 0085). */

export async function getSigningReminderDays(organizationId: string): Promise<number> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('organizations')
    .select('signing_reminder_days')
    .eq('id', organizationId)
    .maybeSingle()
  if (error) throw error
  const days = data?.signing_reminder_days
  if (typeof days !== 'number' || !Number.isFinite(days)) return 3
  return Math.min(14, Math.max(1, Math.round(days)))
}

export async function setSigningReminderDays(
  organizationId: string,
  days: number,
): Promise<number> {
  if (!supabase) throw new Error('Supabase is not configured')
  const clamped = Math.min(14, Math.max(1, Math.round(days)))
  const { data, error } = await supabase
    .from('organizations')
    .update({ signing_reminder_days: clamped })
    .eq('id', organizationId)
    .select('signing_reminder_days')
    .maybeSingle()
  if (error) throw error
  const saved = data?.signing_reminder_days
  if (typeof saved !== 'number') throw new Error('Could not save reminder interval')
  return saved
}
