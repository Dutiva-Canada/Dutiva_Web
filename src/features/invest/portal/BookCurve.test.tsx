import { beforeEach, describe, expect, it, vi } from 'vitest'
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

function snap(asOf: string, bookValue: number, currency = 'CAD'): InvestBookSnapshot {
  return {
    id: asOf,
    asOf,
    accountId: null,
    bookValue,
    cash: 0,
    invested: bookValue,
    currency,
  }
}

function mount(
  snapshots: InvestBookSnapshot[],
  cashEvents: Parameters<typeof BookCurve>[0]['cashEvents'] = [],
  fx: Parameters<typeof BookCurve>[0]['fx'] = null,
  benchmarks: Parameters<typeof BookCurve>[0]['benchmarks'] = [],
) {
  return render(
    <LangProvider>
      <BookCurve
        snapshots={snapshots}
        cashEvents={cashEvents}
        accounts={[]}
        fx={fx}
        benchmarks={benchmarks}
      />
    </LangProvider>,
  )
}

/* The chart-reads pref is real localStorage — keep tests isolated. */
beforeEach(() => localStorage.clear())

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

  it('lets Tally read the window — direction plus the deepest dip', () => {
    /* +10% end-to-end with a −8.3% peak-to-trough inside it. */
    mount([
      snap('2026-01-01', 10_000),
      snap('2026-01-15', 12_000),
      snap('2026-02-01', 11_000),
    ])
    expect(document.querySelector('.sb-tally-read')?.textContent).toMatch(
      /up \+10\.0% over the window — the deepest dip was −8\.3%/,
    )
  })

  it('keeps Tally silent when there is no curve to read', () => {
    mount([snap('2026-01-01', 10_000)])
    expect(document.querySelector('.sb-tally-read')).toBeNull()
  })

  it('converts a foreign-currency mark instead of drawing a phantom crash', () => {
    /* Live case: 23,937.64 CAD then 15,794.32 USD reads −34% raw but is
       ≈ −6.2% once the USD mark is converted to CAD (1 CAD = 0.7033 USD). */
    const fx = { date: '2026-01-02', rates: { CAD: 1, USD: 0.7033 } }
    mount(
      [snap('2026-01-01', 23_937.64), snap('2026-01-02', 15_794.32, 'USD')],
      [],
      fx,
    )
    const change = document.querySelector('.sb-curve-stat strong')
    expect(change?.textContent).toBe('−6.2%')
  })

  it('drops a mark it cannot convert rather than plotting it at face value', () => {
    mount([snap('2026-01-01', 10_000), snap('2026-01-02', 9_000, 'USD')])
    expect(document.querySelector('.sb-empty')).not.toBeNull()
  })

  it('excludes a deposit posted on the first mark\'s own day from the flow window', () => {
    /* timestamptz 'T09:00' sorts after the bare date — it must not slip in. */
    mount(
      [snap('2026-01-01', 10_000), snap('2026-02-01', 9_000)],
      [
        {
          id: 'e1',
          accountId: 'a1',
          kind: 'deposit',
          amount: 1_000,
          currency: 'CAD',
          occurredAt: '2026-01-01T09:00:00.000Z',
          note: '',
          createdAt: '2026-01-01T09:00:00.000Z',
        },
      ],
    )
    const change = document.querySelector('.sb-curve-stat strong')
    expect(change?.textContent).toBe('−10.0%')
  })

  it('backs out a deposit inside the window so flows read as flows, not performance', () => {
    mount(
      [snap('2026-01-01', 10_000), snap('2026-02-01', 11_500)],
      [
        {
          id: 'e1',
          accountId: 'a1',
          kind: 'deposit',
          amount: 1_000,
          currency: 'CAD',
          occurredAt: '2026-01-15T12:00:00.000Z',
          note: '',
          createdAt: '2026-01-15T12:00:00.000Z',
        },
      ],
    )
    const change = document.querySelector('.sb-curve-stat strong')
    expect(change?.textContent).toBe('+5.0%')
  })

  it('suppresses the dip stat when it restates the change on a monotone window', () => {
    mount([snap('2026-01-01', 10_000), snap('2026-02-01', 9_000)])
    const stats = [...document.querySelectorAll('.sb-curve-stat')].map((s) => s.textContent)
    expect(stats.filter((t) => t?.includes('Deepest dip'))).toHaveLength(0)
    expect(document.querySelector('.sb-tally-read')?.textContent).toContain('never below the start')
  })

  it('hides the range pills while every range shows the same marks', () => {
    mount([snap('2026-01-01', 10_000), snap('2026-01-02', 9_000)])
    expect(document.querySelector('.sb-seg')).toBeNull()
  })

  it('keeps the range pills once the marks span enough days to differ', () => {
    mount([snap('2025-01-01', 10_000), snap('2026-01-02', 9_000)])
    expect(document.querySelector('.sb-seg')).not.toBeNull()
  })

  it('renders the benchmark chip and rebased note when closes exist', () => {
    /* Book +10%, benchmark +5% over the same window → +5.0 pp vs XEQT. */
    mount(
      [snap('2026-01-01', 10_000), snap('2026-02-01', 11_000)],
      [],
      null,
      [
        { symbol: 'XEQT.TO', date: '2026-01-01', close: 40 },
        { symbol: 'XEQT.TO', date: '2026-01-31', close: 42 },
      ],
    )
    expect(document.body.textContent).toContain('vs XEQT')
    expect(document.body.textContent).toContain('+5.0 pp')
    expect(document.body.textContent).toContain('XEQT rebased to your first mark')
  })

  it('carries the last close across days the index did not print', () => {
    /* Sunday mark sees Friday's close — no invented weekend price. */
    mount(
      [snap('2026-01-02', 10_000), snap('2026-01-05', 11_000)],
      [],
      null,
      [{ symbol: 'XEQT.TO', date: '2026-01-02', close: 40 }],
    )
    expect(document.body.textContent).toContain('vs XEQT')
    /* Index flat over the window, book +10% → +10.0 pp. */
    expect(document.body.textContent).toContain('+10.0 pp')
  })

  it('draws no benchmark chrome when the series has no usable closes', () => {
    mount([snap('2026-01-01', 10_000), snap('2026-02-01', 11_000)])
    expect(document.body.textContent).not.toContain('vs XEQT')
    /* One covered day is a point, not a window — the note names the
       series but no out/under-performance chip can be claimed. */
    mount(
      [snap('2026-01-01', 10_000), snap('2026-02-01', 11_000)],
      [],
      null,
      [{ symbol: 'XEQT.TO', date: '2026-02-01', close: 42 }],
    )
    expect(document.body.textContent).not.toContain('vs XEQT')
    expect(document.body.textContent).not.toContain(' pp')
  })

  it('reads a one-day span as a first day, not a window verdict', () => {
    mount([snap('2026-01-01', 10_000), snap('2026-01-02', 9_400)])
    expect(document.querySelector('.sb-tally-read')?.textContent).toContain(
      'across its first day on the books',
    )
  })
})
