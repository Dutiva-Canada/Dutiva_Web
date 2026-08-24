/**
 * ChatChart — renders a ```chart fenced block as a real chart.
 *
 * The Advisor emits a JSON spec inside a fenced block tagged `chart`:
 *
 *   ```chart
 *   {
 *     "type": "bar",
 *     "title": "General minimum wage by jurisdiction",
 *     "x": "jurisdiction",
 *     "format": { "prefix": "$", "suffix": "/hr", "decimals": 2 },
 *     "series": [{ "key": "rate", "label": "Current rate" }],
 *     "data": [
 *       { "jurisdiction": "Québec",  "rate": 16.60 },
 *       { "jurisdiction": "Ontario", "rate": 17.60 },
 *       { "jurisdiction": "Federal", "rate": 18.15 }
 *     ]
 *   }
 *   ```
 *
 * Types: "bar" (magnitude across categories), "hbar" (same, long labels),
 * "line" / "area" (change over time), "donut" (parts of one whole).
 *
 * If the JSON doesn't parse — a truncated stream, a malformed reply — the
 * block falls back to plain preformatted text. A chart never breaks a message.
 *
 * Every chart ships a "Show data" table: identity is never carried by color
 * alone, and it is the required relief for the lighter series colors, which
 * sit below 3:1 against a light surface.
 */

import { useMemo, useState } from 'react'
import { chartPlotHeightClass, hbarPlotHeightClass } from '@/lib/chartPlotHeight'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useI18n } from '@/i18n/context'
import { advisorCore } from '@/i18n/messages/advisorCore'

/* ------------------------------------------------------------------ Spec */

interface SeriesSpec {
  key: string
  label?: string
}

export interface ChartSpec {
  type?: 'bar' | 'hbar' | 'line' | 'area' | 'donut'
  title?: string
  note?: string
  x?: string
  format?: { prefix?: string; suffix?: string; decimals?: number }
  series?: SeriesSpec[]
  data?: Array<Record<string, string | number>>
}

/** Categorical slots, assigned in fixed order — never cycled, never by rank. */
const SERIES_VARS = [
  'var(--cm-chart-1)',
  'var(--cm-chart-2)',
  'var(--cm-chart-3)',
  'var(--cm-chart-4)',
  'var(--cm-chart-5)',
]

const AXIS = 'var(--cm-chart-axis)'
const GRID = 'var(--cm-chart-grid)'
const MUTED = 'var(--cm-chart-muted)'
const SURFACE = 'var(--cm-chart-surface)'

function parseSpec(source: string): ChartSpec | null {
  try {
    const spec = JSON.parse(source) as ChartSpec
    if (!Array.isArray(spec?.data) || spec.data.length === 0) return null
    if (!Array.isArray(spec.series) || spec.series.length === 0) return null
    return spec
  } catch {
    return null
  }
}

type Formatter = (value: unknown) => string

function useFormatter(format: ChartSpec['format'], locale: string): Formatter {
  return useMemo(() => {
    const { prefix = '', suffix = '', decimals } = format ?? {}
    return (value: unknown) => {
      if (typeof value !== 'number' || !Number.isFinite(value)) return String(value ?? '')
      const body =
        decimals === undefined
          ? new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)
          : new Intl.NumberFormat(locale, {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            }).format(value)
      return `${prefix}${body}${suffix}`
    }
  }, [format, locale])
}

/* -------------------------------------------------------------- Tooltip */

interface TooltipEntry {
  name?: string
  value?: number
  color?: string
  dataKey?: string
}

