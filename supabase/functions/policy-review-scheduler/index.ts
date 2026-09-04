import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { resendSend } from '../_shared/resendSend.ts'

/**
 * Daily cron: flag overdue policies as needs_review, then email org admins
 * a digest of policies that still need attention (throttled in SQL).
 * Scheduled by trigger_policy_review_scheduler() (migration 0117).
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-trigger-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const CRON_LOCK_JOB = 'policy-review-sweep'
const CRON_LOCK_TTL_SECONDS = 300

function isAuthorizedTrigger(req: Request): boolean {
  const sharedSecret = Deno.env.get('SUPPORT_NOTIFY_SECRET') ?? ''
  if (sharedSecret !== '' && req.headers.get('x-trigger-secret') === sharedSecret) return true

  const auth = req.headers.get('Authorization') ?? ''
  if (!auth.startsWith('Bearer ')) return false
  const token = auth.slice('Bearer '.length).trim()
  if (token === '') return false

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const secretKey = Deno.env.get('SUPABASE_SECRET_KEY') ?? ''
  return (serviceKey !== '' && token === serviceKey) || (secretKey !== '' && token === secretKey)
}

function policyReminderEmail(input: {
  organizationName: string
  policyNames: string[]
  policiesUrl: string
}): { subject: string; text: string } {
  const count = input.policyNames.length
  const listed = input.policyNames.slice(0, 12).map((n) => `• ${n}`).join('\n')
  const more =
    count > 12 ? `\n…and ${count - 12} more.` : ''
  return {
    subject:
      count === 1
        ? `Policy review reminder — ${input.organizationName}`
        : `${count} policies need review — ${input.organizationName}`,
    text: [
      `Dutiva — policy review reminder for ${input.organizationName}`,
      '',
      `${count} ${count === 1 ? 'policy needs' : 'policies need'} attention:`,
      listed + more,
      '',
      `Open the policy register: ${input.policiesUrl}`,
      '',
      'Dutiva provides practical HR workflow support and compliance-oriented guidance. It does not provide legal advice.',
    ].join('\n'),
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }
  if (!isAuthorizedTrigger(req)) {
    return json({ error: 'Forbidden.' }, 403)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  const instanceId = crypto.randomUUID()
  const { data: acquired, error: lockError } = await db.rpc('acquire_cron_lock', {
    p_job_name: CRON_LOCK_JOB,
    p_instance_id: instanceId,
    p_ttl_seconds: CRON_LOCK_TTL_SECONDS,
  })
  if (lockError) {
    console.warn(
      '[policy-review-scheduler] acquire_cron_lock failed; continuing without lock:',
      lockError.message,
    )
  } else if (!acquired) {
    return json({ ok: true, skipped: true, reason: 'another-instance-running' })
  }

  const { data: flagged, error: flagError } = await db.rpc('hr_policies_flag_overdue_for_review')
  if (flagError) {
    if (!lockError && acquired) {
      await db.rpc('release_cron_lock', { p_job_name: CRON_LOCK_JOB, p_instance_id: instanceId })
    }
    return json({ error: flagError.message }, 500)
  }

  const apiKey = Deno.env.get('RESEND_API_KEY') ?? Deno.env.get('SUPPORT_EMAIL_PROVIDER_API_KEY')
  if (!apiKey) {
    if (!lockError && acquired) {
      await db.rpc('release_cron_lock', { p_job_name: CRON_LOCK_JOB, p_instance_id: instanceId })
    }
    return json({
      ok: true,
      flagged: flagged ?? 0,
      skipped: true,
      reason: 'no_provider',
    })
  }

  const from =
    Deno.env.get('SUPPORT_EMAIL_FROM') ?? 'Dutiva <noreply@dutiva.ca>'
  const siteUrl = (Deno.env.get('SITE_URL') ?? 'https://dutiva.ca').replace(/\/+$/, '')

  const { data: dueRows, error: dueError } = await db.rpc('hr_policies_orgs_needing_reminder')
  if (dueError) {
    if (!lockError && acquired) {
      await db.rpc('release_cron_lock', { p_job_name: CRON_LOCK_JOB, p_instance_id: instanceId })
    }
    return json({ error: dueError.message }, 500)
  }

  let sent = 0
  let failed = 0

  for (const due of dueRows ?? []) {
    const organizationId = due.organization_id as string
    const organizationName = String(due.organization_name ?? 'Organization')
    const policyNames = (due.policy_names as string[] | null) ?? []

    const { data: adminEmails, error: emailError } = await db.rpc('_hr_org_admin_emails', {
      p_org_id: organizationId,
    })
    if (emailError) {
      failed += 1
      continue
    }
    const emails = (adminEmails ?? []).filter(
      (e: unknown): e is string => typeof e === 'string' && e.includes('@'),
    )
    if (emails.length === 0) continue

    const message = policyReminderEmail({
      organizationName,
      policyNames,
      policiesUrl: `${siteUrl}/app/policies`,
    })

    try {
      for (const to of emails) {
        await resendSend(apiKey, from, { to, subject: message.subject, text: message.text })
      }
      await db
        .from('hr_policies')
        .update({ last_reminder_sent_at: new Date().toISOString() })
        .eq('organization_id', organizationId)
        .in('status', ['needs_review', 'missing'])
      sent += 1
    } catch (err) {
      console.warn('[policy-review-scheduler] send failed:', err)
      failed += 1
    }
  }

  if (!lockError && acquired) {
    await db.rpc('release_cron_lock', { p_job_name: CRON_LOCK_JOB, p_instance_id: instanceId })
  }

  return json({
    ok: true,
    flagged: flagged ?? 0,
    sent,
    failed,
    candidates: dueRows?.length ?? 0,
  })
})
