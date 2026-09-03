import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'

/**
 * `supabase` is imported once at module scope, so each scenario mocks
 * `@/lib/supabaseClient` and re-imports the provider + renderApp fresh —
 * same pattern as AdvisorView.test.tsx's "signed in" suite.
 */
describe('WorkspaceModeProvider', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  async function renderProbe() {
    const { renderApp } = await import('@/test/renderApp')
    const { useWorkspaceMode } = await import('./workspaceModeContext')

    function Probe() {
      const { mode, isAdmin, identity, organizationId } = useWorkspaceMode()
      return (
        <div>
          <span data-testid="mode">{mode}</span>
          <span data-testid="is-admin">{String(isAdmin)}</span>
          <span data-testid="company">{identity.companyName}</span>
          <span data-testid="user-name">{identity.user.name}</span>
          <span data-testid="org-id">{organizationId ?? 'none'}</span>
        </div>
      )
    }

    renderApp(<Probe />)
  }

  function mockSupabase({
    session,
    isAdmin,
    storedMode,
    profile,
    membershipOrgId,
  }: {
    session: { user: { id: string; email: string } } | null
    isAdmin?: boolean
    storedMode?: 'demo' | 'production'
    profile?: {
      legal_name: string | null
      company_name: string | null
      primary_contact: string | null
      province: string | null
      city: string | null
    }
    /** Existing organization_members row, if any. */
    membershipOrgId?: string
  }) {
    const createOrganization = vi.fn().mockResolvedValue({
      data: { id: 'org-created' },
      error: null,
    })
    const from = vi.fn((table: string) => {
      if (table === 'workspace_preferences') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: storedMode ? { mode: storedMode } : null,
                  error: null,
                }),
            }),
          }),
        }
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: profile ?? null, error: null }),
            }),
          }),
        }
      }
      if (table === 'organization_members') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: () =>
                      Promise.resolve({
                        data: membershipOrgId ? { organization_id: membershipOrgId } : null,
                        error: null,
                      }),
                  }),
                }),
              }),
            }),
          }),
        }
      }
      throw new Error(`unexpected table: ${table}`)
    })

    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: () => Promise.resolve({ data: { session } }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
        rpc: vi.fn((fn: string) => {
          if (fn === 'is_admin_user')
            return Promise.resolve({ data: isAdmin ?? false, error: null })
          if (fn === 'current_user_is_workspace_member') {
            return Promise.resolve({ data: true, error: null })
          }
          return createOrganization()
        }),
        from,
      },
    }))
    vi.resetModules()
    return { createOrganization }
  }

  it('stays demo/non-admin when signed out (no Supabase configured)', async () => {
    await renderProbe()

    expect(await screen.findByTestId('mode')).toHaveTextContent('demo')
    expect(screen.getByTestId('is-admin')).toHaveTextContent('false')
    expect(screen.getByTestId('company')).toHaveTextContent('Northgate Logistics Inc.')
  })

  it('stays demo for a signed-in non-admin', async () => {
    mockSupabase({ session: { user: { id: 'u1', email: 'someone@dutiva.ca' } }, isAdmin: false })
    await renderProbe()

    expect(await screen.findByTestId('is-admin')).toHaveTextContent('false')
    expect(screen.getByTestId('mode')).toHaveTextContent('demo')
  })

  it('stays demo for a confirmed admin who has not stored a production preference', async () => {
    mockSupabase({
      session: { user: { id: 'u1', email: 'martin.constantineau@dutiva.ca' } },
      isAdmin: true,
    })
    await renderProbe()

    await waitFor(() => expect(screen.getByTestId('is-admin')).toHaveTextContent('true'))
    expect(screen.getByTestId('mode')).toHaveTextContent('demo')
  })

  it('resolves production, with the real profile identity, for a confirmed admin who stored it', async () => {
    mockSupabase({
      session: { user: { id: 'u1', email: 'martin.constantineau@dutiva.ca' } },
      isAdmin: true,
      storedMode: 'production',
      profile: {
        legal_name: 'Dutiva Canada Inc.',
        company_name: null,
        primary_contact: 'Martin Constantineau',
        province: 'Ontario',
        city: 'Ottawa',
      },
    })
    await renderProbe()

    await waitFor(() => expect(screen.getByTestId('mode')).toHaveTextContent('production'))
    expect(screen.getByTestId('company')).toHaveTextContent('Dutiva Canada Inc.')
    expect(screen.getByTestId('user-name')).toHaveTextContent('Martin Constantineau')
  })

  it('exposes the existing organization in production without re-provisioning', async () => {
    const { createOrganization } = mockSupabase({
      session: { user: { id: 'u1', email: 'martin.constantineau@dutiva.ca' } },
      isAdmin: true,
      storedMode: 'production',
      membershipOrgId: 'org-1',
    })
    await renderProbe()

    await waitFor(() => expect(screen.getByTestId('org-id')).toHaveTextContent('org-1'))
    expect(createOrganization).not.toHaveBeenCalled()
  })

  it('provisions the organization on load for a production admin without one', async () => {
    const { createOrganization } = mockSupabase({
      session: { user: { id: 'u1', email: 'martin.constantineau@dutiva.ca' } },
      isAdmin: true,
      storedMode: 'production',
    })
    await renderProbe()

    await waitFor(() => expect(screen.getByTestId('org-id')).toHaveTextContent('org-created'))
    expect(createOrganization).toHaveBeenCalledTimes(1)
  })

  it('keeps organizationId null in demo mode even when a membership exists', async () => {
    mockSupabase({
      session: { user: { id: 'u1', email: 'martin.constantineau@dutiva.ca' } },
      isAdmin: true,
      membershipOrgId: 'org-1',
    })
    await renderProbe()

    await waitFor(() => expect(screen.getByTestId('is-admin')).toHaveTextContent('true'))
    expect(screen.getByTestId('org-id')).toHaveTextContent('none')
  })
})
