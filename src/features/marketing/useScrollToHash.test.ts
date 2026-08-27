import { describe, expect, it, vi } from 'vitest'
import { scrollToHash } from './useScrollToHash'

describe('scrollToHash', () => {
  it('scrolls the named element into view', () => {
    const el = document.createElement('section')
    el.id = 'product'
    const spy = vi.fn()
    el.scrollIntoView = spy
    document.body.append(el)

    expect(scrollToHash('#product')).toBe(true)
    expect(spy).toHaveBeenCalledWith({ block: 'start' })

    el.remove()
  })

  it('returns false when the hash target is missing', () => {
    expect(scrollToHash('#no-such-section')).toBe(false)
  })
})
