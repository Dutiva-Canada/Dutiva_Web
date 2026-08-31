import { Link } from 'react-router-dom'
import { ClipboardX } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { analyticsMessages as M } from '@/i18n/messages/analytics'
import { fill } from './format'

/**
 * Service milestones due within 30 days: name, role, jurisdiction, end
 * date and days remaining — with an explicit note when no review task has
 * been created yet, so no milestone date can pass unnoticed.
 */

export interface ServiceMilestoneDisplayRow {
  key: string
  name: string
  /** "Role · jurisdiction". */
  secondary: string
  /** Localized end date ('Jul 25'). */
  endLabel: string
  daysLeft: number
  reviewTaskCreated: boolean
  href?: string
}

function daysLeftLabel(daysLeft: number, x: (b: (typeof M)[keyof typeof M]) => string): string {
  if (daysLeft === 0) return x(M.analytics_service_milestone_ends_today)
  if (daysLeft === 1) return x(M.analytics_service_milestone_day_left)
  return fill(x(M.analytics_service_milestone_days_left), { n: daysLeft })
}

export function ServiceMilestoneList({
  rows,
}: {
  readonly rows: readonly ServiceMilestoneDisplayRow[]
}) {
  const { x } = useI18n()
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {rows.map((row) => {
        const body = (
          <>
            <span className="flex min-w-0 flex-col gap-[2px]">
              <span className="truncate text-[13px] font-semibold text-text">{row.name}</span>
              <span className="truncate text-[12px] text-text-muted">{row.secondary}</span>
              {!row.reviewTaskCreated && (
                <span className="flex items-center gap-[5px] text-[11.5px] font-semibold text-warn-fg">
                  <ClipboardX size={12} strokeWidth={1.9} aria-hidden="true" />
                  {x(M.analytics_service_milestone_no_task)}
                </span>
              )}
            </span>
            <span className="flex shrink-0 flex-col items-end gap-[2px]">
              <span className="text-[12.5px] font-semibold text-text-2">
                {fill(x(M.analytics_service_milestone_ends), { date: row.endLabel })}
              </span>
              <span className="text-[11.5px] text-text-muted tabular-nums">
                {daysLeftLabel(row.daysLeft, x)}
              </span>
            </span>
          </>
        )
        return (
          <li key={row.key} className="border-b border-border-soft last:border-b-0">
            {row.href ? (
              <Link
                to={row.href}
                className="flex min-h-[44px] items-center justify-between gap-[12px] py-[9px] no-underline"
              >
                {body}
              </Link>
            ) : (
              <div className="flex min-h-[44px] items-center justify-between gap-[12px] py-[9px]">
                {body}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
