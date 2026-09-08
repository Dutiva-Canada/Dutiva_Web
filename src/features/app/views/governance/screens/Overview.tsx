import { Link } from 'react-router-dom'
import { FileText, Gavel, Users, TrendingUp, ChevronRight } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { governanceMessages as M } from '@/i18n/messages/governance'
import { statusChipClass } from '@/components/chips'
import {
  useWorkspaceRoot,
  workspacePath,
} from '@/features/app/workspaceRoot/workspaceRootContext'
import { useGovernanceData } from '../GovernanceDataContext'

export function Overview() {
  const { x } = useI18n()
  const { root } = useWorkspaceRoot()
  const { records, decisions, officers, shareholders } = useGovernanceData()

  const activeRecords = records.filter((r) => r.status === 'active').length
  /* "Pending" = proposed but not yet adopted/rescinded. */
  const pendingDecisions = decisions.filter((d) => d.status === 'proposed').length
  const adoptedDecisions = decisions.filter((d) => d.status === 'adopted').length
  const activeOfficers = officers.filter((o) => o.is_active).length
  const activeShareholders = shareholders.length

  const cards = [
    { icon: FileText, label: M.gov_tab_records, count: records.length },
    { icon: Gavel, label: M.gov_tab_decisions, count: decisions.length },
    { icon: Users, label: M.gov_tab_officers, count: officers.length },
    { icon: TrendingUp, label: M.gov_tab_shareholders, count: shareholders.length },
  ] as const

  const glance = [
    {
      to: 'governance/records',
      label: M.gov_overview_active_records,
      count: activeRecords,
      tone: 'info',
    },
    {
      to: 'governance/decisions',
      label: M.gov_overview_pending_decisions,
      count: pendingDecisions,
      tone: 'warning',
    },
    {
      to: 'governance/decisions',
      label: M.gov_overview_adopted_decisions,
      count: adoptedDecisions,
      tone: 'success',
    },
    {
      to: 'governance/officers',
      label: M.gov_overview_active_officers,
      count: activeOfficers,
      tone: 'info',
    },
    {
      to: 'governance/shareholders',
      label: M.gov_overview_active_shareholders,
      count: activeShareholders,
      tone: 'info',
    },
  ] as const

  return (
    <div className="space-y-[18px]">
      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
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
      </div>

      <div>
        <h2 className="m-0 mb-[10px] text-[15px] font-semibold text-text">
          {x(M.gov_overview_section_title)}
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
