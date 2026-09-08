import { afterEach, describe, expect, it, vi } from 'vitest'

describe('specialists productionApi', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  it('deleteSpecialist removes engagements first, then the specialist', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ delete: del })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await api.deleteSpecialist('sp1')
    expect(from).toHaveBeenCalledWith('specialist_engagements')
    expect(from).toHaveBeenCalledWith('specialists')
    expect(eq).toHaveBeenCalledWith('specialist_id', 'sp1')
    expect(eq).toHaveBeenCalledWith('id', 'sp1')
    expect(from).toHaveBeenCalledTimes(2)
    expect(eq).toHaveBeenCalledTimes(2)
  })

  it('deleteSpecialistEngagement deletes by id', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ delete: del })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await api.deleteSpecialistEngagement('se1')
    expect(from).toHaveBeenCalledWith('specialist_engagements')
    expect(eq).toHaveBeenCalledWith('id', 'se1')
  })
})
