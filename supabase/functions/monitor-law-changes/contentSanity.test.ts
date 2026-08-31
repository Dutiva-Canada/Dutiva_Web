import { describe, expect, it } from 'vitest'
import {
  assessLegislationText,
  BLOCK_PAGE_SIGNATURES,
  MIN_STATUTE_TEXT_LENGTH,
} from './contentSanity'

/**
 * The cases below are the real responses that motivated this guard, captured
 * while auditing why the monitor reported 14 of 19 pages healthy when almost
 * none were returning legislation.
 */

/** Stand-in for genuine statute text: long, and free of block-page phrases. */
const statuteText = (
  'Employment Standards Act, 2000. Notice of termination. ' +
  'The employer shall give the employee written notice of termination. '
).repeat(200)

describe('assessLegislationText', () => {
  it('accepts a page of real statute text', () => {
    expect(assessLegislationText(statuteText)).toEqual({ ok: true })
  })

  it('rejects the Ontario app shell that yields 422 characters of boilerplate', () => {
    const shell = 'x'.repeat(422)
    const verdict = assessLegislationText(shell)
    expect(verdict.ok).toBe(false)
    if (verdict.ok) throw new Error('expected rejection')
    expect(verdict.reason).toBe('too-short')
    expect(verdict.detail).toContain('422')
  })

  it("rejects Nova Scotia's WAF page that arrives with HTTP 200", () => {
    const verdict = assessLegislationText(
      'Request Rejected The requested URL was rejected. Please consult with your administrator. Your support ID is 1234',
    )
    expect(verdict.ok).toBe(false)
    if (verdict.ok) throw new Error('expected rejection')
    expect(verdict.reason).toBe('block-page')
  })

  it("rejects Cloudflare's challenge interstitial", () => {
    const verdict = assessLegislationText(
      'Just a moment... Enable JavaScript and cookies to continue',
    )
    expect(verdict.ok).toBe(false)
    if (verdict.ok) throw new Error('expected rejection')
    expect(verdict.reason).toBe('block-page')
  })

  it("rejects CloudFront's block page", () => {
    const verdict = assessLegislationText(
      '403 ERROR The request could not be satisfied. Request blocked.',
    )
    expect(verdict.ok).toBe(false)
    if (verdict.ok) throw new Error('expected rejection')
    expect(verdict.reason).toBe('block-page')
  })

  it('reports a block page as a block, not merely as short', () => {
    /* A padded block page clears the length bar; the signature must still win,
       because "host is refusing us" needs a different fix than "wrong URL". */
    const padded = 'Just a moment... ' + 'filler text '.repeat(500)
    expect(padded.length).toBeGreaterThan(MIN_STATUTE_TEXT_LENGTH)
    const verdict = assessLegislationText(padded)
    expect(verdict.ok).toBe(false)
    if (verdict.ok) throw new Error('expected rejection')
    expect(verdict.reason).toBe('block-page')
  })

  it('matches signatures regardless of case', () => {
    expect(assessLegislationText('THE REQUESTED URL WAS REJECTED').ok).toBe(false)
    expect(assessLegislationText('The Requested URL Was Rejected').ok).toBe(false)
  })

  it('does not flag a statute that describes a request being rejected', () => {
    /* The bare phrase "request rejected" would fire here — which is why the
       signature is the full F5 sentence instead. */
    const administrative =
      'Where the Director considers the application incomplete, the request is rejected and ' +
      'written reasons shall be given to the applicant. '
    expect(assessLegislationText(administrative + statuteText)).toEqual({ ok: true })
  })

  it('treats an empty response as too short rather than throwing', () => {
    const verdict = assessLegislationText('')
    expect(verdict.ok).toBe(false)
    if (verdict.ok) throw new Error('expected rejection')
    expect(verdict.reason).toBe('too-short')
  })

  it('does not fire on statute wording that merely sounds like a refusal', () => {
    /* Statutes do say "denied", "forbidden" and "rejected" — single words must
       never be signatures, or real legislation gets flagged as a block page. */
    const legalese =
      'No employer shall deny a leave of absence. Access may be denied where forbidden by law. ' +
      'An application that is rejected may be appealed. '
    expect(assessLegislationText(legalese + statuteText)).toEqual({ ok: true })
  })

  it('keeps every signature to a distinctive multi-word phrase', () => {
    for (const signature of BLOCK_PAGE_SIGNATURES) {
      expect(signature.trim().split(/\s+/).length).toBeGreaterThanOrEqual(3)
      expect(signature).toBe(signature.toLowerCase())
    }
  })

  it('accepts text sitting just above the threshold', () => {
    expect(assessLegislationText('a'.repeat(MIN_STATUTE_TEXT_LENGTH))).toEqual({ ok: true })
    expect(assessLegislationText('a'.repeat(MIN_STATUTE_TEXT_LENGTH - 1)).ok).toBe(false)
  })
})
