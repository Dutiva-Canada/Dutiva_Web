import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { LangProvider } from '@/i18n/LangProvider'
import { AllocationDonut } from './AllocationDonut'
import type { InvestPosition, InvestThesis } from '../data/types'

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

function mount(positions: InvestPosition[], cashTotal = 0, theses: InvestThesis[] = []) {
  return render(
    <LangProvider>
      <AllocationDonut
        positions={positions}
        snapshots={[]}
        theses={theses}
        cashTotal={cashTotal}
        bookCcy="CAD"
        fx={null}
      />
    </LangProvider>,
  )
}

function thesis(over: Partial<InvestThesis> = {}): InvestThesis {
  return {
    id: 't1',
    assetClass: 'equity',
    symbol: 'SHOP',
    name: 'Shopify',
    thesis: 'compound it',
    intent: 'core',
    breakRules: [],
    driftRules: [],
    swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
    status: 'healthy',
    evalDetail: null,
    lastEvaluatedAt: null,
    reaffirmedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...over,
  }
}

/* The chart-reads pref is real localStorage here — a mute in one test
   must not bleed into the next. */
beforeEach(() => localStorage.clear())

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

  it('lets Tally name an uncovered leader — biggest slice, no thesis', () => {
    mount([position()], 0)
    expect(document.querySelector('.sb-tally-read')?.textContent).toMatch(
      /SHOP leads at 100\.0% — the biggest slice carries no thesis/,
    )
  })

  it('quotes the thesis status when the leader carries one', () => {
    mount([position()], 0, [thesis({ status: 'drifting' })])
    expect(document.querySelector('.sb-tally-read')?.textContent).toMatch(/Fraying/)
  })

  it('reads cash as the biggest slice when it outweighs every position', () => {
    /* $1000 invested vs $1500 cash — cash is strictly the largest share. */
    mount([position()], 1500)
    expect(document.querySelector('.sb-tally-read')?.textContent).toMatch(
      /biggest slice is cash — 60\.0%/,
    )
  })

  it('the × mutes every read — the same pref Settings writes', () => {
    mount([position()], 0)
    expect(document.querySelector('.sb-tally-read')).not.toBeNull()
    fireEvent.click(
      screen.getByRole('button', { name: /Hide Tally’s reads on the charts/i }),
    )
    expect(document.querySelector('.sb-tally-read')).toBeNull()
    expect(localStorage.getItem('dutiva.invest.chartReads')).toBe('off')
  })
})
