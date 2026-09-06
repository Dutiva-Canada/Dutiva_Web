import { createContext } from 'react'
import type {
  FinanceBudget,
  FinanceExternalAction,
  FinanceExternalActionStatus,
  FinanceInvoice,
  FinanceJournal,
  FinanceJournalLine,
  FinanceObligationStatus,
  FinancePayRun,
  FinancePayRunStatus,
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
  addTaxObligation: (item: Omit<FinanceTaxObligation, 'id'>) => Promise<FinanceTaxObligation | null>
  transitionObligationStatus: (
    id: string,
    nextStatus: FinanceObligationStatus,
    actor?: string,
  ) => Promise<FinanceTaxObligation | null>
  addBudget: (item: Omit<FinanceBudget, 'id'>) => Promise<FinanceBudget | null>
  reviseBudget: (id: string, lines: FinanceBudget['lines']) => Promise<FinanceBudget | null>
  addTaxScenario: (item: Omit<FinanceTaxScenario, 'id'>) => Promise<FinanceTaxScenario | null>
  markTaxScenarioStale: (id: string, reason: string) => Promise<FinanceTaxScenario | null>
  transitionExternalActionStatus: (
    id: string,
    nextStatus: FinanceExternalActionStatus,
  ) => Promise<FinanceExternalAction | null>
  /** Check whether a book's period is locked or approved (ordinary edits rejected). */
  isPeriodLocked: (bookId: string, periodId: string) => boolean
}

export const FinanceDataContext = createContext<FinanceDataContextValue | null>(null)
