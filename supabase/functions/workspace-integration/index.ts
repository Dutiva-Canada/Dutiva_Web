import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

/**
 * Connect / test / disconnect boundary for `workspace_integrations` (0161).
 *
 * The client never touches credentials: it sends the token once, here, and
 * this function is the only thing that talks to Vault (via the
 * service-role-only wrappers store_/read_/revoke_integration_secret). What
 * lands back in the table is `secret_ref` — a Vault secret *name* — plus a
 * status that means what it says:
 *
 *   'connected'   only after a live probe of the provider API succeeded
 *   'error'       a probe ran and failed (bad token, unreachable instance)
 *   'disconnected' secret revoked from Vault, secret_ref cleared
 *   'pending'     row exists but no probe has succeeded — placeholder state
 *
 * Phase-1 probed providers: github, gitlab (PAT). smtp_email stores the
 * password but is never probed — no raw TCP from an edge function — so it
 * stays 'pending' and the UI says "saved, not verified". gmail/outlook
 * are rejected outright until their OAuth flows exist; the catalog marks
 * them 'planned'.
 *
 * Phase 2 adds inbound_webhook: 'connect' takes no caller secret — the
 * function mints an unguessable webhook_key (URL segment) plus an HMAC
 * signing secret, Vaults the secret, and returns both values once.
 * Re-running connect on an existing row rotates key+secret. Deliveries
 * land via the integration-webhook function, which authenticates callers
 * by signature, not JWT.
 *
 * Auth: bearer JWT → getUser → is_org_admin(row.organization_id, user.id)
 * via the caller's own JWT client. Members can read rows (RLS) but only
 * org admins can drive this function — same gating as the table writes.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...headers },
  })
}

interface ServerConfig {
  supabaseUrl: string
  anonKey: string
  serviceRoleKey: string
}

interface IntegrationRow {
  id: string
  organization_id: string
  provider: string
  status: string
  config: Record<string, unknown> | null
  secret_ref: string | null
}

type Action = 'connect' | 'test' | 'disconnect'

interface RequestBody {
  action: Action
  integrationId: string
  secret?: string
}

function serverConfig(): ServerConfig | Response {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Server configuration missing' }, 500)
  }
  return { supabaseUrl, anonKey, serviceRoleKey }
}

function secretName(integrationId: string) {
  return `wi_${integrationId}`
}

function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes)
  crypto.getRandomValues(buf)
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Live probe against the provider's identity endpoint. Returns the account
 * login on success, or { ok: false, providerStatus } on any failure. Only
 * github/gitlab are reachable in phase 1 — everything else is a clean 400
 * at the call site, not a fake "connected".
 */
