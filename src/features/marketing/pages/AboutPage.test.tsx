import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'
import { AboutPage } from './AboutPage'

describe('AboutPage', () => {
  it('renders hero, sections, and CTA in English', () => {
    renderApp(<AboutPage />, { route: '/about', path: '/about' })
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'HR compliance software, built in Canada.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Our mission' })).toBeInTheDocument()
    expect(screen.getAllByText('Martin Constantineau').length).toBeGreaterThan(0)
    const linkedin = within(screen.getByRole('main')).getByRole('link', {
      name: 'View Martin on LinkedIn',
    })
    expect(linkedin).toHaveAttribute('href', 'https://www.linkedin.com/in/martinconstantineau/')
    expect(linkedin).toHaveAttribute('target', '_blank')
    expect(linkedin).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByAltText('Martin Constantineau, Founder and CEO of Dutiva')).toHaveAttribute(
      'src',
      '/brand/martin-constantineau.jpg',
    )
    expect(screen.getAllByText('Bilingual EN/FR').length).toBeGreaterThan(0)
    // Header carries its own "Start free" links — scope the CTA check to <main>.
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: /Start free/ }),
    ).toHaveAttribute('href', '/app/welcome')
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: /Read the changelog/ }),
    ).toHaveAttribute('href', '/changelog')
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
        name: 'Un logiciel de conformité RH, conçu au Canada.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Notre mission' })).toBeInTheDocument()
    expect(
      within(screen.getByRole('main')).getByRole('link', {
        name: 'Voir le profil LinkedIn de Martin',
      }),
    ).toBeInTheDocument()
  })
})
