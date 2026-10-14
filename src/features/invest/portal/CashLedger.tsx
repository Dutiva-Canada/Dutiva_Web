/**
 * Cash ledger card (0223) — deposits, withdrawals, dividends recorded
 * against an account. Recording one moves the account's cash balance;
 * the track record backs deposits and withdrawals out of its change
 * figure so money moved doesn't read as performance.
 */
import { useMemo, useRef, useState, type FormEvent } from 'react'
import { ArrowDownToLine, ArrowUpFromLine, Coins, Loader2, Plus, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import { deleteCashEvent, recordCashEvent } from '../data/api'
import type { CashEventKind, InvestAccount, InvestCashEvent } from '../data/types'

const KIND_ICON: Record<CashEventKind, typeof ArrowDownToLine> = {
  deposit: ArrowDownToLine,
  withdrawal: ArrowUpFromLine,
  dividend: Coins,
}
const KIND_KEY: Record<CashEventKind, keyof typeof IM> = {
  deposit: 'invest_ledger_deposit',
  withdrawal: 'invest_ledger_withdrawal',
  dividend: 'invest_ledger_dividend',
}
const LIST_MAX = 8

export function CashLedger({
  accounts,
  events,
  busy,
  run,
  fmtFor,
}: {
  accounts: InvestAccount[]
  events: InvestCashEvent[]
  busy: boolean
  /** The page's guarded mutation runner — refreshes state on success. */
  run: (fn: () => Promise<void>) => Promise<void>
  fmtFor: (cur: string) => Intl.NumberFormat
}) {
  const { x, lang } = useI18n()
  const [kind, setKind] = useState<CashEventKind>('deposit')
  const [accountId, setAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const active = accounts.find((a) => a.status === 'active') ?? accounts[0]
  const target = accountId || active?.id || ''
  const amountNum = Number(amount)
  const today = new Date().toISOString().slice(0, 10)
  const valid = !!target && Number.isFinite(amountNum) && amountNum > 0 && !!date

  const accountName = useMemo(
    () => new Map(accounts.map((a) => [a.id, a.name])),
    [accounts],
  )

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (busy || !valid) return
    void run(async () => {
      await recordCashEvent({
        accountId: target,
        kind,
        amount: amountNum,
        currency: accounts.find((a) => a.id === target)?.baseCurrency ?? 'CAD',
        occurredAt: date,
        note: note.trim(),
      })
      setAmount('')
      setNote('')
    })
  }

  const remove = (ev: InvestCashEvent) => {
    if (confirmId !== ev.id) {
      setConfirmId(ev.id)
      if (confirmTimer.current) clearTimeout(confirmTimer.current)
      confirmTimer.current = setTimeout(() => setConfirmId(null), 3000)
      return
    }
    if (confirmTimer.current) clearTimeout(confirmTimer.current)
    setConfirmId(null)
    /* Deleting reverses the cash it moved — the confirm copy says so. */
    void run(() => deleteCashEvent(ev))
  }

  const fmtDay = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

  return (
    <section className="sb-card sb-card-pad">
      <h2 style={{ margin: 0 }}>{x(IM.invest_ledger_title)}</h2>
      <p className="sb-helper" style={{ margin: '4px 0 14px' }}>{x(IM.invest_ledger_note)}</p>

      {accounts.length > 0 && (
        <form onSubmit={submit} className="sb-form-grid sb-ledger-form">
          <div className="sb-field">
            <label className="sb-flabel" htmlFor="inv-ledger-kind">
              {x(IM.invest_ledger_kind)}
            </label>
            <select
              id="inv-ledger-kind"
              className="sb-input"
              value={kind}
              onChange={(e) => setKind(e.target.value as CashEventKind)}
            >
              {(Object.keys(KIND_KEY) as CashEventKind[]).map((k) => (
                <option key={k} value={k}>
                  {x(IM[KIND_KEY[k]])}
                </option>
              ))}
            </select>
          </div>
          {accounts.length > 1 && (
            <div className="sb-field">
              <label className="sb-flabel" htmlFor="inv-ledger-acct">
                {x(IM.invest_field_account)}
              </label>
              <select
                id="inv-ledger-acct"
                className="sb-input"
                value={target}
                onChange={(e) => setAccountId(e.target.value)}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="sb-field">
            <label className="sb-flabel" htmlFor="inv-ledger-amt">
              {x(IM.invest_ledger_amount)}
            </label>
            <input
              id="inv-ledger-amt"
              className="sb-input"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="sb-field">
            <label className="sb-flabel" htmlFor="inv-ledger-date">
              {x(IM.invest_ledger_date)}
            </label>
            <input
              id="inv-ledger-date"
              className="sb-input"
              type="date"
              required
              max={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="sb-field">
            <label className="sb-flabel" htmlFor="inv-ledger-note">
              {x(IM.invest_ledger_memo)}
            </label>
            <input
              id="inv-ledger-note"
              className="sb-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={120}
            />
          </div>
          <div className="sb-form-actions">
            <button type="submit" disabled={busy || !valid} className="sb-btn sb-btn-primary">
              {busy ? (
                <Loader2 size={15} className="animate-spin" aria-hidden="true" />
              ) : (
                <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
              )}
              {x(IM.invest_ledger_record)}
            </button>
          </div>
        </form>
      )}

      {events.length === 0 ? (
        <p className="sb-empty">{x(IM.invest_ledger_empty)}</p>
      ) : (
        <ul className="sb-ledger-list">
          {events.slice(0, LIST_MAX).map((ev) => {
            const Icon = KIND_ICON[ev.kind]
            const signed = ev.kind === 'withdrawal' ? -ev.amount : ev.amount
            return (
              <li key={ev.id}>
                <span className={`sb-ledger-kind sb-ledger-${ev.kind}`}>
                  <Icon size={13} strokeWidth={2.2} aria-hidden="true" />
                  {x(IM[KIND_KEY[ev.kind]])}
                </span>
                <span
                  className="sb-ledger-amt"
                  style={{ color: signed >= 0 ? 'var(--sb-ok)' : 'var(--sb-danger)' }}
                >
                  {signed >= 0 ? '+' : '−'}
                  {fmtFor(ev.currency).format(Math.abs(signed))}
                </span>
                <span className="dim">{fmtDay(ev.occurredAt)}</span>
                {accounts.length > 1 && (
                  <span className="dim">{accountName.get(ev.accountId) ?? '—'}</span>
                )}
                {ev.note && <span className="dim sb-ledger-note">{ev.note}</span>}
                <button
                  type="button"
                  disabled={busy}
                  className="sb-linklike sb-ledger-del"
                  aria-label={`${x(IM.invest_rule_remove)} ${x(IM[KIND_KEY[ev.kind]])} ${fmtDay(ev.occurredAt)}`}
                  onClick={() => remove(ev)}
                >
                  {confirmId === ev.id ? (
                    x(IM.invest_ledger_confirm_del)
                  ) : (
                    <Trash2 size={13} aria-hidden="true" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {events.length > LIST_MAX && (
        <p className="sb-helper" style={{ margin: '8px 0 0' }}>
          {x(IM.invest_ledger_more).replace('{count}', String(events.length))}
        </p>
      )}
    </section>
  )
}
