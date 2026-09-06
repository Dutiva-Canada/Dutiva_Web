import { useMemo, useState } from 'react'
import { statusChipClass } from '@/components/chips'
import { useI18n } from '@/i18n/context'
import { financeMessages as M } from '@/i18n/messages/finance'
import { useFinanceData } from '../data/useFinanceData'
import { deadlineState } from '../data/productionApi'
import { CURRENCY_LABEL, OBLIGATION_STATUS_LABEL, TAX_TYPE_LABEL } from '../financeLabels'
import type { FinanceObligationStatus } from '../data/types'

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
  const { state, canWrite, transitionObligationStatus, transitionExternalActionStatus, markTaxScenarioStale, transitionTaxScenarioStatus } = useFinanceData()
  const [filter, setFilter] = useState<'all' | FinanceObligationStatus>('all')

  const obligations = useMemo(
    () => (filter === 'all' ? state.taxObligations : state.taxObligations.filter((o) => o.status === filter)),
    [state.taxObligations, filter],
  )

  return (
    <div className="flex flex-col gap-[16px]">
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_tax_obligations)}</h2>
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
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_tax_scenarios)}</h2>
        {state.taxScenarios.length === 0 ? (
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
