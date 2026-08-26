import { describe, expect, it } from 'vitest'
import { readStripeSecretKey, stripeSecretDiagnostic } from './stripeSecret'

describe('readStripeSecretKey', () => {
  it('accepts a live secret', () => {
    expect(readStripeSecretKey('sk_live_51AbCdEfGhIjKlMn')).toBe('sk_live_51AbCdEfGhIjKlMn')
  })

  it('accepts a live restricted key', () => {
    expect(readStripeSecretKey('rk_live_51AbCdEfGhIjKlMn')).toBe('rk_live_51AbCdEfGhIjKlMn')
  })

  it('strips wrapping quotes, a BOM, Bearer, and a trailing newline', () => {
    expect(readStripeSecretKey('\uFEFFBearer "sk_test_abc123"\r\n')).toBe('sk_test_abc123')
  })

  it('rejects an empty or non-secret value rather than putting it in a header', () => {
    expect(readStripeSecretKey('')).toBeNull()
    expect(readStripeSecretKey('price_1Tc642IaUuk6cvMQdyd39ZEy')).toBeNull()
    expect(readStripeSecretKey('whsec_notASecretKey')).toBeNull()
    expect(readStripeSecretKey('pk_live_51AbCdEfGhIjKlMn')).toBeNull()
  })
})

describe('stripeSecretDiagnostic', () => {
  it('reports prefix and length without the rest of the key', () => {
    expect(stripeSecretDiagnostic('sk_live_SUPERSECRET')).toEqual({
      present: true,
      length: 19,
      prefix: 'sk_live_',
    })
  })
})
