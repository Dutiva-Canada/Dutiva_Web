import { describe, expect, it } from 'vitest'
import { buildExternalSigningUrl, renderSigningInviteEmail } from './signingInviteEmail'

const base = {
  recipientName: 'Alex Chen',
  organizationName: 'Northgate Logistics Inc.',
  documentTitle: 'Offer letter',
  documentRef: 'DOC-2026-0823-120000',
  signingUrl: 'https://dutiva.ca/sign/00000000-0000-4000-8000-000000000001',
  actorLabel: 'Amara Osei',
} as const

describe('renderSigningInviteEmail', () => {
  it('renders English subject and body with the signing URL and disclaimer', () => {
    const email = renderSigningInviteEmail({ ...base, language: 'en' })
    expect(email.subject).toContain('DOC-2026-0823-120000')
    expect(email.subject).toContain('Dutiva Signature')
    expect(email.text).toContain('Alex Chen')
    expect(email.text).toContain(base.signingUrl)
    expect(email.text).toContain('Amara Osei')
    expect(email.text).toContain('does not provide legal advice')
  })

  it('renders French copy when language is fr', () => {
    const email = renderSigningInviteEmail({ ...base, language: 'fr' })
    expect(email.subject).toContain('Signature Dutiva')
    expect(email.text).toContain('Bonjour Alex Chen')
    expect(email.text).toContain('ne fournit pas de conseils juridiques')
    expect(email.text).toContain(base.signingUrl)
  })

  it('omits actor line when actorLabel is absent', () => {
    const email = renderSigningInviteEmail({
      ...base,
      language: 'en',
      actorLabel: undefined,
    })
    expect(email.text).toContain('Northgate Logistics Inc. has asked you')
    expect(email.text).not.toContain('Amara Osei at')
  })

  it('builds a French-prefixed signing URL when language is fr', () => {
    expect(
      buildExternalSigningUrl('https://dutiva.ca', '00000000-0000-4000-8000-000000000001', 'fr'),
    ).toBe('https://dutiva.ca/fr/sign/00000000-0000-4000-8000-000000000001')
  })

  it('renders reminder subject and copy when reminder is true', () => {
    const email = renderSigningInviteEmail({ ...base, language: 'en', reminder: true })
    expect(email.subject).toContain('reminder')
    expect(email.text).toContain('This is a reminder')
    expect(email.text).not.toContain('Amara Osei at')
  })
})
