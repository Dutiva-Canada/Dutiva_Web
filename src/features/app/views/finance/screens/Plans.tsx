import { useState } from 'react'
import { Plus } from 'lucide-react'
import { statusChipClass } from '@/components/chips'
import { useI18n } from '@/i18n/context'
import { financeMessages as M } from '@/i18n/messages/finance'
import { useFinanceData } from '../data/useFinanceData'
import { BUDGET_STATUS_LABEL, CURRENCY_LABEL, SCENARIO_TYPE_LABEL } from '../financeLabels'
import type { FinanceBudgetLine, FinanceCurrency, FinanceForecastPeriod, FinanceScenarioType } from '../data/types'

export function Plans() {
  const { x } = useI18n()
  const {
    state, canWrite, reviseBudget, addBudget, transitionBudgetStatus,
    addScenario, transitionScenarioStatus, addForecast, freezeForecast, updateForecastPeriods,
  } = useFinanceData()
  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [showScenarioForm, setShowScenarioForm] = useState(false)
  const [showForecastForm, setShowForecastForm] = useState(false)
  const [reviseTarget, setReviseTarget] = useState<string | null>(null)
  const [reviseLines, setReviseLines] = useState<FinanceBudgetLine[]>([])
  const [periodEditTarget, setPeriodEditTarget] = useState<string | null>(null)
  const [periodDrafts, setPeriodDrafts] = useState<FinanceForecastPeriod[]>([])

  return (
    <div className="flex flex-col gap-[16px]">
      {/* Budget variance summary */}
      {state.budgets.length > 0 && (
        <section className="rounded-[12px] border border-border bg-surface p-[16px]">
          <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_variance_title)}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-text-muted">
                  <th className="pb-[6px] pr-[12px]">{x(M.finance_variance_department)}</th>
                  <th className="pb-[6px] pr-[12px]">{x(M.finance_variance_period)}</th>
                  <th className="pb-[6px] pr-[12px] text-right">{x(M.finance_variance_budgeted)}</th>
                  <th className="pb-[6px] pr-[12px] text-right">{x(M.finance_variance_actual)}</th>
                  <th className="pb-[6px] pr-[12px] text-right">{x(M.finance_variance_committed)}</th>
                  <th className="pb-[6px] pr-[12px] text-right">{x(M.finance_variance_headroom)}</th>
                  <th className="pb-[6px] text-right">{x(M.finance_variance_pct)}</th>
                </tr>
              </thead>
              <tbody>
                {state.budgets.flatMap((bud) =>
                  bud.lines.map((line) => {
                    const headroom = Number(line.amount) - Number(line.actualAmount) - Number(line.committedAmount)
                    const usedPct = Number(line.amount) > 0
                      ? ((Number(line.actualAmount) + Number(line.committedAmount)) / Number(line.amount)) * 100
                      : 0
                    return (
                      <tr key={`${bud.id}-${line.id}`} className="border-t border-border">
                        <td className="py-[6px] pr-[12px] text-text">{line.department ?? line.projectId ?? '—'}</td>
                        <td className="py-[6px] pr-[12px] text-text-muted">{line.period}</td>
                        <td className="py-[6px] pr-[12px] text-right text-text-muted">{line.amount}</td>
                        <td className="py-[6px] pr-[12px] text-right text-text-muted">{line.actualAmount}</td>
                        <td className="py-[6px] pr-[12px] text-right text-text-muted">{line.committedAmount}</td>
                        <td className={`py-[6px] pr-[12px] text-right font-semibold ${headroom < 0 ? 'text-risk-fg' : 'text-success-fg'}`}>
                          {headroom.toFixed(2)}
                        </td>
                        <td className={`py-[6px] text-right ${usedPct > 100 ? 'text-risk-fg font-semibold' : usedPct > 85 ? 'text-warning-fg' : 'text-text-muted'}`}>
                          {usedPct.toFixed(0)}%
                        </td>
                      </tr>
                    )
                  }),
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Cash-flow projection */}
      {state.forecasts.length > 0 && (
        <section className="rounded-[12px] border border-border bg-surface p-[16px]">
          <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_cashflow_title)}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-text-muted">
                  <th className="pb-[6px] pr-[12px]">{x(M.finance_cashflow_period)}</th>
                  <th className="pb-[6px] pr-[12px] text-right">{x(M.finance_cashflow_inflow)}</th>
                  <th className="pb-[6px] pr-[12px] text-right">{x(M.finance_cashflow_outflow)}</th>
                  <th className="pb-[6px] pr-[12px] text-right">{x(M.finance_cashflow_net)}</th>
                  <th className="pb-[6px] text-right">{x(M.finance_cashflow_closing)}</th>
                </tr>
              </thead>
              <tbody>
                {state.forecasts.flatMap((fc) =>
                  fc.periods.map((p, idx) => (
                    <tr key={`${fc.id}-${idx}`} className="border-t border-border">
                      <td className="py-[6px] pr-[12px] text-text">{p.label}</td>
                      <td className="py-[6px] pr-[12px] text-right text-text-muted">{p.inflow}</td>
                      <td className="py-[6px] pr-[12px] text-right text-text-muted">{p.outflow}</td>
                      <td className={`py-[6px] pr-[12px] text-right font-semibold ${Number(p.net) < 0 ? 'text-risk-fg' : 'text-success-fg'}`}>
                        {p.net}
                      </td>
                      <td className="py-[6px] text-right text-text-muted">{p.closingBalance}</td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Budgets */}
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-text">{x(M.finance_plans_budgets)}</h2>
          {canWrite && (
            <button
              type="button"
              onClick={() => setShowBudgetForm((v) => !v)}
              className="flex items-center gap-[6px] text-[13px] font-semibold text-accent"
            >
              <Plus size={14} />
              {x(M.finance_budget_create)}
            </button>
          )}
        </div>
        {showBudgetForm && canWrite && (
          <BudgetForm
            onSubmit={(bud) => {
              addBudget(bud)
              setShowBudgetForm(false)
            }}
            onCancel={() => setShowBudgetForm(false)}
            entities={state.entities}
          />
        )}
        {state.budgets.length === 0 && !showBudgetForm ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_plans_no_budgets)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[12px] p-0">
            {state.budgets.map((bud) => (
              <li key={bud.id} className="rounded-[10px] bg-inset p-[12px]">
                <div className="flex items-start justify-between gap-[12px]">
                  <div>
                    <div className="text-[13px] font-semibold text-text">{x(bud.label)}</div>
                    <div className="text-[12px] text-text-muted">
                      {x(M.finance_plans_version)}: {bud.version} · {x(M.finance_owner)}: {bud.owner} ·{' '}
                      {x(CURRENCY_LABEL[bud.currency])}
                    </div>
                  </div>
                  <span className={statusChipClass(bud.status === 'approved' ? 'success' : 'warning')}>
                    {x(BUDGET_STATUS_LABEL[bud.status])}
                  </span>
                </div>
                <ul className="m-0 mt-[8px] flex flex-col gap-[4px] p-0">
                  {bud.lines.map((line) => {
                    const headroom = Number(line.amount) - Number(line.actualAmount) - Number(line.committedAmount)
                    return (
                      <li key={line.id} className="flex items-center justify-between text-[12px] text-text-muted">
                        <span>{line.department ?? line.projectId ?? '—'} · {line.period}</span>
                        <span>
                          {x(M.finance_plans_budgeted)}: {line.amount} · {x(M.finance_plans_actual)}: {line.actualAmount} ·{' '}
                          {x(M.finance_plans_committed)}: {line.committedAmount} ·{' '}
                          <span className={headroom < 0 ? 'text-risk-fg font-semibold' : 'text-text'}>
                            {x(M.finance_plans_headroom)}: {headroom.toFixed(2)}
                          </span>
                        </span>
                      </li>
                    )
                  })}
                </ul>
                {canWrite && reviseTarget !== bud.id && (
                  <div className="mt-[8px] flex flex-wrap gap-[6px]">
                    <button
                      type="button"
                      onClick={() => {
                        setReviseTarget(bud.id)
                        setReviseLines(bud.lines.map((l) => ({ ...l })))
                      }}
                      className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                    >
                      {x(M.finance_budget_revise_lines)}
                    </button>
                    {bud.status === 'draft' && (
                      <button
                        type="button"
                        onClick={() => transitionBudgetStatus(bud.id, 'approved')}
                        className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                      >
                        {x(M.finance_budget_approve)}
                      </button>
                    )}
                  </div>
                )}
                {canWrite && reviseTarget === bud.id && (
                  <div className="mt-[8px] flex flex-col gap-[8px]">
                    <div className="text-[12px] font-semibold text-text-muted">{x(M.finance_budget_revise_lines)}</div>
                    {reviseLines.map((line, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_1fr_80px_80px_80px] items-center gap-[6px]">
                        <input value={line.department ?? ''} onChange={(e) => setReviseLines((prev) => prev.map((l, i) => i === idx ? { ...l, department: e.target.value } : l))} placeholder={x(M.finance_budget_department)} className="rounded-[6px] border border-border bg-surface px-[6px] py-[3px] text-[12px]" />
                        <input value={line.period} onChange={(e) => setReviseLines((prev) => prev.map((l, i) => i === idx ? { ...l, period: e.target.value } : l))} placeholder={x(M.finance_budget_period)} className="rounded-[6px] border border-border bg-surface px-[6px] py-[3px] text-[12px]" />
                        <input value={line.amount} onChange={(e) => setReviseLines((prev) => prev.map((l, i) => i === idx ? { ...l, amount: e.target.value } : l))} placeholder={x(M.finance_budget_amount)} className="rounded-[6px] border border-border bg-surface px-[6px] py-[3px] text-[12px]" />
                        <input value={line.actualAmount} onChange={(e) => setReviseLines((prev) => prev.map((l, i) => i === idx ? { ...l, actualAmount: e.target.value } : l))} placeholder={x(M.finance_budget_actual_amount)} className="rounded-[6px] border border-border bg-surface px-[6px] py-[3px] text-[12px]" />
                        <input value={line.committedAmount} onChange={(e) => setReviseLines((prev) => prev.map((l, i) => i === idx ? { ...l, committedAmount: e.target.value } : l))} placeholder={x(M.finance_budget_committed_amount)} className="rounded-[6px] border border-border bg-surface px-[6px] py-[3px] text-[12px]" />
                      </div>
                    ))}
                    <div className="flex gap-[6px]">
                      <button
                        type="button"
                        onClick={() => {
                          reviseBudget(bud.id, reviseLines)
                          setReviseTarget(null)
                        }}
                        className="rounded-[6px] bg-navy px-[8px] py-[3px] text-[11px] font-semibold text-white"
                      >
                        {x(M.finance_save)}
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviseTarget(null)}
                        className="rounded-[6px] bg-inset px-[8px] py-[3px] text-[11px] font-semibold text-text-2 border border-border"
                      >
                        {x(M.finance_cancel)}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Scenarios */}
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-text">{x(M.finance_plans_scenarios)}</h2>
          {canWrite && (
            <button
              type="button"
              onClick={() => setShowScenarioForm((v) => !v)}
              className="flex items-center gap-[6px] text-[13px] font-semibold text-accent"
            >
              <Plus size={14} />
              {x(M.finance_scenario_create)}
            </button>
          )}
        </div>
        {showScenarioForm && canWrite && (
          <ScenarioForm
            onSubmit={(scn) => {
              addScenario(scn)
              setShowScenarioForm(false)
            }}
            onCancel={() => setShowScenarioForm(false)}
            entities={state.entities}
          />
        )}
        {state.scenarios.length === 0 && !showScenarioForm ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_plans_no_scenarios)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[12px] p-0">
            {state.scenarios.map((scn) => (
              <li key={scn.id} className="rounded-[10px] bg-inset p-[12px]">
                <div className="flex items-start justify-between gap-[12px]">
                  <div>
                    <div className="text-[13px] font-semibold text-text">{x(scn.label)}</div>
                    <div className="text-[12px] text-text-muted">
                      {x(SCENARIO_TYPE_LABEL[scn.type])} · {x(M.finance_plans_cutoff)}: {scn.cutoffDate}
                    </div>
                  </div>
                  <span
                    className={statusChipClass(
                      scn.status === 'accepted' ? 'success' : scn.status === 'stale' ? 'risk' : 'warning',
                    )}
                  >
                    {scn.status === 'draft' ? 'Draft' : scn.status === 'reviewed' ? 'Reviewed' : scn.status === 'accepted' ? 'Accepted' : x(M.finance_plans_stale)}
                  </span>
                </div>
                <div className="mt-[6px] text-[12px] text-text-muted">{x(scn.assumptions)}</div>
                <div className="mt-[4px] text-[12px] text-text-muted">
                  {x(M.finance_plans_budgeted)}: {x(CURRENCY_LABEL[scn.currency])} {scn.projectedExpense} ·{' '}
                  Cash flow: {scn.projectedCashFlow}
                </div>
                {canWrite && (scn.status === 'draft' || scn.status === 'reviewed') && (
                  <div className="mt-[8px] flex flex-wrap gap-[6px]">
                    {scn.status === 'draft' && (
                      <button
                        type="button"
                        onClick={() => transitionScenarioStatus(scn.id, 'reviewed', 'Workspace user')}
                        className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                      >
                        {x(M.finance_scenario_review)}
                      </button>
                    )}
                    {scn.status === 'reviewed' && (
                      <button
                        type="button"
                        onClick={() => transitionScenarioStatus(scn.id, 'accepted', 'Workspace user')}
                        className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                      >
                        {x(M.finance_scenario_accept)}
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Forecasts */}
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-text">{x(M.finance_plans_forecasts)}</h2>
          {canWrite && (
            <button
              type="button"
              onClick={() => setShowForecastForm((v) => !v)}
              className="flex items-center gap-[6px] text-[13px] font-semibold text-accent"
            >
              <Plus size={14} />
              {x(M.finance_forecast_create)}
            </button>
          )}
        </div>
        {showForecastForm && canWrite && (
          <ForecastForm
            onSubmit={(fc) => {
              addForecast(fc)
              setShowForecastForm(false)
            }}
            onCancel={() => setShowForecastForm(false)}
            entities={state.entities}
            scenarios={state.scenarios}
          />
        )}
        {state.forecasts.length === 0 && !showForecastForm ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_none)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[12px] p-0">
            {state.forecasts.map((fc) => (
              <li key={fc.id} className="rounded-[10px] bg-inset p-[12px]">
                <div className="flex items-start justify-between gap-[12px]">
                  <div>
                    <div className="text-[13px] font-semibold text-text">{x(fc.label)}</div>
                    <div className="text-[12px] text-text-muted">
                      {fc.type} · {x(CURRENCY_LABEL[fc.currency])} · {x(M.finance_owner)}: {fc.owner}
                      {fc.frozenAt && ` · ${fc.frozenAt.slice(0, 10)}`}
                    </div>
                  </div>
                  {fc.frozenAt && (
                    <span className={statusChipClass('neutral')}>{x(M.finance_plan_frozen)}</span>
                  )}
                </div>
                <ul className="m-0 mt-[8px] flex flex-col gap-[4px] p-0">
                  {fc.periods.map((p, idx) => (
                    <li key={idx} className="flex items-center justify-between text-[12px] text-text-muted">
                      <span>{p.label} ({p.startDate} → {p.endDate})</span>
                      <span>
                        In: {p.inflow} · Out: {p.outflow} · Net: {p.net} · Close: {p.closingBalance}
                      </span>
                    </li>
                  ))}
                </ul>
                {canWrite && !fc.frozenAt && periodEditTarget !== fc.id && (
                  <div className="mt-[8px] flex flex-wrap gap-[6px]">
                    <button
                      type="button"
                      onClick={() => {
                        setPeriodEditTarget(fc.id)
                        setPeriodDrafts(fc.periods.length > 0 ? fc.periods.map((p) => ({ ...p })) : [{
                          label: '', startDate: new Date().toISOString().slice(0, 10),
                          endDate: new Date().toISOString().slice(0, 10),
                          inflow: '0.00', outflow: '0.00', net: '0.00', closingBalance: '0.00',
                        }])
                      }}
                      className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                    >
                      {x(M.finance_forecast_save_periods)}
                    </button>
                    <button
                      type="button"
                      onClick={() => freezeForecast(fc.id)}
                      className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                    >
                      {x(M.finance_forecast_freeze)}
                    </button>
                  </div>
                )}
                {canWrite && !fc.frozenAt && periodEditTarget === fc.id && (
                  <div className="mt-[8px] flex flex-col gap-[8px]">
                    {periodDrafts.map((p, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_100px_100px_80px_80px_80px_100px] items-center gap-[4px]">
                        <input value={p.label} onChange={(e) => setPeriodDrafts((prev) => prev.map((pp, i) => i === idx ? { ...pp, label: e.target.value } : pp))} placeholder={x(M.finance_forecast_period_label)} className="rounded-[6px] border border-border bg-surface px-[4px] py-[2px] text-[11px]" />
                        <input type="date" value={p.startDate} onChange={(e) => setPeriodDrafts((prev) => prev.map((pp, i) => i === idx ? { ...pp, startDate: e.target.value } : pp))} className="rounded-[6px] border border-border bg-surface px-[4px] py-[2px] text-[11px]" />
                        <input type="date" value={p.endDate} onChange={(e) => setPeriodDrafts((prev) => prev.map((pp, i) => i === idx ? { ...pp, endDate: e.target.value } : pp))} className="rounded-[6px] border border-border bg-surface px-[4px] py-[2px] text-[11px]" />
                        <input value={p.inflow} onChange={(e) => setPeriodDrafts((prev) => prev.map((pp, i) => i === idx ? { ...pp, inflow: e.target.value } : pp))} placeholder={x(M.finance_forecast_inflow)} className="rounded-[6px] border border-border bg-surface px-[4px] py-[2px] text-[11px]" />
                        <input value={p.outflow} onChange={(e) => setPeriodDrafts((prev) => prev.map((pp, i) => i === idx ? { ...pp, outflow: e.target.value } : pp))} placeholder={x(M.finance_forecast_outflow)} className="rounded-[6px] border border-border bg-surface px-[4px] py-[2px] text-[11px]" />
                        <input value={p.net} onChange={(e) => setPeriodDrafts((prev) => prev.map((pp, i) => i === idx ? { ...pp, net: e.target.value } : pp))} placeholder={x(M.finance_forecast_net)} className="rounded-[6px] border border-border bg-surface px-[4px] py-[2px] text-[11px]" />
                        <input value={p.closingBalance} onChange={(e) => setPeriodDrafts((prev) => prev.map((pp, i) => i === idx ? { ...pp, closingBalance: e.target.value } : pp))} placeholder={x(M.finance_forecast_closing)} className="rounded-[6px] border border-border bg-surface px-[4px] py-[2px] text-[11px]" />
                      </div>
                    ))}
                    <div className="flex gap-[6px]">
                      <button type="button" onClick={() => setPeriodDrafts((prev) => [...prev, { label: '', startDate: new Date().toISOString().slice(0, 10), endDate: new Date().toISOString().slice(0, 10), inflow: '0.00', outflow: '0.00', net: '0.00', closingBalance: '0.00' }])} className="text-[12px] font-semibold text-accent">
                        + {x(M.finance_forecast_add_period)}
                      </button>
                      <button type="button" onClick={() => { updateForecastPeriods(fc.id, periodDrafts); setPeriodEditTarget(null) }} className="rounded-[6px] bg-navy px-[8px] py-[3px] text-[11px] font-semibold text-white">
                        {x(M.finance_save)}
                      </button>
                      <button type="button" onClick={() => setPeriodEditTarget(null)} className="rounded-[6px] bg-inset px-[8px] py-[3px] text-[11px] font-semibold text-text-2 border border-border">
                        {x(M.finance_cancel)}
                      </button>
                    </div>
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

function BudgetForm({
  onSubmit,
  onCancel,
  entities,
}: {
  onSubmit: (bud: Omit<import('../data/types').FinanceBudget, 'id'>) => void
  onCancel: () => void
  entities: import('../data/types').FinanceLegalEntity[]
}) {
  const { x } = useI18n()
  const [entityId, setEntityId] = useState(entities[0]?.id ?? '')
  const [label, setLabel] = useState('')
  const [owner, setOwner] = useState('')
  const [currency] = useState<FinanceCurrency>('CAD')
  const [lines, setLines] = useState<import('../data/types').FinanceBudgetLine[]>([
    { id: `bl-${Date.now()}`, department: '', period: new Date().toISOString().slice(0, 7), amount: '0.00', currency: 'CAD', actualAmount: '0.00', committedAmount: '0.00' },
  ])

  const updateLine = (idx: number, patch: Partial<import('../data/types').FinanceBudgetLine>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  }
  const addLine = () => setLines((prev) => [...prev, { id: `bl-${Date.now()}-${prev.length}`, department: '', period: new Date().toISOString().slice(0, 7), amount: '0.00', currency: 'CAD', actualAmount: '0.00', committedAmount: '0.00' }])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      entityId,
      label: { en: label, fr: label },
      status: 'draft',
      currency,
      lines,
      owner: owner || 'Workspace user',
      version: 1,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mb-[12px] flex flex-col gap-[10px] rounded-[10px] bg-inset p-[12px]">
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_invoice_entity)}</span>
          <select value={entityId} onChange={(e) => setEntityId(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]">
            {entities.map((ent) => (
              <option key={ent.id} value={ent.id}>{ent.legalName}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_budget_label)}</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
      </div>
      <label className="flex flex-col gap-[4px]">
        <span className="text-[12px] text-text-muted">{x(M.finance_budget_owner)}</span>
        <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Workspace user" className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
      </label>
      <div>
        <div className="mb-[6px] text-[12px] font-semibold text-text-muted">{x(M.finance_budget_lines)}</div>
        <div className="flex flex-col gap-[6px]">
          {lines.map((line, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_1fr_100px] items-center gap-[6px]">
              <input value={line.department ?? ''} onChange={(e) => updateLine(idx, { department: e.target.value })} placeholder={x(M.finance_budget_department)} className="rounded-[6px] border border-border bg-surface px-[6px] py-[3px] text-[12px]" />
              <input value={line.period} onChange={(e) => updateLine(idx, { period: e.target.value })} placeholder={x(M.finance_budget_period)} className="rounded-[6px] border border-border bg-surface px-[6px] py-[3px] text-[12px]" />
              <input value={line.amount} onChange={(e) => updateLine(idx, { amount: e.target.value })} placeholder={x(M.finance_budget_amount)} className="rounded-[6px] border border-border bg-surface px-[6px] py-[3px] text-[12px]" />
            </div>
          ))}
        </div>
        <button type="button" onClick={addLine} className="mt-[6px] text-[12px] font-semibold text-accent">
          + {x(M.finance_budget_add_line)}
        </button>
      </div>
      <div className="flex justify-end gap-[8px]">
        <button type="button" onClick={onCancel} className="rounded-[6px] bg-inset px-[12px] py-[5px] text-[12px] font-semibold text-text-2 border border-border">
          {x(M.finance_cancel)}
        </button>
        <button type="submit" className="rounded-[6px] bg-navy px-[12px] py-[5px] text-[12px] font-semibold text-white">
          {x(M.finance_save)}
        </button>
      </div>
    </form>
  )
}

function ScenarioForm({
  onSubmit,
  onCancel,
  entities,
}: {
  onSubmit: (scn: Omit<import('../data/types').FinanceScenario, 'id'>) => void
  onCancel: () => void
  entities: import('../data/types').FinanceLegalEntity[]
}) {
  const { x } = useI18n()
  const [entityId, setEntityId] = useState(entities[0]?.id ?? '')
  const [label, setLabel] = useState('')
  const [type, setType] = useState<FinanceScenarioType>('baseline')
  const [assumptions, setAssumptions] = useState('')
  const [cutoffDate, setCutoffDate] = useState(new Date().toISOString().slice(0, 10))
  const [currency] = useState<FinanceCurrency>('CAD')
  const [projectedRevenue, setProjectedRevenue] = useState('0.00')
  const [projectedExpense, setProjectedExpense] = useState('0.00')
  const [projectedCashFlow, setProjectedCashFlow] = useState('0.00')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      entityId,
      label: { en: label, fr: label },
      type,
      assumptions: { en: assumptions, fr: assumptions },
      cutoffDate,
      currency,
      projectedRevenue: Number(projectedRevenue).toFixed(2),
      projectedExpense: Number(projectedExpense).toFixed(2),
      projectedCashFlow: Number(projectedCashFlow).toFixed(2),
      status: 'draft',
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mb-[12px] flex flex-col gap-[10px] rounded-[10px] bg-inset p-[12px]">
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_invoice_entity)}</span>
          <select value={entityId} onChange={(e) => setEntityId(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]">
            {entities.map((ent) => (
              <option key={ent.id} value={ent.id}>{ent.legalName}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_scenario_type)}</span>
          <select value={type} onChange={(e) => setType(e.target.value as FinanceScenarioType)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]">
            <option value="baseline">{x(M.finance_scenario_type_baseline)}</option>
            <option value="hiring">{x(M.finance_scenario_type_hiring)}</option>
            <option value="capital_purchase">{x(M.finance_scenario_type_capital_purchase)}</option>
            <option value="financing">{x(M.finance_scenario_type_financing)}</option>
            <option value="operating_change">{x(M.finance_scenario_type_operating_change)}</option>
            <option value="tax">{x(M.finance_scenario_type_tax)}</option>
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-[4px]">
        <span className="text-[12px] text-text-muted">{x(M.finance_scenario_label)}</span>
        <input value={label} onChange={(e) => setLabel(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
      </label>
      <label className="flex flex-col gap-[4px]">
        <span className="text-[12px] text-text-muted">{x(M.finance_scenario_assumptions)}</span>
        <input value={assumptions} onChange={(e) => setAssumptions(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
      </label>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_scenario_cutoff)}</span>
          <input type="date" value={cutoffDate} onChange={(e) => setCutoffDate(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_scenario_revenue)}</span>
          <input value={projectedRevenue} onChange={(e) => setProjectedRevenue(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_scenario_expense)}</span>
          <input value={projectedExpense} onChange={(e) => setProjectedExpense(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_scenario_cashflow)}</span>
          <input value={projectedCashFlow} onChange={(e) => setProjectedCashFlow(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
      </div>
      <div className="flex justify-end gap-[8px]">
        <button type="button" onClick={onCancel} className="rounded-[6px] bg-inset px-[12px] py-[5px] text-[12px] font-semibold text-text-2 border border-border">
          {x(M.finance_cancel)}
        </button>
        <button type="submit" className="rounded-[6px] bg-navy px-[12px] py-[5px] text-[12px] font-semibold text-white">
          {x(M.finance_save)}
        </button>
      </div>
    </form>
  )
}

function ForecastForm({
  onSubmit,
  onCancel,
  entities,
  scenarios,
}: {
  onSubmit: (fc: Omit<import('../data/types').FinanceForecast, 'id'>) => void
  onCancel: () => void
  entities: import('../data/types').FinanceLegalEntity[]
  scenarios: import('../data/types').FinanceScenario[]
}) {
  const { x } = useI18n()
  const [entityId, setEntityId] = useState(entities[0]?.id ?? '')
  const [label, setLabel] = useState('')
  const [type, setType] = useState<import('../data/types').FinanceForecast['type']>('monthly_operating')
  const [baselineScenarioId, setBaselineScenarioId] = useState('')
  const [currency] = useState<FinanceCurrency>('CAD')
  const [owner, setOwner] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      entityId,
      label: { en: label, fr: label },
      type,
      baselineScenarioId: baselineScenarioId || undefined,
      currency,
      periods: [],
      owner: owner || 'Workspace user',
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mb-[12px] flex flex-col gap-[10px] rounded-[10px] bg-inset p-[12px]">
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_invoice_entity)}</span>
          <select value={entityId} onChange={(e) => setEntityId(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]">
            {entities.map((ent) => (
              <option key={ent.id} value={ent.id}>{ent.legalName}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_forecast_type)}</span>
          <select value={type} onChange={(e) => setType(e.target.value as import('../data/types').FinanceForecast['type'])} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]">
            <option value="monthly_operating">{x(M.finance_forecast_type_monthly_operating)}</option>
            <option value="13_week_cash">{x(M.finance_forecast_type_13_week_cash)}</option>
            <option value="custom">{x(M.finance_forecast_type_custom)}</option>
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-[4px]">
        <span className="text-[12px] text-text-muted">{x(M.finance_forecast_label)}</span>
        <input value={label} onChange={(e) => setLabel(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
      </label>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_forecast_owner)}</span>
          <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Workspace user" className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">Baseline scenario</span>
          <select value={baselineScenarioId} onChange={(e) => setBaselineScenarioId(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]">
            <option value="">—</option>
            {scenarios.map((scn) => (
              <option key={scn.id} value={scn.id}>{scn.label.en}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex justify-end gap-[8px]">
        <button type="button" onClick={onCancel} className="rounded-[6px] bg-inset px-[12px] py-[5px] text-[12px] font-semibold text-text-2 border border-border">
          {x(M.finance_cancel)}
        </button>
        <button type="submit" className="rounded-[6px] bg-navy px-[12px] py-[5px] text-[12px] font-semibold text-white">
          {x(M.finance_save)}
        </button>
      </div>
    </form>
  )
}
