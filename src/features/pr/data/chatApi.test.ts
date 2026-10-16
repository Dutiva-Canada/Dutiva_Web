import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isUsageLimited, resetPrReactionThrottle, sendPrReaction } from './chatApi'

/* The 429 surfaces differently by transport — the SSE path throws an Error
   with the status in its message, invokeEdgeFn throws FunctionsHttpError
   carrying the Response. Either shape must read as the usage limit. */
describe('isUsageLimited', () => {
  it('reads the stream transport error', () => {
    expect(isUsageLimited(new Error('pr-ai 429'))).toBe(true)
    expect(isUsageLimited(new Error('pr-ai 502'))).toBe(false)
  })

  it('reads a FunctionsHttpError-style context', () => {
    expect(isUsageLimited({ context: { status: 429 } })).toBe(true)
    expect(isUsageLimited({ context: { status: 503 } })).toBe(false)
    expect(isUsageLimited(null)).toBe(false)
    expect(isUsageLimited('oops')).toBe(false)
  })
})

/* The reaction throttle is a floor between model calls — a skipped call
   resolves reply:null and the page stays quiet. In the test env supabase
   is unset, so a real transport attempt rejects; reaching the transport at
   all is itself the signal that the throttle let the call through. */
describe('sendPrReaction throttle', () => {
  beforeEach(() => {
    resetPrReactionThrottle()
  })

  it('lets the first call through and quiets the next inside the window', async () => {
    await expect(
      sendPrReaction({ type: 'mention_logged', title: 'Gazette piece' }, 'en'),
    ).rejects.toThrow()
    /* Throttled: resolves quietly instead of reaching for the function. */
    await expect(
      sendPrReaction({ type: 'content_saved', title: 'Op-ed' }, 'en'),
    ).resolves.toEqual({ reply: null, assistantId: null })
  })

  it('reacts again once the window has passed', async () => {
    vi.useFakeTimers()
    try {
      await expect(
        sendPrReaction({ type: 'mention_logged', title: 'Gazette piece' }, 'en'),
      ).rejects.toThrow()
      vi.setSystemTime(Date.now() + 120_000)
      /* Past the floor — the call reaches the transport again. */
      await expect(
        sendPrReaction({ type: 'content_saved', title: 'Op-ed' }, 'en'),
      ).rejects.toThrow()
    } finally {
      vi.useRealTimers()
    }
  })
})
