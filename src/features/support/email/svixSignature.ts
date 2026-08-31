/**
 * Svix webhook signature verification (the scheme Resend uses for delivery
 * events). Pure and dependency-free so it's unit-tested against the published
 * Svix test vector here, and mirrored by the `resend-webhook` edge function —
 * same convention as the other Deno mirrors.
 *
 * The endpoint is necessarily public, so this signature IS the authentication.
 * Without it anyone could POST fake `email.delivered` events and mask real
 * bounces. Verification covers replay too: a stale timestamp is rejected even
 * if the signature itself is valid.
 */

export interface SvixHeaders {
  /** `svix-id` */
  id: string
  /** `svix-timestamp` — unix seconds. */
  timestamp: string
  /** `svix-signature` — space-separated `v1,<base64>` entries. */
  signature: string
}

export type SvixFailure =
  'missing_headers' | 'bad_timestamp' | 'stale_timestamp' | 'bad_secret' | 'no_match'

export type SvixVerifyResult = { ok: true } | { ok: false; reason: SvixFailure }

/** Reject anything older/newer than this — bounds replay. */
export const SVIX_TOLERANCE_SECONDS = 5 * 60

/** Length-independent compare; avoids leaking match position via timing. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

export async function verifySvixSignature(
  secret: string,
  headers: SvixHeaders,
  body: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Promise<SvixVerifyResult> {
  if (!headers.id || !headers.timestamp || !headers.signature) {
    return { ok: false, reason: 'missing_headers' }
  }
  const ts = Number(headers.timestamp)
  if (!Number.isFinite(ts)) return { ok: false, reason: 'bad_timestamp' }
  if (Math.abs(nowSeconds - ts) > SVIX_TOLERANCE_SECONDS) {
    return { ok: false, reason: 'stale_timestamp' }
  }

  const raw = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret
  let keyBytes: Uint8Array
  try {
    keyBytes = base64ToBytes(raw)
  } catch {
    return { ok: false, reason: 'bad_secret' }
  }
  if (keyBytes.length === 0) return { ok: false, reason: 'bad_secret' }

  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes as unknown as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signed = `${headers.id}.${headers.timestamp}.${body}`
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signed))
  const expected = bytesToBase64(new Uint8Array(mac))

  // Svix may send several signatures (key rotation); any match is valid.
  const provided = headers.signature
    .split(' ')
    .map((p) => p.trim())
    .filter((p) => p.startsWith('v1,'))
    .map((p) => p.slice('v1,'.length))

  return provided.some((p) => timingSafeEqual(p, expected))
    ? { ok: true }
    : { ok: false, reason: 'no_match' }
}
