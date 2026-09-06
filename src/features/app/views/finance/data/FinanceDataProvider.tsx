import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { FinanceDataContext } from './FinanceDataContext'
import type { FinanceDataContextValue } from './FinanceDataContext'
import { initialFinanceState } from './fixtures'
import {
  addBudget as addBudgetLocalApi,
  addInvoice as addInvoiceLocalApi,
  addJournal as addJournalLocalApi,
  addSpendRequest as addSpendRequestLocalApi,
  addTaxObligation as addTaxObligationLocalApi,
  addTaxScenario as addTaxScenarioLocalApi,
  isJournalBalanced as isJournalBalancedLocalApi,
  loadFullState as loadFullStateLocalApi,
  markTaxScenarioStale as markTaxScenarioStaleLocalApi,
  reviseBudget as reviseBudgetLocalApi,
  transitionBankItemMatchStatus as transitionBankItemMatchStatusLocalApi,
  transitionBillStatus as transitionBillStatusLocalApi,
  transitionTaxScenarioStatus as transitionTaxScenarioStatusLocalApi,
  transitionClosePeriodStatus as transitionClosePeriodStatusLocalApi,
  transitionExpenseStatus as transitionExpenseStatusLocalApi,
  transitionExternalActionStatus as transitionExternalActionStatusLocalApi,
  transitionInvoiceStatus as transitionInvoiceStatusLocalApi,
  transitionJournalStatus as transitionJournalStatusLocalApi,
  transitionObligationStatus as transitionObligationStatusLocalApi,
  transitionPayRunStatus as transitionPayRunStatusLocalApi,
  transitionReconciliationStatus as transitionReconciliationStatusLocalApi,
  settlePayrollLiability as settlePayrollLiabilityLocalApi,
  transitionSpendRequestStatus as transitionSpendRequestStatusLocalApi,
  addScenario as addScenarioLocalApi,
  addForecast as addForecastLocalApi,
  addReserveGoal as addReserveGoalLocalApi,
  updateReserveGoalProgress as updateReserveGoalProgressLocalApi,
  setHoldingStale as setHoldingStaleLocalApi,
  transitionDebtStatus as transitionDebtStatusLocalApi,
  transitionBudgetStatus as transitionBudgetStatusLocalApi,
  transitionScenarioStatus as transitionScenarioStatusLocalApi,
  freezeForecast as freezeForecastLocalApi,
} from './productionApi'
import {
  insertBudget as insertBudgetSupa,
  insertInvoice as insertInvoiceSupa,
  insertJournal as insertJournalSupa,
  insertSpendRequest as insertSpendRequestSupa,
  insertTaxObligation as insertTaxObligationSupa,
  insertTaxScenario as insertTaxScenarioSupa,
  isJournalBalanced as isJournalBalancedSupa,
  loadFinanceStateFromSupabase,
  settlePayrollLiabilityInSupabase,
  markTaxScenarioStaleInSupabase,
  reviseBudgetInSupabase,
  transitionTaxScenarioStatusInSupabase,
  updateBankItemMatchStatus as updateBankItemMatchStatusSupa,
  updateBillStatus as updateBillStatusSupa,
  updateClosePeriodStatus as updateClosePeriodStatusSupa,
  updateExpenseStatus as updateExpenseStatusSupa,
  updateExternalActionStatus as updateExternalActionStatusSupa,
  updateInvoiceStatus as updateInvoiceStatusSupa,
  updateJournalStatus as updateJournalStatusSupa,
  updatePayRunStatus as updatePayRunStatusSupa,
  updateReconciliationStatus as updateReconciliationStatusSupa,
  updateSpendRequestStatus as updateSpendRequestStatusSupa,
  updateTaxObligationStatus as updateTaxObligationStatusSupa,
  addScenarioInSupabase,
  addForecastInSupabase,
  addReserveGoalInSupabase,
  updateReserveGoalProgressInSupabase,
  setHoldingStaleInSupabase,
  transitionDebtStatusInSupabase,
  transitionBudgetStatusInSupabase,
  transitionScenarioStatusInSupabase,
  freezeForecastInSupabase,
} from './supabaseApi'
import type {
  FinanceBankMatchStatus,
  FinanceBill,
  FinanceBudget,
  FinanceClosePeriod,
  FinanceExpenseStatus,
  FinanceExternalActionStatus,
  FinanceInvoice,
  FinanceInvoiceStatus,
  FinanceJournal,
  FinanceJournalLine,
  FinanceJournalStatus,
  FinanceObligationStatus,
  FinancePayRunStatus,
  FinanceReconciliation,
  FinanceSpendRequest,
  FinanceTaxObligation,
  FinanceTaxScenario,
  FinanceWorkspaceState,
} from './types'

