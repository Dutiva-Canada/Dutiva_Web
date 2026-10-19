import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { ThemeProvider } from '@/lib/theme'
import { AuthProvider } from '@/features/app/auth/AuthProvider'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import type { AuthContextValue } from '@/features/app/auth/authContext'
import type { InvestState } from '@/features/invest/data/api'
import type { FxTable } from '@/features/invest/data/fx'
import { EMPTY_SWOT } from '@/features/invest/data/types'

/* useAuth is mocked per-test to drive the signed-out / no-access / granted
   gates; the real AuthContext stays so AuthProvider still mounts. */
vi.mock('@/features/app/auth/authContext', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/features/app/auth/authContext')>()
  return { ...mod, useAuth: vi.fn() }
})

/* FX rates are network-bound — the conversion math stays real, the feed
   is mocked per-test so 'no rate on file' is the default. */
vi.mock('@/features/invest/data/fx', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/invest/data/fx')>()),
  loadFxRates: vi.fn(),
}))

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
  muteNewsSource: vi.fn(),
  unmuteNewsSource: vi.fn(),
  createAccount: vi.fn(),
  updateAccount: vi.fn(),
  deleteAccount: vi.fn(),
  createPosition: vi.fn(),
  updatePosition: vi.fn(),
  deletePosition: vi.fn(),
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
  muteNewsSource,
  unmuteNewsSource,
  createAccount,
  updateAccount,
  deleteAccount,
  createPosition,
  updatePosition,
  deletePosition,
} = await import('@/features/invest/data/api')
const { loadFxRates } = await import('@/features/invest/data/fx')

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
      targetWeightPct: null,
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
      quoteName: '',
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
      ruleId: null,
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
      inFeed: true,
      createdAt: '2026-01-20T12:00:00Z',
    },
  ],
  orders: [
    {
      id: 'o1',
      accountId: 'acc1',
      signalId: 'sig1',
      ruleId: null,
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
  theses: [],
  goals: [],
  scanItems: [],
  memories: [],
  bookSnapshots: [],
  benchmarkMarks: [],
  newsMutes: [],
  cashEvents: [],
  fills: [],
  stressScenarios: [],
  recurring: [],
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
      viaTheme: null,
      kind: null,
    },
    {
      id: 2,
      symbol: 'AMAT',
      assetClass: 'equity',
      title: 'US widens chip-equipment export rules',
      url: 'https://news.example/export-rules',
      source: 'Wire',
      summary: '',
      publishedAt: '2026-01-20T08:00:00Z',
      viaTheme: 'US-China trade restrictions',
      kind: null,
    },
  ],
}

/* 'No rate on file' is the default — every page that touches FX must
   render deterministically; conversion specs opt in with FX_TABLE. */
vi.mocked(loadFxRates).mockResolvedValue(null)

const FX_TABLE = { date: '2026-10-12', rates: { CAD: 1, USD: 0.73 } }

/* A CAD book holding a USD-quoted symbol — the case the conversion
   exists for. $100 USD ÷ 0.73 ≈ $136.99 CAD. */
const USD_QUOTED: InvestState = {
  ...STATE,
  positions: [
    {
      id: 'p9',
      accountId: 'acc1',
      assetClass: 'equity',
      symbol: 'AMD',
      name: 'Advanced Micro',
      quantity: 10,
      avgCost: 100,
      currency: 'CAD',
      lastPrice: null,
      lastPriceAt: null,
      targetWeightPct: null,
    },
  ],
  snapshots: [
    {
      assetClass: 'equity',
      symbol: 'AMD',
      price: 100,
      dayChangePct: null,
      ma50: null,
      currency: 'USD',
      source: 'yahoo',
      asOf: '2026-10-12T00:00:00Z',
      quoteName: '',
    },
  ],
}

/* A second account turns the Account column on — the per-row ownership
   label only earns its width once rows can actually differ. */
