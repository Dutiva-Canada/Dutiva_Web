import { useEffect, useState } from 'react'
import { useI18n } from '@/i18n/context'
import { revenueMessages as M } from '@/i18n/messages/revenue'
import { statusChipClass } from '@/components/chips'
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormField'
import { useRevenueData } from '../RevenueDataContext'
import type { RevenueInvoice, RevenueInvoiceStatus, RevenueCurrency } from '../data/types'
import { formatCurrency } from '../data/format'

const STATUSES: RevenueInvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue', 'cancelled']
const CURRENCIES: RevenueCurrency[] = ['CAD', 'USD', 'EUR', 'GBP']

const STATUS_LABELS: Record<RevenueInvoiceStatus, keyof typeof M> = {
  draft: 'rev_invoice_status_draft',
  sent: 'rev_invoice_status_sent',
  paid: 'rev_invoice_status_paid',
  overdue: 'rev_invoice_status_overdue',
  cancelled: 'rev_invoice_status_cancelled',
}

const STATUS_TONE: Record<
  RevenueInvoiceStatus,
  'neutral' | 'info' | 'success' | 'risk' | 'neutral'
> = {
  draft: 'neutral',
  sent: 'info',
  paid: 'success',
  overdue: 'risk',
  cancelled: 'neutral',
}

const CURRENCY_LABELS: Record<RevenueCurrency, keyof typeof M> = {
  CAD: 'rev_currency_CAD',
  USD: 'rev_currency_USD',
  EUR: 'rev_currency_EUR',
  GBP: 'rev_currency_GBP',
}

function generateId() {
  return `rev-inv-${Math.random().toString(36).slice(2, 9)}`
}

