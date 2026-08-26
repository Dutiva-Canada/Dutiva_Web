import { afterEach, describe, expect, it } from 'vitest'
import { peekPendingCheckout, setPendingCheckout, takePendingCheckout } from './pendingCheckout'

describe('pendingCheckout', () => {
  afterEach(() => {
    sessionStorage.clear()
  })

  it('stores a paid plan and peeks without clearing', () => {
    setPendingCheckout('growth')
    expect(peekPendingCheckout()).toBe('growth')
    expect(peekPendingCheckout()).toBe('growth')
  })

  it('ignores the free plan', () => {
    setPendingCheckout('free')
    expect(peekPendingCheckout()).toBeNull()
  })

  it('takePendingCheckout clears storage', () => {
    setPendingCheckout('starter')
    expect(takePendingCheckout()).toBe('starter')
    expect(peekPendingCheckout()).toBeNull()
    expect(takePendingCheckout()).toBeNull()
  })
})
