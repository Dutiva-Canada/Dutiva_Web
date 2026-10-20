import { describe, expect, it, vi } from 'vitest'

/* The model-call path isn't under test here — stub every module the file
   imports that can reach a network or a real client surface. */
vi.mock('./marketFetch.ts', () => ({ fetchOnDemandMarket: async () => [] }))
vi.mock('./personalContext.ts', () => ({
  loadPersonalContext: async () => ({ memories: [], mandate: null, profile: null }),
  loadPositionFacts: async () => null,
}))
vi.mock('../invest-bot/fx.ts', () => ({
  convertFx: (n: number) => n,
  fetchFxTable: async () => ({ date: 'x', rates: { CAD: 1 } }),
}))

import { executeChatAction, undoChatAction, type ChatActionDeps } from './chatActions'
import { persistChatTurns } from './runtime'
import type { SupabaseClient } from './runtimeShared'

/* Minimal table-backed fake — same contract as invest-bot's orders.test:
   .from().{select,insert,upsert,update,delete}.eq().maybeSingle()/single().
   Records writes so a no-op action proves it touched nothing. */
type Row = Record<string, unknown>

function fakeDb(seed: Record<string, Row[]>) {
  const writes: { table: string; op: string; payload: unknown }[] = []
  const tables = seed
  const from = (table: string) => {
    const live = tables[table] ?? (tables[table] = [])
    let op = 'select'
    let payload: Row | Row[] | null = null
    let onConflict = ''
    const filters: [string, unknown[]][] = []
    const match = (r: Row) => filters.every(([c, vs]) => vs.some((v) => r[c] === v))
    const run = (): { data: unknown; error: { message: string } | null } => {
      if (op === 'insert') {
        const rows = (Array.isArray(payload) ? payload : [payload]) as Row[]
        for (const r of rows) live.push({ id: `new-${table}-${live.length}`, ...r })
        writes.push({ table, op, payload })
        return { data: rows.map((r) => ({ ...r })), error: null }
      }
      if (op === 'upsert') {
        writes.push({ table, op, payload })
        const rows = (Array.isArray(payload) ? payload : [payload]) as Row[]
        const keys = onConflict.split(',').map((k) => k.trim()).filter(Boolean)
        for (const r of rows) {
          const hit = live.find((l) => keys.every((k) => l[k] === r[k]))
          if (hit) Object.assign(hit, r)
          else live.push({ id: `new-${table}-${live.length}`, ...r })
        }
        return { data: rows.map((r, i) => ({ ...live.find((l) => keys.every((k) => l[k] === r[k]))!, id: live.find((l) => keys.every((k) => l[k] === r[k]))!.id ?? `u${i}` })), error: null }
      }
      if (op === 'update') {
        const hit = live.filter(match)
        for (const r of hit) Object.assign(r, payload)
        writes.push({ table, op, payload })
        return { data: hit.map((r) => ({ ...r })), error: null }
      }
      if (op === 'delete') {
        const kept = live.filter((r) => !match(r))
        const gone = live.length - kept.length
        tables[table] = kept
        writes.push({ table, op, payload: filters })
        return { data: new Array(gone), error: null }
      }
      return { data: live.filter(match).map((r) => ({ ...r })), error: null }
    }
    const q: Record<string, unknown> = {
      select: () => q,
      eq: (col: string, v: unknown) => (filters.push([col, [v]]), q),
      in: (col: string, vs: unknown[]) => (filters.push([col, vs]), q),
      is: (col: string, v: unknown) => (filters.push([col, [v]]), q),
      update: (p: Row) => ((op = 'update'), (payload = p), q),
      insert: (p: Row | Row[]) => ((op = 'insert'), (payload = p), q),
      upsert: (p: Row | Row[], opts?: { onConflict?: string }) => (
        (op = 'upsert'), (payload = p), (onConflict = opts?.onConflict ?? ''), q
      ),
      delete: () => ((op = 'delete'), q),
      maybeSingle: () => {
        const res = run()
        return Promise.resolve({
          data: Array.isArray(res.data) ? ((res.data as Row[])[0] ?? null) : res.data,
          error: res.error,
        })
      },
      single: () => {
        const res = run()
        return Promise.resolve({
          data: Array.isArray(res.data) ? ((res.data as Row[])[0] ?? null) : res.data,
          error: res.error,
        })
      },
      then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
        Promise.resolve(run()).then(res, rej),
    }
    return q
  }
  return { client: { from } as unknown as SupabaseClient, tables, writes }
}

const deps = (watchlist: Row[]): ChatActionDeps =>
  ({
    accounts: [],
    watchlist,
    signals: [],
    positions: [],
    route: { model_name: 'test-model' },
    provider: {} as ChatActionDeps['provider'],
    apiKey: null,
    lang: 'en',
    advice: false,
  }) as ChatActionDeps

