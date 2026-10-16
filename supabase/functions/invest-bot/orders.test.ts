import { describe, expect, it, vi } from 'vitest'

/* botShared pulls in the npm: Supabase client — the test never loads it;
   json() is the only runtime import orders.ts needs. */
vi.mock('./botShared.ts', () => ({
  json: (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
}))

/* fetchFxTable is the only network call in the fill path — stub the table,
   keep the real convertFx so the tests exercise actual rate math. */
const fxStub = vi.hoisted(() => ({
  table: null as null | { date: string; rates: Record<string, number> },
}))
vi.mock('./fx.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('./fx.ts')>()
  return { ...real, fetchFxTable: async () => fxStub.table }
})

import { executeOrder, importFill } from './orders'
import type { SupabaseClient } from './botShared'

/* ── executeOrder — the only fill path. A table-backed fake exercises the
   real promise chain: .from().select().eq().maybeSingle() reads, mutation
   thenables, and the conditional .in('status', …) claim that serializes
   concurrent executes. `frozen` serves stale SELECT rows while writes hit
   live state — that's the lost-update window the claim guards. */

type Row = Record<string, unknown>

interface FakeDb {
  client: SupabaseClient
  tables: Record<string, Row[]>
}

function fakeDb(
  seed: Record<string, Row[]>,
  opts: { frozen?: Record<string, Row[]>; failOn?: { table: string; op: string } } = {},
): FakeDb {
  const tables = seed
  const from = (table: string) => {
    const live = tables[table] ?? (tables[table] = [])
    const read = opts.frozen?.[table] ?? live
    let op: 'select' | 'update' | 'insert' | 'delete' = 'select'
    let payload: Row | null = null
    const filters: [string, unknown[]][] = []
    const match = (r: Row) =>
      filters.every(([col, vals]) => vals.some((v) => r[col] === v))
    const run = (): { data: unknown; error: { message: string } | null } => {
      if (opts.failOn && opts.failOn.table === table && opts.failOn.op === op) {
        return { data: null, error: { message: `${table} ${op} failed` } }
      }
      if (op === 'update') {
        const hit = live.filter(match)
        for (const r of hit) Object.assign(r, payload)
        return { data: hit.map((r) => ({ ...r })), error: null }
      }
      if (op === 'insert') {
        const row = { id: `new-${table}-${live.length}`, ...(payload as Row) }
        live.push(row)
        return { data: { ...row }, error: null }
      }
      if (op === 'delete') {
        const kept = live.filter((r) => !match(r))
        const gone = live.length - kept.length
        tables[table] = kept
        /* `live` was the array we spliced out from under — swap the seed
           reference too so `tables` reads the post-delete rows. */
        return { data: new Array(gone), error: null }
      }
      return { data: read.filter(match).map((r) => ({ ...r })), error: null }
    }
    const q: Record<string, unknown> = {
      select: () => q,
      eq: (col: string, v: unknown) => (filters.push([col, [v]]), q),
      in: (col: string, vs: unknown[]) => (filters.push([col, vs]), q),
      is: (col: string, v: unknown) => (filters.push([col, [v]]), q),
      update: (p: Row) => ((op = 'update'), (payload = p), q),
      insert: (p: Row) => ((op = 'insert'), (payload = p), q),
      delete: () => ((op = 'delete'), q),
      maybeSingle: () => {
        const res = run()
        const arr = res.data
        return Promise.resolve({
          data: Array.isArray(arr) ? (arr[0] ?? null) : arr,
          error: res.error,
        })
      },
      single: () => {
        const res = run()
        const arr = res.data
        return Promise.resolve({
          data: Array.isArray(arr) ? (arr[0] ?? null) : arr,
          error: res.error,
        })
      },
      then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
        Promise.resolve(run()).then(res, rej),
    }
    return q
  }
  return { client: { from } as unknown as SupabaseClient, tables }
}

