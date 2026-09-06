import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { statusChipClass } from '@/components/chips'
import { useI18n } from '@/i18n/context'
import { financeMessages as M } from '@/i18n/messages/finance'
import { useFinanceData } from '../data/useFinanceData'
import { CURRENCY_LABEL, REQUEST_STATUS_LABEL } from '../financeLabels'
import type { FinanceBillStatus, FinanceCurrency, FinanceExpenseStatus, FinanceRequestStatus } from '../data/types'

const FILTERS: ('all' | FinanceRequestStatus)[] = [
  'all', 'draft', 'submitted', 'approved', 'rejected', 'committed', 'cancelled',
]

const VALID_TRANSITIONS: Record<FinanceRequestStatus, { status: FinanceRequestStatus; label: keyof typeof M }[]> = {
  draft: [{ status: 'submitted', label: 'finance_purchases_mark_submitted' }, { status: 'cancelled', label: 'finance_purchases_mark_cancelled' }],
  submitted: [{ status: 'approved', label: 'finance_purchases_mark_approved' }, { status: 'rejected', label: 'finance_purchases_mark_rejected' }, { status: 'cancelled', label: 'finance_purchases_mark_cancelled' }],
  approved: [{ status: 'committed', label: 'finance_purchases_mark_committed' }, { status: 'cancelled', label: 'finance_purchases_mark_cancelled' }],
  rejected: [],
  committed: [],
  cancelled: [],
}

const BILL_TRANSITIONS: Record<FinanceBillStatus, { status: FinanceBillStatus; label: keyof typeof M }[]> = {
  draft: [{ status: 'posted', label: 'finance_bill_post' }, { status: 'cancelled', label: 'finance_bill_cancel' }],
  posted: [
    { status: 'paid', label: 'finance_bill_mark_paid' },
    { status: 'partial', label: 'finance_bill_mark_partial' },
    { status: 'overdue', label: 'finance_bill_mark_overdue' },
    { status: 'disputed', label: 'finance_bill_dispute' },
    { status: 'cancelled', label: 'finance_bill_cancel' },
  ],
  partial: [
    { status: 'paid', label: 'finance_bill_mark_paid' },
    { status: 'disputed', label: 'finance_bill_dispute' },
    { status: 'cancelled', label: 'finance_bill_cancel' },
  ],
  paid: [],
  overdue: [
    { status: 'paid', label: 'finance_bill_mark_paid' },
    { status: 'disputed', label: 'finance_bill_dispute' },
    { status: 'cancelled', label: 'finance_bill_cancel' },
  ],
  disputed: [{ status: 'posted', label: 'finance_bill_post' }, { status: 'cancelled', label: 'finance_bill_cancel' }],
  cancelled: [],
}

const EXPENSE_TRANSITIONS: Record<FinanceExpenseStatus, { status: FinanceExpenseStatus; label: keyof typeof M }[]> = {
  draft: [{ status: 'submitted', label: 'finance_expense_submit' }],
  submitted: [{ status: 'approved', label: 'finance_expense_approve' }, { status: 'rejected', label: 'finance_expense_reject' }],
  approved: [{ status: 'reimbursed', label: 'finance_expense_reimburse' }],
  reimbursed: [],
  rejected: [],
}

