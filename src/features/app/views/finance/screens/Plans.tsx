import { statusChipClass } from '@/components/chips'
import { useI18n } from '@/i18n/context'
import { financeMessages as M } from '@/i18n/messages/finance'
import { useFinanceData } from '../data/useFinanceData'
import { BUDGET_STATUS_LABEL, CURRENCY_LABEL, SCENARIO_TYPE_LABEL } from '../financeLabels'

export function Plans() {
  const { x } = useI18n()
  const { state, canWrite, reviseBudget } = useFinanceData()

  return (
    <div className="flex flex-col gap-[16px]">
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_plans_budgets)}</h2>
        {state.budgets.length === 0 ? (
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
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => reviseBudget(bud.id, bud.lines)}
                    className="mt-[8px] rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                  >
                    {x(M.finance_plans_revise)}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_plans_scenarios)}</h2>
        {state.scenarios.length === 0 ? (
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
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_plans_forecasts)}</h2>
        {state.forecasts.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_none)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[12px] p-0">
            {state.forecasts.map((fc) => (
              <li key={fc.id} className="rounded-[10px] bg-inset p-[12px]">
                <div className="text-[13px] font-semibold text-text">{x(fc.label)}</div>
                <div className="text-[12px] text-text-muted">
                  {fc.type} · {x(CURRENCY_LABEL[fc.currency])} · {x(M.finance_owner)}: {fc.owner}
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
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
