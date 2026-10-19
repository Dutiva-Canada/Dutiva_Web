/**
 * /invest/notifications — the inbox triage surface. Pins what made the
 * rework: each row routes somewhere (per-kind destination links), the
 * symbol chip cross-references a held position, timestamps run the
 * portal's relative convention, and triage sends Tally the same reaction
 * the Signals tab sends.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import { InvestDataContext } from '../data/InvestDataContext'
import type { InvestState } from '../data/api'
import type { InvestSignal } from '../data/types'
import { InvestNotificationsPage } from './InvestNotificationsPage'

const setSignalStatus = vi.fn().mockResolvedValue(undefined)
const sendInvestReaction = vi.fn().mockResolvedValue({ reply: null })

vi.mock('../data/api', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../data/api')>()
  return {
    ...mod,
    setSignalStatus: (...a: unknown[]) => setSignalStatus(...a),
  }
})
vi.mock('../data/chatApi', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../data/chatApi')>()
  return {
    ...mod,
    sendInvestReaction: (...a: unknown[]) => sendInvestReaction(...a),
  }
})

const STATE: InvestState = {
  accounts: [
    {
      id: 'a1',
      name: 'Paper book',
      kind: 'paper',
      baseCurrency: 'CAD',
      cashBalance: 5000,
      status: 'active',
    },
  ],
  positions: [
    {
      id: 'p1',
      accountId: 'a1',
      assetClass: 'equity',
      symbol: 'SHOP',
      name: 'Shopify',
      quantity: 10,
      avgCost: 100,
      currency: 'CAD',
      lastPrice: 120,
      lastPriceAt: '2026-02-01T00:00:00Z',
      targetWeightPct: null,
    },
  ],
  snapshots: [],
  strategies: [],
  signals: [],
  orders: [],
  runs: [],
  watchlist: [],
  news: [],
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
}

function signal(over: Partial<InvestSignal> = {}): InvestSignal {
  return {
    id: 'sig1',
    strategyId: null,
    ruleId: null,
    assetClass: 'equity',
    symbol: 'SHOP',
    name: 'Shopify',
    kind: 'alert',
    title: 'SHOP crossed below its 50-day average',
    body: 'Alert fired at the sweep.',
    titleFr: null,
    bodyFr: null,
    score: null,
    status: 'new',
    inFeed: true,
    createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    ...over,
  }
}

function mount(state: Partial<InvestState> = {}) {
  const refresh = vi.fn().mockResolvedValue(undefined)
  render(
    <LangProvider>
      <ToastsProvider>
        <MemoryRouter>
          <InvestDataContext.Provider
            value={{ state: { ...STATE, ...state }, loading: false, error: false, refresh }}
          >
            <InvestNotificationsPage />
          </InvestDataContext.Provider>
        </MemoryRouter>
      </ToastsProvider>
    </LangProvider>,
  )
  return { refresh }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('InvestNotificationsPage', () => {
  it('routes each row to the surface that owns its subject', async () => {
    mount({
      signals: [
        signal({ kind: 'thesis', title: 'SHOP — break line crossed' }),
        signal({ id: 'sig2', kind: 'scan', symbol: 'ETH', title: 'ETH — a watch item may explain' }),
        signal({ id: 'sig3', kind: 'goal', symbol: '', title: 'Cash goal off pace' }),
      ],
    })
    /* Theses kind → the Theses cards (where the reaffirm action lives). */
    expect(await screen.findByRole('link', { name: /Open Theses — SHOP/ })).toHaveAttribute(
      'href',
      '/invest/theses',
    )
    /* Scan and goal kinds → the Analysis board. */
    expect(screen.getByRole('link', { name: /Open Analysis — ETH/ })).toHaveAttribute(
      'href',
      '/invest/analysis',
    )
    expect(screen.getByRole('link', { name: 'Open Analysis' })).toHaveAttribute(
      'href',
      '/invest/analysis',
    )
  })

  it('routes strategy-produced rows to the rule and provenance-less ones to Tally', async () => {
    mount({
      signals: [
        /* Rule-fired: a tunable strategy exists → Agent tab. */
        signal({ strategyId: 'st1', title: 'SHOP crossed its floor' }),
        /* Insight-pass row: strategy_id and symbol both null/'' —
           nothing to tune, no position to land on → Tally. */
        signal({ id: 'sig2', kind: 'insight', symbol: '', name: '', title: 'Book drifted off target' }),
      ],
    })
    expect(await screen.findByRole('link', { name: /Open Agent — SHOP/ })).toHaveAttribute(
      'href',
      '/invest/strategies',
    )
    expect(screen.getByRole('link', { name: 'Open Tally' })).toHaveAttribute(
      'href',
      '/invest/chat',
    )
  })

  it('links a held symbol to the book and leaves a watchlist-only name plain', async () => {
    mount({
      signals: [
        // SHOP — held; body also mentions held VFV → both link.
        signal({ body: 'Pulled down with VFV today.' }),
        signal({
          id: 'sig2',
          symbol: 'ETH',
          kind: 'scan',
          title: 'ETH — a watch item may explain the slide',
          body: 'Watch item moved.',
        }), // watchlist-only
      ],
      positions: [
        ...STATE.positions,
        {
          id: 'p2',
          accountId: 'a1',
          assetClass: 'equity',
          symbol: 'VFV',
          name: 'Vanguard S&P 500',
          quantity: 5,
          avgCost: 100,
          currency: 'CAD',
          lastPrice: 110,
          lastPriceAt: '2026-02-01T00:00:00Z',
          targetWeightPct: null,
        },
      ],
    })
    expect(
      await screen.findByRole('link', { name: 'SHOP' }),
    ).toHaveAttribute('href', '/invest/portfolio?symbol=SHOP')
    /* A held symbol mentioned in the body cross-references to its position. */
    expect(screen.getByRole('link', { name: 'VFV' })).toHaveAttribute(
      'href',
      '/invest/portfolio?symbol=VFV',
    )
    expect(screen.queryByRole('link', { name: 'ETH' })).not.toBeInTheDocument()
  })

  it('stamps rows with the portal relative-time convention, not a locale string', async () => {
    mount({ signals: [signal()] })
    expect(await screen.findByText('2 h ago')).toBeInTheDocument()
    expect(screen.queryByText(/:\d{2}:\d{2}/)).not.toBeInTheDocument()
  })

  it('acknowledge clears the row AND sends Tally the signal_updated reaction', async () => {
    const user = userEvent.setup()
    const { refresh } = mount({ signals: [signal()] })
    await user.click(await screen.findByRole('button', { name: 'Acknowledge' }))
    await waitFor(() => expect(setSignalStatus).toHaveBeenCalledWith('sig1', 'acknowledged'))
    expect(refresh).toHaveBeenCalled()
    await waitFor(() =>
      expect(sendInvestReaction).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'signal_updated', status: 'acknowledged', symbol: 'SHOP' }),
        'en',
        expect.any(Function),
      ),
    )
  })

  it('does not cry failure when the write lands but the reload fails', async () => {
    const user = userEvent.setup()
    const refresh = vi.fn().mockRejectedValue(new Error('network down'))
    render(
      <LangProvider>
        <ToastsProvider>
          <MemoryRouter>
            <InvestDataContext.Provider
              value={{ state: { ...STATE, signals: [signal()] }, loading: false, error: false, refresh }}
            >
              <InvestNotificationsPage />
            </InvestDataContext.Provider>
          </MemoryRouter>
        </ToastsProvider>
      </LangProvider>,
    )
    await user.click(await screen.findByRole('button', { name: 'Acknowledge' }))
    await waitFor(() => expect(setSignalStatus).toHaveBeenCalled())
    await waitFor(() =>
      expect(sendInvestReaction).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'signal_updated' }),
        'en',
        expect.any(Function),
      ),
    )
    /* The write succeeded — no error banner; the stale row simply
       lingers until the next load. */
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('keeps other rows actionable while one write is in flight', async () => {
    /* A single busyId slot re-enabled row A the moment row B took the
       marker — the in-flight set keeps the disable per row. */
    let resolveWrite: (() => void) | undefined
    setSignalStatus.mockImplementationOnce(
      () => new Promise<void>((res) => (resolveWrite = res)),
    )
    const user = userEvent.setup()
    mount({ signals: [signal(), signal({ id: 'sig2', title: 'VFV crossed its floor', symbol: 'VFV' })] })
    const buttons = await screen.findAllByRole('button', { name: 'Acknowledge' })
    await user.click(buttons[0]!)
    await waitFor(() => expect(buttons[0]).toBeDisabled())
    expect(buttons[1]).toBeEnabled()
    resolveWrite?.()
  })

  it('dismiss behaves the same — status, refresh, reaction', async () => {
    const user = userEvent.setup()
    mount({ signals: [signal()] })
    await user.click(await screen.findByRole('button', { name: 'Dismiss' }))
    await waitFor(() => expect(setSignalStatus).toHaveBeenCalledWith('sig1', 'dismissed'))
    await waitFor(() =>
      expect(sendInvestReaction).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'signal_updated', status: 'dismissed' }),
        'en',
        expect.any(Function),
      ),
    )
  })

  it('explains where acknowledge vs dismiss land — the difference this page hides', async () => {
    mount({ signals: [signal()] })
    const hint = await screen.findByRole('button', { name: 'Acknowledge versus dismiss' })
    await userEvent.setup().click(hint)
    expect(await screen.findByText(/stays on the Signals tab/)).toBeInTheDocument()
    expect(screen.getByText(/Show dismissed/)).toBeInTheDocument()
  })

  it('drafts row links to Orders; the empty state is one card', async () => {
    mount({
      orders: [
        {
          id: 'o1',
          accountId: 'a1',
          signalId: null,
          ruleId: null,
          assetClass: 'equity',
          symbol: 'SHOP',
          name: 'Shopify',
          side: 'buy',
          orderType: 'market',
          quantity: 2,
          limitPrice: null,
          status: 'draft',
          note: null,
          error: null,
          mode: 'paper',
          requestedPrice: null,
          createdAt: '2026-02-01T00:00:00Z',
          executedAt: null,
          executedPrice: null,
        },
      ],
    })
    expect(await screen.findByRole('link', { name: /Review in Orders/ })).toHaveAttribute(
      'href',
      '/invest/orders',
    )
  })
})
