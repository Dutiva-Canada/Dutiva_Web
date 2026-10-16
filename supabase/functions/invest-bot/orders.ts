import { applyFill, type AssetClass } from './handlers.ts'
import { convertFx, fetchFxTable } from './fx.ts'
import { json, type SupabaseClient } from './botShared.ts'

/* ── Manual order execution (paper fills + live confirmations) ──────────────
   The only fill path in the whole invest surface — invoked by the user from
   the Orders tab. The bot never executes anything itself. */

export async function executeOrder(
  adminClient: SupabaseClient,
  userId: string,
  orderId: string,
  fillPrice: number | null,
  fillQuantity?: number | null,
  filledAt?: string | null,
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
    .select('cash_balance, base_currency')
    .eq('id', order.account_id)
    .eq('user_id', userId)
    .maybeSingle()
  if (!account) return json({ error: 'Account not found', code: 'no_account' }, 404)

  /* Prior fills bound what this call may still fill — a partial order's
     remaining is quantity minus what's already landed. */
  const { data: priorFills } = await adminClient
    .from('invest_order_fills')
    .select('quantity, price')
    .eq('order_id', orderId)
    .eq('user_id', userId)
  const prior = (priorFills ?? []) as { quantity: number; price: number }[]
  const filledSoFar = prior.reduce((sum, f) => sum + Number(f.quantity), 0)
  const remaining = Number(order.quantity) - filledSoFar
  if (remaining <= 0) {
    /* Fully filled but still queued — a settle that lost its flip before.
       Finish the status so the row stops looking actionable. */
    await adminClient
      .from('invest_orders')
      .update({ status: 'executed', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('user_id', userId)
      .in('status', ['draft', 'queued'])
    return json({ error: 'Order is already fully filled', code: 'filled' }, 409)
  }
  const qty = fillQuantity === undefined || fillQuantity === null ? remaining : Number(fillQuantity)
  if (!Number.isFinite(qty) || qty <= 0 || qty > remaining) {
    return json(
      { error: `Fill must be 0–${remaining} (${remaining} unfilled)`, code: 'bad_fill_qty' },
      400,
    )
  }

  let price = fillPrice
  let snapCcy: string | null = null
  if (price === null) {
    if (order.mode === 'live') {
      return json({ error: 'Live orders need an explicit fill price', code: 'fill_required' }, 400)
    }
    const { data: snap } = await adminClient
      .from('invest_market_snapshots')
      .select('price, currency')
      .eq('user_id', userId)
      .eq('asset_class', order.asset_class)
      .eq('symbol', order.symbol)
      .maybeSingle()
    snapCcy = snap?.currency ? String(snap.currency).toUpperCase() : null
    price = snap ? Number(snap.price) : (order.limit_price as number | null)
  }
  if (price === null || !Number.isFinite(price) || price <= 0) {
    return json({ error: 'No price available to execute at', code: 'no_price' }, 409)
  }

  const side = order.side as 'buy' | 'sell'
  const now = new Date().toISOString()
  const fillStamp =
    filledAt && !Number.isNaN(Date.parse(filledAt)) ? new Date(filledAt).toISOString() : now

  const { data: position } = await adminClient
    .from('invest_positions')
    .select('id, quantity, avg_cost, currency')
    .eq('account_id', order.account_id)
    .eq('user_id', userId)
    .eq('asset_class', order.asset_class)
    .eq('symbol', order.symbol)
    .maybeSingle()
  /* A fill bigger than the holding can't land — applyFill would floor the
     position at zero while cash still credited the full quantity. */
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

  /* The fill price is denominated in the instrument's currency — the held
     position's when it exists, else the snapshot's, else the account base.
     cash_balance is always in the account base, so the cash move converts
     qty×price at the ECB rate; a missing rate refuses the fill before the
     claim below, rather than posting a USD cost against a CAD balance.
     avg_cost stays in instrument currency on both legs, so applyFill math
     needs no conversion. */
  const accCcy = String(account.base_currency ?? 'CAD').toUpperCase()
  let fillCcy =
    (position?.currency ? String(position.currency).toUpperCase() : null) ?? snapCcy
  if (!fillCcy) {
    /* Live order with an explicit price on a new symbol — the snapshot
       wasn't needed for the quote, but it's the only place that knows
       the instrument's currency. */
    const { data: ccySnap } = await adminClient
      .from('invest_market_snapshots')
      .select('currency')
      .eq('user_id', userId)
      .eq('asset_class', order.asset_class)
      .eq('symbol', order.symbol)
      .maybeSingle()
    fillCcy = ccySnap?.currency ? String(ccySnap.currency).toUpperCase() : accCcy
  }
  let costBase = qty * price
  if (fillCcy !== accCcy) {
    const conv = convertFx(costBase, fillCcy, accCcy, await fetchFxTable())
    if (conv === null) {
      return json(
        { error: `No ${fillCcy}->${accCcy} FX rate to settle the fill`, code: 'no_fx' },
        409,
      )
    }
    costBase = conv
  }

  /* Completing fills claim the order first: the conditional update only
     lands while the row is still draft/queued, so a second concurrent
     execute finds nothing to claim instead of double-filling. The settled
     price is the fills' VWAP — the last fill's price alone would misstate
     a split execution. Partial fills skip the claim — the order stays
     queued and next fill lands against the true remaining. */
  const complete = qty >= remaining
  if (complete) {
    const allFills = [...prior, { quantity: qty, price }]
    const qtySum = allFills.reduce((s, f) => s + Number(f.quantity), 0)
    const vwap = allFills.reduce((s, f) => s + Number(f.quantity) * Number(f.price), 0) / qtySum
    const { data: claimed } = await adminClient
      .from('invest_orders')
      .update({
        status: 'executed',
        executed_price: vwap,
        executed_at: fillStamp,
        updated_at: now,
      })
      .eq('id', orderId)
      .eq('user_id', userId)
      .in('status', ['draft', 'queued'])
      .select('id')
    if (!claimed || claimed.length === 0) {
      return json({ error: `Order is ${order.status}`, code: 'not_executable' }, 409)
    }
  }

  /* Record the fill — it captures the position's avg cost before this
     fill moves it, which is what makes realized P&L on sells honest
     later. A failed book write deletes the row (and hands a completing
     claim back) so nothing double-counts. */
  const { data: fillRow, error: fillErr } = await adminClient
    .from('invest_order_fills')
    .insert({
      user_id: userId,
      order_id: orderId,
      quantity: qty,
      price,
      filled_at: fillStamp,
      avg_cost_at_fill: position ? Number(position.avg_cost) : null,
    })
    .select('id')
    .single()
  if (fillErr) {
    return json({ error: `Execution failed: ${fillErr.message}`, code: 'write_failed' }, 500)
  }
  const release = async (err: string): Promise<Response> => {
    await adminClient
      .from('invest_order_fills')
      .delete()
      .eq('id', fillRow.id)
      .eq('user_id', userId)
    if (complete) {
      /* Hand the claim back — the fill is gone, the order isn't done. */
      await adminClient
        .from('invest_orders')
        .update({
          status: String(order.status),
          executed_price: null,
          executed_at: null,
          error: err,
          updated_at: now,
        })
        .eq('id', orderId)
        .eq('user_id', userId)
    } else {
      await adminClient
        .from('invest_orders')
        .update({ error: err, updated_at: now })
        .eq('id', orderId)
        .eq('user_id', userId)
    }
    return json({ error: `Execution failed: ${err}`, code: 'write_failed' }, 500)
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
      /* The instrument's currency, not the column default — a USD fill
         landing 'CAD' would corrupt every FX conversion downstream. */
      currency: fillCcy,
    })
    if (error) return release(error.message)
  }

  const { error: cashError } = await adminClient
    .from('invest_accounts')
    .update({
      cash_balance: Number(account.cash_balance) + (side === 'sell' ? costBase : -costBase),
      updated_at: now,
    })
    .eq('id', order.account_id)
    .eq('user_id', userId)
  if (cashError) return release(cashError.message)

  return json({
    status: complete ? 'executed' : 'partial',
    executed_price: price,
    filled: filledSoFar + qty,
    remaining: Number(order.quantity) - (filledSoFar + qty),
  })
}

