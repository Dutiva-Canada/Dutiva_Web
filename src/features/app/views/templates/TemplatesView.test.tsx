import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { renderApp } from '@/test/renderApp'
import { ThemeProvider } from '@/lib/theme'
import { LangProvider } from '@/i18n/LangProvider'
import { AppProviders } from '@/features/app/AppProviders'
import { DocStudioOverlay } from '@/features/app/docstudio/DocStudioOverlay'
import { documentTemplates } from '@/data'
import { TemplatesView } from './TemplatesView'

describe('TemplatesView', () => {
  it('renders one gallery tile per fixture template with title and category', () => {
    renderApp(<TemplatesView />, {
      route: '/app/documents/hr-library',
      path: '/app/documents/hr-library',
    })

    expect(
      screen.getByRole('heading', { level: 1, name: 'Document templates' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(documentTemplates.length)
    expect(screen.getByText('Termination Letter')).toBeInTheDocument()
    /* Category sub-lines — three Offboarding templates in the fixtures. */
    expect(screen.getAllByText('Offboarding')).toHaveLength(3)
  })

  it('opens the Document Studio overlay when a tile is clicked', () => {
    renderApp(
      <>
        <TemplatesView />
        <DocStudioOverlay />
      </>,
      { route: '/app/documents/hr-library', path: '/app/documents/hr-library' },
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Offboarding Checklist/ }))

    const dialog = screen.getByRole('dialog', { name: 'Document Studio' })
    /* Library open — no generation shimmer, sections render immediately. */
    expect(
      within(dialog).getByText('Offboarding Checklist — Jordan Mensah, last day July 19, 2026'),
    ).toBeInTheDocument()
  })

  it('honours TemplatesSearchNavState { docKey } by opening that template on mount', () => {
    render(
      <ThemeProvider>
        <LangProvider>
          <MemoryRouter
            initialEntries={[
              { pathname: '/app/documents/hr-library', state: { docKey: 'Offer Letter' } },
            ]}
          >
            <AppProviders>
              <Routes>
                <Route
                  path="/app/documents/hr-library"
                  element={
                    <>
                      <TemplatesView />
                      <DocStudioOverlay />
                    </>
                  }
                />
              </Routes>
            </AppProviders>
          </MemoryRouter>
        </LangProvider>
      </ThemeProvider>,
    )

    const dialog = screen.getByRole('dialog', { name: 'Document Studio' })
    expect(within(dialog).getByText('Offer of Employment — Senior Analyst')).toBeInTheDocument()
  })
})
