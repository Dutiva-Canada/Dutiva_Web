import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import type { StrategyDraft } from './strategyDraft'
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

function mount(d: StrategyDraft, onTestScan = vi.fn()): { onTestScan: typeof onTestScan } {
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
        strategyNameById={{}}
        fireCount={() => null}
        onChange={() => {}}
        onBack={() => {}}
        onSave={() => {}}
        onDiscard={() => {}}
        onDelete={() => {}}
        onTestScan={onTestScan}
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
      matches: [],
    })
    mount(draft({ scope: { watchlist: false, symbols: ['VFV'] } }), onTestScan)
    await user.click(screen.getByRole('button', { name: /Test scan/i }))
    expect(onTestScan).toHaveBeenCalledTimes(1)
  })
})
