import { describe, expect, it } from 'vitest'
import { proposeCrmAction } from './agentIntent'

describe('proposeCrmAction — deterministic rail intents', () => {
  it('proposes log_activity for "log a call with …"', () => {
    const proposal = proposeCrmAction('log a call with Amara Okafor')
    expect(proposal?.toolId).toBe('crm.log_activity')
    expect(proposal?.params.type).toBe('call')
    expect(proposal?.params.contact).toBe('Amara Okafor')
    expect(proposal?.summary.en).toContain('Amara Okafor')
  })

  it('handles French verbs and types', () => {
    const proposal = proposeCrmAction('note un appel avec Jean-Pierre')
    expect(proposal?.toolId).toBe('crm.log_activity')
    expect(proposal?.params.type).toBe('call')
    expect(proposal?.params.contact).toBe('Jean-Pierre')
  })

  it('maps meeting/email/note and preposition variants', () => {
    expect(proposeCrmAction('record a meeting about onboarding')?.params.type).toBe('meeting')
    expect(proposeCrmAction('log email to Sarah')?.params.type).toBe('email')
    expect(proposeCrmAction('add a note: pricing question')?.params.type).toBe('note')
  })

  it('proposes a follow-up task with a date a week out', () => {
    const proposal = proposeCrmAction('add a follow-up with Sarah Whitmore')
    expect(proposal?.toolId).toBe('crm.log_activity')
    expect(proposal?.params.type).toBe('task')
    expect(proposal?.params.followUpDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(proposal?.params.contact).toBe('Sarah Whitmore')
  })

  it('proposes add_contact with optional company', () => {
    const withCompany = proposeCrmAction('add contact Priya Nair at Lakeside Manufacturing')
    expect(withCompany?.toolId).toBe('crm.add_contact')
    expect(withCompany?.params.name).toBe('Priya Nair')
    expect(withCompany?.params.company).toBe('Lakeside Manufacturing')

    const bare = proposeCrmAction('add a contact Priya Nair')
    expect(bare?.params.name).toBe('Priya Nair')
    expect(bare?.params.company).toBeUndefined()
  })

  it('parses French add-contact with chez', () => {
    const proposal = proposeCrmAction('ajoute un contact Priya Nair chez Northgate')
    expect(proposal?.toolId).toBe('crm.add_contact')
    expect(proposal?.params.name).toBe('Priya Nair')
    expect(proposal?.params.company).toBe('Northgate')
  })

  it('returns null for non-CRM messages — the normal reply path resumes', () => {
    expect(proposeCrmAction('what is notice pay in Ontario')).toBeNull()
    expect(proposeCrmAction('log')).toBeNull()
    expect(proposeCrmAction('')).toBeNull()
    expect(proposeCrmAction('summarize my pipeline')).toBeNull()
  })
})
