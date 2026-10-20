import { beforeEach, describe, expect, it, vi } from 'vitest'

/* The throttle floor only holds on a call that actually landed — the test
   stubs the transport so a successful first send can stamp the slot. */
const invokeMock = vi.hoisted(() => vi.fn())
vi.mock('@/lib/edgeStream', () => ({
  invokeEdgeFn: invokeMock,
  invokeEdgeFnStream: invokeMock,
}))
vi.mock('@/lib/supabaseClient', () => ({ supabase: {} }))

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
   resolves reply:null and the page stays quiet. Reaching the stubbed
   transport at all is the signal that the throttle let the call through. */
describe('sendPrReaction throttle', () => {
  beforeEach(() => {
    resetPrReactionThrottle()
    invokeMock.mockReset().mockResolvedValue({ reply: 'Noted.', assistantId: 'a1' })
  })

  it('lets the first call through and quiets the next inside the window', async () => {
    await expect(
      sendPrReaction({ type: 'mention_logged', title: 'Gazette piece' }, 'en'),
    ).resolves.toEqual({ reply: 'Noted.', assistantId: 'a1' })
    /* Throttled: resolves quietly instead of reaching for the function. */
    await expect(
      sendPrReaction({ type: 'content_saved', title: 'Op-ed' }, 'en'),
    ).resolves.toEqual({ reply: null, assistantId: null })
    expect(invokeMock).toHaveBeenCalledTimes(1)
  })

  it('reacts again once the window has passed', async () => {
    vi.useFakeTimers()
    try {
      await expect(
        sendPrReaction({ type: 'mention_logged', title: 'Gazette piece' }, 'en'),
      ).resolves.toEqual({ reply: 'Noted.', assistantId: 'a1' })
      vi.setSystemTime(Date.now() + 120_000)
      /* Past the floor — the call reaches the transport again. */
      await expect(
        sendPrReaction({ type: 'content_saved', title: 'Op-ed' }, 'en'),
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
      sendPrReaction({ type: 'mention_logged', title: 'Gazette piece' }, 'en'),
    ).rejects.toThrow()
    /* Not throttled — a lost reaction must not mute the next one. */
    await expect(
      sendPrReaction({ type: 'content_saved', title: 'Op-ed' }, 'en'),
    ).resolves.toEqual({ reply: 'Noted.', assistantId: 'a1' })
    expect(invokeMock).toHaveBeenCalledTimes(2)
  })
})
