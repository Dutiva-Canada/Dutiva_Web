import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { bilingualBody, sendPortalEmail } from '../_shared/portalNotify.ts'
import { atRiskHabits, type HabitLogRow, type HabitRow } from './handlers.ts'

/**
 * health-habit-notify — daily streak-at-risk nudge (pg_cron 23:00 UTC,
 * migration 0196). For each habit with a live streak that isn't checked off
 * today, the owner gets one gentle email — non-clinical, no shame language.
 *
 * Auth is the scheduled-trigger contract only (x-trigger-secret ===
 * SUPPORT_NOTIFY_SECRET, or the service-role bearer): there is no portal
 * button for this one — habits change through the day and the sweep must
 * wait for the evening, so a manual call would lie about the timing.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-trigger-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const CRON_LOCK_JOB = 'health-streak-notify'
const CRON_LOCK_TTL_SECONDS = 300
const LOG_LOOKBACK_DAYS = 45

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function isAuthorizedTrigger(req: Request): boolean {
  const sharedSecret = Deno.env.get('SUPPORT_NOTIFY_SECRET') ?? ''
  if (sharedSecret !== '' && req.headers.get('x-trigger-secret') === sharedSecret) return true
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  return token !== '' && token === (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
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

    const outcomes: Record<string, string> = {}
    for (const [userId, names] of atRisk) {
      const list = names.slice(0, 8)
      const en = [
        `Still time today — ${names.length === 1 ? 'this habit has' : 'these habits have'} a streak going:`,
        '',
        ...list.map((n) => `• ${n}`),
        '',
        'Check them off: https://dutiva.ca/health/habits',
      ]
      const fr = [
        `Il reste du temps aujourd'hui — ${names.length === 1 ? 'cette habitude a' : 'ces habitudes ont'} une suite en cours :`,
        '',
        ...list.map((n) => `• ${n}`),
        '',
        'Cochez-les : https://dutiva.ca/health/habits',
      ]
      outcomes[userId] = await sendPortalEmail(admin, {
        userId,
        kind: 'health_streak_risk',
        refDate: today,
        subject: `Dutiva Health — streak at risk / suite à protéger (${names.length})`,
        text: bilingualBody(en, fr),
      })
    }

    return json({ ok: true, users_at_risk: atRisk.size, emails: outcomes })
  } finally {
    await admin.rpc('release_cron_lock', {
      p_job_name: CRON_LOCK_JOB,
      p_instance_id: instanceId,
    })
  }
})
