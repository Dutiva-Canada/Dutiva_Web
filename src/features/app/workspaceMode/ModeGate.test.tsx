import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { mockProductionWorkspace } from '@/test/productionWorkspace'

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
    /* Shared preamble — the membership read walks eq().eq().order().limit();
       a one-.eq catch-all now fails the resolution pass (ReadResult). */
    mockProductionWorkspace({ tables: {} })
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
