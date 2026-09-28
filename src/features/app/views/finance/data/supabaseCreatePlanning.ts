import type {
  FinanceBudget,
  FinanceDebt,
  FinanceExternalAction,
  FinanceForecast,
  FinanceHolding,
  FinanceReserveGoal,
  FinanceScenario,
} from './types'
import {
  mapBudget,
  mapDebt,
  mapExternalAction,
  mapForecast,
  mapHolding,
  mapReserveGoal,
  mapScenario,
} from './supabaseMappers'
import { TABLES, supabase } from './supabaseTables'

/* ---------- Scenario / forecast / reserve / holding / debt lifecycle ---------- */

export async function addScenarioInSupabase(
  orgId: string,
  item: Omit<FinanceScenario, 'id'>,
): Promise<FinanceScenario | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.scenarios)
    .insert({
      organization_id: orgId,
      entity_id: item.entityId,
      label: item.label,
      type: item.type,
      assumptions: item.assumptions,
      cutoff_date: item.cutoffDate,
      currency: item.currency,
      projected_revenue: Number(item.projectedRevenue),
      projected_expense: Number(item.projectedExpense),
      projected_cash_flow: Number(item.projectedCashFlow),
      status: item.status,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapScenario(data as Record<string, unknown>)
}

export async function addForecastInSupabase(
  orgId: string,
  item: Omit<FinanceForecast, 'id'>,
): Promise<FinanceForecast | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.forecasts)
    .insert({
      organization_id: orgId,
      entity_id: item.entityId,
      label: item.label,
      type: item.type,
      baseline_scenario_id: item.baselineScenarioId,
      currency: item.currency,
      periods: item.periods,
      owner: item.owner,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapForecast(data as Record<string, unknown>)
}

export async function addReserveGoalInSupabase(
  orgId: string,
  item: Omit<FinanceReserveGoal, 'id'>,
): Promise<FinanceReserveGoal | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.reserveGoals)
    .insert({
      organization_id: orgId,
      entity_id: item.entityId,
      type: item.type,
      label: item.label,
      target_amount: Number(item.targetAmount),
      current_amount: Number(item.currentAmount),
      currency: item.currency,
      linked_bank_account_id: item.linkedBankAccountId,
      due_date: item.dueDate,
      owner: item.owner,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapReserveGoal(data as Record<string, unknown>)
}

export async function updateReserveGoalProgressInSupabase(
  orgId: string,
  id: string,
  currentAmount: string,
): Promise<FinanceReserveGoal | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.reserveGoals)
    .update({ current_amount: Number(currentAmount), updated_at: new Date().toISOString() })
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapReserveGoal(data as Record<string, unknown>)
}

export async function setHoldingStaleInSupabase(
  orgId: string,
  id: string,
  stale: boolean,
): Promise<FinanceHolding | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.holdings)
    .update({ stale, updated_at: new Date().toISOString() })
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapHolding(data as Record<string, unknown>)
}

export async function transitionDebtStatusInSupabase(
  orgId: string,
  id: string,
  status: FinanceDebt['status'],
): Promise<FinanceDebt | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.debts)
    .update({ status, updated_at: new Date().toISOString() })
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapDebt(data as Record<string, unknown>)
}

export async function transitionBudgetStatusInSupabase(
  orgId: string,
  id: string,
  status: FinanceBudget['status'],
): Promise<FinanceBudget | null> {
  if (!supabase) return null
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'approved') patch.approved_at = new Date().toISOString()
  const { data, error } = await supabase
    .from(TABLES.budgets)
    .update(patch)
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapBudget(data as Record<string, unknown>)
}

export async function transitionScenarioStatusInSupabase(
  orgId: string,
  id: string,
  status: FinanceScenario['status'],
  reviewer?: string,
): Promise<FinanceScenario | null> {
  if (!supabase) return null
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (reviewer && (status === 'reviewed' || status === 'accepted')) {
    patch.reviewer = reviewer
    patch.reviewed_at = new Date().toISOString()
  }
  const { data, error } = await supabase
    .from(TABLES.scenarios)
    .update(patch)
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapScenario(data as Record<string, unknown>)
}

export async function freezeForecastInSupabase(
  orgId: string,
  id: string,
): Promise<FinanceForecast | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.forecasts)
    .update({ frozen_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('organization_id', orgId)
    .eq('id', id)
    .is('frozen_at', null)
    .select('*')
    .single()
  if (error) throw error
  return mapForecast(data as Record<string, unknown>)
}

export async function updateForecastPeriodsInSupabase(
  orgId: string,
  id: string,
  periods: FinanceForecast['periods'],
): Promise<FinanceForecast | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.forecasts)
    .update({ periods, updated_at: new Date().toISOString() })
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapForecast(data as Record<string, unknown>)
}

export async function addExternalActionInSupabase(
  orgId: string,
  item: Omit<FinanceExternalAction, 'id'>,
): Promise<FinanceExternalAction | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.externalActions)
    .insert({
      organization_id: orgId,
      entity_id: item.entityId,
      record_type: item.recordType,
      record_id: item.recordId,
      status: item.status,
      payload_version: item.payloadVersion,
      idempotency_key: item.idempotencyKey,
      provider_ref: item.providerRef,
      confirmed_at: item.confirmedAt,
      notes: item.notes,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapExternalAction(data as Record<string, unknown>)
}
