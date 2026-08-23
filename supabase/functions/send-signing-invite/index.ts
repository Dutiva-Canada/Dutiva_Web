import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  filterTurnRecipients,
  sendInviteToRecipient,
  type Lang,
  type RecipientRow,
} from '../_shared/signingInvite.ts'

/**
 * Email Dutiva Signature invites to envelope recipients.
 * Authenticated org admins (JWT), or internal cron/post-signature triggers
 * (x-trigger-secret + service key). Turn-aware by default when emailing in bulk.
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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Server configuration missing' }, 500)
  }

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const organizationId = typeof body.organization_id === 'string' ? body.organization_id : ''
  const documentId = typeof body.document_id === 'string' ? body.document_id : ''
  const recipientId =
    typeof body.recipient_id === 'string' && body.recipient_id.length > 0
      ? body.recipient_id
      : null
  const reminder = body.reminder === true
  const autoAfterSignature = body.auto_after_signature === true
  const internalRequest = autoAfterSignature || reminder || body.internal === true
  const turnOnly =
    body.turn_only !== false && (recipientId === null || autoAfterSignature || reminder)

  let actorLabel = 'Dutiva Signature'
  if (typeof body.actor_label === 'string' && body.actor_label.trim()) {
    actorLabel = body.actor_label.trim().slice(0, 120)
  }

  if (!UUID_RE.test(organizationId) || !UUID_RE.test(documentId)) {
    return json({ error: 'organization_id and document_id are required' }, 400)
  }
  if (recipientId && !UUID_RE.test(recipientId)) {
    return json({ error: 'recipient_id is invalid' }, 400)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey)

  if (internalRequest) {
    if (!isAuthorizedInternal(req)) return json({ error: 'Forbidden.' }, 403)
    if (autoAfterSignature) actorLabel = 'Dutiva Signature'
  } else {
    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Missing bearer token' }, 401)

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: userError } = await userClient.auth.getUser(token)
    const user = userData?.user
    if (userError || !user) return json({ error: 'Invalid user token' }, 401)

    const { data: isAdmin } = await admin.rpc('is_org_admin', {
      check_org_id: organizationId,
      check_user_id: user.id,
    })
    if (isAdmin !== true) {
      return json({ error: 'Only organization admins can send signing invites' }, 403)
    }
    if (!body.actor_label && user.email) actorLabel = user.email
  }

  const apiKey =
    Deno.env.get('RESEND_API_KEY') ?? Deno.env.get('SUPPORT_EMAIL_PROVIDER_API_KEY')
  if (!apiKey) {
    return json({ error: 'Email provider is not configured', code: 'no_provider' }, 503)
  }
  const from =
    Deno.env.get('SIGNING_EMAIL_FROM') ??
    Deno.env.get('SUPPORT_EMAIL_FROM') ??
    'Dutiva Signature <noreply@dutiva.ca>'
  const siteUrl = (Deno.env.get('SITE_URL') ?? 'https://dutiva.ca').replace(/\/+$/, '')

  const { data: org, error: orgError } = await admin
    .from('organizations')
    .select('id, name')
    .eq('id', organizationId)
    .maybeSingle()
  if (orgError || !org) return json({ error: 'Organization not found' }, 404)

  const { data: doc, error: docError } = await admin
    .from('hr_generated_documents')
    .select('id, ref, title_en, title_fr, language, signature_status, organization_id')
    .eq('id', documentId)
    .eq('organization_id', organizationId)
    .maybeSingle()
  if (docError || !doc) return json({ error: 'Document not found' }, 404)

  if (
    !['sent', 'viewed', 'pending', 'partially_signed'].includes(String(doc.signature_status ?? ''))
  ) {
    return json({ error: 'Document is not awaiting signature' }, 409)
  }

  let recipientQuery = admin
    .from('hr_document_recipients')
    .select(
      'id, name, email, status, signing_token, token_expires_at, token_revoked_at, signing_order',
    )
    .eq('document_id', documentId)
    .eq('organization_id', organizationId)
    .in('status', ['pending', 'sent', 'viewed'])
    .is('token_revoked_at', null)

  if (recipientId) recipientQuery = recipientQuery.eq('id', recipientId)

  const { data: recipientRows, error: recError } = await recipientQuery.order('signing_order', {
    ascending: true,
  })
  if (recError) return json({ error: recError.message }, 500)

  let recipients = (recipientRows ?? []) as RecipientRow[]
  if (recipients.length === 0) {
    return json({ error: 'No eligible recipients to email' }, 404)
  }

  if (turnOnly && !recipientId) {
    recipients = filterTurnRecipients(recipients, true)
  }
  if (recipients.length === 0) {
    return json({ error: 'No turn-holder recipients to email' }, 404)
  }

  const requestedLang = body.language === 'fr' || body.language === 'en' ? body.language : null
  const docLang: Lang = doc.language === 'fr' ? 'fr' : 'en'
  const emailLang: Lang = requestedLang ?? docLang

  const documentTitle =
    emailLang === 'fr'
      ? String(doc.title_fr || doc.title_en)
      : String(doc.title_en || doc.title_fr)
  const organizationName = String(org.name ?? 'Organization')

  const sent: Array<{ recipient_id: string; email: string }> = []
  const failed: Array<{ recipient_id: string; email: string; error: string }> = []

  for (const row of recipients) {
    const result = await sendInviteToRecipient(admin, {
      apiKey,
      from,
      organizationId,
      documentId,
      documentRef: String(doc.ref),
      documentTitle,
      organizationName,
      siteUrl,
      language: emailLang,
      actorLabel,
      row,
      reminder,
    })
    if (result.ok) {
      sent.push({ recipient_id: row.id, email: row.email })
    } else {
      failed.push({ recipient_id: row.id, email: row.email, error: result.error })
    }
  }

  if (sent.length === 0) {
    return json({ error: 'Failed to send any invites', sent, failed }, 502)
  }

  return json({ ok: true, sent, failed })
})
