import { supabase as supabaseTyped } from '@/lib/supabaseClient'
import type { Bi } from '@/i18n/core'
import { analyzeImportWithAi } from './aiImportAnalyzer'
import type { AiCategorizationResult } from './aiImportAnalyzer'
import { insertCategoryRule, loadFinanceStateFromSupabase } from './supabaseApi'
import {
  mapAiImportSettings,
  mapBankItem,
  mapCategorizationFeedback,
} from './supabaseMappers'
import type {
  FinanceAiImportSettings,
  FinanceBankItem,
  FinanceBankMatchStatus,
  FinanceCategorizationFeedback,
} from './types'

// Generic client — finance tables exist in the database but not in generated types yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase: any = supabaseTyped

const TABLES = {
  bankItems: 'finance_bank_items',
  categoryRules: 'finance_category_rules',
  feedback: 'finance_categorization_feedback',
  settings: 'finance_workspace_settings',
} as const

export interface AiImportAnalysisSummary {
  itemsAnalysed: number
  itemsMatched: number
  itemsSuggested: number
  rulesAdded: number
}

export async function analyseImportWithAiSupa(
  orgId: string,
  sessionId: string,
): Promise<AiImportAnalysisSummary | null> {
  if (!supabase) return null
  const state = await loadFinanceStateFromSupabase(orgId)

  if (!state.aiImportSettings.aiImportEnabled) return null

  const newItems = state.bankItems.filter(
    (bi) => bi.importSessionId === sessionId && bi.matchStatus === 'unmatched',
  )
  if (newItems.length === 0) return null

  try {
    const result = await analyzeImportWithAi(
      newItems,
      state.ledgerAccounts,
      state.categoryRules,
      state.categorizationFeedback,
      state.aiImportSettings.aiImportMode,
    )

    let rulesAdded = 0
    for (const rule of result.ruleSuggestions) {
      const created = await insertCategoryRule(orgId, {
        entityId: state.entities[0]?.id ?? orgId,
        pattern: rule.pattern,
        matchType: rule.matchType,
        ledgerAccountId: rule.ledgerAccountId,
        direction: rule.direction,
        priority: rule.priority,
        active: true,
      })
      if (created) rulesAdded++
    }

    const updates = applyCategorizations(newItems, result.categorizations)
    for (const u of updates) {
      await updateBankItemCategorizationSupa(orgId, u.id, {
        ledgerAccountId: u.aiSuggestion?.ledgerAccountId,
        direction: u.aiSuggestion?.direction,
        note: u.note,
        matchStatus: u.matchStatus,
      })
    }

    const itemsMatched = result.categorizations.filter((c) => c.matchStatus === 'matched').length
    const itemsSuggested = result.categorizations.filter((c) => c.matchStatus === 'suggested').length
    return {
      itemsAnalysed: result.categorizations.length,
      itemsMatched,
      itemsSuggested,
      rulesAdded,
    }
  } catch (err) {
    console.error('[finance] AI import analysis (supabase) failed:', err)
    return null
  }
}

function applyCategorizations(
  newItems: FinanceBankItem[],
  categorizations: AiCategorizationResult[],
): FinanceBankItem[] {
  return newItems.map((bi) => {
    const cat = categorizations.find((c) => c.bankItemId === bi.id)
    if (!cat) return bi
    return {
      ...bi,
      matchStatus: cat.matchStatus,
      aiSuggestion: {
        ledgerAccountId: cat.ledgerAccountId,
        direction: cat.direction,
        confidence: cat.confidence,
        reasonKey: cat.reasonKey,
        note: cat.note,
      },
      note: cat.note,
    }
  })
}

export async function updateBankItemCategorizationSupa(
  orgId: string,
  id: string,
  patch: {
    ledgerAccountId?: string
    direction?: 'debit' | 'credit'
    note?: Bi
    matchStatus?: FinanceBankMatchStatus
  },
): Promise<FinanceBankItem | null> {
  if (!supabase) return null
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.ledgerAccountId || patch.direction || patch.note) {
    const { data: existing } = await supabase
      .from(TABLES.bankItems)
      .select('ai_suggestion')
      .eq('organization_id', orgId)
      .eq('id', id)
      .single()
    const currentAi = (existing?.ai_suggestion as Record<string, unknown> | undefined) ?? {}
    const nextAi = {
      ...currentAi,
      ...(patch.ledgerAccountId ? { ledger_account_id: patch.ledgerAccountId } : {}),
      ...(patch.direction ? { direction: patch.direction } : {}),
      ...(patch.note ? { note: patch.note } : {}),
    }
    update.ai_suggestion = nextAi
    if (patch.note) update.note = patch.note
  }
  if (patch.matchStatus) update.match_status = patch.matchStatus

  const { data, error } = await supabase
    .from(TABLES.bankItems)
    .update(update)
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) {
    console.error('[finance] updateBankItemCategorizationSupa error:', error)
    throw error
  }
  return mapBankItem(data as Record<string, unknown>)
}

export async function recordCategorizationFeedbackSupa(
  orgId: string,
  item: Omit<FinanceCategorizationFeedback, 'id' | 'correctedAt'>,
): Promise<FinanceCategorizationFeedback | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.feedback)
    .insert({
      organization_id: orgId,
      entity_id: item.entityId,
      description: item.description,
      original_ledger_account_id: item.originalLedgerAccountId,
      corrected_ledger_account_id: item.correctedLedgerAccountId,
      corrected_direction: item.correctedDirection,
      corrected_note: item.correctedNote,
      corrected_at: new Date().toISOString(),
    })
    .select('*')
    .single()
  if (error) {
    console.error('[finance] recordCategorizationFeedbackSupa error:', error)
    throw error
  }
  return mapCategorizationFeedback(data as Record<string, unknown>)
}

export async function getAiImportSettingsSupa(orgId: string): Promise<FinanceAiImportSettings> {
  if (!supabase) return { aiImportEnabled: false, aiImportMode: 'auto_high' }
  const { data, error } = await supabase
    .from(TABLES.settings)
    .select('*')
    .eq('organization_id', orgId)
    .maybeSingle()
  if (error || !data) {
    if (error) console.error('[finance] getAiImportSettingsSupa error:', error)
    return { aiImportEnabled: false, aiImportMode: 'auto_high' }
  }
  return mapAiImportSettings(data as Record<string, unknown>)
}

export async function updateAiImportSettingsSupa(
  orgId: string,
  patch: Partial<FinanceAiImportSettings>,
): Promise<FinanceAiImportSettings> {
  if (!supabase) return { aiImportEnabled: false, aiImportMode: 'auto_high' }
  const existing = await getAiImportSettingsSupa(orgId)
  const next = { ...existing, ...patch }
  const { data, error } = await supabase
    .from(TABLES.settings)
    .upsert(
      {
        organization_id: orgId,
        ai_import_enabled: next.aiImportEnabled,
        ai_import_mode: next.aiImportMode,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id' },
    )
    .select('*')
    .single()
  if (error) {
    console.error('[finance] updateAiImportSettingsSupa error:', error)
    throw error
  }
  return mapAiImportSettings(data as Record<string, unknown>)
}
