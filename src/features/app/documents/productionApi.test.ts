import { afterEach, describe, expect, it, vi } from 'vitest'

/** Same per-test client mock + fresh import pattern as the other productionApi tests. */
describe('documents productionApi', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  const ROW = {
    id: 'doc-1',
    ref: 'DOC-2026-0822-120000',
    title_en: 'Offer letter',
    title_fr: 'Lettre d’offre',
    template_tid: 'T01',
    template_key: 'offer-letter',
    template_version: '1.0',
    employee_id: 'emp-1',
    case_id: null,
    jurisdiction: 'ON',
    language: 'en',
    status: 'draft',
    signature_status: 'not_sent',
    review_status: 'hr_review_required',
    risk: 'medium',
    answers_json: { employee_name: 'Alex' },
    current_version: 1,
    archived_at: null,
    created_at: '2026-08-22T12:00:00Z',
    updated_at: '2026-08-22T12:00:00Z',
  }

  const VERSION_ROW = {
    id: 'ver-1',
    version_number: 1,
    change_summary_en: 'Initial version',
    change_summary_fr: 'Version initiale',
    content_json: { blocks: [{ type: 'title', text: { en: 'Offer', fr: 'Offre' } }], values: {} },
    answers_json: { employee_name: 'Alex' },
    created_at: '2026-08-22T12:00:00Z',
  }

  const AUDIT_ROW = {
    id: 'aud-1',
    event_type: 'document_created',
    actor_label: 'Admin',
    meta: 'T01',
    created_at: '2026-08-22T12:00:00Z',
  }

  it('listDocuments returns parsed rows scoped to the org, newest first', async () => {
    const order = vi.fn().mockResolvedValue({ data: [ROW], error: null })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ select }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    const rows = await api.listDocuments('org-1')
    expect(eq).toHaveBeenCalledWith('organization_id', 'org-1')
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(rows).toEqual([
      {
        id: 'doc-1',
        ref: 'DOC-2026-0822-120000',
        title: { en: 'Offer letter', fr: 'Lettre d’offre' },
        templateTid: 'T01',
        templateKey: 'offer-letter',
        templateVersion: '1.0',
        employeeId: 'emp-1',
        caseId: null,
        jurisdiction: 'ON',
        language: 'en',
        status: 'draft',
        signatureStatus: 'not_sent',
        reviewStatus: 'hr_review_required',
        risk: 'medium',
        answers: { employee_name: 'Alex' },
        currentVersion: 1,
        archivedAt: null,
        createdAt: '2026-08-22T12:00:00Z',
        updatedAt: '2026-08-22T12:00:00Z',
      },
    ])
  })

  it('createDocument inserts header, version 1, and audit event', async () => {
    const single = vi.fn().mockResolvedValue({ data: ROW, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const docInsert = vi.fn().mockReturnValue({ select })
    const versionInsert = vi.fn().mockResolvedValue({ error: null })
    const auditInsert = vi.fn().mockResolvedValue({ error: null })
    const from = vi.fn((table: string) => {
      if (table === 'hr_generated_documents') return { insert: docInsert }
      if (table === 'hr_document_versions') return { insert: versionInsert }
      if (table === 'hr_document_audit_events') return { insert: auditInsert }
      throw new Error(`unexpected table ${table}`)
    })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    const created = await api.createDocument('org-1', {
      title: { en: 'Offer letter', fr: 'Lettre d’offre' },
      templateTid: 'T01',
      templateKey: 'offer-letter',
      templateVersion: '1.0',
      employeeId: 'emp-1',
      jurisdiction: 'ON',
      language: 'en',
      reviewStatus: 'hr_review_required',
      risk: 'medium',
      answers: { employee_name: 'Alex' },
      content: { blocks: [], values: { employee_name: 'Alex' } },
      actorLabel: 'Admin',
    })

    expect(docInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: 'org-1',
        title_en: 'Offer letter',
        title_fr: 'Lettre d’offre',
        template_tid: 'T01',
        status: 'draft',
        signature_status: 'not_sent',
        current_version: 1,
      }),
    )
    expect(versionInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: 'org-1',
        document_id: 'doc-1',
        version_number: 1,
        content_json: { blocks: [], values: { employee_name: 'Alex' } },
      }),
    )
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'document_created',
        actor_label: 'Admin',
        meta: 'T01',
      }),
    )
    expect(created.id).toBe('doc-1')
  })

  it('getDocument returns null when missing, and detail when present', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const eq2 = vi.fn().mockReturnValue({ maybeSingle })
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
    const select = vi.fn().mockReturnValue({ eq: eq1 })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ select }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')
    expect(await api.getDocument('org-1', 'missing')).toBeNull()

    const versionOrder = vi.fn().mockResolvedValue({ data: [VERSION_ROW], error: null })
    const auditOrder = vi.fn().mockResolvedValue({ data: [AUDIT_ROW], error: null })
    const versionEqOrg = vi.fn().mockReturnValue({ order: versionOrder })
    const versionEqDoc = vi.fn().mockReturnValue({ eq: versionEqOrg })
    const auditEqOrg = vi.fn().mockReturnValue({ order: auditOrder })
    const auditEqDoc = vi.fn().mockReturnValue({ eq: auditEqOrg })
    const docMaybe = vi.fn().mockResolvedValue({ data: ROW, error: null })
    const docEqId = vi.fn().mockReturnValue({ maybeSingle: docMaybe })
    const docEqOrg = vi.fn().mockReturnValue({ eq: docEqId })

    const sigLimit = vi.fn().mockResolvedValue({ data: [], error: null })
    const sigOrder = vi.fn().mockReturnValue({ limit: sigLimit })
    const sigEqDoc = vi.fn().mockReturnValue({ order: sigOrder })
    const sigEqOrg = vi.fn().mockReturnValue({ eq: sigEqDoc })
    const sigSelect = vi.fn().mockReturnValue({ eq: sigEqOrg })

    const from = vi.fn((table: string) => {
      if (table === 'hr_generated_documents') {
        return { select: vi.fn().mockReturnValue({ eq: docEqOrg }) }
      }
      if (table === 'hr_document_versions') {
        return { select: vi.fn().mockReturnValue({ eq: versionEqDoc }) }
      }
      if (table === 'hr_document_audit_events') {
        return { select: vi.fn().mockReturnValue({ eq: auditEqDoc }) }
      }
      if (table === 'hr_document_signatures') {
        return { select: sigSelect }
      }
      throw new Error(`unexpected table ${table}`)
    })
    vi.doMock('@/lib/supabaseClient', () => ({ supabase: { from } }))
    vi.resetModules()
    const api2 = await import('./productionApi')
    const detail = await api2.getDocument('org-1', 'doc-1')
    expect(detail?.versions).toHaveLength(1)
    expect(detail?.audit[0]?.eventType).toBe('document_created')
    expect(detail?.versions[0]?.content.blocks[0]).toEqual({
      type: 'title',
      text: { en: 'Offer', fr: 'Offre' },
    })
  })

  it('archiveDocument stamps archived status and timestamp', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ update }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await api.archiveDocument('doc-1')
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'archived', archived_at: expect.any(String) }),
    )
    expect(eq).toHaveBeenCalledWith('id', 'doc-1')
  })

  it('listDocuments throws when the read fails', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: new Error('rls') })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ select }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')
    await expect(api.listDocuments('org-1')).rejects.toThrow()
  })

  it('allocateDocumentRef is DOC-YYYY-MMDD-HHMMSS shaped', async () => {
    const api = await import('./productionApi')
    const ref = api.allocateDocumentRef(new Date('2026-08-22T15:04:05Z'))
    expect(ref).toMatch(/^DOC-2026-\d{4}-\d{6}$/)
  })
})
