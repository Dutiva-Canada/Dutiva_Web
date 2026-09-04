import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { HiringView } from './HiringView'

describe('HiringView', () => {
  it('renders the hiring module with candidates tab', () => {
    renderApp(<HiringView />, { route: '/app/hiring', path: '/app/hiring' })
    
    // Check that the main title is rendered (h1)
    expect(screen.getByRole('heading', { name: /Hiring|Recrutement/i })).toBeInTheDocument()
  })

  it('displays candidate list in demo mode', () => {
    renderApp(<HiringView />, { route: '/app/hiring', path: '/app/hiring' })
    
    // Check that candidates are displayed (rendered in both desktop table and mobile cards)
    expect(screen.getAllByText(/Sarah Chen/).length).toBeGreaterThan(0)
  })

  it('shows funnel analytics tab', () => {
    renderApp(<HiringView />, { route: '/app/hiring', path: '/app/hiring' })
    
    // Check that funnel tab is available
    expect(screen.getByRole('tab', { name: /Funnel|Entonnoir/i })).toBeInTheDocument()
  })

  it('shows job postings tab', () => {
    renderApp(<HiringView />, { route: '/app/hiring', path: '/app/hiring' })
    
    // Check that postings tab is available
    expect(screen.getByRole('tab', { name: /Job postings|Offres d'emploi/i })).toBeInTheDocument()
  })
})
