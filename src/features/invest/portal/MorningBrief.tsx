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
      /* Movers sharing the identical tag set collapse into one group —
         "ASTS, RKLB, QUBT — below your cost, below their 50-day
         averages" says the same thing as four repeated tails, once.
         Tag keys stay symbolic until render so a group can pluralize. */
      type MoverTagKey = 'broken' | 'drifting' | 'signal' | 'cost' | 'ma'
      const MOVER_TAG: Record<MoverTagKey, keyof typeof IM> = {
        broken: 'invest_brief_mover_broken',
        drifting: 'invest_brief_mover_drifting',
        signal: 'invest_brief_mover_signal',
        cost: 'invest_brief_mover_below_cost',
        ma: 'invest_brief_mover_below_ma',
      }
      const MOVER_TAG_MANY: Partial<Record<MoverTagKey, keyof typeof IM>> = {
        broken: 'invest_brief_mover_broken_many',
        drifting: 'invest_brief_mover_drifting_many',
        signal: 'invest_brief_mover_signal_many',
        ma: 'invest_brief_mover_below_ma_many',
      }
      const groups = new Map<string, { syms: string[]; keys: MoverTagKey[] }>()
      for (const m of movers) {
        const sym = m.symbol.toUpperCase()
        const keys: MoverTagKey[] = []
        const th = theses.find((t) => t.symbol.toUpperCase() === sym)
        if (th?.status === 'broken') keys.push('broken')
        else if (th?.status === 'drifting') keys.push('drifting')
        if (freshSignals.some((s) => s.symbol.toUpperCase() === sym)) keys.push('signal')
        /* avg_cost is position-currency; only compare when the quote is
           quoted in the same currency, never raw across currencies. */
        const pos = positions.find(
          (p) => p.symbol.toUpperCase() === sym && p.currency === m.currency,
        )
        if (pos && pos.avgCost > 0 && m.price < pos.avgCost) keys.push('cost')
        if (m.ma50 !== null && m.price < m.ma50) keys.push('ma')
        const sig = keys.slice(0, 2).join('|')
        const g = groups.get(sig) ?? { syms: [], keys: keys.slice(0, 2) }
        g.syms.push(`${m.symbol} ${pctFmt(m.dayChangePct ?? 0)}`)
        groups.set(sig, g)
      }
      /* Commas join same-group symbols and same-tail tags; · separates
         the groups — the tail always binds to the symbols before it. */
      const parts = [...groups.values()].map(
        (g) =>
          `${g.syms.join(', ')}${g.keys.length > 0
            ? ` — ${g.keys
                .map(
                  (k) =>
                    x(
                      g.syms.length > 1
                        ? IM[MOVER_TAG_MANY[k] ?? MOVER_TAG[k]]
                        : IM[MOVER_TAG[k]],
                    ),
                )
                .join(', ')}`
            : ''}`,
      )
      out.push(
        x(morning ? IM.invest_brief_movers : IM.invest_brief_movers_day).replace(
          '{list}',
          parts.join(' · '),
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
          .replace(
            '{broken}',
            `${broken} ${pl(lang, broken, IM.invest_brief_broken_one, IM.invest_brief_broken_many)}`,
          )
          .replace(
            '{drifting}',
            `${drifting} ${pl(lang, drifting, IM.invest_brief_drift_one, IM.invest_brief_drift_many)}`,
          ),
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
    <section className="sb-card sb-card-pad sb-brief" aria-label={x(title)}>
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
