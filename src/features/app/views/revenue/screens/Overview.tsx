import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Banknote,
  Calendar,
  Funnel,
  Link2,
  Megaphone,
  Receipt,
  TrendingUp,
  Activity,
} from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { revenueMessages as M } from '@/i18n/messages/revenue'
import { entityLinksMessages as EM } from '@/i18n/messages/entityLinks'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import {
  useWorkspaceRoot,
  workspacePath,
} from '@/features/app/workspaceRoot/workspaceRootContext'
import { useCrmData } from '@/features/app/views/crm/useCrmData'
import { loadCommsState } from '@/features/app/views/comms/data/productionApi'
import { initialCommsState } from '@/features/app/views/comms/data/fixtures'
import { statusChipClass } from '@/components/chips'
import { listEntityLinks } from '@/features/app/entityLinks/data/productionApi'
import { entityLinks as fixtureLinks } from '@/features/app/entityLinks/data/fixtures'
import type { EntityLink } from '@/features/app/entityLinks/data/types'
import { useRevenueData } from '../RevenueDataContext'
import { fill, formatCurrency } from '../data/format'

const STAGE_ORDER = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const

/** Entity-link endpoints that belong to this module. */
const REVENUE_TABLES = new Set(['revenue_streams', 'revenue_invoices'])

function firstCurrency(values: { currency: string }[]): string {
  return values[0]?.currency ?? 'CAD'
}

function mrrAmount(
  streams: { stream_type: string; status: string; frequency: string | null; amount: number }[],
): number {
  return Math.round(
    streams
      .filter((s) => s.stream_type === 'recurring' && s.status === 'active' && s.frequency)
      .reduce((sum, s) => {
        const divisor = s.frequency === 'annually' ? 12 : s.frequency === 'quarterly' ? 4 : 1
        return sum + s.amount / divisor
      }, 0),
  )
}

function openInvoiceTotal(invoices: { status: string; amount: number }[]): number {
  return invoices
    .filter((i) => i.status === 'sent' || i.status === 'overdue')
    .reduce((sum, i) => sum + i.amount, 0)
}

function paidYtd(
  invoices: { status: string; paid_date: string | null; amount: number }[],
  year: string,
): number {
  return invoices
    .filter((i) => i.status === 'paid' && i.paid_date && i.paid_date.slice(0, 4) === year)
    .reduce((sum, i) => sum + i.amount, 0)
}

function overdueCount(
  invoices: { status: string; due_date: string | null }[],
  todayISO: string,
): number {
  return invoices.filter(
    (i) => (i.status === 'sent' && i.due_date && i.due_date < todayISO) || i.status === 'overdue',
  ).length
}

