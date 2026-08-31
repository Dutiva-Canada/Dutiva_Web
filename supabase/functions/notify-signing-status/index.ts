import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { resendSend } from '../_shared/resendSend.ts'
import { renderSigningStatusEmail, type SigningStatusEvent } from '../_shared/signingStatusEmail.ts'
import type { Lang } from '../_shared/signingInvite.ts'

/**
 * Email org admins when a Dutiva Signature envelope is fully signed or declined.
 * Triggered internally from signing RPCs via pg_net (migration 0084).
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isAuthorizedInternal(req: Request): boolean {
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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  if (!isAuthorizedInternal(req)) return json({ error: 'Forbidden.' }, 403)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Server configuration missing' }, 500)

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const organizationId = typeof body.organization_id === 'string' ? body.organization_id : ''
  const documentId = typeof body.document_id === 'string' ? body.document_id : ''
  const event =
    body.event === 'declined' ? 'declined' : body.event === 'completed' ? 'completed' : null

  if (!UUID_RE.test(organizationId) || !UUID_RE.test(documentId) || !event) {
    return json({ error: 'organization_id, document_id, and event are required' }, 400)
  }

  const apiKey = Deno.env.get('RESEND_API_KEY') ?? Deno.env.get('SUPPORT_EMAIL_PROVIDER_API_KEY')
  if (!apiKey) return json({ ok: true, skipped: true, reason: 'no_provider' })

  const from =
    Deno.env.get('SIGNING_EMAIL_FROM') ??
    Deno.env.get('SUPPORT_EMAIL_FROM') ??
    'Dutiva Signature <noreply@dutiva.ca>'
  const siteUrl = (Deno.env.get('SITE_URL') ?? 'https://dutiva.ca').replace(/\/+$/, '')

  const admin = createClient(supabaseUrl, serviceRoleKey)

  const [{ data: org }, { data: doc }, { data: adminEmails, error: emailError }] =
    await Promise.all([
      admin.from('organizations').select('id, name').eq('id', organizationId).maybeSingle(),
      admin
        .from('hr_generated_documents')
        .select('id, ref, title_en, title_fr, language')
        .eq('id', documentId)
        .eq('organization_id', organizationId)
        .maybeSingle(),
      admin.rpc('_hr_org_admin_emails', { p_org_id: organizationId }),
    ])

  if (emailError) return json({ error: emailError.message }, 500)
  if (!org || !doc) return json({ error: 'Document not found' }, 404)

  const emails = (adminEmails ?? []).filter(
    (e): e is string => typeof e === 'string' && e.includes('@'),
  )
  if (emails.length === 0) return json({ ok: true, skipped: true, reason: 'no_admin_emails' })

  const docLang: Lang = doc.language === 'fr' ? 'fr' : 'en'
  const documentTitle =
    docLang === 'fr' ? String(doc.title_fr || doc.title_en) : String(doc.title_en || doc.title_fr)
  const docPathPrefix = docLang === 'fr' ? '/fr' : ''
  const documentUrl = `${siteUrl}${docPathPrefix}/app/documents/${documentId}`

  let signerSummary: string | undefined
  if (event === 'declined') {
    const { data: declined } = await admin
      .from('hr_document_recipients')
      .select('name, email, decline_reason')
      .eq('document_id', documentId)
      .eq('status', 'declined')
      .order('signed_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (declined) {
      signerSummary =
        docLang === 'fr'
          ? `Signataire : ${declined.name} (${declined.email})${declined.decline_reason ? `\nMotif : ${declined.decline_reason}` : ''}`
          : `Signer: ${declined.name} (${declined.email})${declined.decline_reason ? `\nReason: ${declined.decline_reason}` : ''}`
    }
  }

  const email = renderSigningStatusEmail({
    language: docLang,
    organizationName: String(org.name ?? 'Organization'),
    documentTitle,
    documentRef: String(doc.ref),
    documentUrl,
    event: event as SigningStatusEvent,
    signerSummary,
  })

  const sent: string[] = []
  const failed: string[] = []

  for (const to of emails) {
    try {
      await resendSend(apiKey, from, { to, subject: email.subject, text: email.text })
      sent.push(to)
    } catch {
      failed.push(to)
    }
  }

  if (sent.length > 0) {
    await admin.from('hr_document_audit_events').insert({
      organization_id: organizationId,
      document_id: documentId,
      event_type: 'signing_admin_notified',
      actor_label: 'Dutiva Signature',
      meta: `${event} · ${sent.join(', ')}`,
    })
  }

  return json({ ok: true, event, sent, failed })
})
