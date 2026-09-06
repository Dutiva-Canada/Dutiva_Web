import { supabase as supabaseTyped } from '@/lib/supabaseClient'
import type {
  FinanceBankItem,
  FinanceCategoryRule,
  FinanceCurrency,
  FinanceImportRowError,
  FinanceImportSession,
} from './types'
import {
  mapBankAccount,
  mapBankItem,
  mapCategoryRule,
  mapImportSession,
  mapLedgerAccount,
} from './supabaseMappers'
import { parseStatementCSV, rowsToBankItems } from './statementParser'
import { autoCategorize, applySuggestions } from './autoCategorize'

/**
 * Supabase persistence for Finance import, categorization, and export.
 * Extends `supabaseApi.ts` with functions that write to the
 * `finance_category_rules` and `finance_import_sessions` tables from
 * migration 0120, plus the bank statement import and auto-categorize
 * workflows that span `finance_bank_items` and those new tables.
 *
 * Split from `supabaseApi.ts` to stay within the 800-line architecture
 * budget. These functions are re-exported from `supabaseApi.ts` so callers
 * import from a single module.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase: any = supabaseTyped

const TABLES = {
  bankItems: 'finance_bank_items',
  bankAccounts: 'finance_bank_accounts',
  ledgerAccounts: 'finance_ledger_accounts',
  categoryRules: 'finance_category_rules',
  importSessions: 'finance_import_sessions',
} as const

/* ---------- Category rules ---------- */

export async function insertCategoryRule(
  orgId: string,
  rule: Omit<FinanceCategoryRule, 'id'>,
): Promise<FinanceCategoryRule | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.categoryRules)
    .insert({
      organization_id: orgId,
      entity_id: rule.entityId,
      pattern: rule.pattern,
      match_type: rule.matchType,
      ledger_account_id: rule.ledgerAccountId,
      direction: rule.direction,
      priority: rule.priority,
      active: rule.active,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapCategoryRule(data as Record<string, unknown>)
}

export async function updateCategoryRuleInSupabase(
  orgId: string,
  id: string,
  patch: Partial<FinanceCategoryRule>,
): Promise<FinanceCategoryRule | null> {
  if (!supabase) return null
  const update: Record<string, unknown> = {}
  if (patch.pattern !== undefined) update.pattern = patch.pattern
  if (patch.matchType !== undefined) update.match_type = patch.matchType
  if (patch.ledgerAccountId !== undefined) update.ledger_account_id = patch.ledgerAccountId
  if (patch.direction !== undefined) update.direction = patch.direction
  if (patch.priority !== undefined) update.priority = patch.priority
  if (patch.active !== undefined) update.active = patch.active
  const { data, error } = await supabase
    .from(TABLES.categoryRules)
    .update(update)
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapCategoryRule(data as Record<string, unknown>)
}

export async function deleteCategoryRuleFromSupabase(
  orgId: string,
  id: string,
): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase
    .from(TABLES.categoryRules)
    .delete()
    .eq('organization_id', orgId)
    .eq('id', id)
  if (error) throw error
  return true
}

/* ---------- Import sessions ---------- */

