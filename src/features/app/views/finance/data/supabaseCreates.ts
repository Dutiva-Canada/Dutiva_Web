import { insertCategoryRule } from './supabaseImports'
import {
  DEFAULT_CATEGORY_RULES,
  DEFAULT_ENTITY,
  DEFAULT_LEDGER_ACCOUNTS,
  DEFAULT_BOOK,
} from './defaultCategoryRules'
import { supabase as supabaseTyped } from '@/lib/supabaseClient'
import type {
  FinanceBankAccount,
  FinanceBudget,
  FinanceCashSweep,
  FinanceDebt,
  FinanceDecisionEntry,
  FinanceExternalAction,
  FinanceForecast,
  FinanceHolding,
  FinanceLedgerAccount,
  FinanceLegalEntity,
  FinanceParty,
  FinanceReserveGoal,
  FinanceScenario,
  FinanceSubscription,
  FinanceWatchlistItem,
} from './types'
import {
  mapBankAccount,
  mapBook,
  mapBudget,
  mapDebt,
  mapDeal,
  mapDecisionEntry,
  mapEntity,
  mapExternalAction,
  mapForecast,
  mapHolding,
  mapLedgerAccount,
  mapParty,
  mapReserveGoal,
  mapScenario,
  mapSubscription,
  mapWatchlistItem,
  mapCommitment,
  mapCapitalCall,
  mapCashSweep,
} from './supabaseMappers'

/* eslint-disable @typescript-eslint/no-explicit-any */
const supabase: any = supabaseTyped

const TABLES = {
  entities: 'finance_entities',
  books: 'finance_books',
  budgets: 'finance_budgets',
  scenarios: 'finance_scenarios',
  forecasts: 'finance_forecasts',
  reserveGoals: 'finance_reserve_goals',
  holdings: 'finance_holdings',
  watchlistItems: 'finance_watchlist_items',
  decisionEntries: 'finance_decision_entries',
  deals: 'finance_deals',
  commitments: 'finance_commitments',
  capitalCalls: 'finance_capital_calls',
  cashSweeps: 'finance_cash_sweeps',
  debts: 'finance_debts',
  externalActions: 'finance_external_actions',
  bankAccounts: 'finance_bank_accounts',
  ledgerAccounts: 'finance_ledger_accounts',
  categoryRules: 'finance_category_rules',
  parties: 'finance_parties',
  subscriptions: 'finance_subscriptions',
} as const

/* ---------- Entity management ---------- */

export async function addEntityInSupabase(
  orgId: string,
  item: Omit<FinanceLegalEntity, 'id'>,
): Promise<FinanceLegalEntity | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.entities)
    .insert({
      organization_id: orgId,
      legal_name: item.legalName,
      legal_form: item.legalForm,
      fiscal_year_start: item.fiscalYearStart,
      functional_currency: item.functionalCurrency,
      jurisdictions: item.jurisdictions,
      accounting_source_id: item.accountingSourceId,
      payroll_source_id: item.payrollSourceId,
      parent_entity_id: item.parentEntityId || null,
      ownership_pct: item.ownershipPct ? Number(item.ownershipPct) : null,
      active: item.active,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapEntity(data as Record<string, unknown>)
}

export async function updateEntityInSupabase(
  orgId: string,
  id: string,
  patch: Partial<Omit<FinanceLegalEntity, 'id'>>,
): Promise<FinanceLegalEntity | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.entities)
    .update({
      legal_name: patch.legalName,
      legal_form: patch.legalForm,
      fiscal_year_start: patch.fiscalYearStart,
      functional_currency: patch.functionalCurrency,
      jurisdictions: patch.jurisdictions,
      accounting_source_id: patch.accountingSourceId,
      payroll_source_id: patch.payrollSourceId,
      /* Partial-update contract: absent keys serialize as undefined and are
         dropped from the payload; only write ownership when the caller
         actually passed the fields ('' / undefined-clearing → null). */
      ...(patch.parentEntityId !== undefined
        ? { parent_entity_id: patch.parentEntityId || null }
        : {}),
      ...(patch.ownershipPct !== undefined
        ? { ownership_pct: patch.ownershipPct ? Number(patch.ownershipPct) : null }
        : {}),
      active: patch.active,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapEntity(data as Record<string, unknown>)
}

export async function deleteEntityInSupabase(orgId: string, id: string): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase
    .from(TABLES.entities)
    .delete()
    .eq('organization_id', orgId)
    .eq('id', id)
  if (error) throw error
  return true
}

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

