import { afterEach, describe, expect, it, vi } from 'vitest'

describe('security productionApi', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  it('deleteSecurityAsset deletes by id and throws on failure', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ delete: del }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await api.deleteSecurityAsset('a1')
    expect(eq).toHaveBeenCalledWith('id', 'a1')
  })

  it('deleteSecurityAccessReview deletes by id', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ delete: del }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await api.deleteSecurityAccessReview('r1')
    expect(eq).toHaveBeenCalledWith('id', 'r1')
  })

  it('deleteSecurityIncident deletes by id', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ delete: del }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await api.deleteSecurityIncident('i1')
    expect(eq).toHaveBeenCalledWith('id', 'i1')
  })

  it('deleteSecurityRisk deletes by id', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ delete: del }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await api.deleteSecurityRisk('r1')
    expect(eq).toHaveBeenCalledWith('id', 'r1')
  })

  it('deleteSecurityVendorReview deletes by id', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ delete: del }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await api.deleteSecurityVendorReview('v1')
    expect(eq).toHaveBeenCalledWith('id', 'v1')
  })
})
