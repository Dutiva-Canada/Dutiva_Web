import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'
import { AboutPage } from './AboutPage'

describe('AboutPage', () => {
  it('renders hero, sections, and CTA in English', () => {
    renderApp(<AboutPage />, { route: '/about', path: '/about' })
    expect(
      screen.getByRole('heading', { level: 1, name: 'HR compliance infrastructure, built in Canada.' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Our mission' })).toBeInTheDocument()
    expect(screen.getAllByText('Bilingual EN/FR').length).toBeGreaterThan(0)
    // Header carries its own "Start free" links — scope the CTA check to <main>.
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: /Start free/ }),
    ).toHaveAttribute('href', '/app/welcome')
  })

  it('re-localizes to French via the header language toggle', async () => {
    const user = userEvent.setup()
    renderApp(<AboutPage />, { route: '/about', path: '/about' })
    const [langToggle] = screen.getAllByRole('button', { name: /Toggle language/ })
    expect(langToggle).toBeDefined()
    await user.click(langToggle as HTMLElement)
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Une infrastructure de conformité RH, conçue au Canada.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Notre mission' })).toBeInTheDocument()
  })
})
