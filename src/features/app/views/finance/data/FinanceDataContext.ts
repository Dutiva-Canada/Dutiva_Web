import { createContext } from 'react'
import type {
  FinanceBankItem,
  FinanceBankMatchStatus,
  FinanceBill,
  FinanceBudget,
  FinanceClosePeriod,
  FinanceExpenseStatus,
  FinanceExternalAction,
  FinanceExternalActionStatus,
  FinanceInvoice,
  FinanceInvoiceStatus,
  FinanceJournal,
  FinanceJournalLine,
  FinanceJournalStatus,
  FinanceObligationStatus,
  FinancePayRun,
  FinancePayRunStatus,
  FinanceReconciliation,
  FinanceSpendRequest,
  FinanceTaxObligation,
  FinanceTaxScenario,
  FinanceWorkspaceState,
} from './types'

export interface FinanceDataContextValue {
  state: FinanceWorkspaceState
  canWrite: boolean
  /** True when the last Supabase load failed (localStorage never sets this). */
  loadFailed: boolean
  /** True when a Supabase client is configured; false means localStorage fallback. */
  hasSupabase: boolean
  /** Re-fetch the full workspace state from the backend. */
  reload: () => Promise<void>
  addInvoice: (item: Omit<FinanceInvoice, 'id'>) => Promise<FinanceInvoice | null>
  addSpendRequest: (item: Omit<FinanceSpendRequest, 'id'>) => Promise<FinanceSpendRequest | null>
  transitionSpendRequestStatus: (
    id: string,
    nextStatus: FinanceSpendRequest['status'],
    approver?: string,
  ) => Promise<FinanceSpendRequest | null>
  addJournal: (journal: Omit<FinanceJournal, 'id' | 'balanced'>) => Promise<FinanceJournal | null>
  isJournalBalanced: (lines: FinanceJournalLine[]) => boolean
  transitionPayRunStatus: (
    id: string,
    nextStatus: FinancePayRunStatus,
    actor?: string,
  ) => Promise<FinancePayRun | null>
  settlePayrollLiability: (id: string) => Promise<import('./types').FinancePayrollLiability | null>
  addTaxObligation: (item: Omit<FinanceTaxObligation, 'id'>) => Promise<FinanceTaxObligation | null>
  transitionObligationStatus: (
    id: string,
    nextStatus: FinanceObligationStatus,
    actor?: string,
  ) => Promise<FinanceTaxObligation | null>
  addBudget: (item: Omit<FinanceBudget, 'id'>) => Promise<FinanceBudget | null>
  reviseBudget: (id: string, lines: FinanceBudget['lines']) => Promise<FinanceBudget | null>
  transitionBudgetStatus: (id: string, nextStatus: FinanceBudget['status']) => Promise<FinanceBudget | null>
  addScenario: (item: Omit<import('./types').FinanceScenario, 'id'>) => Promise<import('./types').FinanceScenario | null>
  transitionScenarioStatus: (
    id: string,
    nextStatus: import('./types').FinanceScenario['status'],
    reviewer?: string,
  ) => Promise<import('./types').FinanceScenario | null>
  addForecast: (item: Omit<import('./types').FinanceForecast, 'id'>) => Promise<import('./types').FinanceForecast | null>
  freezeForecast: (id: string) => Promise<import('./types').FinanceForecast | null>
  addReserveGoal: (item: Omit<import('./types').FinanceReserveGoal, 'id'>) => Promise<import('./types').FinanceReserveGoal | null>
  updateReserveGoalProgress: (id: string, currentAmount: string) => Promise<import('./types').FinanceReserveGoal | null>
  setHoldingStale: (id: string, stale: boolean) => Promise<import('./types').FinanceHolding | null>
  transitionDebtStatus: (id: string, nextStatus: import('./types').FinanceDebt['status']) => Promise<import('./types').FinanceDebt | null>
  addTaxScenario: (item: Omit<FinanceTaxScenario, 'id'>) => Promise<FinanceTaxScenario | null>
  markTaxScenarioStale: (id: string, reason: string) => Promise<FinanceTaxScenario | null>
  transitionTaxScenarioStatus: (
    id: string,
    nextStatus: FinanceTaxScenario['status'],
    reviewer?: string,
  ) => Promise<FinanceTaxScenario | null>
  addExternalAction: (item: Omit<import('./types').FinanceExternalAction, 'id'>) => Promise<import('./types').FinanceExternalAction | null>
  updateForecastPeriods: (id: string, periods: import('./types').FinanceForecast['periods']) => Promise<import('./types').FinanceForecast | null>
  addBankAccount: (item: Omit<import('./types').FinanceBankAccount, 'id'>) => Promise<import('./types').FinanceBankAccount | null>
  addLedgerAccount: (item: Omit<import('./types').FinanceLedgerAccount, 'id'>) => Promise<import('./types').FinanceLedgerAccount | null>
  addParty: (item: Omit<import('./types').FinanceParty, 'id'>) => Promise<import('./types').FinanceParty | null>
  addSubscription: (item: Omit<import('./types').FinanceSubscription, 'id'>) => Promise<import('./types').FinanceSubscription | null>
  transitionExternalActionStatus: (
    id: string,
    nextStatus: FinanceExternalActionStatus,
  ) => Promise<FinanceExternalAction | null>
  /** Check whether a book's period is locked or approved (ordinary edits rejected). */
  isPeriodLocked: (bookId: string, periodId: string) => boolean
  transitionInvoiceStatus: (
    id: string,
    nextStatus: FinanceInvoiceStatus,
    paidAmount?: string,
  ) => Promise<FinanceInvoice | null>
  transitionBillStatus: (
    id: string,
    nextStatus: FinanceBill['status'],
    paidAmount?: string,
  ) => Promise<FinanceBill | null>
  transitionJournalStatus: (
    id: string,
    nextStatus: FinanceJournalStatus,
  ) => Promise<FinanceJournal | null>
  transitionBankItemMatchStatus: (
    id: string,
    nextStatus: FinanceBankMatchStatus,
    matchRef?: { journalId?: string; invoiceId?: string; billId?: string },
  ) => Promise<FinanceBankItem | null>
  transitionReconciliationStatus: (
    id: string,
    nextStatus: FinanceReconciliation['status'],
    reviewer?: string,
  ) => Promise<FinanceReconciliation | null>
  transitionClosePeriodStatus: (
    id: string,
    nextStatus: FinanceClosePeriod['status'],
    approver?: string,
    reopenReason?: string,
  ) => Promise<FinanceClosePeriod | null>
  transitionExpenseStatus: (
    id: string,
    nextStatus: FinanceExpenseStatus,
  ) => Promise<FinanceWorkspaceState['expenses'][number] | null>
  /* ---------- Import, export, and categorization ---------- */
  importBankStatement: (
    bankAccountId: string,
    fileName: string,
    fileContent: string,
  ) => Promise<{ newItems: number; duplicates: number; errors: number } | null>
  addCategoryRule: (rule: Omit<import('./types').FinanceCategoryRule, 'id'>) => Promise<import('./types').FinanceCategoryRule | null>
  updateCategoryRule: (id: string, patch: Partial<import('./types').FinanceCategoryRule>) => Promise<import('./types').FinanceCategoryRule | null>
  removeCategoryRule: (id: string) => Promise<boolean>
  /** Run auto-categorization on all unmatched bank items. */
  runAutoCategorize: () => Promise<number>
}

export const FinanceDataContext = createContext<FinanceDataContextValue | null>(null)
