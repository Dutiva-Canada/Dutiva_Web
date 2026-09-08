import { Link } from 'react-router-dom'
import { BookOpen, Users, ChevronRight } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { specialistsMessages as M } from '@/i18n/messages/specialists'
import { statusChipClass } from '@/components/chips'
import { useWorkspaceRoot, workspacePath } from '@/features/app/workspaceRoot/workspaceRootContext'
import { useSpecialistsData } from '../SpecialistsDataContext'
import { fill } from '@/features/app/views/analytics/format'
import type { SpecialistSpecialty } from '../data/types'

const SPECIALTIES: SpecialistSpecialty[] = [
  'lawyer',
  'accountant',
  'tax',
  'insurance',
  'it_security',
  'hr_consultant',
  'bookkeeper',
  'other',
]

const SPECIALTY_LABELS: Record<SpecialistSpecialty, keyof typeof M> = {
  lawyer: 'spec_specialty_lawyer',
  accountant: 'spec_specialty_accountant',
  tax: 'spec_specialty_tax',
  insurance: 'spec_specialty_insurance',
  it_security: 'spec_specialty_it_security',
  hr_consultant: 'spec_specialty_hr_consultant',
  bookkeeper: 'spec_specialty_bookkeeper',
  other: 'spec_specialty_other',
}

export function Overview() {
  const { x } = useI18n()
  const { root } = useWorkspaceRoot()
  const { specialists, engagements } = useSpecialistsData()

  const todayISO = new Date().toISOString().slice(0, 10)
  const in7ISO = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  const currentMonth = todayISO.slice(0, 7)

  const activeAccessCount = specialists.filter((s) => s.workspace_access).length
  const engagementsThisMonth = engagements.filter(
    (e) => e.engagement_date !== null && e.engagement_date.startsWith(currentMonth),
  ).length
  const followUpsDue = engagements.filter(
    (e) => e.follow_up_date !== null && e.follow_up_date >= todayISO && e.follow_up_date <= in7ISO,
  ).length
  const overdueFollowUps = engagements.filter(
    (e) => e.follow_up_date !== null && e.follow_up_date < todayISO,
  ).length

  const cards = [
    { icon: Users, label: M.spec_tab_directory, count: specialists.length },
    { icon: BookOpen, label: M.spec_tab_engagements, count: engagements.length },
  ] as const

  const glance = [
    {
      to: 'specialists/directory',
      label: M.spec_overview_active_access,
      count: activeAccessCount,
      tone: 'info' as const,
    },
    {
      to: 'specialists/engagements',
      label: M.spec_overview_engagements_month,
      count: engagementsThisMonth,
      tone: 'info' as const,
    },
    {
      to: 'specialists/engagements',
      label: M.spec_overview_followups_due,
      count: followUpsDue,
      tone: 'warning' as const,
    },
    {
      to: 'specialists/engagements',
      label: M.spec_overview_overdue_followups,
      count: overdueFollowUps,
      tone: 'risk' as const,
    },
    ...SPECIALTIES.map((specialty) => ({
      to: 'specialists/directory',
      label: M.spec_overview_by_specialty,
      fill: { specialty: x(M[SPECIALTY_LABELS[specialty]]) },
      count: specialists.filter((s) => s.specialty === specialty).length,
      tone: 'info' as const,
    })),
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
        <div className="col-span-1 flex items-center gap-[14px] rounded-[12px] border border-border bg-surface p-[16px] sm:col-span-2">
          <Users size={20} strokeWidth={1.6} className="text-text-muted" aria-hidden="true" />
          <p className="m-0 text-[13px] text-text-muted">{x(M.spec_disclaimer)}</p>
        </div>
      </div>

      <div>
        <h2 className="m-0 mb-[10px] text-[15px] font-semibold text-text">
          {x(M.spec_overview_section_title)}
        </h2>
        <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2 lg:grid-cols-3">
          {glance.map((stat, index) => {
            const label = 'fill' in stat ? fill(x(stat.label), stat.fill) : x(stat.label)
            return (
              <Link
                key={`${label}-${index}`}
                to={workspacePath(root, stat.to)}
                className="flex items-center justify-between gap-[12px] rounded-[12px] border border-border bg-surface px-[14px] py-[12px] hover:bg-inset"
              >
                <span className="min-w-0 truncate text-[13px] font-medium text-text">{label}</span>
                <span className="flex shrink-0 items-center gap-[6px]">
                  <span
                    className={statusChipClass(
                      stat.count > 0 ? stat.tone : 'neutral',
                    )}
                  >
                    {stat.count}
                  </span>
                  <ChevronRight size={14} className="text-text-faint" aria-hidden="true" />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