function ChartTooltip({
  active,
  payload,
  label,
  format,
}: {
  readonly active?: boolean
  readonly payload?: TooltipEntry[]
  readonly label?: string | number
  readonly format: Formatter
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="cm-chart-tip">
      <div className="cm-chart-tip-label">{String(label ?? '')}</div>
      {payload.map((entry, index) => (
        <div className="cm-chart-tip-row" key={entry.dataKey ?? entry.name}>
          <span
            className={`cm-chart-swatch cm-chart-swatch-${(index % 5) + 1}`}
            aria-hidden="true"
          />
          <span className="cm-chart-tip-name">{entry.name}</span>
          <span className="cm-chart-tip-value">{format(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------- Chart */

export function ChatChart({ source }: { readonly source: string }) {
  const { x, lang } = useI18n()
  const spec = useMemo(() => parseSpec(source), [source])
  const [showData, setShowData] = useState(false)
  const format = useFormatter(spec?.format, lang === 'fr' ? 'fr-CA' : 'en-CA')

  if (!spec) {
    return (
      <pre className="cm-pre">
        <code className="cm-codeblock">{source.trim()}</code>
      </pre>
    )
  }

  const type = spec.type ?? 'bar'
  const series = spec.series ?? []
  const data = spec.data ?? []
  const xKey = spec.x ?? Object.keys(data[0] ?? {})[0] ?? ''
  const multi = series.length > 1
  // A single series over few categories reads faster labelled directly than
  // traced back to an axis. More than that and the labels start colliding.
  const directLabels = !multi && data.length <= 8 && (type === 'bar' || type === 'hbar')

  const axisProps = {
    stroke: AXIS,
    tick: { fill: MUTED, fontSize: 12 },
    tickLine: false,
  } as const

  const tooltip = (
    <Tooltip
      cursor={{ fill: 'color-mix(in srgb, currentColor 6%, transparent)' }}
      content={<ChartTooltip format={format} />}
    />
  )
  const legend = multi ? (
    <Legend verticalAlign="top" align="left" height={28} iconType="circle" iconSize={8} />
  ) : null

  let chart = null
  if (type === 'bar' || type === 'hbar') {
    const horizontal = type === 'hbar'
    /* A horizontal bar's direct label sits to the right of the bar, outside the
       plot area — so the plot has to give back the width the longest formatted
       value needs, or the label is clipped by the chart's own edge. Estimated
       from the character count (~7.5px per char at 12px/600), capped so a long
       label can't squeeze the bars to nothing. */
    const labelled = directLabels ? series[0] : undefined
    const labelGutter =
      horizontal && labelled
        ? Math.min(120, Math.max(...data.map((row) => format(row[labelled.key]).length)) * 7.5 + 14)
        : 12
    chart = (
      <BarChart
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{
          top: directLabels ? 18 : 6,
          right: labelGutter,
          bottom: 0,
          left: horizontal ? 8 : -8,
        }}
        barCategoryGap={multi ? '22%' : '34%'}
      >
        <CartesianGrid
          stroke={GRID}
          strokeWidth={1}
          vertical={horizontal}
          horizontal={!horizontal}
        />
        {horizontal ? (
          <>
            <XAxis type="number" tickFormatter={format} {...axisProps} />
            <YAxis type="category" dataKey={xKey} width={110} {...axisProps} />
          </>
        ) : (
          <>
            <XAxis type="category" dataKey={xKey} {...axisProps} />
            <YAxis type="number" tickFormatter={format} width={56} {...axisProps} />
          </>
        )}
        {tooltip}
        {legend}
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label ?? s.key}
            fill={SERIES_VARS[i % SERIES_VARS.length]}
            /* 4px rounded ends on the data end only — the baseline stays square */
            radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            /* 2px of surface between adjacent fills */
            stroke={SURFACE}
            strokeWidth={2}
            maxBarSize={horizontal ? 26 : 56}
            isAnimationActive={false}
          >
            {directLabels && (
              <LabelList
                dataKey={s.key}
                position={horizontal ? 'right' : 'top'}
                formatter={format}
                className="fill-text text-xs font-semibold"
              />
            )}
          </Bar>
        ))}
      </BarChart>
    )
  } else if (type === 'line' || type === 'area') {
    const Chart = type === 'area' ? AreaChart : LineChart
    chart = (
      <Chart data={data} margin={{ top: 6, right: 14, bottom: 0, left: -8 }}>
        <CartesianGrid stroke={GRID} strokeWidth={1} vertical={false} />
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis tickFormatter={format} width={56} {...axisProps} />
        {tooltip}
        {legend}
        {series.map((s, i) => {
          const color = SERIES_VARS[i % SERIES_VARS.length]
          const shared = {
            dataKey: s.key,
            name: s.label ?? s.key,
            stroke: color,
            strokeWidth: 2,
            dot: { r: 0 },
            activeDot: { r: 4, strokeWidth: 2, stroke: SURFACE },
            isAnimationActive: false,
          } as const
          return type === 'area' ? (
            <Area key={s.key} type="monotone" {...shared} fill={color} fillOpacity={0.12} />
          ) : (
            <Line key={s.key} type="monotone" {...shared} />
          )
        })}
      </Chart>
    )
  } else {
    const valueKey = series[0]?.key ?? ''
    chart = (
      <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        {tooltip}
        <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={8} />
        <Pie
          data={data}
          dataKey={valueKey}
          nameKey={xKey}
          innerRadius="58%"
          outerRadius="82%"
          paddingAngle={2}
          stroke={SURFACE}
          strokeWidth={2}
          isAnimationActive={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={SERIES_VARS[i % SERIES_VARS.length]} />
          ))}
        </Pie>
      </PieChart>
    )
  }

  const plotHeightClass =
    type === 'hbar' ? hbarPlotHeightClass(data.length) : chartPlotHeightClass(260)

  return (
    <figure className="cm-chart">
      {spec.title && <figcaption className="cm-chart-title">{spec.title}</figcaption>}

      <div className={`cm-chart-plot ${plotHeightClass}`}>
        <ResponsiveContainer width="100%" height="100%">
          {chart}
        </ResponsiveContainer>
      </div>

      {spec.note && <p className="cm-chart-note">{spec.note}</p>}

      <button
        type="button"
        className="cm-chart-toggle"
        aria-expanded={showData}
        onClick={() => setShowData((open) => !open)}
      >
        {x(showData ? advisorCore.advisor_chart_hide_data : advisorCore.advisor_chart_show_data)}
      </button>

      {showData && (
        <div
          className="cm-tablewrap"
          role="region"
          tabIndex={0}
          aria-label={spec.title ?? x(advisorCore.advisor_chart_data)}
        >
          <table className="cm-table">
            <thead className="cm-thead">
              <tr className="cm-tr">
                <th className="cm-th" scope="col">
                  {xKey}
                </th>
                {series.map((s) => (
                  <th className="cm-th" scope="col" key={s.key}>
                    {s.label ?? s.key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr className="cm-tr" key={i}>
                  <td className="cm-td" data-label={xKey}>
                    {String(row[xKey] ?? '')}
                  </td>
                  {series.map((s) => (
                    <td className="cm-td" data-label={s.label ?? s.key} key={s.key}>
                      {format(row[s.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  )
}
