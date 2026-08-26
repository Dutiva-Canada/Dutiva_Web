import { describe, expect, it } from 'vitest'
import { advisorPackGrantFromSession } from './advisorPack'
import { getCheckoutProfilePatch } from './billing-event'

describe('advisorPackGrantFromSession', () => {
  const packSession = {
    id: 'cs_test_pack_1',
    client_reference_id: 'user-1',
    metadata: { kind: 'advisor_pack', pack: '50', user_id: 'user-1' },
  }

  it('reads a 50-reply pack checkout', () => {
    expect(advisorPackGrantFromSession(packSession)).toEqual({
      userId: 'user-1',
      packSize: 50,
      checkoutSessionId: 'cs_test_pack_1',
    })
  })

  it('reads a 200-reply pack checkout', () => {
    expect(
      advisorPackGrantFromSession({
        id: 'cs_test_pack_2',
        metadata: { kind: 'advisor_pack', pack: '200', user_id: 'user-9' },
      }),
    ).toEqual({
      userId: 'user-9',
      packSize: 200,
      checkoutSessionId: 'cs_test_pack_2',
    })
  })

  it('ignores subscription checkouts', () => {
    expect(
      advisorPackGrantFromSession({
        id: 'cs_test_sub',
        metadata: { plan: 'growth', user_id: 'user-1', billing_interval: 'monthly' },
      }),
    ).toBeNull()
  })

  it('rejects a pack size that is not a SKU', () => {
    expect(
      advisorPackGrantFromSession({
        id: 'cs_bad',
        metadata: { kind: 'advisor_pack', pack: '80', user_id: 'user-1' },
      }),
    ).toBeNull()
  })

  it('must not be fed to getCheckoutProfilePatch — that would set plan to free', () => {
    const patch = getCheckoutProfilePatch(packSession)
    expect(patch.updates.plan).toBe('free')
    expect(advisorPackGrantFromSession(packSession)).not.toBeNull()
  })
})