const ORDER: Row = {
  id: 'ord-1',
  user_id: 'u-1',
  account_id: 'acc-1',
  asset_class: 'equity',
  symbol: 'ARM',
  name: 'Arm Holdings',
  side: 'sell',
  quantity: 5,
  order_type: 'market',
  limit_price: null,
  mode: 'paper',
  status: 'queued',
  error: null,
}

const POSITION: Row = {
  id: 'pos-1',
  user_id: 'u-1',
  account_id: 'acc-1',
  asset_class: 'equity',
  symbol: 'ARM',
  quantity: 5,
  avg_cost: 100,
}

function baseSeed(over: Partial<Row> = {}): Record<string, Row[]> {
  return {
    invest_orders: [{ ...ORDER, ...over }],
    invest_positions: [{ ...POSITION }],
    invest_accounts: [{ id: 'acc-1', user_id: 'u-1', cash_balance: 1000 }],
    invest_market_snapshots: [
      { user_id: 'u-1', asset_class: 'equity', symbol: 'ARM', price: 120 },
    ],
  }
}

describe('executeOrder', () => {
  it('rejects a sell larger than the holding — no minted cash', async () => {
    const { client, tables } = fakeDb(baseSeed({ quantity: 50 }))
    const res = await executeOrder(client, 'u-1', 'ord-1', null)
    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({ code: 'oversize_sell' })
    expect(tables['invest_positions']![0]!['quantity']).toBe(5)
    expect(tables['invest_accounts']![0]!['cash_balance']).toBe(1000)
    expect(tables['invest_orders']![0]!['status']).toBe('queued')
  })

  it('rejects a sell with no position at all', async () => {
    const seed = baseSeed()
    seed['invest_positions'] = []
    const { client, tables } = fakeDb(seed)
    const res = await executeOrder(client, 'u-1', 'ord-1', null)
    expect(res.status).toBe(409)
    expect(tables['invest_accounts']![0]!['cash_balance']).toBe(1000)
  })

  it('fills an exact sell — position to zero, cash credited', async () => {
    const { client, tables } = fakeDb(baseSeed())
    const res = await executeOrder(client, 'u-1', 'ord-1', null)
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ status: 'executed', executed_price: 120 })
    expect(tables['invest_positions']![0]!['quantity']).toBe(0)
    expect(tables['invest_accounts']![0]!['cash_balance']).toBe(1600)
    expect(tables['invest_orders']![0]!['status']).toBe('executed')
  })

  it('fills a buy — inserts the position, debits cash', async () => {
    const seed = baseSeed({ side: 'buy', quantity: 2 })
    seed['invest_positions'] = []
    const { client, tables } = fakeDb(seed)
    const res = await executeOrder(client, 'u-1', 'ord-1', null)
    expect(res.status).toBe(200)
    const pos = tables['invest_positions']![0]!
    expect(pos['quantity']).toBe(2)
    expect(pos['avg_cost']).toBe(120)
    expect(tables['invest_accounts']![0]!['cash_balance']).toBe(760)
  })

  it('refuses an already-resolved order', async () => {
    const { client } = fakeDb(baseSeed({ status: 'executed' }))
    const res = await executeOrder(client, 'u-1', 'ord-1', null)
    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({ code: 'not_executable' })
  })

  it('loses the race — stale read passes the gate, the claim finds nothing', async () => {
    /* The second caller's SELECT saw 'queued', but the winner already
       claimed: the conditional update matches zero rows and the loser
       exits instead of double-filling. */
    const seed = baseSeed({ status: 'executed' })
    const { client, tables } = fakeDb(seed, {
      frozen: { invest_orders: [{ ...ORDER }] },
    })
    const res = await executeOrder(client, 'u-1', 'ord-1', null)
    expect(res.status).toBe(409)
    expect(tables['invest_positions']![0]!['quantity']).toBe(5)
    expect(tables['invest_accounts']![0]!['cash_balance']).toBe(1000)
  })

  it('refuses an order whose account belongs to someone else', async () => {
    /* The service role bypasses RLS — an order row naming a foreign
       account_id must not read that book's position or move its cash. */
    const seed = baseSeed()
    seed['invest_accounts'] = [{ id: 'acc-1', user_id: 'u-2', cash_balance: 1000 }]
    const { client, tables } = fakeDb(seed)
    const res = await executeOrder(client, 'u-1', 'ord-1', null)
    expect(res.status).toBe(404)
    expect(await res.json()).toMatchObject({ code: 'no_account' })
    expect(tables['invest_accounts']![0]!['cash_balance']).toBe(1000)
    expect(tables['invest_orders']![0]!['status']).toBe('queued')
  })

  it('live orders refuse to fill without an explicit price', async () => {
    const { client } = fakeDb(baseSeed({ mode: 'live' }))
    const res = await executeOrder(client, 'u-1', 'ord-1', null)
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: 'fill_required' })
  })

  it('hands the claim back when a book write fails', async () => {
    const { client, tables } = fakeDb(baseSeed(), {
      failOn: { table: 'invest_positions', op: 'update' },
    })
    const res = await executeOrder(client, 'u-1', 'ord-1', null)
    expect(res.status).toBe(500)
    const order = tables['invest_orders']![0]!
    expect(order['status']).toBe('queued')
    expect(order['executed_price']).toBeNull()
    expect(order['error']).toMatch(/failed/)
  })

  /* ── 0224: partial fills, VWAP settlement, fill rows ─────────────────── */

  it('records a partial fill — order stays queued, position moves by the filled qty', async () => {
    const { client, tables } = fakeDb(baseSeed())
    const res = await executeOrder(client, 'u-1', 'ord-1', 110, 2)
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ status: 'partial', filled: 2, remaining: 3 })
    /* Only the fill landed — the claim doesn't fire while quantity remains. */
    expect(tables['invest_orders']![0]!['status']).toBe('queued')
    expect(tables['invest_positions']![0]!['quantity']).toBe(3)
    expect(tables['invest_accounts']![0]!['cash_balance']).toBe(1220)
    const fill = tables['invest_order_fills']![0]!
    expect(fill).toMatchObject({
      order_id: 'ord-1',
      quantity: 2,
      price: 110,
      avg_cost_at_fill: 100,
    })
  })

  it('completing fill settles at the fills VWAP, not the last price', async () => {
    const seed = baseSeed()
    seed['invest_order_fills'] = [
      { order_id: 'ord-1', user_id: 'u-1', quantity: 2, price: 100, filled_at: 'x' },
    ]
    /* The prior 2-of-5 sell already moved the book — a consistent seed
       holds 3 left, not the original 5. */
    seed['invest_positions'] = [{ ...POSITION, quantity: 3 }]
    const { client, tables } = fakeDb(seed)
    /* 2 of 5 already landed at 100 — this fill takes the remaining 3. */
    const res = await executeOrder(client, 'u-1', 'ord-1', 140, 3)
    expect(res.status).toBe(200)
    /* VWAP = (2·100 + 3·140) / 5 = 124 — the single-price claim would
       have booked 140. */
    expect(tables['invest_orders']![0]!['executed_price']).toBeCloseTo(124)
    expect(tables['invest_positions']![0]!['quantity']).toBe(0)
    /* Cash: prior 2×100 already settled in the seeded balance's implied
       history; this call adds 3×140. */
    expect(tables['invest_accounts']![0]!['cash_balance']).toBe(1420)
  })

  it('a fill bigger than the remaining rejects instead of over-filling', async () => {
    const seed = baseSeed()
    seed['invest_order_fills'] = [
      { order_id: 'ord-1', user_id: 'u-1', quantity: 2, price: 100, filled_at: 'x' },
    ]
    const { client, tables } = fakeDb(seed)
    const res = await executeOrder(client, 'u-1', 'ord-1', 120, 4)
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: 'bad_fill_qty' })
    expect(tables['invest_positions']![0]!['quantity']).toBe(5)
  })

  it('a sell carrying an explicit back-dated stamp lands with it', async () => {
    const { client, tables } = fakeDb(baseSeed())
    const res = await executeOrder(client, 'u-1', 'ord-1', 115, 5, '2025-06-01')
    expect(res.status).toBe(200)
    const fill = tables['invest_order_fills']!.find((f) => f['order_id'] === 'ord-1')!
    expect(fill['filled_at']).toBe(new Date('2025-06-01').toISOString())
  })
})

