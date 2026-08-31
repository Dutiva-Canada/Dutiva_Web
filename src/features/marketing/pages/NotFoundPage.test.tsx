import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'
import { NotFoundPage } from './NotFoundPage'

describe('NotFoundPage', () => {
  it('surfaces Help Centre and Contact support entry points', () => {
    renderApp(<NotFoundPage />, { route: '/nope', path: '*' })
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found.' })).toBeInTheDocument()
    const nav = within(screen.getByRole('navigation', { name: 'Suggested pages' }))
    expect(nav.getByRole('link', { name: 'Help Centre' })).toHaveAttribute('href', '/help')
    expect(nav.getByRole('link', { name: 'Contact support' })).toHaveAttribute('href', '/contact')
  })

  it('localizes the entry points to French', async () => {
    const user = userEvent.setup()
    renderApp(<NotFoundPage />, { route: '/nope', path: '*' })
    const [langToggle] = screen.getAllByRole('button', { name: /Toggle language/ })
    await user.click(langToggle as HTMLElement)
    const nav = within(screen.getByRole('navigation', { name: 'Pages suggérées' }))
    expect(nav.getByRole('link', { name: 'Centre d’aide' })).toHaveAttribute('href', '/fr/aide')
    expect(nav.getByRole('link', { name: 'Contacter le soutien' })).toHaveAttribute(
      'href',
      '/fr/contact',
    )
  })
})
