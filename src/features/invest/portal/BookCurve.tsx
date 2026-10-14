/**
 * The track record — book value over sweep-days (invest_book_snapshots,
 * 0223), one mark per sweep-day. Deposits and withdrawals are backed out
 * of the change figure so it reads as performance, not as money moved.
 *
 * Keep this file behind a lazy() boundary — recharts and its d3 tree are
 * ~420kB and must stay a separate on-demand chunk (same rule as
 * components/advisor/ChatChart.tsx).
 */
import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { fill } from '@/lib/format'
import { investMessages as IM } from '@/i18n/messages/invest'
import { convertFx, type FxTable } from '../data/fx'
import { fmtDay, fmtPct } from './strategyUi'
import type { InvestBookSnapshot, InvestCashEvent } from '../data/types'

type Range = '1m' | '3m' | '1y' | 'all'

const RANGES: readonly { id: Range; days: number | null; key: keyof typeof IM }[] = [
  { id: '1m', days: 30, key: 'invest_curve_range_1m' },
  { id: '3m', days: 90, key: 'invest_curve_range_3m' },
  { id: '1y', days: 365, key: 'invest_curve_range_1y' },
  { id: 'all', days: null, key: 'invest_curve_range_all' },
]

interface Point {
  asOf: string
  label: string
  book: number
  invested: number
  cash: number
}

interface Props {
  /** Ascending by asOf (the state load orders it). accountId null = the
      book-wide row; a value scopes the row to one account (0224). */
  snapshots: InvestBookSnapshot[]
  cashEvents: InvestCashEvent[]
  /** Active accounts — the scope segment lists the ones that have marks. */
  accounts: { id: string; name: string }[]
  /** ECB table for converting recorded flows into the book currency —
      null means 'no rate on file'; unconvertible events drop out of the
      flow adjustment rather than distort it. */
  fx: FxTable | null
}

