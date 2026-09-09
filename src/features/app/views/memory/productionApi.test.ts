import { afterEach, describe, expect, it, vi } from 'vitest'
import { listChain } from '@/test/productionWorkspace'

const FACT_ROW = {
  id: 'fact-1',
  scope: 'person',
  entity_id: 'emp-1',
  category: 'employment',
  statement_en: 'Started March 2018',
  statement_fr: 'Début en mars 2018',
  confidence: 'inferred',
  source_type: 'hris',
  source_detail_en: 'People record',
  source_detail_fr: 'Dossier du personnel',
  learned_at: '2026-07-05T14:52:00Z',
  confirmed_at: null,
  visibility: 'hr',
  sensitive: false,
  // Governance columns (migration 0155) — null for legacy rows
  status: null,
  classification: null,
  origin: null,
  sensitivity: null,
  advisor_usable: null,
  retention_category: null,
  review_date: null,
  expiry_date: null,
  last_verified_at: null,
  legal_hold_reason_en: null,
  legal_hold_reason_fr: null,
  legal_hold_placed_by: null,
  legal_hold_placed_at: null,
  purpose_en: null,
  purpose_fr: null,
  jurisdiction: null,
  proposed_by: null,
  confidence_score: null,
  creator_label: null,
  confirmed_by_label: null,
  source_excerpt_en: null,
  source_excerpt_fr: null,
  retrieval_scope_type: null,
  retrieval_scope_id: null,
}

