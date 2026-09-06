import { useCallback, useMemo, useState } from 'react'
import { FinanceDataContext } from './FinanceDataContext'
import type { FinanceDataContextValue } from './FinanceDataContext'
import { initialFinanceState } from './fixtures'
import {
  addBudget as addBudgetApi,
  addInvoice as addInvoiceApi,
  addJournal as addJournalApi,
  addSpendRequest as addSpendRequestApi,
  addTaxObligation as addTaxObligationApi,
  addTaxScenario as addTaxScenarioApi,
  isJournalBalanced as isJournalBalancedApi,
  loadFullState as loadFullStateApi,
  markTaxScenarioStale as markTaxScenarioStaleApi,
  reviseBudget as reviseBudgetApi,
  transitionExternalActionStatus as transitionExternalActionStatusApi,
  transitionObligationStatus as transitionObligationStatusApi,
  transitionPayRunStatus as transitionPayRunStatusApi,
  transitionSpendRequestStatus as transitionSpendRequestStatusApi,
} from './productionApi'
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
} from './types'

function useFinanceDataValue(orgId: string | undefined): FinanceDataContextValue {
  const isLive = orgId != null && orgId !== ''
  const [state, setState] = useState(() => (isLive ? loadFullStateApi(orgId) : initialFinanceState))

  const addInvoice = useCallback(
    (item: Omit<FinanceInvoice, 'id'>) => {
      if (!isLive || !orgId) return null
      const created = addInvoiceApi(orgId, item)
      setState(loadFullStateApi(orgId))
      return created
    },
    [isLive, orgId],
  )

  const addSpendRequest = useCallback(
    (item: Omit<FinanceSpendRequest, 'id'>) => {
      if (!isLive || !orgId) return null
      const created = addSpendRequestApi(orgId, item)
      setState(loadFullStateApi(orgId))
      return created
    },
    [isLive, orgId],
  )

  const transitionSpendRequestStatus = useCallback(
    (id: string, nextStatus: FinanceSpendRequest['status'], approver?: string) => {
      if (!isLive || !orgId) return null
      const updated = transitionSpendRequestStatusApi(orgId, id, nextStatus, approver)
      if (updated) setState(loadFullStateApi(orgId))
      return updated
    },
    [isLive, orgId],
  )

  const addJournal = useCallback(
    (journal: Omit<FinanceJournal, 'id' | 'balanced'>) => {
      if (!isLive || !orgId) return null
      const created = addJournalApi(orgId, journal)
      if (created) setState(loadFullStateApi(orgId))
      return created
    },
    [isLive, orgId],
  )

  const isJournalBalanced = useCallback((lines: FinanceJournalLine[]) => isJournalBalancedApi(lines), [])

  const transitionPayRunStatus = useCallback(
    (id: string, nextStatus: FinancePayRunStatus, actor?: string) => {
      if (!isLive || !orgId) return null
      const updated = transitionPayRunStatusApi(orgId, id, nextStatus, actor)
      if (updated) setState(loadFullStateApi(orgId))
      return updated
    },
    [isLive, orgId],
  )

  const addTaxObligation = useCallback(
    (item: Omit<FinanceTaxObligation, 'id'>) => {
      if (!isLive || !orgId) return null
      const created = addTaxObligationApi(orgId, item)
      setState(loadFullStateApi(orgId))
      return created
    },
    [isLive, orgId],
  )

  const transitionObligationStatus = useCallback(
    (id: string, nextStatus: FinanceObligationStatus, actor?: string) => {
      if (!isLive || !orgId) return null
      const updated = transitionObligationStatusApi(orgId, id, nextStatus, actor)
      if (updated) setState(loadFullStateApi(orgId))
      return updated
    },
    [isLive, orgId],
  )

  const addBudget = useCallback(
    (item: Omit<FinanceBudget, 'id'>) => {
      if (!isLive || !orgId) return null
      const created = addBudgetApi(orgId, item)
      setState(loadFullStateApi(orgId))
      return created
    },
    [isLive, orgId],
  )

  const reviseBudget = useCallback(
    (id: string, lines: FinanceBudget['lines']) => {
      if (!isLive || !orgId) return null
      const updated = reviseBudgetApi(orgId, id, lines)
      if (updated) setState(loadFullStateApi(orgId))
      return updated
    },
    [isLive, orgId],
  )

  const addTaxScenario = useCallback(
    (item: Omit<FinanceTaxScenario, 'id'>) => {
      if (!isLive || !orgId) return null
      const created = addTaxScenarioApi(orgId, item)
      setState(loadFullStateApi(orgId))
      return created
    },
    [isLive, orgId],
  )

  const markTaxScenarioStale = useCallback(
    (id: string, reason: string) => {
      if (!isLive || !orgId) return null
      const updated = markTaxScenarioStaleApi(orgId, id, reason)
      if (updated) setState(loadFullStateApi(orgId))
      return updated
    },
    [isLive, orgId],
  )

  const transitionExternalActionStatus = useCallback(
    (id: string, nextStatus: FinanceExternalActionStatus) => {
      if (!isLive || !orgId) return null
      const updated = transitionExternalActionStatusApi(orgId, id, nextStatus)
      if (updated) setState(loadFullStateApi(orgId))
      return updated
    },
    [isLive, orgId],
  )

  return useMemo(
    () => ({
      state,
      canWrite: isLive,
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
    }),
    [
      state,
      isLive,
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
    ],
  )
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
