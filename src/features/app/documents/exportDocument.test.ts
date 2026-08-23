import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ProductionDocumentDetail } from './productionApi'

const mocks = vi.hoisted(() => ({
  authorizeExport: vi.fn(),
  buildSignedDocumentPdf: vi.fn(),
  triggerDownload: vi.fn(),
  recordDocumentExport: vi.fn(),
  uploadDocumentExportPdf: vi.fn(),
}))

vi.mock('@/lib/exportProtection', () => ({
  authorizeExport: mocks.authorizeExport,
  exportDenialMessage: vi.fn(() => ({ en: 'Denied', fr: 'Refusé' })),
  exportFilename: vi.fn(() => 'export.pdf'),
  triggerDownload: mocks.triggerDownload,
  watermarkFooterLines: vi.fn(() => ['watermark', 'confidential']),
}))

vi.mock('./signedDocumentPdf', () => ({ buildSignedDocumentPdf: mocks.buildSignedDocumentPdf }))
vi.mock('./exportDocumentApi', () => ({ recordDocumentExport: mocks.recordDocumentExport }))
vi.mock('./exportStorageApi', () => ({
  uploadDocumentExportPdf: mocks.uploadDocumentExportPdf,
}))

const signedDetail: ProductionDocumentDetail = {
  id: 'doc-1',
  ref: 'DOC-2026-0823-120000',
  title: { en: 'Offer letter', fr: 'Lettre d’offre' },
  templateTid: 'T09',
  templateKey: 'offer-letter',
  templateVersion: '1.0.0',
  employeeId: null,
  caseId: null,
  jurisdiction: 'ON',
  language: 'en',
  status: 'signed',
  signatureStatus: 'signed',
  reviewStatus: 'approved_for_use',
  risk: 'low',
  answers: {},
  currentVersion: 1,
  archivedAt: null,
  createdAt: '2026-08-22T12:00:00Z',
  updatedAt: '2026-08-22T12:00:00Z',
  versions: [
    {
      id: 'ver-1',
      versionNumber: 1,
      changeSummary: { en: 'Initial', fr: 'Initial' },
      content: {
        blocks: [{ type: 'para', text: { en: 'Body', fr: 'Corps' } }],
        values: {},
      },
      answers: {},
      createdAt: '2026-08-22T12:00:00Z',
    },
  ],
  audit: [],
  recipients: [
    {
      id: 'r1',
      name: 'Alex Chen',
      email: 'alex@example.com',
      type: 'employee',
      order: 1,
      status: 'signed',
      signedName: 'Alex Chen',
      signatureImage: 'data:image/png;base64,abc',
      signedAt: '2026-08-22T14:00:00Z',
      consentAt: '2026-08-22T13:55:00Z',
      declineReason: null,
      signingToken: '00000000-0000-4000-8000-000000000099',
      inviteLastSentAt: null,
      inviteDeliveryStatus: null,
      inviteDeliveryDetail: null,
      inviteDeliveryUpdatedAt: null,
      tokenExpiresAt: null,
      tokenRevokedAt: null,
    },
  ],
  signature: {
    id: 'sig-1',
    provider: 'dutiva_embedded',
    envelopeId: 'ENV-TEST',
    status: 'signed',
    sentAt: '2026-08-22T12:30:00Z',
    signedAt: '2026-08-22T14:00:00Z',
    contentHash: 'abc123',
  },
}

describe('exportSignedDocumentPdf', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns not_signed when the envelope is incomplete', async () => {
    const { exportSignedDocumentPdf } = await import('./exportDocument')
    const result = await exportSignedDocumentPdf({
      organizationId: 'org-1',
      detail: { ...signedDetail, signatureStatus: 'partially_signed' },
      lang: 'en',
      actorLabel: 'Admin',
      workspaceLabel: 'Northgate Logistics Inc.',
      session: null,
    })
    expect(result).toEqual({ ok: false, reason: 'not_signed' })
    expect(mocks.authorizeExport).not.toHaveBeenCalled()
  })

  it('builds a signed PDF, uploads it, downloads it, and records the export', async () => {
    mocks.authorizeExport.mockResolvedValue({
      allowed: true,
      recordedRemotely: true,
      stamp: {
        exportId: '00000000-0000-4000-8000-000000000001',
        actorLabel: 'Admin',
        workspaceLabel: 'Northgate Logistics Inc.',
        exportedAt: new Date('2026-08-23T12:00:00.000Z'),
      },
    })
    mocks.buildSignedDocumentPdf.mockResolvedValue(new Uint8Array([37, 80, 68, 70]))
    mocks.uploadDocumentExportPdf.mockResolvedValue({
      storagePath: 'org-1/doc-1/00000000-0000-4000-8000-000000000001.pdf',
      fileSha256: 'deadbeef',
      sizeBytes: 4,
    })
    mocks.recordDocumentExport.mockResolvedValue(undefined)

    const { exportSignedDocumentPdf } = await import('./exportDocument')
    const result = await exportSignedDocumentPdf({
      organizationId: 'org-1',
      detail: signedDetail,
      lang: 'en',
      actorLabel: 'Admin',
      workspaceLabel: 'Northgate Logistics Inc.',
      session: null,
    })

    expect(result.ok).toBe(true)
    expect(mocks.buildSignedDocumentPdf).toHaveBeenCalled()
    expect(mocks.uploadDocumentExportPdf).toHaveBeenCalled()
    expect(mocks.triggerDownload).toHaveBeenCalled()
    expect(mocks.recordDocumentExport).toHaveBeenCalledWith(
      'org-1',
      'doc-1',
      1,
      'pdf',
      '00000000-0000-4000-8000-000000000001',
      true,
      'Admin',
      expect.objectContaining({ storagePath: expect.stringContaining('.pdf') }),
    )
  })
})
