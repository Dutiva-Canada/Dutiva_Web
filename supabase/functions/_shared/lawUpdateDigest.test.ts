import { describe, expect, it } from 'vitest'
import {
  parseSupportedJurisdiction,
  resolveRecipientJurisdictions,
  selectDigestableUpdates,
} from './lawUpdateDigest'
import type { DigestCandidateRow } from './lawUpdateDigest'

describe('parseSupportedJurisdiction', () => {
  it('accepts the three supported codes, case-insensitively', () => {
    expect(parseSupportedJurisdiction('on')).toBe('ON')
    expect(parseSupportedJurisdiction('QC')).toBe('QC')
    expect(parseSupportedJurisdiction('Fed')).toBe('FED')
  })

  it('rejects an unsupported province rather than passing it through', () => {
    expect(parseSupportedJurisdiction('BC')).toBeNull()
    expect(parseSupportedJurisdiction('AB')).toBeNull()
  })

  it('rejects null/undefined/empty', () => {
    expect(parseSupportedJurisdiction(null)).toBeNull()
    expect(parseSupportedJurisdiction(undefined)).toBeNull()
    expect(parseSupportedJurisdiction('')).toBeNull()
  })
})

describe('resolveRecipientJurisdictions', () => {
  it("prefers the organization's default jurisdiction when both are set", () => {
    expect(resolveRecipientJurisdictions('ON', 'QC')).toEqual(['QC'])
  })

  it('falls back to the profile province when the org has none', () => {
    expect(resolveRecipientJurisdictions('ON', null)).toEqual(['ON'])
    expect(resolveRecipientJurisdictions('ON', 'BC')).toEqual(['ON']) // org set but unsupported
  })

  it('returns empty when neither resolves to a supported jurisdiction', () => {
    expect(resolveRecipientJurisdictions(null, null)).toEqual([])
    expect(resolveRecipientJurisdictions('BC', 'AB')).toEqual([])
  })
})

function row(overrides: Partial<DigestCandidateRow>): DigestCandidateRow {
  return { id: 'u1', reviewStatus: 'reviewed', detectedAt: '2026-08-10T00:00:00Z', ...overrides }
}

const GO_LIVE = new Date('2026-08-06T00:00:00Z')

describe('selectDigestableUpdates', () => {
  it('includes a reviewed, post-go-live, not-yet-sent row', () => {
    const rows = [row({})]
    expect(selectDigestableUpdates(rows, new Set(), GO_LIVE)).toEqual(rows)
  })

  it('excludes an unreviewed (machine_curated) row', () => {
    expect(
      selectDigestableUpdates([row({ reviewStatus: 'machine_curated' })], new Set(), GO_LIVE),
    ).toEqual([])
  })

  it('excludes a row already recorded as sent to this recipient', () => {
    expect(selectDigestableUpdates([row({ id: 'u2' })], new Set(['u2']), GO_LIVE)).toEqual([])
  })

  it('excludes a row detected before the go-live cutoff (no backfill dump)', () => {
    expect(
      selectDigestableUpdates([row({ detectedAt: '2026-08-01T00:00:00Z' })], new Set(), GO_LIVE),
    ).toEqual([])
  })

  it('excludes a row with no detected_at', () => {
    expect(selectDigestableUpdates([row({ detectedAt: null })], new Set(), GO_LIVE)).toEqual([])
  })
})
