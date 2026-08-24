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
      confirmed: null,
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
    const corrected = { ...FACT_ROW, statement_en: 'Started April 2018', statement_fr: 'Started April 2018' }
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
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ action: 'forget', fact_id: 'fact-1' }))
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
})
