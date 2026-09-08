import { Link } from 'react-router-dom'
import { Shield, Package, ClipboardList, AlertTriangle, Radar, Truck, ChevronRight } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { securityMessages as M } from '@/i18n/messages/security'
import { statusChipClass } from '@/components/chips'
import {
  useWorkspaceRoot,
  workspacePath,
} from '@/features/app/workspaceRoot/workspaceRootContext'
import { useSecurityData } from '../SecurityDataContext'

export function Overview() {
  const { x } = useI18n()
  const { root } = useWorkspaceRoot()
  const { assets, accessReviews, incidents, risks, vendorReviews } = useSecurityData()

  const todayISO = new Date().toISOString().slice(0, 10)
  const in7ISO = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

  const atRisk = assets.filter((a) => a.status === 'at_risk').length
  const criticalAssets = assets.filter((a) => a.criticality === 'critical').length
  const openIncidents = incidents.filter(
    (i) => i.status === 'open' || i.status === 'contained',
  ).length
  const criticalIncidents = incidents.filter(
    (i) => (i.status === 'open' || i.status === 'contained') && i.severity === 'critical',
  ).length
  const overdueReviews = accessReviews.filter(
    (r) =>
      (r.status === 'pending' || r.status === 'in_progress') &&
      r.review_due_date !== null &&
      r.review_due_date < todayISO,
  ).length
  const reviewsDueSoon = accessReviews.filter(
    (r) =>
      (r.status === 'pending' || r.status === 'in_progress') &&
      r.review_due_date !== null &&
      r.review_due_date >= todayISO &&
      r.review_due_date <= in7ISO,
  ).length
  const vendorsDueSoon = vendorReviews.filter(
    (v) =>
      v.next_review_date !== null &&
      v.next_review_date >= todayISO &&
      v.next_review_date <= in7ISO,
  ).length

  const cards = [
    { icon: Package, label: M.sec_tab_assets, count: assets.length },
    { icon: ClipboardList, label: M.sec_tab_access, count: accessReviews.length },
    { icon: AlertTriangle, label: M.sec_tab_incidents, count: incidents.length },
    { icon: Radar, label: M.sec_tab_risks, count: risks.length },
    { icon: Truck, label: M.sec_tab_vendors, count: vendorReviews.length },
  ] as const

  const glance = [
    { to: 'security/assets', label: M.sec_overview_at_risk, count: atRisk, tone: 'risk' },
    {
      to: 'security/assets',
      label: M.sec_overview_critical_assets,
      count: criticalAssets,
      tone: 'warning',
    },
    {
      to: 'security/incidents',
      label: M.sec_overview_open_incidents,
      count: openIncidents,
      tone: 'warning',
    },
    {
      to: 'security/incidents',
      label: M.sec_overview_critical_incidents,
      count: criticalIncidents,
      tone: 'risk',
    },
    {
      to: 'security/access',
      label: M.sec_overview_overdue_reviews,
      count: overdueReviews,
      tone: 'risk',
    },
    {
      to: 'security/access',
      label: M.sec_overview_reviews_due,
      count: reviewsDueSoon,
      tone: 'warning',
    },
    {
      to: 'security/vendors',
      label: M.sec_overview_vendors_due,
      count: vendorsDueSoon,
      tone: 'warning',
    },
  ] as const

  return (
    <div className="space-y-[18px]">
      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label.en}
              className="flex items-center gap-[14px] rounded-[12px] border border-border bg-surface p-[16px]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-border bg-inset">
                <Icon size={20} strokeWidth={1.6} className="text-text-muted" aria-hidden="true" />
              </div>
              <div>
                <div className="font-display text-[22px] font-bold text-text">{card.count}</div>
                <div className="text-[12.5px] text-text-muted">{x(card.label)}</div>
              </div>
            </div>
          )
        })}
        <div className="col-span-1 flex items-center gap-[14px] rounded-[12px] border border-border bg-surface p-[16px] sm:col-span-2 lg:col-span-3">
          <Shield size={20} strokeWidth={1.6} className="text-text-muted" aria-hidden="true" />
          <p className="m-0 text-[13px] text-text-muted">{x(M.sec_disclaimer)}</p>
        </div>
      </div>

      <div>
        <h2 className="m-0 mb-[10px] text-[15px] font-semibold text-text">
          {x(M.sec_overview_section_title)}
        </h2>
        <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2 lg:grid-cols-3">
          {glance.map((stat) => (
            <Link
              key={stat.label.en}
              to={workspacePath(root, stat.to)}
              className="flex items-center justify-between gap-[12px] rounded-[12px] border border-border bg-surface px-[14px] py-[12px] hover:bg-inset"
            >
              <span className="min-w-0 truncate text-[13px] font-medium text-text">
                {x(stat.label)}
              </span>
              <span className="flex shrink-0 items-center gap-[6px]">
                <span className={statusChipClass(stat.count > 0 ? stat.tone : 'neutral')}>
                  {stat.count}
                </span>
                <ChevronRight size={14} className="text-text-faint" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
