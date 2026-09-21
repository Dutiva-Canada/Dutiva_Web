import { useState } from 'react'
import { WorkspaceLink as Link } from '@/features/app/workspaceRoot/WorkspaceLink'
import { ChevronDown, ChevronUp, TriangleAlert } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { analyticsMessages as M } from '@/i18n/messages/analytics'
import { statusChipClass } from '@/components/chips'
import { StatTile } from './StatTile'
import { fill } from './format'

/**
 * Shared body for the certification/training and document-expiry cards:
 * a four-bucket stat-tile row (expired · ≤30 · 31–60 · 61–90 days) and an
 * expandable soonest-first list — the one tap that answers "whose cert
 * lapses this month?". The Expired tile takes the alert treatment only
 * when it is non-zero.
 */

export interface ExpiryDisplayRow {
  key: string
  /** Certification / document name. */
  title: string
  /** "Employee · jurisdiction". */
  secondary: string
  /** Localized expiry date ('Jul 18'). */
  dateLabel: string
  expired: boolean
  href?: string
}

export function ExpiryBucketsSection({
  counts,
  rows,
}: {
  readonly counts: {
    readonly expired: number
    readonly within30: number
    readonly within60: number
    readonly within90: number
  }
  readonly rows: readonly ExpiryDisplayRow[]
}) {
  const { x } = useI18n()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col">
      <div className="flex gap-[8px]">
        <StatTile
          value={String(counts.expired)}
          label={x(M.analytics_bucket_expired)}
          alert={counts.expired > 0}
        />
        <StatTile value={String(counts.within30)} label={x(M.analytics_bucket_30)} />
        <StatTile value={String(counts.within60)} label={x(M.analytics_bucket_60)} />
        <StatTile value={String(counts.within90)} label={x(M.analytics_bucket_90)} />
      </div>

      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="mt-[10px] flex min-h-[36px] cursor-pointer items-center gap-[6px] self-start rounded-[8px] border-none bg-transparent p-0 font-sans text-[12.5px] font-semibold text-accent"
      >
        {open ? (
          <ChevronUp size={14} strokeWidth={1.9} aria-hidden="true" />
        ) : (
          <ChevronDown size={14} strokeWidth={1.9} aria-hidden="true" />
        )}
        {open ? x(M.analytics_expiry_hide) : fill(x(M.analytics_expiry_show), { n: rows.length })}
      </button>

      {open && (
        <ul className="m-0 flex list-none flex-col p-0">
          {rows.map((row) => {
            const body = (
              <>
                <span className="flex min-w-0 flex-col gap-[2px]">
                  <span className="line-clamp-2 text-[13px] leading-[1.35] font-semibold text-text">
                    {row.title}
                  </span>
                  <span className="truncate text-[12px] text-text-muted">{row.secondary}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-[2px]">
                  {row.expired && (
                    <span className={`${statusChipClass('risk')} items-center`}>
                      <TriangleAlert
                        size={12}
                        strokeWidth={1.9}
                        className="mr-[5px]"
                        aria-hidden="true"
                      />
                      {x(M.analytics_bucket_expired)}
                    </span>
                  )}
                  <span
                    className={`text-[12.5px] font-semibold tabular-nums ${
                      row.expired ? 'text-risk-fg' : 'text-text-2'
                    }`}
                  >
                    {row.dateLabel}
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
      )}
    </div>
  )
}
