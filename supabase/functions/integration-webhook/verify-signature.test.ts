import { describe, it, expect } from 'vitest'
import { verifyDutivaSignature } from './verify-signature'

// ── Helper: produce a real X-Dutiva-Signature header for a payload ───────────
async function signPayload(
  payload: string,
  secret: string,
  timestamp: string = String(Math.floor(Date.now() / 1000)),
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sigBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  )
  const hex = Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `t=${timestamp},v1=${hex}`
}

// Security: This is a test fixture, not a real secret.
const SECRET = 'dutiva_whsec_test_abc123'
const PAYLOAD = '{"type":"employee.updated","id":"evt_1"}'

describe('verifyDutivaSignature — happy path', () => {
  it('accepts a header produced from the same secret + payload', async () => {
    const header = await signPayload(PAYLOAD, SECRET)
    expect(await verifyDutivaSignature(PAYLOAD, header, SECRET)).toBe(true)
  })

  it('accepts an empty payload if the signature covers it', async () => {
    const header = await signPayload('', SECRET)
    expect(await verifyDutivaSignature('', header, SECRET)).toBe(true)
  })
})

describe('verifyDutivaSignature — tampering', () => {
  it('rejects a body changed after signing', async () => {
    const header = await signPayload(PAYLOAD, SECRET)
    expect(await verifyDutivaSignature('{"type":"admin.granted"}', header, SECRET)).toBe(false)
  })

  it('rejects a signature made with a different secret', async () => {
    const header = await signPayload(PAYLOAD, 'dutiva_whsec_other_secret')
    expect(await verifyDutivaSignature(PAYLOAD, header, SECRET)).toBe(false)
  })

  it('rejects a truncated v1 value', async () => {
    const header = await signPayload(PAYLOAD, SECRET)
    expect(await verifyDutivaSignature(PAYLOAD, header.slice(0, -4), SECRET)).toBe(false)
  })
})

describe('verifyDutivaSignature — replay window', () => {
  it('rejects timestamps older than the tolerance', async () => {
    const stale = String(Math.floor(Date.now() / 1000) - 400)
    const header = await signPayload(PAYLOAD, SECRET, stale)
    expect(await verifyDutivaSignature(PAYLOAD, header, SECRET)).toBe(false)
  })

  it('rejects timestamps too far in the future', async () => {
    const future = String(Math.floor(Date.now() / 1000) + 400)
    const header = await signPayload(PAYLOAD, SECRET, future)
    expect(await verifyDutivaSignature(PAYLOAD, header, SECRET)).toBe(false)
  })
})

describe('verifyDutivaSignature — malformed input', () => {
  it('rejects a missing header', async () => {
    expect(await verifyDutivaSignature(PAYLOAD, '', SECRET)).toBe(false)
  })

  it('rejects a header without v1', async () => {
    expect(await verifyDutivaSignature(PAYLOAD, 't=123', SECRET)).toBe(false)
  })

  it('rejects a non-numeric timestamp', async () => {
    expect(await verifyDutivaSignature(PAYLOAD, 't=abc,v1=deadbeef', SECRET)).toBe(false)
  })
})
