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
  addInvoice: (item: Omit<FinanceInvoice, 'id'>) => FinanceInvoice | null
  addSpendRequest: (item: Omit<FinanceSpendRequest, 'id'>) => FinanceSpendRequest | null
  transitionSpendRequestStatus: (
    id: string,
    nextStatus: FinanceSpendRequest['status'],
    approver?: string,
  ) => FinanceSpendRequest | null
  addJournal: (journal: Omit<FinanceJournal, 'id' | 'balanced'>) => FinanceJournal | null
  isJournalBalanced: (lines: FinanceJournalLine[]) => boolean
  transitionPayRunStatus: (
    id: string,
    nextStatus: FinancePayRunStatus,
    actor?: string,
  ) => FinancePayRun | null
  addTaxObligation: (item: Omit<FinanceTaxObligation, 'id'>) => FinanceTaxObligation | null
  transitionObligationStatus: (
    id: string,
    nextStatus: FinanceObligationStatus,
    actor?: string,
  ) => FinanceTaxObligation | null
  addBudget: (item: Omit<FinanceBudget, 'id'>) => FinanceBudget | null
  reviseBudget: (id: string, lines: FinanceBudget['lines']) => FinanceBudget | null
  addTaxScenario: (item: Omit<FinanceTaxScenario, 'id'>) => FinanceTaxScenario | null
  markTaxScenarioStale: (id: string, reason: string) => FinanceTaxScenario | null
  transitionExternalActionStatus: (
    id: string,
    nextStatus: FinanceExternalActionStatus,
  ) => FinanceExternalAction | null
}

export const FinanceDataContext = createContext<FinanceDataContextValue | null>(null)
