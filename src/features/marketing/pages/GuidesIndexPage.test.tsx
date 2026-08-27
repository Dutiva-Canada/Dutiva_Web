import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'
import { GUIDE_ARTICLES, articlePath } from '../articles'
import { GuidesIndexPage } from './GuidesIndexPage'

/** Guide titles contain regex metacharacters (parentheses, ?) — escape before
    building the accessible-name matcher. */
const escapeRe = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

describe('GuidesIndexPage', () => {
  it('renders the hero, a linked card per guide, and the CTA in English', () => {
    renderApp(<GuidesIndexPage />, { route: '/guides', path: '/guides' })
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Guidance for the documents you have to get right.',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/legal counsel should always be your first port of call/),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'All guides' })).toBeInTheDocument()

    const main = within(screen.getByRole('main'))
    for (const guide of GUIDE_ARTICLES) {
      expect(main.getByRole('heading', { level: 3, name: guide.title.en })).toBeInTheDocument()
      expect(
        main.getByRole('link', { name: new RegExp(escapeRe(guide.title.en)) }),
      ).toHaveAttribute('href', articlePath(guide, 'en'))
    }

    expect(main.getByRole('link', { name: /See plans/ })).toHaveAttribute('href', '/pricing')
  })

  it('still links the template-usage how-to, which is not part of the collection', () => {
    renderApp(<GuidesIndexPage />, { route: '/guides', path: '/guides' })
    expect(
      within(screen.getByRole('main')).getByRole('link', {
        name: /How to use Dutiva templates/,
      }),
    ).toHaveAttribute('href', '/guides/template-usage')
  })

  it('points a reader who needs the underlying rules at /blog', () => {
    /* The other half of the editorial split (articleModel.ts): /guides is the
       document being written, /blog is which regime governs the writer. */
    renderApp(<GuidesIndexPage />, { route: '/guides', path: '/guides' })
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: /Read the blog/ }),
    ).toHaveAttribute('href', '/blog')
  })

  it('re-localizes to French via the header language toggle', async () => {
    const user = userEvent.setup()
    renderApp(<GuidesIndexPage />, { route: '/guides', path: '/guides' })
    const [langToggle] = screen.getAllByRole('button', { name: /Toggle language/ })
    await user.click(langToggle as HTMLElement)
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Des repères pour les documents que vous devez réussir.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Tous les guides' })).toBeInTheDocument()
  })
})