describe('memory productionApi', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  function mockClient(fromImpl: (table: string) => unknown) {
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getUser: () => Promise.resolve({ data: { user: { id: 'u1' } }, error: null }),
        },
        from: vi.fn((table: string) => fromImpl(table)),
      },
    }))
  }

  it('listFacts returns parsed MemoryFact rows scoped to the org', async () => {
    const order = vi.fn().mockReturnValue(listChain([FACT_ROW]))
    const is = vi.fn().mockReturnValue({ order })
    const eq = vi.fn().mockReturnValue({ is })
    const select = vi.fn().mockReturnValue({ eq })
    mockClient(() => ({ select }))
    vi.resetModules()
    const api = await import('./productionApi')

    const rows = await api.listFacts('org-1')
    expect(eq).toHaveBeenCalledWith('organization_id', 'org-1')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      id: 'fact-1',
      scope: 'person',
      entityId: 'emp-1',
      category: 'employment',
      confidence: 'inferred',
      statement: { en: 'Started March 2018', fr: 'Début en mars 2018' },
      confirmation: null,
      sensitive: false,
    })
  })

  it('listFacts throws when the read fails', async () => {
    const order = vi.fn().mockReturnValue(listChain([], new Error('rls')))
    const is = vi.fn().mockReturnValue({ order })
    const eq = vi.fn().mockReturnValue({ is })
    const select = vi.fn().mockReturnValue({ eq })
    mockClient(() => ({ select }))
    vi.resetModules()
    const api = await import('./productionApi')

    await expect(api.listFacts('org-1')).rejects.toThrow()
  })

  it('listFactsByEntity filters by scope and entity', async () => {
    const order = vi.fn().mockReturnValue(listChain([FACT_ROW]))
    const is = vi.fn().mockReturnValue({ order })
    const eqEntity = vi.fn().mockReturnValue({ is })
    const eqScope = vi.fn().mockReturnValue({ eq: eqEntity })
    const eqOrg = vi.fn().mockReturnValue({ eq: eqScope })
    const select = vi.fn().mockReturnValue({ eq: eqOrg })
    mockClient(() => ({ select }))
    vi.resetModules()
    const api = await import('./productionApi')

    await api.listFactsByEntity('org-1', 'person', 'emp-1')
    expect(eqOrg).toHaveBeenCalledWith('organization_id', 'org-1')
    expect(eqScope).toHaveBeenCalledWith('scope', 'person')
    expect(eqEntity).toHaveBeenCalledWith('entity_id', 'emp-1')
  })

  it('confirmFact promotes inferred → confirmed and writes audit', async () => {
    const confirmed = {
      ...FACT_ROW,
      confidence: 'confirmed',
      confirmed_at: '2026-08-23T12:00:00Z',
    }
    const maybeSingle = vi.fn().mockResolvedValue({ data: FACT_ROW, error: null })
    const is = vi.fn().mockReturnValue({ maybeSingle })
    const eqOrgRead = vi.fn().mockReturnValue({ is })
    const eqIdRead = vi.fn().mockReturnValue({ eq: eqOrgRead })
    const selectRead = vi.fn().mockReturnValue({ eq: eqIdRead })

    const single = vi.fn().mockResolvedValue({ data: confirmed, error: null })
    const selectUpdate = vi.fn().mockReturnValue({ single })
    const eqOrgUpdate = vi.fn().mockReturnValue({ select: selectUpdate })
    const eqIdUpdate = vi.fn().mockReturnValue({ eq: eqOrgUpdate })
    const update = vi.fn().mockReturnValue({ eq: eqIdUpdate })

    const insert = vi.fn().mockResolvedValue({ error: null })

    mockClient((table) => {
      if (table === 'hr_advisor_memory_audit') return { insert }
      return { select: selectRead, update }
    })
    vi.resetModules()
    const api = await import('./productionApi')

    const fact = await api.confirmFact('org-1', 'fact-1')
    expect(fact.confidence).toBe('confirmed')
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ confidence: 'confirmed', updated_by: 'u1' }),
    )
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: 'org-1',
        fact_id: 'fact-1',
        action: 'confirm',
        statement_en: 'Started March 2018',
      }),
    )
  })

  it('correctFact updates both statement columns and audits the prior text', async () => {
    const corrected = {
      ...FACT_ROW,
      statement_en: 'Started April 2018',
      statement_fr: 'Started April 2018',
    }
    const maybeSingle = vi.fn().mockResolvedValue({ data: FACT_ROW, error: null })
    const is = vi.fn().mockReturnValue({ maybeSingle })
    const eqOrgRead = vi.fn().mockReturnValue({ is })
    const eqIdRead = vi.fn().mockReturnValue({ eq: eqOrgRead })
    const selectRead = vi.fn().mockReturnValue({ eq: eqIdRead })

    const single = vi.fn().mockResolvedValue({ data: corrected, error: null })
    const selectUpdate = vi.fn().mockReturnValue({ single })
    const eqOrgUpdate = vi.fn().mockReturnValue({ select: selectUpdate })
    const eqIdUpdate = vi.fn().mockReturnValue({ eq: eqOrgUpdate })
    const update = vi.fn().mockReturnValue({ eq: eqIdUpdate })
    const insert = vi.fn().mockResolvedValue({ error: null })

    mockClient((table) => {
      if (table === 'hr_advisor_memory_audit') return { insert }
      return { select: selectRead, update }
    })
    vi.resetModules()
    const api = await import('./productionApi')

    const fact = await api.correctFact('org-1', 'fact-1', 'Started April 2018')
    expect(fact.statement.en).toBe('Started April 2018')
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        statement_en: 'Started April 2018',
        statement_fr: 'Started April 2018',
      }),
    )
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'correct', statement_en: 'Started March 2018' }),
    )
  })

  it('forgetFact soft-deletes and audits', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: FACT_ROW, error: null })
    const is = vi.fn().mockReturnValue({ maybeSingle })
    const eqOrgRead = vi.fn().mockReturnValue({ is })
    const eqIdRead = vi.fn().mockReturnValue({ eq: eqOrgRead })
    const selectRead = vi.fn().mockReturnValue({ eq: eqIdRead })

    const eqOrgUpdate = vi.fn().mockResolvedValue({ error: null })
    const eqIdUpdate = vi.fn().mockReturnValue({ eq: eqOrgUpdate })
    const update = vi.fn().mockReturnValue({ eq: eqIdUpdate })
    const insert = vi.fn().mockResolvedValue({ error: null })

    mockClient((table) => {
      if (table === 'hr_advisor_memory_audit') return { insert }
      return { select: selectRead, update }
    })
    vi.resetModules()
    const api = await import('./productionApi')

    await api.forgetFact('org-1', 'fact-1')
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ forgotten_at: expect.any(String), updated_by: 'u1' }),
    )
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ action: 'forget' }))
  })

  it('forgetFactsForEntity soft-forgets every active fact for that entity', async () => {
    const fact2 = { ...FACT_ROW, id: 'fact-2', statement_en: 'Role: Analyst' }
    const is = vi.fn().mockReturnValue(listChain([FACT_ROW, fact2]))
    const eqEntity = vi.fn().mockReturnValue({ is })
    const eqScope = vi.fn().mockReturnValue({ eq: eqEntity })
    const eqOrg = vi.fn().mockReturnValue({ eq: eqScope })
    const select = vi.fn().mockReturnValue({ eq: eqOrg })

    const eqOrgUpdate = vi.fn().mockResolvedValue({ error: null })
    const eqIdUpdate = vi.fn().mockReturnValue({ eq: eqOrgUpdate })
    const update = vi.fn().mockReturnValue({ eq: eqIdUpdate })
    const insert = vi.fn().mockResolvedValue({ error: null })

    mockClient((table) => {
      if (table === 'hr_advisor_memory_audit') return { insert }
      return { select, update }
    })
    vi.resetModules()
    const api = await import('./productionApi')

    const n = await api.forgetFactsForEntity('org-1', 'person', 'emp-1')
    expect(n).toBe(2)
    expect(update).toHaveBeenCalledTimes(2)
    expect(insert).toHaveBeenCalledTimes(2)
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'forget', fact_id: 'fact-1' }),
    )
  })

  it('createFact inserts a confirmed manual fact and audits create', async () => {
    const created = {
      ...FACT_ROW,
      confidence: 'confirmed',
      confirmed_at: '2026-08-23T12:00:00Z',
      source_type: 'manual',
    }
    const single = vi.fn().mockResolvedValue({ data: created, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const insertFact = vi.fn().mockReturnValue({ select })
    const insertAudit = vi.fn().mockResolvedValue({ error: null })

    mockClient((table) => {
      if (table === 'hr_advisor_memory_audit') return { insert: insertAudit }
      return { insert: insertFact }
    })
    vi.resetModules()
    const api = await import('./productionApi')

    const fact = await api.createFact('org-1', {
      scope: 'person',
      entityId: 'emp-1',
      category: 'note',
      statementEn: 'Prefers email follow-ups',
      statementFr: 'Préfère les suivis par courriel',
    })
    expect(insertFact).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: 'org-1',
        entity_id: 'emp-1',
        confidence: 'confirmed',
        source_type: 'manual',
        created_by: 'u1',
      }),
    )
    expect(insertAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'create' }))
    expect(fact.confidence).toBe('confirmed')
  })

  it('createFact persists governance fields (classification, sensitivity, retrieval scope)', async () => {
    const created = {
      ...FACT_ROW,
      confidence: 'confirmed',
      confirmed_at: '2026-08-23T12:00:00Z',
      source_type: 'manual',
      status: 'confirmed',
      classification: 'fact',
      origin: 'manual',
      sensitivity: 'standard',
      advisor_usable: true,
      retrieval_scope_type: 'case',
      retrieval_scope_id: 'case-1',
    }
    const single = vi.fn().mockResolvedValue({ data: created, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const insertFact = vi.fn().mockReturnValue({ select })
    const insertAudit = vi.fn().mockResolvedValue({ error: null })

    mockClient((table) => {
      if (table === 'hr_advisor_memory_audit') return { insert: insertAudit }
      return { insert: insertFact }
    })
    vi.resetModules()
    const api = await import('./productionApi')

    const fact = await api.createFact('org-1', {
      scope: 'person',
      entityId: 'emp-1',
      category: 'note',
      statementEn: 'Prefers email follow-ups',
      statementFr: 'Préfère les suivis par courriel',
      classification: 'fact',
      sensitivity: 'standard',
      retrievalScope: { type: 'case', id: 'case-1' },
    })
    expect(insertFact).toHaveBeenCalledWith(
      expect.objectContaining({
        classification: 'fact',
        sensitivity: 'standard',
        retrieval_scope_type: 'case',
        retrieval_scope_id: 'case-1',
      }),
    )
    expect(fact.retrievalScope).toEqual({ type: 'case', id: 'case-1' })
    expect(fact.classification).toBe('fact')
  })

  it('addLegalHold sets the hold columns and audits legal_hold_added', async () => {
    const held = {
      ...FACT_ROW,
      legal_hold_reason_en: 'Pending litigation',
      legal_hold_reason_fr: 'Litige en cours',
      legal_hold_placed_by: 'Riley Summers',
      legal_hold_placed_at: '2026-08-23T12:00:00Z',
    }
    const maybeSingle = vi.fn().mockResolvedValue({ data: FACT_ROW, error: null })
    const is = vi.fn().mockReturnValue({ maybeSingle })
    const eqOrgRead = vi.fn().mockReturnValue({ is })
    const eqIdRead = vi.fn().mockReturnValue({ eq: eqOrgRead })
    const selectRead = vi.fn().mockReturnValue({ eq: eqIdRead })

    const single = vi.fn().mockResolvedValue({ data: held, error: null })
    const selectUpdate = vi.fn().mockReturnValue({ single })
    const eqOrgUpdate = vi.fn().mockReturnValue({ select: selectUpdate })
    const eqIdUpdate = vi.fn().mockReturnValue({ eq: eqOrgUpdate })
    const update = vi.fn().mockReturnValue({ eq: eqIdUpdate })
    const insert = vi.fn().mockResolvedValue({ error: null })

    mockClient((table) => {
      if (table === 'hr_advisor_memory_audit') return { insert }
      return { select: selectRead, update }
    })
    vi.resetModules()
    const api = await import('./productionLifecycleApi')

    const fact = await api.addLegalHold('org-1', 'fact-1', 'Pending litigation', 'Litige en cours', 'Riley Summers')
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        legal_hold_reason_en: 'Pending litigation',
        legal_hold_placed_by: 'Riley Summers',
      }),
    )
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ action: 'legal_hold_added' }))
    expect(fact.legalHold).not.toBeNull()
    expect(fact.legalHold?.placedBy).toBe('Riley Summers')
  })

  it('markForReview sets status to needs_review and audits review_requested', async () => {
    const reviewed = { ...FACT_ROW, status: 'needs_review' }
    const maybeSingle = vi.fn().mockResolvedValue({ data: FACT_ROW, error: null })
    const is = vi.fn().mockReturnValue({ maybeSingle })
    const eqOrgRead = vi.fn().mockReturnValue({ is })
    const eqIdRead = vi.fn().mockReturnValue({ eq: eqOrgRead })
    const selectRead = vi.fn().mockReturnValue({ eq: eqIdRead })

    const single = vi.fn().mockResolvedValue({ data: reviewed, error: null })
    const selectUpdate = vi.fn().mockReturnValue({ single })
    const eqOrgUpdate = vi.fn().mockReturnValue({ select: selectUpdate })
    const eqIdUpdate = vi.fn().mockReturnValue({ eq: eqOrgUpdate })
    const update = vi.fn().mockReturnValue({ eq: eqIdUpdate })
    const insert = vi.fn().mockResolvedValue({ error: null })

    mockClient((table) => {
      if (table === 'hr_advisor_memory_audit') return { insert }
      return { select: selectRead, update }
    })
    vi.resetModules()
    const api = await import('./productionLifecycleApi')

    const fact = await api.markForReview('org-1', 'fact-1')
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'needs_review' }))
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ action: 'review_requested' }))
    expect(fact.status).toBe('needs_review')
  })
})