export async function addWatchlistItemInSupabase(
  orgId: string,
  item: Omit<FinanceWatchlistItem, 'id'>,
): Promise<FinanceWatchlistItem | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.watchlistItems)
    .insert({
      organization_id: orgId,
      entity_id: item.entityId,
      symbol: item.symbol || null,
      label: item.label,
      asset_class: item.assetClass,
      thesis: item.thesis ?? null,
      target_low: item.targetLow ? Number(item.targetLow) : null,
      target_high: item.targetHigh ? Number(item.targetHigh) : null,
      currency: item.currency,
      status: item.status,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapWatchlistItem(data as Record<string, unknown>)
}

export async function transitionWatchlistStatusInSupabase(
  orgId: string,
  id: string,
  status: FinanceWatchlistItem['status'],
): Promise<FinanceWatchlistItem | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.watchlistItems)
    .update({ status, updated_at: new Date().toISOString() })
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapWatchlistItem(data as Record<string, unknown>)
}

export async function addDecisionEntryInSupabase(
  orgId: string,
  item: Omit<FinanceDecisionEntry, 'id'>,
): Promise<FinanceDecisionEntry | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.decisionEntries)
    .insert({
      organization_id: orgId,
      entity_id: item.entityId,
      holding_id: item.holdingId ?? null,
      watchlist_item_id: item.watchlistItemId ?? null,
      decision: item.decision,
      decided_at: item.decidedAt,
      summary: item.summary,
      rationale: item.rationale ?? null,
      review_date: item.reviewDate ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapDecisionEntry(data as Record<string, unknown>)
}

export async function updateDecisionOutcomeInSupabase(
  orgId: string,
  id: string,
  outcome: import('@/i18n/core').Bi,
): Promise<FinanceDecisionEntry | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.decisionEntries)
    .update({ outcome, updated_at: new Date().toISOString() })
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapDecisionEntry(data as Record<string, unknown>)
}

/* ---------- Deals pipeline ---------- */

export async function addDealInSupabase(
  orgId: string,
  item: Omit<import('./types').FinanceDeal, 'id'>,
): Promise<import('./types').FinanceDeal | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.deals)
    .insert({
      organization_id: orgId,
      entity_id: item.entityId,
      name: item.name,
      kind: item.kind,
      stage: item.stage,
      counterparty: item.counterparty ?? null,
      value: item.value ? Number(item.value) : null,
      currency: item.currency,
      target_date: item.targetDate ?? null,
      owner: item.owner ?? null,
      notes: item.notes ?? null,
      watchlist_item_id: item.watchlistItemId ?? null,
      holding_id: item.holdingId ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapDeal(data as Record<string, unknown>)
}

export async function updateDealInSupabase(
  orgId: string,
  id: string,
  patch: Partial<Omit<import('./types').FinanceDeal, 'id'>>,
): Promise<import('./types').FinanceDeal | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.deals)
    .update({
      /* Same Partial contract as updateEntityInSupabase — absent keys are
         dropped from the payload, present keys write (or clear). */
      ...(patch.entityId !== undefined ? { entity_id: patch.entityId } : {}),
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.kind !== undefined ? { kind: patch.kind } : {}),
      ...(patch.stage !== undefined ? { stage: patch.stage } : {}),
      ...(patch.counterparty !== undefined ? { counterparty: patch.counterparty || null } : {}),
      ...(patch.value !== undefined ? { value: patch.value ? Number(patch.value) : null } : {}),
      ...(patch.currency !== undefined ? { currency: patch.currency } : {}),
      ...(patch.targetDate !== undefined ? { target_date: patch.targetDate || null } : {}),
      ...(patch.owner !== undefined ? { owner: patch.owner || null } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes ?? null } : {}),
      ...(patch.watchlistItemId !== undefined
        ? { watchlist_item_id: patch.watchlistItemId || null }
        : {}),
      ...(patch.holdingId !== undefined ? { holding_id: patch.holdingId || null } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapDeal(data as Record<string, unknown>)
}

