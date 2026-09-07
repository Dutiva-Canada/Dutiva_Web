import { useMemo, useState } from 'react'
import { statusChipClass } from '@/components/chips'
import { useI18n } from '@/i18n/context'
import { financeMessages as M } from '@/i18n/messages/finance'
import { bulkImportMessages as B } from '@/i18n/messages/bulkImport'
import { useFinanceData } from '../data/useFinanceData'
import { BANK_MATCH_LABEL, CURRENCY_LABEL } from '../financeLabels'
import { BulkImportWizard } from '@/features/app/bulkImport/BulkImportWizard'
import { createTransactionBulkImportAdapter } from '../bulkImport/transactionAdapter'
import type { FinanceBankItem, FinanceBankMatchStatus, FinanceReconciliation } from '../data/types'
import { Upload } from 'lucide-react'

const FILTERS: ('all' | FinanceBankMatchStatus)[] = ['all', 'unmatched', 'suggested', 'matched', 'exception']

export function Transactions() {
  const { x } = useI18n()
  const {
    state,
    canWrite,
    transitionBankItemMatchStatus,
    transitionReconciliationStatus,
    importBankStatement,
    updateBankItemCategorization,
    recordCategorizationFeedback,
  } = useFinanceData()
  const [filter, setFilter] = useState<'all' | FinanceBankMatchStatus>('all')
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingAccountId, setEditingAccountId] = useState<string>('')
  const transactionAdapter = createTransactionBulkImportAdapter(importBankStatement)

  const bankItems = useMemo(
    () => (filter === 'all' ? state.bankItems : state.bankItems.filter((bi) => bi.matchStatus === filter)),
    [state.bankItems, filter],
  )

  const matchedRef = (bi: { matchedJournalId?: string; matchedInvoiceId?: string; matchedBillId?: string }) => {
    if (bi.matchedJournalId) return `${x(M.finance_bank_matched_to)}: ${bi.matchedJournalId}`
    if (bi.matchedInvoiceId) return `${x(M.finance_bank_matched_to)}: ${bi.matchedInvoiceId}`
    if (bi.matchedBillId) return `${x(M.finance_bank_matched_to)}: ${bi.matchedBillId}`
    return null
  }

  const startEdit = (bi: FinanceBankItem) => {
    setEditingId(bi.id)
    setEditingAccountId(bi.aiSuggestion?.ledgerAccountId ?? state.ledgerAccounts[0]?.id ?? '')
  }

  const saveEdit = async (bi: FinanceBankItem) => {
    const account = state.ledgerAccounts.find((la) => la.id === editingAccountId)
    if (!account) return
    const originalAccountId = bi.aiSuggestion?.ledgerAccountId
    await updateBankItemCategorization(bi.id, {
      ledgerAccountId: account.id,
      direction: account.type === 'revenue' || account.type === 'liability' || account.type === 'equity' ? 'credit' : 'debit',
      matchStatus: 'suggested',
    })
    if (originalAccountId && originalAccountId !== account.id) {
      await recordCategorizationFeedback({
        entityId: state.entities[0]?.id ?? bi.bankAccountId,
        description: bi.description,
        originalLedgerAccountId: originalAccountId,
        correctedLedgerAccountId: account.id,
        correctedDirection: account.type === 'revenue' || account.type === 'liability' || account.type === 'equity' ? 'credit' : 'debit',
      })
    }
    setEditingId(null)
  }

  const acceptSuggestion = async (bi: FinanceBankItem) => {
    const account = bi.aiSuggestion
      ? state.ledgerAccounts.find((la) => la.id === bi.aiSuggestion!.ledgerAccountId)
      : undefined
    await updateBankItemCategorization(bi.id, {
      ledgerAccountId: bi.aiSuggestion?.ledgerAccountId,
      direction: bi.aiSuggestion?.direction,
      matchStatus: 'matched',
    })
    if (account) {
      await recordCategorizationFeedback({
        entityId: state.entities[0]?.id ?? bi.bankAccountId,
        description: bi.description,
        originalLedgerAccountId: bi.aiSuggestion?.ledgerAccountId,
        correctedLedgerAccountId: account.id,
        correctedDirection: bi.aiSuggestion?.direction ?? 'debit',
      })
    }
  }

  const rejectSuggestion = async (bi: FinanceBankItem) => {
    await updateBankItemCategorization(bi.id, { matchStatus: 'exception' })
  }

  return (
    <div className="flex flex-col gap-[16px]">
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-text">{x(M.finance_transactions_bank_items)}</h2>
          {canWrite && (
            <button
              type="button"
              onClick={() => setShowBulkImport(true)}
              className="flex items-center gap-[6px] text-[13px] font-semibold text-accent"
            >
              <Upload size={14} />
              {x(B.bulk_import_title)}
            </button>
          )}
        </div>
        {showBulkImport && (
          <BulkImportWizard adapter={transactionAdapter} onClose={() => setShowBulkImport(false)} />
        )}
        <div className="mb-[12px] flex flex-wrap gap-[6px]">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-[8px] px-[10px] py-[5px] text-[12px] font-semibold transition-colors ${
                filter === f ? 'bg-navy text-white' : 'bg-inset text-text-2 hover:bg-surface border border-border'
              }`}
            >
              {f === 'all' ? x(M.finance_filter_all) : x(BANK_MATCH_LABEL[f])}
            </button>
          ))}
        </div>
        {bankItems.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_transactions_no_bank_items)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[12px] p-0">
            {bankItems.map((bi) => {
              const ref = matchedRef(bi)
              const isEditing = editingId === bi.id
              const suggestedAccount = bi.aiSuggestion
                ? state.ledgerAccounts.find((la) => la.id === bi.aiSuggestion!.ledgerAccountId)
                : undefined
              return (
                <li key={bi.id} className="flex flex-col gap-[8px] rounded-[10px] bg-inset p-[12px]">
                  <div className="flex items-start justify-between gap-[12px]">
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-text">{bi.description}</div>
                      <div className="text-[12px] text-text-muted">
                        {bi.date} · {x(CURRENCY_LABEL[bi.currency])} {bi.amount}
                      </div>
                      {ref && <div className="text-[12px] text-text-muted">{ref}</div>}
                      {bi.note && (
                        <div className="mt-[4px] text-[12px] text-text-muted">
                          <span className="font-semibold text-text-2">{x(M.finance_transactions_note)}: </span>
                          {x(bi.note)}
                        </div>
                      )}
                      {bi.aiSuggestion && suggestedAccount && (
                        <div className="mt-[4px] text-[12px] text-text-muted">
                          <span className="font-semibold text-text-2">{x(M.finance_transactions_ai_suggestion)} </span>
                          {suggestedAccount.code} — {x(suggestedAccount.name)} ({bi.aiSuggestion.direction})
                        </div>
                      )}
                    </div>
                    <span
                      className={statusChipClass(
                        bi.matchStatus === 'matched' ? 'success' : bi.matchStatus === 'exception' ? 'risk' : 'warning',
                      )}
                    >
                      {x(BANK_MATCH_LABEL[bi.matchStatus])}
                    </span>
                  </div>
                  {isEditing ? (
                    <div className="flex flex-wrap items-center gap-[6px]">
                      <select
                        value={editingAccountId}
                        onChange={(e) => setEditingAccountId(e.target.value)}
                        className="rounded-[6px] border border-border bg-surface px-[8px] py-[3px] text-[12px] text-text"
                      >
                        {state.ledgerAccounts.map((la) => (
                          <option key={la.id} value={la.id}>
                            {la.code} — {x(la.name)}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => void saveEdit(bi)}
                        className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                      >
                        {x(M.finance_transactions_save_changes)}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                      >
                        {x(M.finance_suggest_rules_ignore)}
                      </button>
                    </div>
                  ) : (
                    canWrite && (
                      <div className="flex flex-wrap gap-[6px]">
                        {bi.aiSuggestion && bi.matchStatus !== 'matched' && (
                          <button
                            type="button"
                            onClick={() => void acceptSuggestion(bi)}
                            className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                          >
                            {x(M.finance_transactions_accept_suggestion)}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => startEdit(bi)}
                          className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                        >
                          {x(M.finance_transactions_change_account)}
                        </button>
                        {bi.matchStatus !== 'exception' && (
                          <button
                            type="button"
                            onClick={() => transitionBankItemMatchStatus(bi.id, 'matched')}
                            className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                          >
                            {bi.matchStatus === 'suggested'
                              ? x(M.finance_bank_accept_suggested)
                              : x(M.finance_bank_mark_matched)}
                          </button>
                        )}
                        {bi.matchStatus !== 'exception' && (
                          <button
                            type="button"
                            onClick={() => void rejectSuggestion(bi)}
                            className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                          >
                            {x(M.finance_bank_mark_exception)}
                          </button>
                        )}
                      </div>
                    )
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_transactions_reconciliations)}</h2>
        {state.reconciliations.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_none)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[12px] p-0">
            {state.reconciliations.map((rec: FinanceReconciliation) => (
              <li key={rec.id} className="flex flex-col gap-[8px] rounded-[10px] bg-inset p-[12px]">
                <div className="flex items-start justify-between gap-[12px]">
                  <div className="flex flex-col gap-[2px]">
                    <div className="text-[13px] font-semibold text-text">
                      {x(M.finance_transactions_opening)}: {rec.openingBalance} → {x(M.finance_transactions_closing)}: {rec.closingBalance}
                    </div>
                    <div className="text-[12px] text-text-muted">
                      {x(M.finance_transactions_difference)}: {rec.difference}
                      {rec.reviewer && ` · ${x(M.finance_transactions_reviewer)}: ${rec.reviewer}`}
                    </div>
                  </div>
                  <span
                    className={statusChipClass(
                      rec.status === 'reconciled' ? 'success' : rec.status === 'exception' ? 'risk' : 'warning',
                    )}
                  >
                    {rec.status === 'reconciled'
                      ? 'Reconciled'
                      : rec.status === 'exception'
                        ? 'Exception'
                        : 'In progress'}
                  </span>
                </div>
                {canWrite && rec.status === 'in_progress' && (
                  <div className="flex flex-wrap gap-[6px]">
                    <button
                      type="button"
                      onClick={() => transitionReconciliationStatus(rec.id, 'reconciled', 'Workspace user')}
                      className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                    >
                      {x(M.finance_reconciliation_mark_reconciled)}
                    </button>
                    <button
                      type="button"
                      onClick={() => transitionReconciliationStatus(rec.id, 'exception')}
                      className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                    >
                      {x(M.finance_reconciliation_mark_exception)}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
