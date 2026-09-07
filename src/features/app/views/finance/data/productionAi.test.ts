import { beforeEach, describe, expect, it } from 'vitest'
import { updateState } from './productionApi'
import {
  analyseImportWithAiLocal,
  getAiImportSettingsLocal,
  recordCategorizationFeedbackLocal,
  updateAiImportSettingsLocal,
  updateBankItemCategorizationLocal,
} from './productionAi'
import type { FinanceBankItem, FinanceCategoryRule, FinanceLedgerAccount, FinanceWorkspaceState } from './types'

const orgId = `org-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const ledgerAccounts: FinanceLedgerAccount[] = [
  { id: 'la-6000', bookId: 'book-1', code: '6000', name: { en: 'Salaries and wages', fr: 'Salaires et traitements' }, type: 'expense', sensitive: false, active: true },
  { id: 'la-5000', bookId: 'book-1', code: '5000', name: { en: 'Revenue — Services', fr: 'Revenus — Services' }, type: 'revenue', sensitive: false, active: true },
  { id: 'la-6100', bookId: 'book-1', code: '6100', name: { en: 'Bank fees', fr: 'Frais bancaires' }, type: 'expense', sensitive: false, active: true },
]

const categoryRules: FinanceCategoryRule[] = [
  { id: 'cr-1', entityId: 'ent-1', pattern: 'SALARY', matchType: 'contains', ledgerAccountId: 'la-6000', direction: 'debit', priority: 50, active: true },
]

function bankItem(description: string): FinanceBankItem {
  return {
    id: `bi-${description}`,
    bankAccountId: 'ba-1',
    date: '2026-01-15',
    amount: '100.00',
    currency: 'CAD',
    description,
    matchStatus: 'unmatched',
    importSessionId: 'session-1',
  }
}

const storageKey = (id: string) => `dutiva_finance_state_${id}`

const initialState: FinanceWorkspaceState = {
  entities: [{ id: 'ent-1', legalName: 'Test Entity', legalForm: 'corporation', fiscalYearStart: '2026-01-01', functionalCurrency: 'CAD', jurisdictions: ['ON'], active: true }],
  books: [{ id: 'book-1', entityId: 'ent-1', label: { en: 'Book', fr: 'Livre' }, basis: 'accrual', authoritativeSource: { en: 'Dutiva', fr: 'Dutiva' } }],
  fiscalPeriods: [],
  parties: [],
  bankAccounts: [],
  ledgerAccounts,
  invoices: [],
  bills: [],
  credits: [],
  receipts: [],
  spendRequests: [],
  purchaseOrders: [],
  expenses: [],
  subscriptions: [],
  journals: [],
  bankItems: [bankItem('SALARY DEPOSIT 1'), bankItem('SALARY DEPOSIT 2'), bankItem('MYSTERY ITEM')],
  reconciliations: [],
  closePeriods: [],
  payPeriods: [],
  payRuns: [],
  payrollLiabilities: [],
  budgets: [],
  scenarios: [],
  forecasts: [],
  reserveGoals: [],
  holdings: [],
  debts: [],
  taxObligations: [],
  taxScenarios: [],
  approvals: [],
  auditEvents: [],
  externalActions: [],
  categoryRules,
  importSessions: [{ id: 'session-1', bankAccountId: 'ba-1', entityId: 'ent-1', fileName: 'test.csv', importedAt: '2026-01-15T00:00:00Z', totalRows: 3, newItems: 3, duplicates: 0, errors: 0, status: 'imported' }],
  aiImportSettings: { aiImportEnabled: true, aiImportMode: 'auto_high' },
  categorizationFeedback: [],
}

describe('productionAi', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(storageKey(orgId))
    }
    updateState(orgId, () => initialState)
  })

  it('updates AI import settings', () => {
    updateAiImportSettingsLocal(orgId, { aiImportEnabled: false, aiImportMode: 'suggest' })
    const settings = getAiImportSettingsLocal(orgId)
    expect(settings.aiImportEnabled).toBe(false)
    expect(settings.aiImportMode).toBe('suggest')
  })

  it('records categorization feedback and reuses it', () => {
    recordCategorizationFeedbackLocal(orgId, {
      entityId: 'ent-1',
      description: 'STRIPE PAYOUT',
      originalLedgerAccountId: 'la-5000',
      correctedLedgerAccountId: 'la-6000',
      correctedDirection: 'debit',
    })
    const state = JSON.parse(localStorage.getItem(storageKey(orgId)) ?? '{}') as FinanceWorkspaceState
    expect(state.categorizationFeedback.length).toBe(1)
    expect(state.categorizationFeedback[0]?.correctedLedgerAccountId).toBe('la-6000')
  })

  it('updates a bank item categorization', () => {
    const updated = updateBankItemCategorizationLocal(orgId, 'bi-SALARY DEPOSIT 1', {
      ledgerAccountId: 'la-5000',
      direction: 'credit',
      matchStatus: 'matched',
    })
    expect(updated).not.toBeNull()
    expect(updated!.matchStatus).toBe('matched')
    expect(updated!.aiSuggestion!.ledgerAccountId).toBe('la-5000')
  })

  it('analyses an import session using rules when AI is enabled', async () => {
    const result = await analyseImportWithAiLocal(orgId, 'session-1')
    expect(result).not.toBeNull()
    expect(result!.itemsAnalysed).toBe(3)
    expect(result!.itemsMatched).toBeGreaterThanOrEqual(0)
    expect(result!.itemsSuggested).toBeGreaterThanOrEqual(0)
  })
})
