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
  })

  it('covers Ontario hiring metadata for k2 within shipped jurisdictions', () => {
    const k2 = item('k2')
    expect(k2.title.en).toContain('Ontario ESA')
    expect(k2.title.en).not.toMatch(/British Columbia|BC Employment/i)
    expect(k2.tag.en).toBe('Hiring · Ontario')
    expect(k2.summary.en).not.toMatch(/universal written-offer requirement/i)
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
  })

  it('uses Canada-scoped accommodation metadata for k4', () => {
    const k4 = item('k4')
    expect(k4.title.fr).not.toMatch(/\bc\.\s*diagnostic/i)
    expect(k4.tag.en).toBe('Accommodation · Canada')
  })

  it('uses attendance and accommodation-aware absenteeism framing for k5', () => {
    const k5 = item('k5')
    expect(k5.title.en).toContain('discipline & accommodation')
    expect(k5.title.en).not.toMatch(/what’s disciplinable/i)
    expect(k5.title.fr).toContain('fautif et non fautif')
    expect(k5.tag.en).toBe('Attendance · Canada')
    expect(k5.tag.fr).toBe('Assiduité · Canada')
  })

  it('uses Licenciement for federal termination metadata on k6', () => {
    const k6 = item('k6')
    expect(k6.title.en).toContain('termination notice')
    expect(k6.tag.fr).toBe('Licenciement · Fédéral')
    expect(k6.tag.fr).not.toContain('Cessation')
  })

  it('uses OHS considerations rather than universal obligations for k7', () => {
    const k7 = item('k7')
    expect(k7.title.en).toContain('considerations')
    expect(k7.title.en).not.toMatch(/obligations for home offices/i)
    expect(k7.tag.en).toBe('Health & safety · Canada')
  })

  it('uses employment-standards probation framing for k8', () => {
    const k8 = item('k8')
    expect(k8.title.en).toContain('employment standards & termination risk')
    expect(k8.title.en).not.toMatch(/what employers can and can’t do/i)
    expect(k8.tag.en).toBe('Hiring · Canada')
  })

  it('does not use All provinces / Toutes les provinces tags', () => {
    for (const k of knowledgeItems) {
      expect(k.tag.en).not.toMatch(/All provinces/i)
      expect(k.tag.fr).not.toMatch(/Toutes les provinces/i)
    }
  })
})
