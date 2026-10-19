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

    /* Identity reads report failure — a missing client is not "no org". */
    expect(await api.checkIsAdmin()).toEqual({ ok: false })
    expect(await api.fetchStoredMode('u1')).toEqual({ ok: false })
    expect(await api.saveStoredMode('u1', 'production')).toBe(false)
    expect(await api.fetchAdminProfile('u1')).toEqual({ ok: false })
  })

  it('degrades safely rather than throwing when the client is missing a method', async () => {
    vi.doMock('@/lib/supabaseClient', () => ({ supabase: {} }))
    vi.resetModules()
    const api = await import('./api')

    await expect(api.checkIsAdmin()).resolves.toEqual({ ok: false })
    await expect(api.fetchStoredMode('u1')).resolves.toEqual({ ok: false })
    await expect(api.saveStoredMode('u1', 'production')).resolves.toBe(false)
    await expect(api.fetchAdminProfile('u1')).resolves.toEqual({ ok: false })
  })

  it('checkIsAdmin resolves true only when is_admin_user() returns true with no error', async () => {
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        },
        rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
      },
    }))
    vi.resetModules()
    const api = await import('./api')

    expect(await api.checkIsAdmin()).toEqual({ ok: true, value: true })
  })

  it('checkIsAdmin resolves true for @dutiva.ca session email without the RPC', async () => {
    const rpc = vi.fn()
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: { user: { email: 'ops@dutiva.ca' } } },
          }),
        },
        rpc,
      },
    }))
    vi.resetModules()
    const api = await import('./api')

    expect(await api.checkIsAdmin()).toEqual({ ok: true, value: true })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('checkIsAdmin reports failure when the RPC errors', async () => {
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        },
        rpc: vi.fn().mockResolvedValue({ data: null, error: new Error('nope') }),
      },
    }))
    vi.resetModules()
    const api = await import('./api')

    /* A failed read is not a confirmed "not admin" — callers retry. */
    expect(await api.checkIsAdmin()).toEqual({ ok: false })
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

    expect(await api.fetchStoredMode('u1')).toEqual({ ok: true, value: 'production' })
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

    expect(await api.fetchStoredMode('u1')).toEqual({ ok: true, value: 'demo' })
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
      ok: true,
      value: {
        companyName: 'Dutiva Canada Inc.',
        contactName: 'Martin Constantineau',
        province: 'Ontario',
        city: 'Ottawa',
      },
    })
  })

  it('updateAdminProfile writes company and region fields', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        legal_name: 'Acme HR Inc.',
        company_name: 'Acme HR Inc.',
        primary_contact: 'Alex',
        province: 'Quebec',
        city: 'Montréal',
      },
      error: null,
    })
    const select = vi.fn().mockReturnValue({ maybeSingle })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ update }) },
    }))
    vi.resetModules()
    const api = await import('./api')

    expect(
      await api.updateAdminProfile('u1', {
        companyName: 'Acme HR Inc.',
        province: 'Quebec',
        city: 'Montréal',
      }),
    ).toEqual({
      companyName: 'Acme HR Inc.',
      contactName: 'Alex',
      province: 'Quebec',
      city: 'Montréal',
    })
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        legal_name: 'Acme HR Inc.',
        company_name: 'Acme HR Inc.',
        province: 'Quebec',
        city: 'Montréal',
      }),
    )
  })

  it('updateOrganizationSettings writes name (trimmed) and returns the row', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'org-1',
        name: 'Acme Logistics',
        industry: null,
        jurisdictions: ['CA-ON'],
        enabled_modules: {},
        finance_features: {},
      },
      error: null,
    })
    const select = vi.fn().mockReturnValue({ maybeSingle })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ update }) },
    }))
    vi.resetModules()
    const api = await import('./api')

    const saved = await api.updateOrganizationSettings('org-1', {
      name: '  Acme Logistics  ',
    })
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Acme Logistics' }),
    )
    expect(saved?.name).toBe('Acme Logistics')
    expect(saved?.jurisdictions).toEqual(['CA-ON'])
  })

  it('updateOrganizationSettings drops a blank name instead of wiping the row', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'org-1',
        name: 'Acme',
        industry: null,
        jurisdictions: [],
        enabled_modules: {},
        finance_features: {},
      },
      error: null,
    })
    const select = vi.fn().mockReturnValue({ maybeSingle })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ update }) },
    }))
    vi.resetModules()
    const api = await import('./api')

    await api.updateOrganizationSettings('org-1', { name: '   ' })
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ name: undefined }))
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

  it('fetchOnboardingMarks reads the per-org onboarding map', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { onboarding: { 'org-1': { workflowVisited: true } } },
      error: null,
    })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }),
        }),
      },
    }))
    vi.resetModules()
    const api = await import('./api')

    expect(await api.fetchOnboardingMarks('u1')).toEqual({
      'org-1': { workflowVisited: true },
    })
  })

  it('fetchOnboardingMarks returns {} when the row or column is absent', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }),
        }),
      },
    }))
    vi.resetModules()
    const api = await import('./api')

    expect(await api.fetchOnboardingMarks('u1')).toEqual({})
  })

  it('saveOnboardingMarks merges into the org entry and upserts', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { onboarding: { 'org-1': { workflowVisited: true } } },
      error: null,
    })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: vi
            .fn()
            .mockResolvedValue({ data: { session: { user: { id: 'u1' } } } }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }),
          upsert,
        }),
      },
    }))
    vi.resetModules()
    const api = await import('./api')

    expect(await api.saveOnboardingMarks('org-1', { setupCardDismissed: true })).toBe(true)
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'u1',
        onboarding: { 'org-1': { workflowVisited: true, setupCardDismissed: true } },
      }),
    )
  })

  it('saveOnboardingMarks returns false when signed out', async () => {
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        },
        from: vi.fn(),
      },
    }))
    vi.resetModules()
    const api = await import('./api')

    expect(await api.saveOnboardingMarks('org-1', { workflowVisited: true })).toBe(false)
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

  it('fetchWorkspacePrefs returns mode and active organization', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { mode: 'production', active_organization_id: 'org-2' },
      error: null,
    })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ select }) },
    }))
    vi.resetModules()
    const api = await import('./api')

    expect(await api.fetchWorkspacePrefs('u1')).toEqual({
      ok: true,
      value: { mode: 'production', activeOrganizationId: 'org-2' },
    })
    expect(select).toHaveBeenCalledWith('mode, active_organization_id')
  })

  it('fetchWorkspacePrefs defaults when no row exists', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ select }) },
    }))
    vi.resetModules()
    const api = await import('./api')

    expect(await api.fetchWorkspacePrefs('u1')).toEqual({
      ok: true,
      value: { mode: 'demo', activeOrganizationId: null },
    })
  })

  it('saveActiveOrganization upserts the preference row', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ upsert }) },
    }))
    vi.resetModules()
    const api = await import('./api')

    expect(await api.saveActiveOrganization('u1', 'org-9')).toBe(true)
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'u1', active_organization_id: 'org-9' }),
    )
  })

  it('fetchOrganizationMemberships returns every active membership with scope', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          organization_id: 'org-1',
          role: 'owner',
          granted_modules: [],
          access_expires_at: null,
          organizations: { name: 'Acme' },
        },
        {
          organization_id: 'org-2',
          role: 'consultant',
          granted_modules: ['cases'],
          access_expires_at: '2027-01-01T00:00:00Z',
          organizations: { name: 'Beta' },
        },
      ],
      error: null,
    })
    const or = vi.fn().mockReturnValue({ order })
    const eqStatus = vi.fn().mockReturnValue({ or })
    const eqUser = vi.fn().mockReturnValue({ eq: eqStatus })
    const select = vi.fn().mockReturnValue({ eq: eqUser })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ select }) },
    }))
    vi.resetModules()
    const api = await import('./api')

    const res = await api.fetchOrganizationMemberships('u1')
    expect(res).toEqual({
      ok: true,
      value: [
        {
          organizationId: 'org-1',
          organizationName: 'Acme',
          role: 'owner',
          grantedModules: [],
          accessExpiresAt: null,
        },
        {
          organizationId: 'org-2',
          organizationName: 'Beta',
          role: 'consultant',
          grantedModules: ['cases'],
          accessExpiresAt: '2027-01-01T00:00:00Z',
        },
      ],
    })
  })

  it('inviteOrgMember carries module scope and expiry onto the invitation', async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: 'inv-1' }, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        from: vi.fn().mockReturnValue({ insert }),
        functions: { invoke: vi.fn().mockResolvedValue({ data: { emailed: true } }) },
      },
    }))
    vi.resetModules()
    const api = await import('./api')

    const res = await api.inviteOrgMember('org-1', 'Consult@Firm.ca', 'consultant', {
      grantedModules: ['cases', 'documents'],
      accessExpiresAt: '2027-01-01T00:00:00Z',
    })
    expect(res).toEqual({ id: 'inv-1', emailed: true })
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'consult@firm.ca',
        role: 'consultant',
        granted_modules: ['cases', 'documents'],
        access_expires_at: '2027-01-01T00:00:00Z',
      }),
    )
  })

  it('updateMemberScope writes granted_modules and access_expires_at', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ update }) },
    }))
    vi.resetModules()
    const api = await import('./api')

    expect(
      await api.updateMemberScope('mem-1', {
        grantedModules: ['finance'],
        accessExpiresAt: null,
      }),
    ).toBe(true)
    expect(update).toHaveBeenCalledWith({
      granted_modules: ['finance'],
      access_expires_at: null,
    })
  })
})
