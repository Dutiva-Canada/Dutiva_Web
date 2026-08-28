import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { WorkspaceModuleDemos } from './WorkspaceModuleDemos'

describe('WorkspaceModuleDemos', () => {
  it('renders module preview cards with demo deep links', () => {
    renderApp(<WorkspaceModuleDemos />, { route: '/', path: '/' })

    expect(screen.getByRole('heading', { name: /Analytics|Analytique/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Cases|Dossiers/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Communications/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Open in demo|Ouvrir dans la démo/i }).length).toBeGreaterThanOrEqual(3)
    const analyticsLink = screen
      .getAllByRole('link', { name: /Open in demo|Ouvrir dans la démo/i })
      .find((el) => el.getAttribute('href') === '/demo/analytics')
    expect(analyticsLink).toBeTruthy()
    expect(screen.getByRole('link', { name: /Dutiva Advisor|Conseiller Dutiva/i })).toHaveAttribute(
      'href',
      '/demo/advisor',
    )
    expect(screen.getByRole('heading', { name: /All modules in the demo|Tous les modules/i })).toBeInTheDocument()
  })
})
