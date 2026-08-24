import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { Topbar } from './Topbar'

describe('Topbar', () => {
  it('renders the route title and workspace controls', () => {
    renderApp(<Topbar title="Home" />, { route: '/app/home' })

    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ask Advisor' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument()
  })

  it('hides Ask Advisor on the advisor route', () => {
    renderApp(<Topbar title="AI Advisor" />, { route: '/app/advisor' })

    expect(screen.queryByRole('button', { name: 'Ask Advisor' })).not.toBeInTheDocument()
  })

  it('opens demo notifications and marks all read', () => {
    renderApp(<Topbar title="Home" />, { route: '/app/home' })

    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    expect(screen.getByRole('dialog', { name: 'Notifications' })).toBeInTheDocument()
    expect(
      screen.getByText('Compliance: Remote Work Policy is overdue for review'),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Mark all read' }))

    const unreadDots = screen
      .getByRole('dialog', { name: 'Notifications' })
      .querySelectorAll('.bg-gold-dot')
    expect(unreadDots.length).toBe(0)
  })
})
