import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import type { Database } from '../_shared/database.types.ts'
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
import { executeOrder, importFill } from './orders.ts'
import { ASSET_CLASSES, type AssetClass } from './handlers.ts'

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
    const adminClient = createClient<Database>(config.supabaseUrl, config.serviceRoleKey)
    /* Strategy owners AND portal-granted users — a book holder who never
       made a strategy is the suggestion pass's biggest case, and paused
       owners still need draft-expiry/digest maintenance. runUser
       cheap-exits when nothing is actually due. */
    const [strategyOwners, accessRows] = await Promise.all([
      adminClient.from('invest_strategies').select('user_id'),
      adminClient.from('invest_access').select('user_id'),
    ])
    const userIds = [
      ...new Set(
        [
          ...(strategyOwners.data ?? []).map((r) => r.user_id as string),
          ...(accessRows.data ?? []).map((r) => r.user_id as string),
        ],
      ),
    ]
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
  const { userId, email, adminClient } = authed

  if (actionCheck.value === 'run') {
    return json(await runUser(adminClient, userId, { force: true, email }))
  }

  if (actionCheck.value === 'test-scan') {
    return testScan(adminClient, userId, body)
  }

  if (actionCheck.value === 'import-fill') {
    /* Historical fill recording — external books backfill trades that
       already happened elsewhere. apply_book=false keeps it pure history
       when the position was bulk-imported already. */
    const assetClass = typeof body['asset_class'] === 'string' ? body['asset_class'] : 'equity'
    if (!ASSET_CLASSES.includes(assetClass as (typeof ASSET_CLASSES)[number])) {
      return json({ error: 'asset_class must be a known class' }, 400)
    }
    const symbol = typeof body['symbol'] === 'string' ? body['symbol'].trim().toUpperCase() : ''
    if (!/^[A-Z0-9.^-]{1,12}$/.test(symbol)) {
      return json({ error: 'symbol must be a ticker' }, 400)
    }
    const side = body['side'] === 'sell' ? 'sell' : body['side'] === 'buy' ? 'buy' : null
    if (!side) return json({ error: 'side must be buy or sell' }, 400)
    return importFill(adminClient, userId, {
      account_id: typeof body['account_id'] === 'string' ? body['account_id'] : '',
      asset_class: assetClass as AssetClass,
      symbol,
      name: typeof body['name'] === 'string' ? body['name'] : undefined,
      side,
      quantity: Number(body['quantity']),
      price: Number(body['price']),
      filled_at: typeof body['filled_at'] === 'string' ? body['filled_at'] : '',
      note: typeof body['note'] === 'string' ? body['note'].slice(0, 300) : undefined,
      apply_book: body['apply_book'] !== false,
    })
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
  const fillQty =
    typeof body['fill_quantity'] === 'number' && body['fill_quantity'] > 0
      ? (body['fill_quantity'] as number)
      : null
  const fillStamp = typeof body['filled_at'] === 'string' ? body['filled_at'] : null
  return executeOrder(adminClient, userId, orderId, fill, fillQty, fillStamp)
}

Deno.serve(async (req) => withCors(req, await handler(req), CORS))
