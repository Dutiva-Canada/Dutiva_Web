import { useId } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useI18n } from '@/i18n/context'
import { analyticsMessages as M } from '@/i18n/messages/analytics'
import { formatMonthISO, windowAxis } from './aggregation'
import { intlLocale } from './format'

/**
 * Month-series line (compliance score, headcount). Chart rules applied:
 * single series in the data-mark hue (no legend — the card title names it);
 * the y-axis is windowed to the data, never zero-based, with clean ticks;
 * only the start and end points carry markers and value labels — the rest
 * are tooltip-only. The end marker is gold (the mockup's current-month
 * accent); an sr-only table twins the chart so no value is gated on hover.
 */

interface TrendChartPoint {
  monthISO: string
  value: number
}

const MARK = 'var(--chart-mark)'
const CURRENT = 'var(--gold-dot)'
const SURFACE = 'var(--surface)'

interface DotProps {
  cx?: number
  cy?: number
  index?: number
}

function ChartTooltip({
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

export function TrendLineChart({
  points,
  ariaLabel,
  valueHeader,
  clampMax,
}: {
  readonly points: readonly TrendChartPoint[]
  /** Complete data summary for AT — the caller owns the wording. */
  readonly ariaLabel: string
  /** Header for the sr-only table's value column. */
  readonly valueHeader: string
  /** Upper clamp for the windowed axis (100 for scores; omit for counts). */
  readonly clampMax?: number
}) {
  const { x, lang } = useI18n()
  const tableId = useId()
  const locale = intlLocale(lang)

  const data = points.map((point) => ({
    ...point,
    label: formatMonthISO(point.monthISO, locale),
    labelLong: formatMonthISO(point.monthISO, locale, 'long'),
  }))
  const axis = windowAxis(
    data.map((d) => d.value),
    clampMax === undefined ? {} : { clampMax },
  )
  const lastIndex = data.length - 1

  const endpointDot = ({ cx, cy, index }: DotProps) => {
    const isEndpoint = index === 0 || index === lastIndex
    if (!isEndpoint || cx === undefined || cy === undefined) {
      return <g key={`dot-${index}`} />
    }
    const isCurrent = index === lastIndex
    return (
      <g key={`dot-${index}`}>
        <circle
          cx={cx}
          cy={cy}
          r={4.5}
          fill={isCurrent ? CURRENT : MARK}
          stroke={SURFACE}
          strokeWidth={2}
        />
        <text
          x={cx}
          y={cy - 11}
          textAnchor={index === 0 ? 'start' : 'end'}
          className="fill-text text-[11.5px] font-semibold"
        >
          {data[index]?.value}
        </text>
      </g>
    )
  }

  return (
    <>
      <div
        role="img"
        aria-label={ariaLabel}
        aria-describedby={tableId}
        className="h-[190px] w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 22, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--border-soft)" strokeWidth={1} vertical={false} />
            <XAxis
              dataKey="label"
              stroke="var(--border)"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              tickLine={false}
            />
            <YAxis
              domain={[axis.min, axis.max]}
              ticks={axis.ticks}
              width={34}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            />
            <Tooltip
              cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
              content={<ChartTooltip />}
            />
            <Line
              dataKey="value"
              type="monotone"
              stroke={MARK}
              strokeWidth={2}
              strokeLinecap="round"
              dot={endpointDot}
              activeDot={{ r: 5, fill: MARK, stroke: SURFACE, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <table id={tableId} className="sr-only">
        <thead>
          <tr>
            <th scope="col">{x(M.analytics_score_table_month)}</th>
            <th scope="col">{valueHeader}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.monthISO}>
              <td>{d.labelLong}</td>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
