import '@/features/invest/portal/strategies.css'
import './health.css'
import { useEffect, useState } from 'react'
import { Check, Loader2, Sparkles, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { healthMessages as HM } from '@/i18n/messages/health'
import { useHealthData } from '@/features/health/data/HealthDataContext'
import { addHabit, deleteHabit, healthAiHabit, sendHealthReaction, setHabitDone, type HabitSuggestion } from '@/features/health/data/api'
import { habitDoneDays, habitStreak, recentDayKeys, todayDayKey } from '@/features/health/data/healthStats'
import { loadNotifyPref, setNotifyPref } from '@/lib/notifications/notifyPrefs'
import { loadPendingSuggestions, resolveSuggestion } from '@/lib/agentQueue'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { MiraNote } from './MiraNote'
import { useHealthHead } from './useHealthHead'

/**
 * Habits — the user names small daily things and ticks them off. Deliberately
 * gentle: no scores, no targets, no streak-shaming. A missed day is just a
 * missed day; nothing here is a health metric.
 */
export function HealthHabitsPage() {
  const { x, lang } = useI18n()
  const { state, refresh } = useHealthData()
  const { showToast } = useToasts()
  useHealthHead(HM.health_seo_title_habits, HM.health_seo_desc_habits)

  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [armDelete, setArmDelete] = useState<string | null>(null)
  const [notifyOn, setNotifyOn] = useState<boolean | null>(null)
  const [notifySaving, setNotifySaving] = useState(false)
  const [suggestions, setSuggestions] = useState<HabitSuggestion[]>([])
  const [suggestBusy, setSuggestBusy] = useState(false)
  const [miraLine, setMiraLine] = useState<string | null>(null)

  /* Evening streak nudge — one email a day at most, only while a live
     streak is unchecked. Absent pref row defaults to on. */
  useEffect(() => {
    let cancelled = false
    loadNotifyPref('health')
      .then((v) => { if (!cancelled) setNotifyOn(v) })
      .catch(() => { if (!cancelled) setNotifyOn(true) })
    return () => { cancelled = true }
  }, [])

  const toggleNotify = async () => {
    const next = !(notifyOn ?? true)
    if (notifySaving) return
    setNotifySaving(true)
    setNotifyOn(next)
    try {
      await setNotifyPref('health', next)
    } catch {
      setNotifyOn(!next)
    } finally {
      setNotifySaving(false)
    }
  }

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

  /* Pending habit rows from the review queue survive refresh — same rows
     the /health/review page lists. */
  useEffect(() => {
    loadPendingSuggestions('health')
      .then((rows) =>
        setSuggestions(
          rows
            .filter((r) => r.kind === 'habit')
            .map((r) => {
              const p = (r.payload as { name?: string; why?: string } | null) ?? {}
              return { name: p.name ?? r.title, why: p.why ?? '', suggestionId: r.id }
            })
            .filter((r) => r.name.trim() !== ''),
        ),
      )
      .catch(() => {})
  }, [])

  /* Habit suggestion — the model sees habit names + streak aggregates only
     and answers "name | reason". Nothing is added until the user taps
     "Add it"; dismissing resolves the queue row. */
  const suggestHabit = async () => {
    if (suggestBusy) return
    setSuggestBusy(true)
    try {
      const out = await healthAiHabit(lang)
      setSuggestions((cur) =>
        cur.some(
          (c) =>
            (c.suggestionId && c.suggestionId === out.suggestionId) ||
            c.name.toLowerCase() === out.name.toLowerCase(),
        )
          ? cur
          : [...cur, out],
      )
    } catch {
      showToast(HM.health_ai_habit_failed)
    } finally {
      setSuggestBusy(false)
    }
  }

  const acceptSuggestion = async (s: HabitSuggestion) => {
    if (saving) return
    setSaving(true)
    try {
      await addHabit(s.name)
      if (s.suggestionId) {
        await resolveSuggestion(s.suggestionId, 'accepted', 'added').catch(() => {})
      }
      setSuggestions((cur) => cur.filter((c) => c !== s))
      await refresh()
      showToast(HM.health_habit_added)
    } finally {
      setSaving(false)
    }
  }

  const dismissSuggestion = async (s: HabitSuggestion) => {
    if (s.suggestionId) {
      await resolveSuggestion(s.suggestionId, 'dismissed', 'dismissed').catch(() => {})
    }
    setSuggestions((cur) => cur.filter((c) => c !== s))
  }

  const toggle = async (habitId: string, done: boolean) => {
    if (busyId) return
    setBusyId(habitId)
    try {
      await setHabitDone(habitId, today, done)
      await refresh()
      /* She reacts to the kept promise, not the unchecking — best-effort,
         the line also lands in the chat thread. */
      if (done) {
        const name = habits.find((h) => h.id === habitId)?.name ?? ''
        /* Throttled reactions resolve reply:null — leave any earlier line up. */
        void sendHealthReaction({ type: 'habit_marked', habit: name }, lang, setMiraLine)
          .then((r) => {
            if (r.reply !== null) setMiraLine(r.reply)
          })
          .catch(() => {})
      }
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
          <button
            type="button"
            className="sb-btn sb-btn-secondary"
            disabled={suggestBusy}
            onClick={() => void suggestHabit()}
          >
            {suggestBusy ? (
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles size={15} aria-hidden="true" />
            )}
            {x(suggestBusy ? HM.health_ai_habit_loading : HM.health_ai_habit_btn)}
          </button>
        </div>
        {suggestions.map((s) => (
          <div
            key={s.suggestionId ?? s.name}
            className="sb-notify-row"
            style={{ marginTop: 12, alignItems: 'flex-start', cursor: 'default' }}
          >
            <span style={{ flex: 1, minWidth: 0 }}>
              <strong>{s.name}</strong>
              {s.why && (
                <span className="sb-notify-hint">{s.why}</span>
              )}
              <span className="sb-notify-hint">{x(HM.health_ai_note)}</span>
              {s.suggestionId === null ? (
                <span className="sb-notify-hint">{x(HM.health_ai_not_filed)}</span>
              ) : null}
            </span>
            <span className="flex gap-[8px]" style={{ flexShrink: 0 }}>
              <button
                type="button"
                className="sb-btn sb-btn-secondary sb-btn-sm"
                disabled={saving}
                onClick={() => void acceptSuggestion(s)}
              >
                {x(HM.health_ai_habit_add)}
              </button>
              <button
                type="button"
                className="sb-btn sb-btn-secondary sb-btn-sm"
                onClick={() => void dismissSuggestion(s)}
              >
                {x(HM.health_ai_habit_dismiss)}
              </button>
            </span>
          </div>
        ))}
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
        {notifyOn !== null && (
          <label className="sb-notify-row">
            <input
              type="checkbox"
              checked={notifyOn}
              disabled={notifySaving}
              onChange={() => void toggleNotify()}
            />
            <span>
              {x(HM.health_notify_label)}
              <span className="sb-notify-hint">{x(HM.health_notify_hint)}</span>
            </span>
          </label>
        )}
        {miraLine && <MiraNote line={miraLine} />}
      </section>

      <p className="sb-note" style={{ marginTop: 18 }}>
        {x(HM.health_habits_note)}
      </p>
    </div>
  )
}
