import { useMemo, useState } from 'react'
import { statusChipClass } from '@/components/chips'
import { useI18n } from '@/i18n/context'
import { financeMessages as M } from '@/i18n/messages/finance'
import { useFinanceData } from '../data/useFinanceData'
import { BANK_MATCH_LABEL, CURRENCY_LABEL } from '../financeLabels'
import type { FinanceBankMatchStatus } from '../data/types'

const FILTERS: ('all' | FinanceBankMatchStatus)[] = ['all', 'unmatched', 'suggested', 'matched', 'exception']

export function Transactions() {
  const { x } = useI18n()
  const { state } = useFinanceData()
  const [filter, setFilter] = useState<'all' | FinanceBankMatchStatus>('all')

  const bankItems = useMemo(
    () => (filter === 'all' ? state.bankItems : state.bankItems.filter((bi) => bi.matchStatus === filter)),
    [state.bankItems, filter],
  )

  return (
    <div className="flex flex-col gap-[16px]">
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_transactions_bank_items)}</h2>
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
              {f === 'all' ? x(M.finance_filter_all) : x(BANK_MATCH_LABEL[f])}
            </button>
          ))}
        </div>
        {bankItems.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_transactions_no_bank_items)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {bankItems.map((bi) => (
              <li key={bi.id} className="flex items-start justify-between gap-[12px]">
                <div>
                  <div className="text-[13px] font-semibold text-text">{bi.description}</div>
                  <div className="text-[12px] text-text-muted">
                    {bi.date} · {x(CURRENCY_LABEL[bi.currency])} {bi.amount}
                  </div>
                </div>
                <span
                  className={statusChipClass(
                    bi.matchStatus === 'matched' ? 'success' : bi.matchStatus === 'exception' ? 'risk' : 'warning',
                  )}
                >
                  {x(BANK_MATCH_LABEL[bi.matchStatus])}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_transactions_reconciliations)}</h2>
        {state.reconciliations.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_none)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {state.reconciliations.map((rec) => (
              <li key={rec.id} className="flex items-start justify-between gap-[12px]">
                <div className="flex flex-col gap-[2px]">
                  <div className="text-[13px] font-semibold text-text">
                    {x(M.finance_transactions_opening)}: {rec.openingBalance} → {x(M.finance_transactions_closing)}: {rec.closingBalance}
                  </div>
                  <div className="text-[12px] text-text-muted">
                    {x(M.finance_transactions_difference)}: {rec.difference}
                    {rec.reviewer && ` · ${x(M.finance_transactions_reviewer)}: ${rec.reviewer}`}
                  </div>
                </div>
                <span
                  className={statusChipClass(
                    rec.status === 'reconciled' ? 'success' : rec.status === 'exception' ? 'risk' : 'warning',
                  )}
                >
                  {rec.status === 'reconciled'
                    ? 'Reconciled'
                    : rec.status === 'exception'
                      ? 'Exception'
                      : 'In progress'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
