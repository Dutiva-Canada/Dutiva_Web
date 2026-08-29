import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'
import { LandingDemoPath } from './LandingDemoPath'

describe('LandingDemoPath', () => {
  it('opens a preview dialog, then links into the demo', async () => {
    const user = userEvent.setup()
    renderApp(<LandingDemoPath />, { route: '/', path: '/' })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Dutiva Advisor|Conseiller Dutiva/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Dutiva Advisor|Conseiller Dutiva/i }))
    const dialog = screen.getByRole('dialog', { name: /Dutiva Advisor|Conseiller Dutiva/i })
    expect(dialog).toBeInTheDocument()
    expect(screen.getByText(/Browse sample threads|Parcourez des fils types/i)).toBeInTheDocument()

    const seeMore = screen.getByRole('link', { name: /See more in the demo|Voir plus dans la démo/i })
    expect(seeMore).toHaveAttribute('href', '/demo/advisor')

    await user.click(screen.getByRole('button', { name: /Close preview|Fermer l’aperçu/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
