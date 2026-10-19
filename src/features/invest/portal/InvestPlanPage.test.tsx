/**
 * /invest/plan — the book as one reviewed document. The objective and
 * notes edit in place on invest_user_profile (one column per save, same
 * clobber-safe contract as the mandate editor); every other section is a
 * read-only projection of live state, so fixtures assert the projection,
 * not a second source of truth.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LangContext, type LangContextValue } from '@/i18n/context'
import { AuthContext, type AuthContextValue } from '@/features/app/auth/authContext'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import { InvestDataContext, EMPTY_INVEST_STATE } from '../data/InvestDataContext'
import type { InvestState } from '../data/api'
import type { Lang } from '@/i18n/core'
import { EMPTY_SWOT } from '../data/types'
import { InvestPlanPage } from './InvestPlanPage'

const upsert = vi.fn().mockResolvedValue({ error: null })

/* One from() chain covers the whole-row select and the column-scoped
   upserts — each spec steers the row through PROFILE_ROW. */
const PROFILE_ROW = {
  risk_tolerance: 'balanced',
  horizon: 'long',
  goal: 'growth',
  experience: null,
  answer_style: null,
  sectors: ['technology'],
  exclusions: [],
  mandate: 'Long-term compounding.',
  plan_objective: null as string | null,
  plan_notes: null as string | null,
  plan_reviewed_at: null as string | null,
}
/* `let` — a spec can test the no-profile-row path (the holder who has
   never opened Settings) without a second mock. */
let profileRow: typeof PROFILE_ROW | null = PROFILE_ROW
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: profileRow }),
        }),
      }),
      upsert: (...a: unknown[]) => upsert(...a),
    }),
  },
}))

/* FX stays deterministic — 'no rate on file' like the portal suite. */
vi.mock('../data/fx', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../data/fx')>()),
  loadFxRates: vi.fn(async () => null),
}))

function langValue(lang: Lang): LangContextValue {
  return {
    lang,
    setLang: vi.fn(),
    catalogue: {},
    t: ((key: string) => key) as LangContextValue['t'],
    L: (en: string, fr: string) => (lang === 'fr' ? fr : en),
    x: (m: { en: string; fr: string }) => (lang === 'fr' ? m.fr : m.en),
  }
}

