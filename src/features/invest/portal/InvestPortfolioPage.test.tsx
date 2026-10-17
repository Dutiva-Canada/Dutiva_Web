/**
 * /invest/portfolio — Tally's portfolio-surface integration: the 'recurring'
 * suggestion strip (accept writes the schedule, dismiss resolves the row)
 * and the quiet-ledger reactions (a recorded deposit tells Tally, best-
 * effort, never blocking the write).
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import { InvestDataContext } from '../data/InvestDataContext'
import type { InvestState } from '../data/api'
import { InvestPortfolioPage } from './InvestPortfolioPage'

const recordCashEvent = vi.fn().mockResolvedValue(undefined)
const saveRecurring = vi.fn().mockResolvedValue(undefined)
const loadPendingSuggestions = vi.fn().mockResolvedValue([])
const resolveSuggestion = vi.fn().mockResolvedValue(undefined)
const sendInvestReaction = vi.fn().mockResolvedValue({ reply: null })

vi.mock('../data/api', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../data/api')>()
  return {
    ...mod,
    recordCashEvent: (...a: unknown[]) => recordCashEvent(...a),
    saveRecurring: (...a: unknown[]) => saveRecurring(...a),
    syncPrices: vi.fn().mockResolvedValue({ ok: true, synced: 0 }),
  }
})
vi.mock('../data/fx', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../data/fx')>()
  return { ...mod, loadFxRates: vi.fn().mockResolvedValue(null) }
})
vi.mock('@/lib/agentQueue', () => ({
  loadPendingSuggestions: (...a: unknown[]) => loadPendingSuggestions(...a),
  resolveSuggestion: (...a: unknown[]) => resolveSuggestion(...a),
}))
vi.mock('../data/chatApi', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../data/chatApi')>()
  return { ...mod, sendInvestReaction: (...a: unknown[]) => sendInvestReaction(...a) }
})
vi.mock('./useInvestHead', () => ({ useInvestHead: vi.fn() }))

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
  positions: [],
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
  cashEvents: [],
  fills: [],
  stressScenarios: [],
  recurring: [],
}

const pendingRecurring = {
  id: 'sug-r1',
  user_id: 'u1',
  surface: 'invest',
  kind: 'recurring',
  title: 'Your deposits already follow a monthly rhythm',
  payload: {
    detail_en: "You've deposited about 500 every month for the last 3 — the schedule card can book the next ones itself.",
    account_id: 'a1',
    amount: 500,
    cadence: 'monthly',
  },
  source: 'rule',
  dedupe_key: 'recurring:a1:monthly:500',
  status: 'pending',
  resolved_at: null,
  resolved_action: null,
  created_at: '2026-02-01T00:00:00Z',
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
            <InvestPortfolioPage />
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

describe('InvestPortfolioPage — recurring suggestion strip', () => {
  it('accept writes the schedule the payload carried, then resolves the row', async () => {
    const user = userEvent.setup()
    loadPendingSuggestions.mockResolvedValue([pendingRecurring])
    const { refresh } = mount()
    await waitFor(() =>
      expect(screen.getByText(/monthly rhythm/)).toBeInTheDocument(),
    )
    expect(saveRecurring).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: /Schedule it/i }))
    await waitFor(() => expect(saveRecurring).toHaveBeenCalled())
    expect(saveRecurring.mock.calls[0]![0]).toMatchObject({
      accountId: 'a1',
      amount: 500,
      cadence: 'monthly',
      currency: 'CAD',
    })
    expect(resolveSuggestion).toHaveBeenCalledWith('sug-r1', 'accepted', 'added')
    expect(refresh).toHaveBeenCalled()
  })

  it('dismiss resolves the row without a write', async () => {
    const user = userEvent.setup()
    loadPendingSuggestions.mockResolvedValue([pendingRecurring])
    mount()
    await waitFor(() =>
      expect(screen.getByText(/monthly rhythm/)).toBeInTheDocument(),
    )
    await user.click(screen.getByRole('button', { name: /Dismiss/i }))
    await waitFor(() =>
      expect(resolveSuggestion).toHaveBeenCalledWith('sug-r1', 'dismissed', 'dismissed'),
    )
    expect(saveRecurring).not.toHaveBeenCalled()
  })

  it('a malformed payload stays pending and writes nothing', async () => {
    const user = userEvent.setup()
    loadPendingSuggestions.mockResolvedValue([
      {
        ...pendingRecurring,
        id: 'sug-bad',
        payload: { account_id: 'ghost-account', amount: 500, cadence: 'monthly' },
      },
    ])
    mount()
    await waitFor(() =>
      expect(screen.getByText(/monthly rhythm/)).toBeInTheDocument(),
    )
    await user.click(screen.getByRole('button', { name: /Schedule it/i }))
    /* The account no longer exists — no write, no resolution. */
    await new Promise((r) => setTimeout(r, 50))
    expect(saveRecurring).not.toHaveBeenCalled()
    expect(resolveSuggestion).not.toHaveBeenCalled()
  })
})

describe('InvestPortfolioPage — ledger reaction', () => {
  it('recording a deposit tells Tally — best-effort, after the write', async () => {
    const user = userEvent.setup()
    mount()
    /* The recurring card renders an Amount field too — scope to the
       ledger card. */
    const ledger = within(
      screen.getByRole('heading', { name: /Cash movements/i }).closest('section')!,
    )
    await user.type(ledger.getByLabelText('Amount'), '250')
    await user.click(ledger.getByRole('button', { name: /Record/i }))
    await waitFor(() => expect(recordCashEvent).toHaveBeenCalled())
    await waitFor(() =>
      expect(sendInvestReaction).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'cash_recorded', kind: 'deposit', amount: 250 }),
        'en',
        expect.any(Function),
      ),
    )
  })
})
