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
  transitionExternalActionStatus as transitionExternalActionStatusLocalApi,
  transitionObligationStatus as transitionObligationStatusLocalApi,
  transitionPayRunStatus as transitionPayRunStatusLocalApi,
  transitionSpendRequestStatus as transitionSpendRequestStatusLocalApi,
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
  markTaxScenarioStaleInSupabase,
  reviseBudgetInSupabase,
  updateExternalActionStatus as updateExternalActionStatusSupa,
  updatePayRunStatus as updatePayRunStatusSupa,
  updateSpendRequestStatus as updateSpendRequestStatusSupa,
  updateTaxObligationStatus as updateTaxObligationStatusSupa,
} from './supabaseApi'
import type {
  FinanceBudget,
  FinanceExternalActionStatus,
  FinanceInvoice,
  FinanceJournal,
  FinanceJournalLine,
  FinanceObligationStatus,
  FinancePayRunStatus,
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
      addTaxObligation,
      transitionObligationStatus,
      addBudget,
      reviseBudget,
      addTaxScenario,
      markTaxScenarioStale,
      transitionExternalActionStatus,
      isPeriodLocked,
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
      addTaxObligation,
      transitionObligationStatus,
      addBudget,
      reviseBudget,
      addTaxScenario,
      markTaxScenarioStale,
      transitionExternalActionStatus,
      isPeriodLocked,
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
