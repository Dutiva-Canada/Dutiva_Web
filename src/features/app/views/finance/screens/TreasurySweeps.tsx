import { useState } from 'react'
import { ArrowLeftRight, Plus, Trash2 } from 'lucide-react'
import { statusChipClass } from '@/components/chips'
import { useI18n } from '@/i18n/context'
import type { Bi } from '@/i18n/core'
import { financeMessages as M } from '@/i18n/messages/finance'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useFinanceData } from '../data/useFinanceData'
import { CURRENCY_LABEL } from '../financeLabels'
import type { FinanceCashSweep, FinanceCurrency } from '../data/types'

/**
 * Treasury cash-sweep records — scheduled → executed | cancelled.
 * Dutiva records the sweep; it does not execute the transfer.
 */
export function CashSweepsSection() {
  const { x } = useI18n()
  const { showToast } = useToasts()
  const { state, canWrite, addCashSweep, transitionCashSweepStatus, removeCashSweep } =
    useFinanceData()
  const [showForm, setShowForm] = useState(false)

  const accountLabel = (id: string) => state.bankAccounts.find((a) => a.id === id)?.label

  const handleAdd = async (item: Omit<FinanceCashSweep, 'id'>) => {
    const created = await addCashSweep(item)
    if (!created) {
      showToast(M.finance_sweep_save_failed, 'info')
      return
    }
    setShowForm(false)
  }

  const handleTransition = async (id: string, status: FinanceCashSweep['status']) => {
    await transitionCashSweepStatus(id, status)
  }

  const handleRemove = async (id: string) => {
    if (!window.confirm(x(M.finance_sweep_remove_confirm))) return
    await removeCashSweep(id)
  }

  return (
    <section className="rounded-[12px] border border-border bg-surface p-[16px]">
      <div className="mb-[12px] flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text">{x(M.finance_sweeps_title)}</h2>
        {canWrite && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-[6px] text-[13px] font-semibold text-accent"
          >
            <Plus size={14} />
            {x(M.finance_sweep_create)}
          </button>
        )}
      </div>
      {showForm && canWrite && (
        <SweepForm
          onSubmit={handleAdd}
          onCancel={() => setShowForm(false)}
          accounts={state.bankAccounts}
          defaultEntityId={state.entities[0]?.id ?? ''}
        />
      )}
      {state.cashSweeps.length === 0 ? (
        <p className="text-[13px] text-text-muted">{x(M.finance_none)}</p>
      ) : (
        <ul className="m-0 flex flex-col gap-[10px] p-0">
          {state.cashSweeps.map((sweep) => {
            const from = accountLabel(sweep.fromAccountId)
            const to = accountLabel(sweep.toAccountId)
            return (
              <li key={sweep.id} className="flex items-start justify-between gap-[12px]">
                <div className="min-w-0">
                  <div className="flex items-center gap-[6px] text-[13px] font-semibold text-text">
                    <ArrowLeftRight className="size-[14px] shrink-0 text-text-faint" aria-hidden />
                    <span className="truncate">
                      {from ? x(from) : sweep.fromAccountId} → {to ? x(to) : sweep.toAccountId}
                    </span>
                  </div>
                  <div className="text-[12px] text-text-muted">
                    {x(CURRENCY_LABEL[sweep.currency])} {sweep.amount} · {sweep.scheduledDate}
                    {sweep.executedDate && ` · ${x(M.finance_sweep_status_executed)}: ${sweep.executedDate}`}
                    {sweep.reference && ` · ${sweep.reference}`}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-[8px]">
                  <span className={statusChipClass(sweep.status === 'executed' ? 'success' : sweep.status === 'cancelled' ? 'neutral' : 'warning')}>
                    {x(M[`finance_sweep_status_${sweep.status}` as keyof typeof M])}
                  </span>
                  {canWrite && (
                    <div className="flex items-center gap-[6px]">
                      {sweep.status === 'scheduled' && (
                        <button
                          type="button"
                          onClick={() => handleTransition(sweep.id, 'executed')}
                          className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                        >
                          {x(M.finance_sweep_mark_executed)}
                        </button>
                      )}
                      {sweep.status === 'scheduled' && (
                        <button
                          type="button"
                          onClick={() => handleTransition(sweep.id, 'cancelled')}
                          className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                        >
                          {x(M.finance_sweep_cancel)}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemove(sweep.id)}
                        aria-label={x(M.finance_sweep_remove)}
                        title={x(M.finance_sweep_remove)}
                        className="text-text-faint hover:text-text"
                      >
                        <Trash2 className="size-[14px]" aria-hidden />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function SweepForm({
  onSubmit,
  onCancel,
  accounts,
  defaultEntityId,
}: {
  onSubmit: (item: Omit<FinanceCashSweep, 'id'>) => Promise<void>
  onCancel: () => void
  accounts: { id: string; label: Bi }[]
  defaultEntityId: string
}) {
  const { x } = useI18n()
  const { showToast } = useToasts()
  const [from, setFrom] = useState(accounts[0]?.id ?? '')
  const [to, setTo] = useState(accounts[1]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [reference, setReference] = useState('')
  const [currency, setCurrency] = useState<FinanceCurrency>('CAD')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!from || !to || from === to) {
      showToast(M.finance_sweep_same_account, 'info')
      return
    }
    if (!amount || Number(amount) <= 0 || !date) return
    await onSubmit({
      entityId: defaultEntityId,
      fromAccountId: from,
      toAccountId: to,
      amount,
      currency,
      status: 'scheduled',
      scheduledDate: date,
      reference: reference.trim() || undefined,
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-[12px] flex flex-col gap-[8px] rounded-[10px] bg-inset p-[12px]"
    >
      <div className="grid grid-cols-2 gap-[8px]">
        <label className="flex flex-col gap-[3px] text-[12px] text-text-muted">
          {x(M.finance_sweep_from)}
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[6px] text-[13px] text-text"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {x(a.label)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-[3px] text-[12px] text-text-muted">
          {x(M.finance_sweep_to)}
          <select
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[6px] text-[13px] text-text"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {x(a.label)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-[3px] text-[12px] text-text-muted">
          {x(M.finance_sweep_amount)}
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[6px] text-[13px] text-text"
          />
        </label>
        <label className="flex flex-col gap-[3px] text-[12px] text-text-muted">
          {x(M.finance_sweep_scheduled_date)}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[6px] text-[13px] text-text"
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-[8px]">
        <label className="flex flex-col gap-[3px] text-[12px] text-text-muted">
          {x(M.finance_sweep_reference)}
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[6px] text-[13px] text-text"
          />
        </label>
        <label className="flex flex-col gap-[3px] text-[12px] text-text-muted">
          {x(CURRENCY_LABEL.CAD)}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as FinanceCurrency)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[6px] text-[13px] text-text"
          >
            {Object.entries(CURRENCY_LABEL).map(([code, label]) => (
              <option key={code} value={code}>
                {x(label)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex gap-[8px]">
        <button
          type="submit"
          className="rounded-[6px] bg-navy px-[10px] py-[6px] text-[12.5px] font-semibold text-white"
        >
          {x(M.finance_sweep_create)}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[6px] bg-surface px-[10px] py-[6px] text-[12.5px] font-semibold text-text-2 border border-border"
        >
          {x(M.finance_cancel)}
        </button>
      </div>
    </form>
  )
}
