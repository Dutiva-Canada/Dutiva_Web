import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LangProvider } from '@/i18n/LangProvider'
import { AllocationDonut } from './AllocationDonut'
import type { InvestPosition } from '../data/types'

/* Recharts measures layout — jsdom has none, so the pie never draws, but
   the legend rows render regardless. */
vi.mock('recharts', async (importOriginal) => {
  const mod = await importOriginal<typeof import('recharts')>()
  return {
    ...mod,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => children,
  }
})

function position(over: Partial<InvestPosition> = {}): InvestPosition {
  return {
    id: Math.random().toString(36).slice(2),
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

function mount(positions: InvestPosition[], cashTotal = 0) {
  return render(
    <LangProvider>
      <AllocationDonut
        positions={positions}
        snapshots={[]}
        cashTotal={cashTotal}
        bookCcy="CAD"
        fx={null}
      />
    </LangProvider>,
  )
}

describe('AllocationDonut', () => {
  it('omits the cash legend row when cash is zero — no 0.0% noise', () => {
    mount([position()], 0)
    expect(screen.queryByText(/^Cash/)).toBeNull()
  })

  it('lists the cash share when the book holds cash', () => {
    /* $1000 position + $1000 cash → the legend shows Cash at 50.0%. */
    mount([position()], 1000)
    const items = screen.getAllByRole('listitem')
    expect(items.some((li) => li.textContent?.includes('Cash'))).toBe(true)
    expect(items.some((li) => li.textContent?.includes('50.0%'))).toBe(true)
  })

  it('names the largest position in the headline — never the Other aggregate', () => {
    mount(
      [
        position({ symbol: 'AMD', lastPrice: 300, quantity: 2 }),
        /* Seven 1-share $50 rows collapse into an "Other" slice bigger
           than AMD — the headline must still name the real holding. */
        ...Array.from({ length: 7 }, (_, i) =>
          position({ symbol: `S${i}`, lastPrice: 95, quantity: 1 }),
        ),
      ],
      0,
    )
    /* The headline paragraph names the largest real holding, even when
       the "Other" aggregate outweighs it — not the aggregate's label. */
    const headline = document.querySelector('.sb-helper')
    expect(headline?.textContent).toMatch(/AMD is \d/)
    expect(headline?.textContent).not.toMatch(/Other/)
  })

  it('shows the empty state when nothing is priced', () => {
    mount([position({ lastPrice: null })], 0)
    expect(screen.getByText(/positions|position/i)).toBeInTheDocument()
  })
})
