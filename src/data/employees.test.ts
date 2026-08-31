import { describe, expect, it } from 'vitest'
import {
  compPositioningCard,
  directManagerFor,
  employeeDetails,
  employees,
  lineManagerLabel,
  orgRootReportIds,
  orgStructure,
  reportsToOrgRoot,
  supportSignals,
  UNKNOWN_LINE_MANAGER,
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

  it('does not imply a statutory or universal probation period for Priya', () => {
    const priya = employee('e2')
    expect(priya.insight.en).not.toMatch(/probation/i)
    expect(priya.insight.fr).not.toMatch(/probation/i)
    expect(priya.insight.en).toContain('3-month service milestone')
    expect(priya.insight.fr).toContain('jalon de trois mois de service')
  })

  it('treats org branch dept as the manager area, not each report functional department', () => {
    const byId = new Map(employees.map((e) => [e.id, e]))
    const reportAssignments = new Map<string, string>()

    for (const branch of orgStructure) {
      expect(byId.has(branch.managerId), `manager ${branch.managerId}`).toBe(true)
      for (const reportId of branch.reportIds) {
        expect(byId.has(reportId), `report ${reportId}`).toBe(true)
        expect(reportAssignments.has(reportId), `${reportId} in multiple branches`).toBe(false)
        reportAssignments.set(reportId, branch.managerId)
      }
    }

    const peopleBranch = orgStructure.find((b) => b.managerId === 'e9')
    const revenueBranch = orgStructure.find((b) => b.managerId === 'e7')
    expect(peopleBranch?.dept.en).toBe('People')
    expect(revenueBranch?.dept.en).toBe('Revenue')

    /* Functional departments may differ from the branch label they report into. */
    expect(employee('e8').dept.en).toBe('Marketing')
    expect(peopleBranch?.reportIds).toContain('e8')
    expect(employee('e2').dept.en).toBe('Strategy')
    expect(revenueBranch?.reportIds).toContain('e2')
    expect(employee('e6').dept.en).toBe('Engineering')
    expect(peopleBranch?.reportIds).toContain('e6')

    /* Grace is intentionally assigned to Revenue and also reports through the Revenue branch. */
    expect(employee('e11').dept.en).toBe('Revenue')
    expect(revenueBranch?.reportIds).toContain('e11')
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
    expect(compPositioningCard.title.en).toContain('compensation positioning')
    expect(compPositioningCard.body.en).toContain('market midpoint')
    expect(compPositioningCard.body.en).not.toMatch(/pay-equity compliance/i)
    expect(compPositioningCard.body.fr).not.toMatch(/équité salariale/i)
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
    expect(priyaDetail?.band).toBe('—')
    expect(priyaDetail?.startDate).toBe('—')
  })

  it('keeps the direct-report graph internally consistent', () => {
    const byId = new Map(employees.map((e) => [e.id, e]))
    const reportAssignments = new Map<string, string>()
    const allReportIds = new Set<string>()

    for (const branch of orgStructure) {
      expect(byId.has(branch.managerId), `manager ${branch.managerId}`).toBe(true)
      expect(branch.reportIds.includes(branch.managerId), `${branch.managerId} self-report`).toBe(
        false,
      )
      for (const reportId of branch.reportIds) {
        expect(byId.has(reportId), `report ${reportId}`).toBe(true)
        expect(reportAssignments.has(reportId), `${reportId} in multiple branches`).toBe(false)
        reportAssignments.set(reportId, branch.managerId)
        allReportIds.add(reportId)
      }
    }

    for (const rootReportId of orgRootReportIds) {
      expect(byId.has(rootReportId), `Riley report ${rootReportId}`).toBe(true)
      expect(
        allReportIds.has(rootReportId),
        `${rootReportId} is both branch manager and report`,
      ).toBe(false)
    }
  })

  it('derives line managers from orgStructure rather than duplicated detail fields', () => {
    expect(directManagerFor('e6')?.id).toBe('e9')
    expect(lineManagerLabel('e6')).toBe('Fatima Haddad')

    expect(directManagerFor('e11')?.id).toBe('e7')
    expect(lineManagerLabel('e11')).toBe('Liam Fraser')

    expect(directManagerFor('e5')?.id).toBe('e1')
    expect(lineManagerLabel('e5')).toBe('Jordan Mensah')
  })

  it('allows cross-functional reporting without matching branch dept labels', () => {
    const priya = employee('e2')
    const revenueBranch = orgStructure.find((b) => b.managerId === 'e7')

    expect(priya.dept.en).toBe('Strategy')
    expect(revenueBranch?.dept.en).toBe('Revenue')
    expect(revenueBranch?.reportIds).toContain('e2')
    expect(directManagerFor('e2')?.id).toBe('e7')
    expect(lineManagerLabel('e2')).toBe('Liam Fraser')
  })

  it('returns unknown line manager when no orgStructure or Riley reporting edge exists', () => {
    expect(directManagerFor('e99')).toBeNull()
    expect(lineManagerLabel('e99')).toBe(UNKNOWN_LINE_MANAGER)
    expect(reportsToOrgRoot('e99')).toBe(false)
  })

  it('derives branch-manager lines to Riley without fabricating an Employee row', () => {
    expect(directManagerFor('e1')).toBeNull()
    expect(reportsToOrgRoot('e1')).toBe(true)
    expect(lineManagerLabel('e1')).toBe('Riley Summers')
    expect(lineManagerLabel('e7')).toBe('Riley Summers')
    expect(lineManagerLabel('e9')).toBe('Riley Summers')
  })

  it('uses Ontario metadata for the shipped Offer Letter fixture', () => {
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
