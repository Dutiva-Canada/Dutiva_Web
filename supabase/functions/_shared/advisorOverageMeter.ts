/**
 * Stripe Billing Meter event for an Advisor reply billed as commercial overage.
 * Best-effort: a meter failure must not cost the user the reply they already
 * received. The SQL cap (ai_advisor_overage_months) is the hard bound.
 */

export async function reportAdvisorOverageMeter(input: {
  stripeCustomerId: string
  secretKey: string
  eventName: string
  fetchImpl?: typeof fetch
}): Promise<{ ok: boolean; reason?: string }> {
  const eventName = input.eventName.trim()
  const customerId = input.stripeCustomerId.trim()
  if (!eventName || !customerId) {
    return { ok: false, reason: 'missing meter event name or customer' }
  }

  const fetchImpl = input.fetchImpl ?? fetch
  try {
    const res = await fetchImpl('https://api.stripe.com/v1/billing/meter_events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        event_name: eventName,
        'payload[stripe_customer_id]': customerId,
        'payload[value]': '1',
      }).toString(),
    })
    if (!res.ok) {
      const text = await res.text()
      return { ok: false, reason: `stripe ${res.status}: ${text.slice(0, 200)}` }
    }
    return { ok: true }
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) }
  }
}
