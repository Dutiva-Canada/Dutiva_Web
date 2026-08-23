import { describe, expect, it, vi, beforeEach } from 'vitest'

const maybeSingle = vi.fn()
const eq = vi.fn(() => ({ maybeSingle, select: vi.fn(() => ({ maybeSingle })) }))
const select = vi.fn(() => ({ eq }))
const update = vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(() => ({ maybeSingle })) })) }))

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({ select, update })),
  },
}))

describe('signingReminderSettingsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('clamps and returns reminder days on get', async () => {
    maybeSingle.mockResolvedValueOnce({ data: { signing_reminder_days: 7 }, error: null })
    const { getSigningReminderDays } = await import('./signingReminderSettingsApi')
    await expect(getSigningReminderDays('org-1')).resolves.toBe(7)
  })

  it('defaults to 3 when missing', async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    const { getSigningReminderDays } = await import('./signingReminderSettingsApi')
    await expect(getSigningReminderDays('org-1')).resolves.toBe(3)
  })
})
