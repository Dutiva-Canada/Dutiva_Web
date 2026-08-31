import { describe, expect, it } from 'vitest'
import { SUPABASE_PAGE_SIZE, fetchAllPages } from './supabasePagination'

describe('fetchAllPages', () => {
  it('returns a short first page directly', async () => {
    const rows = await fetchAllPages(() => Promise.resolve({ data: [1, 2, 3], error: null }))
    expect(rows).toEqual([1, 2, 3])
  })

  it('keeps fetching while pages come back full, concatenating in order', async () => {
    const full = Array.from({ length: SUPABASE_PAGE_SIZE }, (_, i) => i)
    const calls: [number, number][] = []
    const rows = await fetchAllPages<number>((from, to) => {
      calls.push([from, to])
      return Promise.resolve(
        from === 0 ? { data: full, error: null } : { data: [SUPABASE_PAGE_SIZE], error: null },
      )
    })
    expect(rows).toHaveLength(SUPABASE_PAGE_SIZE + 1)
    expect(rows.at(-1)).toBe(SUPABASE_PAGE_SIZE)
    expect(calls).toEqual([
      [0, SUPABASE_PAGE_SIZE - 1],
      [SUPABASE_PAGE_SIZE, 2 * SUPABASE_PAGE_SIZE - 1],
    ])
  })

  it('treats an exactly-full final page as one more (empty) fetch, not an infinite loop', async () => {
    const full = Array.from({ length: SUPABASE_PAGE_SIZE }, (_, i) => i)
    let calls = 0
    const rows = await fetchAllPages<number>((from) => {
      calls += 1
      return Promise.resolve({ data: from === 0 ? full : [], error: null })
    })
    expect(rows).toHaveLength(SUPABASE_PAGE_SIZE)
    expect(calls).toBe(2)
  })

  it('throws the page error untouched', async () => {
    const boom = { code: 'PGRST205', message: 'missing table' }
    await expect(fetchAllPages(() => Promise.resolve({ data: null, error: boom }))).rejects.toBe(
      boom,
    )
  })

  it('treats null data as an empty page', async () => {
    expect(await fetchAllPages(() => Promise.resolve({ data: null, error: null }))).toEqual([])
  })
})
