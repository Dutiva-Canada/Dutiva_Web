import { statusChipClass } from '@/components/chips'
import { useI18n } from '@/i18n/context'
import { financeMessages as M } from '@/i18n/messages/finance'
import { useFinanceData } from '../data/useFinanceData'
import { CURRENCY_LABEL, RESERVE_TYPE_LABEL } from '../financeLabels'

export function Treasury() {
  const { x } = useI18n()
  const { state } = useFinanceData()

  return (
    <div className="flex flex-col gap-[16px]">
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_treasury_accounts)}</h2>
        {state.bankAccounts.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_none)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {state.bankAccounts.map((acc) => (
              <li key={acc.id} className="flex items-start justify-between gap-[12px]">
                <div>
                  <div className="text-[13px] font-semibold text-text">{x(acc.label)}</div>
                  <div className="text-[12px] text-text-muted">
                    {x(CURRENCY_LABEL[acc.currency])}
                    {acc.last4 && ` · ••••${acc.last4}`}
                    {acc.earmarkedAmount && ` · ${x(M.finance_treasury_earmarked)}: ${acc.earmarkedAmount}`}
                    {acc.maturityDate && ` · ${x(M.finance_treasury_maturity)}: ${acc.maturityDate}`}
                  </div>
                </div>
                {acc.restricted && (
                  <span className={statusChipClass('warning')}>{x(M.finance_treasury_restricted)}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_treasury_reserves)}</h2>
        {state.reserveGoals.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_treasury_no_reserves)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {state.reserveGoals.map((rg) => {
              const pct = Number(rg.targetAmount) > 0 ? (Number(rg.currentAmount) / Number(rg.targetAmount)) * 100 : 0
              return (
                <li key={rg.id} className="flex items-start justify-between gap-[12px]">
                  <div>
                    <div className="text-[13px] font-semibold text-text">{x(rg.label)}</div>
                    <div className="text-[12px] text-text-muted">
                      {x(RESERVE_TYPE_LABEL[rg.type])} · {x(M.finance_treasury_current)}: {x(CURRENCY_LABEL[rg.currency])} {rg.currentAmount} /{' '}
                      {x(M.finance_treasury_target)}: {rg.targetAmount} ({pct.toFixed(0)}%)
                      {rg.dueDate && ` · ${x(M.finance_due_date)}: ${rg.dueDate}`}
                    </div>
                  </div>
                  <span className={statusChipClass(pct >= 100 ? 'success' : pct >= 75 ? 'neutral' : 'warning')}>
                    {pct.toFixed(0)}%
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_treasury_holdings)}</h2>
        {state.holdings.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_treasury_no_holdings)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {state.holdings.map((h) => (
              <li key={h.id} className="flex items-start justify-between gap-[12px]">
                <div>
                  <div className="text-[13px] font-semibold text-text">{x(h.label)}</div>
                  <div className="text-[12px] text-text-muted">
                    {x(h.institution)} · {x(M.finance_treasury_cost_basis)}: {x(CURRENCY_LABEL[h.currency])} {h.costBasis} ·{' '}
                    {x(M.finance_treasury_market_value)}: {h.marketValue} · {x(M.finance_treasury_as_of)}: {h.asOfDate}
                  </div>
                  <div className="text-[12px] text-text-muted">
                    {x(M.finance_source)}: {x(h.valuationSource)}
                  </div>
                </div>
                {h.stale && (
                  <span className={statusChipClass('warning')}>{x(M.finance_treasury_stale)}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_treasury_debt)}</h2>
        {state.debts.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_treasury_no_debt)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {state.debts.map((d) => (
              <li key={d.id} className="flex items-start justify-between gap-[12px]">
                <div>
                  <div className="text-[13px] font-semibold text-text">{x(d.label)}</div>
                  <div className="text-[12px] text-text-muted">
                    {x(d.lender)} · {x(M.finance_treasury_balance)}: {x(CURRENCY_LABEL[d.currency])} {d.balance} ·{' '}
                    {x(M.finance_treasury_interest_rate)}: {d.interestRate}% ·{' '}
                    {x(M.finance_treasury_maturity)}: {d.maturityDate}
                  </div>
                </div>
                <span className={statusChipClass(d.status === 'active' ? 'warning' : d.status === 'paid_off' ? 'success' : 'risk')}>
                  {d.status === 'active' ? 'Active' : d.status === 'paid_off' ? 'Paid off' : 'Defaulted'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
