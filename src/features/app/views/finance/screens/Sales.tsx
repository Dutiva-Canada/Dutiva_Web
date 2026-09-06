import { useMemo, useState } from 'react'
import { statusChipClass } from '@/components/chips'
import { useI18n } from '@/i18n/context'
import { financeMessages as M } from '@/i18n/messages/finance'
import { useFinanceData } from '../data/useFinanceData'
import { CURRENCY_LABEL, INVOICE_STATUS_LABEL } from '../financeLabels'
import type { FinanceInvoiceStatus } from '../data/types'

const FILTERS: ('all' | FinanceInvoiceStatus)[] = [
  'all', 'draft', 'issued', 'partial', 'paid', 'overdue', 'disputed', 'written_off', 'cancelled',
]

export function Sales() {
  const { x } = useI18n()
  const { state } = useFinanceData()
  const [filter, setFilter] = useState<'all' | FinanceInvoiceStatus>('all')

  const invoices = useMemo(
    () => (filter === 'all' ? state.invoices : state.invoices.filter((inv) => inv.status === filter)),
    [state.invoices, filter],
  )

  const customerName = (id: string) => state.parties.find((p) => p.id === id)?.name ?? id

  return (
    <div className="flex flex-col gap-[16px]">
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_sales_invoices)}</h2>
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
              {f === 'all' ? x(M.finance_filter_all) : x(INVOICE_STATUS_LABEL[f])}
            </button>
          ))}
        </div>
        {invoices.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_no_results)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {invoices.map((inv) => {
              const outstanding = Number(inv.total) - Number(inv.paidAmount)
              return (
                <li key={inv.id} className="flex items-start justify-between gap-[12px]">
                  <div>
                    <div className="text-[13px] font-semibold text-text">{inv.number}</div>
                    <div className="text-[12px] text-text-muted">
                      {customerName(inv.customerId)} · {inv.issueDate} · {x(M.finance_due_date)}: {inv.dueDate}
                    </div>
                    <div className="text-[12px] text-text-muted">
                      {x(M.finance_sales_total)}: {x(CURRENCY_LABEL[inv.currency])} {inv.total} ·{' '}
                      {x(M.finance_sales_paid)}: {inv.paidAmount} ·{' '}
                      {x(M.finance_sales_outstanding)}: {outstanding.toFixed(2)}
                    </div>
                  </div>
                  <span
                    className={statusChipClass(
                      inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'risk' : 'neutral',
                    )}
                  >
                    {x(INVOICE_STATUS_LABEL[inv.status])}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_sales_credits)}</h2>
        {state.credits.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_none)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {state.credits.map((cr) => (
              <li key={cr.id} className="flex items-start justify-between gap-[12px]">
                <div>
                  <div className="text-[13px] font-semibold text-text">{cr.number}</div>
                  <div className="text-[12px] text-text-muted">
                    {cr.date} · {x(CURRENCY_LABEL[cr.currency])} {cr.amount} · {x(cr.reason)}
                  </div>
                </div>
                <span className={statusChipClass(cr.status === 'applied' ? 'success' : 'neutral')}>
                  {cr.status === 'applied' ? 'Applied' : cr.status === 'cancelled' ? 'Cancelled' : 'Open'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
