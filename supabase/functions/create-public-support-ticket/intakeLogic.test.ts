import { describe, expect, it } from 'vitest'
import {
  acknowledgementKind,
  applyPaidSupportFloor,
  clientIp,
  EMAIL_RE,
  interpretSiteverify,
  normalizePlan,
  oneOf,
  PUBLIC_CATEGORIES,
  RESTRICTED_CATEGORIES,
  sha256hex,
  str,
  suggestPriority,
} from './intakeLogic.ts'

describe('interpretSiteverify', () => {
  it('accepts only an explicit success:true', () => {
    expect(interpretSiteverify({ success: true })).toEqual({ ok: true })
    expect(interpretSiteverify({ success: 'true' })).toEqual({
      ok: false,
      reason: 'invalid_token',
    })
    expect(interpretSiteverify({ success: 1 })).toEqual({ ok: false, reason: 'invalid_token' })
    expect(interpretSiteverify({})).toEqual({ ok: false, reason: 'invalid_token' })
  })

  it('fails closed on malformed provider payloads', () => {
    for (const bad of [null, undefined, 42, 'ok']) {
      expect(interpretSiteverify(bad)).toEqual({ ok: false, reason: 'provider_error' })
    }
    // An empty array is an object → falls through to the default invalid_token.
    expect(interpretSiteverify([])).toEqual({ ok: false, reason: 'invalid_token' })
    // Non-string codes are filtered out rather than trusted.
    expect(interpretSiteverify({ success: false, 'error-codes': [42, {}] })).toEqual({
      ok: false,
      reason: 'invalid_token',
    })
  })

  it('maps provider error codes to stable reasons', () => {
    const cases: Array<[string, string]> = [
      ['missing-input-secret', 'bad_secret'],
      ['invalid-input-secret', 'bad_secret'],
      ['missing-input-response', 'missing_token'],
      ['timeout-or-duplicate', 'duplicate_token'],
      ['invalid-input-response', 'invalid_token'],
      ['bad-request', 'provider_error'],
      ['internal-error', 'provider_error'],
    ]
    for (const [code, reason] of cases) {
      expect(interpretSiteverify({ success: false, 'error-codes': [code] })).toEqual({
        ok: false,
        reason,
      })
    }
  })

  it('reports our own misconfiguration ahead of the caller', () => {
    // A bad secret makes every token "fail" — bad_secret must win the ranking.
    expect(
      interpretSiteverify({
        success: false,
        'error-codes': ['missing-input-response', 'invalid-input-secret'],
      }),
    ).toEqual({ ok: false, reason: 'bad_secret' })
  })
})

describe('suggestPriority', () => {
  it('security reports are always at least high', () => {
    expect(suggestPriority('security', 'none', 'whenever')).toBe('high')
  })

  it('sensitive categories floor at standard', () => {
    expect(suggestPriority('privacy', 'none', 'whenever')).toBe('standard')
    expect(suggestPriority('accessibility', 'none', 'whenever')).toBe('standard')
    expect(suggestPriority('complaint', 'none', 'whenever')).toBe('standard')
    expect(suggestPriority('billing', 'none', 'whenever')).toBe('standard')
    expect(suggestPriority('account_access', 'none', 'whenever')).toBe('standard')
  })

  it('ranks impact and caps at high — critical is a human call', () => {
    expect(suggestPriority('other', 'blocking', 'whenever')).toBe('high')
    expect(suggestPriority('other', 'major', 'urgent')).toBe('high')
    expect(suggestPriority('other', 'major', 'whenever')).toBe('standard')
    expect(suggestPriority('other', 'none', 'urgent')).toBe('low') // urgency alone doesn't rank
    expect(suggestPriority('sales', 'blocking', 'urgent')).toBe('high')
  })
})

describe('applyPaidSupportFloor', () => {
  it('lifts paid-plan tickets to at least high', () => {
    expect(applyPaidSupportFloor('low', 'growth', 'product_question')).toBe('high')
    expect(applyPaidSupportFloor('standard', 'pro', 'sales')).toBe('high')
  })

  it('never lowers a ticket and never overrides restricted routing', () => {
    expect(applyPaidSupportFloor('critical', 'pro', 'technical')).toBe('critical')
    expect(applyPaidSupportFloor('low', 'pro', 'privacy')).toBe('low')
    expect(applyPaidSupportFloor('low', 'growth', 'security')).toBe('low')
  })

  it('ignores free plans and unknown plans', () => {
    expect(applyPaidSupportFloor('low', 'free', 'product_question')).toBe('low')
    expect(applyPaidSupportFloor('low', null, 'product_question')).toBe('low')
  })
})

