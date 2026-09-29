import { describe, expect, it } from 'vitest'
import {
  boardFacets,
  employmentTypeCode,
  filterFromParams,
  filterPostings,
  filterToParams,
  salaryLabel,
  workplaceType,
} from './boardFilters'
import type { BoardFilter } from './boardFilters'
import { FIXTURE_POSTINGS, makePosting } from './postingFixtures'

const empty: BoardFilter = {
  q: '',
  location: '',
  workplace: '',
  employer: '',
  department: '',
  sort: 'newest',
}

describe('workplaceType', () => {
  it('classifies remote, hybrid, and on-site from free text', () => {
    expect(workplaceType(makePosting({ location: 'Remote (Canada)' }))).toBe('remote')
    expect(workplaceType(makePosting({ type: 'Télétravail' }))).toBe('remote')
    expect(workplaceType(makePosting({ type: 'Hybrid' }))).toBe('hybrid')
    expect(workplaceType(makePosting({ location: 'Hybride — Montréal' }))).toBe('hybrid')
    expect(workplaceType(makePosting({ location: 'Toronto, ON', type: 'Full-time' }))).toBe(
      'onsite',
    )
  })
})

describe('employmentTypeCode', () => {
  it('maps free-text types to schema.org codes', () => {
    expect(employmentTypeCode('Full-time')).toBe('FULL_TIME')
    expect(employmentTypeCode('Temps partiel')).toBe('PART_TIME')
    expect(employmentTypeCode('Contract')).toBe('CONTRACT')
    expect(employmentTypeCode('Internship')).toBe('INTERN')
    expect(employmentTypeCode('Something custom')).toBeUndefined()
  })
})

describe('filterPostings', () => {
  it('returns everything for an empty filter, newest first', () => {
    const out = filterPostings(FIXTURE_POSTINGS, empty)
    expect(out).toHaveLength(FIXTURE_POSTINGS.length)
    expect(out[0]!.slug).toBe('frontend-engineer-job-fe') // 2026-09-22
    expect(out[out.length - 1]!.slug).toBe('safety-officer-job-so') // null postedDate sorts last
  })

  it('keyword search matches title, department, location, employer — case-insensitive', () => {
    expect(
      filterPostings(FIXTURE_POSTINGS, { ...empty, q: 'engineer' }).map((p) => p.title),
    ).toEqual(['Frontend Engineer', 'Backend Engineer'])
    expect(
      filterPostings(FIXTURE_POSTINGS, { ...empty, q: 'human resources' }),
    ).toHaveLength(2)
    expect(filterPostings(FIXTURE_POSTINGS, { ...empty, q: 'meridian' })).toHaveLength(2)
    expect(filterPostings(FIXTURE_POSTINGS, { ...empty, q: 'nope-nothing' })).toHaveLength(0)
  })

  it('keyword search folds accents (Montréal matches montreal)', () => {
    expect(filterPostings(FIXTURE_POSTINGS, { ...empty, q: 'montreal' })).toHaveLength(1)
    expect(filterPostings(FIXTURE_POSTINGS, { ...empty, q: 'québec' })).toHaveLength(1)
  })

  it('facet filters compose with the query', () => {
    const out = filterPostings(FIXTURE_POSTINGS, {
      ...empty,
      q: 'engineer',
      workplace: 'remote',
    })
    expect(out.map((p) => p.title)).toEqual(['Frontend Engineer', 'Backend Engineer'])
    expect(
      filterPostings(FIXTURE_POSTINGS, { ...empty, employer: 'Meridian Health Group' }),
    ).toHaveLength(2)
    expect(
      filterPostings(FIXTURE_POSTINGS, { ...empty, department: 'Operations', workplace: 'onsite' }),
    ).toHaveLength(3)
  })

  it('relevance sort ranks title hits first, then recency', () => {
    const out = filterPostings(FIXTURE_POSTINGS, { ...empty, q: 'engineer', sort: 'relevance' })
    /* Both are remote engineers: Frontend (Sep 22) outranks Backend (Sep 10). */
    expect(out[0]!.title).toBe('Frontend Engineer')
    /* An employer-only match sorts below a title match. */
    const titled = filterPostings(FIXTURE_POSTINGS, {
      ...empty,
      q: 'northgate',
      sort: 'relevance',
    })
    expect(titled.every((p) => p.organizationName === 'Northgate Logistics Inc.')).toBe(true)
  })
})

describe('boardFacets', () => {
  it('collects distinct sorted facet values', () => {
    const facets = boardFacets(FIXTURE_POSTINGS, 'en')
    expect(facets.locations).toEqual([
      'Calgary, AB',
      'Mississauga, ON',
      'Montréal, QC',
      'Ottawa, ON',
      'Québec City, QC',
      'Remote (Canada)',
      'Toronto, ON',
    ])
    expect(facets.employers).toEqual(['Meridian Health Group', 'Northgate Logistics Inc.'])
    expect(facets.departments).toEqual([
      'Engineering',
      'Finance',
      'Human Resources',
      'Operations',
    ])
    expect(facets.workplaces).toEqual(['remote', 'hybrid', 'onsite'])
  })
})

describe('URL params round-trip', () => {
  it('serializes only non-empty values and parses them back', () => {
    const filter: BoardFilter = {
      q: 'engineer',
      location: 'Remote (Canada)',
      workplace: 'remote',
      employer: 'Northgate Logistics Inc.',
      department: 'Engineering',
      sort: 'relevance',
    }
    const params = filterToParams(filter)
    expect(params.get('q')).toBe('engineer')
    expect(params.get('loc')).toBe('Remote (Canada)')
    expect(params.get('type')).toBe('remote')
    expect(params.get('org')).toBe('Northgate Logistics Inc.')
    expect(params.get('dept')).toBe('Engineering')
    expect(params.get('sort')).toBe('relevance')
    expect(filterFromParams(params)).toEqual(filter)
  })

  it('drops unknown/garbage values and an empty filter serializes to nothing', () => {
    const params = new URLSearchParams('type=spaceship&sort=chaos&q=x')
    const parsed = filterFromParams(params)
    expect(parsed.workplace).toBe('')
    expect(parsed.sort).toBe('newest')
    expect(parsed.q).toBe('x')
    expect(filterToParams(empty).toString()).toBe('')
  })
})

describe('salaryLabel', () => {
  it('renders ranges, collapses equal bounds, and localizes the period', () => {
    const salaried = FIXTURE_POSTINGS.find((p) => p.slug === 'payroll-supervisor-job-pa')!
    expect(salaryLabel(salaried, 'en')).toBe('$78,000–$92,000/yr')
    expect(salaryLabel(salaried, 'fr')).toContain('/an')
    const flat = FIXTURE_POSTINGS.find((p) => p.slug === 'office-administrator-job-oa')!
    expect(salaryLabel(flat, 'en')).toBe('$24/hr')
    const hourly = FIXTURE_POSTINGS.find((p) => p.slug === 'backend-engineer-job-be')!
    expect(salaryLabel(hourly, 'en')).toBe('$85–$105/hr')
    const none = FIXTURE_POSTINGS.find((p) => p.slug === 'senior-recruiter-job-re')!
    expect(salaryLabel(none, 'en')).toBeNull()
  })
})
