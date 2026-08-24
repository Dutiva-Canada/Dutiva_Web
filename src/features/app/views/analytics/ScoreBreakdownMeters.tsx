import { TriangleAlert } from 'lucide-react'
import { ProgressFill } from '@/components/ProgressFill'
import { useI18n } from '@/i18n/context'
import { analyticsMessages as M } from '@/i18n/messages/analytics'
import { sourceChipClass } from '@/components/chips'

/**
 * Score breakdown — one labeled meter per score component, filled in the
 * data-mark hue (status colours stay reserved for status). The lowest
 * component carries an explicit flag chip (icon + text, never colour alone).
 */

export interface BreakdownMeterRow {
  key: string
  label: string
  /** 0–100 meter fill. */
  pct: number
  /** Printed value ('61' or '3 of 4'). */
  valueText: string
  flagged?: boolean
  /** Flag chip text; defaults to "Lowest". */
  flagLabel?: string
}

export function ScoreBreakdownMeters({ rows }: { readonly rows: readonly BreakdownMeterRow[] }) {
  const { x } = useI18n()
  return (
    <div className="flex flex-col gap-[10px]">
      {rows.map((row) => (
        <div key={row.key} className="flex flex-col gap-[4px]">
          <div className="flex items-baseline justify-between gap-[10px]">
            <span className="flex min-w-0 items-baseline gap-[8px] text-[12.5px] text-text-2">
              <span className="truncate">{row.label}</span>
              {row.flagged && (
                <span className={sourceChipClass('warning')}>
                  <TriangleAlert
                    size={11}
                    strokeWidth={1.9}
                    className="mr-[4px] self-center"
                    aria-hidden="true"
                  />
                  {row.flagLabel ?? x(M.analytics_score_lowest_flag)}
                </span>
              )}
            </span>
            <span className="shrink-0 text-[12.5px] font-semibold text-text tabular-nums">
              {row.valueText}
            </span>
          </div>
          <div
            role="img"
            aria-label={`${row.label}: ${row.valueText}`}
            className="h-[8px] overflow-hidden rounded-[100px] bg-inset"
          >
            <ProgressFill
              pct={Math.min(100, Math.max(0, row.pct))}
              className="h-full w-full rounded-[100px] text-chart-mark"
            />
          </div>
        </div>
      ))}
    </div>
  )
}
