import { useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import {
  addScenario as addScenarioLocalApi,
  addForecast as addForecastLocalApi,
  addReserveGoal as addReserveGoalLocalApi,
  updateReserveGoalProgress as updateReserveGoalProgressLocalApi,
  setHoldingStale as setHoldingStaleLocalApi,
  transitionDebtStatus as transitionDebtStatusLocalApi,
  transitionBudgetStatus as transitionBudgetStatusLocalApi,
  transitionScenarioStatus as transitionScenarioStatusLocalApi,
  freezeForecast as freezeForecastLocalApi,
  addExternalAction as addExternalActionLocalApi,
  addEntity as addEntityLocalApi,
  addBankAccount as addBankAccountLocalApi,
  addLedgerAccount as addLedgerAccountLocalApi,
  addParty as addPartyLocalApi,
  addSubscription as addSubscriptionLocalApi,
  updateForecastPeriods as updateForecastPeriodsLocalApi,
  loadFullState as loadFullStateLocalApi,
  updateEntity as updateEntityLocalApi,
  removeEntity as removeEntityLocalApi,
} from './productionApi'
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
    [isLive, orgId, hasSupabase, reload, setState],
  )

  const addForecast = useCallback(
    async (item: Omit<FinanceForecast, 'id'>) => {
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
    [isLive, orgId, hasSupabase, reload, setState],
  )

  const addReserveGoal = useCallback(
    async (item: Omit<FinanceReserveGoal, 'id'>) => {
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
    [isLive, orgId, hasSupabase, reload, setState],
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
    [isLive, orgId, hasSupabase, reload, setState],
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
    [isLive, orgId, hasSupabase, reload, setState],
  )

  const transitionDebtStatus = useCallback(
    async (id: string, nextStatus: FinanceDebt['status']) => {
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
    [isLive, orgId, hasSupabase, reload, setState],
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
    [isLive, orgId, hasSupabase, reload, setState],
  )

  const transitionScenarioStatus = useCallback(
    async (id: string, nextStatus: FinanceScenario['status'], reviewer?: string) => {
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
    [isLive, orgId, hasSupabase, reload, setState],
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
    [isLive, orgId, hasSupabase, reload, setState],
  )

  const updateForecastPeriods = useCallback(
    async (id: string, periods: FinanceForecast['periods']) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await updateForecastPeriodsInSupabase(orgId, id, periods)
        await reload()
        return updated
      }
      const updated = updateForecastPeriodsLocalApi(orgId, id, periods)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload, setState],
  )

  const addExternalAction = useCallback(
    async (item: Omit<FinanceExternalAction, 'id'>) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const created = await addExternalActionInSupabase(orgId, item)
        await reload()
        return created
      }
      const created = addExternalActionLocalApi(orgId, item)
      setState(loadFullStateLocalApi(orgId))
      return created
    },
    [isLive, orgId, hasSupabase, reload, setState],
  )

  const addEntity = useCallback(
    async (item: Omit<FinanceLegalEntity, 'id'>) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const created = await addEntityInSupabase(orgId, item)
        if (created) {
          setState((prev) => ({ ...prev, entities: [...prev.entities, created] }))
        }
        await reload()
        return created
      }
      const created = addEntityLocalApi(orgId, item)
      setState(loadFullStateLocalApi(orgId))
      return created
    },
    [isLive, orgId, hasSupabase, reload, setState],
  )

  const updateEntity = useCallback(
    async (id: string, patch: Partial<Omit<FinanceLegalEntity, 'id'>>) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await updateEntityInSupabase(orgId, id, patch)
        if (updated) {
          setState((prev) => ({
            ...prev,
            entities: prev.entities.map((ent) => (ent.id === id ? updated : ent)),
          }))
        }
        await reload()
        return updated
      }
      const updated = updateEntityLocalApi(orgId, id, patch)
      setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload, setState],
  )

  const removeEntity = useCallback(
    async (id: string) => {
      if (!isLive || !orgId) return false
      if (hasSupabase) {
        const ok = await deleteEntityInSupabase(orgId, id)
        if (ok) {
          setState((prev) => ({
            ...prev,
            entities: prev.entities.filter((ent) => ent.id !== id),
          }))
        }
        await reload()
        return ok
      }
      const ok = removeEntityLocalApi(orgId, id)
      setState(loadFullStateLocalApi(orgId))
      return ok
    },
    [isLive, orgId, hasSupabase, reload, setState],
  )

  const addBankAccount = useCallback(
    async (item: Omit<FinanceBankAccount, 'id'>) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const created = await addBankAccountInSupabase(orgId, item)
        await reload()
        return created
      }
      const created = addBankAccountLocalApi(orgId, item)
      setState(loadFullStateLocalApi(orgId))
      return created
    },
    [isLive, orgId, hasSupabase, reload, setState],
  )

  const addLedgerAccount = useCallback(
    async (item: Omit<FinanceLedgerAccount, 'id'>) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const created = await addLedgerAccountInSupabase(orgId, item)
        await reload()
        return created
      }
      const created = addLedgerAccountLocalApi(orgId, item)
      setState(loadFullStateLocalApi(orgId))
      return created
    },
    [isLive, orgId, hasSupabase, reload, setState],
  )

  const addParty = useCallback(
    async (item: Omit<FinanceParty, 'id'>) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const created = await addPartyInSupabase(orgId, item)
        await reload()
        return created
      }
      const created = addPartyLocalApi(orgId, item)
      setState(loadFullStateLocalApi(orgId))
      return created
    },
    [isLive, orgId, hasSupabase, reload, setState],
  )

  const addSubscription = useCallback(
    async (item: Omit<FinanceSubscription, 'id'>) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const created = await addSubscriptionInSupabase(orgId, item)
        await reload()
        return created
      }
      const created = addSubscriptionLocalApi(orgId, item)
      setState(loadFullStateLocalApi(orgId))
      return created
    },
    [isLive, orgId, hasSupabase, reload, setState],
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
