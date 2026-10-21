import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { WorkspaceModuleDemos } from './WorkspaceModuleDemos'

describe('WorkspaceModuleDemos', () => {
  it('renders the tabbed showcase with demo deep links', () => {
    renderApp(<WorkspaceModuleDemos />, { route: '/', path: '/' })

    /* Document Studio is the default pane — the merged product story. */
    expect(
      screen.getByRole('tab', { name: /Document Studio|Studio de documents/i }),
    ).toHaveAttribute('aria-selected', 'true')
    expect(
      screen.getByRole('heading', { name: /Document Studio|Studio de documents/i }),
    ).toBeInTheDocument()

    /* Switch panes — the deep link tracks the active tab. */
    fireEvent.click(screen.getByRole('tab', { name: /^Analytics$|^Analytique$/i }))
    expect(screen.getByRole('heading', { name: /Analytics|Analytique/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Open in demo|Ouvrir dans la démo/i })).toHaveAttribute(
      'href',
      '/demo/analytics',
    )

    /* Arrow keys move between tabs (roving tabindex). */
    fireEvent.keyDown(screen.getByRole('tab', { name: /^Analytics$|^Analytique$/i }), {
      key: 'ArrowRight',
    })
    expect(screen.getByRole('heading', { name: /Cases|Dossiers/i })).toBeInTheDocument()

    /* The module strip covers the full workspace surface. */
    expect(
      screen.getByRole('heading', { name: /All modules in the demo|Tous les modules/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Dutiva Advisor|Conseiller Dutiva/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Finance|Finances/i })).toHaveAttribute(
      'href',
      '/demo/finance/overview',
    )
  })

  it('links the three standalone portals to their door pages', () => {
    renderApp(<WorkspaceModuleDemos />, { route: '/', path: '/' })

    expect(
      screen.getByRole('heading', { name: /Standalone portals|Portails autonomes/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Dutiva Invest/ })).toHaveAttribute(
      'href',
      '/investors',
    )
    expect(screen.getByRole('link', { name: /Dutiva Wellness/ })).toHaveAttribute(
      'href',
      '/wellbeing',
    )
    expect(screen.getByRole('link', { name: /Dutiva PR/ })).toHaveAttribute(
      'href',
      '/public-relations',
    )
  })
})
