import { describe, expect, it } from 'vitest'
import { proposeFinanceAction } from './agentIntent'

/**
 * The finance rail parser — deterministic EN+FR patterns for the weekly-ops
 * commits. Spend requests are only proposed when the message carries an
 * amount; obligations only when a YYYY-MM-DD due date is present.
 */
describe('proposeFinanceAction', () => {
  it('proposes mark_invoice_paid for "mark invoice X as paid"', () => {
    const p = proposeFinanceAction('mark invoice INV-2026-0042 as paid')
    expect(p?.toolId).toBe('finance.mark_invoice_paid')
    expect(p?.params).toEqual({ title: 'INV-2026-0042' })
  })

  it('proposes mark_invoice_paid for "mark the X invoice as paid" — customer phrasing', () => {
    const p = proposeFinanceAction('mark the Maple Freight invoice as paid')
    expect(p?.toolId).toBe('finance.mark_invoice_paid')
    expect(p?.params.title).toBe('Maple Freight')
  })

  it('proposes add_spend_request with purpose and parsed amount', () => {
    const p = proposeFinanceAction('request approval to buy laptops for $3600')
    expect(p?.toolId).toBe('finance.add_spend_request')
    expect(p?.params).toEqual({ purpose: 'buy laptops', amount: 3600 })
  })

  it('parses comma-grouped amounts', () => {
    const p = proposeFinanceAction('request a spend approval for new shelving for 12,500.00')
    expect(p?.toolId).toBe('finance.add_spend_request')
    expect(p?.params.amount).toBe(12500)
  })

  it('does not propose a spend request without an amount', () => {
    expect(proposeFinanceAction('request approval to buy laptops')).toBeNull()
  })

  it('proposes approve_spend for "approve the request for X"', () => {
    const p = proposeFinanceAction('approve the request for laptops')
    expect(p?.toolId).toBe('finance.approve_spend')
    expect(p?.params.title).toBe('laptops')
  })

  it('proposes add_obligation with mapped type, period and due date', () => {
    const p = proposeFinanceAction('add a GST remittance for Q3 2026 due 2026-09-30')
    expect(p?.toolId).toBe('finance.add_obligation')
    expect(p?.params).toEqual({ type: 'gst_hst', period: 'Q3 2026', dueDate: '2026-09-30' })
  })

  it('does not propose an obligation without a YYYY-MM-DD due date', () => {
    expect(proposeFinanceAction('add a GST remittance for Q3 due September 30')).toBeNull()
  })

  it('proposes mark_invoice_paid for French phrasing', () => {
    const p = proposeFinanceAction('marque la facture INV-0042 comme payée')
    expect(p?.toolId).toBe('finance.mark_invoice_paid')
    expect(p?.params.title).toBe('INV-0042')
  })

  it('proposes approve_spend for French "approuve la demande pour X"', () => {
    const p = proposeFinanceAction('approuve la demande pour les portables')
    expect(p?.toolId).toBe('finance.approve_spend')
    expect(p?.params.title).toBe('portables')
  })

  it('maps French obligation nouns — "obligation TPS" to gst_hst', () => {
    const p = proposeFinanceAction('ajoute une obligation TPS pour le T3 échéance 2026-09-30')
    expect(p?.toolId).toBe('finance.add_obligation')
    expect(p?.params).toEqual({ type: 'gst_hst', period: 'T3', dueDate: '2026-09-30' })
  })

  it('returns null for non-finance phrasing', () => {
    expect(proposeFinanceAction('record a decision to hire a CFO')).toBeNull()
    expect(proposeFinanceAction('log a call with Amara')).toBeNull()
    expect(proposeFinanceAction('mark the letter as sent')).toBeNull()
    expect(proposeFinanceAction('create a task to review the policy')).toBeNull()
  })
})
