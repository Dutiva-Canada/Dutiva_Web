import { afterEach, describe, expect, it, vi } from 'vitest'

const validRow = {
  id: 'elink-1',
  organization_id: 'org-1',
  from_table: 'revenue_streams',
  from_id: 's1',
  to_table: 'crm_deals',
  to_id: 'd1',
  relationship: 'relates_to',
  created_by: null,
  created_at: '2026-09-02T00:00:00Z',
  updated_at: '2026-09-02T00:00:00Z',
}

function mockListQuery(data: unknown[]) {
  const range = vi.fn().mockResolvedValue({ data, error: null })
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    range,
  }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.order.mockReturnValue(query)
  return query
}

describe('entityLinks productionApi', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  it('deleteEntityLink deletes by id and throws on failure', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ delete: del }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await api.deleteEntityLink('elink-1')
    expect(eq).toHaveBeenCalledWith('id', 'elink-1')
  })

  it('deleteEntityLink throws on supabase error', async () => {
    const eq = vi.fn().mockResolvedValue({ error: { message: 'denied' } })
    const del = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ delete: del }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await expect(api.deleteEntityLink('elink-1')).rejects.toThrow('denied')
  })

  it('listEntityLinks applies filters and parses rows', async () => {
    const query = mockListQuery([validRow])
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue(query) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    const links = await api.listEntityLinks('org-1', {
      fromTable: 'revenue_streams',
      fromId: 's1',
    })
    expect(query.eq).toHaveBeenCalledWith('organization_id', 'org-1')
    expect(query.eq).toHaveBeenCalledWith('from_table', 'revenue_streams')
    expect(query.eq).toHaveBeenCalledWith('from_id', 's1')
    expect(links).toEqual([validRow])
  })

  it('listEntityLinks rejects rows that fail schema parsing', async () => {
    const query = mockListQuery([{ id: 'elink-bad' }])
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue(query) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await expect(api.listEntityLinks('org-1')).rejects.toThrow()
  })
})
