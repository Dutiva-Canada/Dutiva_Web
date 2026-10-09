import { supabase as supabaseTyped } from '@/lib/supabaseClient'
import type {
  FinanceBudget,
  FinanceExternalAction,
  FinanceExternalActionStatus,
  FinanceObligationStatus,
  FinanceTaxObligation,
  FinanceTaxScenario,
} from './types'
import {
  mapBudget,
  mapExternalAction,
  mapTaxObligation,
  mapTaxScenario,
} from './supabaseMappers'

/**
 * Supabase persistence for Finance planning tables — budgets, tax
 * obligations, tax scenarios, and the external-action calendar.
 *
 * Split from `supabaseApi.ts` to stay within the 800-line architecture
 * budget (same pattern as `supabaseImports.ts` / `supabaseCreates.ts` /
 * `supabaseEvidence.ts` / `supabaseLifecycle.ts`). These functions are
 * re-exported from `supabaseApi.ts` so callers import from a single module.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase: any = supabaseTyped

const TABLES = {
  budgets: 'finance_budgets',
  scenarios: 'finance_scenarios',
  taxObligations: 'finance_tax_obligations',
  taxScenarios: 'finance_tax_scenarios',
  externalActions: 'finance_external_actions',
} as const

export async function insertTaxObligation(
  orgId: string,
  item: Omit<FinanceTaxObligation, 'id'>,
): Promise<FinanceTaxObligation | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.taxObligations)
    .insert({
      organization_id: orgId,
      entity_id: item.entityId,
      type: item.type,
      jurisdiction: item.jurisdiction,
      period: item.period,
      due_date: item.dueDate,
      payment_due_date: item.paymentDueDate,
      estimated_amount: Number(item.estimatedAmount),
      confirmed_amount: item.confirmedAmount ? Number(item.confirmedAmount) : null,
      currency: item.currency,
      preparer: item.preparer,
      reviewer: item.reviewer,
      status: item.status,
      evidence_refs: item.evidenceRefs,
      filing_ref: item.filingRef,
      notes: item.notes,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapTaxObligation(data as Record<string, unknown>)
}

export async function updateTaxObligationStatus(
  orgId: string,
  id: string,
  status: FinanceObligationStatus,
  reviewer?: string,
): Promise<FinanceTaxObligation | null> {
  if (!supabase) return null
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'reviewed' && reviewer) patch.reviewer = reviewer
  const { data, error } = await supabase
    .from(TABLES.taxObligations)
    .update(patch)
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapTaxObligation(data as Record<string, unknown>)
}

export async function insertBudget(
  orgId: string,
  item: Omit<FinanceBudget, 'id'>,
): Promise<FinanceBudget | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.budgets)
    .insert({
      organization_id: orgId,
      entity_id: item.entityId,
      label: item.label,
      status: item.status,
      currency: item.currency,
      lines: item.lines,
      owner: item.owner,
      approved_at: item.approvedAt,
      version: item.version,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapBudget(data as Record<string, unknown>)
}

export async function reviseBudgetInSupabase(
  orgId: string,
  id: string,
  lines: FinanceBudget['lines'],
): Promise<FinanceBudget | null> {
  if (!supabase) return null
  // Fetch current version
  const { data: current } = await supabase
    .from(TABLES.budgets)
    .select('version')
    .eq('organization_id', orgId)
    .eq('id', id)
    .maybeSingle()
  if (!current) return null
  const { data, error } = await supabase
    .from(TABLES.budgets)
    .update({
      lines,
      version: (current.version as number) + 1,
      status: 'revised',
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  // Mark scenarios stale
  await supabase
    .from(TABLES.scenarios)
    .update({ status: 'stale', updated_at: new Date().toISOString() })
    .eq('organization_id', orgId)
    .in('status', ['accepted', 'reviewed'])
  return mapBudget(data as Record<string, unknown>)
}

export async function insertTaxScenario(
  orgId: string,
  item: Omit<FinanceTaxScenario, 'id'>,
): Promise<FinanceTaxScenario | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.taxScenarios)
    .insert({
      organization_id: orgId,
      entity_id: item.entityId,
      label: item.label,
      baseline: item.baseline,
      proposed_decision: item.proposedDecision,
      projected_profit: Number(item.projectedProfit),
      projected_taxable_income: Number(item.projectedTaxableIncome),
      projected_tax: Number(item.projectedTax),
      projected_cash_flow: Number(item.projectedCashFlow),
      currency: item.currency,
      assumptions: item.assumptions,
      law_version: item.lawVersion,
      enacted: item.enacted,
      reviewer: item.reviewer,
      reviewed_at: item.reviewedAt,
      status: item.status,
      disclaimer: item.disclaimer,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapTaxScenario(data as Record<string, unknown>)
}

export async function markTaxScenarioStaleInSupabase(
  orgId: string,
  id: string,
  reason: string,
): Promise<FinanceTaxScenario | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.taxScenarios)
    .update({
      status: 'stale',
      stale_reason: { en: reason, fr: reason },
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapTaxScenario(data as Record<string, unknown>)
}

export async function transitionTaxScenarioStatusInSupabase(
  orgId: string,
  id: string,
  status: FinanceTaxScenario['status'],
  reviewer?: string,
): Promise<FinanceTaxScenario | null> {
  if (!supabase) return null
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (reviewer && (status === 'reviewed' || status === 'accepted')) {
    patch.reviewer = reviewer
    patch.reviewed_at = new Date().toISOString()
  }
  const { data, error } = await supabase
    .from(TABLES.taxScenarios)
    .update(patch)
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapTaxScenario(data as Record<string, unknown>)
}

export async function updateExternalActionStatus(
  orgId: string,
  id: string,
  status: FinanceExternalActionStatus,
): Promise<FinanceExternalAction | null> {
  if (!supabase) return null
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'settled' || status === 'filing_accepted') {
    patch.confirmed_at = new Date().toISOString()
  }
  const { data, error } = await supabase
    .from(TABLES.externalActions)
    .update(patch)
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapExternalAction(data as Record<string, unknown>)
}
