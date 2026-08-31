import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { supportMessages as M } from '@/i18n/messages/support'
import { STATUS_LABELS, supportCategory } from '@/config/support'
import { listMySupportTickets } from '@/features/support/supportApi'
import type { SupportTicketSummary } from '@/features/support/supportApi'
import { SupportSectionNav } from './SupportSectionNav'

type State =
  { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; tickets: SupportTicketSummary[] }

function formatDate(iso: string, lang: 'en' | 'fr'): string {
  return new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** /app/support/requests — the caller's own tickets (RLS-scoped read). */
export function SupportRequestsList() {
  const { x, lang } = useI18n()
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false
    listMySupportTickets()
      .then((tickets) => {
        if (!cancelled) setState({ kind: 'ready', tickets })
      })
      .catch((error: unknown) => {
        console.error('support: failed to load requests', error)
        if (!cancelled) setState({ kind: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-[900px] px-[28px] pt-[8px] pb-[64px] max-[640px]:px-[16px]">
      <SupportSectionNav active="requests" />

      {state.kind === 'loading' && (
        <p className="m-0 text-[14px] text-text-3" role="status">
          {x(M.support_requests_loading)}
        </p>
      )}

      {state.kind === 'error' && (
        <p
          className="m-0 rounded-[12px] border border-risk-border bg-risk-bg px-[16px] py-[12px] text-[14px] text-risk-fg"
          role="alert"
        >
          {x(M.support_requests_error)}
        </p>
      )}

      {state.kind === 'ready' && state.tickets.length === 0 && (
        <div className="rounded-[14px] border border-border bg-surface px-[24px] py-[28px] text-center">
          <p className="m-0 mb-[14px] text-[14px] text-text-3">{x(M.support_requests_empty)}</p>
          <Link
            to="/app/support"
            className="inline-block rounded-[9px] bg-navy px-[18px] py-[10px] text-[13.5px] font-semibold text-white"
          >
            {x(M.support_requests_empty_cta)}
          </Link>
        </div>
      )}

      {state.kind === 'ready' && state.tickets.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-[10px] p-0">
          {state.tickets.map((t) => (
            <li key={t.id}>
              <Link
                to={`/app/support/requests/${t.id}`}
                className="flex flex-wrap items-center justify-between gap-[10px] rounded-[12px] border border-border bg-surface px-[18px] py-[14px] transition-colors hover:bg-inset"
              >
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-semibold text-text">{t.subject}</div>
                  <div className="mt-[2px] text-[12px] text-text-muted">
                    {t.publicReference} · {x(supportCategory(t.category).label)} ·{' '}
                    {x(M.support_submitted_on)} {formatDate(t.createdAt, lang)}
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-[6px] rounded-full bg-inset px-[10px] py-[4px] text-[12px] font-semibold text-text-2">
                  <span className="h-[6px] w-[6px] rounded-full bg-text-muted" aria-hidden="true" />
                  {x(STATUS_LABELS[t.status])}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
