import { Download, FileUp, Sparkles, Trash2, Wand2 } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { financeMessages as M } from '@/i18n/messages/finance'
import { useFinanceData } from '../data/useFinanceData'
import { CATEGORY_MATCH_TYPE_LABEL } from '../financeLabels'
import { createBankStatementBulkImportAdapter } from '../bulkImport/bankStatementAdapter'
import { BulkImportWizard } from '@/features/app/bulkImport/BulkImportWizard'
import { CategoryRuleForm } from './CategoryRuleForm'
import { useImportExportActions } from './useImportExportActions'

export function ImportExport() {
  const { x } = useI18n()
  const { mode } = useWorkspaceMode()
  const finance = useFinanceData()
  const {
    state,
    canWrite,
    importBankStatement,
    updateCategoryRule,
    removeCategoryRule,
    updateAiImportSettings,
  } = finance

  const a = useImportExportActions({ finance })

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
              value={a.selectedAccountId}
              onChange={(e) => a.setSelectedAccountId(e.target.value)}
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
            ref={a.fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={(e) => {
              void a.handleFileSelect(e)
            }}
            disabled={!canWrite || !a.selectedAccountId}
            className="text-[12px] text-text-2"
          />
          <p className="text-[11px] text-text-muted">{x(M.finance_import_xlsx_supported)}</p>
          {!canWrite && mode === 'demo' && (
            <p className="text-[12px] text-risk-fg">{x(M.finance_import_demo_disabled)}</p>
          )}
          {!canWrite && mode !== 'demo' && (
            <p className="text-[12px] text-text-muted">{x(M.finance_import_select_account_first)}</p>
          )}
          {canWrite && !a.selectedAccountId && (
            <p className="text-[12px] text-text-muted">{x(M.finance_import_select_account_first)}</p>
          )}
          {a.selectedFileName && (
            <div className="text-[12px] text-text-muted">
              {x(M.finance_import_file_selected)}: {a.selectedFileName}
            </div>
          )}

          {canWrite && a.selectedAccountId && (
            <button
              type="button"
              onClick={() => a.setShowWizard(true)}
              className="flex items-center gap-[6px] self-start rounded-[8px] bg-surface px-[14px] py-[7px] text-[12.5px] font-semibold text-text-2 hover:bg-inset border border-border"
            >
              <Wand2 size={14} strokeWidth={1.9} aria-hidden="true" />
              {x(M.finance_import_bulk_wizard)}
            </button>
          )}
          {canWrite && a.selectedAccountId && a.fileContent && (
            <button
              type="button"
              onClick={a.handleImport}
              className="flex items-center gap-[6px] self-start rounded-[8px] bg-navy px-[14px] py-[7px] text-[12.5px] font-semibold text-white hover:opacity-90"
            >
              <FileUp size={14} strokeWidth={1.9} aria-hidden="true" />
              {x(M.finance_import_process)}
            </button>
          )}
          {!canWrite && (
            <p className="text-[12px] text-text-muted">{x(M.finance_import_no_account)}</p>
          )}
          {a.importError && (
            <div className="rounded-[8px] bg-risk-bg px-[10px] py-[8px] text-[12px] text-risk-fg">
              {a.importError}
            </div>
          )}
          {a.importResult && (
            <div className="flex flex-col gap-[8px] rounded-[8px] bg-inset px-[10px] py-[8px] text-[12px] text-text">
              <span>{a.importResult}</span>
              {state.aiImportSettings.aiImportEnabled && !a.aiImportResult && state.ledgerAccounts.length === 0 && (
                <span className="text-text-muted">{x(M.finance_ai_import_no_ledger)}</span>
              )}
              {a.importErrorDetails.length > 0 && (
                <div className="flex flex-col gap-[8px]">
                  <div className="flex flex-wrap gap-[8px]">
                    <button
                      type="button"
                      onClick={() => a.setShowErrorDetails((v) => !v)}
                      className="rounded-[6px] bg-surface px-[8px] py-[4px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                    >
                      {x(M.finance_import_view_errors)}
                    </button>
                    <button
                      type="button"
                      onClick={a.downloadErrorReport}
                      className="rounded-[6px] bg-surface px-[8px] py-[4px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                    >
                      {x(M.finance_import_download_errors)}
                    </button>
                  </div>
                  {a.showErrorDetails && (
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
                        {a.importErrorDetails.map((err) => (
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
          {a.aiImportResult && (
            <div className="rounded-[8px] bg-inset px-[10px] py-[8px] text-[12px] text-text">
              {a.aiImportResult}
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
              onClick={a.handleAutoCategorize}
              disabled={a.unmatchedCount === 0 || !a.hasRules}
              className="flex items-center gap-[6px] rounded-[8px] bg-navy px-[14px] py-[7px] text-[12.5px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              <Sparkles size={14} strokeWidth={1.9} aria-hidden="true" />
              {x(M.finance_categorize_run)}
            </button>
          )}
          <span className="text-[12px] text-text-muted">
            {a.unmatchedCount} unmatched
          </span>
        </div>
        {a.categorizeResult && (
          <div className="mt-[8px] rounded-[8px] bg-inset px-[10px] py-[8px] text-[12px] text-text">
            {a.categorizeResult}
          </div>
        )}
        {!a.hasRules && canWrite && (
          <div className="mt-[8px] rounded-[8px] bg-inset px-[10px] py-[8px] text-[12px] text-text-muted">
            {x(M.finance_categorize_no_rules)}
          </div>
        )}
      </section>

      {/* AI import settings */}
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[8px] text-[15px] font-semibold text-text">{x(M.finance_ai_settings_title)}</h2>
        <p className="mb-[12px] text-[13px] text-text-muted">{x(M.finance_ai_settings_description)}</p>
        <div className="flex flex-col gap-[10px]">
          <label className="flex items-center gap-[8px] text-[13px] text-text-2">
            <input
              type="checkbox"
              checked={state.aiImportSettings.aiImportEnabled}
              onChange={async (e) => {
                await updateAiImportSettings({ aiImportEnabled: e.target.checked })
              }}
              disabled={!canWrite}
              className="h-[14px] w-[14px] accent-navy"
            />
            {x(M.finance_ai_settings_enable)}
          </label>
          <div className="flex items-center gap-[10px]">
            <label className="text-[12px] font-semibold text-text-2">{x(M.finance_ai_settings_mode)}</label>
            <select
              value={state.aiImportSettings.aiImportMode}
              onChange={async (e) => {
                await updateAiImportSettings({
                  aiImportMode: e.target.value as 'suggest' | 'auto_high' | 'auto_all',
                })
              }}
              disabled={!canWrite || !state.aiImportSettings.aiImportEnabled}
              className="rounded-[6px] border border-border bg-inset px-[8px] py-[4px] text-[12px] text-text"
            >
              <option value="suggest">{x(M.finance_ai_settings_mode_suggest)}</option>
              <option value="auto_high">{x(M.finance_ai_settings_mode_auto_high)}</option>
              <option value="auto_all">{x(M.finance_ai_settings_mode_auto_all)}</option>
            </select>
          </div>
        </div>
      </section>

      {/* Category rules section */}
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[8px] flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-text">{x(M.finance_rules_title)}</h2>
            <p className="mt-[2px] text-[12px] text-text-muted">{x(M.finance_rules_description)}</p>
          </div>
          <div className="flex items-center gap-[8px]">
            {canWrite && (
              <>
                <button
                  type="button"
                  onClick={a.handleSuggestRules}
                  disabled={a.suggesting || a.unmatchedCount === 0}
                  className="flex items-center gap-[4px] rounded-[8px] bg-navy px-[10px] py-[5px] text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  <Sparkles size={12} strokeWidth={1.9} aria-hidden="true" />
                  {x(M.finance_suggest_rules)}
                </button>
                <label className="flex items-center gap-[4px] text-[11px] text-text-2">
                  <input
                    type="checkbox"
                    checked={a.useAiSuggestions}
                    onChange={(e) => a.setUseAiSuggestions(e.target.checked)}
                    className="h-[14px] w-[14px] accent-navy"
                  />
                  {x(M.finance_suggest_rules_ai_toggle)}
                </label>
              </>
            )}
            {canWrite && (
              <button
                type="button"
                onClick={a.handleSeedDefaultRules}
                className="rounded-[8px] bg-navy px-[10px] py-[5px] text-[12px] font-semibold text-white hover:opacity-90"
              >
                {x(M.finance_rules_seed)}
              </button>
            )}
            {canWrite && (
              <button
                type="button"
                onClick={() => a.setShowRuleForm((v) => !v)}
                className="rounded-[8px] bg-surface px-[10px] py-[5px] text-[12px] font-semibold text-text-2 hover:bg-inset border border-border"
              >
                {x(M.finance_rules_add)}
              </button>
            )}
          </div>
        </div>

        {a.showRuleForm && canWrite && (
          <CategoryRuleForm
            state={state}
            onAdd={async (rule) => {
              await finance.addCategoryRule(rule)
              a.setShowRuleForm(false)
            }}
            onCancel={() => a.setShowRuleForm(false)}
          />
        )}

        {a.seedRulesResult && (
          <div className="mb-[8px] rounded-[8px] bg-inset px-[10px] py-[8px] text-[12px] text-text">
            {a.seedRulesResult}
          </div>
        )}

        {a.suggesting && (
          <div className="mb-[8px] rounded-[8px] bg-inset px-[10px] py-[8px] text-[12px] text-text-muted">
            {x(a.useAiSuggestions ? M.finance_suggest_rules_ai_loading : M.finance_suggest_rules_loading)}
          </div>
        )}

        {a.suggestResult && !a.suggesting && (
          <div className="mb-[8px] flex flex-col gap-[4px] rounded-[8px] bg-inset px-[10px] py-[8px] text-[12px] text-text">
            <span>{a.suggestResult}</span>
            {a.suggestions.length === 0 && (
              <span className="text-text-muted">{x(M.finance_suggest_rules_none_detail)}</span>
            )}
          </div>
        )}

        {a.suggestions.length > 0 && (
          <div className="mb-[12px] flex flex-col gap-[8px]">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-text">{x(M.finance_suggest_rules)}</h3>
              <button
                type="button"
                onClick={a.handleAddAllSuggestions}
                className="rounded-[6px] bg-navy px-[8px] py-[4px] text-[11px] font-semibold text-white hover:opacity-90"
              >
                {x(M.finance_suggest_rules_add_all)}
              </button>
            </div>
            <ul className="m-0 flex flex-col gap-[8px] p-0">
              {a.suggestions.map((suggestion) => (
                <li
                  key={`${suggestion.pattern}-${suggestion.ledgerAccountId}`}
                  className="flex flex-col gap-[4px] rounded-[10px] border border-border bg-surface p-[10px]"
                >
                  <div className="flex items-center justify-between gap-[8px]">
                    <div className="text-[13px] font-semibold text-text">{suggestion.pattern}</div>
                    <div className="flex items-center gap-[6px]">
                      <button
                        type="button"
                        onClick={() => a.handleAddSuggestion(suggestion)}
                        className="rounded-[6px] bg-navy px-[8px] py-[4px] text-[11px] font-semibold text-white hover:opacity-90"
                      >
                        {x(M.finance_suggest_rules_add)}
                      </button>
                      <button
                        type="button"
                        onClick={() => a.handleIgnoreSuggestion(suggestion)}
                        className="rounded-[6px] bg-surface px-[8px] py-[4px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                      >
                        {x(M.finance_suggest_rules_ignore)}
                      </button>
                    </div>
                  </div>
                  <div className="text-[12px] text-text-muted">
                    {suggestion.accountName} · {suggestion.direction} · {x(M.finance_suggest_rules_from).replace('{count}', String(suggestion.count))}
                  </div>
                  <div className="text-[11px] text-text-muted">
                    {x(a.CONFIDENCE_MESSAGES[suggestion.confidence])} · {suggestion.sampleDescriptions.slice(0, 3).join(' · ')}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {state.categoryRules.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_rules_no_rules)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[8px] p-0">
            {[...state.categoryRules]
              .sort((ruleA, ruleB) => ruleB.priority - ruleA.priority)
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
            onClick={() => a.handleExport(0)}
            className="flex items-center gap-[6px] rounded-[8px] bg-surface px-[12px] py-[6px] text-[12.5px] font-semibold text-text-2 hover:bg-inset border border-border"
          >
            <Download size={14} strokeWidth={1.9} aria-hidden="true" />
            {x(M.finance_export_bank_items)}
          </button>
          <button
            type="button"
            onClick={() => a.handleExport(1)}
            className="flex items-center gap-[6px] rounded-[8px] bg-surface px-[12px] py-[6px] text-[12.5px] font-semibold text-text-2 hover:bg-inset border border-border"
          >
            <Download size={14} strokeWidth={1.9} aria-hidden="true" />
            {x(M.finance_export_journals)}
          </button>
          <button
            type="button"
            onClick={() => a.handleExport(2)}
            className="flex items-center gap-[6px] rounded-[8px] bg-surface px-[12px] py-[6px] text-[12.5px] font-semibold text-text-2 hover:bg-inset border border-border"
          >
            <Download size={14} strokeWidth={1.9} aria-hidden="true" />
            {x(M.finance_export_invoices)}
          </button>
          <button
            type="button"
            onClick={() => a.handleExport(3)}
            className="flex items-center gap-[6px] rounded-[8px] bg-surface px-[12px] py-[6px] text-[12.5px] font-semibold text-text-2 hover:bg-inset border border-border"
          >
            <Download size={14} strokeWidth={1.9} aria-hidden="true" />
            {x(M.finance_export_bills)}
          </button>
          <button
            type="button"
            onClick={() => a.handleExport(4)}
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
                        onClick={() => void a.handleDeleteSession(s)}
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
      {a.showWizard && a.selectedAccountId && (
        <BulkImportWizard
          adapter={createBankStatementBulkImportAdapter(a.selectedAccountId, importBankStatement)}
          onClose={a.closeWizard}
        />
      )}
    </div>
  )
}
