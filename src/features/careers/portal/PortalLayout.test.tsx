import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { ThemeProvider } from '@/lib/theme'
import { AuthProvider } from '@/features/app/auth/AuthProvider'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'

function renderPortal(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <ToastsProvider>
            <MemoryRouter initialEntries={['/careers/portal']}>
              <Routes>
                <Route path="/careers/portal" element={ui} />
              </Routes>
            </MemoryRouter>
          </ToastsProvider>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>,
  )
}

describe('PortalLayout (signed out)', () => {
  it('wraps the auth gate in surface-app so theme tokens resolve', async () => {
    const { PortalLayout } = await import('./PortalLayout')
    const { container } = renderPortal(<PortalLayout />)

    // Without .surface-app the --bg/--text/--navy ramp is unset: bg-navy
    // buttons render transparent with white text (invisible primary CTA).
    expect(container.querySelector('.surface-app')).not.toBeNull()
    expect(await screen.findByRole('heading', { name: /Welcome back/i })).toBeInTheDocument()
  })

  it('renders chrome: wordmark to the board, language toggle, browse link', async () => {
    const { PortalLayout } = await import('./PortalLayout')
    renderPortal(<PortalLayout />)

    await screen.findByRole('heading', { name: /Welcome back/i })

    // Wordmark + explicit link both return to the localized job board
    const boardLinks = screen.getAllByRole('link', { name: /Dutiva|Browse jobs/i })
    expect(boardLinks.some((l) => l.getAttribute('href') === '/careers')).toBe(true)
    expect(screen.getByRole('button', { name: /Toggle language/i })).toBeInTheDocument()
  })

  it('explains the passwordless flow and toggles language in place', async () => {
    const { userEvent } = await import('@testing-library/user-event')
    const { PortalLayout } = await import('./PortalLayout')
    const user = userEvent.setup()
    renderPortal(<PortalLayout />)

    expect(await screen.findByText(/6-digit sign-in code/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Toggle language/i }))
    expect(await screen.findByRole('heading', { name: /Bon retour/i })).toBeInTheDocument()
    expect(screen.getByText(/aucun mot de passe requis/i)).toBeInTheDocument()
  })
})
