import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { ThemeProvider } from '@/lib/theme'
import { AuthProvider } from '@/features/app/auth/AuthProvider'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import type { AuthContextValue } from '@/features/app/auth/authContext'
import type { InvestState } from '@/features/invest/data/api'

/* useAuth is mocked per-test to drive the signed-out / no-access / granted
   gates; the real AuthContext stays so AuthProvider still mounts. */
vi.mock('@/features/app/auth/authContext', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/features/app/auth/authContext')>()
  return { ...mod, useAuth: vi.fn() }
})

vi.mock('@/features/invest/data/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/invest/data/api')>()),
  hasInvestAccess: vi.fn(),
  loadInvestState: vi.fn(),
  setSignalStatus: vi.fn(),
  executeOrder: vi.fn(),
  setOrderStatus: vi.fn(),
}))

const { useAuth } = await import('@/features/app/auth/authContext')
const { hasInvestAccess, loadInvestState, setSignalStatus, executeOrder } =
  await import('@/features/invest/data/api')

function asAuth(status: AuthContextValue['status']): AuthContextValue {
  return {
    status,
    session:
      status === 'signed-in'
        ? ({ user: { id: 'u1', email: 'c@example.com' } } as never)
        : null,
    authorized: null,
    signInWithEmail: vi.fn().mockResolvedValue(undefined),
    verifyEmailCode: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    refreshAuthorization: vi.fn().mockResolvedValue(undefined),
  }
}

const STATE: InvestState = {
  accounts: [
    { id: 'acc1', name: 'Paper book', kind: 'paper', baseCurrency: 'CAD', cashBalance: 25000, status: 'active' },
  ],
  positions: [
    {
      id: 'p1',
      accountId: 'acc1',
      assetClass: 'equity',
      symbol: 'SHOP',
      name: 'Shopify',
      quantity: 10,
      avgCost: 100,
      currency: 'CAD',
      lastPrice: 120,
      lastPriceAt: '2026-01-20T00:00:00Z',
    },
  ],
  snapshots: [
    {
      assetClass: 'equity',
      symbol: 'SHOP',
      price: 120,
      dayChangePct: -6,
      ma50: 130,
      currency: 'CAD',
      source: 'manual',
      asOf: '2026-01-20T00:00:00Z',
    },
  ],
  strategies: [
    {
      id: 's1',
      name: 'Dip watcher',
      enabled: true,
      assetClasses: ['equity'],
      rules: [{ metric: 'day_change_pct', op: 'lt', value: -5, kind: 'alert', title: 'Dip', side: 'buy', qty: 5 }],
      autonomy: 'suggest',
    },
  ],
  signals: [
    {
      id: 'sig1',
      strategyId: 's1',
      assetClass: 'equity',
      symbol: 'SHOP',
      name: 'Shopify',
      kind: 'alert',
      title: 'SHOP dropped below threshold',
      body: 'Day change -6% < -5%',
      score: 72,
      status: 'new',
      createdAt: '2026-01-20T12:00:00Z',
    },
  ],
  orders: [
    {
      id: 'o1',
      accountId: 'acc1',
      signalId: 'sig1',
      assetClass: 'equity',
      symbol: 'SHOP',
      name: 'Shopify',
      side: 'buy',
      quantity: 5,
      orderType: 'market',
      limitPrice: null,
      mode: 'paper',
      status: 'queued',
      requestedPrice: 120,
      executedPrice: null,
      executedAt: null,
      note: null,
      error: null,
      createdAt: '2026-01-20T12:00:00Z',
    },
  ],
  runs: [
    {
      id: 'r1',
      ranAt: '2026-01-20T07:45:00Z',
      signalsEmitted: 1,
      ordersSuggested: 1,
      ordersExecuted: 0,
      summary: '1 snapshot(s) evaluated',
      status: 'ok',
    },
  ],
}

