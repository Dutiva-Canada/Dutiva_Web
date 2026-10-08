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
    .eq('asset_class', order.asset_class)
    .eq('symbol', order.symbol)
    .maybeSingle()
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

  if (position) {
    await adminClient
      .from('invest_positions')
      .update({
        quantity: fill.quantity,
        avg_cost: fill.avg_cost,
        last_price: price,
        last_price_at: now,
        updated_at: now,
      })
      .eq('id', position.id)
  } else if (side === 'buy') {
    await adminClient.from('invest_positions').insert({
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
  }

  const cost = qty * price
  const { data: account } = await adminClient
    .from('invest_accounts')
    .select('cash_balance')
    .eq('id', order.account_id)
    .maybeSingle()
  if (account) {
    await adminClient
      .from('invest_accounts')
      .update({
        cash_balance: Number(account.cash_balance) + (side === 'sell' ? cost : -cost),
        updated_at: now,
      })
      .eq('id', order.account_id)
  }

  await adminClient
    .from('invest_orders')
    .update({ status: 'executed', executed_price: price, executed_at: now, updated_at: now })
    .eq('id', orderId)

  return json({ status: 'executed', executed_price: price })
}
