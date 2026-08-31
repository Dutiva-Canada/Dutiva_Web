import { describe, expect, it } from 'vitest'
import { knowledgeItems } from './knowledge'

function item(id: string) {
  const found = knowledgeItems.find((k) => k.id === id)
  if (!found) throw new Error(`Missing knowledge item ${id}`)
  return found
}

describe('knowledgeItems', () => {
  it('keeps the expected seed ids', () => {
    expect(knowledgeItems.map((k) => k.id)).toEqual([
      'k1',
      'k2',
      'k3',
      'k4',
      'k5',
      'k6',
      'k7',
      'k8',
    ])
  })

  it('uses Ontario LNE French termination terminology for k1', () => {
    const k1 = item('k1')
    expect(k1.title.fr).toContain('préavis de licenciement')
    expect(k1.title.fr).toContain('indemnité de cessation d’emploi')
    expect(k1.title.fr).not.toContain('préavis de cessation')
    expect(k1.tag.fr).toBe('Licenciement · Ontario')
    expect(k1.summary.fr).toContain('sommes dues lors d’un licenciement')
  })

  it('covers Ontario mandatory new-employee information for k2 within shipped jurisdictions', () => {
    const k2 = item('k2')
    expect(k2.title.en).toBe('Ontario ESA: mandatory information for new employees')
    expect(k2.title.en).not.toMatch(/British Columbia|BC Employment/i)
    expect(k2.tag.en).toBe('Hiring · Ontario')
    expect(k2.summary.en).toContain('25 or more employees in Ontario')
    expect(k2.summary.en).toContain('first day of work')
    expect(k2.title.fr).toBe('LNE de l’Ontario : renseignements sur l’emploi des nouveaux employés')
    expect(k2.summary.en).not.toMatch(/job-posting|publicly advertised/i)
  })

  it('does not ship BC jurisdiction articles in the knowledge seed', () => {
    for (const k of knowledgeItems) {
      expect(k.title.en).not.toMatch(/British Columbia|BC Employment/i)
      expect(k.tag.en).not.toMatch(/British Columbia/i)
    }
  })

  it('provides a qualified summary for every knowledge article', () => {
    for (const k of knowledgeItems) {
      expect(k.summary.en.length).toBeGreaterThan(40)
      expect(k.summary.fr.length).toBeGreaterThan(40)
    }
  })

  it('frames Quebec language rules under the Charter, not Bill 96, for k3', () => {
    const k3 = item('k3')
    expect(k3.title.en).toContain('Charter of the French Language')
    expect(k3.title.en).not.toMatch(/Bill 96/i)
    expect(k3.tag.en).toBe('Language · Quebec')
    expect(k3.tag.fr).toBe('Langue · Québec')
    expect(k3.title.en).toContain('documents & communications')
    expect(k3.title.fr).toContain('documents et communications')
    expect(k3.summary.en).toMatch(/document or communication type/i)
  })

  it('uses Canada-scoped accommodation metadata for k4', () => {
    const k4 = item('k4')
    expect(k4.title.fr).not.toMatch(/\bc\.\s*diagnostic/i)
    expect(k4.tag.en).toBe('Accommodation · Canada')
    expect(k4.summary.en).toContain('functional limitations')
    expect(k4.summary.en).toMatch(/rather than diagnosis/i)
  })

  it('uses Canada-scoped tags for cross-jurisdictional topics without implying uniform rules', () => {
    for (const id of ['k5', 'k7', 'k8'] as const) {
      const k = item(id)
      expect(k.tag.en).toMatch(/Canada/)
      expect(k.summary.en).toMatch(/Ontario|federally regulated/i)
      expect(k.summary.en).not.toMatch(/identical rules|same rules across Canada/i)
    }
    const k4 = item('k4')
    expect(k4.tag.en).toBe('Accommodation · Canada')
    expect(k4.summary.en).toContain('applicable human-rights and employment law')
  })

  it('uses attendance and accommodation-aware absenteeism framing for k5', () => {
    const k5 = item('k5')
    expect(k5.title.en).toContain('discipline & accommodation')
    expect(k5.title.en).not.toMatch(/what’s disciplinable/i)
    expect(k5.title.fr).toContain('fautif et non fautif')
    expect(k5.tag.en).toBe('Attendance · Canada')
    expect(k5.tag.fr).toBe('Assiduité · Canada')
    expect(k5.summary.en).toContain('federally regulated workplaces')
  })

  it('uses Licenciement for federal termination metadata on k6', () => {
    const k6 = item('k6')
    expect(k6.title.en).toContain('termination notice')
    expect(k6.tag.fr).toBe('Licenciement · Fédéral')
    expect(k6.tag.fr).not.toContain('Cessation')
    expect(k6.summary.fr).toContain('normes minimales d’emploi provinciales')
  })

  it('uses OHS considerations rather than universal obligations for k7', () => {
    const k7 = item('k7')
    expect(k7.title.en).toContain('considerations')
    expect(k7.title.en).not.toMatch(/obligations for home offices/i)
    expect(k7.tag.en).toBe('Health & safety · Canada')
    expect(k7.summary.en).toMatch(/Ontario, Quebec, federally regulated/i)
  })

  it('uses employment-standards probation framing for k8', () => {
    const k8 = item('k8')
    expect(k8.title.en).toContain('employment standards & termination risk')
    expect(k8.title.en).not.toMatch(/what employers can and can’t do/i)
    expect(k8.tag.en).toBe('Hiring · Canada')
    expect(k8.summary.fr).toContain('effets juridiques varient selon la compétence')
    expect(k8.summary.en).toMatch(/provincial or territorial regimes/i)
  })

  it('does not use All provinces / Toutes les provinces tags', () => {
    for (const k of knowledgeItems) {
      expect(k.tag.en).not.toMatch(/All provinces/i)
      expect(k.tag.fr).not.toMatch(/Toutes les provinces/i)
    }
  })
})