const TWO_ACCOUNTS: InvestState = {
  ...STATE,
  accounts: [
    ...STATE.accounts,
    {
      id: 'acc2',
      name: 'Wealthsimple',
      kind: 'live',
      baseCurrency: 'USD',
      cashBalance: 0.14,
      status: 'active',
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
                <Route path="/invest/portfolio" element={ui} />
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
    // Market news renders on the overview
    expect(screen.getByText('Market headlines')).toBeInTheDocument()
    // The link's accessible name carries the sr-only exit note too
    expect(screen.getByRole('link', { name: /Shopify beats estimates/ })).toBeInTheDocument()
    // A theme-sourced headline marks its provenance — it reached AMAT
    // via a watched theme, not by naming the holding
    expect(screen.getByText('via US-China trade restrictions')).toBeInTheDocument()
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

  it('sums a mixed-currency book through the ECB rate and marks it ≈', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-in'))
    vi.mocked(loadInvestState).mockResolvedValue(USD_QUOTED)
    vi.mocked(loadFxRates).mockResolvedValue(FX_TABLE)
    const { InvestHomePage } = await import('./InvestHomePage')
    const { InvestDataProvider } = await import('../data/InvestDataProvider')
    renderPortal(
      <InvestDataProvider>
        <InvestHomePage />
      </InvestDataProvider>,
    )
    /* AMD: 10 × ($100 USD → ≈$136.99 CAD) = $1,369.86 + $25,000 cash —
       the headline sums the converted figure, marked and disclosed. */
    expect(await screen.findByText(/\$26,369\.86/)).toBeInTheDocument()
    expect(screen.getByText(/USD→CAD 1\.3699/)).toBeInTheDocument()
  })

  it('scopes "Your book" to held and watched symbols, not scan-board links', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-in'))
    vi.mocked(loadInvestState).mockResolvedValue(STATE)
    const { InvestHomePage } = await import('./InvestHomePage')
    const { InvestDataProvider } = await import('../data/InvestDataProvider')
    const { default: userEvent } = await import('@testing-library/user-event')
    renderPortal(
      <InvestDataProvider>
        <InvestHomePage />
      </InvestDataProvider>,
    )
    /* 'All' shows both rows — including the AMAT headline that arrived
       via a watched theme, tagged to a board link the book doesn't hold. */
    expect(await screen.findByText('Shopify beats estimates')).toBeInTheDocument()
    expect(screen.getByText('US widens chip-equipment export rules')).toBeInTheDocument()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Your book' }))
    /* SHOP is held → stays. AMAT is only a scan-board linkage (neither
       held nor watched here) → 'Your book' can't claim it. */
    expect(screen.getByText('Shopify beats estimates')).toBeInTheDocument()
    expect(screen.queryByText('US widens chip-equipment export rules')).not.toBeInTheDocument()
  })

  it('filters headlines through the facet menu', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-in'))
    vi.mocked(loadInvestState).mockResolvedValue(STATE)
    const { InvestHomePage } = await import('./InvestHomePage')
    const { InvestDataProvider } = await import('../data/InvestDataProvider')
    const { default: userEvent } = await import('@testing-library/user-event')
    renderPortal(
      <InvestDataProvider>
        <InvestHomePage />
      </InvestDataProvider>,
    )
    /* Facets live in the Filter menu and derive from the feed: AMAT
       gets an item even though it's a board link, not a holding — the
       story IS in the 'All' feed. */
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Filter' }))
    await user.click(screen.getByRole('menuitemradio', { name: 'AMAT' }))
    expect(screen.getByText('US widens chip-equipment export rules')).toBeInTheDocument()
    expect(screen.queryByText('Shopify beats estimates')).not.toBeInTheDocument()
    /* The picked facet shows as a removable token — clearing restores. */
    await user.click(screen.getByRole('button', { name: 'Clear filter' }))
    expect(screen.getByText('Shopify beats estimates')).toBeInTheDocument()
    /* Watch-theme facets were dropped — they duplicate the Analysis
       board — and a single-class feed earns no 'Equity' item. */
    await user.click(screen.getByRole('button', { name: 'Filter' }))
    expect(
      screen.queryByRole('menuitemradio', { name: 'US-China trade restrictions' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitemradio', { name: 'Equity' })).not.toBeInTheDocument()
  })

  it('mutes a publisher, lists it under "Muted:", and restores it', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-in'))
    /* The mute write resolves, then the refresh reloads state with the
       mute persisted — the same two calls the real flow makes. */
    vi.mocked(loadInvestState)
      .mockResolvedValueOnce(STATE)
      .mockResolvedValueOnce({ ...STATE, newsMutes: ['Wire'] })
      .mockResolvedValue(STATE)
    vi.mocked(muteNewsSource).mockResolvedValue(undefined)
    vi.mocked(unmuteNewsSource).mockResolvedValue(undefined)
    const { InvestHomePage } = await import('./InvestHomePage')
    const { InvestDataProvider } = await import('../data/InvestDataProvider')
    const { default: userEvent } = await import('@testing-library/user-event')
    renderPortal(
      <InvestDataProvider>
        <InvestHomePage />
      </InvestDataProvider>,
    )
    expect(await screen.findByText('US widens chip-equipment export rules')).toBeInTheDocument()
    const user = userEvent.setup()
    /* Per-card control — names the publisher it mutes. */
    await user.click(screen.getByRole('button', { name: 'Hide Wire headlines' }))
    expect(muteNewsSource).toHaveBeenCalledWith('Wire')
    /* Post-refresh the muted source's story is gone and the muted list
       shows what's hidden. */
    expect(await screen.findByText('Muted:')).toBeInTheDocument()
    expect(screen.queryByText('US widens chip-equipment export rules')).not.toBeInTheDocument()
    expect(screen.getByText('Shopify beats estimates')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Show Wire again' }))
    expect(unmuteNewsSource).toHaveBeenCalledWith('Wire')
    expect(await screen.findByText('US widens chip-equipment export rules')).toBeInTheDocument()
    expect(screen.queryByText('Muted:')).not.toBeInTheDocument()
  })

  it('badges headline kinds and ranks events above churn within a day', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-in'))
    vi.mocked(loadInvestState).mockResolvedValue({
      ...STATE,
      news: [
        ...STATE.news,
        {
          id: 3,
          symbol: 'SHOP',
          assetClass: 'equity',
          title: 'Shopify Stock Falls 4% in Morning Trading',
          url: 'https://news.example/shop-down',
          source: 'Churn Daily',
          summary: '',
          /* Newest row — but a price-move writeup, so it ranks after
             the event and news rows inside the same day. */
          publishedAt: '2026-01-20T15:00:00Z',
          viaTheme: null,
          kind: null,
        },
      ],
    })
    const { InvestHomePage } = await import('./InvestHomePage')
    const { InvestDataProvider } = await import('../data/InvestDataProvider')
    renderPortal(
      <InvestDataProvider>
        <InvestHomePage />
      </InvestDataProvider>,
    )
    const move = await screen.findByText('Shopify Stock Falls 4% in Morning Trading')
    const event = screen.getByText('US widens chip-equipment export rules')
    /* Event outranks the newer churn inside the same day. */
    expect(event.compareDocumentPosition(move) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getAllByText('Price move')).toHaveLength(1)
    expect(screen.getAllByText('Event')).toHaveLength(1)
  })

  it('hides subscription-only sources until the toggle shows them', async () => {
    localStorage.setItem('dutiva.news.showPaywalled', '0')
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-in'))
    vi.mocked(loadInvestState).mockResolvedValue({
      ...STATE,
      news: [
        ...STATE.news,
        {
          id: 4,
          symbol: 'SHOP',
          assetClass: 'equity',
          title: 'Barron paywalled piece on Shopify',
          url: 'https://news.example/barrons-shop',
          source: "Barron's",
          summary: '',
          publishedAt: '2026-01-20T07:00:00Z',
          viaTheme: null,
          kind: null,
        },
      ],
    })
    const { InvestHomePage } = await import('./InvestHomePage')
    const { InvestDataProvider } = await import('../data/InvestDataProvider')
    renderPortal(
      <InvestDataProvider>
        <InvestHomePage />
      </InvestDataProvider>,
    )
    expect(await screen.findByText('Shopify beats estimates')).toBeInTheDocument()
    expect(screen.queryByText('Barron paywalled piece on Shopify')).not.toBeInTheDocument()
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    const chip = screen.getByRole('button', { name: /subscription-only headlines hidden/i })
    expect(chip).toHaveAttribute('title', expect.stringContaining("Barron's"))
    await user.click(chip)
    expect(await screen.findByText('Barron paywalled piece on Shopify')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Subscription-only sources shown/i }))
    expect(screen.queryByText('Barron paywalled piece on Shopify')).not.toBeInTheDocument()
  })

  it('windows the headline feed to 7, 14, or 30 days', async () => {
    const recent = new Date(Date.now() - 2 * 86_400_000).toISOString()
    const older = new Date(Date.now() - 10 * 86_400_000).toISOString()
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-in'))
    vi.mocked(loadInvestState).mockResolvedValue({
      ...STATE,
      news: STATE.news.map((n, i) => ({
        ...n,
        publishedAt: i === 0 ? recent : older,
      })),
    })
    const { InvestHomePage } = await import('./InvestHomePage')
    const { InvestDataProvider } = await import('../data/InvestDataProvider')
    const { default: userEvent } = await import('@testing-library/user-event')
    renderPortal(
      <InvestDataProvider>
        <InvestHomePage />
      </InvestDataProvider>,
    )
    /* Default 7d: the 10-day-old theme headline is out of window. */
    expect(await screen.findByText('Shopify beats estimates')).toBeInTheDocument()
    expect(screen.queryByText('US widens chip-equipment export rules')).not.toBeInTheDocument()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '14 days' }))
    expect(screen.getByText('US widens chip-equipment export rules')).toBeInTheDocument()
    /* Two different publish days → two day-group headers chunk the list. */
    const card = screen.getByText('Market headlines').closest('section')!
    expect(within(card).getAllByRole('heading', { level: 3 })).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: '7 days' }))
    expect(screen.queryByText('US widens chip-equipment export rules')).not.toBeInTheDocument()
  })

  it('lists totals per currency instead of a blended figure when no FX rate loads', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-in'))
    vi.mocked(loadInvestState).mockResolvedValue(USD_QUOTED)
    vi.mocked(loadFxRates).mockResolvedValue(null)
    const { InvestHomePage } = await import('./InvestHomePage')
    const { InvestDataProvider } = await import('../data/InvestDataProvider')
    renderPortal(
      <InvestDataProvider>
        <InvestHomePage />
      </InvestDataProvider>,
    )
    /* The USD position can't convert — the headline keeps it as its own
       code-labelled line instead of dropping it from a CAD "total". */
    expect(await screen.findByText(/totals stay per currency/)).toBeInTheDocument()
    expect(screen.getByText('Value by currency')).toBeInTheDocument()
    expect(screen.getAllByText('USD 1,000.00').length).toBe(1)
    expect(screen.getAllByText('CAD 25,000.00').length).toBe(2)
    /* No blended book, but each class still shows its share of the
       same-currency slice — a real proportion, not an invented one. */
    expect(screen.getByText(/100% in USD/)).toBeInTheDocument()
  })

  it('names the uncovered currency when rates exist but not for it', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-in'))
    vi.mocked(loadInvestState).mockResolvedValue({
      ...USD_QUOTED,
      positions: [
        {
          ...USD_QUOTED.positions[0]!,
          symbol: 'TYO',
          currency: 'JPY',
        },
      ],
      snapshots: [
        { ...USD_QUOTED.snapshots[0]!, symbol: 'TYO', currency: 'JPY' },
      ],
    })
    /* A table with only USD/EUR/GBP can't touch JPY — the note says which
       currency is uncovered rather than claim no rates exist. */
    vi.mocked(loadFxRates).mockResolvedValue({ date: '2026-10-12', rates: { CAD: 1, USD: 0.73 } })
    const { InvestHomePage } = await import('./InvestHomePage')
    const { InvestDataProvider } = await import('../data/InvestDataProvider')
    renderPortal(
      <InvestDataProvider>
        <InvestHomePage />
      </InvestDataProvider>,
    )
    expect(await screen.findByText(/No JPY rate on file/)).toBeInTheDocument()
    /* JPY is zero-decimal — no cents column. */
    expect(screen.getAllByText('JPY 1,000').length).toBe(1)
  })

  it('counts acknowledged signals as open and drops dismissed ones from the list', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-in'))
    vi.mocked(loadInvestState).mockResolvedValue({
      ...STATE,
      signals: [
        STATE.signals[0]!,
        {
          ...STATE.signals[0]!,
          id: 'sig-ack',
          symbol: '',
          title: 'Portfolio-level concentration',
          status: 'acknowledged' as const,
        },
        {
          ...STATE.signals[0]!,
          id: 'sig-gone',
          title: 'Dismissed noise',
          status: 'dismissed' as const,
        },
      ],
    })
    const { InvestHomePage } = await import('./InvestHomePage')
    const { InvestDataProvider } = await import('../data/InvestDataProvider')
    renderPortal(
      <InvestDataProvider>
        <InvestHomePage />
      </InvestDataProvider>,
    )
    /* new + acknowledged = 2 open; the dismissed row never renders. */
    expect((await screen.findAllByText('2')).length).toBeGreaterThan(0)
    expect(screen.getByText('Portfolio-level concentration')).toBeInTheDocument()
    expect(screen.queryByText('Dismissed noise')).not.toBeInTheDocument()
    /* No symbol → date sits alone, never behind a dangling '·'. */
    expect(screen.queryByText(/^· /)).not.toBeInTheDocument()
  })

  it('tags a mover with the book context that explains it', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-in'))
    vi.mocked(loadInvestState).mockResolvedValue({
      ...STATE,
      theses: [
        {
          id: 'th1',
          assetClass: 'equity' as const,
          symbol: 'SHOP',
          name: 'Shopify',
          thesis: 'Logistics flywheel',
          intent: 'core' as const,
          breakRules: [],
          driftRules: [],
          swot: EMPTY_SWOT,
          status: 'broken' as const,
          evalDetail: null,
          lastEvaluatedAt: null,
          reaffirmedAt: null,
          createdAt: '2026-01-10T00:00:00Z',
          updatedAt: '2026-01-10T00:00:00Z',
        },
      ],
    })
    const { InvestHomePage } = await import('./InvestHomePage')
    const { InvestDataProvider } = await import('../data/InvestDataProvider')
    renderPortal(
      <InvestDataProvider>
        <InvestHomePage />
      </InvestDataProvider>,
    )
    /* SHOP −6% clears the mover bar; its break line is crossed and 120 sits
       under ma50 130 — the strongest two tags ride the mover. */
    expect(
      await screen.findByText(/SHOP −6\.0% — break line crossed, below its 50-day average/),
    ).toBeInTheDocument()
  })

  it('collapses movers with identical tags into one pluralized tail', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-in'))
    vi.mocked(loadInvestState).mockResolvedValue({
      ...STATE,
      positions: [
        ...STATE.positions,
        {
          id: 'p2',
          accountId: 'acc1',
          assetClass: 'equity',
          symbol: 'AMD',
          name: 'AMD',
          quantity: 5,
          avgCost: 90,
          currency: 'CAD',
          lastPrice: 120,
          lastPriceAt: '2026-01-20T00:00:00Z',
          targetWeightPct: null,
        },
      ],
      snapshots: [
        ...STATE.snapshots,
        {
          assetClass: 'equity' as const,
          symbol: 'AMD',
          price: 120,
          dayChangePct: -8,
          ma50: 130,
          currency: 'CAD',
          source: 'manual',
          asOf: '2026-01-20T00:00:00Z',
          quoteName: '',
        },
      ],
      theses: ['SHOP', 'AMD'].map((sym, i) => ({
        id: `th${i}`,
        assetClass: 'equity' as const,
        symbol: sym,
        name: sym,
        thesis: 't',
        intent: 'core' as const,
        breakRules: [],
        driftRules: [],
        swot: EMPTY_SWOT,
        status: 'broken' as const,
        evalDetail: null,
        lastEvaluatedAt: null,
        reaffirmedAt: null,
        createdAt: '2026-01-10T00:00:00Z',
        updatedAt: '2026-01-10T00:00:00Z',
      })),
    })
    const { InvestHomePage } = await import('./InvestHomePage')
    const { InvestDataProvider } = await import('../data/InvestDataProvider')
    renderPortal(
      <InvestDataProvider>
        <InvestHomePage />
      </InvestDataProvider>,
    )
    /* Same two tags on both movers — one shared, pluralized tail
       instead of the same sentence twice. */
    expect(
      await screen.findByText(
        /AMD −8\.0%, SHOP −6\.0% — break lines crossed, below their 50-day averages/,
      ),
    ).toBeInTheDocument()
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

  it('keeps dismissed signals behind a toggle and can reopen them', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-in'))
    vi.mocked(loadInvestState).mockResolvedValue({
      ...STATE,
      signals: [
        STATE.signals[0]!,
        {
          ...STATE.signals[0]!,
          id: 'sig-gone',
          title: 'Old noise',
          status: 'dismissed' as const,
        },
      ],
    })
    vi.mocked(setSignalStatus).mockResolvedValue(undefined)
    const { InvestSignalsPage } = await import('./InvestSignalsPage')
    const { InvestDataProvider } = await import('../data/InvestDataProvider')
    renderPortal(
      <InvestDataProvider>
        <InvestSignalsPage />
      </InvestDataProvider>,
      '/invest/signals',
    )

    /* Dismissed rows stay out of the open list until asked for. */
    expect(await screen.findByText('SHOP dropped below threshold')).toBeInTheDocument()
    expect(screen.queryByText('Old noise')).not.toBeInTheDocument()
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /Show 1 dismissed/i }))
    expect(await screen.findByText('Old noise')).toBeInTheDocument()

    /* Reopen is the undo path — a dismissed signal goes back to new. */
    await user.click(screen.getByRole('button', { name: 'Reopen' }))
    await vi.waitFor(() => {
      expect(setSignalStatus).toHaveBeenCalledWith('sig-gone', 'new')
    })
  })

  it('links symbols a signal body mentions back to the book', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-in'))
    vi.mocked(loadInvestState).mockResolvedValue({
      ...STATE,
      signals: [
        {
          ...STATE.signals[0]!,
          id: 'sig-body',
          symbol: '',
          title: 'Broad declines',
          body: 'SHOP fell 6.9% while AMD held flat.',
        },
      ],
    })
    const { InvestSignalsPage } = await import('./InvestSignalsPage')
    const { InvestDataProvider } = await import('../data/InvestDataProvider')
    renderPortal(
      <InvestDataProvider>
        <InvestSignalsPage />
      </InvestDataProvider>,
      '/invest/signals',
    )

    /* SHOP is held → a navigable pill; AMD isn't in the book → stays text. */
    expect(await screen.findByText('Broad declines')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'SHOP' })
    expect(link).toHaveAttribute('href', '/invest/portfolio?symbol=SHOP')
    expect(screen.queryByRole('link', { name: 'AMD' })).not.toBeInTheDocument()
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
    const user = userEvent.setup()
    /* 'Mark executed' opens the fill row; 'Record fill' submits it — a
       blank qty/price means 'all of it, at the current mark'. */
    await user.click(screen.getByRole('button', { name: /Mark executed/i }))
    await user.click(screen.getByRole('button', { name: /Record fill/i }))
    await vi.waitFor(() => {
      expect(executeOrder).toHaveBeenCalledWith('o1', undefined, undefined, undefined)
    })
  })
})

