import { describe, expect, it, vi } from 'vitest'
import { advisorPackGrantFromSession, grantAdvisorPackEntitlements } from './advisorPack'
import type { AdvisorPackDbClient } from './advisorPack'
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

describe('grantAdvisorPackEntitlements', () => {
  const grant = {
    userId: 'user-1',
    packSize: 50 as const,
    checkoutSessionId: 'cs_test_pack_1',
  }

  function client(handlers: Record<string, { data: unknown; error: { message: string } | null }>) {
    const calls: { fn: string; params: Record<string, unknown> }[] = []
    const db: AdvisorPackDbClient = {
      rpc(fn, params) {
        calls.push({ fn, params })
        const result = handlers[fn] ?? { data: null, error: { message: `unexpected ${fn}` } }
        return Promise.resolve(result)
      },
    }
    return { db, calls }
  }

  it('grants the user pack and skips org when none resolves', async () => {
    const { db, calls } = client({
      grant_ai_advisor_pack: { data: { granted: true }, error: null },
    })
    const resolve = vi.fn(async () => null)

    await expect(grantAdvisorPackEntitlements(db, grant, resolve)).resolves.toEqual({
      ok: true,
      userGranted: true,
      orgGranted: false,
      orgId: null,
    })
    expect(resolve).toHaveBeenCalledWith('user-1')
    expect(calls.map((c) => c.fn)).toEqual(['grant_ai_advisor_pack'])
  })

  it('also grants the org pack when a billing org resolves', async () => {
    const { db, calls } = client({
      grant_ai_advisor_pack: { data: { granted: true }, error: null },
      grant_ai_advisor_org_pack: { data: { granted: true, credit_id: 'c1' }, error: null },
    })

    await expect(grantAdvisorPackEntitlements(db, grant, async () => 'org-9')).resolves.toEqual({
      ok: true,
      userGranted: true,
      orgGranted: true,
      orgId: 'org-9',
    })
    expect(calls).toEqual([
      {
        fn: 'grant_ai_advisor_pack',
        params: {
          p_user_id: 'user-1',
          p_pack_size: 50,
          p_stripe_checkout_id: 'cs_test_pack_1',
        },
      },
      {
        fn: 'grant_ai_advisor_org_pack',
        params: {
          p_organization_id: 'org-9',
          p_pack_size: 50,
          p_stripe_checkout_id: 'cs_test_pack_1',
          p_purchaser_user_id: 'user-1',
        },
      },
    ])
  })

  it('treats duplicate org pack as success (idempotent checkout id)', async () => {
    const { db } = client({
      grant_ai_advisor_pack: { data: { granted: false, reason: 'duplicate' }, error: null },
      grant_ai_advisor_org_pack: { data: { granted: false, reason: 'duplicate' }, error: null },
    })

    await expect(
      grantAdvisorPackEntitlements(db, grant, async () => 'org-9'),
    ).resolves.toMatchObject({ ok: true, orgGranted: true })
  })

  it('fails closed when the user pack RPC errors', async () => {
    const { db } = client({
      grant_ai_advisor_pack: { data: null, error: { message: 'boom' } },
    })

    await expect(grantAdvisorPackEntitlements(db, grant, async () => 'org-9')).resolves.toEqual({
      ok: false,
      reason: 'boom',
    })
  })
})
