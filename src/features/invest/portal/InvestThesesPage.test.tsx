/**
 * /invest/theses — the cards render the sweep's persisted verdict
 * (status + per-rule reads + the posture line), the composer carries the
 * story + two signal-only condition zones, and pending 'thesis'
 * suggestions open a pre-seeded composer that resolves on save.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import { InvestDataContext } from '../data/InvestDataContext'
import type { InvestState } from '../data/api'
import type { InvestThesis } from '../data/types'
import { InvestThesesPage } from './InvestThesesPage'

const saveThesis = vi.fn().mockResolvedValue(undefined)
const deleteThesis = vi.fn().mockResolvedValue(undefined)
const draftThesis = vi.fn()
const loadPendingSuggestions = vi.fn().mockResolvedValue([])
const resolveSuggestion = vi.fn().mockResolvedValue(undefined)

vi.mock('../data/api', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../data/api')>()
  return {
    ...mod,
    saveThesis: (...a: unknown[]) => saveThesis(...a),
    deleteThesis: (...a: unknown[]) => deleteThesis(...a),
    draftThesis: (...a: unknown[]) => draftThesis(...a),
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

function thesis(over: Partial<InvestThesis> = {}): InvestThesis {
  return {
    id: 't1',
    assetClass: 'equity',
    symbol: 'SHOP',
    name: 'Shopify',
    thesis: 'Shopify keeps compounding merchant solutions.',
    intent: 'core',
    breakRules: [],
    driftRules: [],
    swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
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
            <InvestThesesPage />
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
})

describe('InvestThesesPage — cards', () => {
  it('renders the sweep verdict: status pill, story, posture, condition reads', async () => {
    mount({
      theses: [
        thesis({
          status: 'drifting',
          lastEvaluatedAt: new Date(Date.now() - 3600_000).toISOString(),
          evalDetail: {
            fired_break: 0,
            fired_drift: 1,
            action_en: 'Fraying — hold and watch the flagged conditions.',
            action_fr: 'Éraflure — conserver en surveillant les conditions signalées.',
            rules: [
              {
                zone: 'break',
                ident: 'b1',
                title: 'Down 30% from cost',
                metric: 'unrealized_gain_pct',
                fired: false,
                value: 20,
              },
              {
                zone: 'drift',
                ident: 'd1',
                title: 'Under the 50-day average',
                metric: 'vs_ma50',
                fired: true,
                value: -6.2,
              },
            ],
          },
        }),
      ],
    })
    expect(screen.getByText('SHOP')).toBeInTheDocument()
    expect(screen.getByText('Drifting')).toBeInTheDocument()
    expect(screen.getByText(/keeps compounding merchant solutions/)).toBeInTheDocument()
    expect(
      screen.getByText(/Fraying — hold and watch the flagged conditions/),
    ).toBeInTheDocument()
    /* Both zones label their conditions; the fired one is the readout. */
    expect(screen.getByText('Breaks the thesis')).toBeInTheDocument()
    expect(screen.getByText('Early warning')).toBeInTheDocument()
    expect(screen.getByText('Down 30% from cost')).toBeInTheDocument()
    expect(screen.getByText('Under the 50-day average')).toBeInTheDocument()
    expect(screen.getByText(/Last read \+20%/)).toBeInTheDocument()
    expect(screen.getByText(/Last read −6\.2%|Last read -6\.2%/)).toBeInTheDocument()
    expect(screen.getByText(/Checked /)).toBeInTheDocument()
  })

  it('says "not evaluated yet" on a fresh thesis with no sweep behind it', () => {
    mount({ theses: [thesis()] })
    expect(screen.getByText(/Not evaluated yet/)).toBeInTheDocument()
    expect(screen.getByText('On track')).toBeInTheDocument()
  })

  it('shows the empty state with no theses', () => {
    mount()
    expect(screen.getByText(/No theses yet/)).toBeInTheDocument()
  })
})

