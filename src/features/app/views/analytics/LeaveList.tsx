import { WorkspaceLink as Link } from '@/features/app/workspaceRoot/WorkspaceLink'
import { ShieldCheck } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { analyticsMessages as M } from '@/i18n/messages/analytics'
import { sourceChipClass } from '@/components/chips'

/**
 * Leave overview — status only, never balances or medical detail. Grouped:
 * returns within 14 days first (the reinstatement-sensitive set), then
 * everyone else currently on leave. Protected leave carries an explicit
 * shield + text chip.
 */

export interface LeaveDisplayRow {
  key: string
  name: string
  /** Leave type ('Parental leave'). */
  type: string
  protected: boolean
  /** 'Returns Jul 16' — or a status note for ongoing arrangements. */
  returnLabel: string
  /** True when the return date is within the 14-day window. */
  imminent: boolean
  href?: string
}

function LeaveRow({ row }: { readonly row: LeaveDisplayRow }) {
  const { x } = useI18n()
  const body = (
    <>
      <span className="flex min-w-0 flex-col gap-[2px]">
        <span className="truncate text-[13px] font-semibold text-text">{row.name}</span>
        {/* Chip rides the type line (wrapping under it when tight) so
            neither the name nor the type truncates for it. */}
        <span className="flex min-w-0 flex-wrap items-center gap-x-[7px] gap-y-[3px]">
          <span className="truncate text-[12px] text-text-muted">{row.type}</span>
          {row.protected && (
            <span className={`${sourceChipClass('info')} items-center`}>
              <ShieldCheck size={11} strokeWidth={1.9} className="mr-[4px]" aria-hidden="true" />
              {x(M.analytics_leave_protected)}
            </span>
          )}
        </span>
      </span>
      {/* Capped and wrapping, so a long note can't crush the left column. */}
      <span className="max-w-[45%] shrink-0 text-right text-[12.5px] leading-[1.35] font-semibold text-text-2">
        {row.returnLabel}
      </span>
    </>
  )
  return (
    <li className="border-b border-border-soft last:border-b-0">
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
}

function Group({ heading, rows }: { readonly heading: string; readonly rows: LeaveDisplayRow[] }) {
  if (rows.length === 0) return null
  return (
    <div>
      <div className="mb-[2px] text-[11.5px] font-bold tracking-[0.04em] uppercase text-text-muted">
        {heading}
      </div>
      <ul className="m-0 flex list-none flex-col p-0">
        {rows.map((row) => (
          <LeaveRow key={row.key} row={row} />
        ))}
      </ul>
    </div>
  )
}

export function LeaveList({ rows }: { readonly rows: readonly LeaveDisplayRow[] }) {
  const { x } = useI18n()
  const returning = rows.filter((r) => r.imminent)
  const onLeave = rows.filter((r) => !r.imminent)
  return (
    <div className="flex flex-col gap-[12px]">
      <Group heading={x(M.analytics_leave_returning)} rows={returning} />
      <Group heading={x(M.analytics_leave_on_now)} rows={onLeave} />
    </div>
  )
}