export function Purchases() {
  const { x } = useI18n()
  const { state, canWrite, transitionSpendRequestStatus, transitionBillStatus, transitionExpenseStatus, addSpendRequest } = useFinanceData()
  const [filter, setFilter] = useState<'all' | FinanceRequestStatus>('all')
  const [showForm, setShowForm] = useState(false)

  const requests = useMemo(
    () => (filter === 'all' ? state.spendRequests : state.spendRequests.filter((sr) => sr.status === filter)),
    [state.spendRequests, filter],
  )

  const supplierName = (id?: string) => (id ? state.parties.find((p) => p.id === id)?.name ?? id : '—')

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
            {x(M.finance_spend_create)}
          </button>
          {showForm && (
            <SpendRequestForm
              onSubmit={(req) => {
                addSpendRequest(req)
                setShowForm(false)
              }}
              onCancel={() => setShowForm(false)}
              entities={state.entities}
              suppliers={state.parties.filter((p) => p.type === 'supplier')}
            />
          )}
        </section>
      )}

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_purchases_requests)}</h2>
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
              {f === 'all' ? x(M.finance_filter_all) : x(REQUEST_STATUS_LABEL[f])}
            </button>
          ))}
        </div>
        {requests.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_purchases_no_requests)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[12px] p-0">
            {requests.map((sr) => (
              <li key={sr.id} className="flex flex-col gap-[8px] rounded-[10px] bg-inset p-[12px]">
                <div className="flex items-start justify-between gap-[12px]">
                  <div>
                    <div className="text-[13px] font-semibold text-text">{x(sr.purpose)}</div>
                    <div className="text-[12px] text-text-muted">
                      {sr.requester} · {supplierName(sr.supplierId)} · {x(CURRENCY_LABEL[sr.currency])} {sr.amount}
                    </div>
                    {sr.approver && (
                      <div className="text-[12px] text-text-muted">
                        {x(M.finance_purchases_approver)}: {sr.approver}
                        {sr.approvedAt && ` · ${sr.approvedAt}`}
                      </div>
                    )}
                  </div>
                  <span
                    className={statusChipClass(
                      sr.status === 'approved' || sr.status === 'committed'
                        ? 'success'
                        : sr.status === 'rejected'
                          ? 'risk'
                          : 'neutral',
                    )}
                  >
                    {x(REQUEST_STATUS_LABEL[sr.status])}
                  </span>
                </div>
                {canWrite && VALID_TRANSITIONS[sr.status].length > 0 && (
                  <div className="flex flex-wrap gap-[6px]">
                    {VALID_TRANSITIONS[sr.status].map((t) => (
                      <button
                        key={t.status}
                        type="button"
                        onClick={() => transitionSpendRequestStatus(sr.id, t.status, 'Workspace user')}
                        className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                      >
                        {x(M[t.label])}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_bills_title)}</h2>
        {state.bills.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_bills_no_bills)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[12px] p-0">
            {state.bills.map((bill) => {
              const outstanding = Number(bill.total) - Number(bill.paidAmount)
              return (
                <li key={bill.id} className="flex flex-col gap-[8px] rounded-[10px] bg-inset p-[12px]">
                  <div className="flex items-start justify-between gap-[12px]">
                    <div>
                      <div className="text-[13px] font-semibold text-text">{bill.number}</div>
                      <div className="text-[12px] text-text-muted">
                        {supplierName(bill.supplierId)} · {bill.issueDate} · {x(M.finance_due_date)}: {bill.dueDate}
                      </div>
                      <div className="text-[12px] text-text-muted">
                        {x(CURRENCY_LABEL[bill.currency])} {bill.total} ·{' '}
                        {x(M.finance_sales_paid)}: {bill.paidAmount} ·{' '}
                        {x(M.finance_sales_outstanding)}: {outstanding.toFixed(2)}
                      </div>
                    </div>
                    <span
                      className={statusChipClass(
                        bill.status === 'paid' ? 'success' : bill.status === 'overdue' ? 'risk' : 'neutral',
                      )}
                    >
                      {bill.status}
                    </span>
                  </div>
                  {canWrite && BILL_TRANSITIONS[bill.status].length > 0 && (
                    <div className="flex flex-wrap gap-[6px]">
                      {BILL_TRANSITIONS[bill.status].map((t) => (
                        <button
                          key={t.status}
                          type="button"
                          onClick={() => transitionBillStatus(bill.id, t.status)}
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
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_purchases_pos)}</h2>
        {state.purchaseOrders.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_none)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {state.purchaseOrders.map((po) => (
              <li key={po.id} className="flex items-start justify-between gap-[12px]">
                <div>
                  <div className="text-[13px] font-semibold text-text">{po.number}</div>
                  <div className="text-[12px] text-text-muted">
                    {supplierName(po.supplierId)} · {po.date} · {x(CURRENCY_LABEL[po.currency])} {po.total}
                  </div>
                </div>
                <span className={statusChipClass(po.status === 'closed' ? 'success' : 'neutral')}>
                  {po.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_purchases_expenses)}</h2>
        {state.expenses.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_none)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[12px] p-0">
            {state.expenses.map((exp) => (
              <li key={exp.id} className="flex flex-col gap-[8px] rounded-[10px] bg-inset p-[12px]">
                <div className="flex items-start justify-between gap-[12px]">
                  <div>
                    <div className="text-[13px] font-semibold text-text">{x(exp.purpose)}</div>
                    <div className="text-[12px] text-text-muted">
                      {exp.requester} · {x(CURRENCY_LABEL[exp.currency])} {exp.amount}
                      {exp.taxable ? ' · Taxable' : ' · Reimbursement'}
                    </div>
                  </div>
                  <span
                    className={statusChipClass(
                      exp.status === 'reimbursed' ? 'success' : exp.status === 'rejected' ? 'risk' : 'warning',
                    )}
                  >
                    {exp.status}
                  </span>
                </div>
                {canWrite && EXPENSE_TRANSITIONS[exp.status].length > 0 && (
                  <div className="flex flex-wrap gap-[6px]">
                    {EXPENSE_TRANSITIONS[exp.status].map((t) => (
                      <button
                        key={t.status}
                        type="button"
                        onClick={() => transitionExpenseStatus(exp.id, t.status)}
                        className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                      >
                        {x(M[t.label])}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_purchases_subscriptions)}</h2>
        {state.subscriptions.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_none)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {state.subscriptions.map((sub) => (
              <li key={sub.id} className="flex items-start justify-between gap-[12px]">
                <div>
                  <div className="text-[13px] font-semibold text-text">{x(sub.label)}</div>
                  <div className="text-[12px] text-text-muted">
                    {x(sub.renewalTerm)} · {x(CURRENCY_LABEL[sub.currency])} {sub.cost} ·{' '}
                    {x(M.finance_due_date)}: {sub.nextRenewalDate}
                  </div>
                </div>
                <span className={statusChipClass(sub.active ? 'success' : 'neutral')}>
                  {sub.active ? 'Active' : 'Cancelled'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function SpendRequestForm({
  onSubmit,
  onCancel,
  entities,
  suppliers,
}: {
  onSubmit: (req: Omit<import('../data/types').FinanceSpendRequest, 'id'>) => void
  onCancel: () => void
  entities: import('../data/types').FinanceLegalEntity[]
  suppliers: import('../data/types').FinanceParty[]
}) {
  const { x } = useI18n()
  const [entityId, setEntityId] = useState(entities[0]?.id ?? '')
  const [requester, setRequester] = useState('')
  const [purpose, setPurpose] = useState('')
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? '')
  const [amount, setAmount] = useState('0.00')
  const [currency] = useState<FinanceCurrency>('CAD')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      entityId,
      requester: requester || 'Workspace user',
      purpose: { en: purpose, fr: purpose },
      supplierId: supplierId || undefined,
      amount: Number(amount).toFixed(2),
      currency,
      status: 'draft',
      submittedAt: new Date().toISOString(),
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
          <span className="text-[12px] text-text-muted">{x(M.finance_spend_requester)}</span>
          <input value={requester} onChange={(e) => setRequester(e.target.value)} placeholder="Workspace user" className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
      </div>
      <label className="flex flex-col gap-[4px]">
        <span className="text-[12px] text-text-muted">{x(M.finance_spend_purpose)}</span>
        <input value={purpose} onChange={(e) => setPurpose(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
      </label>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_spend_supplier)}</span>
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]">
            <option value="">—</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_spend_amount)}</span>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
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
