import '@/features/invest/portal/strategies.css'
import './health.css'
import { useState } from 'react'
import { Check, Loader2, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { healthMessages as HM } from '@/i18n/messages/health'
import { useHealthData } from '@/features/health/data/HealthDataContext'
import { addHabit, deleteHabit, setHabitDone } from '@/features/health/data/api'
import { habitDoneDays, habitStreak, recentDayKeys, todayDayKey } from '@/features/health/data/healthStats'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useHealthHead } from './useHealthHead'

/**
 * Habits — the user names small daily things and ticks them off. Deliberately
 * gentle: no scores, no targets, no streak-shaming. A missed day is just a
 * missed day; nothing here is a health metric.
 */
export function HealthHabitsPage() {
  const { x } = useI18n()
  const { state, refresh } = useHealthData()
  const { showToast } = useToasts()
  useHealthHead(HM.health_seo_title_habits, HM.health_seo_desc_habits)

  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [armDelete, setArmDelete] = useState<string | null>(null)

  const habits = state?.habits ?? []
  const logs = state?.habitLogs ?? []
  const today = todayDayKey()
  const week = recentDayKeys(7)
  const weekDays = week.map((d) => d.slice(8)) // DD for the dot labels

  const submit = async () => {
    const trimmed = name.trim()
    if (!trimmed || saving) return
    setSaving(true)
    try {
      await addHabit(trimmed)
      await refresh()
      setName('')
      showToast(HM.health_habit_added)
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (habitId: string, done: boolean) => {
    if (busyId) return
    setBusyId(habitId)
    try {
      await setHabitDone(habitId, today, done)
      await refresh()
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (id: string) => {
    if (armDelete !== id) {
      setArmDelete(id)
      return
    }
    setArmDelete(null)
    await deleteHabit(id)
    await refresh()
  }

  return (
    <div className="sb hb sb-page">
      <div className="sb-head-row">
        <h1>{x(HM.health_habits_title)}</h1>
      </div>
      <p className="sb-sub">{x(HM.health_habits_sub)}</p>

      <section className="sb-card sb-card-pad" style={{ marginTop: 18 }}>
        <div className="flex items-end gap-[10px] max-[560px]:flex-col max-[560px]:items-stretch">
          <div className="sb-field min-w-0 flex-1" style={{ marginBottom: 0 }}>
            <label className="sb-flabel" htmlFor="hb-habit-name">
              {x(HM.health_habit_new)}
            </label>
            <input
              id="hb-habit-name"
              className="sb-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={x(HM.health_habit_ph)}
              maxLength={120}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void submit()
              }}
            />
          </div>
          <button
            type="button"
            className="sb-btn sb-btn-primary"
            disabled={!name.trim() || saving}
            onClick={() => void submit()}
          >
            {saving && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            {x(HM.health_habit_add)}
          </button>
        </div>
      </section>

      <section className="sb-card sb-card-pad" style={{ marginTop: 18 }}>
        {habits.length === 0 ? (
          <div className="sb-empty">{x(HM.health_habits_empty)}</div>
        ) : (
          <div className="hb-rows">
            {habits.map((h) => {
              const doneDays = habitDoneDays(logs, h.id)
              const streak = habitStreak(logs, h.id)
              const doneToday = doneDays.has(today)
              return (
                <div key={h.id} className="hb-row">
                  <div className="hb-row-main">
                    <span className="hb-row-title">{h.name}</span>
                    <div className="flex flex-wrap items-center gap-[8px]">
                      {streak > 0 && (
                        <span className="sb-pill sb-pill-ok">
                          {x(
                            streak === 1
                              ? HM.health_habit_streak_one
                              : HM.health_habit_streak_many,
                          ).replace('{count}', String(streak))}
                        </span>
                      )}
                      <span className="flex items-center gap-[4px]" role="img" aria-label={x(HM.health_habit_week)}>
                        {week.map((d, i) => (
                          <span
                            key={d}
                            title={d}
                            className={`hb-dot${doneDays.has(d) ? ' is-on' : ''}`}
                          >
                            <span className="sr-only">{weekDays[i]}</span>
                          </span>
                        ))}
                      </span>
                    </div>
                  </div>
                  <div className="hb-row-side">
                    <button
                      type="button"
                      className={`sb-btn sb-btn-sm ${doneToday ? 'sb-btn-primary' : 'sb-btn-secondary'}`}
                      style={{ minHeight: 34, padding: '5px 12px', fontSize: 12.5 }}
                      disabled={busyId === h.id}
                      aria-pressed={doneToday}
                      onClick={() => void toggle(h.id, !doneToday)}
                    >
                      {doneToday && <Check size={13} aria-hidden="true" />}
                      {doneToday ? x(HM.health_habit_done) : x(HM.health_habit_mark)}
                    </button>
                    <button
                      type="button"
                      className={`sb-btn sb-btn-sm ${armDelete === h.id ? 'sb-btn-danger sb-armed' : 'sb-btn-secondary'}`}
                      style={{ minHeight: 34, padding: '5px 12px', fontSize: 12.5 }}
                      onClick={() => void remove(h.id)}
                      onBlur={() => setArmDelete(null)}
                    >
                      <Trash2 size={13} aria-hidden="true" />
                      {armDelete === h.id
                        ? x(HM.health_habit_delete_confirm)
                        : x(HM.health_habit_delete)}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <p className="sb-note" style={{ marginTop: 18 }}>
        {x(HM.health_habits_note)}
      </p>
    </div>
  )
}
