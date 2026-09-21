import { describe, expect, it } from 'vitest'
import {
  NO_COMPANY,
  applyCompanyFilter,
  applyContactFilter,
  companyIndustries,
  contactViewsScope,
  isCompanyFilterActive,
  isContactFilterActive,
  emptyContactFilter,
  loadContactViews,
  persistContactViews,
} from './directoryFilters'
import type { CrmCompany, CrmContact } from './types'

const contacts: CrmContact[] = [
  {
    id: 'c1',
    name: 'Alice Tremblay',
    email: 'alice@acme.ca',
    phone: '555-0100',
    companyId: 'co-1',
    role: 'HR Manager',
    status: 'customer',
  },
  {
    id: 'c2',
    name: 'Bob Singh',
    email: 'bob@north.io',
    companyId: 'co-2',
    role: 'Ops Lead',
    status: 'lead',
  },
  {
    id: 'c3',
    name: 'Chloe Martin',
    role: 'Consultant',
    status: 'prospect',
  },
]

const companies: CrmCompany[] = [
  { id: 'co-1', name: 'Acme Freight', domain: 'acme.ca', industry: 'Logistics', size: '50' },
  { id: 'co-2', name: 'North Wind', domain: 'north.io', industry: 'Manufacturing' },
  { id: 'co-3', name: 'Solo Shop', industry: 'Logistics' },
]

const companyName = (id?: string) => companies.find((c) => c.id === id)?.name ?? ''

describe('applyContactFilter', () => {
  it('returns everything for an empty filter', () => {
    expect(applyContactFilter(contacts, emptyContactFilter(), companyName)).toHaveLength(3)
  })

  it('filters by status subset', () => {
    const out = applyContactFilter(
      contacts,
      { query: '', statuses: ['lead', 'prospect'] },
      companyName,
    )
    expect(out.map((c) => c.id)).toEqual(['c2', 'c3'])
  })

  it('filters by company, including the unassigned sentinel', () => {
    expect(
      applyContactFilter(contacts, { query: '', statuses: [], companyId: 'co-1' }, companyName).map(
        (c) => c.id,
      ),
    ).toEqual(['c1'])
    expect(
      applyContactFilter(
        contacts,
        { query: '', statuses: [], companyId: NO_COMPANY },
        companyName,
      ).map((c) => c.id),
    ).toEqual(['c3'])
  })

  it('matches query against name, role, email and company name', () => {
    expect(
      applyContactFilter(contacts, { query: 'hr manager', statuses: [] }, companyName).map(
        (c) => c.id,
      ),
    ).toEqual(['c1'])
    expect(
      applyContactFilter(contacts, { query: 'north.io', statuses: [] }, companyName).map(
        (c) => c.id,
      ),
    ).toEqual(['c2'])
    expect(
      applyContactFilter(contacts, { query: 'acme freight', statuses: [] }, companyName).map(
        (c) => c.id,
      ),
    ).toEqual(['c1'])
  })

  it('combines query, status and company', () => {
    const out = applyContactFilter(
      contacts,
      { query: 'alice', statuses: ['customer'], companyId: 'co-1' },
      companyName,
    )
    expect(out.map((c) => c.id)).toEqual(['c1'])
  })

  it('flags activity only when something is set', () => {
    expect(isContactFilterActive(emptyContactFilter())).toBe(false)
    expect(isContactFilterActive({ query: '  ', statuses: [] })).toBe(false)
    expect(isContactFilterActive({ query: '', statuses: ['lead'] })).toBe(true)
    expect(isContactFilterActive({ query: '', statuses: [], companyId: NO_COMPANY })).toBe(true)
  })
})

describe('applyCompanyFilter', () => {
  it('filters by industry and query', () => {
    expect(
      applyCompanyFilter(companies, { query: '', industry: 'Logistics' }).map((c) => c.id),
    ).toEqual(['co-1', 'co-3'])
    expect(applyCompanyFilter(companies, { query: 'north' }).map((c) => c.id)).toEqual(['co-2'])
  })

  it('reports activity state', () => {
    expect(isCompanyFilterActive({ query: '' })).toBe(false)
    expect(isCompanyFilterActive({ query: 'x' })).toBe(true)
    expect(isCompanyFilterActive({ query: '', industry: 'Logistics' })).toBe(true)
  })
})

describe('companyIndustries', () => {
  it('returns distinct sorted industries', () => {
    expect(companyIndustries(companies)).toEqual(['Logistics', 'Manufacturing'])
  })
})

describe('saved views', () => {
  it('scopes demo and production separately', () => {
    expect(contactViewsScope('demo', 'org-1')).toBe('demo')
    expect(contactViewsScope('production', 'org-1')).toBe('org-1')
    expect(contactViewsScope('production', undefined)).toBe('demo')
  })

  it('round-trips views through localStorage', () => {
    const scope = `test-${Date.now()}`
    persistContactViews(scope, [
      { id: 'v1', name: 'Customers', filter: { query: '', statuses: ['customer'] } },
    ])
    const loaded = loadContactViews(scope)
    expect(loaded).toHaveLength(1)
    expect(loaded[0]?.name).toBe('Customers')
    expect(loaded[0]?.filter.statuses).toEqual(['customer'])
  })

  it('drops malformed entries rather than failing', () => {
    const scope = `test-bad-${Date.now()}`
    localStorage.setItem(
      `dutiva-crm-contact-views-${scope}`,
      JSON.stringify([
        { id: 'ok', name: 'Fine', filter: { query: '', statuses: [] } },
        { bad: true },
        42,
      ]),
    )
    const loaded = loadContactViews(scope)
    expect(loaded).toHaveLength(1)
    expect(loaded[0]?.id).toBe('ok')
  })
})