/* Symbols legitimately repeat on the portfolio page now — the allocation
   donut legend and the rebalance card both list them. Position-table
   assertions scope to the table, not the whole document. */
const posCell = async (text: string | RegExp) => {
  const found = (await screen.findAllByText(text)).find((el) => el.closest('table'))
  if (!found) throw new Error(`${String(text)} not found inside a table`)
  return found
}
const posCellNow = (text: string | RegExp) => {
  const found = screen.getAllByText(text).find((el) => el.closest('table'))
  if (!found) throw new Error(`${String(text)} not found inside a table`)
  return found
}

describe('InvestPortfolioPage positions', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderPage = async (
    state: InvestState = STATE,
    fx: FxTable | null = null,
    route = '/invest/portfolio',
  ) => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-in'))
    vi.mocked(loadInvestState).mockResolvedValue(state)
    vi.mocked(loadFxRates).mockResolvedValue(fx)
    const { InvestPortfolioPage } = await import('./InvestPortfolioPage')
    const { InvestDataProvider } = await import('../data/InvestDataProvider')
    const { default: userEvent } = await import('@testing-library/user-event')
    renderPortal(
      <InvestDataProvider>
        <InvestPortfolioPage />
      </InvestDataProvider>,
      route,
    )
    return userEvent.setup()
  }

  const UNPRICED = {
    id: 'p2',
    accountId: 'acc1',
    assetClass: 'equity' as const,
    symbol: 'NQ',
    name: 'NoQuote Inc.',
    quantity: 2,
    avgCost: 50,
    currency: 'CAD',
    lastPrice: null,
    lastPriceAt: null,
    targetWeightPct: null,
  }

  it('shows — for an unpriced row instead of dressing cost up as a market price', async () => {
    await renderPage({ ...STATE, positions: [...STATE.positions, UNPRICED] })

    /* SHOP is priced at $120 against a $100 cost basis — P&L lands on the
       row and repeats in the totals footer. */
    expect(await posCell('SHOP')).toBeInTheDocument()
    expect(screen.getAllByText(/\+\$200\.00/)).toHaveLength(2)
    expect(screen.getAllByText(/\(\+20\.0%\)/)).toHaveLength(2)

    /* NQ has no snapshot and no synced last price — three muted dashes and
       the footnote, never its $50 cost in the price column. */
    expect(
      within(posCellNow('SHOP').closest('table')!).getAllByText('—'),
    ).toHaveLength(3)
    expect(screen.getByText(/no quote on file/i)).toBeInTheDocument()
  })

  it('converts a USD quote into the CAD book at the ECB rate, marked ≈', async () => {
    await renderPage(USD_QUOTED, FX_TABLE)
    await posCell('AMD')
    /* $100 USD ÷ 0.73 ≈ $136.99 — the row never prints the raw $100 as
       if it were CAD. The ≈ markers and the disclosed rate are the tell. */
    expect(screen.getByText(/\$136\.99/)).toBeInTheDocument()
    expect(screen.getAllByText('≈').length).toBeGreaterThanOrEqual(3)
    expect(screen.getByText(/USD→CAD 1\.3699/)).toBeInTheDocument()
  })

  it('shows — for a cross-currency row when no FX rate is on file', async () => {
    await renderPage(USD_QUOTED)
    await posCell('AMD')
    /* The quote exists but can't be expressed in CAD — the cells stay
       blank with the FX note, and the 'no quote' note stays hidden. */
    expect(
      within(posCellNow('AMD').closest('table')!).getAllByText('—'),
    ).toHaveLength(3)
    expect(screen.getByText(/no FX rate is on file/i)).toBeInTheDocument()
    expect(screen.queryByText(/no quote on file/i)).not.toBeInTheDocument()
  })

  it('renders the totals row from priced rows only', async () => {
    await renderPage({ ...STATE, positions: [...STATE.positions, UNPRICED] })
    await posCell('SHOP')
    /* Total cost covers both rows ($1,100); value counts only the priced
       one ($1,200 — once on the row, once in the footer). */
    expect(screen.getByText('$1,100.00')).toBeInTheDocument()
    expect(screen.getAllByText('$1,200.00')).toHaveLength(2)
    expect(screen.getByRole('columnheader', { name: /P&L/i })).toBeInTheDocument()
  })

  it('sorts by the column header when clicked', async () => {
    const user = await renderPage(STATE)
    await posCell('SHOP')
    const valueTh = screen.getByRole('columnheader', { name: /Value/i })
    expect(valueTh.getAttribute('aria-sort')).toBeNull()
    await user.click(screen.getByRole('button', { name: /^Value$/i }))
    expect(valueTh.getAttribute('aria-sort')).toBe('descending')
    await user.click(screen.getByRole('button', { name: /^Value$/i }))
    expect(valueTh.getAttribute('aria-sort')).toBe('ascending')
  })

  it('edits quantity and average cost through the row Edit control', async () => {
    const user = await renderPage(STATE)
    await posCell('SHOP')
    vi.mocked(updatePosition).mockResolvedValue(undefined)

    await user.click(screen.getByRole('button', { name: /Edit SHOP/i }))
    const row = posCellNow('SHOP').closest('tr')
    expect(row).not.toBeNull()
    const cost = within(row as HTMLElement).getByRole('spinbutton', { name: /Average cost/i })
    await user.clear(cost)
    await user.type(cost, '95')
    await user.click(screen.getByRole('button', { name: /^Save$/i }))

    await vi.waitFor(() => {
      expect(updatePosition).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({ name: 'Shopify', quantity: 10, avgCost: 95 }),
      )
    })
  })

  it('removes a position only after the inline confirm', async () => {
    const user = await renderPage(STATE)
    await posCell('SHOP')
    vi.mocked(deletePosition).mockResolvedValue(undefined)

    const remove = screen.getByRole('button', { name: /Remove SHOP/i })
    await user.click(remove)
    expect(deletePosition).not.toHaveBeenCalled()
    expect(screen.getByText('Remove?')).toBeInTheDocument()
    await user.click(remove)
    await vi.waitFor(() => {
      expect(deletePosition).toHaveBeenCalledWith('p1')
    })
  })

  it('scopes the table and totals to ?symbol= until the chip clears', async () => {
    const user = await renderPage(
      { ...STATE, positions: [...STATE.positions, UNPRICED] },
      null,
      '/invest/portfolio?symbol=SHOP',
    )
    /* The signal-pill deep link lands on just the named position — the
       filter chip names the scope and offers the way back out. */
    expect(await posCell('SHOP')).toBeInTheDocument()
    /* NQ leaves the filtered TABLE — the book-level cards beside it still
       legitimately show the whole book. */
    expect(
      within(posCellNow('SHOP').closest('table')!).queryByText('NQ'),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Symbol: SHOP')).toBeInTheDocument()
    /* Totals describe the filtered rows — SHOP alone: cost $1,000. */
    expect(screen.getByText('$1,000.00')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Show all/i }))
    expect(await posCell('NQ')).toBeInTheDocument()
  })

  it('keeps the add form behind a toggle so the table leads the section', async () => {
    const user = await renderPage(STATE)
    await posCell('SHOP')
    expect(document.getElementById('inv-pos-symbol')).toBeNull()
    await user.click(screen.getByRole('button', { name: /Add position/i }))
    expect(document.getElementById('inv-pos-symbol')).not.toBeNull()
  })

  it('re-prices in the background after a position is added', async () => {
    const user = await renderPage(STATE)
    await posCell('SHOP')
    vi.mocked(createPosition).mockResolvedValue(undefined)
    vi.mocked(syncPrices).mockResolvedValue({ symbols: 2, synced: 2, failed: [] })

    await user.click(screen.getByRole('button', { name: /Add position/i }))
    await user.type(document.getElementById('inv-pos-symbol')!, 'amd')
    await user.type(document.getElementById('inv-pos-qty')!, '5')
    await user.type(document.getElementById('inv-pos-cost')!, '150')
    await user.click(screen.getByRole('button', { name: /Add position/i }))

    await vi.waitFor(() => {
      expect(createPosition).toHaveBeenCalledWith(
        expect.objectContaining({ accountId: 'acc1', symbol: 'amd', quantity: 5, avgCost: 150 }),
      )
    })
    /* The new row lands immediately via run()'s refresh — then the
       background sync fires and shared state reloads once more so the
       fresh quote fills in without waiting for the scheduled sync. */
    await vi.waitFor(() => {
      expect(syncPrices).toHaveBeenCalled()
    })
    await vi.waitFor(() => {
      expect(vi.mocked(loadInvestState).mock.calls.length).toBeGreaterThanOrEqual(3)
    })
  })

  it('refuses to re-add a symbol the account already holds', async () => {
    const user = await renderPage(STATE)
    await posCell('SHOP')
    vi.mocked(createPosition).mockResolvedValue(undefined)

    await user.click(screen.getByRole('button', { name: /Add position/i }))
    await user.type(document.getElementById('inv-pos-symbol')!, 'shop')
    await user.type(document.getElementById('inv-pos-qty')!, '5')
    await user.type(document.getElementById('inv-pos-cost')!, '150')
    await user.click(screen.getByRole('button', { name: /Add position/i }))

    /* The upsert would have silently replaced the row's numbers — the
       guard points at Edit instead and never reaches the API. */
    expect(await screen.findByText(/already in this account/i)).toBeInTheDocument()
    expect(createPosition).not.toHaveBeenCalled()
    /* …and the form keeps the typed fields so they can be corrected. */
    expect((document.getElementById('inv-pos-symbol') as HTMLInputElement).value).toBe('shop')
  })

  it('sends the chosen currency with a new position', async () => {
    const user = await renderPage(STATE)
    await posCell('SHOP')
    vi.mocked(createPosition).mockResolvedValue(undefined)
    vi.mocked(syncPrices).mockResolvedValue({ symbols: 0, synced: 0, failed: [] })

    await user.click(screen.getByRole('button', { name: /Add position/i }))
    await user.type(document.getElementById('inv-pos-symbol')!, 'nvda')
    await user.type(document.getElementById('inv-pos-qty')!, '3')
    await user.type(document.getElementById('inv-pos-cost')!, '180')
    await user.selectOptions(document.getElementById('inv-pos-cur')!, 'USD')
    await user.click(screen.getByRole('button', { name: /Add position/i }))

    await vi.waitFor(() => {
      expect(createPosition).toHaveBeenCalledWith(
        expect.objectContaining({ symbol: 'nvda', currency: 'USD' }),
      )
    })
  })

  it('hides the Account column in a single-account book', async () => {
    await renderPage()
    await posCell('SHOP')
    /* One account means every cell would read identically — the column
       stays out and its width goes back to the data. */
    expect(screen.queryByRole('columnheader', { name: 'Account' })).toBeNull()
  })

  it('names the owning account on each row once a second account exists', async () => {
    await renderPage(TWO_ACCOUNTS)
    expect(
      await screen.findByRole('columnheader', { name: 'Account' }),
    ).toBeInTheDocument()
    const row = (await posCell('SHOP')).closest('tr')
    expect(within(row as HTMLElement).getByText('Paper book')).toBeInTheDocument()
  })

  it('suggests the quote currency when the symbol already has a snapshot', async () => {
    const user = await renderPage(USD_QUOTED)
    await posCell('AMD')

    await user.click(screen.getByRole('button', { name: /Add position/i }))
    await user.type(document.getElementById('inv-pos-symbol')!, 'amd')

    /* AMD's feed is USD-denominated — the field pre-selects USD and says
       why instead of letting cost basis land mislabeled as CAD. */
    expect(
      await screen.findByText(/AMD quotes in USD — costs usually follow the quote/i),
    ).toBeInTheDocument()
    expect((document.getElementById('inv-pos-cur') as HTMLSelectElement).value).toBe('USD')
  })

  it('imports a pasted list and keeps the lines that did not parse', async () => {
    const user = await renderPage()
    await posCell('SHOP')
    vi.mocked(createPosition).mockResolvedValue(undefined)
    vi.mocked(syncPrices).mockResolvedValue({ symbols: 2, synced: 2, failed: [] })

    await user.click(screen.getByRole('button', { name: /Add many/i }))
    await user.type(
      document.getElementById('inv-bulk-lines')!,
      'MSFT, 0.79, 527, USD\nTSLA, 2, 300\nSHOP, 1, 100\nBROKEN',
    )
    await user.click(screen.getByRole('button', { name: /^Add positions$/i }))

    /* MSFT + TSLA land (TSLA under the form's CAD default); SHOP is a dup
       and 'BROKEN' is unparseable — both stay in the box. */
    await vi.waitFor(() => {
      expect(createPosition).toHaveBeenCalledTimes(2)
    })
    expect(createPosition).toHaveBeenCalledWith(
      expect.objectContaining({ symbol: 'MSFT', quantity: 0.79, avgCost: 527, currency: 'USD' }),
    )
    expect(createPosition).toHaveBeenCalledWith(
      expect.objectContaining({ symbol: 'TSLA', quantity: 2, avgCost: 300, currency: 'CAD' }),
    )
    expect(
      await screen.findByText(/Added 2 positions — fetching quotes… 2 line\(s\) skipped/i),
    ).toBeInTheDocument()
    const box = document.getElementById('inv-bulk-lines') as HTMLTextAreaElement
    expect(box.value).toBe('SHOP, 1, 100\nBROKEN')
  })

  it('states quote freshness under the positions table', async () => {
    await renderPage()
    await posCell('SHOP')
    expect(await screen.findByText(/Prices as of/)).toBeInTheDocument()
  })
})

