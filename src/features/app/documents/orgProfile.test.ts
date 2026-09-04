import { describe, expect, it } from 'vitest'
import { activeHeadcount, orgProfileForIdentity } from './orgProfile'
import { defaultOrgProfile } from './data'

describe('orgProfileForIdentity', () => {
  it('does not inherit Northgate demo headcount or sector', () => {
    const profile = orgProfileForIdentity({
      companyName: 'Dutiva Canada Inc.',
      province: 'Ontario',
      user: {
        name: 'Martin',
        initials: 'MC',
        role: { en: 'Admin', fr: 'Admin' },
        email: 'martin.constantineau@dutiva.ca',
      },
    })
    expect(profile.name).toBe('Dutiva Canada Inc.')
    expect(profile.headcount).toBe(1)
    expect(profile.headcount).not.toBe(defaultOrgProfile.headcount)
    expect(profile.sector).toBe('prof_services')
    expect(profile.sector).not.toBe(defaultOrgProfile.sector)
    expect(profile.primaryJurisdiction).toBe('ON')
  })

  it('maps Québec province to QC', () => {
    const profile = orgProfileForIdentity({
      companyName: 'Exemple',
      province: 'Québec',
      user: {
        name: 'A',
        initials: 'A',
        role: { en: 'Admin', fr: 'Admin' },
        email: 'a@example.com',
      },
    })
    expect(profile.primaryJurisdiction).toBe('QC')
  })
})

describe('activeHeadcount', () => {
  it('counts active and on-leave people, not terminated', () => {
    expect(
      activeHeadcount([
        { status: 'active' },
        { status: 'on_leave' },
        { status: 'terminated' },
      ]),
    ).toBe(2)
  })

  it('never reports zero — provisional floor is 1', () => {
    expect(activeHeadcount([])).toBe(1)
    expect(activeHeadcount([{ status: 'terminated' }])).toBe(1)
  })
})
