import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'
import { advisorScenarios } from '@/features/app/views/advisor/advisorScenarios'
import { LandingDemoPath } from './LandingDemoPath'

describe('LandingDemoPath', () => {
  it('opens an illustrated preview, lets you click around, then links into the demo', async () => {
    const user = userEvent.setup()
    renderApp(<LandingDemoPath />, { route: '/', path: '/' })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Dutiva Advisor|Conseiller Dutiva/i }))
    const dialog = screen.getByRole('dialog', { name: /Dutiva Advisor|Conseiller Dutiva/i })
    expect(dialog).toBeInTheDocument()
    expect(screen.getByText(/Browse sample threads|Parcourez des fils types/i)).toBeInTheDocument()
    expect(await screen.findByText(/Northgate Logistics/)).toBeInTheDocument()
    expect(await screen.findByText(advisorScenarios.s1.user.en)).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: advisorScenarios.s3.title.en }))
    expect(screen.getByText(advisorScenarios.s3.user.en)).toBeInTheDocument()

    const seeMore = screen.getByRole('link', {
      name: /See more in the demo|Voir plus dans la démo/i,
    })
    expect(seeMore).toHaveAttribute('href', '/demo/advisor')

    await user.click(screen.getByRole('tab', { name: /Cases|Dossiers/i }))
    expect(
      screen.getByRole('link', { name: /See more in the demo|Voir plus dans la démo/i }),
    ).toHaveAttribute('href', '/demo/cases')
    await user.click(
      await screen.findByRole('button', {
        name: /Performance — Devon Clarke|Rendement — Devon Clarke/i,
      }),
    )
    expect(
      await screen.findByText(/Attendance-related PIP|PAR lié à l’assiduité/i),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Close preview|Fermer l’aperçu/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
