import '@/features/invest/portal/strategies.css'
import './health.css'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Info, Loader2, Sparkles, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { healthMessages as HM } from '@/i18n/messages/health'
import { useHealthData } from '@/features/health/data/HealthDataContext'
import { healthAiRecap } from '@/features/health/data/api'
import { useToasts } from '@/features/app/toasts/toastsContext'
import {
  avgEnergy,
  avgMood,
  checkInStreak,
  dailyMoods,
  hasCheckInToday,
  moodRange,
} from '@/features/health/data/healthStats'
import { energyLabel, fmtDay, moodLabel } from './healthUi'
import { HealthDataError } from './HealthDataError'
import { HealthLoading } from './HealthLoading'
import { useHealthHead } from './useHealthHead'

const CHART_DAYS = 14

export function HealthInsightsPage() {
  const { x, lang } = useI18n()
  const { state, loading } = useHealthData()
  const { showToast } = useToasts()
  useHealthHead(HM.health_insights_title, HM.health_insights_sub)
  const [recap, setRecap] = useState<string | null>(null)
  const [recapping, setRecapping] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const recapFired = useRef(false)

  /* A recap written in one language goes stale on the other — the card
     clears on a lang switch rather than read as a mistranslation. */
  useEffect(() => {
    setRecap(null)
  }, [lang])

  /* The model narrates the same aggregates the page shows — nothing more
     leaves the portal. Regenerated on each click; never stored. */
  const summarize = async () => {
    if (recapping) return
    setRecapping(true)
    try {
      setRecap(await healthAiRecap(lang))
    } catch {
      showToast(HM.health_ai_failed)
    } finally {
      setRecapping(false)
    }
  }

  /* /health/insights?recap=1 — the Overview's "Summarize my week" link is
     the click; arriving fires the recap once, only when there's data to
     narrate, then the param is consumed so a refresh or Back-press doesn't
     silently spend another model call. Recap draws on shared journal text
     too, so journal-only users aren't gated out. */
  const hasDataEarly =
    (state?.checkIns.length ?? 0) + (state?.entries.length ?? 0) > 0
  useEffect(() => {
    if (recapFired.current || searchParams.get('recap') !== '1' || !hasDataEarly) return
    recapFired.current = true
    void summarize()
    const next = new URLSearchParams(searchParams)
    next.delete('recap')
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- summarize is stable enough: it only reads lang + its own state setters
  }, [searchParams, hasDataEarly, setSearchParams])

  if (loading) return <HealthLoading />
  if (!state) return <HealthDataError />

  const checkIns = state.checkIns
  const avgM = avgMood(checkIns, 30)
  const avgE = avgEnergy(checkIns, 30)
  const streak = checkInStreak(checkIns)
  const streakPending = streak > 0 && !hasCheckInToday(checkIns)
  const days = dailyMoods(checkIns, CHART_DAYS)
  const { best, toughest } = moodRange(checkIns, 7)
  /* A single logged day is both best and toughest — show it once. */
  const sameDay = best != null && toughest != null && best.day === toughest.day
  const hasData = checkIns.length + state.entries.length > 0
  const checkInTotal = state.checkInsTotal ?? checkIns.length
  const entryTotal = state.entriesTotal ?? state.entries.length

  /* Spoken summary for the chart — the bars are decoration; AT gets the
     data, not a repeated heading. */
  const loggedDays = days.filter((d) => d.mood != null)
  const chartAvg =
    loggedDays.length > 0
      ? loggedDays.reduce((s, d) => s + (d.mood ?? 0), 0) / loggedDays.length
      : null
  const chartLabel = (chartAvg != null
    ? x(HM.health_ins_chart_summary)
        .replace('{avg}', `${+chartAvg.toFixed(1)}`)
    : x(HM.health_ins_chart_summary_none)
  )
    .replace('{logged}', String(loggedDays.length))
    .replace('{total}', String(CHART_DAYS))

  const fmtAvg = (v: number) => `${+v.toFixed(1)}`

  return (
    <div className="sb hb sb-page">
      <div className="sb-head-row">
        <h1>{x(HM.health_insights_title)}</h1>
        {hasData && (
          <button
            type="button"
            className="sb-btn sb-btn-secondary"
            disabled={recapping}
            onClick={() => void summarize()}
          >
            {recapping ? (
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles size={15} aria-hidden="true" />
            )}
            {x(recapping ? HM.health_ai_recap_loading : HM.health_ai_recap_btn)}
          </button>
        )}
      </div>
      <p className="sb-sub">{x(HM.health_insights_sub)}</p>

      {/* aria-live: the recap lands asynchronously — AT hears it arrive. */}
      {(recap || recapping) && (
        <section className="sb-card sb-card-pad" style={{ marginTop: 18 }} aria-live="polite">
          <div className="sb-section-head" style={{ marginTop: 0 }}>
            <h2>{x(HM.health_ai_recap_title)}</h2>
            {recap && (
              <button
                type="button"
                className="hb-note-close"
                aria-label={x(HM.health_dismiss)}
                onClick={() => setRecap(null)}
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>
          {recap ? (
            <>
              <p style={{ marginTop: 0, whiteSpace: 'pre-line' }}>{recap}</p>
              <p className="sb-helper" style={{ marginBottom: 0 }}>{x(HM.health_ai_note)}</p>
            </>
          ) : (
            <p className="sb-helper" style={{ margin: 0 }}>
              {x(HM.health_ai_recap_loading)}
            </p>
          )}
        </section>
      )}

      <div className="sb-stats">
        <div className="sb-stat">
          <div className="k">{x(HM.health_ins_avg_mood)}</div>
          <div className="v">{avgM == null ? '—' : `${fmtAvg(avgM)} · ${moodLabel(avgM, lang)}`}</div>
        </div>
        <div className="sb-stat">
          <div className="k">{x(HM.health_ins_avg_energy)}</div>
          <div className="v">
            {avgE == null ? '—' : `${fmtAvg(avgE)} · ${energyLabel(avgE, lang)}`}
          </div>
        </div>
        <Link
          to="/health/check-in"
          className="sb-stat sb-stat-link"
          aria-label={`${x(HM.health_ins_total)}: ${checkInTotal}`}
        >
          <div className="k">{x(HM.health_ins_total)}</div>
          <div className="v">{checkInTotal}</div>
        </Link>
        <Link
          to="/health/check-in"
          className="sb-stat sb-stat-link"
          aria-label={`${x(HM.health_ins_streak)}: ${streak === 1 ? x(HM.health_ov_streak_day) : x(HM.health_ov_streak_days).replace('{count}', String(streak))}${streakPending ? ` — ${x(HM.health_ov_streak_pending)}` : ''}`}
        >
          <div className="k">{x(HM.health_ins_streak)}</div>
          <div className="v">
            {streak === 1
              ? x(HM.health_ov_streak_day)
              : x(HM.health_ov_streak_days).replace('{count}', String(streak))}
          </div>
          {streakPending && (
            <div className="hb-row-meta" style={{ marginTop: 2 }}>
              {x(HM.health_ov_streak_pending)}
            </div>
          )}
        </Link>
        <Link
          to="/health/journal"
          className="sb-stat sb-stat-link"
          aria-label={`${x(HM.health_ins_entries)}: ${entryTotal}`}
        >
          <div className="k">{x(HM.health_ins_entries)}</div>
          <div className="v">{entryTotal}</div>
        </Link>
      </div>

      <div className="sb-section-head">
        <h2>{x(HM.health_ins_mood_14d)}</h2>
      </div>
      <section className="sb-card sb-card-pad">
        {!hasData ? (
          <div className="sb-empty">
            {x(HM.health_ins_no_data)}
            <div style={{ marginTop: 10 }}>
              <Link to="/health/check-in" className="sb-btn sb-btn-sm sb-btn-secondary">
                {x(HM.health_ins_checkin_cta)}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <p className="sb-helper" style={{ margin: '0 0 8px' }}>
              1 = {moodLabel(1, lang)} · 5 = {moodLabel(5, lang)}
            </p>
            <div className="hb-chart" role="img" aria-label={chartLabel}>
              {days.map((d, i) => {
                /* Bare day numbers read oddly across a month boundary —
                   the first bar and each month rollover get the full label. */
                const monthEdge = i === 0 || d.day.endsWith('-01')
                return (
                  <div key={d.day} className="hb-bar">
                    <div
                      className="hb-bar-fill"
                      {...(d.mood == null ? { 'data-empty': true } : {})}
                      style={{ height: `${d.mood == null ? 6 : 14 + ((d.mood - 1) / 4) * 86}%` }}
                      title={
                        d.mood == null
                          ? x(HM.health_ins_day_none).replace('{day}', fmtDay(d.day, lang))
                          : `${fmtDay(d.day, lang)}: ${moodLabel(d.mood, lang)}`
                      }
                    />
                    <span className={`hb-bar-day${monthEdge ? ' is-month' : ''}`}>
                      {monthEdge ? fmtDay(d.day, lang) : d.day.split('-')[2]}
                    </span>
                  </div>
                )
              })}
            </div>
            {(best || toughest) && (
              <div className="hb-rows" role="list" style={{ marginTop: 14 }}>
                {best && (
                  <div className="hb-row" role="listitem">
                    <div className="hb-row-main">
                      <p className="hb-row-title">{x(HM.health_ins_best_day)}</p>
                      <span className="hb-row-meta">
                        {fmtDay(best.day, lang)} — {moodLabel(best.mood, lang)}
                      </span>
                    </div>
                  </div>
                )}
                {toughest && !sameDay && (
                  <div className="hb-row" role="listitem">
                    <div className="hb-row-main">
                      <p className="hb-row-title">{x(HM.health_ins_low_day)}</p>
                      <span className="hb-row-meta">
                        {fmtDay(toughest.day, lang)} — {moodLabel(toughest.mood, lang)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </section>

      <div className="sb-note">
        <Info size={16} aria-hidden="true" />
        <span>{x(HM.health_ins_note)}</span>
      </div>
    </div>
  )
}
