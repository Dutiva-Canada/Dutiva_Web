import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { statusChipClass } from '@/components/chips'
import { useI18n } from '@/i18n/context'
import { financeMessages as M } from '@/i18n/messages/finance'
import { useFinanceData } from '../data/useFinanceData'
import { deadlineState } from '../data/productionApi'
import { CURRENCY_LABEL, OBLIGATION_STATUS_LABEL, TAX_TYPE_LABEL } from '../financeLabels'
import type { FinanceCurrency, FinanceObligationStatus, FinanceTaxType } from '../data/types'

const FILTERS: ('all' | FinanceObligationStatus)[] = [
  'all', 'planned', 'in_preparation', 'reviewed', 'filed', 'paid', 'confirmed', 'overdue', 'withdrawn',
]

const VALID_TRANSITIONS: Record<FinanceObligationStatus, { status: FinanceObligationStatus; label: keyof typeof M }[]> = {
  planned: [{ status: 'in_preparation', label: 'finance_tax_mark_in_preparation' }, { status: 'withdrawn', label: 'finance_tax_mark_withdrawn' }],
  in_preparation: [{ status: 'reviewed', label: 'finance_tax_mark_reviewed' }],
  reviewed: [{ status: 'filed', label: 'finance_tax_mark_filed' }],
  filed: [{ status: 'paid', label: 'finance_tax_mark_paid' }],
  paid: [{ status: 'confirmed', label: 'finance_tax_mark_confirmed' }],
  confirmed: [],
  overdue: [{ status: 'in_preparation', label: 'finance_tax_mark_in_preparation' }, { status: 'filed', label: 'finance_tax_mark_filed' }],
  withdrawn: [{ status: 'planned', label: 'finance_tax_mark_in_preparation' }],
}

