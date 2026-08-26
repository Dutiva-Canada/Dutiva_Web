/**
 * Stripe secret keys go into an Authorization header. Deno fetch rejects
 * header values that are not ByteStrings (newlines, quotes, a BOM, or other
 * control characters from a dashboard paste). Checkout was 500ing on live
 * because of that, not because the price ids were wrong.
 *
 * Restricted keys (`rk_live_` / `rk_test_`) are valid for Checkout Sessions
 * and must be accepted — Stripe recommends them over `sk_` for production.
 */

const STRIPE_SECRET_RE = /^(?:sk|rk)_(?:live|test)_[A-Za-z0-9]+$/

export function readStripeSecretKey(raw: string | undefined | null): string | null {
  if (!raw) return null
  const cleaned = raw
    .replace(/^\uFEFF/, '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^Bearer\s+/i, '')
    .replace(/[\u0000-\u001F\u007F\u00A0\u1680\u2000-\u200D\u2028\u2029\u202F\u205F\u3000\uFEFF]/g, '')
    .trim()
  if (STRIPE_SECRET_RE.test(cleaned)) return cleaned
  const embedded = cleaned.match(/(?:sk|rk)_(?:live|test)_[A-Za-z0-9]+/)
  return embedded ? embedded[0] : null
}

/** Prefix + length only — never the rest of the key. */
export function stripeSecretDiagnostic(raw: string | undefined | null): {
  present: boolean
  length: number
  prefix: string
} {
  const value = raw ?? ''
  const printable = value.replace(/[^\x20-\x7E]/g, '')
  return {
    present: value.length > 0,
    length: value.length,
    prefix: printable.trim().replace(/^["']/, '').slice(0, 8),
  }
}
