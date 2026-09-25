import { describe, expect, it } from 'vitest'
import { mapDeal, mapEntity } from './supabaseMappers'

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
