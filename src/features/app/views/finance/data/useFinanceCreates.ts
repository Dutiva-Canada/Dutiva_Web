import { useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import {
  addScenarioInSupabase,
  addForecastInSupabase,
  addReserveGoalInSupabase,
  updateReserveGoalProgressInSupabase,
  setHoldingStaleInSupabase,
  transitionDebtStatusInSupabase,
  transitionBudgetStatusInSupabase,
  transitionScenarioStatusInSupabase,
  freezeForecastInSupabase,
  updateForecastPeriodsInSupabase,
  addExternalActionInSupabase,
  addEntityInSupabase,
  updateEntityInSupabase,
  deleteEntityInSupabase,
  addBankAccountInSupabase,
  addLedgerAccountInSupabase,
  addPartyInSupabase,
  addSubscriptionInSupabase,
} from './supabaseApi'
import type {
  FinanceBankAccount,
  FinanceBudget,
  FinanceDebt,
  FinanceExternalAction,
  FinanceForecast,
  FinanceLedgerAccount,
  FinanceLegalEntity,
  FinanceParty,
  FinanceReserveGoal,
  FinanceScenario,
  FinanceSubscription,
  FinanceWorkspaceState,
} from './types'

interface UseFinanceCreatesArgs {
  orgId: string | undefined
  isLive: boolean
  hasSupabase: boolean
  reload: () => Promise<void>
  setState: Dispatch<SetStateAction<FinanceWorkspaceState>>
}

export function useFinanceCreates({
  orgId,
  isLive,
  hasSupabase,
  reload,
  setState,
}: UseFinanceCreatesArgs) {
  const addScenario = useCallback(
    async (item: Omit<FinanceScenario, 'id'>) => {
      if (!isLive || !orgId || !hasSupabase) return null
      const created = await addScenarioInSupabase(orgId, item)
      await reload()
      return created
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const addForecast = useCallback(
    async (item: Omit<FinanceForecast, 'id'>) => {
      if (!isLive || !orgId || !hasSupabase) return null
      const created = await addForecastInSupabase(orgId, item)
      await reload()
      return created
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const addReserveGoal = useCallback(
    async (item: Omit<FinanceReserveGoal, 'id'>) => {
      if (!isLive || !orgId || !hasSupabase) return null
      const created = await addReserveGoalInSupabase(orgId, item)
      await reload()
      return created
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const updateReserveGoalProgress = useCallback(
    async (id: string, currentAmount: string) => {
      if (!isLive || !orgId || !hasSupabase) return null
      const updated = await updateReserveGoalProgressInSupabase(orgId, id, currentAmount)
      await reload()
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const setHoldingStale = useCallback(
    async (id: string, stale: boolean) => {
      if (!isLive || !orgId || !hasSupabase) return null
      const updated = await setHoldingStaleInSupabase(orgId, id, stale)
      await reload()
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const transitionDebtStatus = useCallback(
    async (id: string, nextStatus: FinanceDebt['status']) => {
      if (!isLive || !orgId || !hasSupabase) return null
      const updated = await transitionDebtStatusInSupabase(orgId, id, nextStatus)
      await reload()
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const transitionBudgetStatus = useCallback(
    async (id: string, nextStatus: FinanceBudget['status']) => {
      if (!isLive || !orgId || !hasSupabase) return null
      const updated = await transitionBudgetStatusInSupabase(orgId, id, nextStatus)
      await reload()
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const transitionScenarioStatus = useCallback(
    async (id: string, nextStatus: FinanceScenario['status'], reviewer?: string) => {
      if (!isLive || !orgId || !hasSupabase) return null
      const updated = await transitionScenarioStatusInSupabase(orgId, id, nextStatus, reviewer)
      await reload()
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const freezeForecast = useCallback(
    async (id: string) => {
      if (!isLive || !orgId || !hasSupabase) return null
      const updated = await freezeForecastInSupabase(orgId, id)
      await reload()
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const updateForecastPeriods = useCallback(
    async (id: string, periods: FinanceForecast['periods']) => {
      if (!isLive || !orgId || !hasSupabase) return null
      const updated = await updateForecastPeriodsInSupabase(orgId, id, periods)
      await reload()
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const addExternalAction = useCallback(
    async (item: Omit<FinanceExternalAction, 'id'>) => {
      if (!isLive || !orgId || !hasSupabase) return null
      const created = await addExternalActionInSupabase(orgId, item)
      await reload()
      return created
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const addEntity = useCallback(
    async (item: Omit<FinanceLegalEntity, 'id'>) => {
      if (!isLive || !orgId || !hasSupabase) return null
      const created = await addEntityInSupabase(orgId, item)
      if (created) {
        setState((prev) => ({ ...prev, entities: [...prev.entities, created] }))
      }
      await reload()
      return created
    },
    [isLive, orgId, hasSupabase, reload, setState],
  )

  const updateEntity = useCallback(
    async (id: string, patch: Partial<Omit<FinanceLegalEntity, 'id'>>) => {
      if (!isLive || !orgId || !hasSupabase) return null
      const updated = await updateEntityInSupabase(orgId, id, patch)
      if (updated) {
        setState((prev) => ({
          ...prev,
          entities: prev.entities.map((ent) => (ent.id === id ? updated : ent)),
        }))
      }
      await reload()
      return updated
    },
    [isLive, orgId, hasSupabase, reload, setState],
  )

  const removeEntity = useCallback(
    async (id: string) => {
      if (!isLive || !orgId || !hasSupabase) return false
      const ok = await deleteEntityInSupabase(orgId, id)
      if (ok) {
        setState((prev) => ({
          ...prev,
          entities: prev.entities.filter((ent) => ent.id !== id),
        }))
      }
      await reload()
      return ok
    },
    [isLive, orgId, hasSupabase, reload, setState],
  )

  const addBankAccount = useCallback(
    async (item: Omit<FinanceBankAccount, 'id'>) => {
      if (!isLive || !orgId || !hasSupabase) return null
      const created = await addBankAccountInSupabase(orgId, item)
      await reload()
      return created
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const addLedgerAccount = useCallback(
    async (item: Omit<FinanceLedgerAccount, 'id'>) => {
      if (!isLive || !orgId || !hasSupabase) return null
      const created = await addLedgerAccountInSupabase(orgId, item)
      await reload()
      return created
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const addParty = useCallback(
    async (item: Omit<FinanceParty, 'id'>) => {
      if (!isLive || !orgId || !hasSupabase) return null
      const created = await addPartyInSupabase(orgId, item)
      await reload()
      return created
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const addSubscription = useCallback(
    async (item: Omit<FinanceSubscription, 'id'>) => {
      if (!isLive || !orgId || !hasSupabase) return null
      const created = await addSubscriptionInSupabase(orgId, item)
      await reload()
      return created
    },
    [isLive, orgId, hasSupabase, reload],
  )

  return {
    addScenario,
    addForecast,
    addReserveGoal,
    updateReserveGoalProgress,
    setHoldingStale,
    transitionDebtStatus,
    transitionBudgetStatus,
    transitionScenarioStatus,
    freezeForecast,
    updateForecastPeriods,
    addExternalAction,
    addEntity,
    updateEntity,
    removeEntity,
    addBankAccount,
    addLedgerAccount,
    addParty,
    addSubscription,
  }
}

export type FinanceCreates = ReturnType<typeof useFinanceCreates>
