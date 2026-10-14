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
import { fmtNum, fmtPct } from './strategyUi'
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
/* Aggregate slices need tones distinct from each other — --sb-line and
   --sb-card-deep are near-identical creams (and near-identical navies in
   dark), so cash gets a muted mix instead. */
const OTHER_FILL = 'var(--sb-line)'
const CASH_FILL = 'color-mix(in srgb, var(--sb-muted) 45%, var(--sb-card))'
const fillFor = (s: Slice, i: number) =>
  s.tone === 'cash' ? CASH_FILL : s.tone === 'other' ? OTHER_FILL : FILL(i)

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
  /* Shares are locale-formatted (20,7 % in FR — thin space included) —
     the same fmtPct the rebalance/goal cells use. */
  const pct = (n: number) => fmtPct(lang, n, 1)

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
    const total = invested + (cashTotal > 0 ? cashTotal : 0)
    const slices = [...top]
    /* Aggregate rows below ~0.05% render as "0.0%" legend noise with an
       invisible wedge — only draw them when the share is meaningful. */
    if (restSum / total >= 0.0005) {
      slices.push({ key: '__other', label: x(IM.invest_alloc_other), value: restSum, tone: 'other' })
    }
    if (cashTotal / total >= 0.0005) {
      slices.push({ key: '__cash', label: x(IM.invest_ov_cash), value: cashTotal, tone: 'cash' })
    }
    return { slices, total, skipped }
  }, [positions, snapshots, cashTotal, bookCcy, fx, x])

  if (slices.length === 0 || total <= 0) {
    return (
      <section className="sb-card sb-card-pad">
        <h2 className="sb-h2" style={{ margin: 0 }}>
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
      <h2 className="sb-h2" style={{ margin: 0 }}>
        <PieIcon size={15} strokeWidth={2} aria-hidden="true" /> {x(IM.invest_alloc_title)}
      </h2>
      <p className="sb-helper" style={{ margin: '4px 0 0' }}>
        {x(IM.invest_alloc_top)
          .replace('{symbol}', top.label)
          /* The message carries its own % ({pct}% / {pct} %) — fill the
             slot with the bare one-decimal number. */
          .replace('{pct}', fmtNum(lang, topPct, 1))}
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
                  <Cell key={s.key} fill={fillFor(s, i)} />
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
                        {fmt.format(s.value)} · {pct((s.value / total) * 100)}
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
              <span className="sb-donut-dot" style={{ background: fillFor(s, i) }} />
              <span className="sb-donut-label" title={s.label}>{s.label}</span>
              <span className="dim">{pct((s.value / total) * 100)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