describe('executeChatAction — add_watch_symbol', () => {
  it('no-ops on an already-watched symbol — no write, no undo chip', async () => {
    /* The upsert used to land anyway: it rewrote the row's name (wiping a
       custom one to '') and returned the existing row's id as refId, so
       the Undo chip then deleted a watch entry the holder added long
       before this turn. */
    const { client, tables, writes } = fakeDb({
      invest_watchlist: [
        { id: 'w1', user_id: 'u-1', asset_class: 'equity', symbol: 'SHOP', name: 'My Shopify' },
      ],
    })
    const res = await executeChatAction(
      client,
      'u-1',
      { type: 'add_watch_symbol', symbol: 'shop', name: '' },
      deps([{ id: 'w1', symbol: 'SHOP', asset_class: 'equity', name: 'My Shopify' }]),
    )
    expect(res).toMatchObject({ type: 'add_watch_symbol', ok: true })
    expect(res.refId).toBeUndefined()
    expect(writes).toHaveLength(0)
    expect(tables['invest_watchlist']![0]!['name']).toBe('My Shopify')
  })

  it('still inserts a genuinely new symbol with an undoable refId', async () => {
    const { client, tables } = fakeDb({ invest_watchlist: [] })
    const res = await executeChatAction(
      client,
      'u-1',
      { type: 'add_watch_symbol', symbol: 'SHOP' },
      deps([]),
    )
    expect(res).toMatchObject({ ok: true, refId: expect.any(String) })
    expect(tables['invest_watchlist']).toHaveLength(1)
  })
})

describe('undoChatAction — add_watch_symbol', () => {
  it('deletes only the row the action created', async () => {
    const { client, tables } = fakeDb({
      invest_watchlist: [
        { id: 'w-new', user_id: 'u-1', asset_class: 'equity', symbol: 'SHOP', name: '' },
        { id: 'w-old', user_id: 'u-1', asset_class: 'equity', symbol: 'XEQT', name: '' },
      ],
    })
    const ok = await undoChatAction(client, 'u-1', {
      type: 'add_watch_symbol',
      detail: 'SHOP',
      ok: true,
      refId: 'w-new',
    })
    expect(ok).toBe(true)
    expect(tables['invest_watchlist']!.map((r) => r['id'])).toEqual(['w-old'])
  })
})

describe('persistChatTurns — the pair comes down together', () => {
  /* The fake needs one failure path: the second insert returns an error. */
  function failingFake() {
    const writes: { table: string; op: string; payload: unknown }[] = []
    const live: Row[] = []
    let inserts = 0
    const from = () => {
      const filters: [string, unknown[]][] = []
      let op = 'select'
      let payload: Row | null = null
      const run = () => {
        if (op === 'insert') {
          inserts++
          writes.push({ table: 'invest_chat_messages', op, payload })
          if (inserts === 2) return { data: null, error: { message: 'insert failed' } }
          const row = { id: `row-${inserts}`, ...(payload as Row) }
          live.push(row)
          return { data: { ...row }, error: null }
        }
        if (op === 'delete') {
          const kept = live.filter(
            (r) => !filters.every(([c, vs]) => vs.some((v) => r[c] === v)),
          )
          const gone = live.length - kept.length
          live.length = 0
          live.push(...kept)
          writes.push({ table: 'invest_chat_messages', op, payload: filters })
          return { data: new Array(gone), error: null }
        }
        return { data: [], error: null }
      }
      const q: Record<string, unknown> = {
        insert: (p: Row) => ((op = 'insert'), (payload = p), q),
        delete: () => ((op = 'delete'), q),
        eq: (c: string, v: unknown) => (filters.push([c, [v]]), q),
        select: () => q,
        is: (c: string, v: unknown) => (filters.push([c, [v]]), q),
        update: (p: Row) => ((op = 'update'), (payload = p), q),
        single: () => {
          const r = run()
          return Promise.resolve({ data: r.data, error: r.error })
        },
        then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
          Promise.resolve(run()).then(res, rej),
      }
      return q
    }
    return { client: { from } as unknown as SupabaseClient, writes, live }
  }

  it('takes the orphan user row back down when the assistant insert fails', async () => {
    /* Half a pair would persist otherwise — the user turn stays with no
       reply, and chat_regenerate can't reach it (it needs the assistant
       row on top). Both rows must go. */
    const { client, writes, live } = failingFake()
    const res = await persistChatTurns(client, 'u-1', 'hi', 'hello back', null, null, '', [])
    expect(res).toEqual({ userId: null, assistantId: null })
    expect(live).toHaveLength(0)
    expect(writes.some((w) => w.op === 'delete')).toBe(true)
  })
})
