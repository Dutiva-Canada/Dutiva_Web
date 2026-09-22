import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { ThemeProvider } from '@/lib/theme'

vi.mock('@/features/app/auth/authContext', () => ({
  useAuth: () => ({
    status: 'signed-in',
    signOut: vi.fn(),
  }),
}))

describe('PortalLayout (signed in)', () => {
  it('keeps mobile navigation collapsed until opened', async () => {
    const { PortalLayout } = await import('./PortalLayout')

    const { container } = render(
      <ThemeProvider>
        <LangProvider>
          <MemoryRouter initialEntries={['/careers/portal/settings']}>
            <Routes>
              <Route path="/careers/portal/*" element={<PortalLayout />}>
                <Route path="settings" element={<div>Settings page</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </LangProvider>
      </ThemeProvider>,
    )

    const menu = screen.getByRole('button', { name: /Open navigation/i })
    expect(container.querySelector('#candidate-portal-mobile-nav')).not.toBeInTheDocument()

    await (await import('@testing-library/user-event')).userEvent.setup().click(menu)

    const mobileNav = container.querySelector('#candidate-portal-mobile-nav')
    expect(mobileNav).toBeInTheDocument()
    expect(within(mobileNav as HTMLElement).getByRole('link', { name: 'Settings' })).toBeInTheDocument()
    expect(within(mobileNav as HTMLElement).getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
  })
})
