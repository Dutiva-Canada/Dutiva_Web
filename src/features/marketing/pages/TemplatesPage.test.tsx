import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'
import { allTemplates } from '@/features/app/documents/catalogue'
import { TemplatesPage } from './TemplatesPage'

describe('TemplatesPage', () => {
  it('renders the hero, every catalogue template, and the CTA in English', () => {
    renderApp(<TemplatesPage />, { route: '/templates', path: '/templates' })
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Canadian HR templates, ready to generate.',
      }),
    ).toBeInTheDocument()

    for (const tpl of allTemplates) {
      expect(screen.getByText(tpl.name.en)).toBeInTheDocument()
    }

    expect(
      within(screen.getByRole('main')).getByRole('link', { name: /Start free/ }),
    ).toHaveAttribute('href', '/app/welcome')
  })

  it('re-localizes template copy to French via the header language toggle', async () => {
    const user = userEvent.setup()
    renderApp(<TemplatesPage />, { route: '/templates', path: '/templates' })
    const [langToggle] = screen.getAllByRole('button', { name: /Toggle language/ })
    await user.click(langToggle as HTMLElement)

    const firstTemplate = allTemplates[0]
    expect(firstTemplate).toBeDefined()
    expect(screen.getByText(firstTemplate!.name.fr)).toBeInTheDocument()
  })
})
