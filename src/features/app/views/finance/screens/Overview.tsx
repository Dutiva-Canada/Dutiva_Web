import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { statusChipClass } from '@/components/chips'
import { useI18n } from '@/i18n/context'
import { financeMessages as M } from '@/i18n/messages/finance'
import { useFinanceData } from '../data/useFinanceData'
import { deadlineState } from '../data/productionApi'
import { REQUEST_STATUS_LABEL } from '../financeLabels'

export function Overview() {
  const { x } = useI18n()
  const { state, canWrite, transitionSpendRequestStatus } = useFinanceData()

  const kpis = useMemo(() => {
    const outstandingAR = state.invoices
      .filter((inv) => inv.status === 'issued' || inv.status === 'partial' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + Number(inv.total) - Number(inv.paidAmount), 0)
    const outstandingAP = state.bills
      .filter((b) => b.status === 'posted' || b.status === 'partial')
      .reduce((sum, b) => sum + Number(b.total) - Number(b.paidAmount), 0)
    const cashOnHand = state.bankAccounts.reduce((sum, acc) => sum + Number(acc.earmarkedAmount ?? '0'), 0)
    const monthlyBurn = state.expenses
      .filter((e) => e.status === 'approved' || e.status === 'reimbursed')
      .reduce((sum, e) => sum + Number(e.amount), 0)
    return { outstandingAR, outstandingAP, cashOnHand, monthlyBurn }
  }, [state.invoices, state.bills, state.bankAccounts, state.expenses])

  const upcomingObligations = useMemo(
    () =>
      [
        ...state.taxObligations.map((o) => ({
          id: o.id,
          dueDate: o.dueDate,
          label: { en: `${o.type} — ${o.period}`, fr: `${o.type} — ${o.period}` },
          amount: o.estimatedAmount,
          currency: o.currency,
        })),
        ...state.payrollLiabilities.map((l) => ({
          id: l.id,
          dueDate: l.dueDate,
          label: { en: `Payroll liability — ${l.type}`, fr: `Passif de paie — ${l.type}` },
          amount: l.amount,
          currency: l.currency,
        })),
      ]
        .filter((o) => o.dueDate)
        .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? '')),
    [state.taxObligations, state.payrollLiabilities],
  )

  const approvalsQueue = useMemo(
    () => state.spendRequests.filter((sr) => sr.status === 'submitted'),
    [state.spendRequests],
  )

  const exceptions = useMemo(
    () => [
      ...state.bankItems.filter((bi) => bi.matchStatus === 'unmatched' || bi.matchStatus === 'exception'),
      ...state.reconciliations.filter((r) => r.status === 'exception'),
      ...state.payRuns.filter((pr) => pr.status === 'exception'),
    ],
    [state.bankItems, state.reconciliations, state.payRuns],
  )

  const cashByAccount = useMemo(
    () => state.bankAccounts.map((acc) => ({
      ...acc,
      earmarked: acc.earmarkedAmount ?? '0.00',
    })),
    [state.bankAccounts],
  )

  const budgetHeadroom = useMemo(() => {
    return state.budgets.flatMap((b) =>
      b.lines.map((line) => ({
        budgetId: b.id,
        budgetLabel: b.label,
        department: line.department ?? line.projectId ?? '—',
        budgeted: Number(line.amount),
        actual: Number(line.actualAmount),
        committed: Number(line.committedAmount),
        headroom: Number(line.amount) - Number(line.actualAmount) - Number(line.committedAmount),
        currency: line.currency,
      })),
    )
  }, [state.budgets])

  return (
    <div className="flex flex-col gap-[16px]">
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_overview_kpis)}</h2>
        <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-4">
          <div className="rounded-[8px] bg-inset px-[12px] py-[10px]">
            <div className="text-[12px] text-text-muted">{x(M.finance_overview_cash_total)}</div>
            <div className="mt-[4px] text-[16px] font-semibold text-text">CAD {kpis.cashOnHand.toFixed(2)}</div>
          </div>
          <div className="rounded-[8px] bg-inset px-[12px] py-[10px]">
            <div className="text-[12px] text-text-muted">{x(M.finance_overview_ar)}</div>
            <div className="mt-[4px] text-[16px] font-semibold text-text">CAD {kpis.outstandingAR.toFixed(2)}</div>
          </div>
          <div className="rounded-[8px] bg-inset px-[12px] py-[10px]">
            <div className="text-[12px] text-text-muted">{x(M.finance_overview_ap)}</div>
            <div className="mt-[4px] text-[16px] font-semibold text-text">CAD {kpis.outstandingAP.toFixed(2)}</div>
          </div>
          <div className="rounded-[8px] bg-inset px-[12px] py-[10px]">
            <div className="text-[12px] text-text-muted">{x(M.finance_overview_burn_rate)}</div>
            <div className="mt-[4px] text-[16px] font-semibold text-text">CAD {kpis.monthlyBurn.toFixed(2)}</div>
          </div>
        </div>
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_overview_cash_position)}</h2>
        {cashByAccount.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_none)}</p>
        ) : (
          <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3 md:grid-cols-4">
            {cashByAccount.map((acc) => (
              <div key={acc.id} className="rounded-[8px] bg-inset px-[12px] py-[10px]">
                <div className="text-[12px] text-text-muted">{x(acc.label)}</div>
                <div className="mt-[4px] text-[14px] font-semibold text-text">
                  {acc.currency} {acc.earmarked}
                </div>
                {acc.restricted && (
                  <div className="mt-[2px] text-[11px] text-text-muted">{x(M.finance_treasury_restricted)}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_overview_upcoming)}</h2>
        {upcomingObligations.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_overview_no_upcoming)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {upcomingObligations.slice(0, 6).map((item) => {
              const dl = deadlineState(item.dueDate)
              return (
                <li key={item.id} className="flex items-start justify-between gap-[12px]">
                  <div>
                    <div className="text-[13px] font-semibold text-text">
                      {x(item.label)}
                    </div>
                    <div className="text-[12px] text-text-muted">
                      {item.dueDate} · {item.currency} {item.amount}
                    </div>
                  </div>
                  <span
                    className={statusChipClass(
                      dl === 'overdue' ? 'risk' : dl === 'due_soon' ? 'warning' : 'neutral',
                    )}
                  >
                    {dl === 'overdue'
                      ? x(M.finance_overdue)
                      : dl === 'due_soon'
                        ? x(M.finance_due_soon)
                        : x(M.finance_due_date)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_overview_approvals)}</h2>
        {approvalsQueue.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_overview_no_approvals)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[12px] p-0">
            {approvalsQueue.map((sr) => (
              <li key={sr.id} className="flex flex-col gap-[8px] rounded-[10px] bg-inset p-[12px]">
                <div className="flex items-start justify-between gap-[12px]">
                  <div>
                    <Link
                      to={`/app/finance/purchases`}
                      className="text-[13px] font-semibold text-accent no-underline hover:underline"
                    >
                      {x(sr.purpose)}
                    </Link>
                    <div className="text-[12px] text-text-muted">
                      {sr.requester} · {sr.currency} {sr.amount}
                    </div>
                  </div>
                  <span className={statusChipClass('warning')}>{x(REQUEST_STATUS_LABEL[sr.status])}</span>
                </div>
                {canWrite && (
                  <div className="flex flex-wrap gap-[6px]">
                    <button
                      type="button"
                      onClick={() => transitionSpendRequestStatus(sr.id, 'approved', 'Workspace user')}
                      className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                    >
                      {x(M.finance_approve)}
                    </button>
                    <button
                      type="button"
                      onClick={() => transitionSpendRequestStatus(sr.id, 'rejected')}
                      className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                    >
                      {x(M.finance_reject)}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_overview_exceptions)}</h2>
        {exceptions.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_overview_no_exceptions)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {exceptions.map((exc, idx) => (
              <li key={idx} className="flex items-start justify-between gap-[12px]">
                <div>
                  <div className="text-[13px] font-semibold text-text">
                    {'description' in exc ? exc.description : 'id' in exc ? exc.id : 'Exception'}
                  </div>
                  {'difference' in exc && (
                    <div className="text-[12px] text-text-muted">
                      {x(M.finance_transactions_difference)}: {exc.difference}
                    </div>
                  )}
                </div>
                <span className={statusChipClass('risk')}>{x(M.finance_overview_exceptions)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_overview_budget_headroom)}</h2>
        {budgetHeadroom.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_none)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {budgetHeadroom.map((line, idx) => (
              <li key={idx} className="flex items-start justify-between gap-[12px]">
                <div>
                  <div className="text-[13px] font-semibold text-text">{line.department}</div>
                  <div className="text-[12px] text-text-muted">
                    {x(M.finance_plans_budgeted)}: {line.currency} {line.budgeted.toFixed(2)} ·{' '}
                    {x(M.finance_plans_actual)}: {line.currency} {line.actual.toFixed(2)} ·{' '}
                    {x(M.finance_plans_committed)}: {line.currency} {line.committed.toFixed(2)}
                  </div>
                </div>
                <span
                  className={statusChipClass(line.headroom < 0 ? 'risk' : line.headroom < line.budgeted * 0.15 ? 'warning' : 'success')}
                >
                  {x(M.finance_plans_headroom)}: {line.currency} {line.headroom.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_overview_data_freshness)}</h2>
        <div className="text-[13px] text-text-muted">
          {state.books.map((book) => (
            <div key={book.id}>
              {x(book.label)} — {x(M.finance_accounting_authoritative_source)}: {x(book.authoritativeSource)}
              {book.lastSyncedAt && ` · ${x(M.finance_accounting_last_synced)}: ${book.lastSyncedAt}`}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
