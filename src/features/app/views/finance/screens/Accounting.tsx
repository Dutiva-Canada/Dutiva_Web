import { useState } from 'react'
import { Plus } from 'lucide-react'
import { statusChipClass } from '@/components/chips'
import { useI18n } from '@/i18n/context'
import { financeMessages as M } from '@/i18n/messages/finance'
import { useFinanceData } from '../data/useFinanceData'
import { JOURNAL_STATUS_LABEL } from '../financeLabels'
import type { FinanceClosePeriod, FinanceCurrency, FinanceJournal, FinanceJournalLine, FinanceJournalStatus } from '../data/types'

const JOURNAL_ACTIONS: Record<FinanceJournalStatus, { status: FinanceJournalStatus; label: keyof typeof M }[]> = {
  draft: [{ status: 'posted', label: 'finance_journal_post' }],
  posted: [{ status: 'reversed', label: 'finance_journal_reverse' }],
  reversed: [],
}

const CLOSE_PERIOD_ACTIONS: Record<
  FinanceClosePeriod['status'],
  { status: FinanceClosePeriod['status']; label: keyof typeof M }[]
> = {
  open: [{ status: 'in_review', label: 'finance_close_period_start_review' }],
  in_review: [
    { status: 'approved', label: 'finance_close_period_approve' },
    { status: 'open', label: 'finance_close_period_reopen' },
  ],
  approved: [
    { status: 'locked', label: 'finance_close_period_lock' },
    { status: 'open', label: 'finance_close_period_reopen' },
  ],
  locked: [{ status: 'open', label: 'finance_close_period_reopen' }],
}