export function Overview() {
  const { x } = useI18n()
  const { mode, organizationId } = useWorkspaceMode()
  const { root } = useWorkspaceRoot()
  const { streams, invoices } = useRevenueData()

  const todayISO = new Date().toISOString().slice(0, 10)

  const crm = useCrmData(mode, organizationId ?? undefined)
  const crmState = crm.state

  const commsState = useMemo(
    () =>
      mode === 'production' && organizationId ? loadCommsState(organizationId) : initialCommsState,
    [mode, organizationId],
  )

  /* Cross-module entity links touching this module's records (either direction). */
  const isProduction = mode === 'production' && Boolean(organizationId)
  const [prodLinks, setProdLinks] = useState<EntityLink[]>([])
  const [linksLoading, setLinksLoading] = useState(false)
  const [linksError, setLinksError] = useState(false)

  useEffect(() => {
    if (!isProduction || !organizationId) return
    const orgId = organizationId
    let cancelled = false
    async function load() {
      try {
        setLinksLoading(true)
        setLinksError(false)
        const rows = await listEntityLinks(orgId)
        if (!cancelled) {
          setProdLinks(
            rows.filter(
              (l) => REVENUE_TABLES.has(l.from_table) || REVENUE_TABLES.has(l.to_table),
            ),
          )
        }
      } catch {
        if (!cancelled) setLinksError(true)
      } finally {
        if (!cancelled) setLinksLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [isProduction, organizationId])

  const linkedRecords = useMemo(() => {
    const map = new Map<string, { title: string; view: string; module: string }>()
    for (const s of streams) {
      map.set(`revenue_streams:${s.id}`, {
        title: s.name,
        view: 'revenue/streams',
        module: x(M.rev_links_streams),
      })
    }
    for (const i of invoices) {
      map.set(`revenue_invoices:${i.id}`, {
        title: i.customer_name,
        view: 'revenue/invoices',
        module: x(M.rev_tab_invoices),
      })
    }
    for (const d of crmState.deals) {
      map.set(`crm_deals:${d.id}`, {
        title: d.title,
        view: 'crm',
        module: x(M.rev_links_crm_deals),
      })
    }
    for (const i of commsState.initiatives) {
      map.set(`comms_initiatives:${i.id}`, {
        title: x(i.title),
        view: 'comms/initiatives',
        module: x(M.rev_links_comms_initiatives),
      })
    }
    return map
  }, [streams, invoices, crmState.deals, commsState.initiatives, x])

  const links = useMemo(() => {
    if (isProduction) return prodLinks
    return fixtureLinks.filter(
      (l) => REVENUE_TABLES.has(l.from_table) || REVENUE_TABLES.has(l.to_table),
    )
  }, [isProduction, prodLinks])

  const mrr = mrrAmount(streams)
  const mrrCurrency = firstCurrency(
    streams.filter((s) => s.stream_type === 'recurring' && s.status === 'active' && s.frequency),
  )

  const openTotal = openInvoiceTotal(invoices)
  const openCurrency = firstCurrency(
    invoices.filter((i) => i.status === 'sent' || i.status === 'overdue'),
  )
  const openInvoiceCount = invoices.filter(
    (i) => i.status === 'sent' || i.status === 'overdue',
  ).length

  const paid = paidYtd(invoices, todayISO.slice(0, 4))
  const paidCurrency = firstCurrency(invoices.filter((i) => i.status === 'paid'))
  const paidCount = invoices.filter(
    (i) => i.status === 'paid' && i.paid_date && i.paid_date.slice(0, 4) === todayISO.slice(0, 4),
  ).length

  const overdue = overdueCount(invoices, todayISO)
  const activeRecurringCount = streams.filter(
    (s) => s.stream_type === 'recurring' && s.status === 'active' && s.frequency,
  ).length

  const recentInvoices = [...invoices]
    .filter((i) => i.status === 'sent' || i.status === 'overdue')
    .sort((a, b) =>
      (b.issue_date ?? b.due_date ?? '').localeCompare(a.issue_date ?? a.due_date ?? ''),
    )
    .slice(0, 5)

  const pipeline = STAGE_ORDER.map((stage) => ({
    stage,
    deals: crmState.deals.filter((d) => d.stage === stage),
  })).filter((group) => group.deals.length > 0)

  const totalOpenValue = crmState.deals
    .filter((d) => d.stage !== 'won' && d.stage !== 'lost')
    .reduce((sum, d) => sum + (d.value ?? 0), 0)

  const activeCampaigns = commsState.initiatives.filter((i) => i.status === 'active').slice(0, 5)

  const recentActivity = [...crmState.activities]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)

  const upcomingComms = commsState.contentItems
    .filter((c) => c.deliveryStatus === 'scheduled' || c.status === 'approved')
    .sort((a, b) => (a.scheduledFor ?? '').localeCompare(b.scheduledFor ?? ''))
    .slice(0, 5)

  const statusTone: Record<string, 'success' | 'warning' | 'risk' | 'neutral' | 'info'> = {
    sent: 'info',
    paid: 'success',
    overdue: 'risk',
    draft: 'neutral',
    cancelled: 'neutral',
  }

  return (
    <div className="space-y-[18px]">
      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="mb-[10px] flex items-center gap-[10px]">
            <TrendingUp size={18} className="text-text-muted" aria-hidden="true" />
            <h2 className="m-0 text-[13px] font-semibold text-text">{x(M.rev_mrr)}</h2>
          </div>
          <div className="font-display text-[22px] font-bold text-text">
            {formatCurrency(mrr, mrrCurrency)}
          </div>
          <p className="m-0 mt-[4px] text-[12px] text-text-muted">
            {fill(x(M.rev_active_streams_summary), { n: activeRecurringCount })}
          </p>
        </div>

        <div className="rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="mb-[10px] flex items-center gap-[10px]">
            <Receipt size={18} className="text-text-muted" aria-hidden="true" />
            <h2 className="m-0 text-[13px] font-semibold text-text">{x(M.rev_open_invoices)}</h2>
          </div>
          <div className="font-display text-[22px] font-bold text-text">
            {formatCurrency(openTotal, openCurrency)}
          </div>
          <p className="m-0 mt-[4px] text-[12px] text-text-muted">
            {fill(x(M.rev_open_invoices_count), { n: openInvoiceCount })}
          </p>
        </div>

        <div className="rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="mb-[10px] flex items-center gap-[10px]">
            <Banknote size={18} className="text-text-muted" aria-hidden="true" />
            <h2 className="m-0 text-[13px] font-semibold text-text">{x(M.rev_paid_ytd)}</h2>
          </div>
          <div className="font-display text-[22px] font-bold text-text">
            {formatCurrency(paid, paidCurrency)}
          </div>
          <p className="m-0 mt-[4px] text-[12px] text-text-muted">
            {fill(x(M.rev_paid_ytd_summary), { n: paidCount })}
          </p>
        </div>

        <div className="rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="mb-[10px] flex items-center gap-[10px]">
            <AlertTriangle size={18} className="text-text-muted" aria-hidden="true" />
            <h2 className="m-0 text-[13px] font-semibold text-text">{x(M.rev_overdue)}</h2>
          </div>
          <div
            className={`font-display text-[22px] font-bold ${overdue > 0 ? 'text-risk-fg' : 'text-text'}`}
          >
            {overdue}
          </div>
          <p className="m-0 mt-[4px] text-[12px] text-text-muted">
            {fill(x(M.rev_overdue_summary), { n: overdue })}
          </p>
        </div>
      </div>

      <div className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] flex items-center gap-[10px]">
          <Receipt size={18} className="text-text-muted" aria-hidden="true" />
          <h2 className="m-0 text-[15px] font-semibold text-text">{x(M.rev_recent_invoices)}</h2>
        </div>
        {recentInvoices.length === 0 ? (
          <p className="m-0 text-[13px] text-text-muted">{x(M.rev_empty_invoices)}</p>
        ) : (
          <div className="space-y-2">
            {recentInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between rounded-[8px] border border-inset bg-inset px-[12px] py-[8px]"
              >
                <div>
                  <div className="text-[13px] font-medium text-text">{invoice.customer_name}</div>
                  <div className="text-[12px] text-text-muted">
                    {x(M.rev_due)} {invoice.due_date ?? '—'}
                  </div>
                </div>
                <div className="flex items-center gap-[10px]">
                  <span className="text-[13px] font-medium text-text">
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </span>
                  <span className={statusChipClass(statusTone[invoice.status] ?? 'neutral')}>
                    {x(M[`rev_invoice_status_${invoice.status}` as keyof typeof M])}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-[14px] lg:grid-cols-2">
        <div className="rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="mb-[12px] flex items-center gap-[10px]">
            <Funnel size={18} className="text-text-muted" aria-hidden="true" />
            <h2 className="m-0 text-[15px] font-semibold text-text">{x(M.rev_pipeline)}</h2>
          </div>
          {crmState.deals.length === 0 ? (
            <p className="m-0 text-[13px] text-text-muted">{x(M.rev_empty_crm)}</p>
          ) : (
            <>
              <div className="mb-[12px] text-[13px] text-text-muted">
                {x(M.rev_value)}: {formatCurrency(totalOpenValue, 'CAD')}
              </div>
              <div className="space-y-2">
                {pipeline.map((group) => (
                  <div
                    key={group.stage}
                    className="flex items-center justify-between rounded-[8px] border border-inset bg-inset px-[12px] py-[8px]"
                  >
                    <span className="text-[13px] capitalize text-text">{group.stage}</span>
                    <div className="text-[13px] text-text-muted">
                      {group.deals.length} {x(M.rev_deals)} ·{' '}
                      {formatCurrency(
                        group.deals.reduce((sum, d) => sum + (d.value ?? 0), 0),
                        'CAD',
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="mb-[12px] flex items-center gap-[10px]">
            <Megaphone size={18} className="text-text-muted" aria-hidden="true" />
            <h2 className="m-0 text-[15px] font-semibold text-text">{x(M.rev_active_campaigns)}</h2>
          </div>
          {activeCampaigns.length === 0 ? (
            <p className="m-0 text-[13px] text-text-muted">{x(M.rev_empty_comms)}</p>
          ) : (
            <div className="space-y-2">
              {activeCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between rounded-[8px] border border-inset bg-inset px-[12px] py-[8px]"
                >
                  <span className="text-[13px] text-text">{x(campaign.title)}</span>
                  <span className={statusChipClass('success')}>{campaign.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="mb-[12px] flex items-center gap-[10px]">
            <Activity size={18} className="text-text-muted" aria-hidden="true" />
            <h2 className="m-0 text-[15px] font-semibold text-text">{x(M.rev_recent_activity)}</h2>
          </div>
          {recentActivity.length === 0 ? (
            <p className="m-0 text-[13px] text-text-muted">{x(M.rev_empty_crm)}</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between rounded-[8px] border border-inset bg-inset px-[12px] py-[8px]"
                >
                  <span className="text-[13px] text-text">{x(activity.summary)}</span>
                  <span className="text-[12px] text-text-muted">{activity.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="mb-[12px] flex items-center gap-[10px]">
            <Calendar size={18} className="text-text-muted" aria-hidden="true" />
            <h2 className="m-0 text-[15px] font-semibold text-text">{x(M.rev_upcoming_comms)}</h2>
          </div>
          {upcomingComms.length === 0 ? (
            <p className="m-0 text-[13px] text-text-muted">{x(M.rev_empty_comms)}</p>
          ) : (
            <div className="space-y-2">
              {upcomingComms.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-[8px] border border-inset bg-inset px-[12px] py-[8px]"
                >
                  <span className="text-[13px] text-text">{x(item.title)}</span>
                  <span className="text-[12px] text-text-muted">{item.scheduledFor}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] flex items-center gap-[10px]">
          <Link2 size={18} className="text-text-muted" aria-hidden="true" />
          <h2 className="m-0 text-[15px] font-semibold text-text">{x(EM.el_title)}</h2>
        </div>
        {isProduction && linksLoading ? (
          <p className="m-0 text-[13px] text-text-muted">{x(EM.el_loading)}</p>
        ) : linksError ? (
          <p className="m-0 text-[13px] text-risk-fg">{x(EM.el_error)}</p>
        ) : links.length === 0 ? (
          <p className="m-0 text-[13px] text-text-muted">{x(EM.el_empty)}</p>
        ) : (
          <div className="space-y-2">
            {links.map((link) => {
              const from = linkedRecords.get(`${link.from_table}:${link.from_id}`)
              const to = linkedRecords.get(`${link.to_table}:${link.to_id}`)
              return (
                <div
                  key={link.id}
                  className="flex items-center justify-between gap-[10px] rounded-[8px] border border-inset bg-inset px-[12px] py-[8px]"
                >
                  <div className="flex min-w-0 items-center gap-[6px] text-[13px]">
                    {from ? (
                      <Link
                        to={workspacePath(root, from.view)}
                        className="truncate font-medium text-text hover:text-accent"
                      >
                        {from.title}
                      </Link>
                    ) : (
                      <span className="truncate font-medium text-text">{link.from_id}</span>
                    )}
                    <span className="shrink-0 text-text-faint" aria-hidden="true">
                      →
                    </span>
                    {to ? (
                      <Link
                        to={workspacePath(root, to.view)}
                        className="truncate font-medium text-text hover:text-accent"
                      >
                        {to.title}
                      </Link>
                    ) : (
                      <span className="truncate font-medium text-text">{link.to_id}</span>
                    )}
                  </div>
                  {to ? (
                    <span className="shrink-0 text-[12px] text-text-muted">{to.module}</span>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to={`${root}/crm`}
          className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] font-medium text-text hover:bg-inset"
        >
          {x(M.rev_go_to_crm)}
        </Link>
        <Link
          to={`${root}/comms`}
          className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] font-medium text-text hover:bg-inset"
        >
          {x(M.rev_go_to_comms)}
        </Link>
      </div>

      <div className="rounded-[12px] border border-border bg-surface p-[14px]">
        <p className="m-0 text-[13px] text-text-muted">{x(M.rev_disclaimer)}</p>
      </div>
    </div>
  )
}