export async function transitionDealStageInSupabase(
  orgId: string,
  id: string,
  stage: import('./types').FinanceDealStage,
): Promise<import('./types').FinanceDeal | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.deals)
    .update({ stage, updated_at: new Date().toISOString() })
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapDeal(data as Record<string, unknown>)
}

export async function removeDealInSupabase(orgId: string, id: string): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase
    .from(TABLES.deals)
    .delete()
    .eq('organization_id', orgId)
    .eq('id', id)
  if (error) throw error
  return true
}

/* ---------- Capital commitments ---------- */

export async function addCommitmentInSupabase(
  orgId: string,
  item: Omit<import('./types').FinanceCommitment, 'id'>,
): Promise<import('./types').FinanceCommitment | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.commitments)
    .insert({
      organization_id: orgId,
      entity_id: item.entityId,
      party_id: item.partyId,
      label: item.label ?? null,
      committed: Number(item.committed || 0),
      called: Number(item.called || 0),
      currency: item.currency,
      next_call_date: item.nextCallDate ?? null,
      status: item.status,
      notes: item.notes ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapCommitment(data as Record<string, unknown>)
}

export async function updateCommitmentInSupabase(
  orgId: string,
  id: string,
  patch: Partial<Omit<import('./types').FinanceCommitment, 'id'>>,
): Promise<import('./types').FinanceCommitment | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.commitments)
    .update({
      /* Same Partial contract as updateDealInSupabase — absent keys drop
         out of the payload, present keys write (or clear). */
      ...(patch.entityId !== undefined ? { entity_id: patch.entityId } : {}),
      ...(patch.partyId !== undefined ? { party_id: patch.partyId } : {}),
      ...(patch.label !== undefined ? { label: patch.label ?? null } : {}),
      ...(patch.committed !== undefined ? { committed: Number(patch.committed || 0) } : {}),
      ...(patch.called !== undefined ? { called: Number(patch.called || 0) } : {}),
      ...(patch.currency !== undefined ? { currency: patch.currency } : {}),
      ...(patch.nextCallDate !== undefined
        ? { next_call_date: patch.nextCallDate || null }
        : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes ?? null } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapCommitment(data as Record<string, unknown>)
}

export async function removeCommitmentInSupabase(
  orgId: string,
  id: string,
): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase
    .from(TABLES.commitments)
    .delete()
    .eq('organization_id', orgId)
    .eq('id', id)
  if (error) throw error
  return true
}

/* ---------- Treasury cash sweeps ---------- */

