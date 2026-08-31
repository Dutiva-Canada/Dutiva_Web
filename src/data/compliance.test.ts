import { describe, expect, it } from 'vitest'
import { complianceItems, regulatoryWatchlist } from './compliance'
import { employees } from './employees'

describe('compliance fixture accuracy', () => {
  it('uses the official French heading for Jordan ESA s.57 citation', () => {
    const jordan = complianceItems.find((item) => item.id === 'ci1')
    expect(jordan?.citations[0]?.label.fr).toBe('LNE art. 57 — Délai de préavis de l’employeur')
    expect(jordan?.citations[0]?.label.fr).not.toMatch(/Préavis de cessation/i)
  })

  it('keeps Jordan budgeting action caveated as preliminary contingency planning', () => {
    const jordan = complianceItems.find((item) => item.id === 'ci1')
    expect(jordan?.action.en).toMatch(/preliminary range pending that review/i)
    expect(jordan?.action.en).not.toMatch(/budget toward the 12-month end/i)
  })

  it('records Quebec Law 25 portability as in force since September 22, 2024', () => {
    const law25 = regulatoryWatchlist.find((item) => item.title.en.includes('data portability'))
    expect(law25?.status.en).toBe('In force since Sep 22, 2024')
    expect(law25?.status.fr).toBe('En vigueur depuis le 22 sept. 2024')
    expect(law25?.status.en).not.toMatch(/Sep 2026|2026/)
  })

  it('replaces the unsupported Ontario sick-leave proposal with verified in-force guidance', () => {
    const sickLeave = regulatoryWatchlist[0]
    expect(sickLeave?.title.en).toContain('sick leave and medical certificate rules')
    expect(sickLeave?.title.en).not.toMatch(/proposed ESA amendments/i)
    expect(sickLeave?.status.en).toMatch(/In force/i)
    expect(sickLeave?.note.en).toMatch(/three-day leave/i)
  })

  it('acknowledges existing federally regulated roles in the harassment framework watch item', () => {
    const federal = regulatoryWatchlist.find((item) =>
      item.title.en.includes('workplace harassment and violence prevention framework review'),
    )
    expect(federal?.note.en).toMatch(/existing federally regulated roles/i)
    expect(federal?.note.en).not.toMatch(/only if federally regulated roles are added/i)
    expect(employees.some((emp) => emp.jurisdiction.en === 'Federal')).toBe(true)
  })
})
