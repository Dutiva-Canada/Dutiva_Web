import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { financeMessages as M } from '@/i18n/messages/finance'
import { useFinanceData } from '../data/useFinanceData'
import type { FinanceCurrency, FinanceLegalEntity, FinanceLegalForm } from '../data/types'

const LEGAL_FORMS: FinanceLegalForm[] = ['corporation', 'partnership', 'sole_proprietor', 'nonprofit']
const CURRENCIES: FinanceCurrency[] = ['CAD', 'USD', 'EUR', 'GBP']
const JURISDICTIONS = ['CA-AB', 'CA-BC', 'CA-MB', 'CA-NB', 'CA-NL', 'CA-NS', 'CA-NT', 'CA-NU', 'CA-ON', 'CA-PE', 'CA-QC', 'CA-SK', 'CA-YT']

export function Entities() {
  const { x } = useI18n()
  const { state, canWrite, addEntity } = useFinanceData()
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="flex flex-col gap-[16px]">
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-text">{x(M.finance_entity_title)}</h2>
          {canWrite && (
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-[6px] text-[13px] font-semibold text-accent"
            >
              <Plus size={14} />
              {x(M.finance_entity_create)}
            </button>
          )}
        </div>
        {showForm && canWrite && (
          <EntityForm
            onSubmit={async (ent) => {
              try {
                const created = await addEntity(ent)
                if (!created) {
                  throw new Error('addEntity returned null')
                }
                setShowForm(false)
              } catch {
                throw new Error('save failed')
              }
            }}
            onCancel={() => setShowForm(false)}
          />
        )}
        {state.entities.length === 0 && !showForm ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_none)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {state.entities.map((ent) => (
              <li key={ent.id} className="flex flex-col gap-[2px]">
                <div className="text-[13px] font-semibold text-text">{ent.legalName}</div>
                <div className="text-[12px] text-text-muted">
                  {x(M[`finance_entity_legal_form_${ent.legalForm}` as keyof typeof M])} · {ent.fiscalYearStart} · {ent.functionalCurrency}
                  {ent.jurisdictions.length > 0 && ` · ${ent.jurisdictions.join(', ')}`}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function EntityForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (ent: Omit<FinanceLegalEntity, 'id'>) => Promise<unknown>
  onCancel: () => void
}) {
  const { x } = useI18n()
  const [legalName, setLegalName] = useState('')
  const [legalForm, setLegalForm] = useState<FinanceLegalForm>('corporation')
  const [fiscalYearStart, setFiscalYearStart] = useState('')
  const [functionalCurrency, setFunctionalCurrency] = useState<FinanceCurrency>('CAD')
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>([])
  const [accountingSourceId, setAccountingSourceId] = useState('')
  const [payrollSourceId, setPayrollSourceId] = useState('')
  const [active, setActive] = useState(true)
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
      // onSubmit closes the form on success; if it does not throw but still
      // returns an error-like value, keep the form open.
    } catch {
      setError(x(M.finance_entity_save_failed))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-[12px] flex flex-col gap-[10px] rounded-[10px] bg-inset p-[12px]">
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
          <span className="text-[12px] text-text-muted">{x(M.finance_entity_fiscal_year_start)}</span>
          <input
            type="date"
            value={fiscalYearStart}
            onChange={(e) => setFiscalYearStart(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
            required
          />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_entity_functional_currency)}</span>
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
        <div className="flex flex-wrap gap-[8px]">
          {JURISDICTIONS.map((code) => (
            <label key={code} className="flex items-center gap-[4px] text-[12px] text-text">
              <input
                type="checkbox"
                checked={selectedJurisdictions.includes(code)}
                onChange={() => handleJurisdictionToggle(code)}
              />
              {code}
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_entity_accounting_source_id)}</span>
          <input
            value={accountingSourceId}
            onChange={(e) => setAccountingSourceId(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_entity_payroll_source_id)}</span>
          <input
            value={payrollSourceId}
            onChange={(e) => setPayrollSourceId(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          />
        </label>
      </div>
      <label className="flex items-center gap-[6px]">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        <span className="text-[12px] text-text-muted">{x(M.finance_entity_active)}</span>
      </label>
      {error && <p className="text-[12px] text-red-600">{error}</p>}
      <div className="flex justify-end gap-[8px]">
        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className="rounded-[6px] border border-border bg-inset px-[12px] py-[5px] text-[12px] font-semibold text-text-2 disabled:opacity-60"
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
    </form>
  )
}
