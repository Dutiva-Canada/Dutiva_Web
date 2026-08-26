import { describe, expect, it } from 'vitest'
import { readStripeSecretKey } from './stripeSecret'

describe('readStripeSecretKey', () => {
  it('accepts a live secret', () => {
    expect(readStripeSecretKey('sk_live_51AbCdEfGhIjKlMn')).toBe('sk_live_51AbCdEfGhIjKlMn')
  })

  it('strips wrapping quotes, a BOM, and a trailing newline', () => {
    expect(readStripeSecretKey('\uFEFF"sk_test_abc123"\r\n')).toBe('sk_test_abc123')
  })

  it('rejects an empty or non-secret value rather than putting it in a header', () => {
    expect(readStripeSecretKey('')).toBeNull()
    expect(readStripeSecretKey('price_1Tc642IaUuk6cvMQdyd39ZEy')).toBeNull()
    expect(readStripeSecretKey('whsec_notASecretKey')).toBeNull()
  })
})
