import { afterEach, describe, expect, it, vi } from 'vitest'

describe('operations productionApi', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  it('deleteOperationsProject deletes by id', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ delete: del }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await api.deleteOperationsProject('p1')
    expect(eq).toHaveBeenCalledWith('id', 'p1')
  })

  it('deleteOperationsVendor deletes by id', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ delete: del }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await api.deleteOperationsVendor('v1')
    expect(eq).toHaveBeenCalledWith('id', 'v1')
  })

  it('deleteOperationsQualityCheck deletes by id', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ delete: del }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await api.deleteOperationsQualityCheck('q1')
    expect(eq).toHaveBeenCalledWith('id', 'q1')
  })

  it('deleteOperationsTechnology deletes by id', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ delete: del }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await api.deleteOperationsTechnology('t1')
    expect(eq).toHaveBeenCalledWith('id', 't1')
  })

  it('deleteOperationsLogistics deletes by id', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ delete: del }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await api.deleteOperationsLogistics('l1')
    expect(eq).toHaveBeenCalledWith('id', 'l1')
  })
})
