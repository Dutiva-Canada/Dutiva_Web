import { useMemo, useRef, useState } from 'react'
import { useI18n } from '@/i18n/context'
import { financeMessages as M } from '@/i18n/messages/finance'
import { buildExportBundles, downloadFile } from '../data/importExport'
import { statementFileToCsv } from '../data/statementParser'
import { suggestCategoryRules, type RuleSuggestion } from '../data/ruleSuggestion'
import type {
  FinanceImportRowError,
  FinanceImportSession,
} from '../data/types'
import type { FinanceDataContextValue } from '../data/FinanceDataContext'

interface UseImportExportActionsArgs {
  finance: Pick<
    FinanceDataContextValue,
    | 'state'
    | 'canWrite'
    | 'importBankStatement'
    | 'deleteImportSession'
    | 'addCategoryRule'
    | 'updateCategoryRule'
    | 'removeCategoryRule'
    | 'seedDefaultCategoryRules'
    | 'runAutoCategorize'
    | 'updateAiImportSettings'
  >
}

export function useImportExportActions({ finance }: UseImportExportActionsArgs) {
  const { x } = useI18n()
  const {
    state,
    canWrite,
    importBankStatement,
    deleteImportSession,
    addCategoryRule,
    seedDefaultCategoryRules,
    runAutoCategorize,
  } = finance

  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [selectedFileName, setSelectedFileName] = useState('')
  const [fileContent, setFileContent] = useState('')
  const [importResult, setImportResult] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importErrorDetails, setImportErrorDetails] = useState<FinanceImportRowError[]>([])
  const [showErrorDetails, setShowErrorDetails] = useState(false)
  const [categorizeResult, setCategorizeResult] = useState<string | null>(null)
  const [seedRulesResult, setSeedRulesResult] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<RuleSuggestion[]>([])
  const [suggesting, setSuggesting] = useState(false)
  const [suggestResult, setSuggestResult] = useState<string | null>(null)
  const [useAiSuggestions, setUseAiSuggestions] = useState(false)
  const [showRuleForm, setShowRuleForm] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [aiImportResult, setAiImportResult] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const unmatchedCount = useMemo(
    () => state.bankItems.filter((bi) => bi.matchStatus === 'unmatched').length,
    [state.bankItems],
  )
  const hasRules = state.categoryRules.length > 0

  const CONFIDENCE_MESSAGES = {
    high: M.finance_suggest_rules_confidence_high,
    medium: M.finance_suggest_rules_confidence_medium,
    low: M.finance_suggest_rules_confidence_low,
  } as const

  const formatError = (err: unknown): string => {
    if (err instanceof Error) return err.message
    if (err && typeof err === 'object') {
      const msg = (err as { message?: string; error?: string; error_description?: string }).message
      if (msg) return msg
      const desc = (err as { error_description?: string }).error_description
      if (desc) return desc
      try {
        return JSON.stringify(err)
      } catch {
        return String(err)
      }
    }
    return String(err)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFileName(file.name)
    setImportError(null)
    setImportErrorDetails([])
    setImportResult(null)
    try {
      const csv = await statementFileToCsv(file)
      setFileContent(csv)
    } catch (err) {
      setImportError(x(M.finance_import_failed) + (formatError(err) ? `: ${formatError(err)}` : ''))
      setFileContent('')
    }
  }

  const handleImport = async () => {
    if (!selectedAccountId || !fileContent) return
    setImportError(null)
    setImportErrorDetails([])
    setImportResult(null)
    setAiImportResult(null)
    try {
      const result = await importBankStatement(selectedAccountId, selectedFileName, fileContent)
      if (result) {
        setImportResult(
          x(M.finance_import_result)
            .replace('{new}', String(result.newItems))
            .replace('{dup}', String(result.duplicates))
            .replace('{err}', String(result.errors)),
        )
        setImportErrorDetails(result.errorDetails ?? [])
        setSelectedFileName('')
        setFileContent('')
        if (fileInputRef.current) fileInputRef.current.value = ''
        if (result.aiSummary) {
          if (result.aiSummary.itemsAnalysed === 0) {
            setAiImportResult(x(M.finance_ai_import_result_none))
          } else {
            setAiImportResult(
              x(M.finance_ai_import_result)
                .replace('{count}', String(result.aiSummary.itemsAnalysed))
                .replace('{matched}', String(result.aiSummary.itemsMatched))
                .replace('{suggested}', String(result.aiSummary.itemsSuggested)) +
              ' ' +
              x(M.finance_ai_import_result_rules).replace('{count}', String(result.aiSummary.rulesAdded)),
            )
          }
        }
      } else {
        setImportError(x(M.finance_import_failed))
      }
    } catch (err) {
      setImportError(x(M.finance_import_failed) + (formatError(err) ? `: ${formatError(err)}` : ''))
    }
  }

  const downloadErrorReport = () => {
    if (importErrorDetails.length === 0) return
    const header = ['Row', 'Date', 'Amount', 'Description', 'Reason']
    const lines = importErrorDetails.map((err) => [
      String(err.rowIndex + 1),
      err.rawDate,
      err.rawAmount,
      err.rawDescription,
      err.reason,
    ])
    const csv = [header.join(','), ...lines.map((l) => l.join(','))].join('\n')
    downloadFile(csv, `import-errors-${selectedAccountId}-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv')
  }

  const handleDeleteSession = async (session: FinanceImportSession) => {
    if (!canWrite) return
    const confirmMessage = x(M.finance_import_delete_confirm).replace('{count}', String(session.newItems))
    if (typeof window !== 'undefined' && window.confirm(confirmMessage)) {
      await deleteImportSession(session.id)
    }
  }

  const handleAutoCategorize = async () => {
    const count = await runAutoCategorize()
    setCategorizeResult(
      count > 0
        ? x(M.finance_categorize_result).replace('{count}', String(count))
        : x(M.finance_categorize_none),
    )
  }

  const handleSeedDefaultRules = async () => {
    const count = await seedDefaultCategoryRules()
    setSeedRulesResult(
      count > 0
        ? x(M.finance_rules_seed_result).replace('{count}', String(count))
        : x(M.finance_rules_seed_none),
    )
  }

  const handleSuggestRules = () => {
    if (state.ledgerAccounts.length === 0) {
      setSuggestResult(x(M.finance_suggest_rules_none))
      setSuggestions([])
      return
    }
    setSuggesting(true)
    setSuggestResult(null)
    window.setTimeout(async () => {
      try {
        let result: RuleSuggestion[]
        if (useAiSuggestions) {
          const { suggestCategoryRulesWithAi } = await import('../data/ruleSuggestionAi')
          result = await suggestCategoryRulesWithAi(state.bankItems, state.ledgerAccounts, state.categoryRules)
        } else {
          result = suggestCategoryRules(state.bankItems, state.ledgerAccounts, state.categoryRules)
        }
        setSuggestions(result)
        setSuggestResult(
          result.length > 0
            ? x(M.finance_suggest_rules_result).replace('{count}', String(result.length))
            : x(M.finance_suggest_rules_none),
        )
      } catch {
        if (useAiSuggestions) {
          try {
            const fallback = suggestCategoryRules(state.bankItems, state.ledgerAccounts, state.categoryRules)
            setSuggestions(fallback)
            setSuggestResult(
              fallback.length > 0
                ? x(M.finance_suggest_rules_ai_error)
                : x(M.finance_suggest_rules_none),
            )
          } catch {
            setSuggestResult(x(M.finance_suggest_rules_none))
            setSuggestions([])
          }
        } else {
          setSuggestResult(x(M.finance_suggest_rules_none))
        }
      } finally {
        setSuggesting(false)
      }
    }, 0)
  }

  const handleAddSuggestion = async (suggestion: RuleSuggestion) => {
    const entityId = state.books[0]?.entityId ?? state.entities[0]?.id
    if (!entityId) return
    await addCategoryRule({
      entityId,
      pattern: suggestion.pattern,
      matchType: suggestion.matchType,
      ledgerAccountId: suggestion.ledgerAccountId,
      direction: suggestion.direction,
      priority: suggestion.priority,
      active: true,
    })
    setSuggestions((prev) => prev.filter((s) => s.pattern !== suggestion.pattern || s.ledgerAccountId !== suggestion.ledgerAccountId))
  }

  const handleAddAllSuggestions = async () => {
    const entityId = state.books[0]?.entityId ?? state.entities[0]?.id
    if (!entityId) return
    for (const suggestion of suggestions) {
      await addCategoryRule({
        entityId,
        pattern: suggestion.pattern,
        matchType: suggestion.matchType,
        ledgerAccountId: suggestion.ledgerAccountId,
        direction: suggestion.direction,
        priority: suggestion.priority,
        active: true,
      })
    }
    setSuggestions([])
    setSuggestResult(null)
  }

  const handleIgnoreSuggestion = (suggestion: RuleSuggestion) => {
    setSuggestions((prev) => prev.filter((s) => s.pattern !== suggestion.pattern || s.ledgerAccountId !== suggestion.ledgerAccountId))
  }

  const handleExport = (bundleIndex: number) => {
    const bundles = buildExportBundles(state)
    const bundle = bundles[bundleIndex]
    if (bundle) downloadFile(bundle.content, bundle.fileName, bundle.mimeType)
  }

  const closeWizard = () => {
    setShowWizard(false)
    setImportResult(null)
    setImportErrorDetails([])
  }

  return {
    selectedAccountId,
    setSelectedAccountId,
    selectedFileName,
    fileContent,
    fileInputRef,
    importResult,
    importError,
    importErrorDetails,
    showErrorDetails,
    setShowErrorDetails,
    categorizeResult,
    seedRulesResult,
    suggestions,
    suggesting,
    suggestResult,
    useAiSuggestions,
    setUseAiSuggestions,
    showRuleForm,
    setShowRuleForm,
    showWizard,
    setShowWizard,
    aiImportResult,
    unmatchedCount,
    hasRules,
    CONFIDENCE_MESSAGES,
    handleFileSelect,
    handleImport,
    downloadErrorReport,
    handleDeleteSession,
    handleAutoCategorize,
    handleSeedDefaultRules,
    handleSuggestRules,
    handleAddSuggestion,
    handleAddAllSuggestions,
    handleIgnoreSuggestion,
    handleExport,
    closeWizard,
  }
}

export type ImportExportActions = ReturnType<typeof useImportExportActions>
