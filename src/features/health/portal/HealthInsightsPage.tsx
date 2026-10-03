import '@/features/invest/portal/strategies.css'
import './health.css'
import { useState } from 'react'
import { Info, Loader2, Sparkles } from 'lucide-react'
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
  moodRange,
} from '@/features/health/data/healthStats'
import { energyLabel, fmtDay, moodLabel } from './healthUi'
import { useHealthHead } from './useHealthHead'

const CHART_DAYS = 14

export function HealthInsightsPage() {
  const { x, lang } = useI18n()
  const { state, loading } = useHealthData()
  const { showToast } = useToasts()
  useHealthHead(HM.health_insights_title, HM.health_insights_sub)
  const [recap, setRecap] = useState<string | null>(null)
  const [recapping, setRecapping] = useState(false)

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

  if (loading || !state) {
    return (
      <div className="flex items-center justify-center py-[80px]">
        <Loader2 size={24} className="animate-spin text-text-muted" aria-hidden="true" />
      </div>
    )
  }

  const checkIns = state.checkIns
  const avgM = avgMood(checkIns, 30)
  const avgE = avgEnergy(checkIns, 30)
  const streak = checkInStreak(checkIns)
  const days = dailyMoods(checkIns, CHART_DAYS)
  const { best, toughest } = moodRange(checkIns, 7)
  const hasData = checkIns.length > 0

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

      {recap && (
        <section className="sb-card sb-card-pad" style={{ marginTop: 18 }}>
          <div className="sb-section-head" style={{ marginTop: 0 }}>
            <h2>{x(HM.health_ai_recap_title)}</h2>
          </div>
          <p style={{ marginTop: 0, whiteSpace: 'pre-line' }}>{recap}</p>
          <p className="sb-helper" style={{ marginBottom: 0 }}>{x(HM.health_ai_note)}</p>
        </section>
      )}

      <div className="sb-stats">
        <div className="sb-stat">
          <div className="k">{x(HM.health_ins_avg_mood)}</div>
          <div className="v">{avgM == null ? '—' : `${avgM.toFixed(1)} · ${moodLabel(avgM, lang)}`}</div>
        </div>
        <div className="sb-stat">
          <div className="k">{x(HM.health_ins_avg_energy)}</div>
          <div className="v">
            {avgE == null ? '—' : `${avgE.toFixed(1)} · ${energyLabel(avgE, lang)}`}
          </div>
        </div>
        <div className="sb-stat">
          <div className="k">{x(HM.health_ins_total)}</div>
          <div className="v">{checkIns.length}</div>
        </div>
        <div className="sb-stat">
          <div className="k">{x(HM.health_ins_streak)}</div>
          <div className="v">
            {streak === 0
              ? '0'
              : streak === 1
                ? x(HM.health_ov_streak_day)
                : x(HM.health_ov_streak_days).replace('{count}', String(streak))}
          </div>
        </div>
        <div className="sb-stat">
          <div className="k">{x(HM.health_ins_entries)}</div>
          <div className="v">{state.entries.length}</div>
        </div>
      </div>

      <div className="sb-section-head">
        <h2>{x(HM.health_ins_mood_14d)}</h2>
      </div>
      <section className="sb-card sb-card-pad">
        {!hasData ? (
          <div className="sb-empty">{x(HM.health_ins_no_data)}</div>
        ) : (
          <>
            <div className="hb-chart" role="img" aria-label={x(HM.health_ins_mood_14d)}>
              {days.map((d) => (
                <div key={d.day} className="hb-bar">
                  <div
                    className="hb-bar-fill"
                    {...(d.mood == null ? { 'data-empty': true } : {})}
                    style={{ height: `${d.mood == null ? 4 : 8 + ((d.mood - 1) / 4) * 92}%` }}
                    title={`${fmtDay(d.day, lang)}: ${moodLabel(d.mood, lang)}`}
                  />
                  <span className="hb-bar-day">{d.day.split('-')[2]}</span>
                </div>
              ))}
            </div>
            {(best || toughest) && (
              <div className="hb-rows" style={{ marginTop: 14 }}>
                {toughest && (
                  <div className="hb-row">
                    <div className="hb-row-main">
                      <p className="hb-row-title">{x(HM.health_ins_low_day)}</p>
                      <span className="hb-row-meta">
                        {fmtDay(toughest.day, lang)} — {moodLabel(toughest.mood, lang)}
                      </span>
                    </div>
                  </div>
                )}
                {best && (
                  <div className="hb-row">
                    <div className="hb-row-main">
                      <p className="hb-row-title">{x(HM.health_ins_best_day)}</p>
                      <span className="hb-row-meta">
                        {fmtDay(best.day, lang)} — {moodLabel(best.mood, lang)}
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
