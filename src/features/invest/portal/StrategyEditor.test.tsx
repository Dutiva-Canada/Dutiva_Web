import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import type { StrategyDraft } from './strategyDraft'
import type { AgentSuggestion } from '@/lib/agentQueue'
import { StrategyEditor } from './StrategyEditor'

function draft(overrides: Partial<StrategyDraft> = {}): StrategyDraft {
  return {
    id: 's1',
    name: 'Watcher',
    enabled: false,
    cadence: 'weekly',
    scope: { watchlist: true, symbols: [] },
    notify: { inApp: true, email: false },
    multiMatch: 'summary',
    template: 'tpl:blank',
    rules: [],
    ...overrides,
  }
}

function suggestion(over: Partial<AgentSuggestion> = {}): AgentSuggestion {
  return {
    id: 'sug-1',
    user_id: 'u1',
    surface: 'invest',
    kind: 'rule_add',
    title: 'ACME is 40% of your book — flag it above 25%',
    payload: {
      detail_en: 'Adds one rule to "Watcher".',
      strategy_id: 's1',
      strategy_name: 'Watcher',
      rule: {
        type: 'signal',
        metric: 'weight_pct',
        op: 'gt',
        value: 25,
        title: 'Above 25% of book',
        severity: 'alert',
      },
    },
    source: 'rule',
    dedupe_key: 'rule_add:s1:weight_pct:gt:25',
    status: 'pending',
    resolved_at: null,
    resolved_action: null,
    created_at: '2026-01-01T00:00:00Z',
    ...over,
  }
}

function mount(
  d: StrategyDraft,
  onTestScan = vi.fn(),
  extra: {
    suggestions?: AgentSuggestion[]
    onApplySuggestion?: (s: AgentSuggestion) => void
    onDismissSuggestion?: (s: AgentSuggestion) => void
  } = {},
) {
  render(
    <LangProvider>
      <MemoryRouter>
        <StrategyEditor
        draft={d}
        dirty={false}
        busy={false}
        trackedSymbols={[]}
        runs={[]}
        signals={[]}
        snapshots={[]}
        bookCurrency="CAD"
        strategyNameById={{}}
        fireCount={() => null}
        onChange={() => {}}
        onBack={() => {}}
        onSave={() => {}}
        onDiscard={() => {}}
        onDelete={() => {}}
        onTestScan={onTestScan}
        {...extra}
      />
      </MemoryRouter>
    </LangProvider>,
  )
  return { onTestScan }
}

describe('StrategyEditor test scan', () => {
  it('never fires a scan on an empty scope — explains instead of erroring', async () => {
    const user = userEvent.setup()
    const { onTestScan } = mount(draft())
    await user.click(screen.getByRole('button', { name: /Test scan/i }))
    expect(onTestScan).not.toHaveBeenCalled()
    expect(screen.getByText(/Nothing to scan/)).toBeInTheDocument()
  })

  it('runs the dry scan when the scope has symbols', async () => {
    const user = userEvent.setup()
    const onTestScan = vi.fn().mockResolvedValue({
      requestId: 't1',
      symbolsScanned: ['VFV'],
      ruleHits: {},
      signals: 0,
      proposals: 0,
      warnings: [],
      warningDetails: [],
      matches: [],
    })
    mount(draft({ scope: { watchlist: false, symbols: ['VFV'] } }), onTestScan)
    await user.click(screen.getByRole('button', { name: /Test scan/i }))
    expect(onTestScan).toHaveBeenCalledTimes(1)
  })
})

describe('StrategyEditor Tally suggestions', () => {
  it('renders nothing without suggestions', () => {
    mount(draft())
    expect(screen.queryByText(/Tally suggests/i)).not.toBeInTheDocument()
  })

  it('renders the strip and routes Apply/Dismiss to the page', async () => {
    const user = userEvent.setup()
    const s = suggestion()
    const onApply = vi.fn()
    const onDismiss = vi.fn()
    mount(draft(), vi.fn(), {
      suggestions: [s],
      onApplySuggestion: onApply,
      onDismissSuggestion: onDismiss,
    })
    expect(screen.getByText(/Tally suggests/i)).toBeInTheDocument()
    expect(screen.getByText(/40% of your book/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^Apply$/i }))
    expect(onApply).toHaveBeenCalledWith(s)
    await user.click(screen.getByRole('button', { name: /Dismiss/i }))
    expect(onDismiss).toHaveBeenCalledWith(s)
  })
})
