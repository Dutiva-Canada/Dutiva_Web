/**
 * verifyDutivaSignature
 *
 * Verifies an inbound-webhook signature header against a payload using
 * HMAC-SHA-256. WebCrypto only, so the same module runs under Deno
 * (Supabase Edge Functions) and Node 22+ (Vitest). Mirrors the Stripe
 * verifier in ../stripe-webhook/verify-signature.ts — same header shape,
 * same replay window, same constant-time compare.
 *
 *   X-Dutiva-Signature: t=<unix_seconds>,v1=<hex_hmac>
 *
 *   signed_payload = `${timestamp}.${raw_body}`
 *   expected = hex(HMAC_SHA256(signing_secret, signed_payload))
 *   verified iff expected === v1 (constant-time compare)
 *           AND |now - timestamp| <= toleranceSeconds
 *
 * @param payload           Raw request body string (must be unparsed).
 * @param sigHeader         Full `X-Dutiva-Signature` header value.
 * @param secret            Per-integration signing secret from Vault.
 * @param toleranceSeconds  Max accepted clock drift; 300s default.
 * @returns Promise<boolean>
 */

const DEFAULT_TOLERANCE_SECONDS = 300

export async function verifyDutivaSignature(
  payload: string,
  sigHeader: string,
  secret: string,
  toleranceSeconds: number = DEFAULT_TOLERANCE_SECONDS,
): Promise<boolean> {
  if (typeof payload !== 'string' || typeof sigHeader !== 'string' || typeof secret !== 'string') {
    return false
  }
  if (!sigHeader || !secret) return false

  const parts = sigHeader.split(',')
  const ts = parts.find((p) => p.startsWith('t='))?.slice(2)
  const v1 = parts.find((p) => p.startsWith('v1='))?.slice(3)
  if (!ts || !v1) return false

  const tsNum = Number.parseInt(ts, 10)
  if (!Number.isFinite(tsNum)) return false
  const nowSec = Math.floor(Date.now() / 1000)
  if (Math.abs(nowSec - tsNum) > toleranceSeconds) return false

  const signedPayload = `${ts}.${payload}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sigBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload))
  const computed = Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return constantTimeEqual(computed, v1)
}

/**
 * Length-aware constant-time string compare. Returns false on length
 * mismatch, otherwise XORs each char code so total runtime depends only
 * on length.
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}
