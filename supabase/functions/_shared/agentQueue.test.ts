import { describe, expect, it } from 'vitest'
import { fileSuggestion, textDedupeKey } from './agentQueue'

/**
 * Minimal chainable fake for the supabase-js query builder — only the
 * shapes fileSuggestion uses: select().eq()*N, update().in(),
 * insert().select().single().
 */
interface Row {
  id: string
  user_id: string
  surface: string
  kind: string
  dedupe_key: string | null
  status: string
  resolved_action?: string
}

function fakeAdmin(existing: Row[], opts?: { insertFails?: boolean }) {
  const calls: { op: string; arg?: unknown }[] = []
  const nextId = { n: 1 }

  const builder = (pendingOp: 'select' | 'update' | 'insert', payload?: unknown) => {
    const chain: Record<string, (...a: unknown[]) => unknown> = {}
    const filters: { col: string; val: unknown }[] = []
    const self = () => chain

    chain.eq = (col: string, val: unknown) => {
      filters.push({ col, val })
      return self()
    }
    chain.select = () => self()
    chain.single = () => {
      if (pendingOp === 'insert') {
        calls.push({ op: 'insert', arg: payload })
        if (opts?.insertFails) {
          return Promise.resolve({ data: null, error: { message: 'insert failed' } })
        }
        return Promise.resolve({ data: { id: `new-${nextId.n++}` }, error: null })
      }
      return Promise.resolve({ data: null, error: null })
    }
    chain.in = (_col: string, ids: string[]) => {
      calls.push({ op: pendingOp, arg: ids })
      return Promise.resolve({ data: null, error: null })
    }
    chain.then = (
      onFulfilled?: (v: { data: Row[] | null }) => unknown,
    ): Promise<unknown> => {
      /* select resolves here — apply the eq filters */
      if (pendingOp === 'select') {
        const matched = existing.filter((r) =>
          filters.every((f) => (r as Record<string, unknown>)[f.col] === f.val),
        )
        calls.push({ op: 'select' })
        return Promise.resolve({ data: matched }).then(onFulfilled)
      }
      return Promise.resolve({ data: null, error: null }).then(
        onFulfilled as (v: { data: null; error: null }) => unknown,
      )
    }
    return chain
  }

  return {
    calls,
    client: {
      from: () => ({
        select: () => builder('select'),
        update: (p: unknown) => builder('update', p),
        insert: (p: unknown) => builder('insert', p),
      }),
    } as never,
  }
}

const base = {
  userId: 'u1',
  surface: 'pr' as const,
  kind: 'pitch',
  title: 'A pitch',
  payload: {},
}

describe('textDedupeKey', () => {
  it('normalizes case and whitespace', () => {
    expect(textDedupeKey('  Hello   WORLD\n')).toBe('hello world')
    expect(textDedupeKey('a b')).toBe(textDedupeKey('A\nb'))
  })
})

describe('fileSuggestion', () => {
  it('inserts a row when no pending twin exists', async () => {
    const { client, calls } = fakeAdmin([])
    const out = await fileSuggestion(client, { ...base, dedupeKey: 'k1' })
    expect(out).toEqual({ id: 'new-1', fresh: true })
    expect(calls.some((c) => c.op === 'insert')).toBe(true)
  })

  it('returns the existing pending row on a dedupe hit — no twin written', async () => {
    const { client, calls } = fakeAdmin([
      { id: 'old-1', user_id: 'u1', surface: 'pr', kind: 'pitch', dedupe_key: 'k1', status: 'pending' },
    ])
    const out = await fileSuggestion(client, { ...base, dedupeKey: 'k1' })
    expect(out).toEqual({ id: 'old-1', fresh: false })
    expect(calls.some((c) => c.op === 'insert')).toBe(false)
  })

  it('supersede mode dismisses pending twins then files the new draft', async () => {
    const { client, calls } = fakeAdmin([
      { id: 'old-1', user_id: 'u1', surface: 'pr', kind: 'pitch', dedupe_key: 'k1', status: 'pending' },
      { id: 'old-2', user_id: 'u1', surface: 'pr', kind: 'pitch', dedupe_key: 'k1', status: 'pending' },
    ])
    const out = await fileSuggestion(client, {
      ...base,
      dedupeKey: 'k1',
      dedupeMode: 'supersede',
    })
    expect(out).toEqual({ id: 'new-1', fresh: true })
    const update = calls.find((c) => c.op === 'update')
    expect(update?.arg).toEqual(['old-1', 'old-2'])
    expect(calls.some((c) => c.op === 'insert')).toBe(true)
  })

  it('resolved rows never block a new proposal', async () => {
    const { client } = fakeAdmin([
      { id: 'old-1', user_id: 'u1', surface: 'pr', kind: 'pitch', dedupe_key: 'k1', status: 'accepted' },
    ])
    const out = await fileSuggestion(client, { ...base, dedupeKey: 'k1' })
    expect(out).toEqual({ id: 'new-1', fresh: true })
  })

  it('a failed insert returns null — the caller still ships its suggestion', async () => {
    const { client } = fakeAdmin([], { insertFails: true })
    const out = await fileSuggestion(client, { ...base, dedupeKey: 'k1' })
    expect(out).toBeNull()
  })

  it('no dedupe key always files a fresh row', async () => {
    const { client, calls } = fakeAdmin([
      { id: 'x', user_id: 'u1', surface: 'pr', kind: 'pitch', dedupe_key: null, status: 'pending' },
    ])
    const out = await fileSuggestion(client, base)
    expect(out?.fresh).toBe(true)
    expect(calls.some((c) => c.op === 'select')).toBe(false)
  })
})
