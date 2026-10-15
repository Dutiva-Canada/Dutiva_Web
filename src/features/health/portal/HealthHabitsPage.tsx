import '@/features/invest/portal/strategies.css'
import './health.css'
import { useEffect, useState } from 'react'
import { Check, Loader2, Pencil, Sparkles, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { healthMessages as HM } from '@/i18n/messages/health'
import { useHealthData } from '@/features/health/data/HealthDataContext'
import {
  addHabit,
  deleteHabit,
  healthAiHabit,
  sendHealthReaction,
  setHabitDone,
  updateHabit,
  type HabitSuggestion,
} from '@/features/health/data/api'
import { habitDoneDays, habitStreak, recentDayKeys, todayDayKey } from '@/features/health/data/healthStats'
import { loadNotifyPref, setNotifyPref } from '@/lib/notifications/notifyPrefs'
import { loadPendingSuggestions, resolveSuggestion } from '@/lib/agentQueue'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { fmtDay } from './healthUi'
import { HealthDataError } from './HealthDataError'
import { HealthLoading } from './HealthLoading'
import { MiraNote } from './MiraNote'
import { useHealthHead } from './useHealthHead'

/**
 * Habits — the user names small daily things and ticks them off. Deliberately
 * gentle: no scores, no targets, no streak-shaming. A missed day is just a
 * missed day; nothing here is a health metric.
 */
export function HealthHabitsPage() {
  const { x, lang } = useI18n()
  const { state, loading, refresh } = useHealthData()
  const { showToast } = useToasts()
  useHealthHead(HM.health_seo_title_habits, HM.health_seo_desc_habits)

  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  /* Per-row busy keys ("habitId" or "habitId:YYYY-MM-DD" for day dots) — a
     write in flight on one habit never deadens the other rows' buttons. */
  const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(new Set())
  const [armDelete, setArmDelete] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [notifyOn, setNotifyOn] = useState<boolean | null>(null)
  const [notifySaving, setNotifySaving] = useState(false)
  const [suggestions, setSuggestions] = useState<HabitSuggestion[]>([])
  const [suggestBusy, setSuggestBusy] = useState(false)
  const [acceptBusy, setAcceptBusy] = useState<string | null>(null)
  const [miraLine, setMiraLine] = useState<string | null>(null)

  const setBusy = (key: string, on: boolean) =>
    setBusyIds((cur) => {
      const next = new Set(cur)
      if (on) next.add(key)
      else next.delete(key)
      return next
    })

  /* Evening streak nudge — one email a day at most, only while a live
     streak is unchecked. Absent pref row defaults to on. */
  useEffect(() => {
    let cancelled = false
    /* A failed pref load leaves notifyOn null — the row hides rather than
       display an optimistic "on" that was never persisted. */
    loadNotifyPref('health')
      .then((v) => { if (!cancelled) setNotifyOn(v) })
      .catch(() => {})
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
  const month = recentDayKeys(30)
  const nameTaken = (n: string) =>
    habits.some((h) => h.name.trim().toLowerCase() === n.trim().toLowerCase())

  const submit = async () => {
    const trimmed = name.trim()
    if (!trimmed || saving) return
    if (nameTaken(trimmed)) {
      showToast(HM.health_habit_exists)
      return
    }
    setSaving(true)
    try {
      await addHabit(trimmed)
      setName('')
      showToast(HM.health_habit_added)
      await refresh()
      /* Best-effort: Mira notes the new habit — same as she does a done-day. */
      void sendHealthReaction({ type: 'habit_added', habit: trimmed }, lang, setMiraLine)
        .catch(() => {})
    } catch {
      showToast(HM.health_save_failed)
    } finally {
      setSaving(false)
    }
  }

  /* Pending habit rows from the review queue — same rows /health/review
     lists. Reloaded when pendingReview changes so resolving a row there
     (or here) clears the ghost on this page too. */
  const pendingReview = state?.pendingReview
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
  }, [pendingReview])

  /* Habit suggestion — the model sees habit names + streak aggregates only
     and answers "name | reason". Nothing is added until the user taps
     "Add it"; dismissing resolves the queue row. */
  const suggestHabit = async () => {
    if (suggestBusy) return
    setSuggestBusy(true)
    try {
      const out = await healthAiHabit(lang)
      const lower = out.name.trim().toLowerCase()
      if (lower === '' || nameTaken(out.name)) {
        /* Already tracked — surface it instead of showing a dead row. */
        showToast(HM.health_ai_habit_dupe)
      } else if (
        suggestions.some(
          (c) =>
            (c.suggestionId && c.suggestionId === out.suggestionId) ||
            c.name.trim().toLowerCase() === lower,
        )
      ) {
        showToast(HM.health_ai_habit_same)
      } else {
        setSuggestions((cur) => [...cur, out])
      }
    } catch {
      showToast(HM.health_ai_habit_failed)
    } finally {
      setSuggestBusy(false)
    }
  }

  const acceptSuggestion = async (s: HabitSuggestion) => {
    const key = s.suggestionId ?? s.name
    if (acceptBusy === key) return
    setAcceptBusy(key)
    try {
      const dupe = nameTaken(s.name)
      if (!dupe) await addHabit(s.name)
      if (s.suggestionId) {
        /* 'already_tracked' keeps the resolve honest when the row named a
           habit that already exists — resolve can fail harmlessly (the
           action stays idempotent so a retry can't double-add). */
        await resolveSuggestion(s.suggestionId, 'accepted', dupe ? 'already_tracked' : 'added')
          .catch(() => {})
      }
      setSuggestions((cur) => cur.filter((c) => c !== s))
      showToast(dupe ? HM.health_habit_exists : HM.health_habit_added)
      await refresh()
      if (!dupe) {
        void sendHealthReaction({ type: 'habit_added', habit: s.name }, lang, setMiraLine)
          .catch(() => {})
      }
    } catch {
      showToast(HM.health_save_failed)
    } finally {
      setAcceptBusy(null)
    }
  }

  const dismissSuggestion = async (s: HabitSuggestion) => {
    if (s.suggestionId) {
      await resolveSuggestion(s.suggestionId, 'dismissed', 'dismissed').catch(() => {})
    }
    setSuggestions((cur) => cur.filter((c) => c !== s))
  }

  /* Marks a day done or clears it — today via the row button, any of the
     last seven via the dot. Backfilling yesterday is the honest "did it,
     forgot to tick" path. */
  const toggle = async (habitId: string, day: string, done: boolean) => {
    const key = `${habitId}:${day}`
    if (busyIds.has(key)) return
    setBusy(key, true)
    try {
      await setHabitDone(habitId, day, done)
      await refresh()
      /* She reacts to the kept promise, not the unchecking — and only to
         today's mark; silent backfill shouldn't summon a reply. */
      if (done && day === today) {
        const name = habits.find((h) => h.id === habitId)?.name ?? ''
        /* Throttled reactions resolve reply:null — leave any earlier line up. */
        void sendHealthReaction({ type: 'habit_marked', habit: name }, lang, setMiraLine)
          .then((r) => {
            if (r.reply !== null) setMiraLine(r.reply)
          })
          .catch(() => {})
      }
    } catch {
      showToast(HM.health_save_failed)
    } finally {
      setBusy(key, false)
    }
  }

  const remove = async (id: string) => {
    if (armDelete !== id) {
      setArmDelete(id)
      return
    }
    setArmDelete(null)
    try {
      await deleteHabit(id)
      await refresh()
    } catch {
      showToast(HM.health_delete_failed)
    }
  }

  const saveRename = async (h: { id: string; name: string }) => {
    const trimmed = renameValue.trim()
    if (!trimmed || trimmed === h.name) {
      setRenamingId(null)
      return
    }
    if (nameTaken(trimmed)) {
      /* Stay open — the draft survives so the person can adjust instead
         of retyping; closing first silently dropped it. */
      showToast(HM.health_habit_exists)
      return
    }
    try {
      await updateHabit(h.id, trimmed)
      setRenamingId(null)
      showToast(HM.health_habit_renamed)
      await refresh()
    } catch {
      /* Same — a failed save keeps the draft, not a silent revert. */
      showToast(HM.health_save_failed)
    }
  }

  if (loading) return <HealthLoading />
  if (!state) return <HealthDataError />

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
        {suggestions.length > 0 && (
          <p className="sb-notify-hint" style={{ margin: '12px 0 0' }}>
            {x(HM.health_ai_note)}
          </p>
        )}
        {suggestions.length > 0 && (
        <div role="list">
        {suggestions.map((s) => (
          <div
            key={s.suggestionId ?? s.name}
            role="listitem"
            className="sb-notify-row"
            style={{ marginTop: 12, alignItems: 'flex-start', cursor: 'default' }}
          >
            <span style={{ flex: 1, minWidth: 0 }}>
              <strong>{s.name}</strong>
              {s.why && (
                <span className="sb-notify-hint">{s.why}</span>
              )}
              {s.suggestionId === null ? (
                <span className="sb-notify-hint">{x(HM.health_ai_not_filed)}</span>
              ) : null}
            </span>
            <span className="flex gap-[8px]" style={{ flexShrink: 0 }}>
              <button
                type="button"
                className="sb-btn sb-btn-secondary sb-btn-sm"
                disabled={acceptBusy === (s.suggestionId ?? s.name)}
                aria-label={`${x(HM.health_ai_habit_add)} — ${s.name}`}
                onClick={() => void acceptSuggestion(s)}
              >
                {acceptBusy === (s.suggestionId ?? s.name) ? (
                  <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                ) : null}
                {x(HM.health_ai_habit_add)}
              </button>
              <button
                type="button"
                className="sb-btn sb-btn-secondary sb-btn-sm"
                aria-label={`${x(HM.health_ai_habit_dismiss)} — ${s.name}`}
                onClick={() => void dismissSuggestion(s)}
              >
                {x(HM.health_ai_habit_dismiss)}
              </button>
            </span>
          </div>
        ))}
        </div>
        )}
      </section>

      <section className="sb-card sb-card-pad" style={{ marginTop: 18 }}>
        {habits.length === 0 ? (
          <div className="sb-empty">{x(HM.health_habits_empty)}</div>
        ) : (
          <div className="hb-rows" role="list">
            {habits.map((h) => {
              const doneDays = habitDoneDays(logs, h.id)
              const streak = habitStreak(logs, h.id)
              const doneToday = doneDays.has(today)
              const weekDone = week.filter((d) => doneDays.has(d)).length
              /* The dots show a week; this quiet count is the longer view —
                 "12 of the last 30 days" without a month of UI. */
              const monthDone = month.filter((d) => doneDays.has(d)).length
              return (
                <div key={h.id} className="hb-row" role="listitem">
                  <div className="hb-row-main">
                    {renamingId === h.id ? (
                      <span className="flex items-center gap-[8px]">
                        <input
                          className="sb-input"
                          style={{ maxWidth: 260 }}
                          value={renameValue}
                          autoFocus
                          maxLength={120}
                          aria-label={x(HM.health_habit_rename)}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void saveRename(h)
                            if (e.key === 'Escape') setRenamingId(null)
                          }}
                        />
                        <button
                          type="button"
                          className="sb-btn sb-btn-sm sb-btn-primary"
                          disabled={!renameValue.trim()}
                          onClick={() => void saveRename(h)}
                        >
                          {x(HM.health_checkin_save)}
                        </button>
                        <button
                          type="button"
                          className="sb-btn sb-btn-sm sb-btn-secondary"
                          onClick={() => setRenamingId(null)}
                        >
                          {x(HM.health_cancel)}
                        </button>
                      </span>
                    ) : (
                      <span className="hb-row-title">{h.name}</span>
                    )}
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
                      {streak > 0 && !doneToday && (
                        <span className="hb-row-meta">{x(HM.health_ov_streak_pending)}</span>
                      )}
                      {/* Tappable backfill — each dot toggles its day, so a
                          forgotten tick yesterday stays fixable. */}
                      <span
                        className="flex items-center gap-[4px]"
                        role="group"
                        aria-label={x(HM.health_habit_week_summary).replace(
                          '{done}',
                          String(weekDone),
                        )}
                      >
                        {week.map((d) => {
                          const done = doneDays.has(d)
                          const dayLabel = fmtDay(d, lang)
                          return (
                            <button
                              key={d}
                              type="button"
                              title={dayLabel}
                              className={`hb-dot${done ? ' is-on' : ''}${d === today ? ' is-today' : ''}`}
                              aria-label={x(
                                done ? HM.health_habit_dot_done : HM.health_habit_dot_open,
                              ).replace('{day}', dayLabel)}
                              aria-pressed={done}
                              disabled={busyIds.has(`${h.id}:${d}`)}
                              onClick={() => void toggle(h.id, d, !done)}
                            >
                              <span className="sr-only">{dayLabel}</span>
                            </button>
                          )
                        })}
                      </span>
                    </div>
                    <span className="hb-row-meta">
                      {x(HM.health_habit_month_summary).replace('{done}', String(monthDone))}
                    </span>
                  </div>
                  <div className="hb-row-side hb-row-actions">
                    <button
                      type="button"
                      className={`sb-btn sb-btn-sm ${doneToday ? 'sb-btn-primary' : 'sb-btn-secondary'}`}
                      disabled={busyIds.has(`${h.id}:${today}`)}
                      aria-label={`${x(doneToday ? HM.health_habit_done : HM.health_habit_mark)} — ${h.name}`}
                      aria-pressed={doneToday}
                      onClick={() => void toggle(h.id, today, !doneToday)}
                    >
                      {doneToday && <Check size={13} aria-hidden="true" />}
                      {doneToday ? x(HM.health_habit_done) : x(HM.health_habit_mark)}
                    </button>
                    <button
                      type="button"
                      className="sb-btn sb-btn-sm sb-btn-secondary"
                      aria-label={`${x(HM.health_habit_rename)} — ${h.name}`}
                      onClick={() => {
                        setRenamingId(h.id)
                        setRenameValue(h.name)
                      }}
                    >
                      <Pencil size={13} aria-hidden="true" />
                      {x(HM.health_habit_rename)}
                    </button>
                    <button
                      type="button"
                      className={`sb-btn sb-btn-sm ${armDelete === h.id ? 'sb-btn-danger sb-armed' : 'sb-btn-secondary'}`}
                      aria-label={`${x(HM.health_habit_delete)} — ${h.name}`}
                      onClick={() => void remove(h.id)}
                      onBlur={() => setArmDelete(null)}
                    >
                      <Trash2 size={13} aria-hidden="true" />
                      {armDelete === h.id
                        ? x(HM.health_habit_delete_named).replace('{name}', h.name)
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
        {miraLine && <MiraNote line={miraLine} onDismiss={() => setMiraLine(null)} />}
      </section>

      <p className="sb-note" style={{ marginTop: 18 }}>
        {x(HM.health_habits_note)}
      </p>
    </div>
  )
}
