import { describe, expect, it } from 'vitest'
import { proposeGovernanceAction } from './agentIntent'

/**
 * The governance rail parser — deterministic EN+FR patterns for the three
 * register commits. Captured titles go through `stripArticle` so they
 * resolve against existing rows.
 */
describe('proposeGovernanceAction', () => {
  it('proposes add_decision for "record a decision to X"', () => {
    const p = proposeGovernanceAction('record a decision to hire a fractional CFO')
    expect(p?.toolId).toBe('governance.add_decision')
    expect(p?.params).toEqual({ title: 'hire a fractional CFO' })
  })

  it('proposes add_decision for "log a board decision that X"', () => {
    const p = proposeGovernanceAction('log a board decision that we adopt the budget')
    expect(p?.toolId).toBe('governance.add_decision')
    expect(p?.params.title).toBe('we adopt the budget')
  })

  it('proposes adopt_decision for "adopt the decision on X" — title matched later', () => {
    const p = proposeGovernanceAction('adopt the decision on the new office lease')
    expect(p?.toolId).toBe('governance.adopt_decision')
    expect(p?.params.title).toBe('new office lease')
  })

  it('proposes add_record with the record type for "file a resolution titled X"', () => {
    const p = proposeGovernanceAction('file a resolution titled banking authority')
    expect(p?.toolId).toBe('governance.add_record')
    expect(p?.params).toEqual({ title: 'banking authority', recordType: 'resolution' })
  })

  it('maps "by-law" and "bylaw" to the same record type', () => {
    for (const word of ['bylaw', 'by-law']) {
      const p = proposeGovernanceAction(`add a ${word} on procurement`)
      expect(p?.toolId).toBe('governance.add_record')
      expect(p?.params.recordType).toBe('bylaw')
    }
  })

  it('proposes add_decision for French "consigne une décision de X"', () => {
    const p = proposeGovernanceAction('consigne une décision de nommer un nouveau directeur')
    expect(p?.toolId).toBe('governance.add_decision')
    expect(p?.params.title).toBe('nommer un nouveau directeur')
  })

  it('proposes adopt_decision for French "adopte la décision sur X"', () => {
    const p = proposeGovernanceAction('adopte la décision sur le bail')
    expect(p?.toolId).toBe('governance.adopt_decision')
    expect(p?.params.title).toBe('bail')
  })

  it('maps French record nouns — "procès-verbal" to minutes', () => {
    const p = proposeGovernanceAction('classe un procès-verbal : réunion de septembre')
    expect(p?.toolId).toBe('governance.add_record')
    expect(p?.params).toEqual({ title: 'réunion de septembre', recordType: 'minutes' })
  })

  it('maps French "règlement" to bylaw', () => {
    const p = proposeGovernanceAction('ajoute un règlement sur les achats')
    expect(p?.toolId).toBe('governance.add_record')
    expect(p?.params.recordType).toBe('bylaw')
  })

  it('returns null for non-governance phrasing', () => {
    expect(proposeGovernanceAction('log a call with Amara')).toBeNull()
    expect(proposeGovernanceAction('mark the letter as sent')).toBeNull()
    expect(proposeGovernanceAction('create a task to review the policy')).toBeNull()
    expect(proposeGovernanceAction('how do I terminate an employee')).toBeNull()
  })
})
