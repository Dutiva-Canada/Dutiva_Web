import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'

/**
 * Exercised through the Sidebar (drawer mode — always expanded, so badges
 * render). Same fresh-import mock pattern as the other production tests.
 */
describe('useProductionNavBadges (via Sidebar)', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  it('demo mode keeps the fixture badges', async () => {
    const { renderApp } = await import('@/test/renderApp')
    const { Sidebar } = await import('@/features/app/shell/Sidebar')

    renderApp(<Sidebar mode="drawer" />, { route: '/app/home' })

    const nav = screen.getByRole('navigation', { name: 'Primary navigation' })
    /* Fixture counts: 3 open cases, compliance '3', workflows '3'. Expanded
       links take their accessible name from content, so the badge count is
       part of the name (label-in-name) — match on the label prefix. */
    const casesLink = within(nav).getByRole('link', { name: /Cases/ })
    expect(casesLink).toHaveTextContent('3')
  })

  it('production mode shows live open counts for cases, tasks and findings', async () => {
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
          return Promise.resolve({ data: null, error: null })
        }),
        from: vi.fn((table: string) => {
          if (table === 'workspace_preferences') {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: () => Promise.resolve({ data: { mode: 'production' }, error: null }),
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
                        legal_name: 'Dutiva Canada Inc.',
                        company_name: null,
                        primary_contact: 'Martin Constantineau',
                        province: 'Ontario',
                        city: 'Ottawa',
                      },
                      error: null,
                    }),
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
          if (table === 'hr_cases') {
            return {
              select: () => ({
                eq: () => ({ neq: () => Promise.resolve({ count: 2, error: null }) }),
              }),
            }
          }
          if (table === 'compliance_tasks') {
            return {
              select: () => ({
                eq: () => ({ neq: () => Promise.resolve({ count: 5, error: null }) }),
              }),
            }
          }
          if (table === 'compliance_findings') {
            return {
              select: () => ({
                eq: () => ({ not: () => Promise.resolve({ count: 1, error: null }) }),
              }),
            }
          }
          throw new Error(`unexpected table: ${table}`)
        }),
      },
    }))
    vi.resetModules()

    const { renderApp: renderAppFresh } = await import('@/test/renderApp')
    const { Sidebar: SidebarFresh } = await import('@/features/app/shell/Sidebar')

    renderAppFresh(<SidebarFresh mode="drawer" />, { route: '/app/home' })

    const nav = await screen.findByRole('navigation', { name: 'Primary navigation' })
    const casesLink = within(nav).getByRole('link', { name: /Cases/ })
    const tasksLink = within(nav).getByRole('link', { name: /Planning/ })
    const complianceLink = within(nav).getByRole('link', { name: /Compliance/ })

    /* Live counts land asynchronously. */
    await within(nav).findByText('2')
    expect(casesLink).toHaveTextContent('2')
    expect(tasksLink).toHaveTextContent('5')
    expect(complianceLink).toHaveTextContent('1')

    /* Fixture-only badges (Workflows, Wellbeing) are gone in production. */
    const workflowsLink = within(nav).getByRole('link', { name: 'Workflows' })
    expect(workflowsLink).not.toHaveTextContent('3')
  })
})