/* ── Fill backfill (0224) — external books record real history. Each row
   becomes an executed order + its fill; `applyBook` decides whether the
   position/cash move with it (false = pure history for a book that already
   mirrors the net result). Oldest-first keeps avg_cost_at_fill honest. ── */

export async function importFill(
  adminClient: SupabaseClient,
  userId: string,
  input: {
    account_id: string
    asset_class: AssetClass
    symbol: string
    name?: string
    side: 'buy' | 'sell'
    quantity: number
    price: number
    filled_at: string
    /** Currency the fill price is denominated in — defaults to the held
        position's, then the account base. */
    currency?: string
    note?: string
    apply_book?: boolean
  },
): Promise<Response> {
  const { data: account } = await adminClient
    .from('invest_accounts')
    .select('cash_balance, base_currency')
    .eq('id', input.account_id)
    .eq('user_id', userId)
    .maybeSingle()
  if (!account) return json({ error: 'Account not found', code: 'no_account' }, 404)

  const qty = Number(input.quantity)
  const price = Number(input.price)
  if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(price) || price <= 0) {
    return json({ error: 'Fill needs a positive quantity and price', code: 'bad_fill' }, 400)
  }
  const stamp = new Date(input.filled_at)
  if (Number.isNaN(stamp.getTime())) {
    return json({ error: 'filled_at must be a date', code: 'bad_fill' }, 400)
  }
  const iso = stamp.toISOString()
  const applyBook = input.apply_book !== false

  const { data: position } = await adminClient
    .from('invest_positions')
    .select('id, quantity, avg_cost, currency')
    .eq('account_id', input.account_id)
    .eq('user_id', userId)
    .eq('asset_class', input.asset_class)
    .eq('symbol', input.symbol)
    .maybeSingle()
  if (applyBook && input.side === 'sell' && qty > (position ? Number(position.quantity) : 0)) {
    return json(
      { error: `Sell of ${qty} ${input.symbol} exceeds the holding on file`, code: 'oversize_sell' },
      409,
    )
  }

  /* History rows are already settled — the order lands executed and the
     fill carries the pre-fill avg cost when the book moves. */
  const { data: orderRow, error: orderErr } = await adminClient
    .from('invest_orders')
    .insert({
      user_id: userId,
      account_id: input.account_id,
      asset_class: input.asset_class,
      symbol: input.symbol,
      name: input.name ?? input.symbol,
      side: input.side,
      quantity: qty,
      order_type: 'market',
      mode: 'live',
      status: 'executed',
      executed_price: price,
      executed_at: iso,
      note: input.note ?? null,
    })
    .select('id')
    .single()
  if (orderErr) return json({ error: orderErr.message, code: 'write_failed' }, 500)

  const { error: fillErr } = await adminClient.from('invest_order_fills').insert({
    user_id: userId,
    order_id: orderRow.id,
    quantity: qty,
    price,
    filled_at: iso,
    avg_cost_at_fill: applyBook && position ? Number(position.avg_cost) : null,
    note: 'imported',
  })
  if (fillErr) {
    await adminClient.from('invest_orders').delete().eq('id', orderRow.id).eq('user_id', userId)
    return json({ error: fillErr.message, code: 'write_failed' }, 500)
  }

  if (applyBook) {
    const fill = applyFill(
      position
        ? {
            account_id: '',
            asset_class: input.asset_class,
            symbol: input.symbol,
            quantity: Number(position.quantity),
            avg_cost: Number(position.avg_cost),
          }
        : null,
      input.side,
      qty,
      price,
    )
    /* Same ledger invariant as executeOrder — the fill price is in the
       instrument's currency (the position's when held, else the caller's
       declared currency, else the account base); the cash move converts
       to base or the whole import is rejected. */
    const accCcy = String(account.base_currency ?? 'CAD').toUpperCase()
    const fillCcy = String(
      position?.currency ?? input.currency ?? accCcy,
    ).toUpperCase()
    let costBase = qty * price
    if (fillCcy !== accCcy) {
      const conv = convertFx(costBase, fillCcy, accCcy, await fetchFxTable())
      if (conv === null) {
        await adminClient.from('invest_order_fills').delete().eq('order_id', orderRow.id).eq('user_id', userId)
        await adminClient.from('invest_orders').delete().eq('id', orderRow.id).eq('user_id', userId)
        return json(
          { error: `No ${fillCcy}->${accCcy} FX rate to book the fill`, code: 'no_fx' },
          409,
        )
      }
      costBase = conv
    }
    if (position) {
      await adminClient
        .from('invest_positions')
        .update({
          quantity: fill.quantity,
          avg_cost: fill.avg_cost,
          last_price: price,
          last_price_at: iso,
          updated_at: iso,
        })
        .eq('id', position.id)
    } else if (input.side === 'buy') {
      await adminClient.from('invest_positions').insert({
        user_id: userId,
        account_id: input.account_id,
        asset_class: input.asset_class,
        symbol: input.symbol,
        name: input.name ?? input.symbol,
        quantity: fill.quantity,
        avg_cost: fill.avg_cost,
        last_price: price,
        last_price_at: iso,
        currency: fillCcy,
      })
    }
    await adminClient
      .from('invest_accounts')
      .update({
        cash_balance: Number(account.cash_balance) + (input.side === 'sell' ? costBase : -costBase),
        updated_at: iso,
      })
      .eq('id', input.account_id)
      .eq('user_id', userId)
  }

  return json({ status: 'executed', order_id: orderRow.id, filled: qty })
}
