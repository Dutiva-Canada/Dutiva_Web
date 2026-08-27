import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'
import { allTemplates } from '@/features/app/documents/catalogue'
import { FEATURED_TEMPLATE_TIDS } from '@/features/marketing/demos/templatePreviewModel'
import { TemplatesPage } from './TemplatesPage'

describe('TemplatesPage', () => {
  it('renders sample outputs, the hero, every catalogue template, and the CTA in English', () => {
    renderApp(<TemplatesPage />, { route: '/templates', path: '/templates' })
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Canadian HR templates, ready to generate.',
      }),
    ).toBeInTheDocument()

    expect(screen.getByRole('heading', { level: 2, name: 'Sample outputs' })).toBeInTheDocument()
    for (const tid of FEATURED_TEMPLATE_TIDS) {
      const tpl = allTemplates.find((candidate) => candidate.tid === tid)
      expect(tpl).toBeDefined()
      expect(screen.getAllByText(tpl!.name.en).length).toBeGreaterThanOrEqual(1)
    }

    for (const tpl of allTemplates) {
      expect(screen.getAllByText(tpl.name.en).length).toBeGreaterThanOrEqual(1)
    }

    expect(
      within(screen.getByRole('main')).getByRole('link', { name: /See plans/ }),
    ).toHaveAttribute('href', '/pricing')
  })

  it('re-localizes template copy to French via the header language toggle', async () => {
    const user = userEvent.setup()
    renderApp(<TemplatesPage />, { route: '/templates', path: '/templates' })
    const [langToggle] = screen.getAllByRole('button', { name: /Toggle language/ })
    await user.click(langToggle as HTMLElement)

    const firstTemplate = allTemplates[0]
    expect(firstTemplate).toBeDefined()
    expect(screen.getAllByText(firstTemplate!.name.fr).length).toBeGreaterThanOrEqual(1)
  })
})