describe('importFill', () => {
  const FILL = {
    account_id: 'acc-1',
    asset_class: 'equity' as const,
    symbol: 'ARM',
    side: 'buy' as const,
    quantity: 4,
    price: 90,
    filled_at: '2025-01-15',
  }

  it('lands an executed order + fill and moves the book', async () => {
    const { client, tables } = fakeDb(baseSeed())
    const res = await importFill(client, 'u-1', FILL)
    expect(res.status).toBe(200)
    const pos = tables['invest_positions']![0]!
    /* Seeded 5@100 + imported 4@90 → 9 @ 95.56. */
    expect(pos['quantity']).toBe(9)
    expect(pos['avg_cost']).toBeCloseTo(95.56, 2)
    expect(tables['invest_accounts']![0]!['cash_balance']).toBe(640)
    const order = tables['invest_orders']!.find((o) => o['status'] === 'executed')!
    expect(order).toMatchObject({ mode: 'live', executed_price: 90 })
    const fill = tables['invest_order_fills']![0]!
    expect(fill['avg_cost_at_fill']).toBe(100)
    expect(fill['note']).toBe('imported')
  })

  it('apply_book=false records history without touching the book', async () => {
    const { client, tables } = fakeDb(baseSeed())
    const res = await importFill(client, 'u-1', { ...FILL, apply_book: false })
    expect(res.status).toBe(200)
    expect(tables['invest_positions']![0]!['quantity']).toBe(5)
    expect(tables['invest_accounts']![0]!['cash_balance']).toBe(1000)
    /* avg_cost_at_fill stays null — nothing was applied to compare it to. */
    expect(tables['invest_order_fills']![0]!['avg_cost_at_fill']).toBeNull()
  })

  it('refuses a foreign account — service role still honors ownership', async () => {
    const seed = baseSeed()
    seed['invest_accounts'] = [{ id: 'acc-1', user_id: 'u-2', cash_balance: 1000 }]
    const { client, tables } = fakeDb(seed)
    const res = await importFill(client, 'u-1', FILL)
    expect(res.status).toBe(404)
    expect(tables['invest_orders']).toHaveLength(1)
  })

  it('refuses a sell bigger than the imported book holds', async () => {
    const { client, tables } = fakeDb(baseSeed())
    const res = await importFill(client, 'u-1', { ...FILL, side: 'sell', quantity: 9 })
    expect(res.status).toBe(409)
    expect(tables['invest_positions']![0]!['quantity']).toBe(5)
  })
})

