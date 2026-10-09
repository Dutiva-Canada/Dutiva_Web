import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetHealthReactionThrottle, sendHealthReaction } from './api'

/* The reaction throttle is a floor between model calls — a skipped call
   resolves reply:null and the page stays quiet. In the test env supabase
   is unset, so a real transport attempt rejects; reaching the transport at
   all is itself the signal that the throttle let the call through. */
describe('sendHealthReaction throttle', () => {
  beforeEach(() => {
    resetHealthReactionThrottle()
  })

  it('lets the first call through and quiets the next inside the window', async () => {
    await expect(
      sendHealthReaction({ type: 'habit_marked', habit: 'Walk' }, 'en'),
    ).rejects.toThrow()
    /* Throttled: resolves quietly instead of reaching for the function. */
    await expect(
      sendHealthReaction({ type: 'checkin_saved', mood: 3 }, 'en'),
    ).resolves.toEqual({ reply: null, assistantId: null })
  })

  it('reacts again once the window has passed', async () => {
    vi.useFakeTimers()
    try {
      await expect(
        sendHealthReaction({ type: 'habit_marked', habit: 'Walk' }, 'en'),
      ).rejects.toThrow()
      vi.setSystemTime(Date.now() + 120_000)
      /* Past the floor — the call reaches the transport again. */
      await expect(
        sendHealthReaction({ type: 'habit_marked', habit: 'Walk' }, 'en'),
      ).rejects.toThrow()
    } finally {
      vi.useRealTimers()
    }
  })
})
