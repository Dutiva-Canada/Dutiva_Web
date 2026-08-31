import { afterEach, describe, expect, it, vi } from 'vitest'

interface FakeResult {
  data: unknown
  error: unknown
}

/** Filters applied to a query, so tests can assert them. */
interface RecordedFilters {
  eq: [string, unknown][]
  in: [string, readonly unknown[]][]
}

/** Chainable, thenable stand-in for a supabase-js PostgrestFilterBuilder. */
function chain(result: FakeResult, filters?: RecordedFilters) {
  const builder = {
    select: () => builder,
    eq: (column: string, value: unknown) => {
      filters?.eq.push([column, value])
      return builder
    },
    in: (column: string, values: readonly unknown[]) => {
      filters?.in.push([column, values])
      return builder
    },
    order: () => builder,
    limit: () => builder,
    then: (onfulfilled: (value: FakeResult) => unknown) =>
      Promise.resolve(result).then(onfulfilled),
  }
  return builder
}

async function loadApiWithFakeClient(fromImpl: (table: string) => unknown) {
  vi.doMock('@/lib/supabaseClient', () => ({ supabase: { from: fromImpl } }))
  vi.resetModules()
  return import('./api')
}

async function loadApiWithNoClient() {
  vi.doMock('@/lib/supabaseClient', () => ({ supabase: null }))
  vi.resetModules()
  return import('./api')
}

describe('guidance api', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  it('returns empty arrays when Supabase is not configured', async () => {
    const { fetchGuidanceSources, fetchRecentLawUpdates } = await loadApiWithNoClient()
    await expect(fetchGuidanceSources()).resolves.toEqual([])
    await expect(fetchRecentLawUpdates()).resolves.toEqual([])
  })

  it('parses well-formed guidance_sources rows', async () => {
    const row = {
      id: 's1',
      title: 'ESA Guide',
      source_type: 'statute',
      jurisdiction: 'ON',
      url: 'https://example.com',
      version: '2026',
      effective_date: '2026-01-01',
    }
    const { fetchGuidanceSources } = await loadApiWithFakeClient(() =>
      chain({ data: [row], error: null }),
    )
    await expect(fetchGuidanceSources()).resolves.toEqual([
      {
        id: 's1',
        title: 'ESA Guide',
        sourceType: 'statute',
        jurisdiction: 'ON',
        url: 'https://example.com',
        version: '2026',
        effectiveDate: '2026-01-01',
      },
    ])
  })

  it('throws when a guidance_sources row fails schema validation', async () => {
    const { fetchGuidanceSources } = await loadApiWithFakeClient(() =>
      chain({ data: [{ id: 's1' }], error: null }),
    )
    await expect(fetchGuidanceSources()).rejects.toThrow()
  })

  it('parses well-formed law_updates rows', async () => {
    const row = {
      id: 'u1',
      jurisdiction: 'QC',
      law_name: 'Loi 25',
      url: 'https://example.com',
      change_summary: 'Amended s.12',
      detected_at: '2026-05-01T00:00:00Z',
      event_type: 'change',
    }
    const { fetchRecentLawUpdates } = await loadApiWithFakeClient(() =>
      chain({ data: [row], error: null }),
    )
    await expect(fetchRecentLawUpdates()).resolves.toEqual([
      {
        id: 'u1',
        jurisdiction: 'QC',
        lawName: 'Loi 25',
        url: 'https://example.com',
        changeSummary: 'Amended s.12',
        detectedAt: '2026-05-01T00:00:00Z',
        eventType: 'change',
      },
    ])
  })

  it('propagates a Supabase error', async () => {
    const { fetchGuidanceSources } = await loadApiWithFakeClient(() =>
      chain({ data: null, error: new Error('RLS denied') }),
    )
    await expect(fetchGuidanceSources()).rejects.toThrow('RLS denied')
  })

  /**
   * Unfiltered, this panel showed customers the monitor's operational log for
   * provinces Dutiva does not support. On 2026-07-30 the ten newest rows
   * contained no supported jurisdiction at all, and six were `redirect`
   * notices — "the Act has permanently moved, old URL to new URL" — rendered
   * under the heading "Recent law changes", directly below a block stating
   * that Ontario and Québec are not monitored.
   */
  describe('fetchRecentLawUpdates filtering', () => {
    const filtersFor = async () => {
      const filters: RecordedFilters = { eq: [], in: [] }
      const { fetchRecentLawUpdates } = await loadApiWithFakeClient(() =>
        chain({ data: [], error: null }, filters),
      )
      await fetchRecentLawUpdates()
      return filters
    }

    it('asks only for real amendments', async () => {
      const filters = await filtersFor()
      expect(filters.eq).toContainEqual(['event_type', 'change'])
    })

    it('never surfaces operational events to a customer', async () => {
      /* first_seen / redirect / broken are records about Dutiva's own
         monitoring. `broken` matters most: after the content-sanity guard
         ships, a sweep produces a burst of them, and they say a Dutiva
         scraper failed — alarming and useless in a customer's panel. */
      const filters = await filtersFor()
      const eventFilter = filters.eq.find(([column]) => column === 'event_type')
      expect(eventFilter?.[1]).toBe('change')
      for (const operational of ['first_seen', 'redirect', 'broken']) {
        expect(eventFilter?.[1]).not.toBe(operational)
      }
    })

    it('asks only for jurisdictions Dutiva supports', async () => {
      const filters = await filtersFor()
      const jurisdictionFilter = filters.in.find(([column]) => column === 'jurisdiction')
      expect(jurisdictionFilter).toBeDefined()
      expect([...(jurisdictionFilter?.[1] ?? [])].sort()).toEqual(['Federal', 'Ontario', 'Quebec'])
    })

    it('uses the monitor spellings, not the product codes', async () => {
      /* law_updates stores display names; filtering on 'ON'/'QC'/'FED' would
         silently match nothing and empty the panel. */
      const filters = await filtersFor()
      const values = filters.in.find(([column]) => column === 'jurisdiction')?.[1] ?? []
      for (const code of ['ON', 'QC', 'FED']) {
        expect(values).not.toContain(code)
      }
    })
  })
})