export async function addCashSweepInSupabase(
  orgId: string,
  item: Omit<FinanceCashSweep, 'id'>,
): Promise<FinanceCashSweep | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.cashSweeps)
    .insert({
      organization_id: orgId,
      entity_id: item.entityId,
      from_account_id: item.fromAccountId,
      to_account_id: item.toAccountId,
      amount: Number(item.amount || 0),
      currency: item.currency,
      status: item.status,
      scheduled_date: item.scheduledDate,
      executed_date: item.executedDate ?? null,
      reference: item.reference ?? null,
      notes: item.notes ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapCashSweep(data as Record<string, unknown>)
}

export async function updateCashSweepInSupabase(
  orgId: string,
  id: string,
  patch: Partial<Omit<FinanceCashSweep, 'id'>>,
): Promise<FinanceCashSweep | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.cashSweeps)
    .update({
      ...(patch.entityId !== undefined ? { entity_id: patch.entityId } : {}),
      ...(patch.fromAccountId !== undefined ? { from_account_id: patch.fromAccountId } : {}),
      ...(patch.toAccountId !== undefined ? { to_account_id: patch.toAccountId } : {}),
      ...(patch.amount !== undefined ? { amount: Number(patch.amount || 0) } : {}),
      ...(patch.currency !== undefined ? { currency: patch.currency } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.scheduledDate !== undefined ? { scheduled_date: patch.scheduledDate } : {}),
      ...(patch.executedDate !== undefined
        ? { executed_date: patch.executedDate || null }
        : {}),
      ...(patch.reference !== undefined ? { reference: patch.reference ?? null } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes ?? null } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapCashSweep(data as Record<string, unknown>)
}

export async function removeCashSweepInSupabase(
  orgId: string,
  id: string,
): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase
    .from(TABLES.cashSweeps)
    .delete()
    .eq('organization_id', orgId)
    .eq('id', id)
  if (error) throw error
  return true
}

