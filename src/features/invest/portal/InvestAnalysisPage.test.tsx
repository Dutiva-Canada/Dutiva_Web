/**
 * /invest/analysis — the page renders the sweep's persisted verdicts
 * (goal status + progress + the stamped line), the watch board's
 * freshness discipline, the SWOT quadrant beside a thesis, and the
 * pending strip that turns Tally's suggestions into rows only on
 * explicit accept.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import { InvestDataContext } from '../data/InvestDataContext'
import type { InvestState } from '../data/api'
import type { InvestGoal, InvestNewsItem, InvestScanItem, InvestThesis } from '../data/types'
import { InvestAnalysisPage } from './InvestAnalysisPage'

const saveGoal = vi.fn().mockResolvedValue(undefined)
const deleteGoal = vi.fn().mockResolvedValue(undefined)
const saveScanItem = vi.fn().mockResolvedValue(undefined)
const deleteScanItem = vi.fn().mockResolvedValue(undefined)
const markScanItemReviewed = vi.fn().mockResolvedValue(undefined)
const saveSwot = vi.fn().mockResolvedValue(undefined)
const saveStressScenario = vi.fn().mockResolvedValue(undefined)
const draftSwot = vi.fn()
const draftScan = vi.fn().mockResolvedValue([])
const loadPendingSuggestions = vi.fn().mockResolvedValue([])
const resolveSuggestion = vi.fn().mockResolvedValue(undefined)

vi.mock('../data/api', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../data/api')>()
  return {
    ...mod,
    saveGoal: (...a: unknown[]) => saveGoal(...a),
    deleteGoal: (...a: unknown[]) => deleteGoal(...a),
    saveScanItem: (...a: unknown[]) => saveScanItem(...a),
    deleteScanItem: (...a: unknown[]) => deleteScanItem(...a),
    markScanItemReviewed: (...a: unknown[]) => markScanItemReviewed(...a),
    saveSwot: (...a: unknown[]) => saveSwot(...a),
    saveStressScenario: (...a: unknown[]) => saveStressScenario(...a),
    draftSwot: (...a: unknown[]) => draftSwot(...a),
    draftScan: (...a: unknown[]) => draftScan(...a),
  }
})
vi.mock('@/lib/agentQueue', () => ({
  loadPendingSuggestions: (...a: unknown[]) => loadPendingSuggestions(...a),
  resolveSuggestion: (...a: unknown[]) => resolveSuggestion(...a),
}))

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

function goal(over: Partial<InvestGoal> = {}): InvestGoal {
  return {
    id: 'g1',
    title: 'Keep cash under 40%',
    detail: '',
    metric: 'cash_pct',
    op: 'lte',
    target: 40,
    baseline: 50,
    deadline: '2027-01-01',
    status: 'on_track',
    evalDetail: {
      current: 45.5,
      target: 40,
      op: 'lte',
      progress_pct: 45,
      expected_pct: 60,
      days_left: 300,
      line_en: 'On the way — 45.5% against the 40% target, 300 days left.',
      line_fr: 'En cours — 45,5 % contre la cible de 40 %, 300 jours restants.',
    },
    lastEvaluatedAt: '2026-03-10T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-03-10T00:00:00Z',
    ...over,
  }
}

function scanItem(over: Partial<InvestScanItem> = {}): InvestScanItem {
  return {
    id: 'w1',
    theme: 'currency',
    direction: 'headwind',
    title: 'USD strength vs CAD',
    note: 'CAD-priced book holding USD names.',
    symbols: ['ARM'],
    lastReviewedAt: new Date().toISOString(),
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...over,
  }
}

function newsItem(over: Partial<InvestNewsItem> = {}): InvestNewsItem {
  return {
    id: 1,
    symbol: 'ARM',
    assetClass: 'equity',
    title: 'Export rules tighten again',
    url: 'https://news.example/a1',
    source: 'Wire',
    summary: '',
    publishedAt: '2026-03-10T12:00:00Z',
    viaTheme: 'USD strength vs CAD',
    kind: null,
    ...over,
  }
}

function thesis(over: Partial<InvestThesis> = {}): InvestThesis {
  return {
    id: 't1',
    assetClass: 'equity',
    symbol: 'SHOP',
    name: 'Shopify',
    thesis: 'Merchant solutions compound.',
    intent: 'core',
    breakRules: [],
    driftRules: [],
    swot: { strengths: ['Merchant attach rate'], weaknesses: [], opportunities: [], threats: [] },
    status: 'healthy',
    evalDetail: null,
    lastEvaluatedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
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
            <InvestAnalysisPage />
          </InvestDataContext.Provider>
        </MemoryRouter>
      </ToastsProvider>
    </LangProvider>,
  )
  return { refresh }
}

beforeEach(() => {
  vi.clearAllMocks()
  loadPendingSuggestions.mockResolvedValue([])
  draftScan.mockResolvedValue([])
})

describe('InvestAnalysisPage — goals', () => {
  it('renders the sweep verdict: status, metric read, progress, stamped line', () => {
    mount({ goals: [goal()] })
    expect(screen.getByText('Keep cash under 40%')).toBeInTheDocument()
    expect(screen.getByText('On track')).toBeInTheDocument()
    expect(screen.getByText(/On the way — 45\.5% against the 40% target/)).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '45')
    expect(screen.getByText(/Now 45\.5%/)).toBeInTheDocument()
  })

  it('marks the pace on the bar — the share of the window already gone', () => {
    mount({ goals: [goal()] })
    expect(screen.getByText('Pace — about 60% by now')).toBeInTheDocument()
    const tick = document.querySelector('.sb-goalbar-pace')
    expect(tick).not.toBeNull()
    expect(tick).toHaveStyle({ left: '60%' })
  })

  it('tags a deadline-less goal In progress — 0% is not "on track"', () => {
    mount({
      goals: [
        goal({
          deadline: null,
          evalDetail: {
            current: 0,
            target: 40,
            op: 'lte',
            progress_pct: 0,
            days_left: null,
            line_en: 'Open-ended — at 0%, target is 40%.',
            line_fr: 'Sans échéance — à 0 %, cible de 40 %.',
          },
        }),
      ],
    })
    expect(screen.getByText('In progress')).toBeInTheDocument()
    expect(screen.queryByText('On track')).not.toBeInTheDocument()
  })

  it('shows the empty state and saves a new goal from the composer', async () => {
    const user = userEvent.setup()
    const { refresh } = mount()
    expect(screen.getByText(/No goals yet/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /New goal/i }))
    await user.type(screen.getByLabelText(/New goal/i), 'Grow the book')
    await user.clear(screen.getByLabelText('Target'))
    await user.type(screen.getByLabelText('Target'), '10000')
    await user.click(screen.getByRole('button', { name: /Save goal/i }))
    await waitFor(() => expect(saveGoal).toHaveBeenCalled())
    expect(saveGoal.mock.calls[0]![0]).toMatchObject({
      title: 'Grow the book',
      metric: 'book_value',
      op: 'gte',
      target: 10000,
    })
    expect(refresh).toHaveBeenCalled()
  })
})

describe('InvestAnalysisPage — watch board', () => {
  it('renders items with theme + direction pills and linked symbols', () => {
    mount({ scanItems: [scanItem()] })
    expect(screen.getByText('USD strength vs CAD')).toBeInTheDocument()
    expect(screen.getByText('Headwind')).toBeInTheDocument()
    expect(screen.getByText('Currency')).toBeInTheDocument()
    expect(screen.getByText('ARM')).toBeInTheDocument()
  })

  it('flags a stale item and lets the user mark it reviewed', async () => {
    const user = userEvent.setup()
    const stale = new Date(Date.now() - 50 * 86_400_000).toISOString()
    const { refresh } = mount({ scanItems: [scanItem({ lastReviewedAt: stale })] })
    expect(screen.getByText(/due a review/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Mark reviewed/i }))
    await waitFor(() => expect(markScanItemReviewed).toHaveBeenCalledWith('w1'))
    expect(refresh).toHaveBeenCalled()
  })

  it('shows theme-matched headlines under the item that owns them', () => {
    mount({
      scanItems: [scanItem()],
      news: [
        newsItem({ title: 'Export rules tighten again' }),
        newsItem({
          id: 2,
          title: 'Unrelated theme story',
          url: 'https://news.example/b2',
          viaTheme: 'Some other theme',
        }),
        newsItem({
          id: 3,
          title: 'Direct mention, no theme',
          url: 'https://news.example/c3',
          viaTheme: null,
        }),
        /* Subscription-only sources hide on theme cards too. */
        newsItem({
          id: 4,
          title: 'Paywalled theme piece',
          url: 'https://news.example/d4',
          source: "Barron's",
        }),
      ],
    })
    expect(screen.getByText('Export rules tighten again')).toBeInTheDocument()
    expect(screen.queryByText('Paywalled theme piece')).not.toBeInTheDocument()
    /* The board still names what it hid — same transparency rule as the feed. */
    expect(
      screen.getByRole('button', { name: /subscription-only headlines hidden/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Headlines matched to this theme/i)).toBeInTheDocument()
    /* Other-theme and direct-mention rows can't leak under the card. */
    expect(screen.queryByText('Unrelated theme story')).toBeNull()
    expect(screen.queryByText('Direct mention, no theme')).toBeNull()
  })

  it('saves a whole-book item from the composer', async () => {
    const user = userEvent.setup()
    mount()
    await user.click(screen.getByRole('button', { name: /New watch item/i }))
    await user.type(screen.getByPlaceholderText(/US chip export rules/i), 'Rate path')
    await user.click(screen.getByRole('button', { name: /Save item/i }))
    await waitFor(() => expect(saveScanItem).toHaveBeenCalled())
    expect(saveScanItem.mock.calls[0]![0]).toMatchObject({
      title: 'Rate path',
      symbols: [],
    })
  })
})

