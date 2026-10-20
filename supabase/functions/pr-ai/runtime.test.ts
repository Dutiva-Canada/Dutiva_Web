import { describe, expect, it } from 'vitest'

import { persistChatTurns } from './runtime'
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'

type Row = Record<string, unknown>

/* Table-backed fake with one failure path: the second insert returns an
   error — the assistant row's write is the one that can land after the
   user row is already durable. */
function failingFake() {
  const writes: { table: string; op: string; payload: unknown }[] = []
  const live: Row[] = []
  let inserts = 0
  const from = (table: string) => {
    const filters: [string, unknown[]][] = []
    let op = 'select'
    let payload: Row | null = null
    const run = () => {
      if (op === 'insert') {
        inserts++
        writes.push({ table, op, payload })
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
        writes.push({ table, op, payload: filters })
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

describe('persistChatTurns — the pair comes down together', () => {
  it('takes the orphan user row back down when the assistant insert fails', async () => {
    /* Half a pair would persist otherwise — the user turn stays with no
       reply, and chat_regenerate can't reach it (it needs the assistant
       row on top). Both rows must go, and the client keeps its local
       optimistic bubble instead of adopting a deleted row's id. */
    const { client, writes, live } = failingFake()
    const res = await persistChatTurns(client, 'u-1', 'hi', 'hello back', null, null, '', [])
    expect(res).toEqual({ userId: null, assistantId: null })
    expect(live).toHaveLength(0)
    expect(writes.some((w) => w.op === 'delete')).toBe(true)
  })
})
