import { describe, expect, it, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'
import { HelpArticlePage } from './HelpArticlePage'

describe('HelpArticlePage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders an article with a back link, feedback widget, and related links', () => {
    renderApp(<HelpArticlePage />, { route: '/help/signing-in', path: '/help/:slug' })
    const main = within(screen.getByRole('main'))
    expect(
      main.getByRole('heading', { level: 1, name: 'Signing in with a magic link' }),
    ).toBeInTheDocument()
    expect(main.getByRole('link', { name: /Back to Help Centre/ })).toBeInTheDocument()
    expect(main.getByText('Was this article helpful?')).toBeInTheDocument()
    // Same-category article surfaces under "More in this topic".
    expect(
      main.getByRole('link', { name: /Switching between English and French/ }),
    ).toBeInTheDocument()
  })

  it('renders the article body as accessible content', () => {
    renderApp(<HelpArticlePage />, { route: '/help/how-support-works', path: '/help/:slug' })
    const main = within(screen.getByRole('main'))
    expect(
      main.getByRole('heading', { level: 1, name: 'How Dutiva support works' }),
    ).toBeInTheDocument()
    expect(
      main.getByRole('heading', { level: 2, name: 'When to expect a reply' }),
    ).toBeInTheDocument()
  })

  it('re-localizes the article to French via the language toggle', async () => {
    const user = userEvent.setup()
    renderApp(<HelpArticlePage />, { route: '/help/signing-in', path: '/help/:slug' })
    const [langToggle] = screen.getAllByRole('button', { name: /Toggle language/ })
    await user.click(langToggle as HTMLElement)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Se connecter avec un lien magique' }),
    ).toBeInTheDocument()
  })
})
