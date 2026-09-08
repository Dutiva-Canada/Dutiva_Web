import { afterEach, describe, expect, it, vi } from 'vitest'

describe('revenue productionApi', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  it('deleteRevenueStream deletes by id and throws on failure', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ delete: del }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await api.deleteRevenueStream('s1')
    expect(eq).toHaveBeenCalledWith('id', 's1')
  })

  it('deleteRevenueInvoice deletes by id', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ delete: del }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await api.deleteRevenueInvoice('i1')
    expect(eq).toHaveBeenCalledWith('id', 'i1')
  })
})
