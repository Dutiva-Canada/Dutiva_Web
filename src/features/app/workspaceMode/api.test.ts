import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * `supabase` is imported once at module scope; to exercise different client
 * shapes (unconfigured, partial test double, well-formed mock) this mocks
 * `@/lib/supabaseClient` per test and re-imports api.ts fresh, same pattern
 * as documents/api.test.ts and AdvisorView.test.tsx's "signed in" suite.
 */
describe('workspaceMode api', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  it('degrades to demo/non-admin when Supabase is not configured', async () => {
    vi.doMock('@/lib/supabaseClient', () => ({ supabase: null }))
    vi.resetModules()
    const api = await import('./api')

    expect(await api.checkIsAdmin()).toBe(false)
    expect(await api.fetchStoredMode('u1')).toBe('demo')
    expect(await api.saveStoredMode('u1', 'production')).toBe(false)
    expect(await api.fetchAdminProfile('u1')).toBeNull()
  })

  it('degrades safely rather than throwing when the client is missing a method', async () => {
    vi.doMock('@/lib/supabaseClient', () => ({ supabase: {} }))
    vi.resetModules()
    const api = await import('./api')

    await expect(api.checkIsAdmin()).resolves.toBe(false)
    await expect(api.fetchStoredMode('u1')).resolves.toBe('demo')
    await expect(api.saveStoredMode('u1', 'production')).resolves.toBe(false)
    await expect(api.fetchAdminProfile('u1')).resolves.toBeNull()
  })

  it('checkIsAdmin resolves true only when is_admin_user() returns true with no error', async () => {
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { rpc: vi.fn().mockResolvedValue({ data: true, error: null }) },
    }))
    vi.resetModules()
    const api = await import('./api')

    expect(await api.checkIsAdmin()).toBe(true)
  })

  it('checkIsAdmin resolves false when the RPC errors', async () => {
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { rpc: vi.fn().mockResolvedValue({ data: null, error: new Error('nope') }) },
    }))
    vi.resetModules()
    const api = await import('./api')

    expect(await api.checkIsAdmin()).toBe(false)
  })

  it('fetchStoredMode reads the stored mode from workspace_preferences', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { mode: 'production' }, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ select }) },
    }))
    vi.resetModules()
    const api = await import('./api')

    expect(await api.fetchStoredMode('u1')).toBe('production')
  })

  it('fetchStoredMode falls back to demo when no row exists', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ select }) },
    }))
    vi.resetModules()
    const api = await import('./api')

    expect(await api.fetchStoredMode('u1')).toBe('demo')
  })

  it('fetchAdminProfile falls back to Dutiva Canada Inc. defaults for null fields', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        legal_name: null,
        company_name: null,
        primary_contact: null,
        province: null,
        city: null,
      },
      error: null,
    })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ select }) },
    }))
    vi.resetModules()
    const api = await import('./api')

    expect(await api.fetchAdminProfile('u1')).toEqual({
      companyName: 'Dutiva Canada Inc.',
      contactName: 'Martin Constantineau',
      province: 'Ontario',
      city: 'Ottawa',
    })
  })

  it('saveStoredMode upserts and reports success', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ upsert }) },
    }))
    vi.resetModules()
    const api = await import('./api')

    expect(await api.saveStoredMode('u1', 'production')).toBe(true)
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'u1', mode: 'production' }),
    )
  })

  it('bootstrapOrganization returns success for a created organization', async () => {
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        rpc: vi.fn().mockResolvedValue({ data: { id: 'org-1' }, error: null }),
      },
    }))
    vi.resetModules()
    const api = await import('./api')

    expect(await api.bootstrapOrganization('Acme', 'Acme Inc.')).toEqual({
      status: 'success',
      organizationId: 'org-1',
      memberRole: 'owner',
    })
  })

  it('bootstrapOrganization returns capacity when the server reports CAPACITY_REACHED', async () => {
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        rpc: vi.fn().mockResolvedValue({ data: { error: 'CAPACITY_REACHED' }, error: null }),
      },
    }))
    vi.resetModules()
    const api = await import('./api')

    expect(await api.bootstrapOrganization('Acme', 'Acme Inc.')).toEqual({
      status: 'capacity',
    })
  })

  it('bootstrapOrganization returns waitlist when the server reports WAITLIST', async () => {
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        rpc: vi.fn().mockResolvedValue({ data: { error: 'WAITLIST' }, error: null }),
      },
    }))
    vi.resetModules()
    const api = await import('./api')

    expect(await api.bootstrapOrganization('Acme', 'Acme Inc.')).toEqual({
      status: 'waitlist',
    })
  })

  it('bootstrapOrganization returns error for an unexpected response', async () => {
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
      },
    }))
    vi.resetModules()
    const api = await import('./api')

    expect(await api.bootstrapOrganization('Acme', 'Acme Inc.')).toEqual({
      status: 'error',
    })
  })

  it('joinOrganizationWaitlist returns waiting for a fresh waitlist entry', async () => {
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        rpc: vi.fn().mockResolvedValue({ data: { status: 'waiting' }, error: null }),
      },
    }))
    vi.resetModules()
    const api = await import('./api')

    expect(await api.joinOrganizationWaitlist('Acme')).toBe('waiting')
  })

  it('joinOrganizationWaitlist returns already_waiting for a duplicate entry', async () => {
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        rpc: vi.fn().mockResolvedValue({ data: { status: 'already_waiting' }, error: null }),
      },
    }))
    vi.resetModules()
    const api = await import('./api')

    expect(await api.joinOrganizationWaitlist('Acme')).toBe('already_waiting')
  })
})
