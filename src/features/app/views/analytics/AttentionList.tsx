import { WorkspaceLink as Link } from '@/features/app/workspaceRoot/WorkspaceLink'
import { TriangleAlert } from 'lucide-react'
import { statusChipClass } from '@/components/chips'
import type { AttentionStatus } from './aggregation'

/**
 * "Needs attention" rows — item name, affected-count + jurisdiction second
 * line, and a status chip. Chips always carry text (overdue additionally an
 * icon); colour never stands alone. Rows sorted by the caller
 * (overdue → soonest due), capped with a "View all" link.
 */

export interface AttentionRow {
  key: string
  title: string
  secondary: string
  status: AttentionStatus
  chipLabel: string
  href?: string
}

const CHIP_TONE = { overdue: 'risk', due_soon: 'warning', upcoming: 'neutral' } as const

function RowChip({ row }: { readonly row: AttentionRow }) {
  return (
    <span className={`${statusChipClass(CHIP_TONE[row.status])} shrink-0 items-center self-center`}>
      {row.status === 'overdue' && (
        <TriangleAlert size={12} strokeWidth={1.9} className="mr-[5px]" aria-hidden="true" />
      )}
      {row.chipLabel}
    </span>
  )
}

function RowBody({ row }: { readonly row: AttentionRow }) {
  return (
    <>
      <span className="flex min-w-0 flex-col gap-[2px]">
        {/* Wrap, don't truncate: the item name is the row's payload. */}
        <span className="line-clamp-2 text-[13px] leading-[1.35] font-semibold text-text">
          {row.title}
        </span>
        <span className="truncate text-[12px] text-text-muted">{row.secondary}</span>
      </span>
      <RowChip row={row} />
    </>
  )
}

export function AttentionList({
  rows,
  viewAllHref,
  viewAllLabel,
}: {
  readonly rows: readonly AttentionRow[]
  readonly viewAllHref: string
  readonly viewAllLabel: string | null
}) {
  return (
    <div className="flex flex-col">
      <ul className="m-0 flex list-none flex-col p-0">
        {rows.map((row) => (
          <li key={row.key} className="border-b border-border-soft last:border-b-0">
            {row.href ? (
              <Link
                to={row.href}
                className="flex min-h-[44px] items-center justify-between gap-[12px] py-[9px] no-underline"
              >
                <RowBody row={row} />
              </Link>
            ) : (
              <div className="flex min-h-[44px] items-center justify-between gap-[12px] py-[9px]">
                <RowBody row={row} />
              </div>
            )}
          </li>
        ))}
      </ul>
      {viewAllLabel !== null && (
        <Link
          to={viewAllHref}
          className="mt-[8px] self-start text-[12.5px] font-semibold text-accent no-underline"
        >
          {viewAllLabel}
        </Link>
      )}
    </div>
  )
}
