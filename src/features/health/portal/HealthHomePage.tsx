import '@/features/invest/portal/strategies.css'
import './health.css'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Check,
  HeartPulse,
  Inbox,
  ListChecks,
  Loader2,
  Pencil,
  Sparkles,
} from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { Bi } from '@/i18n/core'
import { healthMessages as HM } from '@/i18n/messages/health'
import { fill } from '@/lib/format'
import { useHealthData } from '@/features/health/data/HealthDataContext'
import {
  addCheckIn,
  addHealthMemory,
  deleteHealthMemory,
  sendHealthReaction,
  setHabitDone,
  updateHealthMemory,
} from '@/features/health/data/api'
import { useToasts } from '@/features/app/toasts/toastsContext'
import {
  avgMood,
  checkInStreak,
  dailyMoods,
  habitDoneDays,
  habitsDoneToday,
  hasCheckInToday,
  todayDayKey,
} from '@/features/health/data/healthStats'
import {
  ENERGY_LABELS,
  fmtRelativeDateTime,
  fmtToday,
  miraNoticed,
  MOOD_LABELS,
  moodLabel,
} from './healthUi'
import { HealthDataError } from './HealthDataError'
import { HealthLoading } from './HealthLoading'
import { HealthScalePicker } from './HealthScalePicker'
import { MiraNote } from './MiraNote'
import { useHealthHead } from './useHealthHead'

/* The remembered layer, user-managed: write it, she keeps it; edit or
   remove it, she follows. Mira's own proposals arrive through the review
   queue and show their provenance — nothing lands here without a human
   hand. Same 3-char floor as the server-side propose_memory parse. */
const MEM_MIN = 3

const headerLinkStyle = { color: 'var(--sb-accent-ink)' } as const

