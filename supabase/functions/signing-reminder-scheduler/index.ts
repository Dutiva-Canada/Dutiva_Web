import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendInviteToRecipient, type Lang } from '../_shared/signingInvite.ts'

/**
 * Cron sweep for stale Dutiva Signature invites — emails a reminder to turn-
 * holders whose invite is older than the org's signing_reminder_days (default 3).
 * Scheduled every 6 hours by trigger_signing_reminder_scheduler() (migration 0083;
 * interval configurable per org in migration 0085).
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

const CRON_LOCK_JOB = 'signing-reminder-sweep'
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

Deno.serve(async (req: Request) => {
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
    console.warn('[signing-reminder-scheduler] acquire_cron_lock failed; continuing without lock:', lockError.message)
  } else if (!acquired) {
    return json({ ok: true, skipped: true, reason: 'another-instance-running' })
  }

  const apiKey =
    Deno.env.get('RESEND_API_KEY') ?? Deno.env.get('SUPPORT_EMAIL_PROVIDER_API_KEY')
  if (!apiKey) {
    if (!lockError && acquired) {
      await db.rpc('release_cron_lock', { p_job_name: CRON_LOCK_JOB, p_instance_id: instanceId })
    }
    return json({ ok: true, skipped: true, reason: 'no_provider' })
  }

  const from =
    Deno.env.get('SIGNING_EMAIL_FROM') ??
    Deno.env.get('SUPPORT_EMAIL_FROM') ??
    'Dutiva Signature <noreply@dutiva.ca>'
  const siteUrl = (Deno.env.get('SITE_URL') ?? 'https://dutiva.ca').replace(/\/+$/, '')

  const { data: dueRows, error: dueError } = await db.rpc('hr_signing_recipients_needing_reminder')
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
    const documentId = due.document_id as string
    const recipientId = due.recipient_id as string

    const [{ data: org }, { data: doc }, { data: recipient }] = await Promise.all([
      db.from('organizations').select('id, name').eq('id', organizationId).maybeSingle(),
      db
        .from('hr_generated_documents')
        .select('id, ref, title_en, title_fr, language')
        .eq('id', documentId)
        .maybeSingle(),
      db
        .from('hr_document_recipients')
        .select('id, name, email, signing_token, token_expires_at, signing_order')
        .eq('id', recipientId)
        .maybeSingle(),
    ])

    if (!org || !doc || !recipient) continue

    const docLang: Lang = doc.language === 'fr' ? 'fr' : 'en'
    const documentTitle =
      docLang === 'fr'
        ? String(doc.title_fr || doc.title_en)
        : String(doc.title_en || doc.title_fr)

    const result = await sendInviteToRecipient(db, {
      apiKey,
      from,
      organizationId,
      documentId,
      documentRef: String(doc.ref),
      documentTitle,
      organizationName: String(org.name ?? 'Organization'),
      siteUrl,
      language: docLang,
      actorLabel: 'Dutiva Signature',
      row: recipient,
      reminder: true,
    })

    if (result.ok) sent += 1
    else failed += 1
  }

  if (!lockError && acquired) {
    await db.rpc('release_cron_lock', { p_job_name: CRON_LOCK_JOB, p_instance_id: instanceId })
  }

  return json({ ok: true, sent, failed, candidates: dueRows?.length ?? 0 })
})
