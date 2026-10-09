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
  syncPrices: vi.fn(),
  setSignalStatus: vi.fn(),
  executeOrder: vi.fn(),
  setOrderStatus: vi.fn(),
  addWatchSymbol: vi.fn(),
  removeWatchSymbol: vi.fn(),
}))

const { useAuth } = await import('@/features/app/auth/authContext')
const {
  hasInvestAccess,
  loadInvestState,
  syncPrices,
  setSignalStatus,
  executeOrder,
  addWatchSymbol,
  removeWatchSymbol,
} = await import('@/features/invest/data/api')

function asAuth(status: AuthContextValue['status']): AuthContextValue {
  return {
    status,
    session:
      status === 'signed-in' ? ({ user: { id: 'u1', email: 'c@example.com' } } as never) : null,
    authorized: null,
    signInWithEmail: vi.fn().mockResolvedValue(undefined),
    verifyEmailCode: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    refreshAuthorization: vi.fn().mockResolvedValue(undefined),
  }
}

const STATE: InvestState = {
  accounts: [
    {
      id: 'acc1',
      name: 'Paper book',
      kind: 'paper',
      baseCurrency: 'CAD',
      cashBalance: 25000,
      status: 'active',
    },
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
      scope: { watchlist: true, symbols: [] },
      rules: [
        {
          type: 'signal' as const,
          metric: 'day_change_pct' as const,
          op: 'lt' as const,
          value: -5,
          severity: 'alert' as const,
          title: 'Dip',
        },
      ],
      notify: { inApp: true, email: false },
      cadence: 'daily',
      multiMatch: 'each',
      template: '',
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
      titleFr: null,
      bodyFr: null,
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
      strategyId: null,
      signalsEmitted: 1,
      proposalsCreated: 1,
      symbolsScanned: ['SHOP'],
      ruleHits: { Dip: 1 },
      durationMs: 1200,
      summary: '1 symbol(s) scanned',
      status: 'ok',
    },
  ],
  watchlist: [
    {
      id: 'w1',
      assetClass: 'crypto',
      symbol: 'BTC',
      name: 'Bitcoin',
      createdAt: '2026-01-19T00:00:00Z',
    },
  ],
  news: [
    {
      id: 1,
      symbol: 'SHOP',
      assetClass: 'equity',
      title: 'Shopify beats estimates',
      url: 'https://news.example/shop-beats',
      source: 'Example News',
      summary: '',
      publishedAt: '2026-01-20T09:00:00Z',
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
                <Route path="/invest/portfolios" element={ui} />
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
    expect(screen.getAllByText('Agent').length).toBeGreaterThan(0)
    // Market news renders on the overview, labelled as third-party content
    expect(screen.getByText('Market headlines (third-party)')).toBeInTheDocument()
    // The link's accessible name carries the sr-only exit note too
    expect(screen.getByRole('link', { name: /Shopify beats estimates/ })).toBeInTheDocument()
  })
})

describe('InvestHomePage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('re-syncs quotes and headlines when the refresh control is clicked', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-in'))
    vi.mocked(loadInvestState).mockResolvedValue(STATE)
    vi.mocked(syncPrices).mockResolvedValue({ symbols: 2, synced: 2, failed: [] })
    const { InvestHomePage } = await import('./InvestHomePage')
    const { InvestDataProvider } = await import('../data/InvestDataProvider')
    const { default: userEvent } = await import('@testing-library/user-event')
    renderPortal(
      <InvestDataProvider>
        <InvestHomePage />
      </InvestDataProvider>,
    )

    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Refresh prices' }))
    await vi.waitFor(() => {
      expect(syncPrices).toHaveBeenCalledTimes(1)
    })
    // Initial load plus the post-sync reload.
    expect(vi.mocked(loadInvestState).mock.calls.length).toBeGreaterThanOrEqual(2)
    expect(await screen.findByText(/Prices refreshed/)).toBeInTheDocument()
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

describe('InvestPortfolioPage watchlist', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders watchlist chips and adds/removes symbols', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-in'))
    vi.mocked(loadInvestState).mockResolvedValue(STATE)
    vi.mocked(addWatchSymbol).mockResolvedValue(undefined)
    vi.mocked(removeWatchSymbol).mockResolvedValue(undefined)
    const { InvestPortfolioPage } = await import('./InvestPortfolioPage')
    const { InvestDataProvider } = await import('../data/InvestDataProvider')
    const { default: userEvent } = await import('@testing-library/user-event')
    renderPortal(
      <InvestDataProvider>
        <InvestPortfolioPage />
      </InvestDataProvider>,
      '/invest/portfolios',
    )

    const user = userEvent.setup()
    expect(await screen.findByText('Watchlist')).toBeInTheDocument()
    expect(screen.getByText('BTC')).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText(/SHOP\.TO/i), 'msft')
    await user.click(screen.getByRole('button', { name: /^Watch$/i }))
    await vi.waitFor(() => {
      expect(addWatchSymbol).toHaveBeenCalledWith(
        expect.objectContaining({ assetClass: 'equity', symbol: 'msft' }),
      )
    })

    await user.click(screen.getByRole('button', { name: /Remove BTC/i }))
    await vi.waitFor(() => {
      expect(removeWatchSymbol).toHaveBeenCalledWith('w1')
    })
  })
})

describe('InvestStrategiesPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderPage = async (state: InvestState = STATE) => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-in'))
    vi.mocked(loadInvestState).mockResolvedValue(state)
    const { InvestStrategiesPage } = await import('./InvestStrategiesPage')
    const { InvestDataProvider } = await import('../data/InvestDataProvider')
    const { default: userEvent } = await import('@testing-library/user-event')
    renderPortal(
      <InvestDataProvider>
        <InvestStrategiesPage />
      </InvestDataProvider>,
      '/invest',
    )
    return userEvent.setup()
  }

  it('lists strategies and opens the wizard from New strategy', async () => {
    const user = await renderPage()

    /* List renders with the strategy card and its Enabled pill. */
    expect(await screen.findByText('Dip watcher')).toBeInTheDocument()
    expect(screen.getByText('Enabled')).toBeInTheDocument()

    /* New strategy opens the three-step wizard at Describe. */
    await user.click(screen.getByRole('button', { name: /New strategy/i }))
    expect(await screen.findByText('Describe your strategy')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Strategies' })).toBeInTheDocument()

    /* Cancel returns to the list. */
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(await screen.findByText('Dip watcher')).toBeInTheDocument()
  })

  it('opens the editor when a strategy card is clicked', async () => {
    const user = await renderPage()

    await user.click(await screen.findByText('Dip watcher'))
    expect(await screen.findByRole('heading', { name: 'Strategy' })).toBeInTheDocument()
    expect(screen.getByText('Strategy health')).toBeInTheDocument()
    expect(screen.getByText('Run history')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Discard' })).toBeDisabled()
  })
})
