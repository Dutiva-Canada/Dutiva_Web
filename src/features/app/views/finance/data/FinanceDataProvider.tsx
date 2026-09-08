import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Bi } from '@/i18n/core'
import { FinanceDataContext } from './FinanceDataContext'
import type { FinanceDataContextValue } from './FinanceDataContext'
import { initialFinanceState } from './fixtures'
import { useFinanceCreates } from './useFinanceCreates'
import {
  addBudget as addBudgetLocalApi,
  addInvoice as addInvoiceLocalApi,
  addJournal as addJournalLocalApi,
  addSpendRequest as addSpendRequestLocalApi,
  addTaxObligation as addTaxObligationLocalApi,
  addTaxScenario as addTaxScenarioLocalApi,
  importBankStatement as importBankStatementLocalApi,
  deleteImportSession as deleteImportSessionLocalApi,
  addCategoryRule as addCategoryRuleLocalApi,
  updateCategoryRule as updateCategoryRuleLocalApi,
  removeCategoryRule as removeCategoryRuleLocalApi,
  seedDefaultCategoryRules as seedDefaultCategoryRulesLocalApi,
  runAutoCategorize as runAutoCategorizeLocalApi,
  isJournalBalanced as isJournalBalancedLocalApi,
  loadFullState as loadFullStateLocalApi,
  markTaxScenarioStale as markTaxScenarioStaleLocalApi,
  reviseBudget as reviseBudgetLocalApi,
  transitionBankItemMatchStatus as transitionBankItemMatchStatusLocalApi,
  transitionBillStatus as transitionBillStatusLocalApi,
  transitionTaxScenarioStatus as transitionTaxScenarioStatusLocalApi,
  transitionClosePeriodStatus as transitionClosePeriodStatusLocalApi,
  transitionExpenseStatus as transitionExpenseStatusLocalApi,
  transitionExternalActionStatus as transitionExternalActionStatusLocalApi,
  transitionInvoiceStatus as transitionInvoiceStatusLocalApi,
  transitionJournalStatus as transitionJournalStatusLocalApi,
  transitionObligationStatus as transitionObligationStatusLocalApi,
  transitionPayRunStatus as transitionPayRunStatusLocalApi,
  transitionReconciliationStatus as transitionReconciliationStatusLocalApi,
  settlePayrollLiability as settlePayrollLiabilityLocalApi,
  transitionSpendRequestStatus as transitionSpendRequestStatusLocalApi,
} from './productionApi'
import {
  analyseImportWithAiLocal,
  recordCategorizationFeedbackLocal,
  updateAiImportSettingsLocal,
  updateBankItemCategorizationLocal,
} from './productionAi'
import {
  insertBudget as insertBudgetSupa,
  insertInvoice as insertInvoiceSupa,
  insertJournal as insertJournalSupa,
  insertSpendRequest as insertSpendRequestSupa,
  insertTaxObligation as insertTaxObligationSupa,
  insertTaxScenario as insertTaxScenarioSupa,
  isJournalBalanced as isJournalBalancedSupa,
  loadFinanceStateFromSupabase,
  settlePayrollLiabilityInSupabase,
  markTaxScenarioStaleInSupabase,
  reviseBudgetInSupabase,
  transitionTaxScenarioStatusInSupabase,
  updateBankItemMatchStatus as updateBankItemMatchStatusSupa,
  updateBillStatus as updateBillStatusSupa,
  updateClosePeriodStatus as updateClosePeriodStatusSupa,
  updateExpenseStatus as updateExpenseStatusSupa,
  updateExternalActionStatus as updateExternalActionStatusSupa,
  updateInvoiceStatus as updateInvoiceStatusSupa,
  updateJournalStatus as updateJournalStatusSupa,
  updatePayRunStatus as updatePayRunStatusSupa,
  updateReconciliationStatus as updateReconciliationStatusSupa,
  updateSpendRequestStatus as updateSpendRequestStatusSupa,
  updateTaxObligationStatus as updateTaxObligationStatusSupa,
  insertCategoryRule as insertCategoryRuleSupa,
  updateCategoryRuleInSupabase as updateCategoryRuleSupa,
  deleteCategoryRuleFromSupabase as removeCategoryRuleSupa,
  importBankStatementInSupabase,
  deleteImportSessionFromSupabase,
  seedDefaultCategoryRulesInSupabase,
  runAutoCategorizeInSupabase,
} from './supabaseApi'
import {
  analyseImportWithAiSupa,
  recordCategorizationFeedbackSupa,
  updateAiImportSettingsSupa,
  updateBankItemCategorizationSupa,
} from './supabaseAi'
import type {
  FinanceBankMatchStatus,
  FinanceBill,
  FinanceBudget,
  FinanceClosePeriod,
  FinanceExpenseStatus,
  FinanceExternalActionStatus,
  FinanceInvoice,
  FinanceInvoiceStatus,
  FinanceJournal,
  FinanceJournalLine,
  FinanceJournalStatus,
  FinanceObligationStatus,
  FinancePayRunStatus,
  FinanceReconciliation,
  FinanceSpendRequest,
  FinanceTaxObligation,
  FinanceTaxScenario,
  FinanceWorkspaceState,
} from './types'

