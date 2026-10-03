import '@/features/invest/portal/strategies.css'
import './health.css'
import { Link } from 'react-router-dom'
import { BookOpen, HeartPulse, Info, Loader2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { healthMessages as HM } from '@/i18n/messages/health'
import { useHealthData } from '@/features/health/data/HealthDataContext'
import { avgMood, checkInStreak, habitsDoneToday, hasCheckInToday } from '@/features/health/data/healthStats'
import { fmtDateTime, moodLabel } from './healthUi'
import { useHealthHead } from './useHealthHead'

export function HealthHomePage() {
  const { x, lang } = useI18n()
  const { state, loading, error, refresh } = useHealthData()
  useHealthHead(HM.health_seo_title, HM.health_subtitle)

  if (loading || !state) {
    return (
      <div className="flex items-center justify-center py-[80px]">
        <Loader2 size={24} className="animate-spin text-text-muted" aria-hidden="true" />
      </div>
    )
  }
  if (error) {
    return (
      <div className="sb hb sb-page">
        <p role="alert" className="sb-note">{x(HM.health_load_error)}</p>
        <button type="button" className="sb-btn sb-btn-secondary" onClick={() => void refresh()}>
          {x(HM.health_retry)}
        </button>
      </div>
    )
  }

  const mood7 = avgMood(state.checkIns, 7)
  const streak = checkInStreak(state.checkIns)
  const today = hasCheckInToday(state.checkIns)
  const habitsToday = habitsDoneToday(state.habitLogs, state.habits)
  const latest = state.entries[0]

  return (
    <div className="sb hb sb-page">
      <div className="sb-head-row">
        <h1>{x(HM.health_ov_title)}</h1>
        <Link to="/health/check-in" className="sb-btn sb-btn-primary">
          {x(HM.health_ov_new_checkin)}
        </Link>
      </div>
      <p className="sb-sub">{x(HM.health_ov_sub)}</p>

      <div className="hb-crisis" role="note">
        <span className="hb-crisis-icon">
          <HeartPulse size={17} strokeWidth={1.9} aria-hidden="true" />
        </span>
        <div>
          <p className="hb-crisis-title">{x(HM.health_ov_crisis_title)}</p>
          <p className="hb-crisis-body">
            {x(HM.health_ov_crisis_body)}{' '}
            <Link to="/health/resources">{x(HM.health_ov_crisis_link)}</Link>
          </p>
        </div>
      </div>

      <div className="sb-stats">
        <div className="sb-stat">
          <div className="k">{x(HM.health_ov_today)}</div>
          <div className="v small">{today ? x(HM.health_ov_today_done) : x(HM.health_ov_today_none)}</div>
        </div>
        <div className="sb-stat">
          <div className="k">{x(HM.health_ov_mood_7d)}</div>
          <div className="v">{mood7 == null ? '—' : `${mood7.toFixed(1)} · ${moodLabel(mood7, lang)}`}</div>
        </div>
        <div className="sb-stat">
          <div className="k">{x(HM.health_ov_streak)}</div>
          <div className="v">
            {streak === 0
              ? '0'
              : streak === 1
                ? x(HM.health_ov_streak_day)
                : x(HM.health_ov_streak_days).replace('{count}', String(streak))}
          </div>
        </div>
        <div className="sb-stat">
          <div className="k">{x(HM.health_ov_entries)}</div>
          <div className="v">{state.entries.length}</div>
        </div>
        <div className="sb-stat">
          <div className="k">{x(HM.health_ov_habits)}</div>
          <div className="v">
            {habitsToday.total === 0 ? '—' : `${habitsToday.done}/${habitsToday.total}`}
          </div>
        </div>
      </div>

      <div className="sb-duo">
        <section className="sb-card sb-card-pad">
          <div className="sb-section-head" style={{ marginTop: 0 }}>
            <h2 className="m-0 text-[16px]">{x(HM.health_ov_recent)}</h2>
          </div>
          {state.checkIns.length === 0 ? (
            <div className="sb-empty">{x(HM.health_ov_empty)}</div>
          ) : (
            <ul className="sb-mini-list">
              {state.checkIns.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <span className="hb-mood-dot" {...(c.mood <= 2 ? { 'data-low': true } : {})}>
                    {moodLabel(c.mood, lang)}
                  </span>
                  <span className="hb-row-meta">{fmtDateTime(c.createdAt, lang)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="sb-card sb-card-pad">
          <div className="sb-section-head" style={{ marginTop: 0 }}>
            <h2 className="m-0 text-[16px]">{x(HM.health_ov_latest_entry)}</h2>
            <Link
              to="/health/journal"
              className="inline-flex items-center gap-[4px] text-[12.5px] font-semibold no-underline"
              style={{ color: 'var(--sb-accent-ink)' }}
            >
              <BookOpen size={13} aria-hidden="true" />
              {x(HM.health_journal_title)}
            </Link>
          </div>
          {!latest ? (
            <div className="sb-empty">{x(HM.health_journal_empty)}</div>
          ) : (
            <div className="hb-row-main" style={{ paddingTop: 4 }}>
              <p className="hb-row-title">
                {latest.title.trim() || x(HM.health_journal_untitled)}
              </p>
              <p
                className="hb-row-body"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {latest.body}
              </p>
              <span className="hb-row-meta">{fmtDateTime(latest.createdAt, lang)}</span>
            </div>
          )}
        </section>
      </div>

      <div className="sb-note">
        <Info size={16} aria-hidden="true" />
        <span>{x(HM.health_info_note)}</span>
      </div>
    </div>
  )
}
