import { describe, expect, it } from 'vitest'
import { buildJwtClaims, parseServiceAccountKey } from './googleCalendar'

describe('parseServiceAccountKey', () => {
  it('unescapes literal \\n sequences env vars carry instead of real newlines', () => {
    const key = parseServiceAccountKey(
      'svc@project.iam.gserviceaccount.com',
      '-----BEGIN PRIVATE KEY-----\\nABCD\\n-----END PRIVATE KEY-----',
    )
    expect(key?.privateKey).toBe('-----BEGIN PRIVATE KEY-----\nABCD\n-----END PRIVATE KEY-----')
  })

  it('returns null when either secret is missing, so the caller can no-op honestly', () => {
    expect(parseServiceAccountKey(undefined, 'key')).toBeNull()
    expect(parseServiceAccountKey('email', undefined)).toBeNull()
    expect(parseServiceAccountKey(undefined, undefined)).toBeNull()
  })

  it('returns null for blank secrets, not a key with empty fields', () => {
    expect(parseServiceAccountKey('  ', 'key')).toBeNull()
    expect(parseServiceAccountKey('email', '   ')).toBeNull()
  })

  it('trims surrounding whitespace', () => {
    const key = parseServiceAccountKey(' svc@project.iam.gserviceaccount.com \n', ' key \n')
    expect(key?.clientEmail).toBe('svc@project.iam.gserviceaccount.com')
    expect(key?.privateKey).toBe('key')
  })
})

describe('buildJwtClaims', () => {
  it('names the calendar events scope and the Google token endpoint as audience', () => {
    const { claims } = buildJwtClaims(
      'svc@project.iam.gserviceaccount.com',
      'https://www.googleapis.com/auth/calendar.events',
      1_700_000_000,
    )
    expect(claims.iss).toBe('svc@project.iam.gserviceaccount.com')
    expect(claims.scope).toBe('https://www.googleapis.com/auth/calendar.events')
    expect(claims.aud).toBe('https://oauth2.googleapis.com/token')
  })

  it("expires exactly one hour after issuance — Google's own cap for this grant", () => {
    const { claims } = buildJwtClaims('svc@project.iam.gserviceaccount.com', 'scope', 1_700_000_000)
    expect(claims.iat).toBe(1_700_000_000)
    expect(claims.exp).toBe(1_700_003_600)
  })

  it("uses RS256, the only algorithm Google's JWT-bearer grant accepts", () => {
    const { header } = buildJwtClaims('svc@project.iam.gserviceaccount.com', 'scope', 0)
    expect(header).toEqual({ alg: 'RS256', typ: 'JWT' })
  })
})