function MemoriesCard() {
  const { x, lang } = useI18n()
  const { state, refresh } = useHealthData()
  const { showToast } = useToasts()
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [armDelete, setArmDelete] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const newMemRef = useRef<HTMLInputElement>(null)
  const memories = state?.memories ?? []

  const add = async () => {
    const t = text.trim()
    if (t.length < MEM_MIN || saving) return
    setSaving(true)
    try {
      await addHealthMemory(t)
      setText('')
      await refresh()
      showToast(HM.health_mem_added)
    } catch {
      showToast(HM.health_mem_save_failed)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (armDelete !== id) {
      setArmDelete(id)
      return
    }
    setArmDelete(null)
    try {
      await deleteHealthMemory(id)
      await refresh()
      showToast(HM.health_mem_removed)
      /* The focused row just unmounted — land keyboard users back on the
         new-memory field instead of dropping them to <body>. */
      newMemRef.current?.focus()
    } catch {
      showToast(HM.health_mem_delete_failed)
    }
  }

  const startEdit = (id: string, current: string) => {
    setEditingId(id)
    setEditText(current)
  }

  const saveEdit = async () => {
    const t = editText.trim()
    if (!editingId || t.length < MEM_MIN || editSaving) return
    /* Unchanged text closes the editor without a write. */
    const orig = memories.find((m) => m.id === editingId)
    if (orig && t === orig.text.trim()) {
      setEditingId(null)
      return
    }
    setEditSaving(true)
    try {
      await updateHealthMemory(editingId, t)
      setEditingId(null)
      await refresh()
      showToast(HM.health_mem_updated)
    } catch {
      showToast(HM.health_mem_save_failed)
    } finally {
      setEditSaving(false)
    }
  }

  return (
    <section className="sb-card sb-card-pad" style={{ marginTop: 16 }}>
      <div className="sb-section-head" style={{ marginTop: 0 }}>
        <h2 className="m-0 text-[16px]">{x(HM.health_mem_title)}</h2>
      </div>
      <p className="sb-body-text" style={{ marginTop: 0 }}>{x(HM.health_mem_sub)}</p>
      <p className="hb-row-meta" style={{ marginTop: -2 }}>{x(HM.health_mem_scope)}</p>
      <div className="sb-field" style={{ marginBottom: 10 }}>
        <label className="sb-flabel" htmlFor="hb-mem-new" style={{ fontSize: 13.5 }}>
          {x(HM.health_mem_label)}
        </label>
        <input
          id="hb-mem-new"
          ref={newMemRef}
          type="text"
          className="sb-input"
          value={text}
          disabled={saving}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) void add()
          }}
          placeholder={x(HM.health_mem_ph)}
          maxLength={500}
        />
        {text.length >= 450 && (
          <span className="hb-row-meta" style={{ display: 'block', textAlign: 'right' }}>
            {500 - text.length}
          </span>
        )}
      </div>
      <div>
        <button
          type="button"
          className="sb-btn sb-btn-secondary"
          disabled={text.trim().length < MEM_MIN || saving}
          onClick={() => void add()}
        >
          {saving && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
          {x(HM.health_mem_add)}
        </button>
      </div>
      {memories.length === 0 ? (
        <div className="sb-empty">{x(HM.health_mem_empty)}</div>
      ) : (
        <div className="hb-rows" role="list">
          {memories.map((m) => {
            /* Named controls carry a short snippet — "Edit / Remove" on
               every row tells a screen-reader nothing about which memory. */
            const snippet = m.text.length > 40 ? `${m.text.slice(0, 40)}…` : m.text
            return (
            <div key={m.id} className="hb-row" role="listitem">
              {editingId === m.id ? (
                <div className="hb-row-main">
                  <input
                    type="text"
                    className="sb-input"
                    value={editText}
                    disabled={editSaving}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing) void saveEdit()
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    maxLength={500}
                    aria-label={x(HM.health_mem_edit_label)}
                    autoFocus
                  />
                  <span className="sb-row-actions" style={{ marginTop: 8 }}>
                    <button
                      type="button"
                      className="sb-btn sb-btn-sm"
                      disabled={editText.trim().length < MEM_MIN || editSaving}
                      onClick={() => void saveEdit()}
                    >
                      {x(HM.health_checkin_save)}
                    </button>
                    <button
                      type="button"
                      className="sb-btn sb-btn-secondary sb-btn-sm"
                      onClick={() => setEditingId(null)}
                    >
                      {x(HM.health_checkin_cancel)}
                    </button>
                  </span>
                </div>
              ) : (
                <>
                  <div className="hb-row-main">
                    <p className="hb-row-body">{m.text}</p>
                    <span className="hb-row-meta">
                      {m.source === 'mira' ? `${x(HM.health_mem_from_mira)} · ` : ''}
                      {fmtRelativeDateTime(m.createdAt, lang)}
                    </span>
                  </div>
                  <div className="hb-row-side" style={{ flexDirection: 'row', gap: 6 }}>
                    <button
                      type="button"
                      className="sb-btn sb-btn-secondary sb-btn-sm"
                      style={{ minHeight: 32, padding: '4px 12px', fontSize: 12.5 }}
                      aria-label={x(HM.health_mem_edit_named).replace('{text}', snippet)}
                      onClick={() => startEdit(m.id, m.text)}
                    >
                      <Pencil size={12} aria-hidden="true" />
                      {x(HM.health_mem_edit)}
                    </button>
                    <button
                      type="button"
                      className={`sb-btn sb-btn-sm ${armDelete === m.id ? 'sb-btn-danger sb-armed' : 'sb-btn-secondary'}`}
                      style={{ minHeight: 32, padding: '4px 12px', fontSize: 12.5 }}
                      aria-label={x(
                        armDelete === m.id
                          ? HM.health_mem_delete_named_confirm
                          : HM.health_mem_delete_named,
                      ).replace('{text}', snippet)}
                      onClick={() => void remove(m.id)}
                      onBlur={() => setArmDelete(null)}
                    >
                      {armDelete === m.id
                        ? x(HM.health_mem_delete_confirm)
                        : x(HM.health_mem_delete)}
                    </button>
                  </div>
                </>
              )}
            </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

/* Two-tap check-in on the home page — mood + energy, no note. Hidden once
   today is logged; the full form (with the note field) stays one tap away
   on /health/check-in. */
function QuickCheckIn() {
  const { x, lang } = useI18n()
  const { refresh } = useHealthData()
  const { showToast } = useToasts()
  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [miraLine, setMiraLine] = useState<string | null>(null)

  const submit = async () => {
    if (mood == null || saving) return
    setSaving(true)
    try {
      const saved = { mood, energy }
      await addCheckIn(saved)
      await refresh()
      setMood(null)
      setEnergy(null)
      showToast(HM.health_checkin_saved)
      /* Same best-effort reaction path as the check-in page — a skipped or
         failed reaction never disturbs the save. */
      void sendHealthReaction({ type: 'checkin_saved', ...saved }, lang, setMiraLine)
        .then((r) => {
          if (r.reply !== null) setMiraLine(r.reply)
        })
        .catch(() => {})
    } catch {
      showToast(HM.health_checkin_failed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="sb-card sb-card-pad" style={{ marginTop: 16 }}>
      <div className="sb-section-head" style={{ marginTop: 0 }}>
        <h2 className="m-0 text-[16px]">{x(HM.health_ov_quick_title)}</h2>
        <Link
          to="/health/check-in"
          className="inline-flex items-center gap-[4px] text-[12.5px] font-semibold no-underline"
          style={headerLinkStyle}
        >
          {x(HM.health_ov_quick_full)}
        </Link>
      </div>
      <div className="flex flex-col gap-[14px]">
        <HealthScalePicker
          idPrefix="hb-quick-mood"
          legend={x(HM.health_checkin_mood)}
          labels={MOOD_LABELS}
          value={mood}
          onPick={setMood}
          disabled={saving}
        />
        <HealthScalePicker
          idPrefix="hb-quick-energy"
          legend={x(HM.health_checkin_energy)}
          labels={ENERGY_LABELS}
          value={energy}
          onPick={setEnergy}
          clearable
          disabled={saving}
        />
        <div className="sb-form-actions">
          <button
            type="button"
            className="sb-btn sb-btn-primary"
            disabled={mood == null || saving}
            onClick={() => void submit()}
          >
            {saving && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            {x(HM.health_checkin_submit)}
          </button>
        </div>
        {miraLine && <MiraNote line={miraLine} onDismiss={() => setMiraLine(null)} />}
      </div>
    </section>
  )
}

/* Today's habit ticks — the one daily action that used to require a trip
   to the Habits tab. Hidden when nothing is tracked yet; the stat card's
   "None set up" links there instead. */
function TodayHabits() {
  const { x, lang } = useI18n()
  const { state, refresh } = useHealthData()
  const { showToast } = useToasts()
  /* Per-habit busy — a save in flight on "Walk" must not deaden taps on
     "Read"; a single global lock silently ate the second tap. */
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set())
  const [miraLine, setMiraLine] = useState<string | null>(null)

  const habits = state?.habits ?? []
  const logs = state?.habitLogs ?? []
  const today = todayDayKey()
  if (habits.length === 0) return null

  const toggle = async (habitId: string, done: boolean) => {
    if (busyIds.has(habitId)) return
    setBusyIds((prev) => new Set(prev).add(habitId))
    try {
      await setHabitDone(habitId, today, done)
      await refresh()
      /* She reacts to the kept promise, not the unchecking — same pattern
         as the habits page. */
      if (done) {
        const name = habits.find((h) => h.id === habitId)?.name ?? ''
        void sendHealthReaction({ type: 'habit_marked', habit: name }, lang, setMiraLine)
          .then((r) => {
            if (r.reply !== null) setMiraLine(r.reply)
          })
          .catch(() => {})
      }
    } catch {
      showToast(HM.health_save_failed)
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev)
        next.delete(habitId)
        return next
      })
    }
  }

  return (
    <section className="sb-card sb-card-pad" style={{ marginTop: 16 }}>
      <div className="sb-section-head" style={{ marginTop: 0 }}>
        <h2 className="m-0 text-[16px]">{x(HM.health_ov_habits)}</h2>
        <Link
          to="/health/habits"
          className="inline-flex items-center gap-[4px] text-[12.5px] font-semibold no-underline"
          style={headerLinkStyle}
        >
          {x(HM.health_ov_view_all)}
        </Link>
      </div>
      <div className="hb-rows">
        {habits.map((h) => {
          const doneToday = habitDoneDays(logs, h.id).has(today)
          return (
            <div key={h.id} className="hb-row" style={{ alignItems: 'center' }}>
              <div className="hb-row-main">
                <span className="hb-row-title">{h.name}</span>
              </div>
              <div className="hb-row-side">
                <button
                  type="button"
                  className={`sb-btn sb-btn-sm ${doneToday ? 'sb-btn-primary' : 'sb-btn-secondary'}`}
                  style={{ minHeight: 34, padding: '5px 12px', fontSize: 12.5 }}
                  disabled={busyIds.has(h.id)}
                  aria-pressed={doneToday}
                  onClick={() => void toggle(h.id, !doneToday)}
                >
                  {doneToday && <Check size={13} aria-hidden="true" />}
                  {doneToday ? x(HM.health_habit_done) : x(HM.health_habit_mark)}
                </button>
              </div>
            </div>
          )
        })}
      </div>
      {miraLine && <MiraNote line={miraLine} onDismiss={() => setMiraLine(null)} />}
    </section>
  )
}

export function HealthHomePage() {
  const { x, lang } = useI18n()
  const { state, loading } = useHealthData()
  useHealthHead(HM.health_seo_title, HM.health_subtitle)

  if (loading) {
    return <HealthLoading />
  }
  /* First-load failure → retry card. A refresh failure while data is on
     screen surfaces as the layout's stale-data note — the page keeps
     working off the last good snapshot. */
  if (!state) {
    return <HealthDataError />
  }

  const mood7 = avgMood(state.checkIns, 7)
  const moodWeek = dailyMoods(state.checkIns, 7)
  const streak = checkInStreak(state.checkIns)
  const today = hasCheckInToday(state.checkIns)
  const streakPending = streak > 0 && !today
  const habitsToday = habitsDoneToday(state.habitLogs, state.habits)
  const latest = state.entries[0]
  const latestCheckIn = state.checkIns[0]
  const entryTotal = state.entriesTotal ?? state.entries.length
  const pending = state.pendingReview ?? 0
  const isEmpty = state.checkIns.length === 0 && state.entries.length === 0
  /* Mira's presence outside the chat tab — one noticed thing, built locally
     from the same state the stats read. No model call. */
  const noticed = miraNoticed(state, lang)

  /* Each card is a link to the surface that owns the number — the
     aria-label speaks the value so a bare '—' or '2/5' never has to carry
     meaning on its own. */
  const statAria = (label: Bi, value: string) => `${x(label)}: ${value}`

  const streakText =
    streak === 0
      ? x(HM.health_ov_streak_days).replace('{count}', '0')
      : streak === 1
        ? x(HM.health_ov_streak_day)
        : x(HM.health_ov_streak_days).replace('{count}', String(streak))

  const moodValue =
    mood7 == null ? x(HM.health_ov_none) : `${+mood7.toFixed(1)} · ${moodLabel(mood7, lang)}`
  const habitsValue =
    habitsToday.total === 0
      ? x(HM.health_ov_habits_none)
      : fill(x(HM.health_ov_habits_frac), { done: habitsToday.done, total: habitsToday.total })

  return (
    <div className="sb hb sb-page">
      <div className="sb-head-row">
        <h1>{x(HM.health_ov_title)}</h1>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/health/check-in" className="sb-btn sb-btn-primary">
            {x(HM.health_ov_new_checkin)}
          </Link>
          <Link to="/health/journal?new=1" className="sb-btn sb-btn-secondary">
            {x(HM.health_ov_new_entry)}
          </Link>
        </div>
      </div>
      <p className="sb-sub">{x(isEmpty ? HM.health_ov_sub_empty : HM.health_ov_sub)}</p>
      <p className="hb-row-meta" style={{ marginTop: 6 }}>
        {fmtToday(lang)}
        {!today && latestCheckIn
          ? ` · ${x(HM.health_ov_last_checkin).replace('{date}', fmtRelativeDateTime(latestCheckIn.createdAt, lang))}`
          : ''}
      </p>

      <div className="hb-crisis" role="note">
        <span className="hb-crisis-icon">
          <HeartPulse size={17} strokeWidth={1.9} aria-hidden="true" />
        </span>
        <div>
          <p className="hb-crisis-title">{x(HM.health_ov_crisis_title)}</p>
          <p className="hb-crisis-body">
            {x(HM.health_ov_crisis_body)}{' '}
            <Link to="/health/resources#crisis">{x(HM.health_ov_crisis_link)}</Link>
          </p>
        </div>
      </div>

      {noticed && (
        <div className="sb-note" style={{ marginTop: 14, alignItems: 'center' }}>
          <Sparkles size={15} aria-hidden="true" style={{ flexShrink: 0 }} />
          <span>
            <strong>{x(HM.health_home_mira_label)}</strong> — {noticed}{' '}
            <Link to="/health/chat" style={{ color: 'inherit', fontWeight: 600 }}>
              {x(HM.health_home_mira_open)}
            </Link>
          </span>
        </div>
      )}

      {pending > 0 && (
        <div className="sb-note" style={{ marginTop: 14, alignItems: 'center' }}>
          <Inbox size={15} aria-hidden="true" style={{ flexShrink: 0 }} />
          <span>
            {x(pending === 1 ? HM.health_ov_review_one : HM.health_ov_review_many).replace(
              '{count}',
              String(pending),
            )}{' '}
            —{' '}
            <Link to="/health/review" style={{ color: 'inherit', fontWeight: 600 }}>
              {x(HM.health_ov_review_link)}
            </Link>
          </span>
        </div>
      )}

      <div className="sb-stats">
        <Link
          to="/health/check-in"
          className="sb-stat sb-stat-link"
          aria-label={statAria(
            HM.health_ov_today,
            today ? x(HM.health_ov_today_done) : x(HM.health_ov_today_none),
          )}
        >
          <div className="k">{x(HM.health_ov_today)}</div>
          <div className="v small">
            {today ? x(HM.health_ov_today_done) : x(HM.health_ov_today_none)}
          </div>
        </Link>
        <Link
          to="/health/insights"
          className="sb-stat sb-stat-link"
          aria-label={statAria(HM.health_ov_mood_7d, moodValue)}
        >
          <div className="k">{x(HM.health_ov_mood_7d)}</div>
          <div className="v">
            {mood7 == null ? '—' : `${+mood7.toFixed(1)} · ${moodLabel(mood7, lang)}`}
          </div>
          <div className="hb-spark" aria-hidden="true">
            {moodWeek.map((d) => (
              <span
                key={d.day}
                className={`hb-spark-bar${d.mood == null ? ' is-empty' : ''}`}
                style={{ height: d.mood == null ? '3px' : `${18 + ((d.mood - 1) / 4) * 82}%` }}
              />
            ))}
          </div>
        </Link>
        <Link
          to="/health/check-in"
          className="sb-stat sb-stat-link"
          aria-label={statAria(
            HM.health_ov_streak,
            streakPending ? `${streakText} — ${x(HM.health_ov_streak_pending)}` : streakText,
          )}
        >
          <div className="k">{x(HM.health_ov_streak)}</div>
          <div className="v">{streakText}</div>
          {streakPending && (
            <div className="hb-row-meta" style={{ marginTop: 2 }}>
              {x(HM.health_ov_streak_pending)}
            </div>
          )}
        </Link>
        <Link
          to="/health/journal"
          className="sb-stat sb-stat-link"
          aria-label={statAria(HM.health_ov_entries, String(entryTotal))}
        >
          <div className="k">{x(HM.health_ov_entries)}</div>
          <div className="v">{entryTotal}</div>
        </Link>
        <Link
          to="/health/habits"
          className="sb-stat sb-stat-link"
          aria-label={statAria(HM.health_ov_habits, habitsValue)}
        >
          <div className="k">{x(HM.health_ov_habits)}</div>
          <div className={`v${habitsToday.total === 0 ? ' small' : ''}`}>
            {habitsToday.total === 0 ? habitsValue : `${habitsToday.done}/${habitsToday.total}`}
          </div>
        </Link>
      </div>

      {state.checkIns.length > 0 && (
        <p style={{ margin: '10px 2px 0', textAlign: 'right' }}>
          <Link
            to="/health/insights?recap=1"
            className="inline-flex items-center gap-[4px] text-[12.5px] font-semibold no-underline"
            style={headerLinkStyle}
          >
            <Sparkles size={13} aria-hidden="true" />
            {x(HM.health_ai_recap_btn)}
          </Link>
        </p>
      )}

      {!today && <QuickCheckIn />}

      <div className="sb-duo">
        <section className="sb-card sb-card-pad">
          <div className="sb-section-head" style={{ marginTop: 0 }}>
            <h2 className="m-0 text-[16px]">{x(HM.health_ov_recent)}</h2>
            <Link
              to="/health/check-in"
              className="inline-flex items-center gap-[4px] text-[12.5px] font-semibold no-underline"
              style={headerLinkStyle}
            >
              <ListChecks size={13} aria-hidden="true" />
              {x(HM.health_ov_view_all)}
            </Link>
          </div>
          {state.checkIns.length === 0 ? (
            <div className="sb-empty">
              <p style={{ margin: 0 }}>{x(HM.health_ov_empty)}</p>
              <Link
                to="/health/check-in"
                className="sb-btn sb-btn-secondary sb-btn-sm"
                style={{ marginTop: 12 }}
              >
                {x(HM.health_ov_empty_cta)}
              </Link>
            </div>
          ) : (
            <ul className="sb-mini-list">
              {state.checkIns.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <span className="hb-mood-dot" {...(c.mood <= 2 ? { 'data-low': true } : {})}>
                    {moodLabel(c.mood, lang)}
                  </span>
                  {c.note.trim() ? (
                    <span className="hb-row-meta" style={{ flex: 1, minWidth: 0 }}>
                      {c.note.trim()}
                    </span>
                  ) : null}
                  <span className="hb-row-meta">{fmtRelativeDateTime(c.createdAt, lang)}</span>
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
              style={headerLinkStyle}
            >
              <BookOpen size={13} aria-hidden="true" />
              {x(HM.health_ov_open_journal)}
            </Link>
          </div>
          {!latest ? (
            <div className="sb-empty">
              <p style={{ margin: 0 }}>{x(HM.health_journal_empty)}</p>
              <Link
                to="/health/journal?new=1"
                className="sb-btn sb-btn-secondary sb-btn-sm"
                style={{ marginTop: 12 }}
              >
                {x(HM.health_journal_empty_cta)}
              </Link>
            </div>
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
              <span className="hb-row-meta">{fmtRelativeDateTime(latest.createdAt, lang)}</span>
            </div>
          )}
        </section>
      </div>

      <TodayHabits />
      <MemoriesCard />
    </div>
  )
}
