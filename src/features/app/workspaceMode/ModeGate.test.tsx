import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'

/**
 * Same fresh-import pattern as WorkspaceModeProvider.test.tsx: mock the
 * supabase client per scenario, then import ModeGate + renderApp fresh.
 */
describe('ModeGate', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  it('renders the wrapped view unchanged in demo mode (signed out)', async () => {
    const { renderApp } = await import('@/test/renderApp')
    const { ModeGate } = await import('./ModeGate')

    renderApp(
      <ModeGate>
        <div data-testid="fixture-view">Northgate fixture content</div>
      </ModeGate>,
      { route: '/app/cases', path: '/app/cases' },
    )

    expect(screen.getByTestId('fixture-view')).toBeInTheDocument()
    expect(screen.queryByText('Production workspace')).not.toBeInTheDocument()
  })

  it('renders the module-titled empty state instead of the view in production mode', async () => {
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
          if (fn === 'create_organization')
            return Promise.resolve({ data: { id: 'org-1' }, error: null })
          return Promise.resolve({ data: null, error: null })
        }),
        from: vi.fn((table: string) => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: table === 'workspace_preferences' ? { mode: 'production' } : null,
                  error: null,
                }),
            }),
          }),
        })),
      },
    }))
    vi.resetModules()

    const { renderApp: renderAppFresh } = await import('@/test/renderApp')
    const { ModeGate: ModeGateFresh } = await import('./ModeGate')

    renderAppFresh(
      <ModeGateFresh>
        <div data-testid="fixture-view">Northgate fixture content</div>
      </ModeGateFresh>,
      { route: '/app/cases', path: '/app/cases' },
    )

    /* Empty state, titled with the module's own label. */
    expect(await screen.findByText('Production workspace')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cases' })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Want sample data? Open Demo in Settings' }),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('fixture-view')).not.toBeInTheDocument()
  })
})
