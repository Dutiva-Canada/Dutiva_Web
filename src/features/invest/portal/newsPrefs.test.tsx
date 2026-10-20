import { describe, expect, it, vi, afterEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { usePaywalledPref } from './newsPrefs'
import { NEWS_PAYWALL_PREF } from '@/features/invest/data/newsDedupe'

function Probe() {
  const [show, toggle] = usePaywalledPref()
  return <button onClick={toggle}>{String(show)}</button>
}

/* Storage can throw — blocked site data, private mode, embedded webviews.
   The card's display flag must never take the page down with it. */
describe('usePaywalledPref', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('renders and toggles when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    render(<Probe />)
    expect(screen.getByRole('button').textContent).toBe('false')
    act(() => screen.getByRole('button').click())
    expect(screen.getByRole('button').textContent).toBe('true')
  })

  it('persists the toggle when storage works', () => {
    render(<Probe />)
    act(() => screen.getByRole('button').click())
    expect(localStorage.getItem(NEWS_PAYWALL_PREF)).toBe('1')
  })
})
