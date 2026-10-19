/**
 * StressTest panel — the picker row keeps three different behaviors
 * honest: presets run on pick (pressed marks the running one), Custom
 * opens a composer rather than firing, and a saved-scenario pick must
 * not leave a preset visually claiming the result it didn't produce.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LangProvider } from '@/i18n/LangProvider'
import { StressTest } from './StressTest'
import type {
  InvestAccount,
  InvestPosition,
  MarketSnapshot,
  StressScenario,
} from '../data/types'

const saveStressScenario = vi.fn().mockResolvedValue(undefined)
const deleteStressScenario = vi.fn().mockResolvedValue(undefined)
const sendInvestReaction = vi.fn().mockResolvedValue({ reply: null })

vi.mock('../data/api', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../data/api')>()
  return {
    ...mod,
    saveStressScenario: (...a: unknown[]) => saveStressScenario(...a),
    deleteStressScenario: (...a: unknown[]) => deleteStressScenario(...a),
  }
})
vi.mock('../data/chatApi', () => ({
  sendInvestReaction: (...a: unknown[]) => sendInvestReaction(...a),
}))
vi.mock('../data/fx', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../data/fx')>()
  return {
    ...mod,
    loadFxRates: () => Promise.resolve({ date: '2026-03-10', rates: { CAD: 1 } }),
  }
})

const ACCOUNT: InvestAccount = {
  id: 'a1',
  name: 'Paper book',
  kind: 'paper',
  baseCurrency: 'CAD',
  cashBalance: 0,
  status: 'active',
}

const POSITION: InvestPosition = {
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
}

const SNAP: MarketSnapshot = {
  assetClass: 'equity',
  symbol: 'SHOP',
  price: 120,
  dayChangePct: null,
  ma50: null,
  currency: 'CAD',
  source: 'test',
  asOf: '2026-03-10T00:00:00Z',
  quoteName: 'Shopify Inc.',
}

const SAVED: StressScenario = {
  id: 'sc1',
  name: 'SHOP −25%',
  shocks: [{ match: 'SHOP', pct: -25 }],
  createdAt: '2026-01-01T00:00:00Z',
}

function mount(over: Partial<Parameters<typeof StressTest>[0]> = {}) {
  const onScenariosChanged = vi.fn().mockResolvedValue(undefined)
  render(
    <LangProvider>
      <StressTest
        positions={[POSITION]}
        snapshots={[SNAP]}
        strategies={[]}
        theses={[]}
        goals={[]}
        watchSymbols={[]}
        accounts={[ACCOUNT]}
        scenarios={[]}
        onScenariosChanged={onScenariosChanged}
        {...over}
      />
    </LangProvider>,
  )
  return { onScenariosChanged }
}

const pressedButtons = () =>
  screen
    .getAllByRole('button')
    .filter((b) => b.getAttribute('aria-pressed') === 'true')

/* Result-side queries — the preset labels carry percents too, so a bare
   getByText('−10%') would match the button instead of the outcome. */
const results = () =>
  within(document.querySelector('.sb-stress-results') as HTMLElement)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('StressTest — section shell', () => {
  it('puts its heading at page level and the panel in a padded card', () => {
    mount()
    const h = screen.getByRole('heading', { name: 'Stress test' })
    expect(h.closest('.sb-section-head')).not.toBeNull()
    expect(h.closest('.sb-card')).toBeNull()
    expect(document.querySelector('.sb-card.sb-card-pad')).not.toBeNull()
  })

  it('keeps the section idiom on the empty state too', () => {
    mount({ positions: [], snapshots: [] })
    expect(screen.getByRole('heading', { name: 'Stress test' })).toBeInTheDocument()
    expect(screen.getByText(/Add a holding or a watched symbol first/)).toBeInTheDocument()
  })
})

describe('StressTest — picker semantics', () => {
  it('runs a preset on pick and presses only that button', async () => {
    const user = userEvent.setup()
    mount()
    const btn = screen.getByRole('button', { name: /Everything/ })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    await user.click(btn)
    expect(btn).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() =>
      expect(results().getByText('Book under the scenario')).toBeInTheDocument(),
    )
    expect(results().getByText(/[−-]10\s*%/)).toBeInTheDocument()
  })

  it('opens the composer from Custom without running anything', async () => {
    const user = userEvent.setup()
    mount()
    const custom = screen.getByRole('button', { name: 'Custom' })
    expect(custom).toHaveAttribute('aria-expanded', 'false')
    await user.click(custom)
    expect(custom).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByLabelText('Pick a symbol')).toBeInTheDocument()
    /* No scenario fired — no result, and no preset claims one. */
    expect(screen.queryByText('Book under the scenario')).toBeNull()
    expect(pressedButtons()).toHaveLength(0)
  })

  it('unpresses every preset when a saved scenario is the thing running', async () => {
    const user = userEvent.setup()
    mount({ scenarios: [SAVED] })
    await user.click(screen.getByRole('button', { name: /Everything/ }))
    expect(pressedButtons()).toHaveLength(1)
    await user.selectOptions(screen.getByLabelText('Saved scenarios…'), 'sc1')
    await waitFor(() =>
      expect(results().getByText(/[−-]25\s*%/)).toBeInTheDocument(),
    )
    /* The named row is the live scenario — 'Custom' must not pose as it. */
    expect(pressedButtons()).toHaveLength(0)
    expect(screen.queryByLabelText('Pick a symbol')).toBeNull()
  })

  it('shows nothing pressed after the running saved row is deleted', async () => {
    const user = userEvent.setup()
    mount({ scenarios: [SAVED] })
    await user.selectOptions(screen.getByLabelText('Saved scenarios…'), 'sc1')
    await waitFor(() =>
      expect(results().getByText(/[−-]25\s*%/)).toBeInTheDocument(),
    )
    await user.click(screen.getByRole('button', { name: 'Delete saved scenario' }))
    await waitFor(() => expect(deleteStressScenario).toHaveBeenCalledWith('sc1'))
    /* The result stays (the math is still valid) but no preset may
       claim it. */
    expect(pressedButtons()).toHaveLength(0)
  })

  it('runs a custom shock through the composer and offers save after the result', async () => {
    const user = userEvent.setup()
    mount()
    await user.click(screen.getByRole('button', { name: 'Custom' }))
    await user.selectOptions(screen.getByLabelText('Pick a symbol'), 'SHOP')
    await user.type(screen.getByLabelText('Move in percent'), '-15')
    await user.click(screen.getByRole('button', { name: 'Run' }))
    await waitFor(() =>
      expect(results().getByText(/[−-]15\s*%/)).toBeInTheDocument(),
    )
    /* The name-it row trails the result — never precedes it. */
    expect(screen.getByLabelText('Name this scenario')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Name this scenario'), 'SHOP slide')
    await user.click(screen.getByRole('button', { name: 'Save scenario' }))
    await waitFor(() => expect(saveStressScenario).toHaveBeenCalled())
    expect(saveStressScenario.mock.calls[0]![0]).toEqual({
      name: 'SHOP slide',
      shocks: [{ match: 'SHOP', pct: -15 }],
    })
  })
})
