import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'
import { ORG } from '@/seo/site'
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
    const companyLinkedin = within(screen.getByRole('main')).getByRole('link', {
      name: 'Dutiva on LinkedIn',
    })
    expect(companyLinkedin).toHaveAttribute('href', ORG.linkedinUrl)
    expect(companyLinkedin).toHaveAttribute('target', '_blank')
    expect(companyLinkedin).toHaveAttribute('rel', 'noopener noreferrer')
    const googleMaps = within(screen.getByRole('main')).getByRole('link', {
      name: 'Dutiva on Google Maps',
    })
    expect(googleMaps).toHaveAttribute('href', ORG.googleMapsUrl)
    expect(googleMaps).toHaveAttribute('target', '_blank')
    expect(googleMaps).toHaveAttribute('rel', 'noopener noreferrer')
    const facebook = within(screen.getByRole('main')).getByRole('link', {
      name: 'Dutiva on Facebook',
    })
    expect(facebook).toHaveAttribute('href', ORG.facebookUrl)
    expect(facebook).toHaveAttribute('target', '_blank')
    expect(facebook).toHaveAttribute('rel', 'noopener noreferrer')
    const reddit = within(screen.getByRole('main')).getByRole('link', {
      name: 'Dutiva on Reddit',
    })
    expect(reddit).toHaveAttribute('href', ORG.redditUrl)
    expect(reddit).toHaveAttribute('target', '_blank')
    expect(reddit).toHaveAttribute('rel', 'noopener noreferrer')
    // Header carries its own "See plans" links — scope the CTA check to <main>.
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: /See plans/ }),
    ).toHaveAttribute('href', '/pricing')
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: /Read the changelog/ }),
    ).toHaveAttribute('href', '/changelog')
    expect(screen.getByRole('heading', { level: 2, name: 'Company facts' })).toBeInTheDocument()
    expect(screen.getByText(ORG.corporationNumber)).toBeInTheDocument()
    expect(screen.getByText(ORG.legalName)).toBeInTheDocument()
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: ORG.supportEmail }),
    ).toHaveAttribute('href', `mailto:${ORG.supportEmail}`)
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
    expect(
      within(screen.getByRole('main')).getByRole('link', {
        name: 'Dutiva sur LinkedIn',
      }),
    ).toHaveAttribute('href', ORG.linkedinUrl)
    expect(
      within(screen.getByRole('main')).getByRole('link', {
        name: 'Dutiva sur Google Maps',
      }),
    ).toHaveAttribute('href', ORG.googleMapsUrl)
    expect(
      within(screen.getByRole('main')).getByRole('link', {
        name: 'Dutiva sur Facebook',
      }),
    ).toHaveAttribute('href', ORG.facebookUrl)
    expect(
      within(screen.getByRole('main')).getByRole('link', {
        name: 'Dutiva sur Reddit',
      }),
    ).toHaveAttribute('href', ORG.redditUrl)
  })
})
