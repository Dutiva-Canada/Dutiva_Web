import { statusChipClass } from '@/components/chips'
import { useI18n } from '@/i18n/context'
import { financeMessages as M } from '@/i18n/messages/finance'
import { useFinanceData } from '../data/useFinanceData'
import { JOURNAL_STATUS_LABEL } from '../financeLabels'
import type { FinanceClosePeriod, FinanceJournalStatus } from '../data/types'

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
  const { state, canWrite, transitionJournalStatus, transitionClosePeriodStatus } = useFinanceData()

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
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_accounting_ledger)}</h2>
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
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.finance_accounting_journals)}</h2>
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