export async function transitionCashSweepStatusInSupabase(
  orgId: string,
  id: string,
  status: FinanceCashSweep['status'],
): Promise<FinanceCashSweep | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.cashSweeps)
    .update({
      status,
      ...(status === 'executed' ? { executed_date: new Date().toISOString().slice(0, 10) } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapCashSweep(data as Record<string, unknown>)
}

/* ---------- Capital calls ---------- */

/**
 * Bumps a commitment's `called` ledger by `delta` (can be negative).
 * Reads the row fresh so concurrent-ish edits don't need client state;
 * the `called <= committed` CHECK on finance_commitments makes an
 * over-commitment write fail, which the caller surfaces as an error.
 */
async function bumpCommitmentCalled(
  orgId: string,
  commitmentId: string,
  delta: number,
): Promise<void> {
  const { data: cur, error: readErr } = await supabase
    .from(TABLES.commitments)
    .select('called, committed')
    .eq('organization_id', orgId)
    .eq('id', commitmentId)
    .single()
  if (readErr) throw readErr
  const next = Math.max(0, Math.round((Number(cur.called ?? 0) + delta) * 100) / 100)
  const { error } = await supabase
    .from(TABLES.commitments)
    .update({ called: next, updated_at: new Date().toISOString() })
    .eq('organization_id', orgId)
    .eq('id', commitmentId)
  if (error) throw error
}

export async function addCapitalCallInSupabase(
  orgId: string,
  item: Omit<import('./types').FinanceCapitalCall, 'id'>,
): Promise<import('./types').FinanceCapitalCall | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.capitalCalls)
    .insert({
      organization_id: orgId,
      commitment_id: item.commitmentId,
      amount: Number(item.amount || 0),
      due_date: item.dueDate,
      status: item.status,
      reference: item.reference ?? null,
      received_date: item.receivedDate ?? null,
      notes: item.notes ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  const created = mapCapitalCall(data as Record<string, unknown>)
  if (created.status === 'received') {
    try {
      await bumpCommitmentCalled(orgId, created.commitmentId, Number(created.amount))
    } catch (e) {
      // Roll back the insert so a rejected bump can't leave a phantom
      // received call that never reached the ledger.
      await supabase
        .from(TABLES.capitalCalls)
        .delete()
        .eq('organization_id', orgId)
        .eq('id', created.id)
      throw e
    }
  }
  return created
}

export async function updateCapitalCallInSupabase(
  orgId: string,
  id: string,
  patch: Partial<Omit<import('./types').FinanceCapitalCall, 'id'>>,
): Promise<import('./types').FinanceCapitalCall | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.capitalCalls)
    .update({
      ...(patch.commitmentId !== undefined ? { commitment_id: patch.commitmentId } : {}),
      ...(patch.amount !== undefined ? { amount: Number(patch.amount || 0) } : {}),
      ...(patch.dueDate !== undefined ? { due_date: patch.dueDate } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.reference !== undefined ? { reference: patch.reference || null } : {}),
      ...(patch.receivedDate !== undefined
        ? { received_date: patch.receivedDate || null }
        : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes ?? null } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapCapitalCall(data as Record<string, unknown>)
}

export async function removeCapitalCallInSupabase(
  orgId: string,
  id: string,
): Promise<boolean> {
  if (!supabase) return false
  const { data: cur, error: readErr } = await supabase
    .from(TABLES.capitalCalls)
    .select('commitment_id, amount, status')
    .eq('organization_id', orgId)
    .eq('id', id)
    .single()
  if (readErr) throw readErr
  if (cur.status === 'received') {
    await bumpCommitmentCalled(orgId, cur.commitment_id, -Number(cur.amount))
  }
  const { error } = await supabase
    .from(TABLES.capitalCalls)
    .delete()
    .eq('organization_id', orgId)
    .eq('id', id)
  if (error) throw error
  return true
}

/**
 * Lifecycle transition for a call. Moving into `received` bumps the
 * parent commitment's `called`; moving back out decrements it. The bump
 * runs first so a CHECK violation on `called <= committed` aborts the
 * transition rather than recording money the ledger can't hold.
 */
export async function transitionCapitalCallStatusInSupabase(
  orgId: string,
  id: string,
  nextStatus: import('./types').FinanceCapitalCallStatus,
): Promise<import('./types').FinanceCapitalCall | null> {
  if (!supabase) return null
  const { data: cur, error: readErr } = await supabase
    .from(TABLES.capitalCalls)
    .select('commitment_id, amount, status')
    .eq('organization_id', orgId)
    .eq('id', id)
    .single()
  if (readErr) throw readErr
  const wasReceived = cur.status === 'received'
  const willBeReceived = nextStatus === 'received'
  if (wasReceived === willBeReceived) {
    return updateCapitalCallInSupabase(orgId, id, { status: nextStatus })
  }
  await bumpCommitmentCalled(
    orgId,
    cur.commitment_id,
    willBeReceived ? Number(cur.amount) : -Number(cur.amount),
  )
  return updateCapitalCallInSupabase(orgId, id, {
    status: nextStatus,
    receivedDate: willBeReceived ? new Date().toISOString().slice(0, 10) : '',
  })
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

export async function addBankAccountInSupabase(
  orgId: string,
  item: Omit<FinanceBankAccount, 'id'>,
): Promise<FinanceBankAccount | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.bankAccounts)
    .insert({
      organization_id: orgId,
      entity_id: item.entityId,
      label: item.label,
      currency: item.currency,
      last4: item.last4,
      restricted: item.restricted,
      earmarked_amount: item.earmarkedAmount ? Number(item.earmarkedAmount) : null,
      maturity_date: item.maturityDate,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapBankAccount(data as Record<string, unknown>)
}

export async function addLedgerAccountInSupabase(
  orgId: string,
  item: Omit<FinanceLedgerAccount, 'id'>,
): Promise<FinanceLedgerAccount | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.ledgerAccounts)
    .insert({
      organization_id: orgId,
      book_id: item.bookId,
      code: item.code,
      name: item.name,
      type: item.type,
      sensitive: item.sensitive,
      active: item.active,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapLedgerAccount(data as Record<string, unknown>)
}

export async function addPartyInSupabase(
  orgId: string,
  item: Omit<FinanceParty, 'id'>,
): Promise<FinanceParty | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.parties)
    .insert({
      organization_id: orgId,
      entity_id: item.entityId,
      name: item.name,
      type: item.type,
      external_id: item.externalId,
      banking_details_on_file: item.bankingDetailsOnFile,
      contact_name: item.contactName ?? null,
      contact_email: item.contactEmail ?? null,
      contact_phone: item.contactPhone ?? null,
      active: item.active,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapParty(data as Record<string, unknown>)
}

export async function addSubscriptionInSupabase(
  orgId: string,
  item: Omit<FinanceSubscription, 'id'>,
): Promise<FinanceSubscription | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.subscriptions)
    .insert({
      organization_id: orgId,
      entity_id: item.entityId,
      label: item.label,
      supplier_id: item.supplierId,
      cost: Number(item.cost),
      currency: item.currency,
      renewal_term: item.renewalTerm,
      next_renewal_date: item.nextRenewalDate,
      notice_date: item.noticeDate,
      owner: item.owner,
      active: item.active,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapSubscription(data as Record<string, unknown>)
}

export async function seedDefaultCategoryRulesInSupabase(orgId: string): Promise<number> {
  if (!supabase) return 0

  let { data: entityRows, error: entityError } = await supabase
    .from(TABLES.entities)
    .select('*')
    .eq('organization_id', orgId)
    .limit(1)
  if (entityError) throw entityError
  let entity = entityRows?.[0] ? mapEntity(entityRows[0] as Record<string, unknown>) : null

  if (!entity) {
    const created = await addEntityInSupabase(orgId, DEFAULT_ENTITY)
    if (!created) return 0
    entity = created
  }

  let { data: bookRows, error: bookError } = await supabase
    .from(TABLES.books)
    .select('*')
    .eq('organization_id', orgId)
    .limit(1)
  if (bookError) throw bookError
  let book = bookRows?.[0] ? mapBook(bookRows[0] as Record<string, unknown>) : null

  if (!book) {
    const { data, error } = await supabase
      .from(TABLES.books)
      .insert({
        organization_id: orgId,
        entity_id: entity.id,
        label: DEFAULT_BOOK.label,
        basis: DEFAULT_BOOK.basis,
        authoritative_source: DEFAULT_BOOK.authoritativeSource,
        last_synced_at: DEFAULT_BOOK.lastSyncedAt,
      })
      .select('*')
      .single()
    if (error) throw error
    book = mapBook(data as Record<string, unknown>)
  }

  const { data: ledgerRows, error: ledgerError } = await supabase
    .from(TABLES.ledgerAccounts)
    .select('*')
    .eq('organization_id', orgId)
  if (ledgerError) throw ledgerError
  const existingAccounts: FinanceLedgerAccount[] = (ledgerRows ?? []).map(
    (r: Record<string, unknown>) => mapLedgerAccount(r),
  )
  const accountsByCode = new Map(
    existingAccounts.map((la) => [la.code, la] as [string, FinanceLedgerAccount]),
  )

  for (const defaultAccount of DEFAULT_LEDGER_ACCOUNTS) {
    if (accountsByCode.has(defaultAccount.code)) continue
    const created = await addLedgerAccountInSupabase(orgId, {
      bookId: book.id,
      code: defaultAccount.code,
      name: defaultAccount.name,
      type: defaultAccount.type,
      sensitive: defaultAccount.sensitive ?? false,
      active: true,
    })
    if (created) accountsByCode.set(created.code, created)
  }

  const { data: ruleRows, error: ruleError } = await supabase
    .from(TABLES.categoryRules)
    .select('*')
    .eq('organization_id', orgId)
    .eq('entity_id', entity.id)
  if (ruleError) throw ruleError
  const existingPatterns = new Set(
    (ruleRows ?? []).map((r: Record<string, unknown>) => (r.pattern as string).toUpperCase()),
  )

  let addedRules = 0
  for (const defaultRule of DEFAULT_CATEGORY_RULES) {
    if (existingPatterns.has(defaultRule.pattern.toUpperCase())) continue
    const account = accountsByCode.get(defaultRule.ledgerAccountCode)
    if (!account) continue
    const created = await insertCategoryRule(orgId, {
      entityId: entity.id,
      pattern: defaultRule.pattern,
      matchType: defaultRule.matchType,
      ledgerAccountId: account.id,
      direction: defaultRule.direction,
      priority: defaultRule.priority,
      active: true,
    })
    if (created) {
      existingPatterns.add(defaultRule.pattern.toUpperCase())
      addedRules++
    }
  }

  return addedRules
}
