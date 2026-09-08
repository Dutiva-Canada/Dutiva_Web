import type { Bi } from '@/i18n/core'
import { analyzeImportWithAi, generateCorrectionNote } from './aiImportAnalyzer'
import type { AiCategorizationResult } from './aiImportAnalyzer'
import { directionForAccount } from './aiEmbeddings'
import { loadFinanceState, updateState } from './productionApi'
import type {
  FinanceAiImportSettings,
  FinanceBankItem,
  FinanceBankMatchStatus,
  FinanceCategorizationFeedback,
} from './types'

export interface AiImportAnalysisSummary {
  itemsAnalysed: number
  itemsMatched: number
  itemsSuggested: number
  rulesAdded: number
}

export function analyseImportWithAiLocal(
  orgId: string,
  sessionId: string,
): Promise<AiImportAnalysisSummary | null> {
  const state = loadFinanceState(orgId)

  if (!state.aiImportSettings.aiImportEnabled) {
    return Promise.resolve(null)
  }

  const session = state.importSessions.find((s) => s.id === sessionId)
  if (!session) return Promise.resolve(null)

  const newItems = state.bankItems.filter(
    (bi) => bi.importSessionId === sessionId && bi.matchStatus === 'unmatched',
  )
  if (newItems.length === 0) return Promise.resolve(null)

  return analyzeImportWithAi(
    newItems,
    state.ledgerAccounts,
    state.categoryRules,
    state.categorizationFeedback,
    state.aiImportSettings.aiImportMode,
  )
    .then((result) => {
      const existingPatterns = new Set(state.categoryRules.map((r) => r.pattern.toLowerCase()))
      const entityId = state.entities[0]?.id ?? orgId
      const nextRules = [...state.categoryRules]
      for (const s of result.ruleSuggestions) {
        if (existingPatterns.has(s.pattern.toLowerCase())) continue
        existingPatterns.add(s.pattern.toLowerCase())
        nextRules.push({
          id: `cat-rule-${Date.now()}-${nextRules.length}`,
          entityId,
          pattern: s.pattern,
          matchType: s.matchType,
          ledgerAccountId: s.ledgerAccountId,
          direction: s.direction,
          priority: s.priority,
          active: true,
        })
      }

      const updatedItems = applyCategorizations(newItems, result.categorizations)

      const rulesAdded = nextRules.length - state.categoryRules.length
      const itemsMatched = result.categorizations.filter((c: AiCategorizationResult) => c.matchStatus === 'matched').length
      const itemsSuggested = result.categorizations.filter((c: AiCategorizationResult) => c.matchStatus === 'suggested').length

      updateState(orgId, (prev) => ({
        ...prev,
        categoryRules: nextRules,
        bankItems: prev.bankItems.map((bi) => {
          const updated = updatedItems.find((u) => u.id === bi.id)
          return updated ?? bi
        }),
      }))

      return {
        itemsAnalysed: result.categorizations.length,
        itemsMatched,
        itemsSuggested,
        rulesAdded,
      }
    })
    .catch(() => {
      return null
    })
}

function applyCategorizations(
  newItems: FinanceBankItem[],
  categorizations: AiCategorizationResult[],
): FinanceBankItem[] {
  return newItems.map((bi) => {
    const cat = categorizations.find((c: AiCategorizationResult) => c.bankItemId === bi.id)
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

export function updateBankItemCategorizationLocal(
  orgId: string,
  id: string,
  patch: {
    ledgerAccountId?: string
    direction?: 'debit' | 'credit'
    note?: Bi
    matchStatus?: FinanceBankMatchStatus
  },
): FinanceBankItem | null {
  let updated: FinanceBankItem | null = null
  updateState(orgId, (state) => ({
    ...state,
    bankItems: state.bankItems.map((bi) => {
      if (bi.id !== id) return bi
      const nextMatchStatus = patch.matchStatus ?? bi.matchStatus
      const account = patch.ledgerAccountId
        ? state.ledgerAccounts.find((la) => la.id === patch.ledgerAccountId)
        : undefined
      let nextNote = patch.note ?? bi.note
      if (!nextNote && account) {
        nextNote = generateCorrectionNote(account, 'manual')
      }
      const nextAiSuggestion: FinanceBankItem['aiSuggestion'] = account
        ? {
            ledgerAccountId: account.id,
            direction: patch.direction ?? directionForAccount(account),
            confidence: 'high',
            reasonKey: 'manual',
            note: nextNote ?? { en: '', fr: '' },
          }
        : undefined
      updated = {
        ...bi,
        aiSuggestion: nextAiSuggestion,
        matchStatus: nextMatchStatus,
        note: nextNote,
      }
      return updated
    }),
  }))
  return updated
}

export function recordCategorizationFeedbackLocal(
  orgId: string,
  item: Omit<FinanceCategorizationFeedback, 'id' | 'correctedAt'>,
): FinanceCategorizationFeedback | null {
  const feedback: FinanceCategorizationFeedback = {
    ...item,
    id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    correctedAt: new Date().toISOString(),
  }
  updateState(orgId, (state) => ({
    ...state,
    categorizationFeedback: [feedback, ...state.categorizationFeedback],
  }))
  return feedback
}

export function getAiImportSettingsLocal(orgId: string): FinanceAiImportSettings {
  return loadFinanceState(orgId).aiImportSettings
}

export function updateAiImportSettingsLocal(
  orgId: string,
  patch: Partial<FinanceAiImportSettings>,
): FinanceAiImportSettings {
  let next: FinanceAiImportSettings | undefined
  updateState(orgId, (state) => {
    next = { ...state.aiImportSettings, ...patch }
    return { ...state, aiImportSettings: next }
  })
  return next!
}
