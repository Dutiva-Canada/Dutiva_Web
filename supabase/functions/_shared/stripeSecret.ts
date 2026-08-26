/**
 * Stripe secret keys go into an Authorization header. Deno fetch rejects
 * header values that are not ByteStrings (newlines, quotes, a BOM, or other
 * control characters from a dashboard paste). Checkout was 500ing on live
 * because of that, not because the price ids were wrong.
 */

const STRIPE_SECRET_RE = /^sk_(?:live|test)_[A-Za-z0-9]+$/

export function readStripeSecretKey(raw: string | undefined | null): string | null {
  if (!raw) return null
  const cleaned = raw
    .replace(/^\uFEFF/, '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/[\u0000-\u001F\u007F\u200B-\u200D\uFEFF]/g, '')
    .trim()
  return STRIPE_SECRET_RE.test(cleaned) ? cleaned : null
}
