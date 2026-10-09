import { useState } from 'react'
import { useI18n } from '@/i18n/context'
import { pickL } from '@/i18n/core'
import { advisorCore } from '@/i18n/messages/advisorCore'
import { chatWidgetMessages as CW } from '@/i18n/messages/chatWidgets'
import { formatValue } from './formatValue'
import type { ChartWidgetSpec } from './widgetSpec'
import { WidgetFrame } from './WidgetFrame'

/**
 * Chart — bar and pie from a labeled data series. Drawn with plain
 * divs/SVG on purpose: the widget chunk stays small enough to lazy-load
 * into a chat without pulling a chart library, and the visuals are
 * presentational only — the real data always ships in the "Show data"
 * table beneath, which is also the screen-reader equivalent.
 *
 * Colors come from the --cw-chart-N series vars (currentColor-derived), so
 * identity is carried by position + the data table, never by color alone.
 */

const SERIES_CLASS = ['cw-chart-1', 'cw-chart-2', 'cw-chart-3', 'cw-chart-4', 'cw-chart-5']

function seriesClass(index: number): string {
  return SERIES_CLASS[index % SERIES_CLASS.length] ?? 'cw-chart-1'
}

function BarChart({ spec }: { readonly spec: ChartWidgetSpec }) {
  const { lang } = useI18n()
  const { items, format } = spec.data
  const max = Math.max(...items.map((item) => Math.abs(item.value)), 0)
  return (
    <div className="cw-chart-bars">
      {items.map((item, i) => {
        const width = max > 0 ? Math.min(100, (Math.abs(item.value) / max) * 100) : 0
        return (
          <div className="cw-chart-bar" key={i}>
            <span
              className="cw-chart-bar-label"
              title={item.hint ? pickL(item.hint, lang) : pickL(item.label, lang)}
            >
              {pickL(item.label, lang)}
            </span>
            <span className="cw-chart-bar-track">
              <span
                className={`cw-chart-bar-fill ${seriesClass(i)}`}
                style={{ width: `${width}%` }}
              />
              <span className="cw-chart-bar-value">{formatValue(item.value, format, lang)}</span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

const PIE_R = 40
const PIE_C = 2 * Math.PI * PIE_R

function PieChart({ spec }: { readonly spec: ChartWidgetSpec }) {
  const { lang } = useI18n()
  const { items, format } = spec.data
  const total = items.reduce((sum, item) => sum + Math.max(0, item.value), 0)

  let offset = 0
  const segments = items.map((item, i) => {
    const fraction = total > 0 ? Math.max(0, item.value) / total : 0
    const segment = { index: i, fraction, offset }
    offset += fraction
    return segment
  })

  return (
    <div className="cw-chart-pie">
      <svg
        className="cw-chart-pie-svg"
        width="120"
        height="120"
        viewBox="0 0 100 100"
        role="img"
        aria-hidden="true"
      >
        <circle cx="50" cy="50" r={PIE_R} fill="none" stroke="var(--cw-wash-strong)" strokeWidth="14" />
        {segments.map((seg) => (
          <circle
            key={seg.index}
            className={`cw-chart-seg ${seriesClass(seg.index)}`}
            cx="50"
            cy="50"
            r={PIE_R}
            fill="none"
            strokeWidth="14"
            strokeDasharray={`${seg.fraction * PIE_C} ${PIE_C}`}
            strokeDashoffset={-seg.offset * PIE_C + PIE_C * 0.25}
          />
        ))}
      </svg>
      <div className="cw-chart-legend">
        {items.map((item, i) => (
          <div className="cw-chart-legend-row" key={i}>
            <span className={`cw-chart-swatch ${seriesClass(i)}`} aria-hidden="true" />
            <span title={item.hint ? pickL(item.hint, lang) : undefined}>
              {pickL(item.label, lang)}
            </span>
            <span className="cw-chart-legend-val">{formatValue(item.value, format, lang)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChartWidget({ spec }: { readonly spec: ChartWidgetSpec }) {
  const { x, lang } = useI18n()
  const [showData, setShowData] = useState(false)
  const { kind, items, format } = spec.data
  const titleText = spec.title ? pickL(spec.title, lang) : x(CW.chatw_table_region)

  return (
    <WidgetFrame title={spec.title}>
      {kind === 'bar' ? <BarChart spec={spec} /> : <PieChart spec={spec} />}

      <button
        type="button"
        className="cw-datatoggle"
        aria-expanded={showData}
        onClick={() => setShowData((open) => !open)}
      >
        {x(showData ? advisorCore.advisor_chart_hide_data : advisorCore.advisor_chart_show_data)}
      </button>

      {showData && (
        <div
          className="cw-tablewrap"
          role="region"
          tabIndex={0}
          aria-label={titleText}
          style={{ marginTop: 8 }}
        >
          <table className="cw-table">
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <th scope="row">{pickL(item.label, lang)}</th>
                  <td data-align="right">{formatValue(item.value, format, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </WidgetFrame>
  )
}
