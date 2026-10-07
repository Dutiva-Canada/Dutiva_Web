import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetInvestReactionThrottle, sendInvestReaction } from './chatApi'

/* The reaction throttle is a floor between model calls — a skipped call
   resolves reply:null and the page stays quiet. In the test env supabase
   is unset, so a real transport attempt rejects; reaching the transport at
   all is itself the signal that the throttle let the call through. */
describe('sendInvestReaction throttle', () => {
  beforeEach(() => {
    resetInvestReactionThrottle()
  })

  it('lets the first call through and quiets the next inside the window', async () => {
    await expect(
      sendInvestReaction({ type: 'watch_added', symbol: 'VFV' }, 'en'),
    ).rejects.toThrow()
    /* Throttled: resolves quietly instead of reaching for the function. */
    await expect(
      sendInvestReaction({ type: 'order_queued', symbol: 'XEQT', side: 'buy', quantity: 5 }, 'en'),
    ).resolves.toEqual({ reply: null, assistantId: null })
  })

  it('reacts again once the window has passed', async () => {
    vi.useFakeTimers()
    try {
      await expect(
        sendInvestReaction({ type: 'watch_added', symbol: 'VFV' }, 'en'),
      ).rejects.toThrow()
      vi.setSystemTime(Date.now() + 120_000)
      /* Past the floor — the call reaches the transport again. */
      await expect(
        sendInvestReaction({ type: 'order_queued', symbol: 'XEQT', side: 'buy', quantity: 5 }, 'en'),
      ).rejects.toThrow()
    } finally {
      vi.useRealTimers()
    }
  })
})
