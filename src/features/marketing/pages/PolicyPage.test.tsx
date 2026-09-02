import { describe, expect, it } from 'vitest'
import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp, renderAppAsync } from '@/test/renderApp'
import { PolicyPage } from './PolicyPage'

describe('PolicyPage', () => {
  it('renders the Terms of Service document in English', async () => {
    await renderAppAsync(<PolicyPage />, { route: '/legal/terms', path: '/legal/:slug' })
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Terms of Service' }),
    ).toBeInTheDocument()
    const main = within(screen.getByRole('main'))
    const meta = main.getByText(/Last updated/)
    expect(meta).toHaveTextContent('Last updated: June 1, 2026')
    expect(
      screen.getByRole('heading', { level: 2, name: '1. Parties and Acceptance' }),
    ).toBeInTheDocument()
    expect(main.getByRole('link', { name: 'All legal & compliance documents' })).toHaveAttribute(
      'href',
      '/legal',
    )
  })

  it('re-localizes to French via the header language toggle', async () => {
    const user = userEvent.setup()
    await renderAppAsync(<PolicyPage />, { route: '/legal/terms', path: '/legal/:slug' })
    await screen.findByRole('heading', { level: 1, name: 'Terms of Service' })
    const [langToggle] = screen.getAllByRole('button', { name: /Toggle language/ })
    expect(langToggle).toBeDefined()
    // The switch suspends on the FR edition import; the act scope must be
    // awaited for React to retry the suspended tree (see renderAppAsync).
    await act(async () => {
      await user.click(langToggle as HTMLElement)
    })
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Conditions d’utilisation' }),
    ).toBeInTheDocument()
    // The FR back-link points at the localized hub URL.
    expect(
      within(screen.getByRole('main')).getByRole('link', {
        name: 'Tous les documents juridiques et de conformité',
      }),
    ).toHaveAttribute('href', '/fr/juridique')
  })

  it('renders a formerly FR-only document in English now that its EN edition shipped', async () => {
    await renderAppAsync(<PolicyPage />, { route: '/legal/disclaimer', path: '/legal/:slug' })
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Legal Disclaimer' }),
    ).toBeInTheDocument()
    // Complete catalogue → the language-fallback notice must not appear.
    expect(
      within(screen.getByRole('main')).queryByText(
        'The English edition of this document is being finalized — the French edition is shown below.',
      ),
    ).toBeNull()
    expect(screen.getByRole('article')).not.toHaveAttribute('lang')
  })

  it('resolves the localized French slug', async () => {
    await renderAppAsync(<PolicyPage />, {
      route: '/fr/juridique/politique-de-confidentialite',
      path: '/fr/juridique/:slug',
    })
    // renderApp's LangProvider defaults to EN; the FR slug still resolves the
    // document (cross-locale fallback), rendering its EN edition.
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Privacy Policy' }),
    ).toBeInTheDocument()
  })

  it('redirects away from an unknown slug without rendering the shell', () => {
    renderApp(<PolicyPage />, { route: '/legal/does-not-exist', path: '/legal/:slug' })
    expect(screen.queryByRole('main')).toBeNull()
  })
})
