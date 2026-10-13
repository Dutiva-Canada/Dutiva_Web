import { applyFill, type AssetClass } from './handlers.ts'
import { json, type SupabaseClient } from './botShared.ts'

/* ── Manual order execution (paper fills + live confirmations) ──────────────
   The only fill path in the whole invest surface — invoked by the user from
   the Orders tab. The bot never executes anything itself. */

export async function executeOrder(
  adminClient: SupabaseClient,
  userId: string,
  orderId: string,
  fillPrice: number | null,
): Promise<Response> {
  const { data: order } = await adminClient
    .from('invest_orders')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', userId)
    .maybeSingle()
  if (!order) return json({ error: 'Order not found' }, 404)
  if (!['draft', 'queued'].includes(order.status as string)) {
    return json({ error: `Order is ${order.status}`, code: 'not_executable' }, 409)
  }

  /* The service role bypasses RLS, so bind the book to the caller: an order
     naming another user's account_id must not read their position or move
     their cash. */
  const { data: account } = await adminClient
    .from('invest_accounts')
    .select('cash_balance')
    .eq('id', order.account_id)
    .eq('user_id', userId)
    .maybeSingle()
  if (!account) return json({ error: 'Account not found', code: 'no_account' }, 404)

  let price = fillPrice
  if (price === null) {
    if (order.mode === 'live') {
      return json({ error: 'Live orders need an explicit fill price', code: 'fill_required' }, 400)
    }
    const { data: snap } = await adminClient
      .from('invest_market_snapshots')
      .select('price')
      .eq('user_id', userId)
      .eq('asset_class', order.asset_class)
      .eq('symbol', order.symbol)
      .maybeSingle()
    price = snap ? Number(snap.price) : (order.limit_price as number | null)
  }
  if (price === null || !Number.isFinite(price) || price <= 0) {
    return json({ error: 'No price available to execute at', code: 'no_price' }, 409)
  }

  const qty = Number(order.quantity)
  const side = order.side as 'buy' | 'sell'
  const now = new Date().toISOString()

  const { data: position } = await adminClient
    .from('invest_positions')
    .select('id, quantity, avg_cost')
    .eq('account_id', order.account_id)
    .eq('user_id', userId)
    .eq('asset_class', order.asset_class)
    .eq('symbol', order.symbol)
    .maybeSingle()
  /* A sell bigger than the holding can't fill — applyFill would floor the
     position at zero while cash still credited the full quantity. Reject
     instead of letting the ledger invent money. */
  const held = position ? Number(position.quantity) : 0
  if (side === 'sell' && qty > held) {
    return json(
      {
        error: `Only ${held} ${order.symbol} on hand — a sell of ${qty} can't fill.`,
        code: 'oversize_sell',
      },
      409,
    )
  }

  /* Claim the order before touching the book: the conditional update only
     lands while the row is still draft/queued, so a second concurrent
     execute call finds nothing to claim instead of double-filling. */
  const { data: claimed } = await adminClient
    .from('invest_orders')
    .update({ status: 'executed', executed_price: price, executed_at: now, updated_at: now })
    .eq('id', orderId)
    .eq('user_id', userId)
    .in('status', ['draft', 'queued'])
    .select('id')
  if (!claimed || claimed.length === 0) {
    return json({ error: `Order is ${order.status}`, code: 'not_executable' }, 409)
  }

  const fill = applyFill(
    position
      ? {
          account_id: '',
          asset_class: order.asset_class as AssetClass,
          symbol: order.symbol,
          quantity: Number(position.quantity),
          avg_cost: Number(position.avg_cost),
        }
      : null,
    side,
    qty,
    price,
  )

  /* The order is already claimed 'executed' — if a book write fails from
     here, hand the claim back so the row isn't a phantom fill. */
  const release = async (err: string): Promise<Response> => {
    await adminClient
      .from('invest_orders')
      .update({ status: String(order.status), executed_price: null, executed_at: null, error: err, updated_at: now })
      .eq('id', orderId)
      .eq('user_id', userId)
    return json({ error: `Execution failed: ${err}`, code: 'write_failed' }, 500)
  }

  if (position) {
    const { error } = await adminClient
      .from('invest_positions')
      .update({
        quantity: fill.quantity,
        avg_cost: fill.avg_cost,
        last_price: price,
        last_price_at: now,
        updated_at: now,
      })
      .eq('id', position.id)
    if (error) return release(error.message)
  } else if (side === 'buy') {
    const { error } = await adminClient.from('invest_positions').insert({
      user_id: userId,
      account_id: order.account_id,
      asset_class: order.asset_class,
      symbol: order.symbol,
      name: order.name,
      quantity: fill.quantity,
      avg_cost: fill.avg_cost,
      last_price: price,
      last_price_at: now,
    })
    if (error) return release(error.message)
  }

  const cost = qty * price
  const { error: cashError } = await adminClient
    .from('invest_accounts')
    .update({
      cash_balance: Number(account.cash_balance) + (side === 'sell' ? cost : -cost),
      updated_at: now,
    })
    .eq('id', order.account_id)
    .eq('user_id', userId)
  if (cashError) return release(cashError.message)

  return json({ status: 'executed', executed_price: price })
}
