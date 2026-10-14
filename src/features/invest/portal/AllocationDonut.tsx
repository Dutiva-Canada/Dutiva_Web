/**
 * Allocation donut — book value split per position plus the cash slice,
 * in book currency. The headline under it names the largest slice, so
 * "Shopify is 38% of your book" is stated, not implied by the graphic.
 *
 * Lazy-loaded with recharts — keep the import boundary (see BookCurve).
 */
import { useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { PieChart as PieIcon } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import { convertFx, type FxTable } from '../data/fx'
import type { InvestPosition, MarketSnapshot } from '../data/types'

interface Slice {
  key: string
  label: string
  value: number
  /** 'cash' | 'other' | '' — cash draws the muted tone, other the pale. */
  tone: '' | 'cash' | 'other'
}

const MAX_SLICES = 6

/** Theme-safe palette — mixes of accent over card read correctly in both
    themes, unlike a fixed hue ramp. */
const FILL = (i: number) =>
  `color-mix(in srgb, var(--sb-accent) ${92 - i * 11}%, var(--sb-card))`

export function AllocationDonut({
  positions,
  snapshots,
  cashTotal,
  bookCcy,
  fx,
}: {
  positions: InvestPosition[]
  snapshots: MarketSnapshot[]
  cashTotal: number
  bookCcy: string
  fx: FxTable | null
}) {
  const { x, lang } = useI18n()
  const fmt = useMemo(
    () =>
      new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', {
        style: 'currency',
        currency: bookCcy,
        maximumFractionDigits: 0,
      }),
    [lang, bookCcy],
  )

  const { slices, total, skipped } = useMemo(() => {
    const raw: Slice[] = []
    let invested = 0
    let skipped = 0
    for (const p of positions) {
      const snap = snapshots.find(
        (s) => s.assetClass === p.assetClass && s.symbol === p.symbol,
      )
      const pxNative = snap?.price ?? p.lastPrice ?? null
      const pxCur = snap?.currency ?? p.currency
      const px = pxNative === null ? null : convertFx(pxNative, pxCur, bookCcy, fx)
      if (px === null) {
        skipped++
        continue
      }
      const v = p.quantity * px
      invested += v
      raw.push({ key: p.id, label: p.symbol, value: v, tone: '' })
    }
    raw.sort((a, b) => b.value - a.value)
    const top = raw.slice(0, MAX_SLICES)
    const rest = raw.slice(MAX_SLICES)
    const restSum = rest.reduce((s, r) => s + r.value, 0)
    const slices = [...top]
    if (restSum > 0) {
      slices.push({ key: '__other', label: x(IM.invest_alloc_other), value: restSum, tone: 'other' })
    }
    if (cashTotal > 0) {
      slices.push({ key: '__cash', label: x(IM.invest_ov_cash), value: cashTotal, tone: 'cash' })
    }
    return { slices, total: invested + (cashTotal > 0 ? cashTotal : 0), skipped }
  }, [positions, snapshots, cashTotal, bookCcy, fx, x])

  if (slices.length === 0 || total <= 0) {
    return (
      <section className="sb-card sb-card-pad">
        <h2 style={{ margin: 0 }}>
          <PieIcon size={15} strokeWidth={2} aria-hidden="true" /> {x(IM.invest_alloc_title)}
        </h2>
        <p className="sb-empty" style={{ marginBottom: 0 }}>
          {x(IM.invest_positions_empty)}
        </p>
      </section>
    )
  }

  const top = slices.find((s) => s.tone === '') ?? slices[0]!
  const topPct = (top.value / total) * 100

  return (
    <section className="sb-card sb-card-pad">
      <h2 style={{ margin: 0 }}>
        <PieIcon size={15} strokeWidth={2} aria-hidden="true" /> {x(IM.invest_alloc_title)}
      </h2>
      <p className="sb-helper" style={{ margin: '4px 0 0' }}>
        {x(IM.invest_alloc_top)
          .replace('{symbol}', top.label)
          .replace('{pct}', String(Math.round(topPct)))}
        {skipped > 0 ? ` ${x(IM.invest_alloc_skipped)}` : ''}
      </p>
      <div className="sb-donut-wrap">
        <div style={{ width: 200, height: 200, flexShrink: 0 }} aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="label"
                innerRadius={58}
                outerRadius={92}
                paddingAngle={2}
                strokeWidth={0}
              >
                {slices.map((s, i) => (
                  <Cell
                    key={s.key}
                    fill={
                      s.tone === 'cash'
                        ? 'var(--sb-card-deep)'
                        : s.tone === 'other'
                          ? 'var(--sb-line)'
                          : FILL(i)
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const s = payload[0]!.payload as Slice
                  return (
                    <div className="sb-curve-tip">
                      <strong>{s.label}</strong>
                      <div style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {fmt.format(s.value)} · {((s.value / total) * 100).toFixed(1)}%
                      </div>
                    </div>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="sb-donut-legend">
          {slices.map((s, i) => (
            <li key={s.key}>
              <span
                className="sb-donut-dot"
                style={{
                  background:
                    s.tone === 'cash'
                      ? 'var(--sb-card-deep)'
                      : s.tone === 'other'
                        ? 'var(--sb-line)'
                        : FILL(i),
                }}
              />
              <span className="sb-donut-label">{s.label}</span>
              <span className="dim" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {((s.value / total) * 100).toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
