import { beforeEach, describe, expect, it, vi } from 'vitest'

/* The throttle floor only holds on a call that actually landed — the test
   stubs the transport so a successful first send can stamp the slot. */
const invokeMock = vi.hoisted(() => vi.fn())
vi.mock('@/lib/edgeStream', () => ({
  invokeEdgeFn: invokeMock,
  invokeEdgeFnStream: invokeMock,
}))
vi.mock('@/lib/supabaseClient', () => ({ supabase: {} }))

import { resetInvestReactionThrottle, sendInvestReaction } from './chatApi'

/* The reaction throttle is a floor between model calls — a skipped call
   resolves reply:null and the page stays quiet. Reaching the stubbed
   transport at all is the signal that the throttle let the call through. */
describe('sendInvestReaction throttle', () => {
  beforeEach(() => {
    resetInvestReactionThrottle()
    invokeMock.mockReset().mockResolvedValue({ reply: 'Noted.', assistantId: 'a1' })
  })

  it('lets the first call through and quiets the next inside the window', async () => {
    await expect(
      sendInvestReaction({ type: 'watch_added', symbol: 'VFV' }, 'en'),
    ).resolves.toEqual({ reply: 'Noted.', assistantId: 'a1' })
    /* Throttled: resolves quietly instead of reaching for the function. */
    await expect(
      sendInvestReaction({ type: 'order_queued', symbol: 'XEQT', side: 'buy', quantity: 5 }, 'en'),
    ).resolves.toEqual({ reply: null, assistantId: null })
    expect(invokeMock).toHaveBeenCalledTimes(1)
  })

  it('reacts again once the window has passed', async () => {
    vi.useFakeTimers()
    try {
      await expect(
        sendInvestReaction({ type: 'watch_added', symbol: 'VFV' }, 'en'),
      ).resolves.toEqual({ reply: 'Noted.', assistantId: 'a1' })
      vi.setSystemTime(Date.now() + 120_000)
      /* Past the floor — the call reaches the transport again. */
      await expect(
        sendInvestReaction({ type: 'order_queued', symbol: 'XEQT', side: 'buy', quantity: 5 }, 'en'),
      ).resolves.toEqual({ reply: 'Noted.', assistantId: 'a1' })
      expect(invokeMock).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('releases the slot when the call fails — the next one reaches the transport', async () => {
    /* A failed call kept the stamped slot — the next legitimate nudge was
       silenced for the full window on top of the lost reaction. */
    invokeMock.mockRejectedValueOnce(new Error('offline'))
    await expect(
      sendInvestReaction({ type: 'watch_added', symbol: 'VFV' }, 'en'),
    ).rejects.toThrow()
    /* Not throttled — a lost reaction must not mute the next one. */
    await expect(
      sendInvestReaction({ type: 'order_queued', symbol: 'XEQT', side: 'buy', quantity: 5 }, 'en'),
    ).resolves.toEqual({ reply: 'Noted.', assistantId: 'a1' })
    expect(invokeMock).toHaveBeenCalledTimes(2)
  })
})