const STATE: InvestState = {
  ...EMPTY_INVEST_STATE,
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
    {
      id: 'p2',
      accountId: 'acc1',
      assetClass: 'equity',
      symbol: 'ARM',
      name: 'Arm Holdings',
      quantity: 4,
      avgCost: 150,
      currency: 'CAD',
      lastPrice: null,
      lastPriceAt: null,
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
  theses: [
    {
      id: 't1',
      assetClass: 'equity',
      symbol: 'SHOP',
      name: 'Shopify',
      thesis: 'Payments attach keeps compounding.',
      intent: 'core',
      breakRules: [],
      driftRules: [],
      swot: EMPTY_SWOT,
      status: 'healthy',
      evalDetail: null,
      lastEvaluatedAt: null,
      reaffirmedAt: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
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
  orders: [
    {
      id: 'o1',
      accountId: 'acc1',
      signalId: null,
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
      summary: '',
      status: 'ok',
    },
  ],
  watchlist: [
    { id: 'w1', assetClass: 'crypto', symbol: 'BTC', name: 'Bitcoin', createdAt: '2026-01-19T00:00:00Z' },
  ],
  goals: [
    {
      id: 'g1',
      title: 'Grow the book to $40k',
      detail: '',
      metric: 'book_value',
      op: 'gte',
      target: 40000,
      baseline: 25000,
      deadline: '2027-01-01',
      status: 'on_track',
      evalDetail: null,
      lastEvaluatedAt: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ],
  scanItems: [
    {
      id: 'w1',
      theme: 'geopolitical',
      direction: 'headwind',
      title: 'US-China trade restrictions',
      note: 'Export rules keep widening.',
      symbols: ['SHOP', 'ARM'],
      lastReviewedAt: '2026-01-15T00:00:00Z',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ],
}

function mount(lang: Lang = 'en', state: Partial<InvestState> = STATE) {
  const refresh = vi.fn().mockResolvedValue(undefined)
  const auth: AuthContextValue = {
    status: 'signed-in',
    session: { user: { id: 'u1', email: 'c@example.com' } } as never,
    authorized: null,
    signInWithEmail: vi.fn(),
    verifyEmailCode: vi.fn(),
    signOut: vi.fn().mockResolvedValue(undefined),
    refreshAuthorization: vi.fn(),
  }
  render(
    <LangContext value={langValue(lang)}>
      <AuthContext.Provider value={auth}>
        <ToastsProvider>
          <MemoryRouter>
            <InvestDataContext.Provider
              value={{ state: { ...EMPTY_INVEST_STATE, ...state }, loading: false, error: false, refresh }}
            >
              <InvestPlanPage />
            </InvestDataContext.Provider>
          </MemoryRouter>
        </ToastsProvider>
      </AuthContext.Provider>
    </LangContext>,
  )
  return { refresh }
}

beforeEach(() => {
  vi.clearAllMocks()
  profileRow = PROFILE_ROW
  PROFILE_ROW.plan_objective = null
  PROFILE_ROW.plan_notes = null
  PROFILE_ROW.plan_reviewed_at = null
})

describe('InvestPlanPage — document', () => {
  it('assembles every section over live state', async () => {
    mount()
    await waitFor(() => expect(screen.getByText('Investment plan')).toBeInTheDocument())
    expect(screen.getByText('Never reviewed')).toBeInTheDocument()
    /* Every section heading lands, in document order of importance. */
    for (const h of [
      'Objective',
      'The investor',
      'Goals',
      'Holdings',
      'Standing rules',
      'Watch board',
      'Waiting on you',
      'Review',
      'Notes to self',
    ]) {
      expect(screen.getByRole('heading', { name: h })).toBeInTheDocument()
    }
    /* Live rows — position + thesis, goal, strategy, scan item. */
    expect(screen.getByText('SHOP')).toBeInTheDocument()
    expect(screen.getByText(/Payments attach keeps compounding/)).toBeInTheDocument()
    expect(screen.getByText('Grow the book to $40k')).toBeInTheDocument()
    expect(screen.getByText('Dip watcher')).toBeInTheDocument()
    expect(screen.getByText('US-China trade restrictions')).toBeInTheDocument()
    /* The honest gap — a holding with no filed thesis names the gap and
       links to write one, rather than rendering silence. */
    expect(screen.getByText('ARM')).toBeInTheDocument()
    expect(screen.getByText(/No thesis filed/)).toBeInTheDocument()
    /* Watchlist trails the holdings as a footnote, not a section. */
    expect(screen.getByText('BTC', { exact: false })).toBeInTheDocument()
    /* Waiting on you — one queued draft + one new signal. */
    expect(screen.getByText(/1 draft order to review/)).toBeInTheDocument()
    expect(screen.getByText(/1 new signal/)).toBeInTheDocument()
    /* The standing disclaimer rides the document's foot — required on
       paper too, since print hides the shell footer. */
    expect(screen.getByText(/not investment advice/i)).toBeInTheDocument()
    /* Cash is printed — it silently inflates the weight denominator, so
       leaving it out would make the weights look wrong. */
    expect(screen.getByText(/Cash on hand — \$25,000\.00/)).toBeInTheDocument()
    /* One account → no "· Paper book" tag on every row (the positions
       table's own rule: the label earns its width once rows can differ). */
    expect(screen.queryByText(/Paper book/)).toBeNull()
    /* The goal meta carries its operator — ≥ 100% and ≤ 10% are different
       promises. */
    expect(screen.getByText(/target ≥ 40,000 CAD/)).toBeInTheDocument()
    /* Money is currency-styled, not raw decimals — no "$2,383.418". */
    expect(screen.getByText(/\$1,200\.00/)).toBeInTheDocument()
  })

  it('orders holdings by book value, not array order', async () => {
    /* ARM precedes SHOP in the array; SHOP's larger book value ($1,200 vs
       $800) must still win the document's top row. */
    mount('en', {
      positions: [
        {
          id: 'p2',
          accountId: 'acc1',
          assetClass: 'equity',
          symbol: 'ARM',
          name: 'Arm Holdings',
          quantity: 4,
          avgCost: 150,
          currency: 'CAD',
          lastPrice: 200,
          lastPriceAt: '2026-01-20T00:00:00Z',
          targetWeightPct: null,
        },
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
    })
    await waitFor(() => expect(screen.getByText('SHOP')).toBeInTheDocument())
    const rows = document.querySelectorAll('.sb-plan-row strong')
    const symbols = [...rows].map((el) => el.textContent)
    const shopIdx = symbols.findIndex((s) => s?.includes('SHOP'))
    const armIdx = symbols.findIndex((s) => s?.includes('ARM'))
    expect(shopIdx).toBeGreaterThanOrEqual(0)
    expect(armIdx).toBeGreaterThan(shopIdx)
  })

  it('materializes the row locally when a first stamp lands on no profile', async () => {
    profileRow = null
    const user = userEvent.setup()
    mount()
    await waitFor(() => expect(screen.getByText('Never reviewed')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Mark as reviewed' }))
    await waitFor(() => expect(upsert).toHaveBeenCalled())
    /* The upsert creates the row server-side; local state must match or
       the stamp keeps saying "Never reviewed" after a successful write. */
    await waitFor(() => expect(screen.getByText(/Reviewed /)).toBeInTheDocument())
  })

  it('renders an honest empty book rather than blank cards', async () => {
    mount('en', EMPTY_INVEST_STATE)
    await waitFor(() => expect(screen.getByText('Investment plan')).toBeInTheDocument())
    expect(screen.getByText(/Not written yet/)).toBeInTheDocument()
    expect(screen.getByText(/No goals yet/)).toBeInTheDocument()
    expect(screen.getByText(/Nothing held yet/)).toBeInTheDocument()
    expect(screen.getByText(/No strategies yet/)).toBeInTheDocument()
    expect(screen.getByText(/Nothing watched outside the book/)).toBeInTheDocument()
    expect(screen.getByText(/Nothing waiting/)).toBeInTheDocument()
    expect(screen.getByText(/No sweep yet/)).toBeInTheDocument()
    expect(screen.getByText(/Nothing noted yet/)).toBeInTheDocument()
  })
})

describe('InvestPlanPage — edits', () => {
  it('writes the objective as its own column, not a whole-row overwrite', async () => {
    const user = userEvent.setup()
    mount()
    const objective = await screen.findByRole('heading', { name: 'Objective' })
    const card = objective.closest('.sb-card') as HTMLElement
    await user.click(within(card).getByRole('button', { name: 'Edit' }))
    const area = within(card).getByRole('textbox')
    await user.type(area, 'Fund the kids’ school without touching the house.')
    await user.click(within(card).getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(upsert).toHaveBeenCalled())
    expect(upsert.mock.calls[0]![0]).toMatchObject({
      user_id: 'u1',
      plan_objective: 'Fund the kids’ school without touching the house.',
    })
    /* Single-column upsert — a concurrent mandate edit on Profile can't
       be reverted by a stale snapshot. */
    expect(upsert.mock.calls[0]![0]).not.toHaveProperty('plan_notes')
    expect(upsert.mock.calls[0]![0]).not.toHaveProperty('mandate')
  })

  it('clears notes to null when the holder empties the field', async () => {
    PROFILE_ROW.plan_notes = 'Trimmed AMD after the rally.'
    const user = userEvent.setup()
    mount()
    const notes = await screen.findByRole('heading', { name: 'Notes to self' })
    const card = notes.closest('.sb-card') as HTMLElement
    expect(within(card).getByText('Trimmed AMD after the rally.')).toBeInTheDocument()
    await user.click(within(card).getByRole('button', { name: 'Edit' }))
    const area = within(card).getByRole('textbox')
    await user.clear(area)
    await user.click(within(card).getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(upsert).toHaveBeenCalled())
    expect(upsert.mock.calls[0]![0]).toMatchObject({ user_id: 'u1', plan_notes: null })
  })
})

describe('InvestPlanPage — review stamp', () => {
  it('records a read-through without touching the prose fields', async () => {
    const user = userEvent.setup()
    mount()
    await waitFor(() => expect(screen.getByText('Never reviewed')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Mark as reviewed' }))
    await waitFor(() => expect(upsert).toHaveBeenCalled())
    const patch = upsert.mock.calls[0]![0] as Record<string, unknown>
    expect(patch.user_id).toBe('u1')
    expect(typeof patch.plan_reviewed_at).toBe('string')
    expect(patch).not.toHaveProperty('plan_objective')
    await waitFor(() => expect(screen.getByText(/Reviewed /)).toBeInTheDocument())
  })

  it('shows the stored review date when the row carries one', async () => {
    PROFILE_ROW.plan_reviewed_at = '2026-01-15T12:00:00Z'
    mount()
    await waitFor(() => expect(screen.getByText(/Reviewed Jan 15, 2026/)).toBeInTheDocument())
  })
})

describe('InvestPlanPage — French', () => {
  it('renders the document in French with the shared vocabulary', async () => {
    mount('fr')
    await waitFor(() => expect(screen.getByText('Plan d’investissement')).toBeInTheDocument())
    expect(screen.getByText('Jamais révisé')).toBeInTheDocument()
    for (const h of [
      'Objectif',
      'L’investisseur',
      'Objectifs',
      'Positions',
      'Règles permanentes',
      'Tableau de veille',
      'En attente',
      'Revue',
      'Notes personnelles',
    ]) {
      expect(screen.getByRole('heading', { name: h })).toBeInTheDocument()
    }
    /* Vocabulary contract — watchlist, draft order, sweep. */
    expect(screen.getByText('Liste de suivi', { exact: false })).toBeInTheDocument()
    expect(screen.getByText(/Encaisse/)).toBeInTheDocument()
    expect(screen.getByText(/1 brouillon d’ordre à revoir/)).toBeInTheDocument()
    expect(screen.getByText(/nouveau signal/)).toBeInTheDocument()
    expect(screen.getByText(/balaie chaque jour/)).toBeInTheDocument()
  })
})
