import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { ThemeProvider } from '@/lib/theme'
import { AuthProvider } from '@/features/app/auth/AuthProvider'
import type { AuthContextValue } from '@/features/app/auth/authContext'
import { InvestDataContext, EMPTY_INVEST_STATE } from '@/features/invest/data/InvestDataContext'
import type { InvestState } from '@/features/invest/data/api'

vi.mock('@/features/app/auth/authContext', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/features/app/auth/authContext')>()
  return { ...mod, useAuth: vi.fn() }
})

const { useAuth } = await import('@/features/app/auth/authContext')

const auth: AuthContextValue = {
  status: 'signed-in',
  session: { user: { id: 'u1', email: 'c@example.com' } } as never,
  authorized: null,
  signInWithEmail: vi.fn(),
  verifyEmailCode: vi.fn(),
  signOut: vi.fn().mockResolvedValue(undefined),
  refreshAuthorization: vi.fn(),
}

const STATE: InvestState = {
  ...EMPTY_INVEST_STATE,
  strategies: [
    {
      id: 'st1',
      name: 'Dip watcher',
      enabled: true,
      cadence: 'monthly',
      notify: { inApp: true, email: false },
      lastEvaluatedAt: '2026-10-09T11:00:00Z',
    },
    {
      id: 'st2',
      name: 'Paused scanner',
      enabled: false,
      cadence: 'daily',
      notify: { inApp: true, email: true },
      lastEvaluatedAt: null,
    },
  ] as never,
}

function renderSettings(ui: ReactElement, state: InvestState = STATE) {
  return render(
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <MemoryRouter>
            <InvestDataContext value={{ state, loading: false, refresh: vi.fn() }}>
              {ui}
            </InvestDataContext>
          </MemoryRouter>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>,
  )
}

describe('InvestSettingsPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('renders every section with the account view', async () => {
    vi.mocked(useAuth).mockReturnValue(auth)
    const { InvestSettingsPage } = await import('./InvestSettingsPage')
    renderSettings(<InvestSettingsPage />)
    for (const h of [
      'Language',
      'Appearance',
      'Start page',
      'Display currency',
      'Delivery per strategy',
      'Defaults',
      'Notifications',
      'Getting-started tour',
      'My data',
      'Account',
    ]) {
      expect(screen.getByRole('heading', { name: h })).toBeInTheDocument()
    }
    expect(screen.getByText('c@example.com')).toBeInTheDocument()
    expect(screen.getByText('Passwordless email code')).toBeInTheDocument()
  })

  it('writes the appearance, start-page, currency, and default-mode prefs', async () => {
    vi.mocked(useAuth).mockReturnValue(auth)
    const { InvestSettingsPage } = await import('./InvestSettingsPage')
    const user = userEvent.setup()
    renderSettings(<InvestSettingsPage />)

    await user.click(screen.getByRole('button', { name: 'Light' }))
    expect(localStorage.getItem('dutiva-theme')).toBe('light')

    await user.selectOptions(screen.getByLabelText('Start page'), '/invest/signals')
    expect(localStorage.getItem('dutiva.invest.homeTab')).toBe('/invest/signals')

    await user.selectOptions(screen.getByLabelText('Display currency'), 'USD')
    expect(localStorage.getItem('dutiva.invest.displayCurrency')).toBe('USD')

    await user.selectOptions(screen.getByLabelText('New orders default to'), 'live')
    expect(localStorage.getItem('dutiva.invest.orderMode')).toBe('live')

    await user.selectOptions(screen.getByLabelText('Unread badge counts'), 'signals')
    expect(localStorage.getItem('dutiva.invest.badgeScope')).toBe('signals')
  })

  it('names each strategy edit link for screen readers and dims a disabled row', async () => {
    vi.mocked(useAuth).mockReturnValue(auth)
    const { InvestSettingsPage } = await import('./InvestSettingsPage')
    renderSettings(<InvestSettingsPage />)
    expect(
      screen.getByRole('link', { name: 'Edit Dip watcher delivery' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Edit Paused scanner delivery' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Disabled')).toBeInTheDocument()
  })

  it('gates the Tally history wipe behind a confirm step', async () => {
    vi.mocked(useAuth).mockReturnValue(auth)
    const { InvestSettingsPage } = await import('./InvestSettingsPage')
    const user = userEvent.setup()
    renderSettings(<InvestSettingsPage />)

    expect(screen.queryByText('Delete permanently')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear Tally history' }))
    expect(screen.getByText(/cannot be undone/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByText('Delete permanently')).not.toBeInTheDocument()
  })

  it('gates the full data wipe behind typing DELETE', async () => {
    vi.mocked(useAuth).mockReturnValue(auth)
    const { InvestSettingsPage } = await import('./InvestSettingsPage')
    const user = userEvent.setup()
    renderSettings(<InvestSettingsPage />)

    const wipe = screen.getByRole('button', { name: 'Delete all Invest data' })
    expect(wipe).toBeDisabled()
    await user.type(screen.getByLabelText('Type DELETE to confirm'), 'DELETE')
    expect(wipe).toBeEnabled()
  })

  it('offers immediate, daily, and weekly email cadences', async () => {
    vi.mocked(useAuth).mockReturnValue(auth)
    const { InvestSettingsPage } = await import('./InvestSettingsPage')
    renderSettings(<InvestSettingsPage />)

    const select = screen.getByLabelText('Email alerts')
    const labels = Array.from((select as HTMLSelectElement).options).map((o) => o.textContent)
    expect(labels).toEqual(['Immediate', 'Daily digest', 'Weekly digest'])
  })
})
