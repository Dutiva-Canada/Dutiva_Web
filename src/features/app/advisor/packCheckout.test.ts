import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadWithInvoke(
  invoke: (name: string, opts: { body: unknown }) => Promise<{ data: unknown; error: unknown }>,
) {
  vi.doMock('@/lib/supabaseClient', () => ({ supabase: { functions: { invoke } } }))
  vi.resetModules()
  return import('./packCheckout')
}

describe('startAdvisorPackCheckout', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  it('invokes the pack checkout function and returns the Stripe url', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { url: 'https://checkout.stripe.com/c/pay/cs_test' },
      error: null,
    })
    const { startAdvisorPackCheckout } = await loadWithInvoke(invoke)
    await expect(startAdvisorPackCheckout(50)).resolves.toEqual({
      kind: 'url',
      url: 'https://checkout.stripe.com/c/pay/cs_test',
    })
    expect(invoke).toHaveBeenCalledWith('create-advisor-pack-checkout', { body: { pack: 50 } })
  })

  it('returns bypass for an internal account', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { bypass: true, message: 'Internal Dutiva accounts skip Advisor reply packs.' },
      error: null,
    })
    const { startAdvisorPackCheckout } = await loadWithInvoke(invoke)
    await expect(startAdvisorPackCheckout(200)).resolves.toMatchObject({ kind: 'bypass' })
  })
})
