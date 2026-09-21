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
import { CheckCheck, Sparkles, Upload } from 'lucide-react'

const FILTERS: ('all' | FinanceBankMatchStatus)[] = [
  'all',
  'unmatched',
  'suggested',
  'matched',
  'exception',
]

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
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const transactionAdapter = createTransactionBulkImportAdapter(importBankStatement)

  const counts = useMemo(() => {
    const c: Record<'all' | FinanceBankMatchStatus, number> = {
      all: state.bankItems.length,
      unmatched: 0,
      suggested: 0,
      matched: 0,
      exception: 0,
    }
    for (const bi of state.bankItems) c[bi.matchStatus]++
    return c
  }, [state.bankItems])

  const bankItems = useMemo(() => {
    const items =
      filter === 'all'
        ? [...state.bankItems]
        : state.bankItems.filter((bi) => bi.matchStatus === filter)
    return items.sort((a, b) => b.date.localeCompare(a.date))
  }, [state.bankItems, filter])

  const matchedRef = (bi: FinanceBankItem) => {
    const invoice = bi.matchedInvoiceId && state.invoices.find((i) => i.id === bi.matchedInvoiceId)
    if (invoice) return `${x(M.finance_bank_matched_to)}: ${invoice.number}`
    const bill = bi.matchedBillId && state.bills.find((b) => b.id === bi.matchedBillId)
    if (bill) return `${x(M.finance_bank_matched_to)}: ${bill.number}`
    const journal = bi.matchedJournalId && state.journals.find((j) => j.id === bi.matchedJournalId)
    if (journal) return `${x(M.finance_bank_matched_to)}: ${journal.number}`
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
      direction:
        account.type === 'revenue' || account.type === 'liability' || account.type === 'equity'
          ? 'credit'
          : 'debit',
      matchStatus: 'suggested',
    })
    if (originalAccountId && originalAccountId !== account.id) {
      await recordCategorizationFeedback({
        entityId: state.entities[0]?.id ?? bi.bankAccountId,
        description: bi.description,
        originalLedgerAccountId: originalAccountId,
        correctedLedgerAccountId: account.id,
        correctedDirection:
          account.type === 'revenue' || account.type === 'liability' || account.type === 'equity'
            ? 'credit'
            : 'debit',
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

  const acceptAllSuggestions = async () => {
    for (const bi of state.bankItems) {
      if (bi.aiSuggestion && bi.matchStatus !== 'matched') await acceptSuggestion(bi)
    }
  }

  const isSelectable = (bi: FinanceBankItem) => canWrite && bi.matchStatus !== 'matched'

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectableVisible = bankItems.filter(isSelectable)
  const allVisibleSelected =
    selectableVisible.length > 0 && selectableVisible.every((bi) => selected.has(bi.id))

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) selectableVisible.forEach((bi) => next.delete(bi.id))
      else selectableVisible.forEach((bi) => next.add(bi.id))
      return next
    })
  }

  const selectedItems = state.bankItems.filter((bi) => selected.has(bi.id))
  const selectedSuggested = selectedItems.filter(
    (bi) => bi.matchStatus === 'suggested' && bi.aiSuggestion,
  )
  const selectedExceptions = selectedItems.filter((bi) => bi.matchStatus === 'exception')
  const selectedOpen = selectedItems.filter((bi) => bi.matchStatus !== 'matched')

  const applyToSelected = async (
    items: FinanceBankItem[],
    fn: (bi: FinanceBankItem) => unknown,
  ) => {
    for (const bi of items) await fn(bi)
    setSelected(new Set())
  }

  const bulkAccept = () => applyToSelected(selectedSuggested, (bi) => acceptSuggestion(bi))
  const bulkMarkMatched = () =>
    applyToSelected(selectedOpen, (bi) => transitionBankItemMatchStatus(bi.id, 'matched'))
  const bulkMarkException = () =>
    applyToSelected(
      selectedOpen.filter((bi) => bi.matchStatus !== 'exception'),
      (bi) => transitionBankItemMatchStatus(bi.id, 'exception'),
    )
  const bulkReopen = () =>
    applyToSelected(selectedExceptions, (bi) => transitionBankItemMatchStatus(bi.id, 'unmatched'))

  return (
    <div className="flex flex-col gap-[16px]">
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-text">
            {x(M.finance_transactions_bank_items)}
          </h2>
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
        <div className="mb-[12px] flex flex-wrap items-center gap-[6px]">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setFilter(f)
                setSelected(new Set())
              }}
              className={`rounded-[8px] px-[10px] py-[5px] text-[12px] font-semibold transition-colors ${
                filter === f
                  ? 'bg-navy text-white'
                  : 'bg-inset text-text-2 hover:bg-surface border border-border'
              }`}
            >
              {f === 'all' ? x(M.finance_filter_all) : x(BANK_MATCH_LABEL[f])}
              <span className={filter === f ? 'text-white/70' : 'text-text-faint'}>
                {' '}
                {counts[f]}
              </span>
            </button>
          ))}
          {canWrite && counts.suggested > 0 && (
            <button
              type="button"
              onClick={() => void acceptAllSuggestions()}
              className="ml-auto flex items-center gap-[5px] rounded-[8px] border border-border bg-surface px-[10px] py-[5px] text-[12px] font-semibold text-accent hover:bg-inset"
            >
              <CheckCheck size={13} />
              {x(M.finance_transactions_accept_all)}
            </button>
          )}
        </div>
        {canWrite && selected.size > 0 && (
          <div className="mb-[10px] flex flex-wrap items-center gap-[6px] rounded-[8px] border border-border bg-inset px-[10px] py-[7px]">
            <span className="text-[12px] font-semibold text-text">
              {x(M.finance_transactions_selected_count).replace('{count}', String(selected.size))}
            </span>
            {selectedSuggested.length > 0 && (
              <button
                type="button"
                onClick={() => void bulkAccept()}
                className="rounded-[6px] bg-navy px-[8px] py-[3px] text-[11px] font-semibold text-white"
              >
                {x(M.finance_transactions_accept_selected)} ({selectedSuggested.length})
              </button>
            )}
            {selectedOpen.length > 0 && (
              <button
                type="button"
                onClick={() => void bulkMarkMatched()}
                className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-surface border border-border"
              >
                {x(M.finance_bank_mark_matched)} ({selectedOpen.length})
              </button>
            )}
            {selectedOpen.some((bi) => bi.matchStatus !== 'exception') && (
              <button
                type="button"
                onClick={() => void bulkMarkException()}
                className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-surface border border-border"
              >
                {x(M.finance_bank_mark_exception)} (
                {selectedOpen.filter((bi) => bi.matchStatus !== 'exception').length})
              </button>
            )}
            {selectedExceptions.length > 0 && (
              <button
                type="button"
                onClick={() => void bulkReopen()}
                className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-surface border border-border"
              >
                {x(M.finance_bank_reopen)} ({selectedExceptions.length})
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="ml-auto rounded-[6px] px-[8px] py-[3px] text-[11px] font-semibold text-text-muted hover:text-text"
            >
              {x(M.finance_transactions_clear_selection)}
            </button>
          </div>
        )}
        {canWrite && selectableVisible.length > 0 && (
          <label className="mb-[8px] flex w-fit cursor-pointer items-center gap-[8px] text-[12px] text-text-muted">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleSelectAll}
              aria-label={x(M.finance_transactions_select_all)}
              className="h-[14px] w-[14px] cursor-pointer"
            />
            {x(M.finance_transactions_select_all)}
          </label>
        )}
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
              const account = state.bankAccounts.find((a) => a.id === bi.bankAccountId)
              const inflow = Number(bi.amount) >= 0
              return (
                <li
                  key={bi.id}
                  className="flex flex-col gap-[8px] rounded-[10px] bg-inset px-[12px] py-[10px]"
                >
                  <div className="flex items-start gap-[12px]">
                    {canWrite &&
                      (isSelectable(bi) ? (
                        <input
                          type="checkbox"
                          checked={selected.has(bi.id)}
                          onChange={() => toggleSelect(bi.id)}
                          aria-label={
                            bi.description.trim() || x(M.finance_transactions_no_description)
                          }
                          className="mt-[2px] h-[14px] w-[14px] shrink-0 cursor-pointer"
                        />
                      ) : (
                        <span className="w-[14px] shrink-0" aria-hidden />
                      ))}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-text">
                        {bi.description.trim() ? (
                          bi.description
                        ) : (
                          <span className="font-normal text-text-faint">
                            {x(M.finance_transactions_no_description)}
                          </span>
                        )}
                      </div>
                      <div className="mt-[1px] text-[12px] text-text-muted">
                        {bi.date}
                        {account && ` · ${x(account.label)}`}
                        {ref && ` · ${ref}`}
                      </div>
                      {bi.aiSuggestion && suggestedAccount && bi.matchStatus !== 'matched' && (
                        <div className="mt-[3px] flex items-center gap-[5px] text-[12px] text-accent">
                          <Sparkles size={11} aria-hidden />
                          {suggestedAccount.code} — {x(suggestedAccount.name)} ·{' '}
                          {bi.aiSuggestion.direction}
                        </div>
                      )}
                      {bi.note && (
                        <div className="mt-[3px] text-[12px] text-text-muted">
                          <span className="font-semibold text-text-2">
                            {x(M.finance_transactions_note)}:{' '}
                          </span>
                          {x(bi.note)}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <div
                        className={`text-[13px] font-semibold tabular-nums ${inflow ? 'text-ok-fg' : 'text-text'}`}
                      >
                        {inflow ? '+' : ''}
                        {bi.amount}
                      </div>
                      <div className="text-[11px] text-text-muted">
                        {x(CURRENCY_LABEL[bi.currency])}
                      </div>
                    </div>
                    <span
                      className={statusChipClass(
                        bi.matchStatus === 'matched'
                          ? 'success'
                          : bi.matchStatus === 'exception'
                            ? 'risk'
                            : 'warning',
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
                        className="rounded-[6px] bg-navy px-[8px] py-[3px] text-[11px] font-semibold text-white"
                      >
                        {x(M.finance_transactions_save_changes)}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                      >
                        {x(M.finance_cancel)}
                      </button>
                    </div>
                  ) : (
                    canWrite &&
                    bi.matchStatus !== 'matched' && (
                      <div className="flex flex-wrap gap-[6px]">
                        {bi.aiSuggestion && bi.matchStatus === 'suggested' && (
                          <button
                            type="button"
                            onClick={() => void acceptSuggestion(bi)}
                            className="rounded-[6px] bg-navy px-[8px] py-[3px] text-[11px] font-semibold text-white"
                          >
                            {x(M.finance_transactions_accept_suggestion)}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => startEdit(bi)}
                          className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                        >
                          {bi.matchStatus === 'unmatched'
                            ? x(M.finance_transactions_categorize)
                            : x(M.finance_transactions_change_account)}
                        </button>
                        {bi.matchStatus === 'exception' ? (
                          <button
                            type="button"
                            onClick={() => transitionBankItemMatchStatus(bi.id, 'unmatched')}
                            className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                          >
                            {x(M.finance_bank_reopen)}
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => transitionBankItemMatchStatus(bi.id, 'matched')}
                              className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                            >
                              {x(M.finance_bank_mark_matched)}
                            </button>
                            <button
                              type="button"
                              onClick={() => void rejectSuggestion(bi)}
                              className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                            >
                              {x(M.finance_bank_mark_exception)}
                            </button>
                          </>
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
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">
          {x(M.finance_transactions_reconciliations)}
        </h2>
        {state.reconciliations.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_none)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[12px] p-0">
            {state.reconciliations.map((rec: FinanceReconciliation) => (
              <li key={rec.id} className="flex flex-col gap-[8px] rounded-[10px] bg-inset p-[12px]">
                <div className="flex items-start justify-between gap-[12px]">
                  <div className="flex flex-col gap-[2px]">
                    <div className="text-[13px] font-semibold text-text">
                      {x(M.finance_transactions_opening)}: {rec.openingBalance} →{' '}
                      {x(M.finance_transactions_closing)}: {rec.closingBalance}
                    </div>
                    <div className="text-[12px] text-text-muted">
                      {x(M.finance_transactions_difference)}: {rec.difference}
                      {rec.reviewer && ` · ${x(M.finance_transactions_reviewer)}: ${rec.reviewer}`}
                    </div>
                  </div>
                  <span
                    className={statusChipClass(
                      rec.status === 'reconciled'
                        ? 'success'
                        : rec.status === 'exception'
                          ? 'risk'
                          : 'warning',
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
                      onClick={() =>
                        transitionReconciliationStatus(rec.id, 'reconciled', 'Workspace user')
                      }
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
