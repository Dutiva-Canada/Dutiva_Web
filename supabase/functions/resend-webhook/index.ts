import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

/**
 * Resend delivery webhook. Records the provider's verdict against the outbox row
 * so `delivered` and `bounced` stop looking identical.
 *
 * WHY THIS EXISTS: support-notify marks a row `sent` when Resend ACCEPTS the
 * message. A bounce arrives asynchronously afterwards. On 2026-07-16 an operator
 * alert to a non-existent mailbox was marked `sent` and then bounced, and the
 * database never knew. `status` = what we did; `delivery_status` = what happened.
 *
 * SECURITY: this endpoint is necessarily public (verify_jwt off), so the Svix
 * signature IS the authentication — without it anyone could POST fake
 * `email.delivered` events and mask real bounces. It FAILS CLOSED: no
 * RESEND_WEBHOOK_SECRET configured => 503, never "accept unsigned".
 * Mirrors src/features/support/email/svixSignature.ts (unit-tested against the
 * published Svix vector) — keep the two in sync.
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

/** Resend event type -> our delivery_status vocabulary (migration 0018). */
const EVENT_MAP: Record<string, string> = {
  'email.delivered': 'delivered',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
  'email.delivery_delayed': 'delayed',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Server configuration missing' }, 500)

  // Fail closed: never accept unsigned webhooks.
  const secret = Deno.env.get('RESEND_WEBHOOK_SECRET')
  if (!secret) return json({ error: 'Webhook signing secret is not configured.' }, 503)

  // Signature is over the RAW body — read it as text before parsing.
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

  let event: {
    type?: string
    data?: { email_id?: string; to?: unknown; bounce?: { message?: string } }
  }
  try {
    event = JSON.parse(raw)
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const deliveryStatus = EVENT_MAP[event.type ?? '']
  // Unknown/irrelevant event types are acknowledged, not errored — Resend
  // shouldn't retry them forever.
  if (!deliveryStatus) return json({ data: { ignored: event.type ?? null } })

  const emailId = event.data?.email_id
  if (!emailId) return json({ data: { ignored: 'no_email_id' } })

  const admin = createClient(supabaseUrl, serviceRoleKey)
  const detail =
    typeof event.data?.bounce?.message === 'string' ? event.data.bounce.message.slice(0, 500) : null

  const updatedAt = new Date().toISOString()
  const deliveryPatch = {
    delivery_status: deliveryStatus,
    delivery_detail: detail,
    delivery_updated_at: updatedAt,
  }

  const { error: supportError } = await admin
    .from('support_notifications')
    .update(deliveryPatch)
    .eq('provider_message_id', emailId)
  if (supportError) return json({ error: supportError.message }, 500)

  const { error: inviteError } = await admin
    .from('hr_document_recipients')
    .update({
      invite_delivery_status: deliveryStatus,
      invite_delivery_detail: detail,
      invite_delivery_updated_at: updatedAt,
    })
    .eq('invite_provider_message_id', emailId)
  if (inviteError) return json({ error: inviteError.message }, 500)

  return json({ data: { email_id: emailId, delivery_status: deliveryStatus } })
})
