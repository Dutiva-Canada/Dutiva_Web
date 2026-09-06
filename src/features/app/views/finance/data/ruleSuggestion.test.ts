import { describe, expect, it } from 'vitest'
import { suggestCategoryRules, type RuleSuggestion } from './ruleSuggestion'
import type { FinanceBankItem, FinanceLedgerAccount, FinanceCategoryRule } from './types'

function item(description: string): FinanceBankItem {
  return {
    id: `bi-${description}`,
    bankAccountId: 'ba-1',
    date: '2026-01-01',
    amount: '100.00',
    currency: 'CAD',
    description,
    matchStatus: 'unmatched',
  }
}

const accounts: FinanceLedgerAccount[] = [
  { id: 'la-6000', bookId: 'book-1', code: '6000', name: { en: 'Salaries and wages', fr: 'Salaires et traitements' }, type: 'expense', sensitive: false, active: true },
  { id: 'la-5000', bookId: 'book-1', code: '5000', name: { en: 'Revenue — Services', fr: 'Revenus — Services' }, type: 'revenue', sensitive: false, active: true },
  { id: 'la-6100', bookId: 'book-1', code: '6100', name: { en: 'Bank fees', fr: 'Frais bancaires' }, type: 'expense', sensitive: false, active: true },
]

const rules: FinanceCategoryRule[] = []

describe('suggestCategoryRules', () => {
  it('returns empty when there are no unmatched items', () => {
    const matched = [item('PAYROLL DEPOSIT')].map((i) => ({ ...i, matchStatus: 'matched' as const }))
    const result = suggestCategoryRules(matched, accounts, rules)
    expect(result).toHaveLength(0)
  })

  it('groups similar salary descriptions and suggests a salaries rule', () => {
    const items = [
      item('SALARY DEPOSIT'),
      item('SALARY DIRECT DEPOSIT'),
      item('MONTHLY WAGES'),
      item('STRIPE PAYOUT'),
    ]
    const result = suggestCategoryRules(items, accounts, rules)
    expect(result.length).toBeGreaterThanOrEqual(1)
    const salary = result.find((r) => r.pattern.toLowerCase().includes('salary') || r.pattern.toLowerCase().includes('wages'))
    expect(salary).toBeDefined()
    expect(salary!.ledgerAccountId).toBe('la-6000')
    expect(salary!.direction).toBe('debit')
    expect(salary!.count).toBeGreaterThanOrEqual(2)
  })

  it('suggests bank fees for a bank fee line', () => {
    const items = [item('BANK FEE MONTHLY'), item('BANK FEE WIRE')]
    const result = suggestCategoryRules(items, accounts, rules)
    const fee = result.find((r) => r.pattern.toLowerCase().includes('bank fee'))
    expect(fee).toBeDefined()
    expect(fee!.ledgerAccountId).toBe('la-6100')
    expect(fee!.direction).toBe('debit')
  })

  it('skips suggestions that match an existing rule pattern', () => {
    const items = [item('SALARY DEPOSIT'), item('SALARY DIRECT DEPOSIT')]
    const existing = [{ pattern: 'SALARY', matchType: 'contains' as const, ledgerAccountId: 'la-6000', direction: 'debit' as const, priority: 100, active: true, entityId: 'ent-1', id: 'rule-1' }]
    const result = suggestCategoryRules(items, accounts, existing)
    expect(result).toHaveLength(0)
  })

  it('orders high-confidence suggestions first', () => {
    const items = [
      item('PAYROLL DEPOSIT'),
      item('PAYROLL DIRECT DEPOSIT'),
      item('BIWEEKLY PAYROLL'),
      item('STRIPE PAYOUT'),
      item('STRIPE TRANSFER'),
      item('BANK FEE'),
    ]
    const result = suggestCategoryRules(items, accounts, rules)
    const confidences: RuleSuggestion['confidence'][] = result.map((r) => r.confidence)
    expect(confidences[0]).not.toBe('low')
  })
})
