import { describe, expect, it } from 'vitest'
import { autoCategorize, applySuggestions, bankItemToJournalLine } from './autoCategorize'
import type { FinanceBankItem, FinanceCategoryRule, FinanceLedgerAccount } from './types'

const ledgerAccounts: FinanceLedgerAccount[] = [
  { id: 'acct-1000', bookId: 'book-1', code: '1000', name: { en: 'Cash', fr: 'Encaisse' }, type: 'asset', sensitive: false, active: true },
  { id: 'acct-5000', bookId: 'book-1', code: '5000', name: { en: 'Revenue', fr: 'Revenus' }, type: 'revenue', sensitive: false, active: true },
  { id: 'acct-6000', bookId: 'book-1', code: '6000', name: { en: 'Salaries', fr: 'Salaires' }, type: 'expense', sensitive: true, active: true },
]

const rules: FinanceCategoryRule[] = [
  { id: 'r1', entityId: 'ent-1', pattern: 'PAYROLL', matchType: 'contains', ledgerAccountId: 'acct-6000', direction: 'debit', priority: 100, active: true },
  { id: 'r2', entityId: 'ent-1', pattern: 'STRIPE', matchType: 'contains', ledgerAccountId: 'acct-5000', direction: 'credit', priority: 90, active: true },
  { id: 'r3', entityId: 'ent-1', pattern: 'INACTIVE', matchType: 'contains', ledgerAccountId: 'acct-5000', direction: 'credit', priority: 80, active: false },
]

const bankItems: FinanceBankItem[] = [
  { id: 'bi-1', bankAccountId: 'bank-1', date: '2026-08-15', amount: '-5000.00', currency: 'CAD', description: 'PAYROLL RUN 18', matchStatus: 'unmatched' },
  { id: 'bi-2', bankAccountId: 'bank-1', date: '2026-08-16', amount: '1200.00', currency: 'CAD', description: 'STRIPE PAYOUT', matchStatus: 'unmatched' },
  { id: 'bi-3', bankAccountId: 'bank-1', date: '2026-08-17', amount: '50.00', currency: 'CAD', description: 'UNKNOWN VENDOR', matchStatus: 'unmatched' },
  { id: 'bi-4', bankAccountId: 'bank-1', date: '2026-08-18', amount: '100.00', currency: 'CAD', description: 'INACTIVE RULE TEST', matchStatus: 'unmatched' },
]

describe('autoCategorize', () => {
  it('matches items using contains rules by priority', () => {
    const suggestions = autoCategorize(bankItems, rules, ledgerAccounts)
    const payroll = suggestions.find((s) => s.bankItemId === 'bi-1')
    expect(payroll?.ruleId).toBe('r1')
    expect(payroll?.ledgerAccountId).toBe('acct-6000')
    expect(payroll?.confidence).toBe('medium')
  })

  it('returns high confidence for exact matches', () => {
    const exactRules: FinanceCategoryRule[] = [
      { id: 'r-exact', entityId: 'ent-1', pattern: 'STRIPE PAYOUT', matchType: 'exact', ledgerAccountId: 'acct-5000', direction: 'credit', priority: 100, active: true },
    ]
    const suggestions = autoCategorize(bankItems, exactRules, ledgerAccounts)
    const stripe = suggestions.find((s) => s.bankItemId === 'bi-2')
    expect(stripe?.confidence).toBe('high')
  })

  it('returns none for unmatched items', () => {
    const suggestions = autoCategorize(bankItems, rules, ledgerAccounts)
    const unknown = suggestions.find((s) => s.bankItemId === 'bi-3')
    expect(unknown?.confidence).toBe('none')
  })

  it('skips inactive rules', () => {
    const suggestions = autoCategorize(bankItems, rules, ledgerAccounts)
    const inactive = suggestions.find((s) => s.bankItemId === 'bi-4')
    expect(inactive?.confidence).toBe('none')
  })

  it('skips already matched items', () => {
    const matchedItems: FinanceBankItem[] = [
      { ...bankItems[0]!, matchStatus: 'matched' },
    ]
    const suggestions = autoCategorize(matchedItems, rules, ledgerAccounts)
    expect(suggestions[0]?.confidence).toBe('none')
    expect(suggestions[0]?.reason).toBe('Already matched')
  })
})

describe('applySuggestions', () => {
  it('updates match status to suggested for matched items', () => {
    const suggestions = autoCategorize(bankItems, rules, ledgerAccounts)
    const updated = applySuggestions(bankItems, suggestions)
    const payroll = updated.find((bi) => bi.id === 'bi-1')
    expect(payroll?.matchStatus).toBe('suggested')
  })

  it('leaves unmatched items unchanged', () => {
    const suggestions = autoCategorize(bankItems, rules, ledgerAccounts)
    const updated = applySuggestions(bankItems, suggestions)
    const unknown = updated.find((bi) => bi.id === 'bi-3')
    expect(unknown?.matchStatus).toBe('unmatched')
  })
})

describe('bankItemToJournalLine', () => {
  it('creates debit bank / credit account for positive amounts', () => {
    const bi: FinanceBankItem = { id: 'bi-1', bankAccountId: 'bank-1', date: '2026-08-15', amount: '100.00', currency: 'CAD', description: 'STRIPE', matchStatus: 'suggested' }
    const suggestion = { bankItemId: 'bi-1', ruleId: 'r1', ledgerAccountId: 'acct-5000', direction: 'credit' as const, confidence: 'medium' as const, reason: 'test' }
    const result = bankItemToJournalLine(bi, suggestion, 'acct-1000')
    expect(result?.lines).toHaveLength(2)
    expect(result?.lines[0]?.accountId).toBe('acct-1000')
    expect(result?.lines[0]?.debit).toBe('100.00')
    expect(result?.lines[1]?.accountId).toBe('acct-5000')
    expect(result?.lines[1]?.credit).toBe('100.00')
  })

  it('creates debit account / credit bank for negative amounts', () => {
    const bi: FinanceBankItem = { id: 'bi-1', bankAccountId: 'bank-1', date: '2026-08-15', amount: '-5000.00', currency: 'CAD', description: 'PAYROLL', matchStatus: 'suggested' }
    const suggestion = { bankItemId: 'bi-1', ruleId: 'r1', ledgerAccountId: 'acct-6000', direction: 'debit' as const, confidence: 'medium' as const, reason: 'test' }
    const result = bankItemToJournalLine(bi, suggestion, 'acct-1000')
    expect(result?.lines[0]?.accountId).toBe('acct-6000')
    expect(result?.lines[0]?.debit).toBe('5000.00')
    expect(result?.lines[1]?.accountId).toBe('acct-1000')
    expect(result?.lines[1]?.credit).toBe('5000.00')
  })

  it('returns null for no suggestion', () => {
    const bi: FinanceBankItem = { id: 'bi-1', bankAccountId: 'bank-1', date: '2026-08-15', amount: '100.00', currency: 'CAD', description: 'TEST', matchStatus: 'unmatched' }
    const suggestion = { bankItemId: 'bi-1', confidence: 'none' as const, reason: 'no match' }
    const result = bankItemToJournalLine(bi, suggestion, 'acct-1000')
    expect(result).toBeNull()
  })
})
