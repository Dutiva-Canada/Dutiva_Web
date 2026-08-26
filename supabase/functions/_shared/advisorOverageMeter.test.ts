import { describe, expect, it, vi } from 'vitest'
import { reportAdvisorOverageMeter } from './advisorOverageMeter'

describe('reportAdvisorOverageMeter', () => {
  it('posts a meter event for one extra Advisor reply', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, text: async () => '' })
    const result = await reportAdvisorOverageMeter({
      stripeCustomerId: 'cus_123',
      secretKey: 'sk_test_abc',
      eventName: 'advisor_reply_overage',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    expect(result).toEqual({ ok: true })
    expect(fetchImpl).toHaveBeenCalledOnce()
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.stripe.com/v1/billing/meter_events')
    expect(init.method).toBe('POST')
    expect(String(init.body)).toContain('event_name=advisor_reply_overage')
    expect(String(init.body)).toContain('payload%5Bstripe_customer_id%5D=cus_123')
    expect(String(init.body)).toContain('payload%5Bvalue%5D=1')
  })

  it('fails closed on a Stripe error without throwing', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'bad meter',
    })
    const result = await reportAdvisorOverageMeter({
      stripeCustomerId: 'cus_123',
      secretKey: 'sk_test_abc',
      eventName: 'advisor_reply_overage',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    expect(result.ok).toBe(false)
    expect(result.reason).toContain('400')
  })

  it('refuses to call Stripe without a customer', async () => {
    const fetchImpl = vi.fn()
    const result = await reportAdvisorOverageMeter({
      stripeCustomerId: '  ',
      secretKey: 'sk_test_abc',
      eventName: 'advisor_reply_overage',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    expect(result.ok).toBe(false)
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})
