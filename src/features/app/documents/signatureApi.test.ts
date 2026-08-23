import { afterEach, describe, expect, it, vi } from 'vitest'

describe('signatureApi', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.doUnmock('./productionApi')
    vi.resetModules()
  })

  it('sendDocumentForSignature creates envelope, recipients, and audit row', async () => {
    vi.doMock('./productionApi', () => ({
      getDocument: vi.fn().mockResolvedValue({
        id: 'doc-1',
        ref: 'DOC-2026-0822-120000',
        status: 'approved',
        signatureStatus: 'not_sent',
        currentVersion: 1,
        versions: [{ versionNumber: 1, content: { blocks: [], values: {} } }],
      }),
    }))

    const sigSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'sig-1',
        provider: 'dutiva_embedded',
        external_envelope_id: 'ENV-TEST1234',
        status: 'sent',
        sent_at: '2026-08-22T12:00:00Z',
        signed_at: null,
        content_hash: 'abc123',
      },
      error: null,
    })
    const sigSelect = vi.fn().mockReturnValue({ single: sigSingle })
    const sigInsert = vi.fn().mockReturnValue({ select: sigSelect })

    const recInsert = vi.fn().mockResolvedValue({ error: null })
    const docUpdateEqOrg = vi.fn().mockResolvedValue({ error: null })
    const docUpdateEqId = vi.fn().mockReturnValue({ eq: docUpdateEqOrg })
    const docUpdate = vi.fn().mockReturnValue({ eq: docUpdateEqId })
    const auditInsert = vi.fn().mockResolvedValue({ error: null })

    const from = vi.fn((table: string) => {
      if (table === 'hr_generated_documents') return { update: docUpdate }
      if (table === 'hr_document_signatures') return { insert: sigInsert }
      if (table === 'hr_document_recipients') return { insert: recInsert }
      if (table === 'hr_document_audit_events') return { insert: auditInsert }
      throw new Error(`unexpected table ${table}`)
    })

    vi.doMock('@/lib/supabaseClient', () => ({ supabase: { from } }))
    vi.resetModules()
    const api = await import('./signatureApi')

    const signature = await api.sendDocumentForSignature(
      'org-1',
      'doc-1',
      [{ name: 'Alex', email: 'alex@example.com', type: 'employee', order: 1, status: 'pending' }],
      'Admin',
    )

    expect(signature.envelopeId).toBe('ENV-TEST1234')
    expect(recInsert).toHaveBeenCalled()
    expect(docUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'sent_for_signature', signature_status: 'sent' }),
    )
  })

  it('sendDocumentForSignature rejects when document is not approved', async () => {
    vi.doMock('./productionApi', () => ({
      getDocument: vi.fn().mockResolvedValue({
        id: 'doc-1',
        ref: 'DOC-1',
        status: 'draft',
        signatureStatus: 'not_sent',
        currentVersion: 1,
        versions: [{ versionNumber: 1, content: { blocks: [], values: {} } }],
      }),
    }))
    vi.doMock('@/lib/supabaseClient', () => ({ supabase: { from: vi.fn() } }))
    vi.resetModules()
    const api = await import('./signatureApi')

    await expect(
      api.sendDocumentForSignature(
        'org-1',
        'doc-1',
        [{ name: 'Alex', email: 'alex@example.com', type: 'employee', order: 1, status: 'pending' }],
        'Admin',
      ),
    ).rejects.toThrow(/approved/)
  })

  it('currentSigningTurn returns the lowest-order pending recipient', async () => {
    const api = await import('./signatureApi')
    const turn = api.currentSigningTurn([
      {
        id: '1',
        name: 'A',
        email: 'a@x.com',
        type: 'employer',
        order: 1,
        status: 'signed',
        signedAt: '2026-01-01',
        signedName: 'A',
        signatureImage: null,
        consentAt: null,
        declineReason: null,
        signingToken: null,
        inviteLastSentAt: null,
        inviteDeliveryStatus: null,
        inviteDeliveryDetail: null,
        inviteDeliveryUpdatedAt: null,
      },
      {
        id: '2',
        name: 'B',
        email: 'b@x.com',
        type: 'employee',
        order: 2,
        status: 'pending',
        signedAt: null,
        signedName: null,
        signatureImage: null,
        consentAt: null,
        declineReason: null,
        signingToken: null,
        inviteLastSentAt: null,
        inviteDeliveryStatus: null,
        inviteDeliveryDetail: null,
        inviteDeliveryUpdatedAt: null,
      },
    ])
    expect(turn?.email).toBe('b@x.com')
  })
})