describe('cross-currency fills', () => {
  /* 1 CAD = 0.73 USD → 1 USD ≈ 1.3699 CAD. cash_balance is always in the
     account's base currency — the fill converts qty×price, never 1:1. */
  const USD_FX = { date: '2026-10-13', rates: { CAD: 1, USD: 0.73 } }
  const usdSeed = (): Record<string, Row[]> => ({
    invest_orders: [{ ...ORDER }],
    invest_positions: [{ ...POSITION, currency: 'USD' }],
    invest_accounts: [
      { id: 'acc-1', user_id: 'u-1', cash_balance: 1000, base_currency: 'CAD' },
    ],
    invest_market_snapshots: [
      { user_id: 'u-1', asset_class: 'equity', symbol: 'ARM', price: 120, currency: 'USD' },
    ],
  })

  it('a USD sell credits CAD at the ECB rate, not raw dollars', async () => {
    fxStub.table = USD_FX
    const { client, tables } = fakeDb(usdSeed())
    const res = await executeOrder(client, 'u-1', 'ord-1', null)
    expect(res.status).toBe(200)
    /* 5 × 120 USD = 600 USD → 821.92 CAD (the old code booked 600 raw). */
    expect(tables['invest_accounts']![0]!['cash_balance']).toBeCloseTo(1821.92, 2)
    fxStub.table = null
  })

  it('a USD buy stamps the new position currency and debits CAD', async () => {
    fxStub.table = USD_FX
    const seed = usdSeed()
    seed['invest_orders'] = [{ ...ORDER, side: 'buy', quantity: 2 }]
    seed['invest_positions'] = []
    const { client, tables } = fakeDb(seed)
    const res = await executeOrder(client, 'u-1', 'ord-1', null)
    expect(res.status).toBe(200)
    /* The snapshot names the instrument currency — the row must not fall
       back to the column default or every later conversion misreads it. */
    expect(tables['invest_positions']![0]!['currency']).toBe('USD')
    /* 2 × 120 USD = 240 USD → 328.77 CAD debited. */
    expect(tables['invest_accounts']![0]!['cash_balance']).toBeCloseTo(671.23, 2)
    fxStub.table = null
  })

  it('refuses to settle a foreign fill when no FX rate exists', async () => {
    fxStub.table = null
    const { client, tables } = fakeDb(usdSeed())
    const res = await executeOrder(client, 'u-1', 'ord-1', null)
    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({ code: 'no_fx' })
    /* The refusal lands before the claim — nothing moved. */
    expect(tables['invest_orders']![0]!['status']).toBe('queued')
    expect(tables['invest_accounts']![0]!['cash_balance']).toBe(1000)
    expect(tables['invest_positions']![0]!['quantity']).toBe(5)
    expect(tables['invest_order_fills'] ?? []).toHaveLength(0)
  })

  it('same-currency fills never hit the FX feed', async () => {
    fxStub.table = null /* would fail the conversion if it were consulted */
    const { client, tables } = fakeDb(baseSeed())
    const res = await executeOrder(client, 'u-1', 'ord-1', null)
    expect(res.status).toBe(200)
    expect(tables['invest_accounts']![0]!['cash_balance']).toBe(1600)
  })

  it('importFill converts the cash move for a USD position in a CAD account', async () => {
    fxStub.table = USD_FX
    const { client, tables } = fakeDb(usdSeed())
    const res = await importFill(client, 'u-1', {
      account_id: 'acc-1',
      asset_class: 'equity',
      symbol: 'ARM',
      side: 'buy',
      quantity: 4,
      price: 90,
      filled_at: '2025-01-15',
    })
    expect(res.status).toBe(200)
    /* avg_cost stays in the instrument currency: 5@100 + 4@90 → 95.56 USD. */
    expect(tables['invest_positions']![0]!['avg_cost']).toBeCloseTo(95.56, 2)
    /* Cash move converts: 4 × 90 USD = 360 USD → 493.15 CAD debited. */
    expect(tables['invest_accounts']![0]!['cash_balance']).toBeCloseTo(506.85, 2)
    fxStub.table = null
  })

  it('importFill rejects rather than book 1:1 when the rate is missing', async () => {
    fxStub.table = null
    const { client, tables } = fakeDb(usdSeed())
    const res = await importFill(client, 'u-1', {
      account_id: 'acc-1',
      asset_class: 'equity',
      symbol: 'ARM',
      side: 'buy',
      quantity: 4,
      price: 90,
      filled_at: '2025-01-15',
    })
    expect(res.status).toBe(409)
    /* Order + fill rows the import staged are both compensated away. */
    expect(tables['invest_orders'] ?? []).toHaveLength(1)
    expect(tables['invest_order_fills'] ?? []).toHaveLength(0)
    expect(tables['invest_accounts']![0]!['cash_balance']).toBe(1000)
  })
})
