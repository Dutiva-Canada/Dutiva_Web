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

import { executeOrder } from './orders'
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
    let op: 'select' | 'update' | 'insert' = 'select'
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
      return { data: read.filter(match).map((r) => ({ ...r })), error: null }
    }
    const q: Record<string, unknown> = {
      select: () => q,
      eq: (col: string, v: unknown) => (filters.push([col, [v]]), q),
      in: (col: string, vs: unknown[]) => (filters.push([col, vs]), q),
      is: (col: string, v: unknown) => (filters.push([col, [v]]), q),
      update: (p: Row) => ((op = 'update'), (payload = p), q),
      insert: (p: Row) => ((op = 'insert'), (payload = p), q),
      maybeSingle: () => {
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
})
