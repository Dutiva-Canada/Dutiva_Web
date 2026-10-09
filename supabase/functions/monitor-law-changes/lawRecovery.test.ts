import { describe, expect, it } from 'vitest'
import { isAllowedLawHost } from './lawRecovery'

/**
 * SSRF guard — the only check standing between a model-suggested URL and a
 * server-side fetch. Every rejection path here is a path to an arbitrary
 * host if it regresses.
 */
describe('isAllowedLawHost', () => {
  it('accepts official law hosts, exact and subdomain', () => {
    expect(isAllowedLawHost('https://www.ontario.ca/laws/statute/00e41')).toBe(true)
    expect(isAllowedLawHost('https://laws-lois.justice.gc.ca/eng/acts/L-2/')).toBe(true)
    expect(isAllowedLawHost('https://www.legisquebec.gouv.qc.ca/en/document/cs/N-1.1')).toBe(true)
    expect(isAllowedLawHost('https://canlii.org/en/on/laws/stat/rso-1990-c-h19/')).toBe(true)
  })

  it('rejects anything that is not https', () => {
    expect(isAllowedLawHost('http://www.ontario.ca/laws/statute/00e41')).toBe(false)
    expect(isAllowedLawHost('ftp://laws-lois.justice.gc.ca/')).toBe(false)
    expect(isAllowedLawHost('javascript:alert(1)')).toBe(false)
    expect(isAllowedLawHost('data:text/html,<h1>x</h1>')).toBe(false)
  })

  it('rejects suffix spoofing — the host must end at a real boundary', () => {
    expect(isAllowedLawHost('https://ontario.ca.evil.com/')).toBe(false)
    expect(isAllowedLawHost('https://evilontario.ca/')).toBe(false)
    expect(isAllowedLawHost('https://notontario.ca/')).toBe(false)
    expect(isAllowedLawHost('https://www.ontario.ca.attacker.net/')).toBe(false)
  })

  it('rejects unrelated hosts outright', () => {
    expect(isAllowedLawHost('https://example.com/')).toBe(false)
    expect(isAllowedLawHost('https://169.254.169.254/latest/meta-data')).toBe(false)
  })

  it('handles case, ports, and garbage input', () => {
    expect(isAllowedLawHost('https://WWW.ONTARIO.CA/laws')).toBe(true)
    expect(isAllowedLawHost('https://www.ontario.ca:443/laws')).toBe(true)
    expect(isAllowedLawHost('')).toBe(false)
    expect(isAllowedLawHost('not a url')).toBe(false)
    expect(isAllowedLawHost('www.ontario.ca/laws')).toBe(false) // no scheme → parse fails
  })
})
