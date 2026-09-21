import { describe, expect, it } from 'vitest'
import { proposeAgentAction } from './intent'

/**
 * The dispatcher — tries module parsers in order (operations → tasks →
 * comms → crm → governance → finance) and returns the first proposal.
 * These tests pin the overlaps that could misroute: "task to X" is a
 * checklist task vs "task with X" a CRM activity; "mark the project as
 * done" belongs to operations even though tasks' mark-done regex would
 * claim it; and "approve the decision" stays in governance while
 * "approve the request" lands in finance.
 */
describe('proposeAgentAction', () => {
  it('routes "add a task to X" to the checklist, not the CRM log', () => {
    const proposal = proposeAgentAction('add a task to review the policy')
    expect(proposal?.toolId).toBe('tasks.create')
    expect(proposal?.params).toEqual({ title: 'review the policy' })
  })

  it('routes "log a task with X" to CRM — the contact-context phrasing', () => {
    const proposal = proposeAgentAction('log a task with Amara')
    expect(proposal?.toolId).toBe('crm.log_activity')
    expect(proposal?.params.type).toBe('task')
  })

  it('keeps CRM intents working unchanged', () => {
    const proposal = proposeAgentAction('log a call with Amara re: onboarding')
    expect(proposal?.toolId).toBe('crm.log_activity')
    expect(proposal?.params.type).toBe('call')
  })

  it('routes comms intents to the register', () => {
    const sent = proposeAgentAction('log that we sent the harassment policy')
    expect(sent?.toolId).toBe('communications.log')
    expect(sent?.params.status).toBe('sent')
    const mark = proposeAgentAction('mark the RTO letter as sent')
    expect(mark?.toolId).toBe('communications.mark_sent')
  })

  it('routes governance intents to the register', () => {
    const decision = proposeAgentAction('record a decision to hire a fractional CFO')
    expect(decision?.toolId).toBe('governance.add_decision')
    expect(decision?.params.title).toBe('hire a fractional CFO')
    const adopt = proposeAgentAction('adopt the decision on the office lease')
    expect(adopt?.toolId).toBe('governance.adopt_decision')
    const record = proposeAgentAction('file a resolution titled banking authority')
    expect(record?.toolId).toBe('governance.add_record')
    expect(record?.params.recordType).toBe('resolution')
  })

  it('routes finance intents to the ledger seam', () => {
    const paid = proposeAgentAction('mark invoice INV-2026-0042 as paid')
    expect(paid?.toolId).toBe('finance.mark_invoice_paid')
    const spend = proposeAgentAction('request approval to buy laptops for $3600')
    expect(spend?.toolId).toBe('finance.add_spend_request')
    expect(spend?.params.amount).toBe(3600)
  })

  it('keeps "approve the decision" in governance, "approve the request" in finance', () => {
    expect(proposeAgentAction('approve the decision on the lease')?.toolId).toBe(
      'governance.adopt_decision',
    )
    expect(proposeAgentAction('approve the request for laptops')?.toolId).toBe(
      'finance.approve_spend',
    )
  })

  it('routes operations intents to the ops seam', () => {
    expect(proposeAgentAction('add a vendor Groupe Alimex')?.toolId).toBe('operations.add_vendor')
    expect(proposeAgentAction('mark the workstation shipment as delivered')?.toolId).toBe(
      'operations.deliver_shipment',
    )
    expect(proposeAgentAction('marque le projet déménagement comme terminé')?.toolId).toBe(
      'operations.update_project',
    )
  })

  it('routes "mark the project as done" to operations, not an unmatched task', () => {
    const proposal = proposeAgentAction('mark the project office relocation as done')
    expect(proposal?.toolId).toBe('operations.update_project')
    expect(proposal?.params).toEqual({ title: 'office relocation', status: 'completed' })
    // …while a task title with no "project" noun still lands in tasks.
    expect(proposeAgentAction('mark the PIP check-in as done')?.toolId).toBe('tasks.complete')
  })

  it('routes document intents to the doclib seam', () => {
    expect(proposeAgentAction('approve the offer letter for Chen')?.toolId).toBe(
      'documents.approve',
    )
    expect(proposeAgentAction('send the contract to jane@northgate.ca for signature')?.toolId).toBe(
      'documents.send_for_signature',
    )
    expect(proposeAgentAction('approuve le contrat de travail')?.toolId).toBe('documents.approve')
  })

  it('keeps document nouns separate from governance and finance', () => {
    /* "approve" fans out three ways — the noun picks the module: decision →
       governance, request → finance, document/letter/contract → documents. */
    expect(proposeAgentAction('approve the decision on the lease')?.toolId).toBe(
      'governance.adopt_decision',
    )
    expect(proposeAgentAction('approve the request for laptops')?.toolId).toBe(
      'finance.approve_spend',
    )
    expect(proposeAgentAction('approve the contract for Chen')?.toolId).toBe('documents.approve')
  })

  it('routes security intents to the security seam', () => {
    expect(proposeAgentAction('report a security incident — phishing email')?.toolId).toBe(
      'security.report_incident',
    )
    expect(proposeAgentAction('resolve the suspicious login incident')?.toolId).toBe(
      'security.resolve_incident',
    )
    expect(proposeAgentAction("termine la revue d'accès T3")?.toolId).toBe(
      'security.complete_access_review',
    )
  })

  it('routes "mark the access review as done" to security, not an unmatched task', () => {
    const proposal = proposeAgentAction('mark the access review Q3 admin as done')
    expect(proposal?.toolId).toBe('security.complete_access_review')
    expect(proposal?.params).toEqual({ title: 'Q3 admin' })
    // …while a task title with no security noun still lands in tasks.
    expect(proposeAgentAction('mark the PIP check-in as done')?.toolId).toBe('tasks.complete')
  })

  it('returns null for unrelated text', () => {
    expect(proposeAgentAction('what are my obligations')).toBeNull()
  })
})
