import { describe, expect, it } from 'vitest'
import {
  mapCapitalCall,
  mapCashSweep,
  mapCommitment,
  mapDeal,
  mapEntity,
  mapParty,
} from './supabaseMappers'

describe('supabaseMappers.mapEntity — ownership fields', () => {
  const baseRow = {
    id: 'ent-1',
    legal_name: 'Northgate Logistics Inc.',
    legal_form: 'corporation',
    fiscal_year_start: '2026-01-01',
    functional_currency: 'CAD',
    jurisdictions: ['ON'],
    active: true,
  }

  it('maps parent_entity_id and ownership_pct to camelCase', () => {
    const entity = mapEntity({
      ...baseRow,
      parent_entity_id: 'ent-2',
      ownership_pct: '100.00',
    })
    expect(entity.parentEntityId).toBe('ent-2')
    expect(entity.ownershipPct).toBe('100.00')
  })

  it('leaves ownership fields undefined when the columns are null', () => {
    const entity = mapEntity({ ...baseRow, parent_entity_id: null, ownership_pct: null })
    expect(entity.parentEntityId).toBeUndefined()
    expect(entity.ownershipPct).toBeUndefined()
  })

  it('leaves ownership fields undefined on rows predating the columns', () => {
    const entity = mapEntity(baseRow)
    expect(entity.parentEntityId).toBeUndefined()
    expect(entity.ownershipPct).toBeUndefined()
  })

  it('maps the trust legal form', () => {
    const entity = mapEntity({ ...baseRow, legal_form: 'trust' })
    expect(entity.legalForm).toBe('trust')
  })
})

describe('supabaseMappers.mapDeal', () => {
  const row = {
    id: 'deal-1',
    organization_id: 'org-1',
    entity_id: 'ent-2',
    name: { en: 'Verdun tuck-in', fr: 'Verdun — acquisition' },
    kind: 'acquisition',
    stage: 'diligence',
    counterparty: 'Verdun Freight Lines Ltd.',
    value: '850000.00',
    currency: 'CAD',
    target_date: '2026-11-30',
    owner: 'Martin Constantineau',
    notes: { en: 'Diligence on contracts.', fr: 'Vérification des contrats.' },
    watchlist_item_id: null,
    holding_id: null,
  }

  it('maps snake_case columns to the FinanceDeal shape', () => {
    const deal = mapDeal(row)
    expect(deal).toEqual({
      id: 'deal-1',
      entityId: 'ent-2',
      name: { en: 'Verdun tuck-in', fr: 'Verdun — acquisition' },
      kind: 'acquisition',
      stage: 'diligence',
      counterparty: 'Verdun Freight Lines Ltd.',
      value: '850000.00',
      currency: 'CAD',
      targetDate: '2026-11-30',
      owner: 'Martin Constantineau',
      notes: { en: 'Diligence on contracts.', fr: 'Vérification des contrats.' },
      watchlistItemId: undefined,
      holdingId: undefined,
    })
  })

  it('coerces numeric value to a decimal string', () => {
    const deal = mapDeal({ ...row, value: 250000 })
    expect(deal.value).toBe('250000')
  })

  it('leaves optional fields undefined when null or absent', () => {
    const deal = mapDeal({
      id: 'deal-2',
      entity_id: 'ent-2',
      name: 'Plain deal',
      kind: 'other',
      stage: 'sourcing',
      currency: 'CAD',
      counterparty: null,
      value: null,
      target_date: null,
      owner: null,
      notes: null,
    })
    expect(deal.counterparty).toBeUndefined()
    expect(deal.value).toBeUndefined()
    expect(deal.targetDate).toBeUndefined()
    expect(deal.owner).toBeUndefined()
    expect(deal.notes).toBeUndefined()
    expect(deal.watchlistItemId).toBeUndefined()
    expect(deal.holdingId).toBeUndefined()
  })

  it('keeps the soft links to watchlist items and holdings', () => {
    const deal = mapDeal({ ...row, watchlist_item_id: 'watch-1', holding_id: 'hold-1' })
    expect(deal.watchlistItemId).toBe('watch-1')
    expect(deal.holdingId).toBe('hold-1')
  })
})

