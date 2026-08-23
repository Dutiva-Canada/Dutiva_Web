import { describe, expect, it } from 'vitest'
import { renderSigningStatusEmail } from './signingStatusEmail'

const base = {
  organizationName: 'Northgate Logistics Inc.',
  documentTitle: 'Offer letter',
  documentRef: 'DOC-2026-0823-120000',
  documentUrl: 'https://dutiva.ca/app/documents/doc-1',
} as const

describe('renderSigningStatusEmail', () => {
  it('renders completion copy in English', () => {
    const email = renderSigningStatusEmail({ ...base, language: 'en', event: 'completed' })
    expect(email.subject).toContain('all signatures collected')
    expect(email.text).toContain(base.documentUrl)
  })

  it('renders decline copy in French with signer summary', () => {
    const email = renderSigningStatusEmail({
      ...base,
      language: 'fr',
      event: 'declined',
      signerSummary: 'Signataire : Alex Chen (alex@example.com)',
    })
    expect(email.subject).toContain('refusé')
    expect(email.text).toContain('Alex Chen')
  })
})