function renderPortal(ui: ReactElement, route = '/invest') {
  return render(
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <ToastsProvider>
            <MemoryRouter initialEntries={[route]}>
              <Routes>
                <Route path="/invest" element={ui} />
                <Route path="/invest/signals" element={ui} />
                <Route path="/invest/orders" element={ui} />
              </Routes>
            </MemoryRouter>
          </ToastsProvider>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>,
  )
}

describe('InvestPortalLayout', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows the sign-in panel when signed out', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-out'))
    const { InvestPortalLayout } = await import('./InvestPortalLayout')
    renderPortal(<InvestPortalLayout />)

    expect(await screen.findByText('Sign in to Dutiva Invest')).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
  })

  it('shows the access-required card for a signed-in user without a grant', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-in'))
    vi.mocked(hasInvestAccess).mockResolvedValue(false)
    const { InvestPortalLayout } = await import('./InvestPortalLayout')
    renderPortal(<InvestPortalLayout />)

    expect(await screen.findByText('Access required')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Request access/i })).toBeInTheDocument()
  })

  it('renders the nav and overview when access is granted', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-in'))
    vi.mocked(hasInvestAccess).mockResolvedValue(true)
    vi.mocked(loadInvestState).mockResolvedValue(STATE)
    const { InvestPortalLayout } = await import('./InvestPortalLayout')
    const { InvestHomePage } = await import('./InvestHomePage')
    render(
      <ThemeProvider>
        <LangProvider>
          <AuthProvider>
            <ToastsProvider>
              <MemoryRouter initialEntries={['/invest']}>
                <Routes>
                  <Route path="/invest" element={<InvestPortalLayout />}>
                    <Route index element={<InvestHomePage />} />
                  </Route>
                </Routes>
              </MemoryRouter>
            </ToastsProvider>
          </AuthProvider>
        </LangProvider>
      </ThemeProvider>,
    )

    expect(await screen.findByText('Portfolio value')).toBeInTheDocument()
    expect(screen.getByText('Open signals')).toBeInTheDocument()
    // Nav labels render
    expect(screen.getAllByText('Signals').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Bot').length).toBeGreaterThan(0)
  })
})

describe('InvestSignalsPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders signals and dismisses one on click', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-in'))
    vi.mocked(loadInvestState).mockResolvedValue(STATE)
    vi.mocked(setSignalStatus).mockResolvedValue(undefined)
    const { InvestSignalsPage } = await import('./InvestSignalsPage')
    const { InvestDataProvider } = await import('../data/InvestDataProvider')
    renderPortal(
      <InvestDataProvider>
        <InvestSignalsPage />
      </InvestDataProvider>,
      '/invest/signals',
    )

    expect(await screen.findByText('SHOP dropped below threshold')).toBeInTheDocument()
    const { default: userEvent } = await import('@testing-library/user-event')
    await userEvent.setup().click(screen.getByRole('button', { name: /Dismiss/i }))
    await vi.waitFor(() => {
      expect(setSignalStatus).toHaveBeenCalledWith('sig1', 'dismissed')
    })
  })
})

describe('InvestOrdersPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the order log and executes a paper order at the snapshot price', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-in'))
    vi.mocked(loadInvestState).mockResolvedValue(STATE)
    vi.mocked(executeOrder).mockResolvedValue(undefined)
    const { InvestOrdersPage } = await import('./InvestOrdersPage')
    const { InvestDataProvider } = await import('../data/InvestDataProvider')
    renderPortal(
      <InvestDataProvider>
        <InvestOrdersPage />
      </InvestDataProvider>,
      '/invest/orders',
    )

    expect(await screen.findByText('SHOP')).toBeInTheDocument()
    expect(screen.getByText('Queued')).toBeInTheDocument()
    const { default: userEvent } = await import('@testing-library/user-event')
    await userEvent.setup().click(screen.getByRole('button', { name: /Mark executed/i }))
    await vi.waitFor(() => {
      expect(executeOrder).toHaveBeenCalledWith('o1', undefined)
    })
  })
})
