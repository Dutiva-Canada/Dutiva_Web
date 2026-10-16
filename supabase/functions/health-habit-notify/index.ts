import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { bilingualBody, sendPortalEmail } from '../_shared/portalNotify.ts'
import {
  atRiskHabits,
  reminderRecipients,
  type HabitLogRow,
  type HabitRow,
  type NotifyPrefRow,
} from './handlers.ts'
import { makeCorsHeaders, withCors } from '../_shared/cors.ts'
import { secretEquals } from '../_shared/secretEqual.ts'

/**
 * health-habit-notify — the evening Health sweep (pg_cron 23:00 UTC,
 * migration 0196). Two gentle emails share this run, and a user gets at
 * most one per night:
 *
 *   - streak-at-risk (opt-out): a habit with a live streak isn't checked
 *     off yet — the 0196 original
 *   - check-in reminder (opt-IN, migration 0227's reminder_enabled): no
 *     check-in row exists for today
 *
 * When both apply to the same person the reminder email carries the
 * streak line — one quiet ping, not two. Non-clinical, no shame
 * language.
 *
 * Auth is the scheduled-trigger contract only (x-trigger-secret ===
 * SUPPORT_NOTIFY_SECRET, or the service-role bearer): there is no portal
 * button for this one — habits change through the day and the sweep must
 * wait for the evening, so a manual call would lie about the timing.
 */

const CORS = { allowHeaders: 'authorization, x-client-info, apikey, content-type, x-trigger-secret' }
const corsHeaders = makeCorsHeaders(CORS)

const CRON_LOCK_JOB = 'health-streak-notify'
const CRON_LOCK_TTL_SECONDS = 300
const LOG_LOOKBACK_DAYS = 45

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}

function isAuthorizedTrigger(req: Request): boolean {
  const sharedSecret = Deno.env.get('SUPPORT_NOTIFY_SECRET') ?? ''
  if (sharedSecret !== '' && secretEquals(req.headers.get('x-trigger-secret') ?? '', sharedSecret)) return true
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  return token !== '' && secretEquals(token, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
}

const handler = async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Server configuration missing' }, 500)
  if (!isAuthorizedTrigger(req)) return json({ error: 'Unauthorized' }, 401)

  const admin = createClient(supabaseUrl, serviceRoleKey)

  const instanceId = crypto.randomUUID()
  const { data: acquired, error: lockError } = await admin.rpc('acquire_cron_lock', {
    p_job_name: CRON_LOCK_JOB,
    p_instance_id: instanceId,
    p_ttl_seconds: CRON_LOCK_TTL_SECONDS,
  })
  if (lockError) {
    console.warn('[health-habit-notify] acquire_cron_lock failed; continuing:', lockError.message)
  } else if (!acquired) {
    return json({ skipped: 'locked' })
  }

  try {
    const { data: habits, error: habitsError } = await admin
      .from('health_habits')
      .select('id, user_id, name')
    if (habitsError) return json({ error: habitsError.message }, 500)

    const since = new Date(Date.now() - LOG_LOOKBACK_DAYS * 86_400_000).toISOString().slice(0, 10)
    const { data: logs, error: logsError } = await admin
      .from('health_habit_logs')
      .select('habit_id, user_id, day')
      .gte('day', since)
    if (logsError) return json({ error: logsError.message }, 500)

    const today = new Date().toISOString().slice(0, 10)
    const atRisk = atRiskHabits(
      (habits ?? []) as HabitRow[],
      (logs ?? []) as HabitLogRow[],
      today,
    )

    /* Opt-in check-in reminders — the same sweep, gated on migration
       0227's reminder_enabled column. If that migration hasn't landed
       yet the prefs query errors; streak nudges still go out, so the
       failure is logged and skipped rather than thrown. */
    let reminders = new Set<string>()
    try {
      const { data: prefs, error: prefsError } = await admin
        .from('portal_notification_prefs')
        .select('user_id, email_enabled, reminder_enabled')
        .eq('surface', 'health')
        .eq('reminder_enabled', true)
      if (prefsError) throw prefsError
      const { data: todayCheckins, error: checkinsError } = await admin
        .from('health_checkins')
        .select('user_id')
        .gte('created_at', `${today}T00:00:00Z`)
      if (checkinsError) throw checkinsError
      reminders = reminderRecipients(
        (prefs ?? []) as NotifyPrefRow[],
        new Set((todayCheckins ?? []).map((r: { user_id: string }) => r.user_id)),
      )
    } catch (err) {
      console.warn('[health-habit-notify] reminder sweep skipped:', (err as Error).message)
    }

    /* One email per user per night: the union of streak-risk and
       reminder recipients, combined under the reminder kind when both
       apply (the reminder is the wider ask — "no check-in" subsumes
       "habits unchecked"). */
    const outcomes: Record<string, string> = {}
    for (const userId of new Set([...atRisk.keys(), ...reminders])) {
      const names = atRisk.get(userId)
      const list = (names ?? []).slice(0, 8)
      const reminded = reminders.has(userId)
      const streakEn = names
        ? [
            `Still time today — ${names.length === 1 ? 'this habit has' : 'these habits have'} a streak going:`,
            '',
            ...list.map((n) => `• ${n}`),
            '',
          ]
        : []
      const streakFr = names
        ? [
            `Il reste du temps aujourd'hui — ${names.length === 1 ? 'cette habitude a' : 'ces habitudes ont'} une suite en cours :`,
            '',
            ...list.map((n) => `• ${n}`),
            '',
          ]
        : []
      const en = reminded
        ? [
            'No check-in logged today — a quiet minute still counts:',
            '',
            ...streakEn,
            'Check in: https://dutiva.ca/wellness/check-in',
          ]
        : [...streakEn, 'Check them off: https://dutiva.ca/wellness/habits']
      const fr = reminded
        ? [
            'Aucun point du jour enregistré — une minute au calme compte aussi :',
            '',
            ...streakFr,
            'Faire le point : https://dutiva.ca/wellness/check-in',
          ]
        : [...streakFr, 'Cochez-les : https://dutiva.ca/wellness/habits']
      outcomes[userId] = await sendPortalEmail(admin, {
        userId,
        kind: reminded ? 'health_checkin_reminder' : 'health_streak_risk',
        refDate: today,
        subject: reminded
          ? 'Dutiva Wellness — check-in reminder / rappel du point du jour'
          : `Dutiva Wellness — streak at risk / suite à protéger (${names?.length ?? 0})`,
        text: bilingualBody(en, fr),
      })
    }

    return json({
      ok: true,
      users_at_risk: atRisk.size,
      users_reminded: reminders.size,
      emails: outcomes,
    })
  } finally {
    await admin.rpc('release_cron_lock', {
      p_job_name: CRON_LOCK_JOB,
      p_instance_id: instanceId,
    })
  }
}

Deno.serve(async (req) => withCors(req, await handler(req), CORS))