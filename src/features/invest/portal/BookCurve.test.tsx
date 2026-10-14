import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { LangProvider } from '@/i18n/LangProvider'
import { BookCurve } from './BookCurve'
import type { InvestBookSnapshot } from '../data/types'

/* Recharts measures layout — jsdom has none; the stat line and the
   sr-only series summary render regardless. */
vi.mock('recharts', async (importOriginal) => {
  const mod = await importOriginal<typeof import('recharts')>()
  return {
    ...mod,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => children,
  }
})

function snap(asOf: string, bookValue: number): InvestBookSnapshot {
  return {
    id: asOf,
    asOf,
    accountId: null,
    bookValue,
    cash: 0,
    invested: bookValue,
    currency: 'CAD',
  }
}

function mount(snapshots: InvestBookSnapshot[]) {
  return render(
    <LangProvider>
      <BookCurve snapshots={snapshots} cashEvents={[]} accounts={[]} fx={null} />
    </LangProvider>,
  )
}

describe('BookCurve', () => {
  it('renders a near-flat change as neutral 0.0% — sign, color and digits agree', () => {
    /* +0.04% → must not render "+0.0%" in green. */
    mount([snap('2026-01-01', 10_000), snap('2026-02-01', 10_004)])
    const change = document.querySelector('.sb-curve-stat strong')
    expect(change?.textContent).toBe('0.0%')
    expect((change as HTMLElement)?.style.color).toBe('var(--sb-body)')
  })

  it('renders a negative change in danger with the typographic minus', () => {
    mount([snap('2026-01-01', 10_000), snap('2026-02-01', 9_000)])
    const change = document.querySelector('.sb-curve-stat strong')
    expect(change?.textContent).toBe('−10.0%')
    expect((change as HTMLElement)?.style.color).toBe('var(--sb-danger)')
  })

  it('exposes a screen-reader series summary for the hidden chart', () => {
    mount([snap('2026-01-01', 10_000), snap('2026-02-01', 11_000)])
    const alt = document.querySelector('.sr-only')
    expect(alt?.textContent).toContain('$10,000')
    expect(alt?.textContent).toContain('$11,000')
  })

  it('shows the empty state with fewer than two marks', () => {
    mount([snap('2026-01-01', 10_000)])
    expect(document.querySelector('.sb-empty')).not.toBeNull()
  })
})
