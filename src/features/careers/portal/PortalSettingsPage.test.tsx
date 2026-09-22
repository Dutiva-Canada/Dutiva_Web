import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { ThemeProvider } from '@/lib/theme'
import { AuthProvider } from '@/features/app/auth/AuthProvider'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'

vi.mock('@/features/careers/data/candidateApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/careers/data/candidateApi')>()),
  deleteMyCandidateProfile: vi.fn(),
}))

const { deleteMyCandidateProfile } = await import('@/features/careers/data/candidateApi')

function renderPage() {
  return render(
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <ToastsProvider>
            <MemoryRouter initialEntries={['/careers/portal/settings']}>
              <Routes>
                <Route path="/careers/portal/settings" element={<Page />} />
                <Route path="/careers/portal" element={<div data-testid="portal-home" />} />
              </Routes>
            </MemoryRouter>
          </ToastsProvider>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>,
  )
}

import { PortalSettingsPage as Page } from './PortalSettingsPage'

describe('PortalSettingsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders language, theme, account and the delete-your-data section', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: /Settings/i })).toBeInTheDocument()
    /* Language + theme segmented controls */
    expect(screen.getByRole('tab', { name: 'English' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Français' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Light/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Dark/i })).toBeInTheDocument()
    /* Account + danger zone */
    expect(screen.getByRole('button', { name: /Sign out/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Delete my data|Delete/i })).toBeInTheDocument()
  })

  it('switches the UI to French in place', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('tab', { name: 'Français' }))
    expect(await screen.findByRole('heading', { name: /Paramètres/i })).toBeInTheDocument()
  })

  /* The delete-your-data flow relocated here from the profile editor. */
  it('deletes the profile after confirmation', async () => {
    vi.mocked(deleteMyCandidateProfile).mockResolvedValue(undefined)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /Delete my data|Delete/i }))

    await vi.waitFor(() => {
      expect(deleteMyCandidateProfile).toHaveBeenCalledTimes(1)
    })
  })

  it('does not delete without confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /Delete my data|Delete/i }))

    expect(deleteMyCandidateProfile).not.toHaveBeenCalled()
  })
})