const useSupabase = (): boolean => supabase !== null

function useFinanceDataValue(orgId: string | undefined): FinanceDataContextValue {
  const hasSupabase = useSupabase()
  const isLive = orgId != null && orgId !== ''
  const [state, setState] = useState<FinanceWorkspaceState>(() =>
    isLive && hasSupabase ? emptyState() : initialFinanceState,
  )
  const [loadFailed, setLoadFailed] = useState(false)

  const reload = useCallback(async () => {
    if (!isLive || !orgId) return
    if (hasSupabase) {
      try {
        setLoadFailed(false)
        const fresh = await loadFinanceStateFromSupabase(orgId)
        setState(fresh)
      } catch {
        setLoadFailed(true)
      }
    } else {
      setState(loadFullStateLocalApi(orgId))
    }
  }, [isLive, orgId, hasSupabase])

  useEffect(() => {
    if (!isLive || !orgId) return
    if (hasSupabase) {
      void reload()
    } else {
      setState(loadFullStateLocalApi(orgId))
    }
  }, [isLive, orgId, hasSupabase, reload])

  const addInvoice = useCallback(
    async (item: Omit<FinanceInvoice, 'id'>) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const created = await insertInvoiceSupa(orgId, item)
        await reload()
        return created
      }
      const created = addInvoiceLocalApi(orgId, item)
      setState(loadFullStateLocalApi(orgId))
      return created
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const addSpendRequest = useCallback(
    async (item: Omit<FinanceSpendRequest, 'id'>) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const created = await insertSpendRequestSupa(orgId, item)
        await reload()
        return created
      }
      const created = addSpendRequestLocalApi(orgId, item)
      setState(loadFullStateLocalApi(orgId))
      return created
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const transitionSpendRequestStatus = useCallback(
    async (id: string, nextStatus: FinanceSpendRequest['status'], approver?: string) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await updateSpendRequestStatusSupa(orgId, id, nextStatus, approver)
        await reload()
        return updated
      }
      const updated = transitionSpendRequestStatusLocalApi(orgId, id, nextStatus, approver)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const addJournal = useCallback(
    async (journal: Omit<FinanceJournal, 'id' | 'balanced'>) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const created = await insertJournalSupa(orgId, journal)
        if (created) await reload()
        return created
      }
      const created = addJournalLocalApi(orgId, journal)
      if (created) setState(loadFullStateLocalApi(orgId))
      return created
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const isJournalBalanced = useCallback(
    (lines: FinanceJournalLine[]) =>
      hasSupabase ? isJournalBalancedSupa(lines) : isJournalBalancedLocalApi(lines),
    [hasSupabase],
  )

  const transitionPayRunStatus = useCallback(
    async (id: string, nextStatus: FinancePayRunStatus, actor?: string) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await updatePayRunStatusSupa(orgId, id, nextStatus, actor)
        await reload()
        return updated
      }
      const updated = transitionPayRunStatusLocalApi(orgId, id, nextStatus, actor)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const settlePayrollLiability = useCallback(
    async (id: string) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await settlePayrollLiabilityInSupabase(orgId, id)
        await reload()
        return updated
      }
      const updated = settlePayrollLiabilityLocalApi(orgId, id)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const addTaxObligation = useCallback(
    async (item: Omit<FinanceTaxObligation, 'id'>) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const created = await insertTaxObligationSupa(orgId, item)
        await reload()
        return created
      }
      const created = addTaxObligationLocalApi(orgId, item)
      setState(loadFullStateLocalApi(orgId))
      return created
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const transitionObligationStatus = useCallback(
    async (id: string, nextStatus: FinanceObligationStatus, actor?: string) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await updateTaxObligationStatusSupa(orgId, id, nextStatus, actor)
        await reload()
        return updated
      }
      const updated = transitionObligationStatusLocalApi(orgId, id, nextStatus, actor)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const addBudget = useCallback(
    async (item: Omit<FinanceBudget, 'id'>) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const created = await insertBudgetSupa(orgId, item)
        await reload()
        return created
      }
      const created = addBudgetLocalApi(orgId, item)
      setState(loadFullStateLocalApi(orgId))
      return created
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const reviseBudget = useCallback(
    async (id: string, lines: FinanceBudget['lines']) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await reviseBudgetInSupabase(orgId, id, lines)
        await reload()
        return updated
      }
      const updated = reviseBudgetLocalApi(orgId, id, lines)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const addTaxScenario = useCallback(
    async (item: Omit<FinanceTaxScenario, 'id'>) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const created = await insertTaxScenarioSupa(orgId, item)
        await reload()
        return created
      }
      const created = addTaxScenarioLocalApi(orgId, item)
      setState(loadFullStateLocalApi(orgId))
      return created
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const markTaxScenarioStale = useCallback(
    async (id: string, reason: string) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await markTaxScenarioStaleInSupabase(orgId, id, reason)
        await reload()
        return updated
      }
      const updated = markTaxScenarioStaleLocalApi(orgId, id, reason)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const transitionTaxScenarioStatus = useCallback(
    async (id: string, nextStatus: FinanceTaxScenario['status'], reviewer?: string) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await transitionTaxScenarioStatusInSupabase(orgId, id, nextStatus, reviewer)
        await reload()
        return updated
      }
      const updated = transitionTaxScenarioStatusLocalApi(orgId, id, nextStatus, reviewer)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const transitionExternalActionStatus = useCallback(
    async (id: string, nextStatus: FinanceExternalActionStatus) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await updateExternalActionStatusSupa(orgId, id, nextStatus)
        await reload()
        return updated
      }
      const updated = transitionExternalActionStatusLocalApi(orgId, id, nextStatus)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const isPeriodLocked = useCallback(
    (bookId: string, periodId: string) => {
      const cp = state.closePeriods.find(
        (p) => p.bookId === bookId && p.periodId === periodId,
      )
      return cp?.status === 'locked' || cp?.status === 'approved'
    },
    [state.closePeriods],
  )

  const transitionInvoiceStatus = useCallback(
    async (id: string, nextStatus: FinanceInvoiceStatus, paidAmount?: string) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await updateInvoiceStatusSupa(orgId, id, nextStatus, paidAmount)
        await reload()
        return updated
      }
      const updated = transitionInvoiceStatusLocalApi(orgId, id, nextStatus, paidAmount)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const transitionBillStatus = useCallback(
    async (id: string, nextStatus: FinanceBill['status'], paidAmount?: string) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await updateBillStatusSupa(orgId, id, nextStatus, paidAmount)
        await reload()
        return updated
      }
      const updated = transitionBillStatusLocalApi(orgId, id, nextStatus, paidAmount)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const transitionJournalStatus = useCallback(
    async (id: string, nextStatus: FinanceJournalStatus) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await updateJournalStatusSupa(orgId, id, nextStatus)
        await reload()
        return updated
      }
      const updated = transitionJournalStatusLocalApi(orgId, id, nextStatus)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const transitionBankItemMatchStatus = useCallback(
    async (
      id: string,
      nextStatus: FinanceBankMatchStatus,
      matchRef?: { journalId?: string; invoiceId?: string; billId?: string },
    ) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await updateBankItemMatchStatusSupa(orgId, id, nextStatus, matchRef)
        await reload()
        return updated
      }
      const updated = transitionBankItemMatchStatusLocalApi(orgId, id, nextStatus, matchRef)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const transitionReconciliationStatus = useCallback(
    async (id: string, nextStatus: FinanceReconciliation['status'], reviewer?: string) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await updateReconciliationStatusSupa(orgId, id, nextStatus, reviewer)
        await reload()
        return updated
      }
      const updated = transitionReconciliationStatusLocalApi(orgId, id, nextStatus, reviewer)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const transitionClosePeriodStatus = useCallback(
    async (
      id: string,
      nextStatus: FinanceClosePeriod['status'],
      approver?: string,
      reopenReason?: string,
    ) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await updateClosePeriodStatusSupa(orgId, id, nextStatus, approver, reopenReason)
        await reload()
        return updated
      }
      const updated = transitionClosePeriodStatusLocalApi(orgId, id, nextStatus, approver, reopenReason)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const transitionExpenseStatus = useCallback(
    async (id: string, nextStatus: FinanceExpenseStatus) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await updateExpenseStatusSupa(orgId, id, nextStatus)
        await reload()
        return updated
      }
      const updated = transitionExpenseStatusLocalApi(orgId, id, nextStatus)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload],
  )

  const importBankStatement = useCallback(
    async (bankAccountId: string, fileName: string, fileContent: string) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const result = await importBankStatementInSupabase(orgId, bankAccountId, fileName, fileContent)
        let aiSummary: import('./types').FinanceBankStatementImportResult['aiSummary'] = undefined
        if (result?.sessionId) {
          try {
            aiSummary = (await analyseImportWithAiSupa(orgId, result.sessionId)) ?? undefined
          } catch {
            // AI analysis after import failed — import itself succeeded
          }
        }
        await reload()
        return result ? { ...result, aiSummary } : null
      }
      const result = importBankStatementLocalApi(orgId, bankAccountId, fileName, fileContent)
      if (result) {
        setState(loadFullStateLocalApi(orgId))
        let aiSummary: import('./types').FinanceBankStatementImportResult['aiSummary'] = undefined
        if (result.sessionId) {
          aiSummary = (await analyseImportWithAiLocal(orgId, result.sessionId)) ?? undefined
          if (aiSummary) setState(loadFullStateLocalApi(orgId))
        }
        return { ...result, aiSummary }
      }
      return result
    },
    [isLive, orgId, hasSupabase, reload, setState],
  )

  const deleteImportSession = useCallback(
    async (id: string) => {
      if (!isLive || !orgId) return false
      if (hasSupabase) {
        const result = await deleteImportSessionFromSupabase(orgId, id)
        await reload()
        return result
      }
      const result = deleteImportSessionLocalApi(orgId, id)
      if (result) setState(loadFullStateLocalApi(orgId))
      return result
    },
    [isLive, orgId, hasSupabase, reload, setState],
  )

  const addCategoryRule = useCallback(
    async (rule: Omit<import('./types').FinanceCategoryRule, 'id'>) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const created = await insertCategoryRuleSupa(orgId, rule)
        await reload()
        return created
      }
      const created = addCategoryRuleLocalApi(orgId, rule)
      setState(loadFullStateLocalApi(orgId))
      return created
    },
    [isLive, orgId, hasSupabase, reload, setState],
  )

  const updateCategoryRule = useCallback(
    async (id: string, patch: Partial<import('./types').FinanceCategoryRule>) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await updateCategoryRuleSupa(orgId, id, patch)
        await reload()
        return updated
      }
      const updated = updateCategoryRuleLocalApi(orgId, id, patch)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload, setState],
  )

  const removeCategoryRule = useCallback(
    async (id: string) => {
      if (!isLive || !orgId) return false
      if (hasSupabase) {
        const removed = await removeCategoryRuleSupa(orgId, id)
        await reload()
        return removed
      }
      const removed = removeCategoryRuleLocalApi(orgId, id)
      if (removed) setState(loadFullStateLocalApi(orgId))
      return removed
    },
    [isLive, orgId, hasSupabase, reload, setState],
  )

  const seedDefaultCategoryRules = useCallback(async () => {
    if (!isLive || !orgId) return 0
    if (hasSupabase) {
      const count = await seedDefaultCategoryRulesInSupabase(orgId)
      await reload()
      return count
    }
    const count = seedDefaultCategoryRulesLocalApi(orgId)
    setState(loadFullStateLocalApi(orgId))
    return count
  }, [isLive, orgId, hasSupabase, reload, setState])

  const runAutoCategorize = useCallback(async () => {
    if (!isLive || !orgId) return 0
    if (hasSupabase) {
      const count = await runAutoCategorizeInSupabase(orgId)
      await reload()
      return count
    }
    const count = runAutoCategorizeLocalApi(orgId)
    setState(loadFullStateLocalApi(orgId))
    return count
  }, [isLive, orgId, hasSupabase, reload, setState])

  const analyseImportWithAi = useCallback(
    async (sessionId: string) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        return await analyseImportWithAiSupa(orgId, sessionId)
      }
      const result = await analyseImportWithAiLocal(orgId, sessionId)
      if (result) setState(loadFullStateLocalApi(orgId))
      return result
    },
    [isLive, orgId, hasSupabase, setState],
  )

  const updateBankItemCategorization = useCallback(
    async (
      id: string,
      patch: {
        ledgerAccountId?: string
        direction?: 'debit' | 'credit'
        note?: Bi
        matchStatus?: FinanceBankMatchStatus
      },
    ) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await updateBankItemCategorizationSupa(orgId, id, patch)
        await reload()
        return updated
      }
      const updated = updateBankItemCategorizationLocal(orgId, id, patch)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload, setState],
  )

  const recordCategorizationFeedback = useCallback(
    async (item: Omit<import('./types').FinanceCategorizationFeedback, 'id' | 'correctedAt'>) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const created = await recordCategorizationFeedbackSupa(orgId, item)
        await reload()
        return created
      }
      const created = recordCategorizationFeedbackLocal(orgId, item)
      if (created) setState(loadFullStateLocalApi(orgId))
      return created
    },
    [isLive, orgId, hasSupabase, reload, setState],
  )

  const updateAiImportSettings = useCallback(
    async (patch: Partial<import('./types').FinanceAiImportSettings>) => {
      if (!isLive || !orgId) return null
      if (hasSupabase) {
        const updated = await updateAiImportSettingsSupa(orgId, patch)
        await reload()
        return updated
      }
      const updated = updateAiImportSettingsLocal(orgId, patch)
      if (updated) setState(loadFullStateLocalApi(orgId))
      return updated
    },
    [isLive, orgId, hasSupabase, reload, setState],
  )

  const creates = useFinanceCreates({ orgId, isLive, hasSupabase, reload, setState })

  return useMemo(
    () => ({
      state,
      canWrite: isLive,
      loadFailed,
      hasSupabase,
      reload,
      addInvoice,
      addSpendRequest,
      transitionSpendRequestStatus,
      addJournal,
      isJournalBalanced,
      transitionPayRunStatus,
      settlePayrollLiability,
      addTaxObligation,
      transitionObligationStatus,
      addBudget,
      reviseBudget,
      addTaxScenario,
      markTaxScenarioStale,
      transitionTaxScenarioStatus,
      transitionExternalActionStatus,
      isPeriodLocked,
      transitionInvoiceStatus,
      transitionBillStatus,
      transitionJournalStatus,
      transitionBankItemMatchStatus,
      transitionReconciliationStatus,
      transitionClosePeriodStatus,
      transitionExpenseStatus,
      importBankStatement,
      deleteImportSession,
      addCategoryRule,
      updateCategoryRule,
      removeCategoryRule,
      seedDefaultCategoryRules,
      runAutoCategorize,
      analyseImportWithAi,
      updateBankItemCategorization,
      recordCategorizationFeedback,
      updateAiImportSettings,
      ...creates,
    }),
    [
      state,
      isLive,
      loadFailed,
      hasSupabase,
      reload,
      addInvoice,
      addSpendRequest,
      transitionSpendRequestStatus,
      addJournal,
      isJournalBalanced,
      transitionPayRunStatus,
      settlePayrollLiability,
      addTaxObligation,
      transitionObligationStatus,
      addBudget,
      reviseBudget,
      addTaxScenario,
      markTaxScenarioStale,
      transitionTaxScenarioStatus,
      transitionExternalActionStatus,
      isPeriodLocked,
      transitionInvoiceStatus,
      transitionBillStatus,
      transitionJournalStatus,
      transitionBankItemMatchStatus,
      transitionReconciliationStatus,
      transitionClosePeriodStatus,
      transitionExpenseStatus,
      importBankStatement,
      deleteImportSession,
      addCategoryRule,
      updateCategoryRule,
      removeCategoryRule,
      seedDefaultCategoryRules,
      runAutoCategorize,
      analyseImportWithAi,
      updateBankItemCategorization,
      recordCategorizationFeedback,
      updateAiImportSettings,
      creates,
    ],
  )
}

function emptyState(): FinanceWorkspaceState {
  return {
    entities: [], books: [], fiscalPeriods: [], parties: [], bankAccounts: [],
    ledgerAccounts: [], invoices: [], bills: [], credits: [], receipts: [],
    spendRequests: [], purchaseOrders: [], expenses: [], subscriptions: [],
    journals: [], bankItems: [], reconciliations: [], closePeriods: [],
    payPeriods: [], payRuns: [], payrollLiabilities: [], budgets: [],
    scenarios: [], forecasts: [], reserveGoals: [], holdings: [], debts: [],
    taxObligations: [], taxScenarios: [], approvals: [], auditEvents: [],
    externalActions: [],
    categoryRules: [], importSessions: [],
    aiImportSettings: { aiImportEnabled: false, aiImportMode: 'auto_high' },
    categorizationFeedback: [],
  }
}

export function FinanceDataProvider({
  children,
  mode,
  orgId,
}: {
  children: React.ReactNode
  mode: 'demo' | 'production'
  orgId?: string
}) {
  const value = useFinanceDataValue(mode === 'production' ? orgId : undefined)
  return <FinanceDataContext.Provider value={value}>{children}</FinanceDataContext.Provider>
}
