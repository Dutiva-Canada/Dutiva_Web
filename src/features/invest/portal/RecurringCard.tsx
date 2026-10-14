/**
 * Recurring contributions card (0224) — a scheduled deposit per account.
 * The sweep lands each due row as a real cash event (and moves the
 * account's cash) then advances the date; the cadence keeps the track
 * record's flow adjustment honest without hand-logging.
 */
import { useMemo, useRef, useState, type FormEvent } from 'react'
import { CalendarClock, Plus, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { fill } from '@/lib/format'
import { investMessages as IM } from '@/i18n/messages/invest'
import { deleteRecurring, saveRecurring } from '../data/api'
import { InfoHint } from './InfoHint'
import type {
  InvestAccount,
  RecurringCadence,
  RecurringContribution,
} from '../data/types'

const CADENCE_KEY: Record<RecurringCadence, keyof typeof IM> = {
  weekly: 'invest_recur_weekly',
  monthly: 'invest_recur_monthly',
}

export function RecurringCard({
  accounts,
  items,
  busy,
  run,
  fmtFor,
}: {
  accounts: InvestAccount[]
  items: RecurringContribution[]
  busy: boolean
  run: (fn: () => Promise<void>) => Promise<void>
  fmtFor: (cur: string) => Intl.NumberFormat
}) {
  const { x } = useI18n()
  const [accountId, setAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [cadence, setCadence] = useState<RecurringCadence>('monthly')
  const [nextRunOn, setNextRunOn] = useState(() => new Date().toISOString().slice(0, 10))
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const active = accounts.filter((a) => a.status === 'active')
  const target = accountId || active[0]?.id || ''
  const targetAccount = accounts.find((a) => a.id === target)
  const amountNum = Number(amount)
  const valid = !!target && Number.isFinite(amountNum) && amountNum > 0 && !!nextRunOn

  const accountName = useMemo(
    () => new Map(accounts.map((a) => [a.id, a.name])),
    [accounts],
  )

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid || !targetAccount) return
    void run(() =>
      saveRecurring({
        accountId: target,
        amount: amountNum,
        currency: targetAccount.baseCurrency,
        cadence,
        nextRunOn,
      }),
    ).then(() => setAmount(''))
  }

  return (
    <section className="sb-card sb-card-pad">
      <h2 className="sb-h2">
        <CalendarClock size={15} strokeWidth={2} aria-hidden="true" />{' '}
        {x(IM.invest_recur_title)}
        <InfoHint
          label={x(IM.invest_hint_recur_aria)}
          text={x(IM.invest_hint_recur)}
        />
      </h2>
      <p className="sb-helper" style={{ margin: '4px 0 12px' }}>
        {x(IM.invest_recur_sub)}
      </p>

      {items.length > 0 && (
        <ul className="sb-recur-list">
          {items.map((r) => (
            <li key={r.id} className="sb-recur-row">
              <span style={{ flex: 1, minWidth: 0 }}>
                <strong>{fmtFor(r.currency).format(r.amount)}</strong>
                <span className="dim"> · {x(IM[CADENCE_KEY[r.cadence]])}</span>
                <span className="dim"> · {accountName.get(r.accountId) ?? '—'}</span>
                <span className="dim">
                  {' '}
                  ·{' '}
                  {fill(x(IM.invest_recur_next), {
                    date: r.nextRunOn,
                  })}
                </span>
              </span>
              <span className="sb-row-actions">
                <button
                  type="button"
                  className="sb-btn sb-btn-secondary sb-btn-sm"
                  disabled={busy}
                  onClick={() =>
                    void run(() =>
                      saveRecurring({
                        id: r.id,
                        accountId: r.accountId,
                        amount: r.amount,
                        currency: r.currency,
                        cadence: r.cadence,
                        nextRunOn: r.nextRunOn,
                        note: r.note,
                        enabled: !r.enabled,
                      }),
                    )
                  }
                >
                  {x(r.enabled ? IM.invest_recur_pause : IM.invest_recur_resume)}
                </button>
                <button
                  type="button"
                  className="sb-btn sb-btn-secondary sb-btn-sm"
                  disabled={busy}
                  aria-label={x(IM.invest_rule_remove)}
                  onClick={() => {
                    if (confirmId !== r.id) {
                      setConfirmId(r.id)
                      if (confirmTimer.current) clearTimeout(confirmTimer.current)
                      confirmTimer.current = setTimeout(() => setConfirmId(null), 3000)
                      return
                    }
                    void run(() => deleteRecurring(r.id))
                  }}
                >
                  {confirmId === r.id ? (
                    x(IM.invest_remove_confirm)
                  ) : (
                    <Trash2 size={15} aria-hidden="true" />
                  )}
                </button>
              </span>
              {!r.enabled && (
                <span className="sb-pill sb-pill-warn">{x(IM.invest_recur_paused)}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {active.length > 0 && (
        <form onSubmit={submit} className="sb-form-grid" style={{ marginTop: 12 }}>
          <div className="sb-field">
            <label className="sb-flabel">{x(IM.invest_accounts_title)}</label>
            <select
              value={target}
              onChange={(e) => setAccountId(e.target.value)}
              className="sb-input"
            >
              {active.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sb-field">
            <label className="sb-flabel">{x(IM.invest_recur_amount)}</label>
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="sb-input"
              required
            />
          </div>
          <div className="sb-field">
            <label className="sb-flabel">{x(IM.invest_recur_cadence)}</label>
            <select
              value={cadence}
              onChange={(e) => setCadence(e.target.value as RecurringCadence)}
              className="sb-input"
            >
              <option value="weekly">{x(IM.invest_recur_weekly)}</option>
              <option value="monthly">{x(IM.invest_recur_monthly)}</option>
            </select>
          </div>
          <div className="sb-field">
            <label className="sb-flabel">{x(IM.invest_recur_next_date)}</label>
            <input
              type="date"
              value={nextRunOn}
              onChange={(e) => setNextRunOn(e.target.value)}
              className="sb-input"
              required
            />
          </div>
          <div className="sb-form-actions">
            <button type="submit" disabled={busy || !valid} className="sb-btn sb-btn-primary">
              <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
              {x(IM.invest_recur_add)}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
