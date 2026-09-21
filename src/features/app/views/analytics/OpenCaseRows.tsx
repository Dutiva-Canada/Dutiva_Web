import { WorkspaceLink as Link } from '@/features/app/workspaceRoot/WorkspaceLink'
import { ChevronRight } from 'lucide-react'

/**
 * Open-case rows: type, jurisdiction, opened date, days open — days-open
 * turns risk-red past 14 days (text carries the number, colour is the
 * accent). Each row taps through to its case.
 */

export interface OpenCaseRow {
  key: string
  href: string
  typeLabel: string
  jurisdiction: string
  openedLabel: string
  daysOpen: number
  daysLabel: string
}

export const CASE_AGE_ALERT_DAYS = 14

export function OpenCaseRows({ rows }: { readonly rows: readonly OpenCaseRow[] }) {
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {rows.map((row) => (
        <li key={row.key} className="border-b border-border-soft last:border-b-0">
          <Link
            to={row.href}
            className="flex min-h-[44px] items-center justify-between gap-[12px] py-[9px] no-underline"
          >
            <span className="flex min-w-0 flex-col gap-[2px]">
              <span className="truncate text-[13px] font-semibold text-text">{row.typeLabel}</span>
              <span className="truncate text-[12px] text-text-muted">
                {row.jurisdiction} · {row.openedLabel}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-[6px]">
              <span
                className={`text-[12.5px] font-semibold tabular-nums ${
                  row.daysOpen > CASE_AGE_ALERT_DAYS ? 'text-risk-fg' : 'text-text-2'
                }`}
              >
                {row.daysLabel}
              </span>
              <ChevronRight
                size={15}
                strokeWidth={1.9}
                className="text-text-faint"
                aria-hidden="true"
              />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