const useSupabase = (): boolean => supabase !== null

function useFinanceDataValue(orgId: string | undefined): FinanceDataContextValue {
  const hasSupabase = useSupabase()
  const isLive = orgId != null && orgId !== ''
  const [state, setState] = useState<FinanceWorkspaceState>(() =>
    isLive && hasSupabase ? emptyState() : initialFinanceState,
  )
  const [loadFailed, setLoadFailed] = useState(false)

  const reload = useCallback(async () => {
    if (!isLive || !orgId) return
    if (hasSupabase) {
      try {
        setLoadFailed(false)
        const fresh = await loadFinanceStateFromSupabase(orgId)
        setState(fresh)
      } catch {
        setLoadFailed(true)
      }
    } else {
      setState(loadFullStateLocalApi(orgId))
    }
  }, [isLive, orgId, hasSupabase])

  useEffect(() => {
    if (!isLive || !orgId) return
    if (hasSupabase) {
      void reload()
    } else {
      setState(loadFullStateLocalApi(orgId))
    }
  }, [isLive, orgId, hasSupabase, reload])

  const addInvoice = useCallback(
    async (item: Omit<FinanceInvoice, 'id'>) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const created = await insertInvoiceSupa(orgId, item)
        await reload()
        return created
      }
      const created = addInvoiceLocalApi(orgId, item)
      setState(loadFullStateLocalApi(orgId))
      return created
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const addSpendRequest = useCallback(
    async (item: Omit<FinanceSpendRequest, 'id'>) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const created = await insertSpendRequestSupa(orgId, item)
        await reload()
        return created
      }
      const created = addSpendRequestLocalApi(orgId, item)
      setState(loadFullStateLocalApi(orgId))
      return created
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const transitionSpendRequestStatus = useCallback(
    async (id: string, nextStatus: FinanceSpendRequest['status'], approver?: string) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await updateSpendRequestStatusSupa(orgId, id, nextStatus, approver)
        await reload()
        return updated
      }
      const updated = transitionSpendRequestStatusLocalApi(orgId, id, nextStatus, approver)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const addJournal = useCallback(
    async (journal: Omit<FinanceJournal, 'id' | 'balanced'>) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const created = await insertJournalSupa(orgId, journal)
        if (created) await reload()
        return created
      }
      const created = addJournalLocalApi(orgId, journal)
      if (created) setState(loadFullStateLocalApi(orgId))
      return created
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const isJournalBalanced = useCallback(
    (lines: FinanceJournalLine[]) =>
      hasSupabase ? isJournalBalancedSupa(lines) : isJournalBalancedLocalApi(lines),
    [hasSupabase],
  )

  const transitionPayRunStatus = useCallback(
    async (id: string, nextStatus: FinancePayRunStatus, actor?: string) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await updatePayRunStatusSupa(orgId, id, nextStatus, actor)
        await reload()
        return updated
      }
      const updated = transitionPayRunStatusLocalApi(orgId, id, nextStatus, actor)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const settlePayrollLiability = useCallback(
    async (id: string) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await settlePayrollLiabilityInSupabase(orgId, id)
        await reload()
        return updated
      }
      const updated = settlePayrollLiabilityLocalApi(orgId, id)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const addTaxObligation = useCallback(
    async (item: Omit<FinanceTaxObligation, 'id'>) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const created = await insertTaxObligationSupa(orgId, item)
        await reload()
        return created
      }
      const created = addTaxObligationLocalApi(orgId, item)
      setState(loadFullStateLocalApi(orgId))
      return created
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const transitionObligationStatus = useCallback(
    async (id: string, nextStatus: FinanceObligationStatus, actor?: string) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await updateTaxObligationStatusSupa(orgId, id, nextStatus, actor)
        await reload()
        return updated
      }
      const updated = transitionObligationStatusLocalApi(orgId, id, nextStatus, actor)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const addBudget = useCallback(
    async (item: Omit<FinanceBudget, 'id'>) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const created = await insertBudgetSupa(orgId, item)
        await reload()
        return created
      }
      const created = addBudgetLocalApi(orgId, item)
      setState(loadFullStateLocalApi(orgId))
      return created
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const reviseBudget = useCallback(
    async (id: string, lines: FinanceBudget['lines']) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await reviseBudgetInSupabase(orgId, id, lines)
        await reload()
        return updated
      }
      const updated = reviseBudgetLocalApi(orgId, id, lines)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const addTaxScenario = useCallback(
    async (item: Omit<FinanceTaxScenario, 'id'>) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const created = await insertTaxScenarioSupa(orgId, item)
        await reload()
        return created
      }
      const created = addTaxScenarioLocalApi(orgId, item)
      setState(loadFullStateLocalApi(orgId))
      return created
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const markTaxScenarioStale = useCallback(
    async (id: string, reason: string) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await markTaxScenarioStaleInSupabase(orgId, id, reason)
        await reload()
        return updated
      }
      const updated = markTaxScenarioStaleLocalApi(orgId, id, reason)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const transitionTaxScenarioStatus = useCallback(
    async (id: string, nextStatus: FinanceTaxScenario['status'], reviewer?: string) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await transitionTaxScenarioStatusInSupabase(orgId, id, nextStatus, reviewer)
        await reload()
        return updated
      }
      const updated = transitionTaxScenarioStatusLocalApi(orgId, id, nextStatus, reviewer)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const transitionExternalActionStatus = useCallback(
    async (id: string, nextStatus: FinanceExternalActionStatus) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await updateExternalActionStatusSupa(orgId, id, nextStatus)
        await reload()
        return updated
      }
      const updated = transitionExternalActionStatusLocalApi(orgId, id, nextStatus)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const isPeriodLocked = useCallback(
    (bookId: string, periodId: string) => {
      const cp = state.closePeriods.find(
        (p) => p.bookId === bookId && p.periodId === periodId,
      )
      return cp?.status === 'locked' || cp?.status === 'approved'
    },
    [state.closePeriods],
  )

  const transitionInvoiceStatus = useCallback(
    async (id: string, nextStatus: FinanceInvoiceStatus, paidAmount?: string) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await updateInvoiceStatusSupa(orgId, id, nextStatus, paidAmount)
        await reload()
        return updated
      }
      const updated = transitionInvoiceStatusLocalApi(orgId, id, nextStatus, paidAmount)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const transitionBillStatus = useCallback(
    async (id: string, nextStatus: FinanceBill['status'], paidAmount?: string) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await updateBillStatusSupa(orgId, id, nextStatus, paidAmount)
        await reload()
        return updated
      }
      const updated = transitionBillStatusLocalApi(orgId, id, nextStatus, paidAmount)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const transitionJournalStatus = useCallback(
    async (id: string, nextStatus: FinanceJournalStatus) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await updateJournalStatusSupa(orgId, id, nextStatus)
        await reload()
        return updated
      }
      const updated = transitionJournalStatusLocalApi(orgId, id, nextStatus)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const transitionBankItemMatchStatus = useCallback(
    async (
      id: string,
      nextStatus: FinanceBankMatchStatus,
      matchRef?: { journalId?: string; invoiceId?: string; billId?: string },
    ) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await updateBankItemMatchStatusSupa(orgId, id, nextStatus, matchRef)
        await reload()
        return updated
      }
      const updated = transitionBankItemMatchStatusLocalApi(orgId, id, nextStatus, matchRef)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const transitionReconciliationStatus = useCallback(
    async (id: string, nextStatus: FinanceReconciliation['status'], reviewer?: string) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await updateReconciliationStatusSupa(orgId, id, nextStatus, reviewer)
        await reload()
        return updated
      }
      const updated = transitionReconciliationStatusLocalApi(orgId, id, nextStatus, reviewer)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const transitionClosePeriodStatus = useCallback(
    async (
      id: string,
      nextStatus: FinanceClosePeriod['status'],
      approver?: string,
      reopenReason?: string,
    ) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await updateClosePeriodStatusSupa(orgId, id, nextStatus, approver, reopenReason)
        await reload()
        return updated
      }
      const updated = transitionClosePeriodStatusLocalApi(orgId, id, nextStatus, approver, reopenReason)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const transitionExpenseStatus = useCallback(
    async (id: string, nextStatus: FinanceExpenseStatus) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await updateExpenseStatusSupa(orgId, id, nextStatus)
        await reload()
        return updated
      }
      const updated = transitionExpenseStatusLocalApi(orgId, id, nextStatus)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const addScenario = useCallback(
    async (item: Omit<import('./types').FinanceScenario, 'id'>) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const created = await addScenarioInSupabase(orgId, item)
        await reload()
        return created
      }
      const created = addScenarioLocalApi(orgId, item)
      setState(loadFullStateLocalApi(orgId))
      return created
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const addForecast = useCallback(
    async (item: Omit<import('./types').FinanceForecast, 'id'>) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const created = await addForecastInSupabase(orgId, item)
        await reload()
        return created
      }
      const created = addForecastLocalApi(orgId, item)
      setState(loadFullStateLocalApi(orgId))
      return created
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const addReserveGoal = useCallback(
    async (item: Omit<import('./types').FinanceReserveGoal, 'id'>) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const created = await addReserveGoalInSupabase(orgId, item)
        await reload()
        return created
      }
      const created = addReserveGoalLocalApi(orgId, item)
      setState(loadFullStateLocalApi(orgId))
      return created
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const updateReserveGoalProgress = useCallback(
    async (id: string, currentAmount: string) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await updateReserveGoalProgressInSupabase(orgId, id, currentAmount)
        await reload()
        return updated
      }
      const updated = updateReserveGoalProgressLocalApi(orgId, id, currentAmount)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const setHoldingStale = useCallback(
    async (id: string, stale: boolean) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await setHoldingStaleInSupabase(orgId, id, stale)
        await reload()
        return updated
      }
      const updated = setHoldingStaleLocalApi(orgId, id, stale)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const transitionDebtStatus = useCallback(
    async (id: string, nextStatus: import('./types').FinanceDebt['status']) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await transitionDebtStatusInSupabase(orgId, id, nextStatus)
        await reload()
        return updated
      }
      const updated = transitionDebtStatusLocalApi(orgId, id, nextStatus)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const transitionBudgetStatus = useCallback(
    async (id: string, nextStatus: FinanceBudget['status']) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await transitionBudgetStatusInSupabase(orgId, id, nextStatus)
        await reload()
        return updated
      }
      const updated = transitionBudgetStatusLocalApi(orgId, id, nextStatus)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const transitionScenarioStatus = useCallback(
    async (id: string, nextStatus: import('./types').FinanceScenario['status'], reviewer?: string) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await transitionScenarioStatusInSupabase(orgId, id, nextStatus, reviewer)
        await reload()
        return updated
      }
      const updated = transitionScenarioStatusLocalApi(orgId, id, nextStatus, reviewer)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const freezeForecast = useCallback(
    async (id: string) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await freezeForecastInSupabase(orgId, id)
        await reload()
        return updated
      }
      const updated = freezeForecastLocalApi(orgId, id)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  return useMemo(
    () => ({
      state,
      canWrite: isLive,
      loadFailed,
      reload,
      addInvoice,
      addSpendRequest,
      transitionSpendRequestStatus,
      addJournal,
      isJournalBalanced,
      transitionPayRunStatus,
      settlePayrollLiability,
      addTaxObligation,
      transitionObligationStatus,
      addBudget,
      reviseBudget,
      addTaxScenario,
      markTaxScenarioStale,
      transitionTaxScenarioStatus,
      transitionExternalActionStatus,
      isPeriodLocked,
      transitionInvoiceStatus,
      transitionBillStatus,
      transitionJournalStatus,
      transitionBankItemMatchStatus,
      transitionReconciliationStatus,
      transitionClosePeriodStatus,
      transitionExpenseStatus,
      transitionBudgetStatus,
      addScenario,
      transitionScenarioStatus,
      addForecast,
      freezeForecast,
      addReserveGoal,
      updateReserveGoalProgress,
      setHoldingStale,
      transitionDebtStatus,
    }),
    [
      state,
      isLive,
      loadFailed,
      reload,
      addInvoice,
      addSpendRequest,
      transitionSpendRequestStatus,
      addJournal,
      isJournalBalanced,
      transitionPayRunStatus,
      settlePayrollLiability,
      addTaxObligation,
      transitionObligationStatus,
      addBudget,
      reviseBudget,
      addTaxScenario,
      markTaxScenarioStale,
      transitionTaxScenarioStatus,
      transitionExternalActionStatus,
      isPeriodLocked,
      transitionInvoiceStatus,
      transitionBillStatus,
      transitionJournalStatus,
      transitionBankItemMatchStatus,
      transitionReconciliationStatus,
      transitionClosePeriodStatus,
      transitionExpenseStatus,
      transitionBudgetStatus,
      addScenario,
      transitionScenarioStatus,
      addForecast,
      freezeForecast,
      addReserveGoal,
      updateReserveGoalProgress,
      setHoldingStale,
      transitionDebtStatus,
    ],
  )
}

function emptyState(): FinanceWorkspaceState {
  return {
    entities: [], books: [], fiscalPeriods: [], parties: [], bankAccounts: [],
    ledgerAccounts: [], invoices: [], bills: [], credits: [], receipts: [],
    spendRequests: [], purchaseOrders: [], expenses: [], subscriptions: [],
    journals: [], bankItems: [], reconciliations: [], closePeriods: [],
    payPeriods: [], payRuns: [], payrollLiabilities: [], budgets: [],
    scenarios: [], forecasts: [], reserveGoals: [], holdings: [], debts: [],
    taxObligations: [], taxScenarios: [], approvals: [], auditEvents: [],
    externalActions: [],
  }
}

export function FinanceDataProvider({
  children,
  mode,
  orgId,
}: {
  children: React.ReactNode
  mode: 'demo' | 'production'
  orgId?: string
}) {
  const value = useFinanceDataValue(mode === 'production' ? orgId : undefined)
  return <FinanceDataContext.Provider value={value}>{children}</FinanceDataContext.Provider>
}
