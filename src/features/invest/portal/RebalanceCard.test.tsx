import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LangProvider } from '@/i18n/LangProvider'
import { RebalanceCard } from './RebalanceCard'
import type { InvestPosition } from '../data/types'

vi.mock('../data/api', () => ({
  createOrder: vi.fn().mockResolvedValue(undefined),
  setPositionTargetWeight: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('./investPrefs', () => ({ readOrderMode: () => 'paper' }))

const { setPositionTargetWeight } = await import('../data/api')

function position(over: Partial<InvestPosition> = {}): InvestPosition {
  return {
    id: 'p1',
    accountId: 'a1',
    assetClass: 'equity',
    symbol: 'SHOP',
    name: 'Shopify',
    quantity: 10,
    avgCost: 80,
    currency: 'CAD',
    lastPrice: 100,
    lastPriceAt: '2026-01-01T00:00:00Z',
    targetWeightPct: null,
    ...over,
  }
}

function mount(positions: InvestPosition[]) {
  const run = vi.fn(async (fn: () => Promise<void>) => {
    await fn()
  })
  render(
    <LangProvider>
      <RebalanceCard
        positions={positions}
        snapshots={[]}
        accounts={[{ id: 'a1', name: 'TFSA' }]}
        cashTotal={0}
        bookCcy="CAD"
        fx={null}
        busy={false}
        run={run}
      />
    </LangProvider>,
  )
  return { run }
}

beforeEach(() => vi.clearAllMocks())

describe('RebalanceCard', () => {
  it('orders rows by drift so the most off-target line leads', () => {
    mount([
      position({ id: 'p1', symbol: 'AAA', lastPrice: 10, quantity: 5, targetWeightPct: 10 }),
      position({ id: 'p2', symbol: 'BBB', lastPrice: 100, quantity: 9, targetWeightPct: 50 }),
      position({ id: 'p3', symbol: 'CCC', lastPrice: 10, quantity: 5, targetWeightPct: 20 }),
    ])
    const rows = screen.getAllByRole('row').slice(1)
    expect(rows[0]).toHaveTextContent('BBB')
  })

  it('leaves edit mode when a blurred target is out of range — no dead input', async () => {
    const user = userEvent.setup()
    const { run } = mount([position({ targetWeightPct: 25 })])
    /* The target cell's trigger carries the symbol for a11y. */
    await user.click(screen.getByRole('button', { name: /25/ }))
    const input = screen.getByRole('spinbutton')
    await user.clear(input)
    /* type=number can't hold letters — 150% is the reachable invalid. */
    await user.type(input, '150')
    await user.tab() /* blur — invalid input must cancel, not stick */
    expect(screen.queryByRole('spinbutton')).toBeNull()
    expect(run).not.toHaveBeenCalled()
    expect(setPositionTargetWeight).not.toHaveBeenCalled()
  })

  it('saves a valid target on Enter and escapes without saving', async () => {
    const user = userEvent.setup()
    const { run } = mount([position()])
    await user.click(screen.getByRole('button', { name: /set a target|set/i }))
    const input = screen.getByRole('spinbutton')
    await user.type(input, '40{Enter}')
    expect(run).toHaveBeenCalled()
    expect(setPositionTargetWeight).toHaveBeenCalledWith('p1', 40)
  })
})
