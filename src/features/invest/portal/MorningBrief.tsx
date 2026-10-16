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
import { Sun, Sunrise, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { readPref, writePref } from '@/lib/prefs'
import { investMessages as IM } from '@/i18n/messages/invest'
import { fmtPct, pl } from './strategyUi'
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
  /* The Tally-noticed banner already reports queued orders — the brief
     drops that line rather than state the same fact twice. */
  ordersCovered?: boolean
}) {
  const { positions, watchSymbols, snapshots, signals, theses, goals, orders, ordersCovered } = props
  const { lang, x } = useI18n()
  /* readPref/writePref, not raw localStorage — private mode mustn't
     throw the whole Overview for a dismissal flag. */
  const [dismissed, setDismissed] = useState(
    () => readPref(DISMISS_KEY, '') === todayKey(),
  )
  /* Time-of-day neutral after noon — a "This morning"/"Overnight" card
     reads stale at 7 p.m., and the numbers are today's session moves. */
  const morning = new Date().getHours() < 12

  /* One decimal for every mover — {max:1} alone drops trailing zeros and
     mixes "−8%" next to "−8.5%" in the same breath. */
  const pctFmt = (n: number) => `${n > 0 ? '+' : ''}${fmtPct(lang, n, { min: 1, max: 1 })}`

  const lines = (() => {
    const out: string[] = []

    const freshSignals = signals.filter(
      (s) =>
        s.status !== 'dismissed' &&
        s.createdAt &&
        Date.now() - Date.parse(s.createdAt) < FRESH_MS,
    )

    /* Overnight movers — anything held or watched whose day move clears
       the bar. The snap's dayChangePct is the provider's own figure.
       A bare "−8.5%" doesn't say whether anything actually broke, so each
       mover carries the strongest two context tags the book knows:
       degraded thesis, a fresh signal, below cost, under the 50-day. */
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
      const parts = movers.map((m) => {
        const sym = m.symbol.toUpperCase()
        const ctx: string[] = []
        const th = theses.find((t) => t.symbol.toUpperCase() === sym)
        if (th?.status === 'broken') ctx.push(x(IM.invest_brief_mover_broken))
        else if (th?.status === 'drifting') ctx.push(x(IM.invest_brief_mover_drifting))
        if (freshSignals.some((s) => s.symbol.toUpperCase() === sym))
          ctx.push(x(IM.invest_brief_mover_signal))
        /* avg_cost is position-currency; only compare when the quote is
           quoted in the same currency, never raw across currencies. */
        const pos = positions.find(
          (p) => p.symbol.toUpperCase() === sym && p.currency === m.currency,
        )
        if (pos && pos.avgCost > 0 && m.price < pos.avgCost)
          ctx.push(x(IM.invest_brief_mover_below_cost))
        if (m.ma50 !== null && m.price < m.ma50)
          ctx.push(x(IM.invest_brief_mover_below_ma))
        return `${m.symbol} ${pctFmt(m.dayChangePct ?? 0)}${ctx.length > 0 ? ` — ${ctx.slice(0, 2).join(', ')}` : ''}`
      })
      /* Once a mover carries a tail, commas can't separate movers and tags
         at once — step up to · for movers, commas inside the tail. */
      const sep = parts.some((p) => p.includes(' — ')) ? ' · ' : ', '
      out.push(
        x(morning ? IM.invest_brief_movers : IM.invest_brief_movers_day).replace(
          '{list}',
          parts.join(sep),
        ),
      )
    }

    if (freshSignals.length > 0) {
      out.push(
        pl(lang, freshSignals.length, IM.invest_brief_signal_one, IM.invest_brief_signal_many),
      )
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

    /* "Waiting on you" = queued + drafts — same scope the noticed banner
       counts, so the two never disagree about the number. */
    const queued = orders.filter((o) => o.status === 'queued' || o.status === 'draft').length
    if (queued > 0 && !ordersCovered) {
      out.push(pl(lang, queued, IM.invest_brief_order_one, IM.invest_brief_order_many))
    }

    return out
  })()

  if (dismissed || lines.length === 0) return null

  const dismiss = () => {
    writePref(DISMISS_KEY, todayKey())
    setDismissed(true)
  }

  const title = morning ? IM.invest_brief_title : IM.invest_brief_title_day
  const TitleIcon = morning ? Sunrise : Sun

  return (
    <section className="sb-card sb-brief" aria-label={x(title)}>
      <div className="sb-brief-head">
        <h2 className="sb-flabel" style={{ margin: 0 }}>
          <TitleIcon size={14} aria-hidden /> {x(title)}
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
