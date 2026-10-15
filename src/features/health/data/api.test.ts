import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetHealthReactionThrottle, sendHealthReaction } from './api'

/* The transport is mocked — the throttle semantics under test are which
   calls REACH it, not what it does. A truthy client so requireSupabase
   passes; invokeEdgeFn decides each call's fate. */
vi.mock('@/lib/supabaseClient', () => ({ supabase: { __test: true } }))
vi.mock('@/lib/edgeStream', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/edgeStream')>()),
  invokeEdgeFn: vi.fn(),
  invokeEdgeFnStream: vi.fn(),
}))

const { invokeEdgeFn } = await import('@/lib/edgeStream')

/* The reaction throttle is a floor between model calls — a skipped call
   resolves reply:null and the page stays quiet. A call that FAILED must
   hand its slot back: swallowing the next legitimate nudge for 90s on top
   of the lost reaction was the bug this guards. */
describe('sendHealthReaction throttle', () => {
  beforeEach(() => {
    resetHealthReactionThrottle()
    vi.mocked(invokeEdgeFn).mockReset()
  })

  it('quiets the next call inside the window after a success', async () => {
    vi.mocked(invokeEdgeFn).mockResolvedValue({ reply: 'noted', assistantId: 'a1' })
    await expect(
      sendHealthReaction({ type: 'checkin_saved', mood: 3 }, 'en'),
    ).resolves.toEqual({ reply: 'noted', assistantId: 'a1' })
    /* Throttled: resolves quietly instead of reaching for the function. */
    await expect(
      sendHealthReaction({ type: 'habit_marked', habit: 'Walk' }, 'en'),
    ).resolves.toEqual({ reply: null, assistantId: null })
    expect(invokeEdgeFn).toHaveBeenCalledTimes(1)
  })

  it('releases the slot when the call fails — the next one reaches the transport', async () => {
    vi.mocked(invokeEdgeFn).mockRejectedValue(new Error('down'))
    await expect(
      sendHealthReaction({ type: 'habit_marked', habit: 'Walk' }, 'en'),
    ).rejects.toThrow('down')
    /* Not throttled — a lost reaction must not mute the next one. */
    await expect(
      sendHealthReaction({ type: 'checkin_saved', mood: 3 }, 'en'),
    ).rejects.toThrow('down')
    expect(invokeEdgeFn).toHaveBeenCalledTimes(2)
  })

  it('reacts again once the window has passed', async () => {
    vi.mocked(invokeEdgeFn).mockResolvedValue({ reply: 'noted' })
    vi.useFakeTimers()
    try {
      await sendHealthReaction({ type: 'habit_marked', habit: 'Walk' }, 'en')
      vi.setSystemTime(Date.now() + 120_000)
      await sendHealthReaction({ type: 'habit_marked', habit: 'Walk' }, 'en')
      expect(invokeEdgeFn).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })
})
