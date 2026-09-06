import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { statusChipClass } from '@/components/chips'
import { useI18n } from '@/i18n/context'
import { financeMessages as M } from '@/i18n/messages/finance'
import { useFinanceData } from '../data/useFinanceData'
import { CURRENCY_LABEL, INVOICE_STATUS_LABEL } from '../financeLabels'
import type { FinanceCurrency, FinanceInvoiceStatus } from '../data/types'

const FILTERS: ('all' | FinanceInvoiceStatus)[] = [
  'all', 'draft', 'issued', 'partial', 'paid', 'overdue', 'disputed', 'written_off', 'cancelled',
]

const VALID_TRANSITIONS: Record<FinanceInvoiceStatus, { status: FinanceInvoiceStatus; label: keyof typeof M }[]> = {
  draft: [{ status: 'issued', label: 'finance_invoice_issue' }, { status: 'cancelled', label: 'finance_invoice_cancel' }],
  issued: [
    { status: 'paid', label: 'finance_invoice_mark_paid' },
    { status: 'partial', label: 'finance_invoice_mark_partial' },
    { status: 'disputed', label: 'finance_invoice_dispute' },
    { status: 'overdue', label: 'finance_invoice_mark_overdue' },
    { status: 'cancelled', label: 'finance_invoice_cancel' },
  ],
  partial: [
    { status: 'paid', label: 'finance_invoice_mark_paid' },
    { status: 'disputed', label: 'finance_invoice_dispute' },
    { status: 'cancelled', label: 'finance_invoice_cancel' },
  ],
  paid: [],
  overdue: [
    { status: 'paid', label: 'finance_invoice_mark_paid' },
    { status: 'disputed', label: 'finance_invoice_dispute' },
    { status: 'cancelled', label: 'finance_invoice_cancel' },
  ],
  disputed: [
    { status: 'issued', label: 'finance_invoice_issue' },
    { status: 'written_off', label: 'finance_invoice_write_off' },
    { status: 'cancelled', label: 'finance_invoice_cancel' },
  ],
  written_off: [],
  cancelled: [],
}

export function Sales() {
  const { x } = useI18n()
  const { state, canWrite, transitionInvoiceStatus, addInvoice } = useFinanceData()
  const [filter, setFilter] = useState<'all' | FinanceInvoiceStatus>('all')
  const [showForm, setShowForm] = useState(false)

  const invoices = useMemo(
    () => (filter === 'all' ? state.invoices : state.invoices.filter((inv) => inv.status === filter)),
    [state.invoices, filter],
  )

  const customerName = (id: string) => state.parties.find((p) => p.id === id)?.name ?? id

  return (
    <div className="flex flex-col gap-[16px]">
      {canWrite && (
        <section className="rounded-[12px] border border-border bg-surface p-[16px]">
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-[6px] text-[13px] font-semibold text-accent"
          >
            <Plus size={14} />
            {x(M.finance_invoice_create)}
          </button>
          {showForm && (
            <InvoiceForm
              onSubmit={(inv) => {
                addInvoice(inv)
                setShowForm(false)
              }}
              onCancel={() => setShowForm(false)}
              entities={state.entities}
              customers={state.parties.filter((p) => p.type === 'customer')}
            />
          )}
        </section>
      )}

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
          <ul className="m-0 flex flex-col gap-[12px] p-0">
            {invoices.map((inv) => {
              const outstanding = Number(inv.total) - Number(inv.paidAmount)
              return (
                <li key={inv.id} className="flex flex-col gap-[8px] rounded-[10px] bg-inset p-[12px]">
                  <div className="flex items-start justify-between gap-[12px]">
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
                  </div>
                  {canWrite && VALID_TRANSITIONS[inv.status].length > 0 && (
                    <div className="flex flex-wrap gap-[6px]">
                      {VALID_TRANSITIONS[inv.status].map((t) => (
                        <button
                          key={t.status}
                          type="button"
                          onClick={() => transitionInvoiceStatus(inv.id, t.status)}
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

function InvoiceForm({
  onSubmit,
  onCancel,
  entities,
  customers,
}: {
  onSubmit: (inv: Omit<import('../data/types').FinanceInvoice, 'id'>) => void
  onCancel: () => void
  entities: import('../data/types').FinanceLegalEntity[]
  customers: import('../data/types').FinanceParty[]
}) {
  const { x } = useI18n()
  const [entityId, setEntityId] = useState(entities[0]?.id ?? '')
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '')
  const [number, setNumber] = useState('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState('')
  const [subtotal, setSubtotal] = useState('0.00')
  const [taxTotal, setTaxTotal] = useState('0.00')
  const [currency] = useState<FinanceCurrency>('CAD')

  const total = (Number(subtotal) + Number(taxTotal)).toFixed(2)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      entityId,
      customerId,
      number: number || `INV-${Date.now()}`,
      issueDate,
      dueDate: dueDate || issueDate,
      currency,
      subtotal: Number(subtotal).toFixed(2),
      taxTotal: Number(taxTotal).toFixed(2),
      total,
      paidAmount: '0.00',
      status: 'draft',
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-[12px] flex flex-col gap-[10px] rounded-[10px] bg-inset p-[12px]">
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
          <span className="text-[12px] text-text-muted">{x(M.finance_invoice_customer)}</span>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]">
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_invoice_number)}</span>
          <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder={`INV-${Date.now()}`} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_invoice_issue_date)}</span>
          <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
      </div>
      <div className="grid grid-cols-3 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_invoice_due_date)}</span>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_invoice_subtotal)}</span>
          <input value={subtotal} onChange={(e) => setSubtotal(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_invoice_tax)}</span>
          <input value={taxTotal} onChange={(e) => setTaxTotal(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-text">{x(M.finance_invoice_total)}: {currency} {total}</span>
        <div className="flex gap-[8px]">
          <button type="button" onClick={onCancel} className="rounded-[6px] bg-inset px-[12px] py-[5px] text-[12px] font-semibold text-text-2 border border-border">
            {x(M.finance_cancel)}
          </button>
          <button type="submit" className="rounded-[6px] bg-navy px-[12px] py-[5px] text-[12px] font-semibold text-white">
            {x(M.finance_save)}
          </button>
        </div>
      </div>
    </form>
  )
}
