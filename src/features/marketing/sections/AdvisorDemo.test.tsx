import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'
import { advisorScenarios } from '@/features/app/views/advisor/advisorScenarios'
import { LandingPage } from '../LandingPage'

describe('AdvisorDemo scenario switcher', () => {
  it('shows the default termination scenario and swaps transcript on pill click', async () => {
    const user = userEvent.setup()
    renderApp(<LandingPage />, { route: '/', path: '/' })

    expect(screen.getByText(advisorScenarios.s1.user.en)).toBeInTheDocument()
    expect(screen.getByText(/ESA s\.57/)).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: advisorScenarios.s3.title.en }))
    expect(screen.getByText(advisorScenarios.s3.user.en)).toBeInTheDocument()
    expect(screen.getByText(/BC Human Rights Code/)).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: advisorScenarios.s5.title.en }))
    expect(screen.getByText(advisorScenarios.s5.user.en)).toBeInTheDocument()
    expect(screen.getByText(/Maintained from public sources, never generated/)).toBeInTheDocument()
  })
})
