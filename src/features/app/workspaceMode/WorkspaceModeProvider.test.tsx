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
      const {
        mode,
        isAdmin,
        canUseProduction,
        identity,
        organizationId,
        resolving,
        resolutionFailed,
      } = useWorkspaceMode()
      return (
        <div>
          <span data-testid="mode">{mode}</span>
          <span data-testid="is-admin">{String(isAdmin)}</span>
          <span data-testid="can-prod">{String(canUseProduction)}</span>
          <span data-testid="company">{identity.companyName}</span>
          <span data-testid="user-name">{identity.user.name}</span>
          <span data-testid="org-id">{organizationId ?? 'none'}</span>
          <span data-testid="resolving">{String(resolving)}</span>
          <span data-testid="resolution-failed">{String(resolutionFailed ?? false)}</span>
        </div>
      )
    }

    return renderApp(<Probe />)
  }

  function mockSupabase({
    session,
    isAdmin,
    storedMode,
    profile,
    membershipOrgId,
    memberRole,
    claimedInvites = 0,
    claimFailures = 0,
    storedModeFailures = 0,
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
    memberRole?: string
    /** Count returned by claim_org_invitations(). */
    claimedInvites?: number
    /** First N claim_org_invitations calls error (transient backend failure). */
    claimFailures?: number
    /** First N workspace_preferences reads error (transient backend failure). */
    storedModeFailures?: number
  }) {
    const createOrganization = vi.fn().mockResolvedValue({
      data: { id: 'org-created' },
      error: null,
    })
    const saveMode = vi.fn().mockResolvedValue({ error: null })
    let claimCalls = 0
    let storedModeCalls = 0
    const from = vi.fn((table: string) => {
      if (table === 'workspace_preferences') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => {
                storedModeCalls += 1
                if (storedModeCalls <= storedModeFailures) {
                  return Promise.resolve({ data: null, error: new Error('read failed') })
                }
                return Promise.resolve({
                  data: storedMode ? { mode: storedMode } : null,
                  error: null,
                })
              },
            }),
          }),
          upsert: saveMode,
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
                        data: membershipOrgId
                          ? { organization_id: membershipOrgId, role: memberRole ?? 'member' }
                          : null,
                        error: null,
                      }),
                  }),
                }),
              }),
            }),
          }),
        }
      }
      if (table === 'organizations') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: membershipOrgId
                    ? {
                        id: membershipOrgId,
                        name: 'Member Org Inc.',
                        industry: null,
                        jurisdictions: ['ON'],
                        enabled_modules: null,
                        finance_features: null,
                      }
                    : null,
                  error: null,
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
          if (fn === 'claim_org_invitations') {
            claimCalls += 1
            if (claimCalls <= claimFailures) {
              return Promise.resolve({ data: null, error: new Error('claim failed') })
            }
            return Promise.resolve({ data: claimedInvites, error: null })
          }
          if (fn === 'current_user_is_workspace_member') {
            return Promise.resolve({ data: true, error: null })
          }
          return createOrganization()
        }),
        from,
      },
    }))
    vi.resetModules()
    return { createOrganization, saveMode }
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

  it('exposes production to a non-admin org member (the invited teammate path)', async () => {
    mockSupabase({
      session: { user: { id: 'u2', email: 'teammate@employer.ca' } },
      isAdmin: false,
      membershipOrgId: 'org-9',
      memberRole: 'member',
      storedMode: 'production',
    })
    await renderProbe()

    await waitFor(() => expect(screen.getByTestId('mode')).toHaveTextContent('production'))
    expect(screen.getByTestId('is-admin')).toHaveTextContent('false')
    expect(screen.getByTestId('can-prod')).toHaveTextContent('true')
    expect(screen.getByTestId('org-id')).toHaveTextContent('org-9')
    /* The workspace brand is the org's name, not the member's own profile. */
    expect(screen.getByTestId('company')).toHaveTextContent('Member Org Inc.')
  })

  it('keeps a non-admin without membership in demo (cannot reach production)', async () => {
    mockSupabase({
      session: { user: { id: 'u3', email: 'stranger@example.ca' } },
      isAdmin: false,
    })
    await renderProbe()

    expect(await screen.findByTestId('mode')).toHaveTextContent('demo')
    expect(screen.getByTestId('can-prod')).toHaveTextContent('false')
  })

  it('flips a fresh invitee to production when the claim materializes a membership', async () => {
    const { saveMode } = mockSupabase({
      session: { user: { id: 'u4', email: 'invited@employer.ca' } },
      isAdmin: false,
      storedMode: 'demo',
      membershipOrgId: 'org-7',
      memberRole: 'viewer',
      claimedInvites: 1,
    })
    await renderProbe()

    await waitFor(() => expect(screen.getByTestId('mode')).toHaveTextContent('production'))
    expect(saveMode).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'u4', mode: 'production' }),
    )
  })

  it('flags resolutionFailed instead of committing the demo identity when reads keep failing', async () => {
    /* The flicker bug: a failed read used to be indistinguishable from "no
       production workspace", so a signed-in member's identity flipped to the
       Northgate demo persona for a whole session. Now persistent failure is
       marked — RequireAdminSession shows a retry surface, never fixtures. */
    mockSupabase({
      session: { user: { id: 'u5', email: 'owner@employer.ca' } },
      isAdmin: false,
      storedMode: 'production',
      membershipOrgId: 'org-5',
      claimFailures: 99,
    })
    await renderProbe()

    await waitFor(
      () => expect(screen.getByTestId('resolution-failed')).toHaveTextContent('true'),
      { timeout: 5000 },
    )
    expect(screen.getByTestId('resolving')).toHaveTextContent('false')
  })

  it('retries a transient read failure and still resolves production', async () => {
    mockSupabase({
      session: { user: { id: 'u6', email: 'owner@employer.ca' } },
      isAdmin: false,
      storedMode: 'production',
      membershipOrgId: 'org-6',
      memberRole: 'owner',
      storedModeFailures: 1,
    })
    await renderProbe()

    await waitFor(
      () => expect(screen.getByTestId('mode')).toHaveTextContent('production'),
      { timeout: 5000 },
    )
    expect(screen.getByTestId('resolution-failed')).toHaveTextContent('false')
    expect(screen.getByTestId('company')).toHaveTextContent('Member Org Inc.')
  })

  it('keeps one stable identity across five remounts (the reload acceptance)', async () => {
    const identities: string[] = []
    for (let i = 0; i < 5; i += 1) {
      mockSupabase({
        session: { user: { id: 'u7', email: 'owner@employer.ca' } },
        isAdmin: false,
        storedMode: 'production',
        membershipOrgId: 'org-7',
        memberRole: 'owner',
      })
      const result = await renderProbe()

      await waitFor(() => expect(screen.getByTestId('mode')).toHaveTextContent('production'))
      identities.push(
        `${screen.getByTestId('company').textContent}|${screen.getByTestId('user-name').textContent}`,
      )
      result.unmount()
      vi.doUnmock('@/lib/supabaseClient')
    }

    /* Every reload-equivalent mount resolves the same org + user — no
       unprompted switch to the Northgate demo persona. */
    expect(new Set(identities).size).toBe(1)
    expect(identities[0]).toContain('Member Org Inc.')
    expect(identities[0]).not.toContain('Northgate')
  })
})
