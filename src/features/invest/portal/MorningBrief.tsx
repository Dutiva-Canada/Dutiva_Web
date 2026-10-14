/**
 * Morning brief — the digest card at the top of Overview. It reads only
 * what the book already knows: overnight movers among held and watched
 * symbols, signals fired in the last day, theses not on track, goals off
 * pace, and queued orders waiting on the user. Once dismissed it stays
 * down until tomorrow (localStorage date key) — a brief that reappears
 * after every click isn't a brief.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sunrise, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import { pl } from './strategyUi'
import type {
  InvestGoal,
  InvestOrder,
  InvestPosition,
  InvestSignal,
  InvestThesis,
  MarketSnapshot,
} from '../data/types'

const DISMISS_KEY = 'invest-brief-v1'
const MOVER_PCT = 3
const FRESH_MS = 24 * 3600_000

const todayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

export function MorningBrief(props: {
  positions: InvestPosition[]
  watchSymbols: string[]
  snapshots: MarketSnapshot[]
  signals: InvestSignal[]
  theses: InvestThesis[]
  goals: InvestGoal[]
  orders: InvestOrder[]
}) {
  const { positions, watchSymbols, snapshots, signals, theses, goals, orders } = props
  const { lang, x } = useI18n()
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === todayKey(),
  )

  const pctFmt = (n: number) =>
    `${n > 0 ? '+' : ''}${n.toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
      maximumFractionDigits: 1,
    })}%`

  const lines = (() => {
    const out: string[] = []

    /* Overnight movers — anything held or watched whose day move clears
       the bar. The snap's dayChangePct is the provider's own figure. */
    const tracked = new Set([
      ...positions.map((p) => p.symbol.toUpperCase()),
      ...watchSymbols.map((s) => s.toUpperCase()),
    ])
    const movers = snapshots
      .filter(
        (s) =>
          tracked.has(s.symbol.toUpperCase()) &&
          s.dayChangePct !== null &&
          Math.abs(s.dayChangePct) >= MOVER_PCT,
      )
      .sort((a, b) => Math.abs(b.dayChangePct ?? 0) - Math.abs(a.dayChangePct ?? 0))
      .slice(0, 4)
    if (movers.length > 0) {
      out.push(
        x(IM.invest_brief_movers).replace(
          '{list}',
          movers.map((m) => `${m.symbol} ${pctFmt(m.dayChangePct ?? 0)}`).join(', '),
        ),
      )
    }

    const fresh = signals.filter(
      (s) =>
        s.status !== 'dismissed' &&
        s.createdAt &&
        Date.now() - Date.parse(s.createdAt) < FRESH_MS,
    ).length
    if (fresh > 0) {
      out.push(pl(lang, fresh, IM.invest_brief_signal_one, IM.invest_brief_signal_many))
    }

    const broken = theses.filter((t) => t.status === 'broken').length
    const drifting = theses.filter((t) => t.status === 'drifting').length
    if (broken + drifting > 0) {
      out.push(
        x(IM.invest_brief_theses)
          .replace('{broken}', String(broken))
          .replace('{drifting}', String(drifting)),
      )
    }

    const offPace = goals.filter(
      (g) => g.status === 'behind' || g.status === 'missed',
    ).length
    if (offPace > 0) {
      out.push(pl(lang, offPace, IM.invest_brief_goal_one, IM.invest_brief_goal_many))
    }

    const queued = orders.filter((o) => o.status === 'queued').length
    if (queued > 0) {
      out.push(pl(lang, queued, IM.invest_brief_order_one, IM.invest_brief_order_many))
    }

    return out
  })()

  if (dismissed || lines.length === 0) return null

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, todayKey())
    setDismissed(true)
  }

  return (
    <section className="sb-card sb-brief" aria-label={x(IM.invest_brief_title)}>
      <div className="sb-brief-head">
        <h2 className="sb-flabel" style={{ margin: 0 }}>
          <Sunrise size={14} aria-hidden /> {x(IM.invest_brief_title)}
        </h2>
        <button
          type="button"
          className="sb-linklike"
          onClick={dismiss}
          aria-label={x(IM.invest_brief_dismiss)}
        >
          <X size={14} aria-hidden />
        </button>
      </div>
      <ul>
        {lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
      <p className="sb-brief-foot">
        <Link to="/invest/signals">{x(IM.invest_brief_open)}</Link>
      </p>
    </section>
  )
}
