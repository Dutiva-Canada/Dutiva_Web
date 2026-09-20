import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { verifyDutivaSignature } from './verify-signature.ts'

/**
 * Public inbound-webhook ingest — phase 2 of workspace integrations
 * (docs/INTEGRATIONS.md). verify_jwt = false in config.toml: callers are
 * external tools, not signed-in users. Authentication is the signature —
 * X-Dutiva-Signature: t=<unix>,v1=<hmac-sha256> over `t.body` with the
 * per-integration signing secret held in Vault.
 *
 *   POST /functions/v1/integration-webhook/<webhook_key>
 *
 * The webhook_key is an unguessable URL segment minted by the
 * workspace-integration function and stored in
 * workspace_integrations.config.webhook_key. Knowing the URL alone is not
 * enough — a bad or missing signature is a 401 and nothing is stored.
 * Valid deliveries land in `integration_events` (0162); the event id is
 * then handed to _integration_event_notify_admins (0163), which fans out
 * one hr_workspace_notifications row to each active owner/admin member
 * and stamps processed_at. Notify failure never fails the delivery — the
 * stored row stays unprocessed for a later consumer.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-dutiva-signature, x-dutiva-event',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

interface IntegrationRow {
  id: string
  organization_id: string
  secret_ref: string | null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Server configuration missing' }, 500)

  const key = new URL(req.url).pathname.split('/').filter(Boolean).pop() ?? ''
  if (!/^[a-f0-9]{32,64}$/i.test(key)) return json({ error: 'Not found' }, 404)

  const rawBody = await req.text()
  const sigHeader = req.headers.get('X-Dutiva-Signature') ?? ''

  const service = createClient(supabaseUrl, serviceRoleKey)
  const { data: row, error: rowError } = await service
    .from('workspace_integrations')
    .select('id, organization_id, secret_ref')
    .eq('provider', 'inbound_webhook')
    .eq('status', 'connected')
    .eq('config->>webhook_key', key)
    .maybeSingle()
  if (rowError || !row) return json({ error: 'Not found' }, 404)
  const integration = row as IntegrationRow

  if (!integration.secret_ref) return json({ error: 'Not found' }, 404)
  const { data: secret } = await service.rpc('read_integration_secret', {
    p_name: integration.secret_ref,
  })
  if (typeof secret !== 'string' || secret.length === 0) {
    return json({ error: 'Not found' }, 404)
  }

  const valid = await verifyDutivaSignature(rawBody, sigHeader, secret)
  if (!valid) return json({ error: 'Invalid signature' }, 401)

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return json({ error: 'Body must be JSON' }, 400)
  }

  const headerEvent = req.headers.get('X-Dutiva-Event')
  const eventType =
    headerEvent ??
    (typeof payload === 'object' && payload !== null && 'type' in payload
      ? String((payload as { type: unknown }).type)
      : null)

  const { data: event, error: insertError } = await service
    .from('integration_events')
    .insert({
      organization_id: integration.organization_id,
      integration_id: integration.id,
      provider: 'inbound_webhook',
      event_type: eventType,
      payload,
    })
    .select('id')
    .single()
  if (insertError || !event) return json({ error: 'Could not store event' }, 500)

  const { error: notifyError } = await service.rpc('_integration_event_notify_admins', {
    p_event_id: event.id,
  })
  if (notifyError) {
    // Stored but unnotified: processed_at stays NULL so the row remains
    // visible to the unprocessed index for a later consumer/retry.
    console.error('notify failed for event', event.id, notifyError.message)
  }

  return json({ received: true }, 202)
})
