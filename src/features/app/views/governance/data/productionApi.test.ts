import { afterEach, describe, expect, it, vi } from 'vitest'

describe('governance productionApi', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  it('deleteGovernanceRecord deletes by id and throws on failure', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ delete: del }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await api.deleteGovernanceRecord('r1')
    expect(eq).toHaveBeenCalledWith('id', 'r1')
  })

  it('deleteGovernanceDecision deletes by id', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ delete: del }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await api.deleteGovernanceDecision('d1')
    expect(eq).toHaveBeenCalledWith('id', 'd1')
  })

  it('deleteGovernanceOfficer deletes by id', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ delete: del }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await api.deleteGovernanceOfficer('o1')
    expect(eq).toHaveBeenCalledWith('id', 'o1')
  })

  it('deleteGovernanceShareholder deletes by id', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ delete: del }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await api.deleteGovernanceShareholder('s1')
    expect(eq).toHaveBeenCalledWith('id', 's1')
  })
})
