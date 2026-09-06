import { bi } from '@/i18n/core'
import type { FinanceBook, FinanceCategoryMatchType, FinanceLedgerAccount, FinanceLegalEntity } from './types'

export interface DefaultLedgerAccountSeed {
  code: string
  name: { en: string; fr: string }
  type: FinanceLedgerAccount['type']
  sensitive?: boolean
}

export interface DefaultCategoryRule {
  pattern: string
  matchType: FinanceCategoryMatchType
  direction: 'debit' | 'credit'
  priority: number
  ledgerAccountCode: string
}

const currentYear = new Date().getFullYear()

export const DEFAULT_ENTITY: Omit<FinanceLegalEntity, 'id'> = {
  legalName: 'My Organization',
  legalForm: 'corporation',
  fiscalYearStart: `${currentYear}-01-01`,
  functionalCurrency: 'CAD',
  jurisdictions: ['ON'],
  active: true,
}

export const DEFAULT_BOOK: Omit<FinanceBook, 'id' | 'entityId'> = {
  label: bi('Main ledger', 'Grand livre principal'),
  basis: 'accrual',
  authoritativeSource: bi('Manual', 'Manuel'),
  lastSyncedAt: new Date().toISOString(),
}

export const DEFAULT_LEDGER_ACCOUNTS: DefaultLedgerAccountSeed[] = [
  { code: '1000', name: bi('Cash — Operating', 'Encaisse — Exploitation'), type: 'asset' },
  { code: '1200', name: bi('Accounts receivable', 'Clients'), type: 'asset' },
  { code: '2000', name: bi('Accounts payable', 'Fournisseurs'), type: 'liability' },
  { code: '2200', name: bi('GST/HST payable', 'TPS/TVH à payer'), type: 'liability' },
  { code: '5000', name: bi('Revenue — Services', 'Revenus — Services'), type: 'revenue' },
  { code: '5100', name: bi('Rent', 'Loyer'), type: 'expense' },
  { code: '6000', name: bi('Salaries and wages', 'Salaires et traitements'), type: 'expense', sensitive: true },
  { code: '6100', name: bi('Bank fees', 'Frais bancaires'), type: 'expense' },
  { code: '6200', name: bi('Utilities', 'Services publics'), type: 'expense' },
  { code: '6300', name: bi('Office expenses', 'Frais de bureau'), type: 'expense' },
]

export const DEFAULT_CATEGORY_RULES: DefaultCategoryRule[] = [
  { pattern: 'PAYROLL', matchType: 'contains', direction: 'debit', priority: 100, ledgerAccountCode: '6000' },
  { pattern: 'STRIPE', matchType: 'contains', direction: 'credit', priority: 95, ledgerAccountCode: '5000' },
  { pattern: 'SHOPIFY', matchType: 'contains', direction: 'credit', priority: 90, ledgerAccountCode: '5000' },
  { pattern: 'SQUARE', matchType: 'contains', direction: 'credit', priority: 88, ledgerAccountCode: '5000' },
  { pattern: 'RENT', matchType: 'contains', direction: 'debit', priority: 80, ledgerAccountCode: '5100' },
  { pattern: 'BANK FEE', matchType: 'contains', direction: 'debit', priority: 70, ledgerAccountCode: '6100' },
  { pattern: 'WIRE', matchType: 'contains', direction: 'debit', priority: 68, ledgerAccountCode: '6100' },
  { pattern: 'HYDRO', matchType: 'contains', direction: 'debit', priority: 60, ledgerAccountCode: '6200' },
  { pattern: 'TELECOM', matchType: 'contains', direction: 'debit', priority: 58, ledgerAccountCode: '6200' },
  { pattern: 'INTERNET', matchType: 'contains', direction: 'debit', priority: 56, ledgerAccountCode: '6200' },
  { pattern: 'OFFICE', matchType: 'contains', direction: 'debit', priority: 50, ledgerAccountCode: '6300' },
  { pattern: 'STAPLES', matchType: 'contains', direction: 'debit', priority: 48, ledgerAccountCode: '6300' },
  { pattern: 'AMAZON', matchType: 'contains', direction: 'debit', priority: 46, ledgerAccountCode: '6300' },
]