describe('normalizePlan', () => {
  it('accepts the known plan names case-insensitively', () => {
    expect(normalizePlan('Pro')).toBe('pro')
    expect(normalizePlan('GROWTH')).toBe('growth')
    expect(normalizePlan('free')).toBe('free')
    expect(normalizePlan('starter')).toBe('starter')
  })

  it('rejects everything else', () => {
    for (const bad of ['enterprise', '', null, undefined, 5, {}]) {
      expect(normalizePlan(bad)).toBeNull()
    }
  })
})

describe('field validators', () => {
  it('oneOf falls back on non-strings and out-of-range values', () => {
    const allowed = ['en', 'fr'] as const
    expect(oneOf('fr', allowed, 'en')).toBe('fr')
    expect(oneOf('de', allowed, 'en')).toBe('en')
    expect(oneOf(42, allowed, 'en')).toBe('en')
    expect(oneOf(['en'], allowed, 'en')).toBe('en')
  })

  it('str trims and enforces bounds', () => {
    expect(str('  hello  ', 200)).toBe('hello')
    expect(str('   ', 200)).toBeNull()
    expect(str('x'.repeat(201), 200)).toBeNull()
    expect(str(42, 200)).toBeNull()
    expect(str(['a'], 200)).toBeNull()
  })

  it('EMAIL_RE takes a common valid shape and rejects junk', () => {
    expect(EMAIL_RE.test('a@b.co')).toBe(true)
    expect(EMAIL_RE.test('name+tag@sub.domain.ca')).toBe(true)
    expect(EMAIL_RE.test('no-at-sign')).toBe(false)
    expect(EMAIL_RE.test('a@b')).toBe(false)
    expect(EMAIL_RE.test('a b@c.com')).toBe(false)
  })
})

describe('clientIp', () => {
  it('prefers the first x-forwarded-for entry, then CF, then x-real-ip', () => {
    const req = (headers: Record<string, string>) => new Request('https://x', { headers })
    expect(clientIp(req({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }))).toBe('1.2.3.4')
    expect(clientIp(req({ 'cf-connecting-ip': '9.9.9.9' }))).toBe('9.9.9.9')
    expect(clientIp(req({ 'x-real-ip': '8.8.8.8' }))).toBe('8.8.8.8')
    expect(clientIp(req({}))).toBe('unknown')
  })
})

describe('sha256hex', () => {
  it('produces a stable lowercase hex digest', async () => {
    const a = await sha256hex('salt:ip:1.2.3.4')
    expect(a).toMatch(/^[0-9a-f]{64}$/)
    expect(await sha256hex('salt:ip:1.2.3.4')).toBe(a)
    expect(await sha256hex('salt:ip:1.2.3.5')).not.toBe(a)
  })
})

describe('category sets', () => {
  it('public categories exclude the signed-in-only ones', () => {
    for (const c of ['account_access', 'billing', 'technical', 'complaint', 'other']) {
      expect(PUBLIC_CATEGORIES.has(c as never)).toBe(false)
    }
    for (const c of ['product_question', 'privacy', 'security', 'accessibility', 'sales']) {
      expect(PUBLIC_CATEGORIES.has(c as never)).toBe(true)
    }
  })

  it('restricted set is the requester-only handling group', () => {
    expect([...RESTRICTED_CATEGORIES].sort()).toEqual(
      ['accessibility', 'complaint', 'privacy', 'security'].sort(),
    )
  })
})

describe('acknowledgementKind', () => {
  it('maps sensitive categories to dedicated acknowledgements', () => {
    expect(acknowledgementKind('privacy')).toBe('privacy_ack')
    expect(acknowledgementKind('security')).toBe('security_ack')
    expect(acknowledgementKind('accessibility')).toBe('accessibility_ack')
    expect(acknowledgementKind('complaint')).toBe('complaint_ack')
    expect(acknowledgementKind('sales')).toBe('ticket_received')
    expect(acknowledgementKind('other')).toBe('ticket_received')
  })
})
