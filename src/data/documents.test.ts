import { describe, expect, it } from 'vitest'
import { documentTemplates, documentTemplatesByKey } from './documents'

function template(key: string) {
  const doc = documentTemplatesByKey[key]
  if (!doc) throw new Error(`Missing template: ${key}`)
  return doc
}

function allStrings(doc: ReturnType<typeof template>): string[] {
  const parts: string[] = [doc.title.en, doc.title.fr]
  for (const section of doc.sections) {
    parts.push(section.en, section.fr)
  }
  if (doc.meta) {
    for (const value of Object.values(doc.meta)) {
      if (value && typeof value === 'object' && 'en' in value && 'fr' in value) {
        parts.push(value.en, value.fr)
      }
    }
  }
  return parts
}

describe('document fixture normalization', () => {
  it('uses Ontario jurisdiction for Amara-linked accommodation documents', () => {
    for (const key of ['Accommodation Documentation', 'Medical Information Request Letter']) {
      const doc = template(key)
      expect(doc.meta?.jur?.en).toBe('Ontario · Human Rights Code')
      expect(doc.meta?.jur?.fr).toBe('Ontario · Code des droits de la personne')
      expect(allStrings(doc).join('\n')).not.toMatch(/British Columbia|Colombie-Britannique/)
    }
  })

  it('keeps accommodation record body focused on functional limitations, not diagnosis', () => {
    const accommodation = template('Accommodation Documentation')
    const body = accommodation.sections[1]
    if (!body) throw new Error('Missing accommodation body section')
    expect(body.en).toMatch(/functional limitations/i)
    expect(body.en).not.toMatch(/medical condition/i)
    expect(body.fr).toMatch(/limitations fonctionnelles/i)
    expect(body.fr).not.toMatch(/condition médicale/i)
  })

  it('uses licenciement terminology in the French Full & Final Release for Jordan', () => {
    const release = template('Full & Final Release')
    const fr = allStrings(release)
      .filter((_, i) => i % 2 === 1)
      .join('\n')
    expect(fr).toContain('lettre de licenciement')
    expect(fr).toContain('Lettre de licenciement')
    expect(fr).not.toMatch(/lettre de cessation d'emploi/i)
    expect(fr).not.toMatch(/Lettre de cessation/i)
  })

  it('uses jurisdiction-aware wording in the generic Employment Agreement', () => {
    const agreement = template('Employment Agreement')
    const en = allStrings(agreement)
      .filter((_, i) => i % 2 === 0)
      .join('\n')
    const fr = allStrings(agreement)
      .filter((_, i) => i % 2 === 1)
      .join('\n')

    expect(agreement.meta?.jur?.en).toBe('Multi-jurisdiction')
    expect(agreement.meta?.jur?.fr).toBe('Multijuridictionnel')
    expect(en).toMatch(/applicable employment-standards minimums/i)
    expect(en).toMatch(/employment jurisdiction/i)
    expect(en).toMatch(/jurisdiction-specific review/i)
    expect(en).not.toMatch(/employee's province|employee’s province/i)
    expect(en).not.toMatch(/provincial-specific/i)
    expect(en).not.toMatch(/Multi-province/i)
    expect(fr).toMatch(/normes d'emploi applicables/i)
    expect(fr).toMatch(/compétence applicable/i)
    expect(fr).toMatch(/examen propre à la compétence/i)
    expect(fr).toMatch(/exécutoire dans la compétence applicable/i)
    expect(fr).not.toMatch(/exécutable/i)
    expect(fr).not.toMatch(/province de l'employé/i)
  })

  it('preserves legal caution in the Employment Agreement termination clause', () => {
    const agreement = template('Employment Agreement')
    const clause = agreement.sections[2]
    if (!clause) throw new Error('Missing Employment Agreement termination clause')
    expect(clause.en).toMatch(/enforceability varies by jurisdiction/i)
    expect(clause.en).toMatch(/may not represent the employee.s full entitlement/i)
    expect(clause.fr).toMatch(/la force exécutoire varie selon la compétence/i)
    expect(clause.fr).toMatch(/peuvent ne pas représenter l'ensemble des droits/i)
  })

  it('keeps Devon PIP accommodation safeguards without collecting medical detail', () => {
    const pip = template('Performance Improvement Plan')
    const note = pip.sections[3]
    if (!note) throw new Error('Missing PIP accommodation note')
    expect(note.en).toMatch(/accommodation obligations/i)
    expect(note.en).toMatch(/Keep sensitive accommodation information separate/i)
    expect(note.en).not.toMatch(/medical condition/i)
    expect(note.fr).not.toMatch(/condition médicale/i)
    expect(pip.meta?.assumptions?.en).toMatch(/separate accommodation assessment/i)
    expect(pip.meta?.assumptions?.en).toMatch(/out of this performance record/i)
    expect(pip.meta?.assumptions?.en).not.toMatch(/not linked to a condition/i)
  })

  it('documents the Offer Letter as a populated scenario template, not a linked employee document', () => {
    const offer = template('Offer Letter')
    const body = offer.sections.map((s) => s.en).join('\n')

    expect(offer.meta?.link).toBeUndefined()
    expect(offer.meta?.assumptions?.en).toMatch(/not linked to an employee file or case/i)
    expect(offer.meta?.assumptions?.fr).toMatch(/non liée à un dossier d’employé ou à un dossier/i)
    expect(body).toContain('Senior Analyst')
    expect(body).toContain('Liam Fraser')
    expect(body).not.toContain('Director of Operations')
    expect(body).toMatch(/3-month probationary period/i)
    const probationSection = offer.sections[3]
    if (!probationSection) throw new Error('Missing Offer Letter probation section')
    expect(probationSection.fr).toContain('contrat de travail')
    expect(probationSection.fr).not.toMatch(/convention d'emploi|convention d’emploi/i)
  })

  it('uses jurisdiction-neutral wording in the generic Remote Work Policy', () => {
    const policy = template('Remote Work Policy')
    const en = allStrings(policy)
      .filter((_, i) => i % 2 === 0)
      .join('\n')
    const fr = allStrings(policy)
      .filter((_, i) => i % 2 === 1)
      .join('\n')

    expect(en).toMatch(/applicable law/i)
    expect(en).not.toMatch(/provincial law/i)
    expect(en).toMatch(/may apply to remote work/i)
    expect(en).not.toMatch(/obligations extend to home offices/i)
    expect(fr).toMatch(/loi applicable/i)
    expect(fr).not.toMatch(/loi provinciale/i)
    expect(fr).toMatch(/peuvent s'appliquer au télétravail/i)
  })

  it('exports a stable template count', () => {
    expect(documentTemplates).toHaveLength(10)
  })
})
