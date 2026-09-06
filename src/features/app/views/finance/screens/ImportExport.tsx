import { useMemo, useRef, useState } from 'react'
import { Download, FileUp, Sparkles, Trash2, Wand2 } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { financeMessages as M } from '@/i18n/messages/finance'
import { useFinanceData } from '../data/useFinanceData'
import { CATEGORY_MATCH_TYPE_LABEL } from '../financeLabels'
import { buildExportBundles, downloadFile } from '../data/importExport'
import { statementFileToCsv } from '../data/statementParser'
import { createBankStatementBulkImportAdapter } from '../bulkImport/bankStatementAdapter'
import { BulkImportWizard } from '@/features/app/bulkImport/BulkImportWizard'
import type { FinanceCategoryMatchType, FinanceImportRowError } from '../data/types'

export function ImportExport() {
  const { x } = useI18n()
  const {
    state,
    canWrite,
    importBankStatement,
    deleteImportSession,
    addCategoryRule,
    updateCategoryRule,
    removeCategoryRule,
    runAutoCategorize,
  } = useFinanceData()

  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [selectedFileName, setSelectedFileName] = useState('')
  const [fileContent, setFileContent] = useState('')
  const [importResult, setImportResult] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importErrorDetails, setImportErrorDetails] = useState<FinanceImportRowError[]>([])
  const [showErrorDetails, setShowErrorDetails] = useState(false)
  const [categorizeResult, setCategorizeResult] = useState<string | null>(null)
  const [showRuleForm, setShowRuleForm] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const unmatchedCount = useMemo(
    () => state.bankItems.filter((bi) => bi.matchStatus === 'unmatched').length,
    [state.bankItems],
  )
  const hasRules = state.categoryRules.length > 0

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
    } catch {
      setImportError(x(M.finance_import_failed))
      setFileContent('')
    }
  }

  const handleImport = async () => {
    if (!selectedAccountId || !fileContent) return
    setImportError(null)
    setImportErrorDetails([])
    setImportResult(null)
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
      } else {
        setImportError(x(M.finance_import_failed))
      }
    } catch {
      setImportError(x(M.finance_import_failed))
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

  const handleDeleteSession = async (session: import('../data/types').FinanceImportSession) => {
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

  const handleExport = (bundleIndex: number) => {
    const bundles = buildExportBundles(state)
    const bundle = bundles[bundleIndex]
    if (bundle) downloadFile(bundle.content, bundle.fileName, bundle.mimeType)
  }

  return (
    <div className="flex flex-col gap-[16px]">
      {/* Import section */}
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[8px] text-[15px] font-semibold text-text">{x(M.finance_import_title)}</h2>
        <p className="mb-[12px] text-[13px] text-text-muted">{x(M.finance_import_description)}</p>

        <div className="flex flex-col gap-[10px]">
          <label className="text-[12px] font-semibold text-text-2">
            {x(M.finance_import_select_account)}
          </label>
          {state.bankAccounts.length === 0 ? (
            <p className="rounded-[8px] bg-inset p-[10px] text-[13px] text-text-muted">
              {x(M.finance_import_no_accounts)}{' '}
              <NavLink to="../treasury" className="font-semibold text-accent hover:underline">
                {x(M.finance_treasury_title)}
              </NavLink>
            </p>
          ) : (
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="rounded-[8px] border border-border bg-inset px-[10px] py-[6px] text-[13px] text-text"
            >
              <option value="">—</option>
              {state.bankAccounts.map((ba) => (
                <option key={ba.id} value={ba.id}>
                  {x(ba.label)} ({ba.currency})
                </option>
              ))}
            </select>
          )}

          <label className="text-[12px] font-semibold text-text-2">
            {x(M.finance_import_select_file)}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={(e) => {
              void handleFileSelect(e)
            }}
            disabled={!canWrite || !selectedAccountId}
            className="text-[12px] text-text-2"
          />
          <p className="text-[11px] text-text-muted">{x(M.finance_import_xlsx_supported)}</p>
          {selectedFileName && (
            <div className="text-[12px] text-text-muted">
              {x(M.finance_import_file_selected)}: {selectedFileName}
            </div>
          )}

          {canWrite && selectedAccountId && (
            <button
              type="button"
              onClick={() => setShowWizard(true)}
              className="flex items-center gap-[6px] self-start rounded-[8px] bg-surface px-[14px] py-[7px] text-[12.5px] font-semibold text-text-2 hover:bg-inset border border-border"
            >
              <Wand2 size={14} strokeWidth={1.9} aria-hidden="true" />
              {x(M.finance_import_bulk_wizard)}
            </button>
          )}
          {canWrite && selectedAccountId && fileContent && (
            <button
              type="button"
              onClick={handleImport}
              className="flex items-center gap-[6px] self-start rounded-[8px] bg-navy px-[14px] py-[7px] text-[12.5px] font-semibold text-white hover:opacity-90"
            >
              <FileUp size={14} strokeWidth={1.9} aria-hidden="true" />
              {x(M.finance_import_process)}
            </button>
          )}
          {!canWrite && (
            <p className="text-[12px] text-text-muted">{x(M.finance_import_no_account)}</p>
          )}
          {importError && (
            <div className="rounded-[8px] bg-risk-bg px-[10px] py-[8px] text-[12px] text-risk-fg">
              {importError}
            </div>
          )}
          {importResult && (
            <div className="flex flex-col gap-[8px] rounded-[8px] bg-inset px-[10px] py-[8px] text-[12px] text-text">
              <span>{importResult}</span>
              {importErrorDetails.length > 0 && (
                <div className="flex flex-col gap-[8px]">
                  <div className="flex flex-wrap gap-[8px]">
                    <button
                      type="button"
                      onClick={() => setShowErrorDetails((v) => !v)}
                      className="rounded-[6px] bg-surface px-[8px] py-[4px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                    >
                      {x(M.finance_import_view_errors)}
                    </button>
                    <button
                      type="button"
                      onClick={downloadErrorReport}
                      className="rounded-[6px] bg-surface px-[8px] py-[4px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                    >
                      {x(M.finance_import_download_errors)}
                    </button>
                  </div>
                  {showErrorDetails && (
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="text-left text-text-muted">
                          <th className="pb-[4px] pr-[8px]">{x(M.finance_import_rows)}</th>
                          <th className="pb-[4px] pr-[8px]">{x(M.finance_import_date)}</th>
                          <th className="pb-[4px] pr-[8px]">{x(M.finance_import_amount)}</th>
                          <th className="pb-[4px]">{x(M.finance_import_description)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importErrorDetails.map((err) => (
                          <tr key={err.rowIndex} className="border-t border-border/50">
                            <td className="py-[4px] pr-[8px]">{err.rowIndex + 1}</td>
                            <td className="py-[4px] pr-[8px] text-red-600">{err.rawDate}</td>
                            <td className="py-[4px] pr-[8px] text-red-600">{err.rawAmount}</td>
                            <td className="py-[4px]">{err.rawDescription}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Auto-categorize section */}
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[8px] text-[15px] font-semibold text-text">{x(M.finance_categorize_title)}</h2>
        <p className="mb-[12px] text-[13px] text-text-muted">{x(M.finance_categorize_description)}</p>
        <div className="flex items-center gap-[10px]">
          {canWrite && (
            <button
              type="button"
              onClick={handleAutoCategorize}
              disabled={unmatchedCount === 0 || !hasRules}
              className="flex items-center gap-[6px] rounded-[8px] bg-navy px-[14px] py-[7px] text-[12.5px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              <Sparkles size={14} strokeWidth={1.9} aria-hidden="true" />
              {x(M.finance_categorize_run)}
            </button>
          )}
          <span className="text-[12px] text-text-muted">
            {unmatchedCount} unmatched
          </span>
        </div>
        {categorizeResult && (
          <div className="mt-[8px] rounded-[8px] bg-inset px-[10px] py-[8px] text-[12px] text-text">
            {categorizeResult}
          </div>
        )}
        {!hasRules && canWrite && (
          <div className="mt-[8px] rounded-[8px] bg-inset px-[10px] py-[8px] text-[12px] text-text-muted">
            {x(M.finance_categorize_no_rules)}
          </div>
        )}
      </section>

      {/* Category rules section */}
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[8px] flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-text">{x(M.finance_rules_title)}</h2>
            <p className="mt-[2px] text-[12px] text-text-muted">{x(M.finance_rules_description)}</p>
          </div>
          {canWrite && (
            <button
              type="button"
              onClick={() => setShowRuleForm((v) => !v)}
              className="rounded-[8px] bg-surface px-[10px] py-[5px] text-[12px] font-semibold text-text-2 hover:bg-inset border border-border"
            >
              {x(M.finance_rules_add)}
            </button>
          )}
        </div>

        {showRuleForm && canWrite && (
          <CategoryRuleForm
            state={state}
            onAdd={async (rule) => {
              await addCategoryRule(rule)
              setShowRuleForm(false)
            }}
            onCancel={() => setShowRuleForm(false)}
          />
        )}

        {state.categoryRules.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_rules_no_rules)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[8px] p-0">
            {[...state.categoryRules]
              .sort((a, b) => b.priority - a.priority)
              .map((rule) => {
                const account = state.ledgerAccounts.find((la) => la.id === rule.ledgerAccountId)
                return (
                  <li
                    key={rule.id}
                    className="flex flex-col gap-[4px] rounded-[10px] bg-inset p-[10px]"
                  >
                    <div className="flex items-center justify-between gap-[8px]">
                      <div className="text-[13px] font-semibold text-text">
                        {rule.pattern}
                      </div>
                      <div className="flex items-center gap-[6px]">
                        {canWrite && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                updateCategoryRule(rule.id, { active: !rule.active })
                              }
                              className="rounded-[6px] bg-surface px-[6px] py-[2px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                            >
                              {rule.active
                                ? x(M.finance_rules_deactivate)
                                : x(M.finance_rules_activate)}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeCategoryRule(rule.id)}
                              className="rounded-[6px] bg-surface px-[6px] py-[2px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                            >
                              <Trash2 size={11} strokeWidth={1.9} aria-hidden="true" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-[12px] text-text-muted">
                      {x(CATEGORY_MATCH_TYPE_LABEL[rule.matchType])} · {account?.code ?? '—'} {account?.name.en ?? ''} · {rule.direction} · {x(M.finance_rules_priority)}: {rule.priority}
                    </div>
                  </li>
                )
              })}
          </ul>
        )}
      </section>

      {/* Export section */}
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[8px] text-[15px] font-semibold text-text">{x(M.finance_export_title)}</h2>
        <p className="mb-[12px] text-[13px] text-text-muted">{x(M.finance_export_description)}</p>
        <div className="flex flex-wrap gap-[8px]">
          <button
            type="button"
            onClick={() => handleExport(0)}
            className="flex items-center gap-[6px] rounded-[8px] bg-surface px-[12px] py-[6px] text-[12.5px] font-semibold text-text-2 hover:bg-inset border border-border"
          >
            <Download size={14} strokeWidth={1.9} aria-hidden="true" />
            {x(M.finance_export_bank_items)}
          </button>
          <button
            type="button"
            onClick={() => handleExport(1)}
            className="flex items-center gap-[6px] rounded-[8px] bg-surface px-[12px] py-[6px] text-[12.5px] font-semibold text-text-2 hover:bg-inset border border-border"
          >
            <Download size={14} strokeWidth={1.9} aria-hidden="true" />
            {x(M.finance_export_journals)}
          </button>
          <button
            type="button"
            onClick={() => handleExport(2)}
            className="flex items-center gap-[6px] rounded-[8px] bg-surface px-[12px] py-[6px] text-[12.5px] font-semibold text-text-2 hover:bg-inset border border-border"
          >
            <Download size={14} strokeWidth={1.9} aria-hidden="true" />
            {x(M.finance_export_invoices)}
          </button>
          <button
            type="button"
            onClick={() => handleExport(3)}
            className="flex items-center gap-[6px] rounded-[8px] bg-surface px-[12px] py-[6px] text-[12.5px] font-semibold text-text-2 hover:bg-inset border border-border"
          >
            <Download size={14} strokeWidth={1.9} aria-hidden="true" />
            {x(M.finance_export_bills)}
          </button>
          <button
            type="button"
            onClick={() => handleExport(4)}
            className="flex items-center gap-[6px] rounded-[8px] bg-surface px-[12px] py-[6px] text-[12.5px] font-semibold text-text-2 hover:bg-inset border border-border"
          >
            <Download size={14} strokeWidth={1.9} aria-hidden="true" />
            {x(M.finance_export_workspace)}
          </button>
        </div>
      </section>

      {/* Import history */}
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[8px] text-[15px] font-semibold text-text">{x(M.finance_import_history)}</h2>
        {state.importSessions.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_import_no_history)}</p>
        ) : (
          <table className="w-full text-[12px] text-text">
            <thead>
              <tr className="text-left text-text-muted">
                <th className="pb-[6px] pr-[10px]">{x(M.finance_import_file_name)}</th>
                <th className="pb-[6px] pr-[10px]">{x(M.finance_import_date)}</th>
                <th className="pb-[6px] pr-[10px]">{x(M.finance_import_rows)}</th>
                <th className="pb-[6px] pr-[10px]">{x(M.finance_import_new)}</th>
                <th className="pb-[6px] pr-[10px]">{x(M.finance_import_dupes)}</th>
                <th className="pb-[6px] pr-[10px]">{x(M.finance_import_errors)}</th>
                <th className="pb-[6px]"></th>
              </tr>
            </thead>
            <tbody>
              {state.importSessions.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="py-[6px] pr-[10px] font-semibold">{s.fileName}</td>
                  <td className="py-[6px] pr-[10px] text-text-muted">
                    {s.importedAt.slice(0, 10)}
                  </td>
                  <td className="py-[6px] pr-[10px]">{s.totalRows}</td>
                  <td className="py-[6px] pr-[10px]">{s.newItems}</td>
                  <td className="py-[6px] pr-[10px]">{s.duplicates}</td>
                  <td className="py-[6px] pr-[10px]">{s.errors}</td>
                  <td className="py-[6px]">
                    {canWrite && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteSession(s)}
                        className="rounded-[6px] p-[4px] text-text-muted hover:bg-risk-bg hover:text-risk-fg"
                        title={x(M.finance_import_delete)}
                        aria-label={x(M.finance_import_delete)}
                      >
                        <Trash2 size={14} strokeWidth={1.9} aria-hidden="true" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      {showWizard && selectedAccountId && (
        <BulkImportWizard
          adapter={createBankStatementBulkImportAdapter(selectedAccountId, importBankStatement)}
          onClose={() => {
            setShowWizard(false)
            setImportResult(null)
            setImportErrorDetails([])
          }}
        />
      )}
    </div>
  )
}

/* ---------- Category rule form ---------- */

function CategoryRuleForm({
  state,
  onAdd,
  onCancel,
}: {
  state: import('../data/types').FinanceWorkspaceState
  onAdd: (rule: Omit<import('../data/types').FinanceCategoryRule, 'id'>) => Promise<unknown>
  onCancel: () => void
}) {
  const { x } = useI18n()
  const [pattern, setPattern] = useState('')
  const [matchType, setMatchType] = useState<FinanceCategoryMatchType>('contains')
  const [ledgerAccountId, setLedgerAccountId] = useState('')
  const [direction, setDirection] = useState<'debit' | 'credit'>('debit')
  const [priority, setPriority] = useState('50')

  const entityId = state.entities[0]?.id ?? ''

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pattern || !ledgerAccountId) return
    void onAdd({
      entityId,
      pattern,
      matchType,
      ledgerAccountId,
      direction,
      priority: Number.parseInt(priority, 10) || 0,
      active: true,
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-[12px] flex flex-col gap-[8px] rounded-[10px] bg-inset p-[12px]"
    >
      <div className="flex flex-wrap gap-[8px]">
        <input
          type="text"
          placeholder={x(M.finance_rules_pattern)}
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          className="flex-1 rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[12px] text-text"
          required
        />
        <select
          value={matchType}
          onChange={(e) => setMatchType(e.target.value as FinanceCategoryMatchType)}
          className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[12px] text-text"
        >
          {(Object.keys(CATEGORY_MATCH_TYPE_LABEL) as FinanceCategoryMatchType[]).map((mt) => (
            <option key={mt} value={mt}>
              {x(CATEGORY_MATCH_TYPE_LABEL[mt])}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-[8px]">
        <select
          value={ledgerAccountId}
          onChange={(e) => setLedgerAccountId(e.target.value)}
          className="flex-1 rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[12px] text-text"
          required
        >
          <option value="">—</option>
          {state.ledgerAccounts.map((la) => (
            <option key={la.id} value={la.id}>
              {la.code} — {la.name.en}
            </option>
          ))}
        </select>
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value as 'debit' | 'credit')}
          className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[12px] text-text"
        >
          <option value="debit">Debit</option>
          <option value="credit">Credit</option>
        </select>
        <input
          type="number"
          placeholder={x(M.finance_rules_priority)}
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-[80px] rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[12px] text-text"
        />
      </div>
      <div className="flex gap-[6px]">
        <button
          type="submit"
          className="rounded-[6px] bg-navy px-[10px] py-[4px] text-[12px] font-semibold text-white hover:opacity-90"
        >
          {x(M.finance_rules_add)}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[6px] bg-surface px-[10px] py-[4px] text-[12px] font-semibold text-text-2 hover:bg-inset border border-border"
        >
          {x(M.finance_cancel)}
        </button>
      </div>
    </form>
  )
}