describe('InvestPortfolioPage accounts', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderPage = async (state: InvestState = STATE) => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-in'))
    vi.mocked(loadInvestState).mockResolvedValue(state)
    const { InvestPortfolioPage } = await import('./InvestPortfolioPage')
    const { InvestDataProvider } = await import('../data/InvestDataProvider')
    const { default: userEvent } = await import('@testing-library/user-event')
    renderPortal(
      <InvestDataProvider>
        <InvestPortfolioPage />
      </InvestDataProvider>,
      '/invest/portfolio',
    )
    return userEvent.setup()
  }

  it('creates an account with the chosen base currency', async () => {
    const user = await renderPage()
    /* 'Paper book' renders on the tile and on the row's Account cell. */
    expect((await screen.findAllByText('Paper book')).length).toBeGreaterThanOrEqual(1)
    vi.mocked(createAccount).mockResolvedValue(undefined)

    await user.type(document.getElementById('inv-acc-name')!, 'US book')
    await user.type(document.getElementById('inv-acc-cash')!, '1000')
    await user.selectOptions(document.getElementById('inv-acc-cur')!, 'USD')
    await user.click(screen.getByRole('button', { name: /Add account/i }))

    await vi.waitFor(() => {
      expect(createAccount).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'US book', kind: 'paper', cashBalance: 1000, baseCurrency: 'USD' }),
      )
    })
  })

  it('removes an account only after the cascade-aware confirm', async () => {
    const user = await renderPage(TWO_ACCOUNTS)
    /* Every row names its owning account once a second account exists —
       the blast radius is visible before the delete, not discovered
       after. */
    const row = (await posCell('SHOP')).closest('tr')
    expect(row).not.toBeNull()
    expect(within(row as HTMLElement).getByText('Paper book')).toBeInTheDocument()
    vi.mocked(deleteAccount).mockResolvedValue(undefined)

    const remove = screen.getByRole('button', { name: /Remove Paper book/i })
    await user.click(remove)
    expect(deleteAccount).not.toHaveBeenCalled()
    /* The confirm names the cascade — '1 position — SHOP', not just
       'its positions'. */
    expect(screen.getByText(/its positions/i)).toBeInTheDocument()
    expect(screen.getByText(/Also deletes its 1 position — SHOP/i)).toBeInTheDocument()
    await user.click(remove)
    await vi.waitFor(() => {
      expect(deleteAccount).toHaveBeenCalledWith('acc1')
    })
    /* …and the aftermath says how many rows went with it. */
    expect(
      await screen.findByText(/Removed Paper book — 1 position went with it\./),
    ).toBeInTheDocument()
  })

  it('edits an account name and cash through the tile Edit control', async () => {
    const user = await renderPage()
    /* 'Paper book' only matches the tile here — the row's Account cell
       hides for a single-account book. */
    const tile = (await screen.findAllByText('Paper book'))[0]!.closest('li')
    expect(tile).not.toBeNull()
    vi.mocked(updateAccount).mockResolvedValue(undefined)
    await user.click(screen.getByRole('button', { name: /Edit Paper book/i }))
    const nameInput = within(tile as HTMLElement).getByRole('textbox', { name: /Account name/i })
    await user.clear(nameInput)
    await user.type(nameInput, 'TFSA book')
    await user.click(within(tile as HTMLElement).getByRole('button', { name: /^Save$/i }))

    await vi.waitFor(() => {
      expect(updateAccount).toHaveBeenCalledWith(
        'acc1',
        expect.objectContaining({ name: 'TFSA book', kind: 'paper', cashBalance: 25000 }),
      )
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
      '/invest/portfolio',
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

  it('shows scoped counts, Paused for a disabled strategy, and only its own runs', async () => {
    await renderPage({
      ...STATE,
      strategies: [
        /* Disabled + scoped to SHOP only — the card must not claim the
           whole two-symbol universe or wear a 'Draft' pill. */
        { ...STATE.strategies[0]!, enabled: false, scope: { watchlist: false, symbols: ['SHOP'] } },
        { ...STATE.strategies[0]!, id: 's2', name: 'Runner', enabled: true },
      ],
      runs: [
        STATE.runs[0]!, // unscoped insight run — belongs to no card
        { ...STATE.runs[0]!, id: 'r2', strategyId: 's2', signalsEmitted: 2, proposalsCreated: 1 },
      ],
    })

    expect(await screen.findByText('Paused')).toBeInTheDocument()
    expect(screen.getByText(/1 tracked symbol/)).toBeInTheDocument()
    /* Only Runner's own run lands a Last-run line — the sweep's null row
       never stamps s1's card. */
    expect(screen.getAllByText(/Last run/)).toHaveLength(1)
    expect(screen.getByText(/2 signals · 1 proposal/)).toBeInTheDocument()
  })

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

  it('projects next from last_evaluated_at and names an overdue strategy due', async () => {
    /* A run row 4d ago on a monthly strategy says "next" ~Nov — but the
       bot gates on last_evaluated_at, which a partial write never stamps.
       The card must project from the gate, not the run row. */
    const evaluated = new Date(Date.now() - 4 * 86_400_000).toISOString()
    await renderPage({
      ...STATE,
      strategies: [
        { ...STATE.strategies[0]!, cadence: 'monthly' as const, lastEvaluatedAt: evaluated },
        { ...STATE.strategies[0]!, id: 's2', name: 'Idle' }, // never evaluated
      ],
      runs: [],
    })
    /* Monthly + evaluated 4d ago → next projects ~26d out and is shown. */
    const dipCard = (await screen.findByText('Dip watcher')).closest('button')!
    expect(dipCard.textContent).toContain('next')
    expect(dipCard.textContent).not.toContain('due on next sweep')
    /* The never-run Idle strategy is due — named, not silent. */
    const idleCard = screen.getByText('Idle').closest('button')!
    expect(idleCard.textContent).toContain('due on next sweep')
  })

  it('marks a clean run that found nothing as quiet', async () => {
    const evaluated = new Date(Date.now() - 4 * 86_400_000).toISOString()
    await renderPage({
      ...STATE,
      strategies: [{ ...STATE.strategies[0]!, lastEvaluatedAt: evaluated }],
      runs: [
        {
          ...STATE.runs[0]!,
          strategyId: STATE.strategies[0]!.id,
          signalsEmitted: 0,
          proposalsCreated: 0,
          status: 'ok',
        },
      ],
    })
    const card = (await screen.findByText('Dip watcher')).closest('button')!
    expect(card.textContent).toContain('no signals or drafts')
  })
})
