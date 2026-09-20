import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { extractEmailKey } from './addressKey.ts'

/**
 * Inbound email ingest — Resend `email.received` webhook (migration 0164,
 * docs/INTEGRATIONS.md). verify_jwt = false in config.toml: the caller is
 * Resend, not a signed-in user, so authentication is the Svix signature —
 * the same verifier resend-webhook uses, fails closed without a secret.
 *
 * Each connected inbound_email integration owns a minted address
 * `in-<key>@<domain>`; routing looks the key up in
 * workspace_integrations.config.email_key. The webhook payload is
 * metadata only — the body is fetched from the Receiving API with
 * RESEND_API_KEY (best-effort: a failed fetch still stores the message
 * metadata so the delivery isn't lost). Stored rows notify owner/admin
 * members via _inbound_email_notify_admins; a unique
 * (integration_id, provider_email_id) index makes Resend retries
 * idempotent.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, svix-id, svix-timestamp, svix-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const TOLERANCE_SECONDS = 5 * 60
const MAX_TEXT_BYTES = 200_000
const MAX_HTML_BYTES = 500_000

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}
function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

/** Mirror of verifySvixSignature (src/features/support/email/svixSignature.ts). */
async function verifySvix(
  secret: string,
  h: { id: string; timestamp: string; signature: string },
  body: string,
): Promise<boolean> {
  if (!h.id || !h.timestamp || !h.signature) return false
  const ts = Number(h.timestamp)
  if (!Number.isFinite(ts)) return false
  if (Math.abs(Math.floor(Date.now() / 1000) - ts) > TOLERANCE_SECONDS) return false

  const raw = secret.startsWith('whsec_') ? secret.slice(6) : secret
  let keyBytes: Uint8Array
  try {
    keyBytes = base64ToBytes(raw)
  } catch {
    return false
  }
  if (keyBytes.length === 0) return false

  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${h.id}.${h.timestamp}.${body}`),
  )
  const expected = bytesToBase64(new Uint8Array(mac))
  return h.signature
    .split(' ')
    .map((p) => p.trim())
    .filter((p) => p.startsWith('v1,'))
    .map((p) => p.slice(3))
    .some((p) => timingSafeEqual(p, expected))
}

interface InboundData {
  email_id?: string
  from?: string
  to?: unknown
  cc?: unknown
  bcc?: unknown
  received_for?: unknown
  message_id?: string
  subject?: string
  attachments?: unknown
}

interface IntegrationRow {
  id: string
  organization_id: string
}

function truncate(value: string | null, max: number): string | null {
  if (value == null) return null
  return value.length > max ? value.slice(0, max) : value
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Server configuration missing' }, 500)

  // Fail closed: never accept unsigned webhooks.
  const secret =
    Deno.env.get('RESEND_INBOUND_WEBHOOK_SECRET') ?? Deno.env.get('RESEND_WEBHOOK_SECRET')
  if (!secret) return json({ error: 'Webhook signing secret is not configured.' }, 503)

  const raw = await req.text()
  const signed = await verifySvix(
    secret,
    {
      id: req.headers.get('svix-id') ?? '',
      timestamp: req.headers.get('svix-timestamp') ?? '',
      signature: req.headers.get('svix-signature') ?? '',
    },
    raw,
  )
  if (!signed) return json({ error: 'Invalid signature' }, 401)

  let event: { type?: string; data?: InboundData }
  try {
    event = JSON.parse(raw)
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }
  if (event.type !== 'email.received') return json({ data: { ignored: event.type ?? null } })

  const data = event.data ?? {}
  const emailKey = extractEmailKey(data.to, data.received_for)
  if (!emailKey) return json({ error: 'No workspace address in recipients' }, 404)
  if (!data.email_id) return json({ error: 'Missing email_id' }, 400)

  const service = createClient(supabaseUrl, serviceRoleKey)
  const { data: row, error: rowError } = await service
    .from('workspace_integrations')
    .select('id, organization_id')
    .eq('provider', 'inbound_email')
    .eq('status', 'connected')
    .eq('config->>email_key', emailKey)
    .maybeSingle()
  if (rowError || !row) return json({ error: 'Unknown address' }, 404)
  const integration = row as IntegrationRow

  // Body is metadata-excluded from the webhook — fetch it from the
  // Receiving API. Best-effort: a Resend outage shouldn't lose the
  // delivery, so failures store the row with null bodies.
  let textBody: string | null = null
  let htmlBody: string | null = null
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (apiKey) {
    try {
      const res = await fetch(
        `https://api.resend.com/emails/receiving/${encodeURIComponent(data.email_id)}`,
        { headers: { Authorization: `Bearer ${apiKey}` } },
      )
      if (res.ok) {
        const body = (await res.json()) as { text?: string; html?: string }
        textBody = truncate(body.text ?? null, MAX_TEXT_BYTES)
        htmlBody = truncate(body.html ?? null, MAX_HTML_BYTES)
      } else {
        console.error('receiving fetch failed', res.status)
      }
    } catch (e) {
      console.error('receiving fetch error', e instanceof Error ? e.message : e)
    }
  }

  const { data: stored, error: insertError } = await service
    .from('inbound_emails')
    .insert({
      organization_id: integration.organization_id,
      integration_id: integration.id,
      provider_email_id: data.email_id,
      message_id: typeof data.message_id === 'string' ? data.message_id : null,
      from_address: typeof data.from === 'string' ? data.from : 'unknown',
      to_addresses: Array.isArray(data.to) ? data.to : [],
      subject: typeof data.subject === 'string' ? data.subject : null,
      text_body: textBody,
      html_body: htmlBody,
      attachments: Array.isArray(data.attachments) ? data.attachments : [],
    })
    .select('id')
    .single()

  if (insertError) {
    // Unique violation = a Resend retry on an already-stored delivery.
    if (insertError.code === '23505') return json({ received: true, duplicate: true }, 202)
    return json({ error: 'Could not store email' }, 500)
  }

  const { error: notifyError } = await service.rpc('_inbound_email_notify_admins', {
    p_email_id: stored.id,
  })
  if (notifyError) {
    console.error('notify failed for email', stored.id, notifyError.message)
  }

  return json({ received: true }, 202)
})