describe('InvestThesesPage — composer', () => {
  it('lists untracked holdings as candidates and saves the claim', async () => {
    const user = userEvent.setup()
    const { refresh } = mount()
    await user.click(screen.getByRole('button', { name: /New thesis/i }))
    const select = screen.getByLabelText('Symbol')
    expect(select).toBeInTheDocument()
    await user.selectOptions(select, 'equity:SHOP')
    await user.type(
      screen.getByLabelText('The thesis'),
      'Merchant solutions compound.',
    )
    await user.click(screen.getByRole('button', { name: /Save thesis/i }))
    await waitFor(() => expect(saveThesis).toHaveBeenCalled())
    expect(saveThesis.mock.calls[0]![0]).toMatchObject({
      assetClass: 'equity',
      symbol: 'SHOP',
      intent: 'core',
      thesis: 'Merchant solutions compound.',
    })
    expect(refresh).toHaveBeenCalled()
  })

  it('restores the writer\u2019s version when a landed draft is undone', async () => {
    const user = userEvent.setup()
    draftThesis.mockResolvedValue({
      suggestionId: 'sug-draft1',
      draft: { thesis: 'Tally wrote this.', intent: 'growth', breakRules: [], driftRules: [] },
    })
    mount()
    await user.click(screen.getByRole('button', { name: /New thesis/i }))
    await user.selectOptions(screen.getByLabelText('Symbol'), 'equity:SHOP')
    await user.type(screen.getByLabelText('The thesis'), 'My own claim.')
    await user.type(
      screen.getByLabelText('Tell Tally the story'),
      'A long enough story for Tally to draft from.',
    )
    await user.click(screen.getByRole('button', { name: /Draft it/i }))
    /* The draft replaces the fields. */
    await waitFor(() =>
      expect(screen.getByLabelText('The thesis')).toHaveValue('Tally wrote this.'),
    )
    expect(screen.getByRole('button', { name: 'Growth' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await user.click(screen.getByRole('button', { name: /Restore my version/i }))
    /* Undo brings the writer's text and intent back. */
    expect(screen.getByLabelText('The thesis')).toHaveValue('My own claim.')
    expect(screen.getByRole('button', { name: 'Core' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    /* The reverted draft's queue row stays pending — the save resolves nothing. */
    await user.click(screen.getByRole('button', { name: /Save thesis/i }))
    await waitFor(() => expect(saveThesis).toHaveBeenCalled())
    expect(resolveSuggestion).not.toHaveBeenCalled()
  })

  it('hides the order-proposal action — thesis conditions only observe', async () => {
    const user = userEvent.setup()
    mount()
    await user.click(screen.getByRole('button', { name: /New thesis/i }))
    await user.selectOptions(screen.getByLabelText('Symbol'), 'equity:SHOP')
    /* Add one condition to each zone, expand it, and check the seg is gone. */
    const addButtons = screen.getAllByRole('button', { name: /Add rule/i })
    for (const b of addButtons.slice(0, 2)) await user.click(b)
    expect(screen.queryByText(/propose an order/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Propose order/i })).not.toBeInTheDocument()
  })

  it('arms a two-tap discard on a dirty composer; clean exits on one tap', async () => {
    const user = userEvent.setup()
    mount()
    /* Clean composer — Cancel exits immediately. */
    await user.click(screen.getByRole('button', { name: /New thesis/i }))
    expect(screen.getByRole('heading', { name: 'New thesis' })).toBeInTheDocument()
    await user.click(
      screen.getAllByRole('button', { name: 'Cancel' })[0]!,
    )
    expect(screen.getByText(/No theses yet/)).toBeInTheDocument()
    /* Dirty composer — first Cancel arms, second exits. */
    await user.click(screen.getByRole('button', { name: /New thesis/i }))
    await user.type(screen.getByLabelText('The thesis'), 'A claim worth keeping.')
    await user.click(
      screen.getAllByRole('button', { name: 'Cancel' })[0]!,
    )
    /* Still in the composer, now armed. */
    expect(
      screen.getAllByRole('button', { name: /Discard changes\? Click again/i }).length,
    ).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'New thesis' })).toBeInTheDocument()
    await user.click(
      screen.getAllByRole('button', { name: /Discard changes\? Click again/i })[0]!,
    )
    expect(screen.getByText(/No theses yet/)).toBeInTheDocument()
  })
})

describe('InvestThesesPage — suggestions', () => {
  const pendingThesis = {
    id: 'sug-t1',
    user_id: 'u1',
    surface: 'invest',
    kind: 'thesis',
    title: 'SHOP has no thesis — track what would change your mind',
    payload: {
      detail_en: 'A thesis names the story and the conditions that break it.',
      asset_class: 'equity',
      symbol: 'SHOP',
      name: 'Shopify',
      seed: {
        thesis: '',
        intent: 'core',
        break_rules: [
          {
            type: 'signal',
            metric: 'unrealized_gain_pct',
            op: 'lt',
            value: -30,
            title: 'Position down 30% from cost',
            severity: 'alert',
          },
        ],
        drift_rules: [
          {
            type: 'signal',
            metric: 'vs_ma50',
            op: 'lt',
            value: -5,
            title: '5% under the 50-day average',
            severity: 'insight',
          },
        ],
      },
    },
    source: 'rule',
    dedupe_key: 'thesis:equity:SHOP',
    status: 'pending',
    resolved_at: null,
    resolved_action: null,
    created_at: '2026-02-01T00:00:00Z',
  }

  it('opens a seeded composer from Start tracking and resolves on save', async () => {
    const user = userEvent.setup()
    loadPendingSuggestions.mockResolvedValue([pendingThesis])
    mount()
    await waitFor(() =>
      expect(screen.getByText(/has no thesis/)).toBeInTheDocument(),
    )
    await user.click(screen.getByRole('button', { name: /Start tracking/i }))
    /* Composer opens seeded — SHOP picked, both zones carry the seed. */
    expect(screen.getByLabelText('Symbol')).toHaveValue('equity:SHOP')
    expect(screen.getByText('Position down 30% from cost')).toBeInTheDocument()
    expect(screen.getByText('5% under the 50-day average')).toBeInTheDocument()
    await user.type(screen.getByLabelText('The thesis'), 'The story.')
    await user.click(screen.getByRole('button', { name: /Save thesis/i }))
    await waitFor(() => expect(saveThesis).toHaveBeenCalled())
    expect(resolveSuggestion).toHaveBeenCalledWith('sug-t1', 'accepted', 'added')
  })

  it('Draft with Tally drafts from position facts and reloads the row', async () => {
    const user = userEvent.setup()
    /* After the draft call the queue holds the supersede-mode replacement —
       same dedupe key, seed now carrying the claim. */
    const draftedRow = {
      ...pendingThesis,
      id: 'sug-d1',
      title: 'SHOP thesis',
      payload: {
        asset_class: 'equity',
        symbol: 'SHOP',
        name: 'Shopify',
        description: 'Holding 10 SHOP …',
        seed: {
          thesis: 'Merchant solutions keep compounding as Shop Pay wins share.',
          intent: 'growth',
          break_rules: pendingThesis.payload.seed.break_rules,
          drift_rules: pendingThesis.payload.seed.drift_rules,
        },
      },
    }
    loadPendingSuggestions
      .mockResolvedValueOnce([pendingThesis])
      .mockResolvedValue([draftedRow])
    draftThesis.mockResolvedValue({
      suggestionId: 'sug-d1',
      draft: {
        thesis: 'Merchant solutions keep compounding as Shop Pay wins share.',
        intent: 'growth',
        breakRules: [],
        driftRules: [],
      },
    })
    mount()
    await waitFor(() =>
      expect(screen.getByText(/has no thesis/)).toBeInTheDocument(),
    )
    await user.click(screen.getByRole('button', { name: /Draft with Tally/i }))
    /* The brief is auto-built from the position — symbol + cost + qty. */
    await waitFor(() => expect(draftThesis).toHaveBeenCalled())
    const call = draftThesis.mock.calls[0]![0] as { symbol: string; description: string }
    expect(call.symbol).toBe('SHOP')
    expect(call.description).toMatch(/10 SHOP.*average cost 100/)
    /* The row reloads as a draft — claim + condition counts. */
    await waitFor(() =>
      expect(screen.getByText(/Tally’s draft/)).toBeInTheDocument(),
    )
    expect(
      screen.getByText(/Merchant solutions keep compounding/),
    ).toBeInTheDocument()
    expect(screen.getByText(/1 break · 1 drift/)).toBeInTheDocument()
    /* Start tracking opens the composer seeded with the drafted claim. */
    await user.click(screen.getByRole('button', { name: /Start tracking/i }))
    expect(screen.getByLabelText('The thesis')).toHaveValue(
      'Merchant solutions keep compounding as Shop Pay wins share.',
    )
    /* The strip's "Tally's draft" tag survives into the composer — the
       review surface keeps the provenance marker. */
    expect(
      screen.getByText(/Tally drafted the claim and its conditions/),
    ).toBeInTheDocument()
  })
})