describe('supabaseMappers.mapCommitment', () => {
  const row = {
    id: 'cm-1',
    organization_id: 'org-1',
    entity_id: 'ent-1',
    party_id: 'party-investor',
    label: { en: 'Series A commitment', fr: 'Engagement de série A' },
    committed: '250000.00',
    called: '100000.00',
    currency: 'CAD',
    next_call_date: '2026-10-15',
    status: 'active',
    notes: null,
  }

  it('maps snake_case columns to the FinanceCommitment shape', () => {
    expect(mapCommitment(row)).toEqual({
      id: 'cm-1',
      entityId: 'ent-1',
      partyId: 'party-investor',
      label: { en: 'Series A commitment', fr: 'Engagement de série A' },
      committed: '250000.00',
      called: '100000.00',
      currency: 'CAD',
      nextCallDate: '2026-10-15',
      status: 'active',
      notes: undefined,
    })
  })

  it('coerces numeric amounts to decimal strings', () => {
    const c = mapCommitment({ ...row, committed: 250000, called: 0 })
    expect(c.committed).toBe('250000')
    expect(c.called).toBe('0')
  })

  it('leaves optional fields undefined when null', () => {
    const c = mapCommitment({ ...row, label: null, next_call_date: null })
    expect(c.label).toBeUndefined()
    expect(c.nextCallDate).toBeUndefined()
  })
})

describe('supabaseMappers.mapCapitalCall', () => {
  const row = {
    id: 'call-1',
    organization_id: 'org-1',
    commitment_id: 'cmt-1',
    amount: '250000.00',
    due_date: '2026-11-15',
    status: 'notified',
    reference: 'Call notice 2026-02',
    received_date: null,
    notes: null,
  }

  it('maps snake_case columns to the FinanceCapitalCall shape', () => {
    expect(mapCapitalCall(row)).toEqual({
      id: 'call-1',
      commitmentId: 'cmt-1',
      amount: '250000.00',
      dueDate: '2026-11-15',
      status: 'notified',
      reference: 'Call notice 2026-02',
      receivedDate: undefined,
      notes: undefined,
    })
  })

  it('coerces numeric amount and keeps the received date', () => {
    const c = mapCapitalCall({ ...row, amount: 250000, status: 'received', received_date: '2026-11-10' })
    expect(c.amount).toBe('250000')
    expect(c.receivedDate).toBe('2026-11-10')
  })
})

describe('supabaseMappers.mapParty — contact fields (0173)', () => {
  const row = {
    id: 'party-1',
    entity_id: 'ent-2',
    name: 'Laurentian Growth Partners',
    type: 'investor',
    banking_details_on_file: true,
    active: true,
    contact_name: 'Amélie Bouchard',
    contact_email: 'abouchard@example.com',
    contact_phone: null,
  }

  it('maps contact columns to camelCase', () => {
    const p = mapParty(row)
    expect(p.contactName).toBe('Amélie Bouchard')
    expect(p.contactEmail).toBe('abouchard@example.com')
    expect(p.contactPhone).toBeUndefined()
  })

  it('leaves contact fields undefined on rows predating the columns', () => {
    const { contact_name: _n, contact_email: _e, contact_phone: _p, ...oldRow } = row
    const p = mapParty(oldRow)
    expect(p.contactName).toBeUndefined()
    expect(p.contactEmail).toBeUndefined()
    expect(p.contactPhone).toBeUndefined()
  })
})

describe('supabaseMappers.mapCashSweep', () => {
  const row = {
    id: 'sweep-1',
    organization_id: 'org-1',
    entity_id: 'ent-1',
    from_account_id: 'bank-1',
    to_account_id: 'bank-2',
    amount: '4000.00',
    currency: 'CAD',
    status: 'executed',
    scheduled_date: '2026-09-15',
    executed_date: '2026-09-16',
    reference: 'Q3 instalment sweep',
    notes: null,
  }

  it('maps snake_case columns to the FinanceCashSweep shape', () => {
    expect(mapCashSweep(row)).toEqual({
      id: 'sweep-1',
      entityId: 'ent-1',
      fromAccountId: 'bank-1',
      toAccountId: 'bank-2',
      amount: '4000.00',
      currency: 'CAD',
      status: 'executed',
      scheduledDate: '2026-09-15',
      executedDate: '2026-09-16',
      reference: 'Q3 instalment sweep',
      notes: undefined,
    })
  })

  it('leaves executed date and reference undefined on scheduled rows', () => {
    const c = mapCashSweep({ ...row, status: 'scheduled', executed_date: null, reference: null })
    expect(c.status).toBe('scheduled')
    expect(c.executedDate).toBeUndefined()
    expect(c.reference).toBeUndefined()
  })
})