export function Accounting() {
  const { x } = useI18n()
  const { state, canWrite, transitionJournalStatus, transitionClosePeriodStatus, addJournal, addLedgerAccount } = useFinanceData()
  const [showJournalForm, setShowJournalForm] = useState(false)
  const [showLedgerForm, setShowLedgerForm] = useState(false)

  const accountName = (id: string) => {
    const acct = state.ledgerAccounts.find((a) => a.id === id)
    return acct ? `${acct.code} — ${x(acct.name)}` : id
  }

  return (
    <div className="flex flex-col gap-[16px]">
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_accounting_books)}</h2>
        {state.books.map((book) => (
          <div key={book.id} className="mb-[10px] rounded-[8px] bg-inset px-[12px] py-[10px]">
            <div className="text-[13px] font-semibold text-text">{x(book.label)}</div>
            <div className="text-[12px] text-text-muted">
              {book.basis === 'accrual' ? 'Accrual' : 'Cash'} ·{' '}
              {x(M.finance_accounting_authoritative_source)}: {x(book.authoritativeSource)}
              {book.lastSyncedAt && ` · ${x(M.finance_accounting_last_synced)}: ${book.lastSyncedAt}`}
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-text">{x(M.finance_accounting_ledger)}</h2>
          {canWrite && (
            <button type="button" onClick={() => setShowLedgerForm((v) => !v)} className="flex items-center gap-[6px] text-[13px] font-semibold text-accent">
              <Plus size={14} />
              {x(M.finance_ledger_account_create)}
            </button>
          )}
        </div>
        {showLedgerForm && canWrite && (
          <LedgerAccountForm
            onSubmit={(acc) => { addLedgerAccount(acc); setShowLedgerForm(false) }}
            onCancel={() => setShowLedgerForm(false)}
            books={state.books}
          />
        )}
        <ul className="m-0 flex flex-col gap-[6px] p-0">
          {state.ledgerAccounts.map((acct) => (
            <li key={acct.id} className="flex items-center justify-between gap-[8px]">
              <div className="text-[13px] text-text">
                <span className="font-mono text-[12px] text-text-muted">{acct.code}</span>{' '}
                <span className="font-semibold">{x(acct.name)}</span>
              </div>
              <div className="flex items-center gap-[6px]">
                <span className="text-[11px] text-text-muted">{acct.type}</span>
                {acct.sensitive && (
                  <span className={statusChipClass('warning')}>{x(M.finance_accounting_sensitive)}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-text">{x(M.finance_accounting_journals)}</h2>
          {canWrite && (
            <button
              type="button"
              onClick={() => setShowJournalForm((v) => !v)}
              className="flex items-center gap-[6px] text-[13px] font-semibold text-accent"
            >
              <Plus size={14} />
              {x(M.finance_journal_create)}
            </button>
          )}
        </div>
        {showJournalForm && canWrite && (
          <JournalForm
            onSubmit={(jrnl) => {
              addJournal(jrnl)
              setShowJournalForm(false)
            }}
            onCancel={() => setShowJournalForm(false)}
            books={state.books}
            ledgerAccounts={state.ledgerAccounts}
          />
        )}
        {state.journals.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_accounting_no_journals)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[12px] p-0">
            {state.journals.map((jrnl) => (
              <li key={jrnl.id} className="rounded-[10px] bg-inset p-[12px]">
                <div className="flex items-start justify-between gap-[12px]">
                  <div>
                    <div className="text-[13px] font-semibold text-text">{jrnl.number} — {x(jrnl.description)}</div>
                    <div className="text-[12px] text-text-muted">
                      {jrnl.date} · {jrnl.source}
                    </div>
                  </div>
                  <div className="flex items-center gap-[6px]">
                    <span
                      className={statusChipClass(jrnl.balanced ? 'success' : 'risk')}
                    >
                      {jrnl.balanced ? x(M.finance_accounting_balanced) : x(M.finance_accounting_unbalanced)}
                    </span>
                    <span className={statusChipClass(jrnl.status === 'posted' ? 'success' : 'neutral')}>
                      {x(JOURNAL_STATUS_LABEL[jrnl.status])}
                    </span>
                  </div>
                </div>
                {!jrnl.balanced && (
                  <div className="mt-[6px] text-[12px] text-risk-fg">{x(M.finance_journal_unbalanced)}</div>
                )}
                <ul className="m-0 mt-[8px] flex flex-col gap-[2px] p-0">
                  {jrnl.lines.map((line, idx) => (
                    <li key={idx} className="flex items-center justify-between text-[12px] text-text-muted">
                      <span>{accountName(line.accountId)}</span>
                      <span>
                        {line.debit !== '0.00' ? `${x(M.finance_accounting_debit)}: ${line.debit}` : ''}
                        {line.credit !== '0.00' ? ` ${x(M.finance_accounting_credit)}: ${line.credit}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
                {canWrite && JOURNAL_ACTIONS[jrnl.status].length > 0 && (
                  <div className="mt-[8px] flex flex-wrap gap-[6px]">
                    {JOURNAL_ACTIONS[jrnl.status].map((t) => {
                      const disabled = t.status === 'posted' && !jrnl.balanced
                      return (
                        <button
                          key={t.status}
                          type="button"
                          disabled={disabled}
                          onClick={() => transitionJournalStatus(jrnl.id, t.status)}
                          className="rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {x(M[t.label])}
                        </button>
                      )
                    })}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_accounting_close)}</h2>
        {state.closePeriods.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_none)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[12px] p-0">
            {state.closePeriods.map((cp) => (
              <li key={cp.id} className="flex flex-col gap-[8px] rounded-[10px] bg-inset p-[12px]">
                <div className="flex items-start justify-between gap-[12px]">
                  <div className="text-[13px] text-text">
                    <span className="font-semibold">{cp.periodId}</span>
                    {cp.approver && <span className="text-[12px] text-text-muted"> · {cp.approver}</span>}
                    {cp.reopenReason && <div className="text-[12px] text-text-muted">{x(cp.reopenReason)}</div>}
                  </div>
                  <span className={statusChipClass(cp.status === 'locked' ? 'success' : 'warning')}>
                    {cp.status === 'open' ? 'Open' : cp.status === 'in_review' ? 'In review' : cp.status === 'approved' ? 'Approved' : 'Locked'}
                  </span>
                </div>
                {canWrite && (CLOSE_PERIOD_ACTIONS[cp.status] ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-[6px]">
                    {(CLOSE_PERIOD_ACTIONS[cp.status] ?? []).map((t) => (
                      <button
                        key={t.status}
                        type="button"
                        onClick={() => transitionClosePeriodStatus(cp.id, t.status, 'Workspace user')}
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

      {state.auditEvents.length > 0 && (
        <section className="rounded-[12px] border border-border bg-surface p-[16px]">
          <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_audit_title)}</h2>
          <ul className="m-0 flex flex-col gap-[8px] p-0">
            {state.auditEvents.slice(0, 20).map((ev) => (
              <li key={ev.id} className="flex items-start justify-between gap-[12px] rounded-[8px] bg-inset px-[10px] py-[6px]">
                <div className="text-[12px] text-text-muted">
                  <span className="font-semibold text-text">{ev.actor}</span> · {x(ev.action)}
                  {ev.recordType && ` · ${ev.recordType}`}
                  {ev.recordId && ` ${ev.recordId}`}
                </div>
                <span className="text-[11px] text-text-muted">{ev.timestamp}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function JournalForm({
  onSubmit,
  onCancel,
  books,
  ledgerAccounts,
}: {
  onSubmit: (jrnl: Omit<FinanceJournal, 'id' | 'balanced'>) => void
  onCancel: () => void
  books: import('../data/types').FinanceBook[]
  ledgerAccounts: import('../data/types').FinanceLedgerAccount[]
}) {
  const { x } = useI18n()
  const [bookId, setBookId] = useState(books[0]?.id ?? '')
  const [number, setNumber] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState('')
  const [currency] = useState<FinanceCurrency>('CAD')
  const [lines, setLines] = useState<FinanceJournalLine[]>([
    { accountId: ledgerAccounts[0]?.id ?? '', debit: '0.00', credit: '0.00' },
    { accountId: ledgerAccounts[1]?.id ?? '', debit: '0.00', credit: '0.00' },
  ])

  const totalDebit = lines.reduce((s, l) => s + Number(l.debit), 0).toFixed(2)
  const totalCredit = lines.reduce((s, l) => s + Number(l.credit), 0).toFixed(2)
  const balanced = Math.abs(Number(totalDebit) - Number(totalCredit)) < 0.005

  const updateLine = (idx: number, patch: Partial<FinanceJournalLine>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  }
  const addLine = () => setLines((prev) => [...prev, { accountId: ledgerAccounts[0]?.id ?? '', debit: '0.00', credit: '0.00' }])
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      bookId,
      number: number || `JE-${Date.now()}`,
      date,
      description: { en: description, fr: description },
      lines,
      currency,
      status: 'draft' as FinanceJournalStatus,
      source: 'manual',
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mb-[16px] flex flex-col gap-[10px] rounded-[10px] bg-inset p-[12px]">
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_journal_book)}</span>
          <select value={bookId} onChange={(e) => setBookId(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]">
            {books.map((b) => (
              <option key={b.id} value={b.id}>{b.label.en}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_journal_number)}</span>
          <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder={`JE-${Date.now()}`} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_journal_date)}</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_journal_description)}</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
      </div>
      <div>
        <div className="mb-[6px] text-[12px] font-semibold text-text-muted">{x(M.finance_journal_lines)}</div>
        <div className="flex flex-col gap-[6px]">
          {lines.map((line, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_80px_80px_28px] items-center gap-[6px]">
              <select value={line.accountId} onChange={(e) => updateLine(idx, { accountId: e.target.value })} className="rounded-[6px] border border-border bg-surface px-[6px] py-[3px] text-[12px]">
                {ledgerAccounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name.en}</option>
                ))}
              </select>
              <input value={line.debit} onChange={(e) => updateLine(idx, { debit: e.target.value })} placeholder="0.00" className="rounded-[6px] border border-border bg-surface px-[6px] py-[3px] text-[12px]" />
              <input value={line.credit} onChange={(e) => updateLine(idx, { credit: e.target.value })} placeholder="0.00" className="rounded-[6px] border border-border bg-surface px-[6px] py-[3px] text-[12px]" />
              <button type="button" onClick={() => removeLine(idx)} className="text-[14px] text-text-muted hover:text-risk-fg">×</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addLine} className="mt-[6px] text-[12px] font-semibold text-accent">
          + {x(M.finance_journal_add_line)}
        </button>
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-[12px] font-semibold ${balanced ? 'text-success-fg' : 'text-risk-fg'}`}>
          {x(M.finance_journal_debit)}: {totalDebit} · {x(M.finance_journal_credit)}: {totalCredit}
        </span>
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

function LedgerAccountForm({
  onSubmit,
  onCancel,
  books,
}: {
  onSubmit: (acc: Omit<import('../data/types').FinanceLedgerAccount, 'id'>) => void
  onCancel: () => void
  books: import('../data/types').FinanceBook[]
}) {
  const { x } = useI18n()
  const [bookId, setBookId] = useState(books[0]?.id ?? '')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState<import('../data/types').FinanceLedgerAccount['type']>('expense')
  const [sensitive, setSensitive] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      bookId,
      code,
      name: { en: name, fr: name },
      type,
      sensitive,
      active: true,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mb-[12px] flex flex-col gap-[10px] rounded-[10px] bg-inset p-[12px]">
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">Book</span>
          <select value={bookId} onChange={(e) => setBookId(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]">
            {books.map((b) => <option key={b.id} value={b.id}>{x(b.label)}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_ledger_account_code)}</span>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="1000" className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_ledger_account_name)}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]" />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_ledger_account_type)}</span>
          <select value={type} onChange={(e) => setType(e.target.value as import('../data/types').FinanceLedgerAccount['type'])} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]">
            <option value="asset">Asset</option>
            <option value="liability">Liability</option>
            <option value="equity">Equity</option>
            <option value="revenue">Revenue</option>
            <option value="expense">Expense</option>
            <option value="contra">Contra</option>
          </select>
        </label>
      </div>
      <label className="flex items-center gap-[6px]">
        <input type="checkbox" checked={sensitive} onChange={(e) => setSensitive(e.target.checked)} />
        <span className="text-[12px] text-text-muted">{x(M.finance_ledger_account_sensitive)}</span>
      </label>
      <div className="flex justify-end gap-[8px]">
        <button type="button" onClick={onCancel} className="rounded-[6px] bg-inset px-[12px] py-[5px] text-[12px] font-semibold text-text-2 border border-border">{x(M.finance_cancel)}</button>
        <button type="submit" className="rounded-[6px] bg-navy px-[12px] py-[5px] text-[12px] font-semibold text-white">{x(M.finance_save)}</button>
      </div>
    </form>
  )
}
