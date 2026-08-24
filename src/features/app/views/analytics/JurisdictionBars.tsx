import { useId } from 'react'
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { jurisdictionBarsHeightClass } from '@/lib/chartPlotHeight'
import { useI18n } from '@/i18n/context'
import { analyticsMessages as M } from '@/i18n/messages/analytics'

/**
 * Headcount by jurisdiction — horizontal bars in the single data-mark hue.
 * Every bar carries its value label (so the number axis is dropped rather
 * than duplicated); each bar's full row band is the hover/tap target; an
 * sr-only table twins the chart.
 */

export interface JurisdictionBarRow {
  key: string
  label: string
  value: number
}

const MARK = 'var(--chart-mark)'

function BarTooltip({
  active,
  payload,
  label,
}: {
  readonly active?: boolean
  readonly payload?: readonly { value?: number }[]
  readonly label?: string | number
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-[8px] border border-border bg-surface px-[10px] py-[6px] shadow-[0_4px_14px_rgba(0,0,0,0.12)]">
      <span className="text-[13px] font-bold text-text">{payload[0]?.value}</span>
      <span className="ml-[6px] text-[11.5px] text-text-muted">{String(label ?? '')}</span>
    </div>
  )
}

export function JurisdictionBars({ rows }: { readonly rows: readonly JurisdictionBarRow[] }) {
  const { x } = useI18n()
  const tableId = useId()

  const summary = rows.map((r) => `${r.label} ${r.value}`).join(', ')
  /* Room to the right of the longest bar for its outside value label. */
  const labelGutter = Math.min(72, Math.max(...rows.map((r) => String(r.value).length)) * 7.5 + 16)

  return (
    <>
      <div
        role="img"
        aria-label={x(M.analytics_headcount_chart_aria).replace('{points}', summary)}
        aria-describedby={tableId}
        className={`w-full ${jurisdictionBarsHeightClass(rows.length)}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={[...rows]}
            layout="vertical"
            margin={{ top: 4, right: labelGutter, bottom: 4, left: 0 }}
            barCategoryGap="32%"
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              width={64}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-2)', fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: 'color-mix(in srgb, currentColor 6%, transparent)' }}
              content={<BarTooltip />}
            />
            <Bar
              dataKey="value"
              fill={MARK}
              radius={[0, 4, 4, 0]}
              maxBarSize={18}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="value"
                position="right"
                className="fill-text text-xs font-semibold"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table id={tableId} className="sr-only">
        <thead>
          <tr>
            <th scope="col">{x(M.analytics_headcount_table_jurisdiction)}</th>
            <th scope="col">{x(M.analytics_headcount_table_employees)}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td>{r.label}</td>
              <td>{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