export function Tax() {
  const { x } = useI18n()
  const { state, canWrite, addTaxObligation, addTaxScenario, transitionObligationStatus, transitionExternalActionStatus, markTaxScenarioStale, transitionTaxScenarioStatus } = useFinanceData()
  const [filter, setFilter] = useState<'all' | FinanceObligationStatus>('all')
  const [showObligationForm, setShowObligationForm] = useState(false)
  const [showScenarioForm, setShowScenarioForm] = useState(false)

  const obligations = useMemo(
    () => (filter === 'all' ? state.taxObligations : state.taxObligations.filter((o) => o.status === filter)),
    [state.taxObligations, filter],
  )

  return (
    <div className="flex flex-col gap-[16px]">
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-text">{x(M.finance_tax_obligations)}</h2>
          {canWrite && (
            <button type="button" onClick={() => setShowObligationForm((v) => !v)} className="flex items-center gap-[6px] text-[13px] font-semibold text-accent">
              <Plus size={14} />
              {x(M.finance_tax_create_obligation)}
            </button>
          )}
        </div>
        {showObligationForm && canWrite && (
          <TaxObligationForm
            onSubmit={(ob) => { addTaxObligation(ob); setShowObligationForm(false) }}
            onCancel={() => setShowObligationForm(false)}
            entities={state.entities}
          />
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
              {f === 'all' ? x(M.finance_filter_all) : x(OBLIGATION_STATUS_LABEL[f])}
            </button>
          ))}
        </div>
        {obligations.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_tax_no_obligations)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[12px] p-0">
            {obligations.map((ob) => {
              const dl = deadlineState(ob.dueDate)
              return (
                <li key={ob.id} className="rounded-[10px] bg-inset p-[12px]">
                  <div className="flex items-start justify-between gap-[12px]">
                    <div>
                      <div className="text-[13px] font-semibold text-text">
                        {x(TAX_TYPE_LABEL[ob.type])} — {ob.period}
                      </div>
                      <div className="text-[12px] text-text-muted">
                        {x(M.finance_tax_jurisdiction)}: {x(ob.jurisdiction)} ·{' '}
                        {x(M.finance_due_date)}: {ob.dueDate}
                        {ob.paymentDueDate && ob.paymentDueDate !== ob.dueDate && ` · ${x(M.finance_tax_payment_due)}: ${ob.paymentDueDate}`}
                      </div>
                      <div className="text-[12px] text-text-muted">
                        {x(M.finance_tax_estimated)}: {x(CURRENCY_LABEL[ob.currency])} {ob.estimatedAmount}
                        {ob.confirmedAmount && ` · ${x(M.finance_tax_confirmed)}: ${ob.confirmedAmount}`}
                      </div>
                      {ob.preparer && (
                        <div className="text-[12px] text-text-muted">
                          {x(M.finance_tax_preparer)}: {ob.preparer}
                          {ob.reviewer && ` · ${x(M.finance_tax_reviewer)}: ${ob.reviewer}`}
                        </div>
                      )}
                      {ob.filingRef && (
                        <div className="text-[12px] text-text-muted">
                          {x(M.finance_tax_filing_ref)}: {ob.filingRef}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-[6px]">
                      <span
                        className={statusChipClass(
                          ob.status === 'confirmed' ? 'success' : ob.status === 'overdue' ? 'risk' : 'neutral',
                        )}
                      >
                        {x(OBLIGATION_STATUS_LABEL[ob.status])}
                      </span>
                      {dl === 'overdue' && ob.status !== 'confirmed' && ob.status !== 'paid' && (
                        <span className={statusChipClass('risk')}>{x(M.finance_overdue)}</span>
                      )}
                      {dl === 'due_soon' && ob.status !== 'confirmed' && ob.status !== 'paid' && (
                        <span className={statusChipClass('warning')}>{x(M.finance_due_soon)}</span>
                      )}
                    </div>
                  </div>
                  {canWrite && VALID_TRANSITIONS[ob.status].length > 0 && (
                    <div className="mt-[8px] flex flex-wrap gap-[6px]">
                      {VALID_TRANSITIONS[ob.status].map((t) => (
                        <button
                          key={t.status}
                          type="button"
                          onClick={() => transitionObligationStatus(ob.id, t.status, 'Workspace user')}
                          className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                        >
                          {x(M[t.label])}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-text">{x(M.finance_tax_scenarios)}</h2>
          {canWrite && (
            <button type="button" onClick={() => setShowScenarioForm((v) => !v)} className="flex items-center gap-[6px] text-[13px] font-semibold text-accent">
              <Plus size={14} />
              {x(M.finance_tax_create_scenario)}
            </button>
          )}
        </div>
        {showScenarioForm && canWrite && (
          <TaxScenarioForm
            onSubmit={(ts) => { addTaxScenario(ts); setShowScenarioForm(false) }}
            onCancel={() => setShowScenarioForm(false)}
            entities={state.entities}
          />
        )}
        {state.taxScenarios.length === 0 && !showScenarioForm ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_tax_no_scenarios)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[12px] p-0">
            {state.taxScenarios.map((ts) => (
              <li key={ts.id} className="rounded-[10px] bg-inset p-[12px]">
                <div className="flex items-start justify-between gap-[12px]">
                  <div>
                    <div className="text-[13px] font-semibold text-text">{x(ts.label)}</div>
                    <div className="text-[12px] text-text-muted">
                      {x(ts.proposedDecision)}
                    </div>
                    <div className="mt-[4px] text-[12px] text-text-muted">
                      {x(M.finance_tax_estimated)} tax: {x(CURRENCY_LABEL[ts.currency])} {ts.projectedTax} ·{' '}
                      Cash flow: {ts.projectedCashFlow}
                    </div>
                    <div className="text-[12px] text-text-muted">
                      {x(M.finance_plans_assumptions)}: {x(ts.assumptions)}
                    </div>
                    <div className="text-[12px] text-text-muted">
                      {ts.enacted ? x(M.finance_tax_enacted) : x(M.finance_tax_proposed)}: {x(ts.lawVersion)}
                      {ts.reviewer && ` · ${x(M.finance_tax_reviewer)}: ${ts.reviewer}`}
                    </div>
                  </div>
                  <span
                    className={statusChipClass(
                      ts.status === 'accepted' ? 'success' : ts.status === 'stale' ? 'risk' : 'warning',
                    )}
                  >
                    {ts.status === 'draft' ? 'Draft' : ts.status === 'reviewed' ? 'Reviewed' : ts.status === 'accepted' ? 'Accepted' : x(M.finance_plans_stale)}
                  </span>
                </div>
                <div className="mt-[8px] rounded-[6px] border border-border bg-surface px-[10px] py-[6px] text-[11px] text-text-muted">
                  {x(M.finance_tax_disclaimer)}
                </div>
                {canWrite && (ts.status === 'draft' || ts.status === 'reviewed') && (
                  <div className="mt-[8px] flex flex-wrap gap-[6px]">
                    {ts.status === 'draft' && (
                      <button
                        type="button"
                        onClick={() => transitionTaxScenarioStatus(ts.id, 'reviewed', 'Workspace user')}
                        className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                      >
                        {x(M.finance_tax_scenario_review)}
                      </button>
                    )}
                    {ts.status === 'reviewed' && (
                      <>
                        <button
                          type="button"
                          onClick={() => transitionTaxScenarioStatus(ts.id, 'accepted', 'Workspace user')}
                          className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                        >
                          {x(M.finance_tax_scenario_accept)}
                        </button>
                        <button
                          type="button"
                          onClick={() => transitionTaxScenarioStatus(ts.id, 'draft')}
                          className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                        >
                          {x(M.finance_tax_scenario_review)}
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => markTaxScenarioStale(ts.id, 'Facts changed')}
                      className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                    >
                      {x(M.finance_tax_scenario_mark_stale)}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {state.externalActions.length > 0 && (
        <section className="rounded-[12px] border border-border bg-surface p-[16px]">
          <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_tax_external_actions)}</h2>
          <ul className="m-0 flex flex-col gap-[12px] p-0">
            {state.externalActions
              .filter((ea) => ea.recordType === 'filing' || ea.recordType === 'payment')
              .map((ea) => (
                <li key={ea.id} className="flex flex-col gap-[8px] rounded-[10px] bg-inset p-[12px]">
                  <div className="flex items-start justify-between gap-[12px]">
                    <div>
                      <div className="text-[13px] font-semibold text-text">{ea.recordType} · {ea.recordId}</div>
                      <div className="text-[12px] text-text-muted">
                        {ea.providerRef && ` · ${ea.providerRef}`}
                        {ea.confirmedAt && ` · ${ea.confirmedAt}`}
                      </div>
                    </div>
                    <span
                      className={statusChipClass(
                        ea.status === 'settled' || ea.status === 'filing_accepted'
                          ? 'success'
                          : ea.status === 'failed'
                            ? 'risk'
                            : 'neutral',
                      )}
                    >
                      {ea.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {canWrite && ea.status === 'internal_approval' && (
                    <button
                      type="button"
                      onClick={() => transitionExternalActionStatus(ea.id, 'export_prepared')}
                      className="w-fit rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                    >
                      {x(M.finance_external_prepare_export)}
                    </button>
                  )}
                  {canWrite && ea.status === 'export_prepared' && (
                    <button
                      type="button"
                      onClick={() => transitionExternalActionStatus(ea.id, 'provider_accepted')}
                      className="w-fit rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                    >
                      {x(M.finance_external_mark_accepted)}
                    </button>
                  )}
                  {canWrite && ea.status === 'provider_accepted' && (
                    <div className="flex flex-wrap gap-[6px]">
                      <button
                        type="button"
                        onClick={() => transitionExternalActionStatus(ea.id, 'settled')}
                        className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                      >
                        {x(M.finance_external_mark_settled)}
                      </button>
                      <button
                        type="button"
                        onClick={() => transitionExternalActionStatus(ea.id, 'filing_accepted')}
                        className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                      >
                        {x(M.finance_external_mark_accepted)}
                      </button>
                    </div>
                  )}
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function TaxObligationForm({
  onSubmit,
  onCancel,
  entities,
}: {
  onSubmit: (ob: Omit<import('../data/types').FinanceTaxObligation, 'id'>) => void
  onCancel: () => void
  entities: import('../data/types').FinanceLegalEntity[]
}) {
  const { x } = useI18n()
  const [entityId, setEntityId] = useState(entities[0]?.id ?? '')
  const [type, setType] = useState<FinanceTaxType>('gst_hst')
  const [jurisdiction, setJurisdiction] = useState('Ontario')
  const [period, setPeriod] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [paymentDueDate, setPaymentDueDate] = useState('')
  const [estimatedAmount, setEstimatedAmount] = useState('0.00')
  const [currency] = useState<FinanceCurrency>('CAD')
  const [preparer, setPreparer] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      entityId,
      type,
      jurisdiction: { en: jurisdiction, fr: jurisdiction },
      period,
      dueDate,
      paymentDueDate: paymentDueDate || undefined,
      estimatedAmount: Number(estimatedAmount).toFixed(2),
      currency,
      preparer: preparer || undefined,
      status: 'planned',
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mb-[12px] flex flex-col gap-[10px] rounded-[10px] bg-inset p-[12px]">
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_invoice_entity)}</span>
          <select value={entityId} onChange={(e) => setEntityId(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]">
            {entities.map((ent) => <option key={ent.id} value={ent.id}>{ent.legalName}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_tax_type)}</span>
          <select value={type} onChange={(e) => setType(e.target.value as FinanceTaxType)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]">
            <option value="income_tax">{x(M.finance_tax_type_income_tax)}</option>
            <option value="gst_hst">{x(M.finance_tax_type_gst_hst)}</option>
            <option value="qst">{x(M.finance_tax_type_qst)}</option>
            <option value="payroll_source_deductions">{x(M.finance_tax_type_payroll_source_deductions)}</option>
            <option value="employer_contributions">{x(M.finance_tax_type_employer_contributions)}</option>
            <option value="other">{x(M.finance_tax_type_other)}</option>
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_tax_jurisdiction)}</span>
          <input value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_tax_period)}</span>
          <input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Q3 2026" className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_tax_due_date)}</span>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_tax_payment_due)}</span>
          <input type="date" value={paymentDueDate} onChange={(e) => setPaymentDueDate(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_tax_estimated)}</span>
          <input value={estimatedAmount} onChange={(e) => setEstimatedAmount(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_tax_preparer)}</span>
          <input value={preparer} onChange={(e) => setPreparer(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
      </div>
      <div className="flex justify-end gap-[8px]">
        <button type="button" onClick={onCancel} className="rounded-[6px] bg-inset px-[12px] py-[5px] text-[12px] font-semibold text-text-2 border border-border">{x(M.finance_cancel)}</button>
        <button type="submit" className="rounded-[6px] bg-navy px-[12px] py-[5px] text-[12px] font-semibold text-white">{x(M.finance_save)}</button>
      </div>
    </form>
  )
}

function TaxScenarioForm({
  onSubmit,
  onCancel,
  entities,
}: {
  onSubmit: (ts: Omit<import('../data/types').FinanceTaxScenario, 'id'>) => void
  onCancel: () => void
  entities: import('../data/types').FinanceLegalEntity[]
}) {
  const { x } = useI18n()
  const [entityId, setEntityId] = useState(entities[0]?.id ?? '')
  const [label, setLabel] = useState('')
  const [baseline, setBaseline] = useState('')
  const [proposedDecision, setProposedDecision] = useState('')
  const [projectedProfit, setProjectedProfit] = useState('0.00')
  const [projectedTaxableIncome, setProjectedTaxableIncome] = useState('0.00')
  const [projectedTax, setProjectedTax] = useState('0.00')
  const [projectedCashFlow, setProjectedCashFlow] = useState('0.00')
  const [currency] = useState<FinanceCurrency>('CAD')
  const [assumptions, setAssumptions] = useState('')
  const [lawVersion, setLawVersion] = useState('')
  const [enacted, setEnacted] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      entityId,
      label: { en: label, fr: label },
      baseline,
      proposedDecision: { en: proposedDecision, fr: proposedDecision },
      projectedProfit: Number(projectedProfit).toFixed(2),
      projectedTaxableIncome: Number(projectedTaxableIncome).toFixed(2),
      projectedTax: Number(projectedTax).toFixed(2),
      projectedCashFlow: Number(projectedCashFlow).toFixed(2),
      currency,
      assumptions: { en: assumptions, fr: assumptions },
      lawVersion: { en: lawVersion, fr: lawVersion },
      enacted,
      status: 'draft',
      disclaimer: {
        en: 'A tax scenario is a planning record, not a filed return. Estimated reductions are not guaranteed tax savings.',
        fr: 'Un scénario fiscal est un dossier de planification, non une déclaration produite. Les réductions estimées ne sont pas des économies fiscales garanties.',
      },
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mb-[12px] flex flex-col gap-[10px] rounded-[10px] bg-inset p-[12px]">
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_invoice_entity)}</span>
          <select value={entityId} onChange={(e) => setEntityId(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]">
            {entities.map((ent) => <option key={ent.id} value={ent.id}>{ent.legalName}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_tax_scenario_label)}</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_tax_scenario_baseline)}</span>
          <input value={baseline} onChange={(e) => setBaseline(e.target.value)} placeholder="2026 baseline" className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_tax_scenario_law_version)}</span>
          <input value={lawVersion} onChange={(e) => setLawVersion(e.target.value)} placeholder="Enacted 2025 rates" className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
      </div>
      <label className="flex flex-col gap-[4px]">
        <span className="text-[12px] text-text-muted">{x(M.finance_tax_scenario_decision)}</span>
        <input value={proposedDecision} onChange={(e) => setProposedDecision(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
      </label>
      <label className="flex flex-col gap-[4px]">
        <span className="text-[12px] text-text-muted">{x(M.finance_tax_scenario_assumptions)}</span>
        <input value={assumptions} onChange={(e) => setAssumptions(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
      </label>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_tax_scenario_profit)}</span>
          <input value={projectedProfit} onChange={(e) => setProjectedProfit(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_tax_scenario_taxable_income)}</span>
          <input value={projectedTaxableIncome} onChange={(e) => setProjectedTaxableIncome(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_tax_scenario_projected_tax)}</span>
          <input value={projectedTax} onChange={(e) => setProjectedTax(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_tax_scenario_projected_cashflow)}</span>
          <input value={projectedCashFlow} onChange={(e) => setProjectedCashFlow(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
      </div>
      <label className="flex items-center gap-[6px]">
        <input type="checkbox" checked={enacted} onChange={(e) => setEnacted(e.target.checked)} />
        <span className="text-[12px] text-text-muted">{enacted ? x(M.finance_tax_scenario_enacted) : x(M.finance_tax_scenario_proposed)}</span>
      </label>
      <div className="flex justify-end gap-[8px]">
        <button type="button" onClick={onCancel} className="rounded-[6px] bg-inset px-[12px] py-[5px] text-[12px] font-semibold text-text-2 border border-border">{x(M.finance_cancel)}</button>
        <button type="submit" className="rounded-[6px] bg-navy px-[12px] py-[5px] text-[12px] font-semibold text-white">{x(M.finance_save)}</button>
      </div>
    </form>
  )
}
