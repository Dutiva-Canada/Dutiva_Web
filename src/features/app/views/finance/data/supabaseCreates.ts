import { insertCategoryRule } from './supabaseImports'
import { DEFAULT_CATEGORY_RULES, DEFAULT_LEDGER_ACCOUNTS } from './defaultCategoryRules'
import { supabase as supabaseTyped } from '@/lib/supabaseClient'
import type {
  FinanceBankAccount,
  FinanceBudget,
  FinanceDebt,
  FinanceExternalAction,
  FinanceForecast,
  FinanceHolding,
  FinanceLedgerAccount,
  FinanceLegalEntity,
  FinanceParty,
  FinanceReserveGoal,
  FinanceScenario,
  FinanceSubscription,
} from './types'
import {
  mapBankAccount,
  mapBook,
  mapBudget,
  mapDebt,
  mapEntity,
  mapExternalAction,
  mapForecast,
  mapHolding,
  mapLedgerAccount,
  mapParty,
  mapReserveGoal,
  mapScenario,
  mapSubscription,
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
  debts: 'finance_debts',
  externalActions: 'finance_external_actions',
  bankAccounts: 'finance_bank_accounts',
  ledgerAccounts: 'finance_ledger_accounts',
  categoryRules: 'finance_category_rules',
  parties: 'finance_parties',
  subscriptions: 'finance_subscriptions',
} as const

/* ---------- Entity management ---------- */

export async function addEntityInSupabase(orgId: string, item: Omit<FinanceLegalEntity, 'id'>): Promise<FinanceLegalEntity | null> {
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
  const { error } = await supabase.from(TABLES.entities).delete().eq('organization_id', orgId).eq('id', id)
  if (error) throw error
  return true
}

/* ---------- Scenario / forecast / reserve / holding / debt lifecycle ---------- */

export async function addScenarioInSupabase(orgId: string, item: Omit<FinanceScenario, 'id'>): Promise<FinanceScenario | null> {
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

export async function addForecastInSupabase(orgId: string, item: Omit<FinanceForecast, 'id'>): Promise<FinanceForecast | null> {
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

export async function addReserveGoalInSupabase(orgId: string, item: Omit<FinanceReserveGoal, 'id'>): Promise<FinanceReserveGoal | null> {
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

export async function updateReserveGoalProgressInSupabase(orgId: string, id: string, currentAmount: string): Promise<FinanceReserveGoal | null> {
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

export async function setHoldingStaleInSupabase(orgId: string, id: string, stale: boolean): Promise<FinanceHolding | null> {
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

export async function transitionDebtStatusInSupabase(orgId: string, id: string, status: FinanceDebt['status']): Promise<FinanceDebt | null> {
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

export async function transitionBudgetStatusInSupabase(orgId: string, id: string, status: FinanceBudget['status']): Promise<FinanceBudget | null> {
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

export async function transitionScenarioStatusInSupabase(orgId: string, id: string, status: FinanceScenario['status'], reviewer?: string): Promise<FinanceScenario | null> {
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

export async function freezeForecastInSupabase(orgId: string, id: string): Promise<FinanceForecast | null> {
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

export async function updateForecastPeriodsInSupabase(orgId: string, id: string, periods: FinanceForecast['periods']): Promise<FinanceForecast | null> {
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

export async function addExternalActionInSupabase(orgId: string, item: Omit<FinanceExternalAction, 'id'>): Promise<FinanceExternalAction | null> {
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

export async function addBankAccountInSupabase(orgId: string, item: Omit<FinanceBankAccount, 'id'>): Promise<FinanceBankAccount | null> {
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

export async function addLedgerAccountInSupabase(orgId: string, item: Omit<FinanceLedgerAccount, 'id'>): Promise<FinanceLedgerAccount | null> {
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

export async function addPartyInSupabase(orgId: string, item: Omit<FinanceParty, 'id'>): Promise<FinanceParty | null> {
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
      active: item.active,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapParty(data as Record<string, unknown>)
}

export async function addSubscriptionInSupabase(orgId: string, item: Omit<FinanceSubscription, 'id'>): Promise<FinanceSubscription | null> {
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

  const { data: entityRows, error: entityError } = await supabase
    .from(TABLES.entities)
    .select('*')
    .eq('organization_id', orgId)
    .limit(1)
  if (entityError) throw entityError
  const entity = entityRows?.[0] ? mapEntity(entityRows[0] as Record<string, unknown>) : null

  const { data: bookRows, error: bookError } = await supabase
    .from(TABLES.books)
    .select('*')
    .eq('organization_id', orgId)
    .limit(1)
  if (bookError) throw bookError
  const book = bookRows?.[0] ? mapBook(bookRows[0] as Record<string, unknown>) : null

  if (!entity || !book) return 0

  const { data: ledgerRows, error: ledgerError } = await supabase
    .from(TABLES.ledgerAccounts)
    .select('*')
    .eq('organization_id', orgId)
  if (ledgerError) throw ledgerError
  const existingAccounts: FinanceLedgerAccount[] = (ledgerRows ?? []).map((r: Record<string, unknown>) => mapLedgerAccount(r))
  const accountsByCode = new Map(existingAccounts.map((la) => [la.code, la] as [string, FinanceLedgerAccount]))

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
