import { useState } from 'react'
import { Plus } from 'lucide-react'
import { statusChipClass } from '@/components/chips'
import { useI18n } from '@/i18n/context'
import { financeMessages as M } from '@/i18n/messages/finance'
import { useFinanceData } from '../data/useFinanceData'
import { CURRENCY_LABEL, RESERVE_TYPE_LABEL } from '../financeLabels'
import type { FinanceCurrency, FinanceReserveType } from '../data/types'

export function Treasury() {
  const { x } = useI18n()
  const { state, canWrite, addReserveGoal, updateReserveGoalProgress, setHoldingStale, transitionDebtStatus, addBankAccount } = useFinanceData()
  const [showReserveForm, setShowReserveForm] = useState(false)
  const [showBankForm, setShowBankForm] = useState(false)
  const [progressEdit, setProgressEdit] = useState<string | null>(null)
  const [progressValue, setProgressValue] = useState('')

  return (
    <div className="flex flex-col gap-[16px]">
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-text">{x(M.finance_treasury_accounts)}</h2>
          {canWrite && (
            <button type="button" onClick={() => setShowBankForm((v) => !v)} className="flex items-center gap-[6px] text-[13px] font-semibold text-accent">
              <Plus size={14} />
              {x(M.finance_bank_account_create)}
            </button>
          )}
        </div>
        {showBankForm && canWrite && (
          <BankAccountForm
            onSubmit={(acc) => { addBankAccount(acc); setShowBankForm(false) }}
            onCancel={() => setShowBankForm(false)}
            entities={state.entities}
          />
        )}
        {state.bankAccounts.length === 0 && !showBankForm ? (
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
        <div className="mb-[12px] flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-text">{x(M.finance_treasury_reserves)}</h2>
          {canWrite && (
            <button
              type="button"
              onClick={() => setShowReserveForm((v) => !v)}
              className="flex items-center gap-[6px] text-[13px] font-semibold text-accent"
            >
              <Plus size={14} />
              {x(M.finance_reserve_create)}
            </button>
          )}
        </div>
        {showReserveForm && canWrite && (
          <ReserveGoalForm
            onSubmit={(rg) => {
              addReserveGoal(rg)
              setShowReserveForm(false)
            }}
            onCancel={() => setShowReserveForm(false)}
            entities={state.entities}
            bankAccounts={state.bankAccounts}
          />
        )}
        {state.reserveGoals.length === 0 && !showReserveForm ? (
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
                    {canWrite && progressEdit === rg.id && (
                      <div className="mt-[6px] flex items-center gap-[6px]">
                        <input
                          value={progressValue}
                          onChange={(e) => setProgressValue(e.target.value)}
                          placeholder={rg.currentAmount}
                          className="w-[100px] rounded-[6px] border border-border bg-surface px-[6px] py-[3px] text-[12px]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            updateReserveGoalProgress(rg.id, Number(progressValue).toFixed(2))
                            setProgressEdit(null)
                            setProgressValue('')
                          }}
                          className="rounded-[6px] bg-navy px-[8px] py-[3px] text-[11px] font-semibold text-white"
                        >
                          {x(M.finance_save)}
                        </button>
                        <button
                          type="button"
                          onClick={() => setProgressEdit(null)}
                          className="rounded-[6px] bg-inset px-[8px] py-[3px] text-[11px] font-semibold text-text-2 border border-border"
                        >
                          {x(M.finance_cancel)}
                        </button>
                      </div>
                    )}
                    {canWrite && progressEdit !== rg.id && (
                      <button
                        type="button"
                        onClick={() => {
                          setProgressEdit(rg.id)
                          setProgressValue(rg.currentAmount)
                        }}
                        className="mt-[6px] rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                      >
                        {x(M.finance_reserve_update_progress)}
                      </button>
                    )}
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
                  {canWrite && (
                    <button
                      type="button"
                      onClick={() => setHoldingStale(h.id, !h.stale)}
                      className="mt-[6px] rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                    >
                      {h.stale ? x(M.finance_holding_refresh) : x(M.finance_holding_mark_stale)}
                    </button>
                  )}
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
                  {canWrite && d.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => transitionDebtStatus(d.id, 'paid_off')}
                      className="mt-[6px] rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                    >
                      {x(M.finance_debt_mark_paid_off)}
                    </button>
                  )}
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

function ReserveGoalForm({
  onSubmit,
  onCancel,
  entities,
  bankAccounts,
}: {
  onSubmit: (rg: Omit<import('../data/types').FinanceReserveGoal, 'id'>) => void
  onCancel: () => void
  entities: import('../data/types').FinanceLegalEntity[]
  bankAccounts: import('../data/types').FinanceBankAccount[]
}) {
  const { x } = useI18n()
  const [entityId, setEntityId] = useState(entities[0]?.id ?? '')
  const [type, setType] = useState<FinanceReserveType>('emergency_operating')
  const [label, setLabel] = useState('')
  const [targetAmount, setTargetAmount] = useState('0.00')
  const [currentAmount, setCurrentAmount] = useState('0.00')
  const [currency] = useState<FinanceCurrency>('CAD')
  const [linkedBankAccountId, setLinkedBankAccountId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [owner, setOwner] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      entityId,
      type,
      label: { en: label, fr: label },
      targetAmount: Number(targetAmount).toFixed(2),
      currentAmount: Number(currentAmount).toFixed(2),
      currency,
      linkedBankAccountId: linkedBankAccountId || undefined,
      dueDate: dueDate || undefined,
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
          <span className="text-[12px] text-text-muted">{x(M.finance_reserve_type)}</span>
          <select value={type} onChange={(e) => setType(e.target.value as FinanceReserveType)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]">
            <option value="emergency_operating">Emergency operating</option>
            <option value="payroll">Payroll</option>
            <option value="tax">Tax</option>
            <option value="capital_purchase">Capital purchase</option>
            <option value="other">Other</option>
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-[4px]">
        <span className="text-[12px] text-text-muted">{x(M.finance_reserve_label)}</span>
        <input value={label} onChange={(e) => setLabel(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
      </label>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_reserve_target)}</span>
          <input value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_reserve_current)}</span>
          <input value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_reserve_owner)}</span>
          <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Workspace user" className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_reserve_due_date)}</span>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
      </div>
      <label className="flex flex-col gap-[4px]">
        <span className="text-[12px] text-text-muted">{x(M.finance_treasury_accounts)}</span>
        <select value={linkedBankAccountId} onChange={(e) => setLinkedBankAccountId(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]">
          <option value="">—</option>
          {bankAccounts.map((acc) => (
            <option key={acc.id} value={acc.id}>{acc.label.en}</option>
          ))}
        </select>
      </label>
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

function BankAccountForm({
  onSubmit,
  onCancel,
  entities,
}: {
  onSubmit: (acc: Omit<import('../data/types').FinanceBankAccount, 'id'>) => void
  onCancel: () => void
  entities: import('../data/types').FinanceLegalEntity[]
}) {
  const { x } = useI18n()
  const [entityId, setEntityId] = useState(entities[0]?.id ?? '')
  const [label, setLabel] = useState('')
  const [currency] = useState<FinanceCurrency>('CAD')
  const [last4, setLast4] = useState('')
  const [restricted, setRestricted] = useState(false)
  const [earmarkedAmount, setEarmarkedAmount] = useState('')
  const [maturityDate, setMaturityDate] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      entityId,
      label: { en: label, fr: label },
      currency,
      last4: last4 || undefined,
      restricted,
      earmarkedAmount: earmarkedAmount || undefined,
      maturityDate: maturityDate || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mb-[12px] flex flex-col gap-[10px] rounded-[10px] bg-inset p-[12px]">
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_invoice_entity)}</span>
          <select value={entityId} onChange={(e) => setEntityId(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]">
            {entities.map((ent) => <option key={ent.id} value={ent.id}>{ent.legalName}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_bank_account_label)}</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_bank_account_last4)}</span>
          <input value={last4} onChange={(e) => setLast4(e.target.value)} maxLength={4} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_bank_account_earmarked)}</span>
          <input value={earmarkedAmount} onChange={(e) => setEarmarkedAmount(e.target.value)} placeholder="0.00" className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_bank_account_maturity)}</span>
          <input type="date" value={maturityDate} onChange={(e) => setMaturityDate(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
        <label className="flex items-center gap-[6px] pt-[20px]">
          <input type="checkbox" checked={restricted} onChange={(e) => setRestricted(e.target.checked)} />
          <span className="text-[12px] text-text-muted">{x(M.finance_bank_account_restricted)}</span>
        </label>
      </div>
      <div className="flex justify-end gap-[8px]">
        <button type="button" onClick={onCancel} className="rounded-[6px] bg-inset px-[12px] py-[5px] text-[12px] font-semibold text-text-2 border border-border">{x(M.finance_cancel)}</button>
        <button type="submit" className="rounded-[6px] bg-navy px-[12px] py-[5px] text-[12px] font-semibold text-white">{x(M.finance_save)}</button>
      </div>
    </form>
  )
}
