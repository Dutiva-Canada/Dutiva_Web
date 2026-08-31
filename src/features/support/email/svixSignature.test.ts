import { describe, expect, it } from 'vitest'
import { verifySvixSignature } from './svixSignature'

/* Canonical test vector published by Svix (the scheme Resend uses). Verifying
   against this proves the implementation matches the real spec rather than just
   agreeing with itself. */
const VECTOR = {
  secret: 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw',
  id: 'msg_p5jXN8AQM9LWM0D4loKWxJek',
  timestamp: '1614265330',
  body: '{"test": 2432232314}',
  signature: 'v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=',
}
/* Pin "now" to the vector's timestamp — it's from 2021 and would be stale. */
const AT = Number(VECTOR.timestamp)

const headers = (over: Partial<typeof VECTOR> = {}) => ({
  id: over.id ?? VECTOR.id,
  timestamp: over.timestamp ?? VECTOR.timestamp,
  signature: over.signature ?? VECTOR.signature,
})

describe('verifySvixSignature', () => {
  it('accepts the published Svix test vector', async () => {
    expect(await verifySvixSignature(VECTOR.secret, headers(), VECTOR.body, AT)).toEqual({
      ok: true,
    })
  })

  it('rejects a tampered body', async () => {
    const result = await verifySvixSignature(VECTOR.secret, headers(), '{"test": 9999999999}', AT)
    expect(result).toEqual({ ok: false, reason: 'no_match' })
  })

  it('rejects a different signing secret', async () => {
    const result = await verifySvixSignature(
      'whsec_TXlTdXBlclNlY3JldEtleUZvclRlc3Rpbmch',
      headers(),
      VECTOR.body,
      AT,
    )
    expect(result).toEqual({ ok: false, reason: 'no_match' })
  })

  it('rejects a replayed (stale) timestamp even with a valid signature', async () => {
    // Same valid vector, but "now" is an hour later.
    const result = await verifySvixSignature(VECTOR.secret, headers(), VECTOR.body, AT + 3600)
    expect(result).toEqual({ ok: false, reason: 'stale_timestamp' })
  })

  it('rejects missing headers', async () => {
    const result = await verifySvixSignature(
      VECTOR.secret,
      { id: '', timestamp: '', signature: '' },
      VECTOR.body,
      AT,
    )
    expect(result).toEqual({ ok: false, reason: 'missing_headers' })
  })

  it('rejects a non-numeric timestamp', async () => {
    const result = await verifySvixSignature(
      VECTOR.secret,
      headers({ timestamp: 'nope' }),
      VECTOR.body,
      AT,
    )
    expect(result).toEqual({ ok: false, reason: 'bad_timestamp' })
  })

  it('accepts when one of several rotated signatures matches', async () => {
    const multi = `v1,aaaabbbbccccddddeeeeffffgggghhhhiiiijjjjkkk= ${VECTOR.signature}`
    const result = await verifySvixSignature(
      VECTOR.secret,
      headers({ signature: multi }),
      VECTOR.body,
      AT,
    )
    expect(result).toEqual({ ok: true })
  })

  it('ignores unknown signature versions', async () => {
    const result = await verifySvixSignature(
      VECTOR.secret,
      headers({ signature: 'v2,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=' }),
      VECTOR.body,
      AT,
    )
    expect(result).toEqual({ ok: false, reason: 'no_match' })
  })
})
