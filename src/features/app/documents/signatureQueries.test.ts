import { describe, expect, it } from 'vitest'
import { countUndeliveredInvites, isSigningTokenExpired } from './signatureQueries'
import type { ProductionDocumentRecipient } from './signatureQueries'

const base: ProductionDocumentRecipient = {
  id: 'r1',
  name: 'Alex',
  email: 'alex@example.com',
  type: 'employee',
  order: 1,
  status: 'pending',
  signedAt: null,
  signedName: null,
  signatureImage: null,
  consentAt: null,
  declineReason: null,
  signingToken: '00000000-0000-4000-8000-000000000001',
  inviteLastSentAt: null,
  inviteDeliveryStatus: null,
  inviteDeliveryDetail: null,
  inviteDeliveryUpdatedAt: null,
  tokenExpiresAt: '2099-01-01T00:00:00Z',
  tokenRevokedAt: null,
}

describe('signatureQueries helpers', () => {
  it('counts bounced and complained invites', () => {
    expect(
      countUndeliveredInvites([
        { ...base, inviteDeliveryStatus: 'bounced' },
        { ...base, id: 'r2', inviteDeliveryStatus: 'delivered' },
        { ...base, id: 'r3', inviteDeliveryStatus: 'complained' },
      ]),
    ).toBe(2)
  })

  it('detects expired or revoked tokens', () => {
    expect(isSigningTokenExpired({ ...base, tokenExpiresAt: '2020-01-01T00:00:00Z' })).toBe(true)
    expect(isSigningTokenExpired({ ...base, tokenRevokedAt: '2026-01-01T00:00:00Z' })).toBe(true)
    expect(isSigningTokenExpired(base)).toBe(false)
  })
})
