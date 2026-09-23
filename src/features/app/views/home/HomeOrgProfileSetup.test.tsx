import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { listChain } from '@/test/productionWorkspace'
import { PROVINCE_TO_JURISDICTION } from '@/features/app/workspaceMode/jurisdictionOptions'

/**
 * The mini-setup writes through the real API boundary, so the test mocks at
 * the supabase client and captures `update()` payloads — same pattern as the
 * HomeView production tests.
 */
describe('PROVINCE_TO_JURISDICTION', () => {
  it('covers every province option the profile editor offers', () => {
    expect(Object.keys(PROVINCE_TO_JURISDICTION)).toHaveLength(14)
    expect(PROVINCE_TO_JURISDICTION.Ontario).toBe('CA-ON')
    expect(PROVINCE_TO_JURISDICTION.Quebec).toBe('CA-QC')
    expect(PROVINCE_TO_JURISDICTION.Federal).toBe('CA-Federal')
  })
})

describe('HomeOrgProfileSetup', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  it('saves the profile fields and maps province onto org jurisdictions', async () => {
    const updates: Record<string, Record<string, unknown>> = {}

    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: () =>
            Promise.resolve({
              data: { session: { user: { id: 'u1', email: 'martin.constantineau@dutiva.ca' } } },
            }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
        rpc: vi.fn((fn: string) => {
          if (fn === 'is_admin_user') return Promise.resolve({ data: true, error: null })
          if (fn === 'current_user_is_workspace_member')
            return Promise.resolve({ data: true, error: null })
          if (fn === 'resolve_user_billing_organization')
            return Promise.resolve({ data: 'org-1', error: null })
          return Promise.resolve({ data: null, error: null })
        }),
        from: vi.fn((table: string) => {
          if (table === 'workspace_preferences') {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: () =>
                    Promise.resolve({ data: { mode: 'production' }, error: null }),
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
                          Promise.resolve({ data: { organization_id: 'org-1' }, error: null }),
                      }),
                    }),
                  }),
                }),
              }),
            }
          }
          if (table === 'profiles') {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: () =>
                    Promise.resolve({
                      data: {
                        legal_name: 'Acme Studios',
                        company_name: 'Acme Studios',
                        primary_contact: 'Martin Constantineau',
                        province: 'Ontario',
                        city: 'Ottawa',
                      },
                      error: null,
                    }),
                }),
              }),
              update: (payload: Record<string, unknown>) => {
                updates.profiles = payload
                return {
                  eq: () => ({
                    select: () => ({
                      maybeSingle: () =>
                        Promise.resolve({
                          data: {
                            legal_name: 'Acme Studios',
                            company_name: 'Acme Studios',
                            primary_contact: 'Martin Constantineau',
                            province: 'Ontario',
                            city: 'Ottawa',
                          },
                          error: null,
                        }),
                    }),
                  }),
                }
              },
            }
          }
          if (table === 'organizations') {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: () =>
                    Promise.resolve({
                      data: {
                        id: 'org-1',
                        name: 'Acme Studios',
                        industry: null,
                        jurisdictions: [],
                        enabled_modules: {},
                        finance_features: {},
                      },
                      error: null,
                    }),
                }),
              }),
              update: (payload: Record<string, unknown>) => {
                updates.organizations = payload
                return {
                  eq: () => ({
                    select: () => ({
                      maybeSingle: () =>
                        Promise.resolve({
                          data: {
                            id: 'org-1',
                            name: 'Acme Studios',
                            industry: null,
                            jurisdictions: payload.jurisdictions,
                            enabled_modules: {},
                            finance_features: {},
                          },
                          error: null,
                        }),
                    }),
                  }),
                }
              },
            }
          }
          return {
            select: () => ({
              eq: () => ({
                order: () => listChain([]),
              }),
            }),
          }
        }),
      },
    }))
    vi.resetModules()

    const { renderApp } = await import('@/test/renderApp')
    const { HomeOrgProfileSetup: Setup } = await import('./HomeOrgProfileSetup')

    renderApp(<Setup />)

    /* The card waits for production mode to resolve, then prefills from the
       org/profile identity — which lands a tick after mode flips, so wait
       for the value rather than the element. */
    const company = await screen.findByLabelText('Company')
    await waitFor(() => expect(company).toHaveValue('Acme Studios'))
    await waitFor(() => expect(screen.getByLabelText('City')).toHaveValue('Ottawa'))

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /Save and continue/i }))

    /* Profile row gets the human-readable fields. */
    expect(updates.profiles).toEqual({
      legal_name: 'Acme Studios',
      company_name: 'Acme Studios',
      province: 'Ontario',
      city: 'Ottawa',
    })
    /* Org row gets the jurisdiction code — flips setup step 1 to done. */
    expect(updates.organizations?.jurisdictions).toEqual(['CA-ON'])
  })
})
