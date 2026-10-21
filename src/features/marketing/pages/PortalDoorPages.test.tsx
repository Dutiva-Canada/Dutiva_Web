import { afterEach, describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { writeLang } from '@/i18n/lang'
import { WellnessDoorPage } from './WellnessDoorPage'
import { PrDoorPage } from './PrDoorPage'

afterEach(() => {
  writeLang('en')
})

/** The marketing door pages for the invite-only /wellness and /pr portals —
    same shape as /investors: describe the surface, state the invite model,
    link to the portal sign-in, keep the hedges. */
describe('WellnessDoorPage', () => {
  it('renders the English door with portal link, invite model, and non-clinical hedge', () => {
    renderApp(<WellnessDoorPage />, { route: '/wellbeing', path: '/wellbeing' })
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('heading', { level: 1, name: 'Dutiva Wellness' })).toBeInTheDocument()
    for (const link of main.getAllByRole('link', { name: /Open the portal/i })) {
      expect(link).toHaveAttribute('href', '/wellness')
    }
    expect(main.getByText('Access is by invitation')).toBeInTheDocument()
    expect(main.getByText(/not a crisis service/)).toBeInTheDocument()
  })

  it('renders the French door as Dutiva Mieux-être with the French hedge', () => {
    writeLang('fr')
    renderApp(<WellnessDoorPage />, { route: '/fr/bien-etre', path: '/fr/bien-etre' })
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('heading', { level: 1, name: 'Dutiva Mieux-être' })).toBeInTheDocument()
    for (const link of main.getAllByRole('link', { name: /Ouvrir le portail/i })) {
      expect(link).toHaveAttribute('href', '/wellness')
    }
    expect(main.getByText(/pas un service de crise/)).toBeInTheDocument()
  })
})

describe('PrDoorPage', () => {
  it('renders the English door with portal link and the never-publishes hedge', () => {
    renderApp(<PrDoorPage />, { route: '/public-relations', path: '/public-relations' })
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('heading', { level: 1, name: 'Dutiva PR' })).toBeInTheDocument()
    for (const link of main.getAllByRole('link', { name: /Open the portal/i })) {
      expect(link).toHaveAttribute('href', '/pr')
    }
    expect(main.getByText(/never posts, sends, or publishes/)).toBeInTheDocument()
  })

  it('renders the French door as Dutiva RP with the French hedge', () => {
    writeLang('fr')
    renderApp(<PrDoorPage />, { route: '/fr/relations-publiques', path: '/fr/relations-publiques' })
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('heading', { level: 1, name: 'Dutiva RP' })).toBeInTheDocument()
    for (const link of main.getAllByRole('link', { name: /Ouvrir le portail/i })) {
      expect(link).toHaveAttribute('href', '/pr')
    }
    expect(main.getByText(/ne publie, n’envoie ni ne diffuse/)).toBeInTheDocument()
  })
})

describe('Footer portals column', () => {
  it('links every portal door page and sign-in, localized per language', () => {
    renderApp(<WellnessDoorPage />, { route: '/wellbeing', path: '/wellbeing' })
    expect(screen.getByRole('link', { name: 'For investors' })).toHaveAttribute(
      'href',
      '/investors',
    )
    expect(screen.getByRole('link', { name: 'Invest sign-in' })).toHaveAttribute('href', '/invest')
    expect(screen.getByRole('link', { name: 'Dutiva Wellness' })).toHaveAttribute(
      'href',
      '/wellbeing',
    )
    expect(screen.getByRole('link', { name: 'Wellness sign-in' })).toHaveAttribute(
      'href',
      '/wellness',
    )
    expect(screen.getByRole('link', { name: 'Dutiva PR' })).toHaveAttribute(
      'href',
      '/public-relations',
    )
    expect(screen.getByRole('link', { name: 'PR sign-in' })).toHaveAttribute('href', '/pr')
  })

  it('uses the localized door paths in French', () => {
    writeLang('fr')
    renderApp(<PrDoorPage />, { route: '/fr/relations-publiques', path: '/fr/relations-publiques' })
    expect(screen.getByRole('link', { name: 'Dutiva Mieux-être' })).toHaveAttribute(
      'href',
      '/fr/bien-etre',
    )
    expect(screen.getByRole('link', { name: 'Dutiva RP' })).toHaveAttribute(
      'href',
      '/fr/relations-publiques',
    )
    expect(screen.getByRole('link', { name: 'Pour les investisseurs' })).toHaveAttribute(
      'href',
      '/fr/investisseurs',
    )
  })
})
