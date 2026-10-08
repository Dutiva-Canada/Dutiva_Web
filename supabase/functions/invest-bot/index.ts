import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { validateBotAction } from './handlers.ts'
import { withCors } from '../_shared/cors.ts'
import {
  authenticateInvestUser,
  CORS,
  corsHeaders,
  isAuthorizedTrigger,
  json,
  serverConfig,
} from './botShared.ts'
import { runUser } from './runs.ts'
import { testScan } from './testScan.ts'
import { executeOrder } from './orders.ts'

/**
 * Invest-bot edge function — evaluates each user's enabled strategies
 * against the symbols in each strategy's scope, emits signals, and turns
 * order-proposal rules into DRAFT orders that wait in the Orders tab for
 * explicit user approval. The bot never executes anything itself; the only
 * fill path is the user-invoked execute-order action below.
 *
 * Actions (POST body):
 *   { action: 'run' }                          — invest-portal JWT; scans the
 *                                                caller's strategies now
 *                                                (manual scans ignore the
 *                                                cadence window).
 *   { action: 'run-all' }                      — service key / trigger
 *                                                secret (nightly sweep), or
 *                                                a portal JWT whose grant is
 *                                                role 'admin'. Cadence-gated.
 *   { action: 'test-scan', rules, symbols }    — invest-portal JWT; dry-run
 *                                                diagnostics for a draft
 *                                                strategy. Writes nothing.
 *   { action: 'execute-order', order_id }      — invest-portal JWT; executes a
 *                                                draft/queued paper order at
 *                                                the snapshot price, or
 *                                                confirms a live order at
 *                                                the caller-provided fill.
 *
 * Deliberate scope: market data comes from invest_market_snapshots (manual
 * or future feed adapters); no broker calls are ever made — 'live' orders
 * are bookkeeping that a human confirms.
 */

const handler = async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const config = serverConfig()
  if (config instanceof Response) return config

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const actionCheck = validateBotAction(body['action'])
  if (!actionCheck.ok) return json({ error: actionCheck.error }, 400)

  if (actionCheck.value === 'run-all') {
    /* Trigger secret / service key first; otherwise an admin-tier grant
       holder may invoke the sweep with their own portal JWT. */
    if (!isAuthorizedTrigger(req)) {
      const authed = await authenticateInvestUser(req, config, { requireAdmin: true })
      if (authed instanceof Response) return authed
    }
    const adminClient = createClient(config.supabaseUrl, config.serviceRoleKey)
    /* Users with at least one enabled strategy — cheaper than sweeping all. */
    const { data: userRows } = await adminClient
      .from('invest_strategies')
      .select('user_id')
      .eq('enabled', true)
    const userIds = [...new Set((userRows ?? []).map((r) => r.user_id as string))]
    const results: Record<string, unknown>[] = []
    for (const userId of userIds) {
      try {
        results.push({ userId, ...(await runUser(adminClient, userId)) })
      } catch (error) {
        console.error('invest-bot: run failed', userId, error)
        results.push({ userId, error: String(error).slice(0, 200) })
      }
    }
    return json({ scanned: results.length, results })
  }

  const authed = await authenticateInvestUser(req, config)
  if (authed instanceof Response) return authed
  const { userId, adminClient } = authed

  if (actionCheck.value === 'run') {
    return json(await runUser(adminClient, userId, { force: true }))
  }

  if (actionCheck.value === 'test-scan') {
    return testScan(adminClient, userId, body)
  }

  /* execute-order */
  const orderId = typeof body['order_id'] === 'string' ? body['order_id'] : ''
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    return json({ error: 'order_id must be a uuid' }, 400)
  }
  const fill =
    typeof body['fill_price'] === 'number' && body['fill_price'] > 0
      ? (body['fill_price'] as number)
      : null
  return executeOrder(adminClient, userId, orderId, fill)
}

Deno.serve(async (req) => withCors(req, await handler(req), CORS))