async function probeProvider(
  provider: string,
  config: Record<string, unknown> | null,
  secret: string,
): Promise<{ ok: true; account: string } | { ok: false; providerStatus: number }> {
  const headers = { 'User-Agent': 'dutiva-workspace-integration' }
  try {
    if (provider === 'github') {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          ...headers,
          Authorization: `Bearer ${secret}`,
          Accept: 'application/vnd.github+json',
        },
      })
      if (!res.ok) return { ok: false, providerStatus: res.status }
      const body = (await res.json()) as { login?: string }
      return { ok: true, account: body.login ?? 'github' }
    }
    if (provider === 'gitlab') {
      const raw =
        typeof config?.instance_url === 'string' ? config.instance_url : 'https://gitlab.com'
      const base = raw.replace(/\/+$/, '')
      if (!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(base)) return { ok: false, providerStatus: 0 }
      const res = await fetch(`${base}/api/v4/user`, {
        headers: { ...headers, 'PRIVATE-TOKEN': secret },
      })
      if (!res.ok) return { ok: false, providerStatus: res.status }
      const body = (await res.json()) as { username?: string }
      return { ok: true, account: body.username ?? 'gitlab' }
    }
    if (provider === 'smtp_email') {
      // Stored, not verified: edge functions can't open a TCP socket to the
      // SMTP host. Returning 'ok' here would lie about reachability.
      return { ok: false, providerStatus: 0 }
    }
    return { ok: false, providerStatus: 0 }
  } catch {
    return { ok: false, providerStatus: 0 }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const config = serverConfig()
  if (config instanceof Response) return config

  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'Missing bearer token' }, 401)

  const userClient = createClient(config.supabaseUrl, config.anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const token = authHeader.replace('Bearer ', '')
  const { data: userData, error: userError } = await userClient.auth.getUser(token)
  const user = userData?.user
  if (userError || !user) return json({ error: 'Invalid user token' }, 401)

  let body: RequestBody
  try {
    body = (await req.json()) as RequestBody
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }
  const { action, integrationId, secret } = body
  if (!integrationId || !['connect', 'test', 'disconnect'].includes(action)) {
    return json({ error: 'Expected { action: connect|test|disconnect, integrationId }' }, 400)
  }

  const serviceClient = createClient(config.supabaseUrl, config.serviceRoleKey)
  const { data: row, error: rowError } = await serviceClient
    .from('workspace_integrations')
    .select('id, organization_id, provider, status, config, secret_ref')
    .eq('id', integrationId)
    .maybeSingle()
  if (rowError || !row) return json({ error: 'Integration not found' }, 404)
  const integration = row as IntegrationRow

  // Caller's own JWT client answers the admin check — same helper the RLS
  // policies use, so the function can never out-gate the table.
  const { data: isAdmin, error: adminError } = await userClient.rpc('is_org_admin', {
    check_org_id: integration.organization_id,
    check_user_id: user.id,
  })
  if (adminError || isAdmin !== true) return json({ error: 'Org admin required' }, 403)

  const name = secretName(integration.id)
  const patchRow = async (patch: Record<string, unknown>) => {
    const { error } = await serviceClient
      .from('workspace_integrations')
      .update(patch)
      .eq('id', integration.id)
    if (error) return json({ error: error.message }, 500)
    return null
  }

  if (action === 'disconnect') {
    await serviceClient.rpc('revoke_integration_secret', { p_name: name })
    const { webhook_key: _dropped, ...restConfig } = (integration.config ?? {}) as Record<
      string,
      unknown
    >
    const failed = await patchRow({
      status: 'disconnected',
      secret_ref: null,
      last_checked_at: new Date().toISOString(),
      config: restConfig,
    })
    if (failed) return failed
    return json({ status: 'disconnected' })
  }

  let effectiveSecret = secret ?? ''
  if (action === 'test') {
    const { data: stored } = await serviceClient.rpc('read_integration_secret', { p_name: name })
    if (typeof stored !== 'string' || stored.length === 0) {
      return json({ error: 'No stored credential to test' }, 400)
    }
    effectiveSecret = stored
  }

  if (integration.provider === 'inbound_webhook') {
    if (action === 'connect') {
      // Mint, don't probe: the caller supplies no credential — the
      // function generates the webhook key + signing secret itself.
      // Re-running connect on a live row rotates both.
      const webhookKey = randomHex(24)
      const signingSecret = `dwhsec_${randomHex(24)}`
      await serviceClient.rpc('revoke_integration_secret', { p_name: name })
      const { error: vaultError } = await serviceClient.rpc('store_integration_secret', {
        p_name: name,
        p_secret: signingSecret,
      })
      if (vaultError) return json({ error: 'Could not store credential' }, 500)
      const failed = await patchRow({
        status: 'connected',
        secret_ref: name,
        last_checked_at: new Date().toISOString(),
        config: { ...(integration.config ?? {}), webhook_key: webhookKey },
      })
      if (failed) return failed
      return json({
        status: 'connected',
        webhookUrl: `${config.supabaseUrl}/functions/v1/integration-webhook/${webhookKey}`,
        signingSecret,
      })
    }
    // 'test': the Vault read above already succeeded — the signing
    // secret is in place, which is all a webhook endpoint needs.
    return json({ status: 'connected' })
  }

  if (integration.provider === 'inbound_email') {
    if (action === 'connect') {
      // Mint, don't probe: no credential involved — the function
      // generates the routing key and composes the workspace address.
      // The address only receives mail once the inbound domain's MX +
      // Resend webhook are configured (docs/INTEGRATIONS.md); that part
      // is account-level setup, not per-integration state.
      const emailKey = randomHex(24)
      const domain = Deno.env.get('INBOUND_EMAIL_DOMAIN') ?? 'in.dutiva.ca'
      const address = `in-${emailKey}@${domain}`
      const failed = await patchRow({
        status: 'connected',
        last_checked_at: new Date().toISOString(),
        config: {
          ...(integration.config ?? {}),
          email_key: emailKey,
          inbound_address: address,
        },
      })
      if (failed) return failed
      return json({ status: 'connected', inboundAddress: address })
    }
    // 'test': nothing to probe — the row either routes or it doesn't.
    return json({ status: 'connected' })
  }

  if (!effectiveSecret) return json({ error: 'Secret required' }, 400)

  if (integration.provider === 'smtp_email' && action === 'connect') {
    // Store-only path: keep the row honest as 'pending'.
    await serviceClient.rpc('revoke_integration_secret', { p_name: name })
    const { error: vaultError } = await serviceClient.rpc('store_integration_secret', {
      p_name: name,
      p_secret: effectiveSecret,
    })
    if (vaultError) return json({ error: 'Could not store credential' }, 500)
    const failed = await patchRow({ secret_ref: name, status: 'pending' })
    if (failed) return failed
    return json({ status: 'pending', stored: true })
  }

  if (integration.provider !== 'github' && integration.provider !== 'gitlab') {
    return json({ error: 'Provider not supported in phase 1' }, 400)
  }

  const probe = await probeProvider(integration.provider, integration.config, effectiveSecret)
  if (!probe.ok) {
    await patchRow({ status: 'error', last_checked_at: new Date().toISOString() })
    return json({ status: 'error', providerStatus: probe.providerStatus }, 502)
  }

  if (action === 'connect') {
    await serviceClient.rpc('revoke_integration_secret', { p_name: name })
    const { error: vaultError } = await serviceClient.rpc('store_integration_secret', {
      p_name: name,
      p_secret: effectiveSecret,
    })
    if (vaultError) return json({ error: 'Could not store credential' }, 500)
  }

  const failed = await patchRow({
    status: 'connected',
    secret_ref: name,
    last_checked_at: new Date().toISOString(),
    config: { ...(integration.config ?? {}), account_login: probe.account },
  })
  if (failed) return failed
  return json({ status: 'connected', account: probe.account })
})
