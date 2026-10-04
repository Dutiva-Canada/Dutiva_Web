import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { resendSend } from './resendSend.ts'

/**
 * Shared send path for portal notification emails (coverage digests, streak
 * nudges). Keeps the honesty rules in one place:
 *
 *   - opt-out: portal_notification_prefs row wins; absent row = enabled
 *   - dedupe: one (user, kind, ref_date) email per day via notification_log
 *   - no provider: with RESEND_API_KEY missing nothing is logged, so wiring
 *     the key later flushes rather than drops the backlog — same rule
 *     send-law-updates documents
 *
 * Returns a short status string the caller can log/return; 'sent' means the
 * provider accepted the message (resendSend resolves on 2xx only).
 */
export type PortalNotifyKind = 'pr_coverage' | 'pr_coverage_alert' | 'health_streak_risk'

/* Pref + log scoping: kinds are prefixed by surface, so an alert variant
   (pr_coverage_alert) shares the surface's opt-out toggle but gets its own
   daily dedupe row. */
function kindSurface(kind: PortalNotifyKind): 'pr' | 'health' {
  return kind.startsWith('pr_') ? 'pr' : 'health'
}

export interface PortalEmail {
  userId: string
  kind: PortalNotifyKind
  /** Calendar day this notification covers — the dedupe key. */
  refDate: string
  subject: string
  text: string
}

export async function sendPortalEmail(
  admin: SupabaseClient,
  email: PortalEmail,
): Promise<'sent' | 'pref_off' | 'already_sent' | 'no_email' | 'no_provider' | 'send_failed' | 'log_failed'> {
  const { data: pref } = await admin
    .from('portal_notification_prefs')
    .select('email_enabled')
    .eq('user_id', email.userId)
    .eq('surface', kindSurface(email.kind))
    .maybeSingle()
  if (pref && pref.email_enabled === false) return 'pref_off'

  const { data: already } = await admin
    .from('notification_log')
    .select('id')
    .eq('user_id', email.userId)
    .eq('kind', email.kind)
    .eq('ref_date', email.refDate)
    .maybeSingle()
  if (already) return 'already_sent'

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(email.userId)
  const to = userData?.user?.email
  if (userError || !to) return 'no_email'

  const apiKey = Deno.env.get('RESEND_API_KEY') ?? Deno.env.get('SUPPORT_EMAIL_PROVIDER_API_KEY')
  if (!apiKey) return 'no_provider'
  const from = Deno.env.get('SUPPORT_EMAIL_FROM') ?? 'Dutiva <notifications@dutiva.ca>'

  try {
    await resendSend(apiKey, from, { to, subject: email.subject, text: email.text })
  } catch {
    return 'send_failed'
  }

  const { error: logError } = await admin
    .from('notification_log')
    .insert({ user_id: email.userId, kind: email.kind, ref_date: email.refDate })
  if (logError) {
    /* The email already went out; an unlogged send risks one duplicate
       tomorrow, which is the acceptable direction (matching
       send-law-updates' loud-log rule). */
    console.error('[portalNotify] sent but failed to log:', logError.message)
    return 'log_failed'
  }
  return 'sent'
}

/** Compact bilingual digest body — EN section, divider, FR section. The
    portals store no locale server-side, so both ship in one email. */
export function bilingualBody(enLines: string[], frLines: string[]): string {
  return [...enLines, '', '— — —', '', ...frLines].join('\n')
}
