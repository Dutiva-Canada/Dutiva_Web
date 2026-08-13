import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'
import { HelpCenterPage } from './HelpCenterPage'

describe('HelpCenterPage', () => {
  it('renders the hero, search box, and browse-by-topic categories', () => {
    renderApp(<HelpCenterPage />, { route: '/help', path: '/help' })
    expect(screen.getByRole('heading', { level: 1, name: 'How can we help?' })).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: /Search the Help Centre/ })).toBeInTheDocument()
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('heading', { level: 3, name: 'Getting started' })).toBeInTheDocument()
    expect(main.getByRole('heading', { level: 3, name: 'AI Advisor' })).toBeInTheDocument()
    // A known article link is present in the browse view.
    expect(main.getByRole('link', { name: /Signing in with a magic link/ })).toBeInTheDocument()
  })

  it('filters to matching articles as the visitor searches', async () => {
    const user = userEvent.setup()
    renderApp(<HelpCenterPage />, { route: '/help', path: '/help' })
    await user.type(screen.getByRole('searchbox'), 'magic link')
    expect(screen.getByText(/Results for/)).toBeInTheDocument()
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('link', { name: /Signing in with a magic link/ })).toBeInTheDocument()
    // An unrelated article drops out of the filtered list.
    expect(main.queryByRole('link', { name: /Managing your plan and invoices/ })).toBeNull()
  })

  it('shows a no-results state for an unmatched query', async () => {
    const user = userEvent.setup()
    renderApp(<HelpCenterPage />, { route: '/help', path: '/help' })
    await user.type(screen.getByRole('searchbox'), 'zzzzzznope')
    expect(screen.getByText('No matching articles')).toBeInTheDocument()
  })

  it('clears the query with the clear button', async () => {
    const user = userEvent.setup()
    renderApp(<HelpCenterPage />, { route: '/help', path: '/help' })
    const box = screen.getByRole('searchbox')
    await user.type(box, 'billing')
    expect(screen.getByText(/Results for/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(screen.queryByText(/Results for/)).toBeNull()
    expect(box).toHaveValue('')
  })

  it('re-localizes to French via the header language toggle', async () => {
    const user = userEvent.setup()
    renderApp(<HelpCenterPage />, { route: '/help', path: '/help' })
    const [langToggle] = screen.getAllByRole('button', { name: /Toggle language/ })
    await user.click(langToggle as HTMLElement)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Comment pouvons-nous vous aider ?' }),
    ).toBeInTheDocument()
  })
})