export async function insertImportSession(
  orgId: string,
  session: Omit<FinanceImportSession, 'id'>,
): Promise<FinanceImportSession | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.importSessions)
    .insert({
      organization_id: orgId,
      entity_id: session.entityId,
      bank_account_id: session.bankAccountId,
      file_name: session.fileName,
      imported_at: session.importedAt,
      total_rows: session.totalRows,
      new_items: session.newItems,
      duplicates: session.duplicates,
      errors: session.errors,
      status: session.status,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapImportSession(data as Record<string, unknown>)
}

/* ---------- Bank statement import ---------- */

export async function importBankStatementInSupabase(
  orgId: string,
  bankAccountId: string,
  fileName: string,
  fileContent: string,
): Promise<{ newItems: number; duplicates: number; errors: number; errorDetails: FinanceImportRowError[] } | null> {
  if (!supabase) return null

  // Fetch existing bank items for this account to deduplicate against
  const { data: existingRows, error: fetchError } = await supabase
    .from(TABLES.bankItems)
    .select('*')
    .eq('organization_id', orgId)
    .eq('bank_account_id', bankAccountId)
  if (fetchError) throw fetchError
  const existingItems = (existingRows ?? []).map((r: Record<string, unknown>) =>
    mapBankItem(r),
  )

  // Fetch the bank account to get its currency
  const { data: bankAccountRow, error: bankError } = await supabase
    .from(TABLES.bankAccounts)
    .select('*')
    .eq('organization_id', orgId)
    .eq('id', bankAccountId)
    .single()
  if (bankError) throw bankError
  const bankAccount = mapBankAccount(bankAccountRow as Record<string, unknown>)
  const currency: FinanceCurrency = bankAccount.currency

  // Parse the CSV
  const parsed = parseStatementCSV(fileContent, currency)
  const { newItems, duplicates, errors } = rowsToBankItems(
    parsed.rows,
    bankAccountId,
    currency,
    existingItems,
  )
  const errorDetails = parsed.errorDetails

  if (newItems.length === 0) {
    // Still record the import session even if all rows were duplicates
    await insertImportSession(orgId, {
      entityId: bankAccount.entityId,
      bankAccountId,
      fileName,
      importedAt: new Date().toISOString(),
      totalRows: parsed.totalRows,
      newItems: 0,
      duplicates,
      errors,
      status: 'imported',
    })
    return { newItems: 0, duplicates, errors, errorDetails }
  }

  // Insert new bank items in batches of 100
  const rowsToInsert = newItems.map((bi) => ({
    organization_id: orgId,
    bank_account_id: bi.bankAccountId,
    date: bi.date,
    amount: Number(bi.amount),
    currency: bi.currency,
    description: bi.description,
    match_status: bi.matchStatus,
  }))

  for (let i = 0; i < rowsToInsert.length; i += 100) {
    const batch = rowsToInsert.slice(i, i + 100)
    const { error: insertError } = await supabase
      .from(TABLES.bankItems)
      .insert(batch)
    if (insertError) throw insertError
  }

  // Record the import session
  await insertImportSession(orgId, {
    entityId: bankAccount.entityId,
    bankAccountId,
    fileName,
    importedAt: new Date().toISOString(),
    totalRows: parsed.totalRows,
    newItems: newItems.length,
    duplicates,
    errors,
    status: 'imported',
  })

  return { newItems: newItems.length, duplicates, errors, errorDetails }
}

/* ---------- Auto-categorize ---------- */

export async function runAutoCategorizeInSupabase(orgId: string): Promise<number> {
  if (!supabase) return 0

  // Fetch unmatched bank items
  const { data: unmatchedRows, error: fetchError } = await supabase
    .from(TABLES.bankItems)
    .select('*')
    .eq('organization_id', orgId)
    .eq('match_status', 'unmatched')
  if (fetchError) throw fetchError
  const unmatchedItems: FinanceBankItem[] = (unmatchedRows ?? []).map((r: Record<string, unknown>) =>
    mapBankItem(r),
  )
  if (unmatchedItems.length === 0) return 0

  // Fetch category rules and ledger accounts
  const [{ data: ruleRows }, { data: ledgerRows }] = await Promise.all([
    supabase.from(TABLES.categoryRules).select('*').eq('organization_id', orgId),
    supabase.from(TABLES.ledgerAccounts).select('*').eq('organization_id', orgId),
  ])
  const rules = (ruleRows ?? []).map((r: Record<string, unknown>) => mapCategoryRule(r))
  const ledgerAccounts = (ledgerRows ?? []).map((r: Record<string, unknown>) => mapLedgerAccount(r))

  // Run categorization
  const suggestions = autoCategorize(unmatchedItems, rules, ledgerAccounts)
  const updated = applySuggestions(unmatchedItems, suggestions)
  const suggestionMap = new Map(suggestions.map((s) => [s.bankItemId, s]))

  // Update matched items to 'suggested' status
  let matchedCount = 0
  for (const bi of updated) {
    const sug = suggestionMap.get(bi.id)
    if (!sug || sug.confidence === 'none') continue
    const { error: updateError } = await supabase
      .from(TABLES.bankItems)
      .update({ match_status: 'suggested', updated_at: new Date().toISOString() })
      .eq('organization_id', orgId)
      .eq('id', bi.id)
    if (updateError) throw updateError
    matchedCount++
  }

  return matchedCount
}
