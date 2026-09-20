import { useState } from 'react'
import { Building2, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { financeMessages as M } from '@/i18n/messages/finance'
import { bulkImportMessages as B } from '@/i18n/messages/bulkImport'
import { statusChipClass } from '@/components/chips'
import { useFinanceData } from '../data/useFinanceData'
import { BulkImportWizard } from '@/features/app/bulkImport/BulkImportWizard'
import { createEntityBulkImportAdapter } from '../bulkImport/entityAdapter'
import type { FinanceCurrency, FinanceLegalEntity, FinanceLegalForm } from '../data/types'

const LEGAL_FORMS: FinanceLegalForm[] = [
  'corporation',
  'partnership',
  'sole_proprietor',
  'nonprofit',
]
const CURRENCIES: FinanceCurrency[] = ['CAD', 'USD', 'EUR', 'GBP']
const JURISDICTIONS = [
  'CA-AB',
  'CA-BC',
  'CA-MB',
  'CA-NB',
  'CA-NL',
  'CA-NS',
  'CA-NT',
  'CA-NU',
  'CA-ON',
  'CA-PE',
  'CA-QC',
  'CA-SK',
  'CA-YT',
]
const shortCode = (code: string) => code.replace('CA-', '')

export function Entities() {
  const { x } = useI18n()
  const { state, canWrite, addEntity, updateEntity, removeEntity } = useFinanceData()
  const [form, setForm] = useState<
    { mode: 'add' } | { mode: 'edit'; entity: FinanceLegalEntity } | null
  >(null)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const entityAdapter = createEntityBulkImportAdapter(addEntity)

  return (
    <div className="flex flex-col gap-[16px]">
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-text">{x(M.finance_entity_title)}</h2>
          {canWrite && (
            <div className="flex items-center gap-[8px]">
              <button
                type="button"
                onClick={() => setShowBulkImport(true)}
                className="flex items-center gap-[6px] rounded-[6px] border border-border bg-surface px-[10px] py-[5px] text-[12px] font-semibold text-text-2 hover:bg-inset"
              >
                <Upload size={13} />
                {x(B.bulk_import_title)}
              </button>
              <button
                type="button"
                onClick={() => setForm({ mode: 'add' })}
                className="flex items-center gap-[6px] rounded-[6px] bg-navy px-[10px] py-[5px] text-[12px] font-semibold text-white"
              >
                <Plus size={13} />
                {x(M.finance_entity_create)}
              </button>
            </div>
          )}
        </div>
        {showBulkImport && (
          <BulkImportWizard adapter={entityAdapter} onClose={() => setShowBulkImport(false)} />
        )}
        {form && canWrite && (
          <EntityForm
            key={form.mode === 'edit' ? form.entity.id : 'add'}
            initial={form.mode === 'edit' ? form.entity : undefined}
            onSubmit={async (ent) => {
              if (form.mode === 'edit') {
                const updated = await updateEntity(form.entity.id, ent)
                if (!updated) {
                  throw new Error('updateEntity returned null')
                }
                setForm(null)
              } else {
                const created = await addEntity(ent)
                if (!created) {
                  throw new Error('addEntity returned null')
                }
                setForm(null)
              }
            }}
            onCancel={() => setForm(null)}
          />
        )}
        {state.entities.length === 0 && !form ? (
          <div className="rounded-[10px] bg-inset px-[12px] py-[20px] text-center">
            <Building2 size={18} className="mx-auto mb-[6px] text-text-faint" aria-hidden />
            <p className="m-0 text-[13px] text-text-muted">{x(M.finance_entity_empty)}</p>
          </div>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {state.entities.map((ent) => (
              <li
                key={ent.id}
                className="flex items-start justify-between gap-[8px] rounded-[10px] bg-inset px-[12px] py-[10px]"
              >
                <div className="flex min-w-0 flex-col gap-[4px]">
                  <div className="flex flex-wrap items-center gap-[8px]">
                    <span className="text-[13px] font-semibold text-text">{ent.legalName}</span>
                    <span className={statusChipClass(ent.active ? 'success' : 'neutral')}>
                      {x(ent.active ? M.finance_entity_active : M.finance_entity_inactive)}
                    </span>
                  </div>
                  <div className="text-[12px] text-text-muted">
                    {x(M[`finance_entity_legal_form_${ent.legalForm}` as keyof typeof M])} ·{' '}
                    {ent.fiscalYearStart} · {ent.functionalCurrency}
                  </div>
                  {ent.jurisdictions.length > 0 && (
                    <div className="flex flex-wrap gap-[4px]">
                      {ent.jurisdictions.map((code) => (
                        <span
                          key={code}
                          title={code}
                          className="rounded-[5px] border border-border bg-surface px-[6px] py-[1px] text-[11px] font-semibold text-text-muted"
                        >
                          {shortCode(code)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {canWrite && (
                  <div className="flex items-center gap-[4px]">
                    <button
                      type="button"
                      onClick={() => setForm({ mode: 'edit', entity: ent })}
                      className="rounded-[6px] p-[4px] text-text-muted hover:bg-inset hover:text-text"
                      aria-label={x(M.finance_entity_edit)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm(x(M.finance_entity_remove_confirm))) return
                        await removeEntity(ent.id)
                      }}
                      className="rounded-[6px] p-[4px] text-text-muted hover:bg-inset hover:text-red-600"
                      aria-label={x(M.finance_entity_remove)}
                    >
                      <Trash2 size={14} />
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

function EntityForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: FinanceLegalEntity
  onSubmit: (ent: Omit<FinanceLegalEntity, 'id'>) => Promise<unknown>
  onCancel: () => void
}) {
  const { x } = useI18n()
  const [legalName, setLegalName] = useState(initial?.legalName ?? '')
  const [legalForm, setLegalForm] = useState<FinanceLegalForm>(initial?.legalForm ?? 'corporation')
  const [fiscalYearStart, setFiscalYearStart] = useState(initial?.fiscalYearStart ?? '')
  const [functionalCurrency, setFunctionalCurrency] = useState<FinanceCurrency>(
    initial?.functionalCurrency ?? 'CAD',
  )
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>(
    initial?.jurisdictions ?? [],
  )
  const [accountingSourceId, setAccountingSourceId] = useState(initial?.accountingSourceId ?? '')
  const [payrollSourceId, setPayrollSourceId] = useState(initial?.payrollSourceId ?? '')
  const [active, setActive] = useState(initial?.active ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleJurisdictionToggle = (code: string) => {
    setSelectedJurisdictions((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        legalName,
        legalForm,
        fiscalYearStart,
        functionalCurrency,
        jurisdictions: selectedJurisdictions,
        accountingSourceId: accountingSourceId || undefined,
        payrollSourceId: payrollSourceId || undefined,
        active,
      })
    } catch {
      setError(x(M.finance_entity_save_failed))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-[12px] flex flex-col gap-[14px] rounded-[10px] border border-border bg-inset p-[12px]"
    >
      <div className="text-[13px] font-semibold text-text">
        {initial ? x(M.finance_entity_edit_title) : x(M.finance_entity_create)}
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_entity_legal_name)}</span>
          <input
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
            required
          />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_entity_legal_form)}</span>
          <select
            value={legalForm}
            onChange={(e) => setLegalForm(e.target.value as FinanceLegalForm)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          >
            {LEGAL_FORMS.map((form) => (
              <option key={form} value={form}>
                {x(M[`finance_entity_legal_form_${form}` as keyof typeof M])}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">
            {x(M.finance_entity_fiscal_year_start)}
          </span>
          <input
            type="date"
            value={fiscalYearStart}
            onChange={(e) => setFiscalYearStart(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
            required
          />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">
            {x(M.finance_entity_functional_currency)}
          </span>
          <select
            value={functionalCurrency}
            onChange={(e) => setFunctionalCurrency(e.target.value as FinanceCurrency)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          >
            {CURRENCIES.map((cur) => (
              <option key={cur} value={cur}>
                {cur}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-col gap-[6px]">
        <span className="text-[12px] text-text-muted">{x(M.finance_entity_jurisdictions)}</span>
        <div className="flex flex-wrap gap-[6px]">
          {JURISDICTIONS.map((code) => {
            const on = selectedJurisdictions.includes(code)
            return (
              <button
                key={code}
                type="button"
                aria-pressed={on}
                title={code}
                onClick={() => handleJurisdictionToggle(code)}
                className={`rounded-[100px] px-[11px] py-[4px] text-[12px] font-semibold transition-colors ${
                  on
                    ? 'bg-navy text-white'
                    : 'border border-border bg-surface text-text-2 hover:bg-inset'
                }`}
              >
                {shortCode(code)}
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex flex-col gap-[6px]">
        <span className="text-[12px] text-text-muted">{x(M.finance_entity_integrations)}</span>
        <div className="grid grid-cols-2 gap-[10px]">
          <label className="flex flex-col gap-[4px]">
            <span className="text-[12px] text-text-muted">
              {x(M.finance_entity_accounting_source_id)}
            </span>
            <input
              value={accountingSourceId}
              onChange={(e) => setAccountingSourceId(e.target.value)}
              className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
            />
          </label>
          <label className="flex flex-col gap-[4px]">
            <span className="text-[12px] text-text-muted">
              {x(M.finance_entity_payroll_source_id)}
            </span>
            <input
              value={payrollSourceId}
              onChange={(e) => setPayrollSourceId(e.target.value)}
              className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
            />
          </label>
        </div>
      </div>
      {error && <p className="m-0 text-[12px] text-red-600">{error}</p>}
      <div className="flex items-center justify-between gap-[8px]">
        <label className="flex items-center gap-[8px]">
          <ActiveSwitch
            on={active}
            label={x(M.finance_entity_active)}
            onToggle={() => setActive((v) => !v)}
          />
          <span className="text-[12px] text-text-muted">{x(M.finance_entity_active)}</span>
        </label>
        <div className="flex gap-[8px]">
          <button
            type="button"
            disabled={saving}
            onClick={onCancel}
            className="rounded-[6px] border border-border bg-surface px-[12px] py-[5px] text-[12px] font-semibold text-text-2 disabled:opacity-60"
          >
            {x(M.finance_cancel)}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-[6px] bg-navy px-[12px] py-[5px] text-[12px] font-semibold text-white disabled:opacity-60"
          >
            {x(M.finance_save)}
          </button>
        </div>
      </div>
    </form>
  )
}

/** Same 38×22 switch as the Settings preference toggles (prototype buildToggleStyle). */
function ActiveSwitch({
  on,
  label,
  onToggle,
}: {
  readonly on: boolean
  readonly label: string
  readonly onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={`relative h-[22px] w-[38px] shrink-0 cursor-pointer rounded-[100px] border-none transition-colors duration-150 ${
        on ? 'bg-navy' : 'bg-border'
      }`}
    >
      <div
        className={`absolute top-[3px] h-[16px] w-[16px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-[left] duration-150 ${
          on ? 'left-[19px]' : 'left-[3px]'
        }`}
      />
    </button>
  )
}
