import { describe, expect, it } from 'vitest'
import {
  compEquityCard,
  employeeDetails,
  employees,
  orgStructure,
  supportSignals,
} from './employees'
import { employeeDocuments } from './workforce'
import { documentTemplates } from './documents'

function employee(id: string) {
  const found = employees.find((e) => e.id === id)
  if (!found) throw new Error(`Missing employee ${id}`)
  return found
}

describe('employees fixtures', () => {
  it('keeps Jordan tenure, start date, and hire timeline aligned with Advisor Memory', () => {
    const jordan = employee('e1')
    const detail = employeeDetails.e1

    expect(jordan.tenure.en).toBe('8 yrs')
    expect(detail?.startDate).toBe('Mar 2018')

    const hire = detail?.timeline.find((ev) => ev.kind === 'hire')
    expect(hire?.date).toBe('Mar 2018')
    expect(detail?.startDate).toBe(hire?.date)
  })

  it('does not imply a statutory or universal BC probation period for Priya', () => {
    const priya = employee('e2')
    expect(priya.insight.en).not.toMatch(/Probation runs|statutory probation/i)
    expect(priya.insight.en).toContain('3-month service milestone')
    expect(priya.insight.fr).toContain('jalon de trois mois de service')
    expect(priya.insight.fr).not.toMatch(/La probation court/i)
  })

  it('places Grace in the Revenue branch consistent with orgStructure', () => {
    const grace = employee('e11')
    const revenueBranch = orgStructure.find((branch) => branch.reportIds.includes('e11'))

    expect(grace.dept.en).toBe('Revenue')
    expect(revenueBranch?.dept.en).toBe('Revenue')
    expect(grace.dept.en).toBe(revenueBranch?.dept.en)
  })

  it('shows Amara as active while modified duties are underway', () => {
    const amara = employee('e6')
    const detail = employeeDetails.e6

    expect(amara.status.en).toBe('Active')
    expect(amara.status.en).not.toBe('On Leave')
    expect(amara.insight.en).toContain('modified duties')
    expect(
      detail?.leave.some((row) => row.status === 'Active' && row.type.en.includes('Modified')),
    ).toBe(true)
    expect(
      detail?.leave.some((row) => row.status === 'Completed' && row.type.en.includes('Medical')),
    ).toBe(true)
  })

  it('frames the compensation advisory card as market positioning, not statutory pay equity', () => {
    expect(compEquityCard.title.en).toContain('compensation positioning')
    expect(compEquityCard.body.en).toContain('market midpoint')
    expect(compEquityCard.body.en).not.toMatch(/pay-equity compliance/i)
    expect(compEquityCard.body.fr).not.toMatch(/équité salariale/i)
  })

  it('uses Ontario licenciement terminology for Jordan termination events', () => {
    const detail = employeeDetails.e1
    const terminationDoc = detail?.timeline.find((ev) => ev.docKey === 'T03')
    expect(terminationDoc?.text.fr).toContain('Lettre de licenciement')
    expect(terminationDoc?.text.fr).not.toContain('Lettre de cessation d’emploi')

    const opsSignal = supportSignals.find((signal) => signal.id === 'ws5')
    expect(opsSignal?.why.fr).toContain('dossier de licenciement')
    expect(opsSignal?.why.fr).not.toContain('dossier de cessation')
  })

  it('softens Devon support-signal wording without dropping the PIP safeguard', () => {
    const devonSignal = supportSignals.find((signal) => signal.id === 'ws3')
    expect(devonSignal?.why.en).not.toMatch(/must be offered separately/i)
    expect(devonSignal?.why.en).toContain('Handle support resources separately')
    expect(devonSignal?.action.en).toContain('do not feed this signal into the PIP')
  })

  it('uses gender-consistent French role titles where the fixture establishes them', () => {
    expect(employee('e2').role.fr).toBe('Analyste principale')
    expect(employee('e6').role.fr).toBe('Ingénieure logicielle')
    expect(employee('e11').role.fr).toBe('Analyste financière')
  })

  it('stores employment jurisdiction on Employee, not province', () => {
    for (const emp of employees) {
      expect(emp).toHaveProperty('jurisdiction')
      expect(emp).not.toHaveProperty('province')
    }
  })

  it('uses shipped Ontario jurisdiction for Priya and Amara demo records', () => {
    expect(employee('e2').jurisdiction.en).toBe('Ontario')
    expect(employee('e6').jurisdiction.en).toBe('Ontario')
  })

  it('leaves compensation and sentiment unset when detail overrides are absent', () => {
    const priyaDetail = employeeDetails.e2
    expect(priyaDetail?.salary).toBeNull()
    expect(priyaDetail?.market).toBeNull()
    expect(priyaDetail?.sentiment).toBeNull()
    expect(priyaDetail?.manager).toBe('—')
    expect(priyaDetail?.band).toBe('—')
    expect(priyaDetail?.startDate).toBe('—')
  })

  it('aligns Priya offer-letter document metadata with Ontario jurisdiction', () => {
    const offer = documentTemplates.find((doc) => doc.key === 'Offer Letter')
    if (!offer?.meta?.jur || !offer.meta.missing) throw new Error('Missing Offer Letter fixture')
    expect(offer.meta.jur.en).toContain('Ontario')
    expect(offer.meta.missing.en).not.toMatch(/BC-specific/i)
  })

  it('uses Ontario for Amara document expiry records in workforce fixtures', () => {
    const amaraDoc = employeeDocuments.find((doc) => doc.employeeId === 'e6')
    expect(amaraDoc?.jurisdiction.en).toBe('Ontario')
  })

  it('keeps Jordan notice exposure caveated as preliminary', () => {
    const jordan = employee('e1')
    expect(jordan.risk?.body.en).toMatch(/preliminary estimate/i)
    expect(jordan.risk?.body.en).toMatch(/9–12 months/)
    expect(jordan.insight.en).toContain('legal review is in progress')
  })
})
