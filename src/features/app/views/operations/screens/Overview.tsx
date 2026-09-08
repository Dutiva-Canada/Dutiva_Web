import { Link } from 'react-router-dom'
import {
  FolderKanban,
  Truck,
  ClipboardCheck,
  Cpu,
  PackageCheck,
  ChevronRight,
} from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { operationsMessages as M } from '@/i18n/messages/operations'
import { statusChipClass } from '@/components/chips'
import {
  useWorkspaceRoot,
  workspacePath,
} from '@/features/app/workspaceRoot/workspaceRootContext'
import { useOperationsData } from '../OperationsDataContext'

export function Overview() {
  const { x } = useI18n()
  const { root } = useWorkspaceRoot()
  const { projects, vendors, qualityChecks, technology, logistics } = useOperationsData()

  const todayISO = new Date().toISOString().slice(0, 10)
  const in7ISO = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

  const activeProjects = projects.filter((p) => p.status === 'active').length
  const activeVendors = vendors.filter((v) => v.status === 'active').length
  const overdueQuality = qualityChecks.filter((q) => q.status === 'overdue').length
  const techRenewalsSoon = technology.filter(
    (t) => t.renewal_date !== null && t.renewal_date >= todayISO && t.renewal_date <= in7ISO,
  ).length
  const delayedLogistics = logistics.filter((l) => l.status === 'delayed').length

  const cards = [
    { icon: FolderKanban, label: M.ops_tab_projects, count: projects.length },
    { icon: PackageCheck, label: M.ops_tab_vendors, count: vendors.length },
    { icon: ClipboardCheck, label: M.ops_tab_quality, count: qualityChecks.length },
    { icon: Cpu, label: M.ops_tab_technology, count: technology.length },
    { icon: Truck, label: M.ops_tab_logistics, count: logistics.length },
  ] as const

  const glance = [
    {
      to: 'operations/projects',
      label: M.ops_overview_active_projects,
      count: activeProjects,
      tone: 'info',
    },
    {
      to: 'operations/vendors',
      label: M.ops_overview_active_vendors,
      count: activeVendors,
      tone: 'info',
    },
    {
      to: 'operations/quality',
      label: M.ops_overview_overdue_quality,
      count: overdueQuality,
      tone: 'risk',
    },
    {
      to: 'operations/technology',
      label: M.ops_overview_tech_renewals,
      count: techRenewalsSoon,
      tone: 'warning',
    },
    {
      to: 'operations/logistics',
      label: M.ops_overview_delayed_logistics,
      count: delayedLogistics,
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
          <FolderKanban size={20} strokeWidth={1.6} className="text-text-muted" aria-hidden="true" />
          <p className="m-0 text-[13px] text-text-muted">{x(M.ops_disclaimer)}</p>
        </div>
      </div>

      <div>
        <h2 className="m-0 mb-[10px] text-[15px] font-semibold text-text">
          {x(M.ops_overview_section_title)}
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
