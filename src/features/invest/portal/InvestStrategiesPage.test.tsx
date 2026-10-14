/**
 * /invest/strategies — the pending strip routes foreign suggestion kinds
 * (thesis/goal/scan/swot/memory/profile) to their own review surface with
 * an "On <page>" meta line instead of reading them as stale strategies.
 * Navigation only moves the user — the row stays pending until its own
 * page's accept/dismiss acts on it.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import { InvestDataContext, EMPTY_INVEST_STATE } from '../data/InvestDataContext'
import { InvestStrategiesPage } from './InvestStrategiesPage'

const loadPendingSuggestions = vi.fn().mockResolvedValue([])
const resolveSuggestion = vi.fn().mockResolvedValue(undefined)
const saveStrategy = vi.fn().mockResolvedValue(undefined)

vi.mock('../data/api', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../data/api')>()
  return {
    ...mod,
    saveStrategy: (...a: unknown[]) => saveStrategy(...a),
    deleteStrategy: vi.fn(),
    scanNow: vi.fn(),
    testScan: vi.fn(),
  }
})
vi.mock('@/lib/agentQueue', () => ({
  loadPendingSuggestions: (...a: unknown[]) => loadPendingSuggestions(...a),
  resolveSuggestion: (...a: unknown[]) => resolveSuggestion(...a),
}))

const pendingRow = (kind: string, id = `sug-${kind}`) => ({
  id,
  user_id: 'u1',
  surface: 'invest',
  kind,
  title: `${kind} suggestion title`,
  payload: { detail_en: `detail for ${kind}` },
  source: 'rule',
  dedupe_key: `${kind}:x`,
  status: 'pending',
  resolved_at: null,
  resolved_action: null,
  created_at: '2026-02-01T00:00:00Z',
})

function mount(state: Partial<typeof EMPTY_INVEST_STATE> = {}) {
  render(
    <LangProvider>
      <ToastsProvider>
        <MemoryRouter initialEntries={['/invest/strategies']}>
          <InvestDataContext.Provider
            value={{
              state: { ...EMPTY_INVEST_STATE, ...state },
              loading: false,
              error: false,
              refresh: vi.fn(),
            }}
          >
            <Routes>
              <Route path="/invest/strategies" element={<InvestStrategiesPage />} />
              <Route path="/invest/theses" element={<div>theses-page</div>} />
              <Route path="/invest/analysis" element={<div>analysis-page</div>} />
              <Route path="/invest/profile" element={<div>profile-page</div>} />
            </Routes>
          </InvestDataContext.Provider>
        </MemoryRouter>
      </ToastsProvider>
    </LangProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  loadPendingSuggestions.mockResolvedValue([])
})

describe('InvestStrategiesPage — foreign suggestion kinds', () => {
  it('routes a thesis suggestion to the theses page, keeping it pending', async () => {
    const user = userEvent.setup()
    loadPendingSuggestions.mockResolvedValue([pendingRow('thesis')])
    mount()
    await waitFor(() =>
      expect(screen.getByText('thesis suggestion title')).toBeInTheDocument(),
    )
    /* The meta names the destination — not a stale-strategy read. */
    expect(screen.getByText('On Theses')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Theses' }))
    await waitFor(() => expect(screen.getByText('theses-page')).toBeInTheDocument())
    /* A nav click isn't acceptance — resolving here would evict the row
       before the theses strip can serve it. */
    expect(resolveSuggestion).not.toHaveBeenCalled()
  })

  it.each([
    ['goal', 'analysis-page', 'On Analysis'],
    ['scan', 'analysis-page', 'On Analysis'],
    ['swot', 'analysis-page', 'On Analysis'],
    ['memory', 'profile-page', 'On Profile'],
    ['profile', 'profile-page', 'On Profile'],
  ])('routes a %s suggestion to its review surface', async (kind, marker, meta) => {
    const user = userEvent.setup()
    loadPendingSuggestions.mockResolvedValue([pendingRow(kind)])
    mount()
    await waitFor(() => expect(screen.getByText(meta)).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: meta.slice(3) }))
    await waitFor(() => expect(screen.getByText(marker)).toBeInTheDocument())
  })

  it('caps the strip at four rows and expands on demand', async () => {
    const user = userEvent.setup()
    loadPendingSuggestions.mockResolvedValue(
      ['thesis', 'goal', 'scan', 'swot', 'memory', 'profile'].map((k, i) =>
        pendingRow(k, `sug-${i}`),
      ),
    )
    mount()
    await waitFor(() =>
      expect(screen.getByText('thesis suggestion title')).toBeInTheDocument(),
    )
    expect(screen.queryByText('profile suggestion title')).not.toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: /Show all 6 suggestions/i }),
    )
    expect(screen.getByText('profile suggestion title')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Show fewer/i }))
    expect(screen.queryByText('profile suggestion title')).not.toBeInTheDocument()
  })

  it('applies the cadence a day-move rule needs on a slower strategy', async () => {
    const user = userEvent.setup()
    const monthly = {
      id: 'st1',
      name: 'Growth',
      enabled: true,
      scope: { watchlist: false, symbols: ['ASTS'] },
      rules: [],
      notify: { inApp: true, email: false },
      cadence: 'monthly' as const,
      multiMatch: 'each' as const,
      template: '',
    }
    loadPendingSuggestions.mockResolvedValue([
      {
        ...pendingRow('rule_add'),
        payload: {
          strategy_id: 'st1',
          strategy_name: 'Growth',
          cadence: 'daily',
          rule: {
            type: 'signal',
            metric: 'day_change_pct',
            op: 'lt',
            value: -5,
            title: 'Fell 5% today',
            severity: 'alert',
          },
        },
      },
    ])
    mount({ strategies: [monthly] })
    await waitFor(() =>
      expect(screen.getByText('rule_add suggestion title')).toBeInTheDocument(),
    )
    await user.click(screen.getByRole('button', { name: /Add rule/i }))
    await waitFor(() => expect(saveStrategy).toHaveBeenCalled())
    const saved = saveStrategy.mock.calls[0]![0] as {
      cadence: string
      rules: { metric: string }[]
    }
    /* The rule lands AND the strategy moves to daily — a monthly run
       can't catch day moves, and the copy disclosed the switch. */
    expect(saved.cadence).toBe('daily')
    expect(saved.rules).toHaveLength(1)
    expect(saved.rules[0]!.metric).toBe('day_change_pct')
    expect(resolveSuggestion).toHaveBeenCalledWith('sug-rule_add', 'accepted', 'rule_added')
  })
})