export function BookCurve({ snapshots, cashEvents, accounts, fx }: Props) {
  const { x, lang } = useI18n()
  const [range, setRange] = useState<Range>('all')
  const [scope, setScope] = useState<string | 'all'>('all')

  /* Which accounts actually carry marks — the segment offers real
     choices only. */
  const scopedAccounts = useMemo(() => {
    const withMarks = new Set(
      snapshots.filter((s) => s.accountId !== null).map((s) => s.accountId),
    )
    return accounts.filter((a) => withMarks.has(a.id))
  }, [snapshots, accounts])
  const effectiveScope =
    scope !== 'all' && scopedAccounts.some((a) => a.id === scope) ? scope : 'all'
  const scopedSnapshots = useMemo(
    () =>
      snapshots.filter((s) =>
        effectiveScope === 'all' ? s.accountId === null : s.accountId === effectiveScope,
      ),
    [snapshots, effectiveScope],
  )
  const scopedEvents = useMemo(
    () =>
      effectiveScope === 'all'
        ? cashEvents
        : cashEvents.filter((e) => e.accountId === effectiveScope),
    [cashEvents, effectiveScope],
  )

  /* The series displays in the newest mark's currency — that's the book
     currency the sweep wrote it in. */
  const ccy = scopedSnapshots[scopedSnapshots.length - 1]?.currency ?? 'CAD'
  const fmt = useMemo(
    () =>
      new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', {
        style: 'currency',
        currency: ccy,
        maximumFractionDigits: 0,
      }),
    [lang, ccy],
  )

  const cutoff = RANGES.find((r) => r.id === range)?.days ?? null
  const points = useMemo<Point[]>(() => {
    const since =
      cutoff === null ? null : new Date(Date.now() - cutoff * 86_400_000).toISOString().slice(0, 10)
    return scopedSnapshots
      .filter((s) => since === null || s.asOf >= since)
      .map((s) => ({
        asOf: s.asOf,
        label: new Date(`${s.asOf}T12:00:00`).toLocaleDateString(
          lang === 'fr' ? 'fr-CA' : 'en-CA',
          { month: 'short', day: 'numeric', ...(cutoff !== null && cutoff > 100 ? { year: '2-digit' as const } : {}) },
        ),
        book: s.bookValue,
        invested: s.invested,
        cash: s.cash,
      }))
  }, [scopedSnapshots, cutoff, lang])

  const stats = useMemo(() => {
    if (points.length < 2) return { chg: null as number | null, hasFlows: false, maxDD: null as number | null }
    const first = points[0]!
    const last = points[points.length - 1]!
    /* External flows only — a dividend is the book paying out, which IS
       performance; a deposit is money moved, which isn't. Events land on
       their occurred_at date; the window is (first.asOf, last.asOf]. */
    let netFlow = 0
    let hasFlows = false
    for (const e of scopedEvents) {
      if (e.kind === 'dividend') continue
      if (e.occurredAt <= first.asOf || e.occurredAt > last.asOf) continue
      const v = convertFx(e.amount, e.currency, ccy, fx)
      if (v === null) continue
      netFlow += e.kind === 'withdrawal' ? -v : v
      hasFlows = true
    }
    const chg =
      first.book > 0 ? ((last.book - first.book - netFlow) / first.book) * 100 : null
    let peak = first.book
    let maxDD = 0
    for (const p of points) {
      if (p.book > peak) peak = p.book
      if (peak > 0) maxDD = Math.min(maxDD, ((p.book - peak) / peak) * 100)
    }
    return { chg, hasFlows, maxDD: maxDD < 0 ? maxDD : null }
  }, [points, scopedEvents, ccy, fx])

  /* Round to the displayed precision BEFORE picking a sign/color — a
     0.04% move must read "0.0%" in neutral, not "+0.0%" in green. */
  const pctFmt = (n: number) => {
    const r = Math.round(n * 10) / 10
    return `${r > 0 ? '+' : ''}${fmtPct(lang, r, 1)}`
  }

  return (
    <section className="sb-card sb-card-pad" aria-labelledby="sb-curve-h">
      <div className="sb-curve-head">
        <div>
          <h2 id="sb-curve-h" style={{ margin: 0 }}>
            <TrendingUp size={15} strokeWidth={2} aria-hidden="true" /> {x(IM.invest_curve_title)}
          </h2>
          <p className="sb-helper" style={{ margin: '4px 0 0' }}>
            {x(IM.invest_curve_note)}
            {points.length > 0 &&
              ` · ${fill(x(IM.invest_curve_since), {
                date: fmtDay(lang, points[0]!.asOf),
              })}`}
          </p>
        </div>
        <div className="sb-curve-controls">
          {scopedAccounts.length > 0 && (
            <div className="sb-seg" role="group" aria-label={x(IM.invest_curve_scope_aria)}>
              <button
                type="button"
                aria-pressed={effectiveScope === 'all'}
                onClick={() => setScope('all')}
              >
                {x(IM.invest_curve_scope_all)}
              </button>
              {scopedAccounts.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  aria-pressed={effectiveScope === a.id}
                  onClick={() => setScope(a.id)}
                >
                  {a.name}
                </button>
              ))}
            </div>
          )}
          <div className="sb-seg" role="group" aria-label={x(IM.invest_curve_title)}>
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                aria-pressed={range === r.id}
                onClick={() => setRange(r.id)}
              >
                {x(IM[r.key])}
              </button>
            ))}
          </div>
        </div>
      </div>

      {points.length < 2 ? (
        <p className="sb-empty" style={{ marginBottom: 0 }}>
          {x(IM.invest_curve_empty)}
        </p>
      ) : (
        <>
          <div className="sb-curve-stats">
            {stats.chg !== null && (
              <span className="sb-curve-stat">
                <span className="sb-curve-k">{x(IM.invest_curve_change)}</span>
                <strong
                  style={{
                    color:
                      Math.abs(Math.round(stats.chg * 10) / 10) === 0
                        ? 'var(--sb-body)'
                        : stats.chg < 0
                          ? 'var(--sb-danger)'
                          : 'var(--sb-ok)',
                  }}
                >
                  {pctFmt(stats.chg)}
                </strong>
                {stats.hasFlows && (
                  <span className="sb-curve-sub">{x(IM.invest_curve_net_flows)}</span>
                )}
              </span>
            )}
            {stats.maxDD !== null && (
              <span className="sb-curve-stat">
                <span className="sb-curve-k">{x(IM.invest_curve_maxdd)}</span>
                <strong style={{ color: 'var(--sb-danger)' }}>{pctFmt(stats.maxDD)}</strong>
              </span>
            )}
          </div>
          {/* The chart is aria-hidden — this line is its text
              equivalent: the stats give change + drawdown, this gives
              the series endpoints. */}
          <p className="sr-only">
            {fill(x(IM.invest_curve_alt), {
              vfrom: fmt.format(points[0]!.book),
              from: fmtDay(lang, points[0]!.asOf),
              vto: fmt.format(points[points.length - 1]!.book),
              to: fmtDay(lang, points[points.length - 1]!.asOf),
            })}
          </p>
          <div style={{ height: 220, marginTop: 12 }} aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
                <defs>
                  <linearGradient id="sbCurveFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--sb-accent)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--sb-accent)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--sb-line)" strokeDasharray="3 6" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--sb-muted)', fontSize: 12 }}
                  minTickGap={40}
                />
                <YAxis
                  dataKey="book"
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  domain={['auto', 'auto']}
                  tick={{ fill: 'var(--sb-muted)', fontSize: 12 }}
                  tickFormatter={(v: number) => fmt.format(v)}
                />
                <Tooltip
                  cursor={{ stroke: 'var(--sb-line)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const p = payload[0]!.payload as Point
                    const row = (k: string, v: number) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 18 }}>
                        <span style={{ color: 'var(--sb-muted)' }}>{k}</span>
                        <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt.format(v)}</strong>
                      </div>
                    )
                    return (
                      <div className="sb-curve-tip">
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.label}</div>
                        {row(x(IM.invest_ov_total_value), p.book)}
                        {row(x(IM.invest_curve_invested), p.invested)}
                        {row(x(IM.invest_curve_cash), p.cash)}
                      </div>
                    )
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="book"
                  stroke="var(--sb-accent)"
                  strokeWidth={2}
                  fill="url(#sbCurveFill)"
                  dot={false}
                  activeDot={{ r: 4, fill: 'var(--sb-accent)', stroke: 'var(--sb-card)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  )
}
