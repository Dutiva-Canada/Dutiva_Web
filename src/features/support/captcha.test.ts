import { describe, expect, it, vi } from 'vitest'
import {
  CAPTCHA_VERIFY_ENDPOINTS,
  interpretSiteverify,
  isCaptchaConfigured,
  resolveCaptchaProvider,
  verifyCaptcha,
} from './captcha'

/* A siteverify response, shaped exactly as Turnstile/hCaptcha return it.
   Typed as `fetch` so the recorded calls carry the real argument types. */
const siteverify = (body: unknown, ok = true) =>
  vi.fn<typeof fetch>(async () => ({ ok, json: async () => body }) as unknown as Response)

/** The form-encoded body the verifier sent, as parsed parameters. */
const sentBody = (init: RequestInit | undefined) => new URLSearchParams(String(init?.body ?? ''))

describe('resolveCaptchaProvider', () => {
  it('accepts both supported providers, case- and space-insensitively', () => {
    expect(resolveCaptchaProvider('hcaptcha')).toBe('hcaptcha')
    expect(resolveCaptchaProvider('  TURNSTILE ')).toBe('turnstile')
  })

  it('falls back to turnstile for unknown or absent values', () => {
    expect(resolveCaptchaProvider('recaptcha')).toBe('turnstile')
    expect(resolveCaptchaProvider(undefined)).toBe('turnstile')
    expect(resolveCaptchaProvider('')).toBe('turnstile')
  })
})

describe('isCaptchaConfigured', () => {
  it('treats an absent or blank site key as unconfigured', () => {
    // Drives whether the public form requires a token at all, so a
    // whitespace-only value must not read as "configured".
    expect(isCaptchaConfigured(undefined)).toBe(false)
    expect(isCaptchaConfigured('')).toBe(false)
    expect(isCaptchaConfigured('   ')).toBe(false)
    expect(isCaptchaConfigured('0x4AAA')).toBe(true)
  })
})

describe('interpretSiteverify', () => {
  it('accepts a successful verification', () => {
    expect(interpretSiteverify({ success: true })).toEqual({ ok: true })
  })

  it('reports our own misconfiguration ahead of the caller token', () => {
    // Both codes present: a wrong secret makes every token look invalid, and
    // blaming the token would send the operator hunting a bot that isn't there.
    const result = interpretSiteverify({
      success: false,
      'error-codes': ['invalid-input-response', 'invalid-input-secret'],
    })
    expect(result).toEqual({ ok: false, reason: 'bad_secret' })
  })

  it('distinguishes a replayed token from an invalid one', () => {
    expect(
      interpretSiteverify({ success: false, 'error-codes': ['timeout-or-duplicate'] }),
    ).toEqual({ ok: false, reason: 'duplicate_token' })
    expect(
      interpretSiteverify({ success: false, 'error-codes': ['invalid-input-response'] }),
    ).toEqual({ ok: false, reason: 'invalid_token' })
  })

  it('maps an absent token and provider-side faults', () => {
    expect(
      interpretSiteverify({ success: false, 'error-codes': ['missing-input-response'] }),
    ).toEqual({ ok: false, reason: 'missing_token' })
    expect(interpretSiteverify({ success: false, 'error-codes': ['internal-error'] })).toEqual({
      ok: false,
      reason: 'provider_error',
    })
  })

  it('never passes an unsuccessful verification it does not recognise', () => {
    expect(interpretSiteverify({ success: false })).toEqual({ ok: false, reason: 'invalid_token' })
    expect(interpretSiteverify({ success: false, 'error-codes': ['brand-new-code'] })).toEqual({
      ok: false,
      reason: 'invalid_token',
    })
  })

  it('treats a non-object payload as a provider fault, not a pass', () => {
    expect(interpretSiteverify(null)).toEqual({ ok: false, reason: 'provider_error' })
    expect(interpretSiteverify('success')).toEqual({ ok: false, reason: 'provider_error' })
    // Truthy-but-not-true must not slip through a loose comparison.
    expect(interpretSiteverify({ success: 'true' })).toEqual({ ok: false, reason: 'invalid_token' })
  })
})

describe('verifyCaptcha', () => {
  it('posts the secret and token form-encoded to the provider endpoint', async () => {
    const fetchImpl = siteverify({ success: true })
    const result = await verifyCaptcha({
      provider: 'turnstile',
      secret: 's3cret',
      token: 'tok',
      remoteIp: '203.0.113.7',
      fetchImpl,
    })

    expect(result).toEqual({ ok: true })
    const [url, init] = fetchImpl.mock.calls[0]!
    expect(url).toBe(CAPTCHA_VERIFY_ENDPOINTS.turnstile)
    const body = sentBody(init)
    expect(body.get('secret')).toBe('s3cret')
    expect(body.get('response')).toBe('tok')
    expect(body.get('remoteip')).toBe('203.0.113.7')
  })

  it('routes to the hCaptcha endpoint when that provider is configured', async () => {
    const fetchImpl = siteverify({ success: true })
    await verifyCaptcha({ provider: 'hcaptcha', secret: 's', token: 't', fetchImpl })
    expect(fetchImpl.mock.calls[0]![0]).toBe(CAPTCHA_VERIFY_ENDPOINTS.hcaptcha)
  })

  it("omits remoteip when the caller's IP is the 'unknown' placeholder", async () => {
    // The intake records 'unknown' when no proxy header identifies the caller;
    // forwarding it as an IP would just make the provider reject the call.
    const fetchImpl = siteverify({ success: true })
    await verifyCaptcha({
      provider: 'turnstile',
      secret: 's',
      token: 't',
      remoteIp: 'unknown',
      fetchImpl,
    })
    expect(sentBody(fetchImpl.mock.calls[0]![1]).has('remoteip')).toBe(false)
  })

  it('rejects an empty token without calling the provider', async () => {
    const fetchImpl = siteverify({ success: true })
    expect(
      await verifyCaptcha({ provider: 'turnstile', secret: 's', token: '', fetchImpl }),
    ).toEqual({
      ok: false,
      reason: 'missing_token',
    })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('reports a missing secret as bad_secret rather than verifying', async () => {
    const fetchImpl = siteverify({ success: true })
    expect(
      await verifyCaptcha({ provider: 'turnstile', secret: '', token: 't', fetchImpl }),
    ).toEqual({
      ok: false,
      reason: 'bad_secret',
    })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('fails closed when the provider is unreachable or errors', async () => {
    const throwing = vi.fn<typeof fetch>(async () => {
      throw new Error('network down')
    })
    expect(
      await verifyCaptcha({ provider: 'turnstile', secret: 's', token: 't', fetchImpl: throwing }),
    ).toEqual({ ok: false, reason: 'provider_error' })

    expect(
      await verifyCaptcha({
        provider: 'turnstile',
        secret: 's',
        token: 't',
        fetchImpl: siteverify({}, false),
      }),
    ).toEqual({ ok: false, reason: 'provider_error' })
  })

  it('fails closed when the provider returns unparseable JSON', async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      async () =>
        ({
          ok: true,
          json: async () => {
            throw new Error('not json')
          },
        }) as unknown as Response,
    )
    expect(
      await verifyCaptcha({ provider: 'turnstile', secret: 's', token: 't', fetchImpl }),
    ).toEqual({
      ok: false,
      reason: 'provider_error',
    })
  })
})
