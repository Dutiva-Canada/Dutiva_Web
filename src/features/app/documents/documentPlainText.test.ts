import { describe, expect, it } from 'vitest'
import { blocksToPlainText } from './documentPlainText'
import type { PreviewBlock } from './data'
import type { ProductionDocumentRecipient } from './signatureQueries'

const blocks: PreviewBlock[] = [
  {
    type: 'title',
    text: { en: 'Termination notice', fr: 'Avis de cessation' },
  },
  {
    type: 'para',
    text: { en: 'Dear {{employee_name}},', fr: 'Cher/Chère {{employee_name}},' },
  },
  {
    type: 'sig',
    roles: [
      { en: 'Employer', fr: 'Employeur' },
      { en: 'Employee', fr: 'Employé(e)' },
    ],
  },
]

const recipients: ProductionDocumentRecipient[] = [
  {
    id: 'r1',
    name: 'Northgate HR',
    email: 'hr@northgate.example',
    type: 'hr',
    order: 1,
    status: 'signed',
    signedName: 'Jordan Lee',
    signatureImage: null,
    signedAt: '2026-08-22T14:00:00Z',
    consentAt: '2026-08-22T13:55:00Z',
    declineReason: null,
    signingToken: '00000000-0000-4000-8000-000000000001',
    inviteLastSentAt: null,
    inviteDeliveryStatus: null,
    inviteDeliveryDetail: null,
    inviteDeliveryUpdatedAt: null,
  },
  {
    id: 'r2',
    name: 'Alex Chen',
    email: 'alex@example.com',
    type: 'employee',
    order: 2,
    status: 'signed',
    signedName: 'Alex Chen',
    signatureImage: null,
    signedAt: '2026-08-22T15:00:00Z',
    consentAt: '2026-08-22T14:55:00Z',
    declineReason: null,
    signingToken: '00000000-0000-4000-8000-000000000002',
    inviteLastSentAt: null,
    inviteDeliveryStatus: null,
    inviteDeliveryDetail: null,
    inviteDeliveryUpdatedAt: null,
  },
]

describe('blocksToPlainText', () => {
  it('merges field values and substitutes signed names in signature blocks', () => {
    const paragraphs = blocksToPlainText(
      blocks,
      { employee_name: 'Alex Chen' },
      'en',
      recipients,
    )

    expect(paragraphs[0]).toBe('Termination notice')
    expect(paragraphs[1]).toBe('Dear Alex Chen,')
    expect(paragraphs[2]).toContain('Employer')
    expect(paragraphs[2]).toContain('Jordan Lee')
    expect(paragraphs[3]).toContain('Employee')
    expect(paragraphs[3]).toContain('Alex Chen')
    expect(paragraphs[3]).toContain('2026-08-22')
  })

  it('renders blank signature lines when recipients are missing or unsigned', () => {
    const paragraphs = blocksToPlainText(blocks, {}, 'en')
    expect(paragraphs.at(-2)).toContain('_________________________')
    expect(paragraphs.at(-1)).toContain('_________________________')
  })
})