describe('InvestAnalysisPage — SWOT', () => {
  it('renders the quadrant for a thesised holding', async () => {
    const user = userEvent.setup()
    mount({ theses: [thesis()] })
    await user.click(screen.getByRole('button', { name: 'SHOP' }))
    expect(screen.getByText('Merchant attach rate')).toBeInTheDocument()
    expect(screen.getAllByText('Strengths').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Threats').length).toBeGreaterThan(0)
  })

  it('counts the untracked overflow instead of silently dropping symbols', () => {
    /* The section hides until at least one thesis exists — the nudge is
       for the holdings beside it. */
    mount({
      theses: [thesis()],
      positions: ['AAA', 'BBB', 'CCC', 'DDD', 'EEE', 'FFF'].map((symbol, i) => ({
        id: `p${i}`,
        accountId: 'a1',
        assetClass: 'equity' as const,
        symbol,
        name: symbol,
        quantity: 1,
        avgCost: 10,
        currency: 'CAD',
        lastPrice: 10,
        lastPriceAt: '2026-02-01T00:00:00Z',
        targetWeightPct: null,
      })),
    })
    expect(
      screen.getByText(/Track a thesis for AAA, BBB, CCC, DDD and 2 more first/),
    ).toBeInTheDocument()
  })
})

describe('InvestAnalysisPage — pending suggestions', () => {
  const pendingGoal = {
    id: 'sug-g1',
    user_id: 'u1',
    surface: 'invest',
    kind: 'goal',
    title: 'Cap concentration — no position above 30%',
    payload: {
      detail_en: 'Your largest position is 27% of the book — a cap keeps it honest.',
      seed: { metric: 'max_weight_pct', op: 'lte', target: 30, title: 'Cap concentration' },
    },
    source: 'rule',
    dedupe_key: 'goal:max_weight_pct',
    status: 'pending',
    resolved_at: null,
    resolved_action: null,
    created_at: '2026-02-01T00:00:00Z',
  }

  it('turns a goal suggestion into a row only on accept', async () => {
    const user = userEvent.setup()
    loadPendingSuggestions.mockResolvedValue([pendingGoal])
    const { refresh } = mount()
    await waitFor(() =>
      expect(screen.getByText(/Cap concentration/)).toBeInTheDocument(),
    )
    expect(saveGoal).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: /Set the goal/i }))
    await waitFor(() => expect(saveGoal).toHaveBeenCalled())
    expect(saveGoal.mock.calls[0]![0]).toMatchObject({
      metric: 'max_weight_pct',
      op: 'lte',
      target: 30,
    })
    expect(resolveSuggestion).toHaveBeenCalledWith('sug-g1', 'accepted', 'added')
    expect(refresh).toHaveBeenCalled()
  })

  it('dismisses a suggestion without writing anything', async () => {
    const user = userEvent.setup()
    loadPendingSuggestions.mockResolvedValue([pendingGoal])
    mount()
    await waitFor(() =>
      expect(screen.getByText(/Cap concentration/)).toBeInTheDocument(),
    )
    await user.click(screen.getByRole('button', { name: /Dismiss/i }))
    await waitFor(() =>
      expect(resolveSuggestion).toHaveBeenCalledWith('sug-g1', 'dismissed', 'dismissed'),
    )
    expect(saveGoal).not.toHaveBeenCalled()
  })

  it('tags a scan suggestion with its direction', async () => {
    loadPendingSuggestions.mockResolvedValue([
      {
        ...pendingGoal,
        id: 'sug-s1',
        kind: 'scan',
        title: 'US-China technology trade restrictions',
        payload: {
          title: 'US-China technology trade restrictions',
          note: 'Export curbs could disrupt AMAT, AMD, ARM.',
          theme: 'geopolitical',
          direction: 'headwind',
          symbols: ['AMAT', 'AMD', 'ARM'],
        },
      },
      /* A malformed direction renders no tag rather than an invented one. */
      {
        ...pendingGoal,
        id: 'sug-s2',
        kind: 'scan',
        title: 'Mystery factor',
        payload: { title: 'Mystery factor', direction: 'sideways' },
      },
    ])
    mount()
    await waitFor(() =>
      expect(screen.getByText(/US-China technology/)).toBeInTheDocument(),
    )
    expect(screen.getByText('Headwind')).toBeInTheDocument()
    expect(screen.queryByText('sideways')).not.toBeInTheDocument()
  })

  it('saves Tally’s named scenario on accept — and skips a name twin', async () => {
    const user = userEvent.setup()
    const pendingScenario = {
      ...pendingGoal,
      id: 'sug-st1',
      kind: 'stress_scenario',
      title: 'Stress-test what matters — SHOP is 80% of your book',
      payload: {
        detail_en: 'Saves "SHOP -25%" to your scenario list.',
        name: 'SHOP -25%',
        shocks: [{ match: 'SHOP', pct: -25 }],
      },
      dedupe_key: 'stress:SHOP:-25',
    }
    loadPendingSuggestions.mockResolvedValue([pendingScenario])
    const { refresh } = mount()
    await waitFor(() =>
      expect(screen.getByText(/Stress-test what matters/)).toBeInTheDocument(),
    )
    await user.click(screen.getByRole('button', { name: /Save it/i }))
    await waitFor(() => expect(saveStressScenario).toHaveBeenCalled())
    expect(saveStressScenario.mock.calls[0]![0]).toEqual({
      name: 'SHOP -25%',
      shocks: [{ match: 'SHOP', pct: -25 }],
    })
    expect(resolveSuggestion).toHaveBeenCalledWith('sug-st1', 'accepted', 'added')
    expect(refresh).toHaveBeenCalled()

    /* A scenario with the same normalized name already saved → the accept
       resolves the row without a second write. */
    vi.clearAllMocks()
    loadPendingSuggestions.mockResolvedValue([pendingScenario])
    mount({
      stressScenarios: [
        {
          id: 'sc1',
          name: 'shop -25%',
          shocks: [],
          createdAt: '2026-01-01T00:00:00Z',
        },
      ],
    })
    await waitFor(() =>
      expect(screen.getAllByText(/Stress-test what matters/).length).toBeGreaterThan(0),
    )
    await user.click(screen.getAllByRole('button', { name: /Save it/i })[0]!)
    await waitFor(() =>
      expect(resolveSuggestion).toHaveBeenCalledWith('sug-st1', 'accepted', 'added'),
    )
    expect(saveStressScenario).not.toHaveBeenCalled()
  })
})
