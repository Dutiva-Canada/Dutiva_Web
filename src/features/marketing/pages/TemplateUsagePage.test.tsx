import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'
import { TemplateUsagePage } from './TemplateUsagePage'

describe('TemplateUsagePage', () => {
  it('renders hero, sections, steps, and CTA in English', () => {
    renderApp(<TemplateUsagePage />, {
      route: '/guides/template-usage',
      path: '/guides/template-usage',
    })
    expect(
      screen.getByRole('heading', { level: 1, name: 'How to use Dutiva templates.' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'How generation works' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Template categories' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Best practices' })).toBeInTheDocument()
    const main = screen.getByRole('main')
    expect(within(main).getByText('Pick a template')).toBeInTheDocument()
    // Header carries its own CTA links — scope the CTA check to <main>.
    expect(within(main).getByRole('link', { name: /See plans/ })).toHaveAttribute(
      'href',
      '/pricing',
    )
  })

  it('re-localizes to French via the header language toggle', async () => {
    const user = userEvent.setup()
    renderApp(<TemplateUsagePage />, {
      route: '/guides/template-usage',
      path: '/guides/template-usage',
    })
    const [langToggle] = screen.getAllByRole('button', { name: /Toggle language/ })
    expect(langToggle).toBeDefined()
    await user.click(langToggle as HTMLElement)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Comment utiliser les modèles Dutiva.' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Comment fonctionne la génération' }),
    ).toBeInTheDocument()
  })
})
