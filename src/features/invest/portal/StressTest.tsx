import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import { convertFx, loadFxRates, type FxTable } from '../data/fx'
import { runStress, type Shock, type StressResult } from '../data/stressTest'
import type {
  InvestAccount,
  InvestGoal,
  InvestPosition,
  InvestStrategy,
  InvestThesis,
  MarketSnapshot,
  ThesisStatus,
} from '../data/types'

const STATUS_KEY: Record<ThesisStatus, keyof typeof IM> = {
  healthy: 'invest_thesis_status_healthy',
  drifting: 'invest_thesis_status_drifting',
  broken: 'invest_thesis_status_broken',
}
const STATUS_PILL: Record<ThesisStatus, string> = {
  healthy: 'sb-pill-ok',
  drifting: 'sb-pill-warn',
  broken: 'sb-pill-fail',
}

type PresetId = 'all10' | 'top15' | 'cad5' | 'winners20' | 'custom'

/** Scenario math over the user's own rules — everything runs client-side
    against the marks already in state; nothing is written or filed. */
export function StressTest(props: {
  positions: InvestPosition[]
  snapshots: MarketSnapshot[]
  strategies: InvestStrategy[]
  theses: InvestThesis[]
  goals: InvestGoal[]
  watchSymbols: string[]
  accounts: InvestAccount[]
}) {
  const { positions, snapshots, strategies, theses, goals, watchSymbols, accounts } = props
  const { lang, x } = useI18n()
  const [preset, setPreset] = useState<PresetId>('all10')
  const [customSymbol, setCustomSymbol] = useState('')
  const [customPct, setCustomPct] = useState('')
  const [result, setResult] = useState<StressResult | null>(null)
  const [fx, setFx] = useState<FxTable | null>(null)

  useEffect(() => {
    let live = true
    void loadFxRates().then((t) => live && setFx(t))
    return () => {
      live = false
    }
  }, [])

  /* Same book-currency rule as the portfolio page — the first active
     account's base. Cash converts into it for the shared math. */
  const bookCcy = useMemo(
    () =>
      (
        accounts.find((a) => a.status === 'active')?.baseCurrency ?? 'CAD'
      ).toUpperCase(),
    [accounts],
  )
  const cashTotal = useMemo(() => {
    let t = 0
    for (const a of accounts) {
      const c = convertFx(a.cashBalance, a.baseCurrency, bookCcy, fx)
      if (c !== null) t += c
    }
    return t
  }, [accounts, bookCcy, fx])

  const money = useMemo(
    () =>
      new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', {
        style: 'currency',
        currency: bookCcy,
        maximumFractionDigits: 0,
      }),
    [lang, bookCcy],
  )
  const pctFmt = (n: number) =>
    `${n > 0 ? '+' : ''}${n.toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
      maximumFractionDigits: 1,
    })}%`
  /* Metric-aware value format — counts aren't percents. */
  const metricFmt = (metric: string, n: number) =>
    metric === 'book_value'
      ? money.format(n)
      : metric === 'position_count'
        ? String(Math.round(n))
        : pctFmt(n)

  const positionBookValue = (p: InvestPosition): number | null => {
    const snap = snapshots.find(
      (s) => s.assetClass === p.assetClass && s.symbol === p.symbol,
    )
    if (!snap) return null
    return convertFx(p.quantity * snap.price, snap.currency, bookCcy, fx)
  }

  /** The preset's shock list — `top15` and `winners20` derive their target
      set from the live book, so they're computed, not constants. */
  const presetShocks = (id: PresetId): Shock[] | null => {
    switch (id) {
      case 'all10':
        return [{ match: 'ALL', pct: -10 }]
      case 'cad5':
        return [{ match: 'ALL', pct: 5, kind: 'fx' }]
      case 'top15': {
        let best: { sym: string; v: number } | null = null
        for (const p of positions) {
          const v = positionBookValue(p)
          if (v !== null && (best === null || v > best.v))
            best = { sym: p.symbol, v }
        }
        return best ? [{ match: best.sym, pct: -15 }] : []
      }
      case 'winners20': {
        const shocks: Shock[] = []
        for (const p of positions) {
          const snap = snapshots.find(
            (s) => s.assetClass === p.assetClass && s.symbol === p.symbol,
          )
          if (!snap || p.avgCost <= 0) continue
          const px = convertFx(snap.price, snap.currency, bookCcy, fx)
          const cost = convertFx(p.avgCost, p.currency || snap.currency, bookCcy, fx)
          if (px !== null && cost !== null && cost > 0 && px > cost) {
            shocks.push({ match: p.symbol, pct: -20 })
          }
        }
        return shocks
      }
      case 'custom':
        return null /* the form path */
    }
  }

  const run = (shocks: Shock[]) => {
    setResult(
      runStress({
        snapshots,
        positions,
        strategies,
        theses,
        goals,
        watchSymbols,
        cashTotal,
        bookCcy,
        fx,
        shocks,
      }),
    )
  }

  const pickPreset = (id: PresetId) => {
    setPreset(id)
    if (id === 'custom') return /* waits for the explicit run */
    const shocks = presetShocks(id)
    if (shocks) run(shocks)
  }

  const runCustom = () => {
    const pct = Number(customPct)
    if (!customSymbol || !Number.isFinite(pct) || pct === 0) return
    run([{ match: customSymbol, pct }])
  }

  /* The custom picker offers every symbol we can shock — snapshot symbols
     plus held ones (a held row without a mark would silently no-op). */
  const shockableSymbols = useMemo(() => {
    const syms = new Set(snapshots.map((s) => s.symbol.toUpperCase()))
    for (const p of positions) syms.add(p.symbol.toUpperCase())
    return [...syms].sort()
  }, [snapshots, positions])

  const PRESETS: { id: PresetId; key: keyof typeof IM }[] = [
    { id: 'all10', key: 'invest_stress_scenario_all10' },
    { id: 'top15', key: 'invest_stress_scenario_top15' },
    { id: 'cad5', key: 'invest_stress_scenario_cad5' },
    { id: 'winners20', key: 'invest_stress_scenario_winners' },
    { id: 'custom', key: 'invest_stress_scenario_custom' },
  ]

  const quiet =
    result !== null &&
    result.strategies.length === 0 &&
    result.theses.length === 0 &&
    result.goals.every((g) => g.met !== false)

  if (snapshots.length === 0 && positions.length === 0) {
    return (
      <section className="sb-card sb-stress">
        <h2 className="sb-flabel">
          <Activity size={14} aria-hidden /> {x(IM.invest_stress_title)}
        </h2>
        <p className="sb-muted">{x(IM.invest_stress_empty)}</p>
      </section>
    )
  }

  return (
    <section className="sb-card sb-stress">
      <h2 className="sb-flabel">
        <Activity size={14} aria-hidden /> {x(IM.invest_stress_title)}
      </h2>
      <p className="sb-muted">{x(IM.invest_stress_sub)}</p>

      <div className="sb-seg sb-stress-scenarios" role="group" aria-label={x(IM.invest_stress_title)}>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className="sb-seg-btn"
            aria-pressed={preset === p.id}
            onClick={() => pickPreset(p.id)}
          >
            {x(IM[p.key])}
          </button>
        ))}
      </div>

      {preset === 'custom' && (
        <div className="sb-stress-custom">
          <select
            className="sb-input"
            aria-label={x(IM.invest_stress_pick_symbol)}
            value={customSymbol}
            onChange={(e) => setCustomSymbol(e.target.value)}
          >
            <option value="">{x(IM.invest_stress_pick_symbol)}</option>
            {shockableSymbols.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="sb-cur-wrap">
            <input
              className="sb-input"
              inputMode="decimal"
              aria-label={x(IM.invest_stress_pct_label)}
              placeholder="-15"
              value={customPct}
              onChange={(e) => setCustomPct(e.target.value)}
            />
            <span className="sb-suf">%</span>
          </div>
          <button
            type="button"
            className="sb-btn"
            disabled={
              !customSymbol || !Number.isFinite(Number(customPct)) || Number(customPct) === 0
            }
            onClick={runCustom}
          >
            {x(IM.invest_stress_run)}
          </button>
        </div>
      )}

      {result && (
        <div className="sb-stress-results">
          <div className="sb-stress-book">
            <span className="sb-muted">{x(IM.invest_stress_book)}</span>
            <strong>
              {result.bookValue !== null ? money.format(result.bookValue) : '—'}
            </strong>
            {result.bookDeltaPct !== null && (
              <span
                className={`sb-pill ${result.bookDeltaPct >= 0 ? 'sb-pill-ok' : 'sb-pill-danger'}`}
              >
                {pctFmt(result.bookDeltaPct)}
              </span>
            )}
          </div>

          {result.unmatched.length > 0 && (
            <p className="sb-stress-note">
              <AlertTriangle size={12} aria-hidden />{' '}
              {x(IM.invest_stress_unmatched).replace('{symbols}', result.unmatched.join(', '))}
            </p>
          )}

          {quiet && <p className="sb-muted">{x(IM.invest_stress_none)}</p>}

          {result.strategies.length > 0 && (
            <div className="sb-stress-group">
              <h3>{x(IM.invest_stress_strategies)}</h3>
              <ul>
                {result.strategies.map((h, i) => (
                  <li key={i}>
                    <strong>{h.strategyName}</strong>
                    {' — '}
                    {h.ruleTitle}
                    {h.symbol && <span className="sb-stress-sym"> {h.symbol}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.theses.length > 0 && (
            <div className="sb-stress-group">
              <h3>{x(IM.invest_stress_theses)}</h3>
              <ul>
                {result.theses.map((t) => (
                  <li key={t.symbol}>
                    <span className="sb-stress-sym">{t.symbol}</span> {t.name}
                    {' · '}
                    <span className={`sb-pill ${STATUS_PILL[t.current]}`}>
                      {x(IM[STATUS_KEY[t.current]])}
                    </span>
                    {' → '}
                    <span className={`sb-pill ${STATUS_PILL[t.stressed]}`}>
                      {x(IM[STATUS_KEY[t.stressed]])}
                    </span>
                    {t.firedTitles.length > 0 && (
                      <span className="sb-muted"> · {t.firedTitles.join(', ')}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.goals.length > 0 && (
            <div className="sb-stress-group">
              <h3>{x(IM.invest_stress_goals)}</h3>
              <ul>
                {result.goals.map((g, i) => (
                  <li key={i}>
                    {g.title}
                    {' · '}
                    <span className="sb-muted">
                      {g.current === null ? '—' : metricFmt(g.metric, g.current)}
                      {' '}
                      {g.op === 'gte' ? '≥' : '≤'} {metricFmt(g.metric, g.target)}
                    </span>
                    {' · '}
                    {g.met === null ? (
                      <span className="sb-muted">{x(IM.invest_stress_goal_unknown)}</span>
                    ) : g.met ? (
                      <span className="sb-pill sb-pill-ok">{x(IM.invest_stress_goal_holds)}</span>
                    ) : (
                      <span className="sb-pill sb-pill-danger">
                        {x(IM.invest_stress_goal_slips)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="sb-stress-note">{x(IM.invest_stress_note)}</p>
        </div>
      )}
    </section>
  )
}