function emptyInvoice(): RevenueInvoice {
  return {
    id: generateId(),
    organization_id: '',
    stream_id: null,
    customer_name: '',
    amount: 0,
    currency: 'CAD',
    status: 'draft',
    issue_date: null,
    due_date: null,
    paid_date: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function InvoiceRow({
  invoice,
  onEdit,
  onRemove,
}: {
  readonly invoice: RevenueInvoice
  readonly onEdit: (invoice: RevenueInvoice) => void
  readonly onRemove: (id: string) => void
}) {
  const { x } = useI18n()
  return (
    <div className="flex items-start justify-between gap-[12px] border-t border-inset px-[14px] py-[12px] first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="mb-[2px] truncate text-[13.5px] font-semibold text-text">
          {invoice.customer_name}
        </div>
        <div className="text-[12px] text-text-muted">
          {invoice.issue_date ? `${x(M.rev_issue)} ${invoice.issue_date}` : null}
          {invoice.due_date
            ? `${invoice.issue_date ? ' · ' : ''}${x(M.rev_due)} ${invoice.due_date}`
            : null}
        </div>
      </div>
      <div className="flex items-center gap-[10px]">
        <span className="text-[13px] font-medium text-text">
          {formatCurrency(invoice.amount, invoice.currency)}
        </span>
        <span className={statusChipClass(STATUS_TONE[invoice.status])}>
          {x(M[STATUS_LABELS[invoice.status]])}
        </span>
        <button
          type="button"
          onClick={() => onEdit(invoice)}
          className="rounded-[6px] p-[4px] text-text-muted hover:bg-inset hover:text-text"
        >
          {x(M.rev_edit)}
        </button>
        <button
          type="button"
          onClick={() => onRemove(invoice.id)}
          className="rounded-[6px] p-[4px] text-text-muted hover:bg-inset hover:text-text"
        >
          {x(M.rev_remove)}
        </button>
      </div>
    </div>
  )
}

export function Invoices() {
  const { x } = useI18n()
  const { streams, invoices, addInvoice, updateInvoice, removeInvoice } = useRevenueData()
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState<RevenueInvoice | null>(null)

  const initial = editing ?? emptyInvoice()
  const [customerName, setCustomerName] = useState(initial.customer_name)
  const [streamId, setStreamId] = useState(initial.stream_id ?? '')
  const [amount, setAmount] = useState(String(initial.amount))
  const [currency, setCurrency] = useState<RevenueCurrency>(initial.currency)
  const [status, setStatus] = useState<RevenueInvoiceStatus>(initial.status)
  const [issueDate, setIssueDate] = useState(initial.issue_date ?? '')
  const [dueDate, setDueDate] = useState(initial.due_date ?? '')
  const [paidDate, setPaidDate] = useState(initial.paid_date ?? '')
  const [notes, setNotes] = useState(initial.notes ?? '')

  useEffect(() => {
    const base = editing ?? emptyInvoice()
    setCustomerName(base.customer_name)
    setStreamId(base.stream_id ?? '')
    setAmount(String(base.amount))
    setCurrency(base.currency)
    setStatus(base.status)
    setIssueDate(base.issue_date ?? '')
    setDueDate(base.due_date ?? '')
    setPaidDate(base.paid_date ?? '')
    setNotes(base.notes ?? '')
  }, [editing])

  useEffect(() => {
    if (status === 'paid' && !paidDate) {
      setPaidDate(new Date().toISOString().slice(0, 10))
    }
  }, [status, paidDate])

  const reset = () => {
    setShow(false)
    setEditing(null)
    const base = emptyInvoice()
    setCustomerName(base.customer_name)
    setStreamId(base.stream_id ?? '')
    setAmount(String(base.amount))
    setCurrency(base.currency)
    setStatus(base.status)
    setIssueDate(base.issue_date ?? '')
    setDueDate(base.due_date ?? '')
    setPaidDate(base.paid_date ?? '')
    setNotes(base.notes ?? '')
  }

  const onSubmit = async () => {
    const now = new Date().toISOString()
    const invoice: RevenueInvoice = {
      ...(editing ?? emptyInvoice()),
      customer_name: customerName,
      stream_id: streamId || null,
      amount: Number(amount) || 0,
      currency,
      status,
      issue_date: issueDate || null,
      due_date: dueDate || null,
      paid_date: status === 'paid' ? paidDate || null : null,
      notes: notes || null,
      updated_at: now,
    }
    if (editing) {
      await updateInvoice(invoice)
    } else {
      await addInvoice({ ...invoice, created_at: now })
    }
    reset()
  }

  const openCreate = () => {
    setEditing(null)
    setShow(true)
  }

  return (
    <div className="space-y-[14px]">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => (show ? reset() : openCreate())}
          className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] font-medium text-text hover:bg-inset"
        >
          {x(show && !editing ? M.rev_cancel : M.rev_add_invoice)}
        </button>
      </div>

      {show ? (
        <div className="grid grid-cols-1 gap-[14px] rounded-[12px] border border-border bg-surface p-[16px] sm:grid-cols-2">
          <FormField label={x(M.rev_customer_name)} className="sm:col-span-2">
            <FormInput
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </FormField>

          <FormField label={x(M.rev_stream)}>
            <FormSelect value={streamId} onChange={(e) => setStreamId(e.target.value)}>
              <option value="">{x(M.rev_select_stream)}</option>
              {streams.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </FormSelect>
          </FormField>

          <FormField label={x(M.rev_status)}>
            <FormSelect
              value={status}
              onChange={(e) => setStatus(e.target.value as RevenueInvoiceStatus)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {x(M[STATUS_LABELS[s]])}
                </option>
              ))}
            </FormSelect>
          </FormField>

          <FormField label={x(M.rev_amount)}>
            <FormInput
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </FormField>

          <FormField label={x(M.rev_currency)}>
            <FormSelect
              value={currency}
              onChange={(e) => setCurrency(e.target.value as RevenueCurrency)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {x(M[CURRENCY_LABELS[c]])}
                </option>
              ))}
            </FormSelect>
          </FormField>

          <FormField label={x(M.rev_issue_date)}>
            <FormInput
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
          </FormField>

          <FormField label={x(M.rev_due_date)}>
            <FormInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </FormField>

          <FormField label={x(M.rev_paid_date)}>
            <FormInput
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
              disabled={status !== 'paid'}
            />
          </FormField>

          <FormField label={x(M.rev_notes)} className="sm:col-span-2">
            <FormTextarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </FormField>

          <div className="flex justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] text-text-muted hover:text-text"
            >
              {x(M.rev_cancel)}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="rounded-[8px] bg-accent px-[14px] py-[8px] text-[13px] font-medium text-white hover:bg-accent/90"
            >
              {x(editing ? M.rev_save_changes : M.rev_save)}
            </button>
          </div>
        </div>
      ) : null}

      {invoices.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
          <p className="m-0 text-[13.5px] text-text-muted">{x(M.rev_empty_invoices)}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
          {invoices.map((invoice) => (
            <InvoiceRow
              key={invoice.id}
              invoice={invoice}
              onEdit={(i) => {
                setEditing(i)
                setShow(true)
              }}
              onRemove={(id) => removeInvoice(id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
