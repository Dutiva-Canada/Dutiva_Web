import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { supportMessages as M } from '@/i18n/messages/support'
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  STATUS_ORDER,
  SUPPORT_CATEGORIES,
  supportCategory,
} from '@/config/support'
import type { SupportCategory, SupportPriority, SupportStatus } from '@/config/support'
import { adminListTickets, isCurrentUserAdmin } from '@/features/support/supportAdminApi'
import type { AdminTicketFilters, AdminTicketRow } from '@/features/support/supportAdminApi'
import { ServiceStatusControl } from './ServiceStatusControl'
import { CapacityAdminControl } from './CapacityAdminControl'
import { useMdUp } from '@/lib/useMediaQuery'

const PRIORITIES: SupportPriority[] = ['critical', 'high', 'standard', 'low']

function formatDate(iso: string, lang: 'en' | 'fr'): string {
  return new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    month: 'short',
    day: 'numeric',
  })
}

const selectClass =
  'rounded-[8px] border border-border bg-surface px-[10px] py-[7px] text-[13px] text-text'

export function SupportAdminView() {
  const { x, lang } = useI18n()
  const mdUp = useMdUp()
  const [admin, setAdmin] = useState<boolean | null>(null)
  const [filters, setFilters] = useState<AdminTicketFilters>({
    status: 'all',
    priority: 'all',
    category: 'all',
  })
  const [tickets, setTickets] = useState<AdminTicketRow[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    isCurrentUserAdmin()
      .then(setAdmin)
      .catch(() => setAdmin(false))
  }, [])

  useEffect(() => {
    if (admin !== true) return
    let cancelled = false
    setError(false)
    adminListTickets(filters)
      .then((rows) => {
        if (!cancelled) setTickets(rows)
      })
      .catch((e: unknown) => {
        console.error('support admin: list failed', e)
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [admin, filters])

  if (admin === false) {
    return (
      <div className="mx-auto max-w-[900px] px-[28px] pt-[24px]">
        <p className="m-0 rounded-[12px] border border-border bg-inset px-[16px] py-[12px] text-[14px] text-text-2">
          {x(M.support_admin_denied)}
        </p>
      </div>
    )
  }

  const openCount =
    tickets?.filter((t) => t.status !== 'resolved' && t.status !== 'closed').length ?? 0

  return (
    <div className="mx-auto max-w-[1180px] px-[28px] pt-[8px] pb-[64px] max-[640px]:px-[16px]">
      <header className="mb-[18px] flex flex-wrap items-baseline justify-between gap-[10px]">
        <h1 className="m-0 font-display text-[24px] font-semibold tracking-[-0.015em] text-text">
          {x(M.support_admin_title)}
        </h1>
        {tickets && (
          <span className="text-[13px] text-text-muted">
            {x(M.support_admin_open_queues)}:{' '}
            <span className="font-semibold text-text-2">{openCount}</span>
          </span>
        )}
      </header>

      <ServiceStatusControl />
      <CapacityAdminControl />

      <div className="mb-[16px] flex items-center gap-[10px]">
        <Link
          to="/app/support/admin/exports"
          className="rounded-[8px] border border-border bg-surface px-[12px] py-[7px] text-[12.5px] font-semibold text-text-2 hover:bg-inset"
        >
          {x(M.export_audit_title)}
        </Link>
      </div>

      <div className="mb-[16px] flex flex-wrap items-center gap-[10px]">
        <select
          aria-label={x(M.support_admin_filter_status)}
          value={filters.status}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: e.target.value as SupportStatus | 'all' }))
          }
          className={selectClass}
        >
          <option value="all">
            {x(M.support_admin_filter_status)}: {x(M.support_admin_filter_all)}
          </option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {x(STATUS_LABELS[s])}
            </option>
          ))}
        </select>
        <select
          aria-label={x(M.support_admin_filter_priority)}
          value={filters.priority}
          onChange={(e) =>
            setFilters((f) => ({ ...f, priority: e.target.value as SupportPriority | 'all' }))
          }
          className={selectClass}
        >
          <option value="all">
            {x(M.support_admin_filter_priority)}: {x(M.support_admin_filter_all)}
          </option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {x(PRIORITY_LABELS[p])}
            </option>
          ))}
        </select>
        <select
          aria-label={x(M.support_admin_filter_category)}
          value={filters.category}
          onChange={(e) =>
            setFilters((f) => ({ ...f, category: e.target.value as SupportCategory | 'all' }))
          }
          className={selectClass}
        >
          <option value="all">
            {x(M.support_admin_filter_category)}: {x(M.support_admin_filter_all)}
          </option>
          {SUPPORT_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {x(c.label)}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-[6px] text-[13px] text-text-2">
          <input
            type="checkbox"
            checked={!!filters.restrictedOnly}
            onChange={(e) => setFilters((f) => ({ ...f, restrictedOnly: e.target.checked }))}
          />
          {x(M.support_admin_filter_restricted)}
        </label>
        <input
          type="search"
          aria-label={x(M.support_admin_search)}
          placeholder={x(M.support_admin_search)}
          value={filters.search ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className={`${selectClass} min-w-[220px] flex-1`}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="m-0 rounded-[12px] border border-risk-border bg-risk-bg px-[16px] py-[12px] text-[14px] text-risk-fg"
        >
          {x(M.support_requests_error)}
        </p>
      )}
      {tickets && tickets.length === 0 && !error && (
        <p className="m-0 text-[14px] text-text-3">{x(M.support_admin_empty)}</p>
      )}

      {tickets && tickets.length > 0 && mdUp && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[11.5px] tracking-[0.04em] text-text-muted uppercase">
                <th className="py-[8px] pr-[12px] font-semibold">{x(M.support_field_subject)}</th>
                <th className="py-[8px] pr-[12px] font-semibold">
                  {x(M.support_admin_col_requester)}
                </th>
                <th className="py-[8px] pr-[12px] font-semibold">
                  {x(M.support_admin_filter_priority)}
                </th>
                <th className="py-[8px] pr-[12px] font-semibold">
                  {x(M.support_admin_filter_status)}
                </th>
                <th className="py-[8px] font-semibold">{x(M.support_submitted_on)}</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-b border-inset hover:bg-inset">
                  <td className="py-[10px] pr-[12px]">
                    <Link to={`/app/support/admin/${t.id}`} className="font-semibold text-navy">
                      {t.subject}
                    </Link>
                    <div className="text-[11.5px] text-text-muted">
                      {t.publicReference} · {x(supportCategory(t.category).label)}
                      {t.restricted && (
                        <span className="ml-[6px] rounded-[4px] bg-risk-bg px-[5px] py-px text-[10.5px] font-semibold text-risk-fg">
                          {x(M.support_admin_restricted_badge)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-[10px] pr-[12px] text-text-3">{t.requesterEmail ?? '—'}</td>
                  <td className="py-[10px] pr-[12px] text-text-2">
                    {x(PRIORITY_LABELS[t.priority])}
                  </td>
                  <td className="py-[10px] pr-[12px] text-text-2">{x(STATUS_LABELS[t.status])}</td>
                  <td className="py-[10px] text-text-muted">{formatDate(t.createdAt, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tickets && tickets.length > 0 && !mdUp && (
        <div className="flex flex-col gap-[10px]">
          {tickets.map((t) => (
            <Link
              key={t.id}
              to={`/app/support/admin/${t.id}`}
              className="block rounded-[12px] border border-border bg-surface p-[14px]"
            >
              <div className="font-semibold text-navy">{t.subject}</div>
              <div className="mt-[4px] text-[11.5px] text-text-muted">
                {t.publicReference} · {x(supportCategory(t.category).label)}
                {t.restricted && (
                  <span className="ml-[6px] rounded-[4px] bg-risk-bg px-[5px] py-px text-[10.5px] font-semibold text-risk-fg">
                    {x(M.support_admin_restricted_badge)}
                  </span>
                )}
              </div>
              <dl className="mt-3 grid grid-cols-1 gap-y-[6px] text-[12px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-text-muted">{x(M.support_admin_col_requester)}</dt>
                  <dd className="m-0 text-text-3">{t.requesterEmail ?? '—'}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-text-muted">{x(M.support_admin_filter_priority)}</dt>
                  <dd className="m-0 text-text-2">{x(PRIORITY_LABELS[t.priority])}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-text-muted">{x(M.support_admin_filter_status)}</dt>
                  <dd className="m-0 text-text-2">{x(STATUS_LABELS[t.status])}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-text-muted">{x(M.support_submitted_on)}</dt>
                  <dd className="m-0 text-text-muted">{formatDate(t.createdAt, lang)}</dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
