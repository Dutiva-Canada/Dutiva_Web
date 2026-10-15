import '@/features/invest/portal/strategies.css'
import './health.css'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, HeartPulse, Loader2, Pencil, Sparkles } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { healthMessages as HM } from '@/i18n/messages/health'
import { useHealthData } from '@/features/health/data/HealthDataContext'
import {
  addHealthMemory,
  deleteHealthMemory,
  updateHealthMemory,
} from '@/features/health/data/api'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { avgMood, checkInStreak, habitsDoneToday, hasCheckInToday } from '@/features/health/data/healthStats'
import { fmtDateTime, miraNoticed, moodLabel } from './healthUi'
import { useHealthHead } from './useHealthHead'

/* The remembered layer, user-managed: write it, she keeps it; edit or
   remove it, she follows. Mira's own proposals arrive through the review
   queue and show their provenance — nothing lands here without a human
   hand. Same 3-char floor as the server-side propose_memory parse. */
const MEM_MIN = 3

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
    <section className="sb-card sb-card-pad" style={{ marginTop: 18 }}>
      <div className="sb-section-head" style={{ marginTop: 0 }}>
        <h2 className="m-0 text-[16px]">{x(HM.health_mem_title)}</h2>
      </div>
      <p className="sb-body-text" style={{ marginTop: 0 }}>{x(HM.health_mem_sub)}</p>
      <div className="sb-field" style={{ marginBottom: 10 }}>
        <label className="sb-flabel" htmlFor="hb-mem-new" style={{ fontSize: 13.5 }}>
          {x(HM.health_mem_label)}
        </label>
        <input
          id="hb-mem-new"
          type="text"
          className="sb-input"
          value={text}
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
        <div className="hb-rows">
          {memories.map((m) => (
            <div key={m.id} className="hb-row">
              {editingId === m.id ? (
                <div className="hb-row-main">
                  <input
                    type="text"
                    className="sb-input"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing) void saveEdit()
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    maxLength={500}
                    aria-label={x(HM.health_mem_edit)}
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
                      {fmtDateTime(m.createdAt, lang)}
                    </span>
                  </div>
                  <div className="hb-row-side" style={{ flexDirection: 'row', gap: 6 }}>
                    <button
                      type="button"
                      className="sb-btn sb-btn-secondary sb-btn-sm"
                      style={{ minHeight: 32, padding: '4px 12px', fontSize: 12.5 }}
                      onClick={() => startEdit(m.id, m.text)}
                    >
                      <Pencil size={12} aria-hidden="true" />
                      {x(HM.health_mem_edit)}
                    </button>
                    <button
                      type="button"
                      className={`sb-btn sb-btn-sm ${armDelete === m.id ? 'sb-btn-danger sb-armed' : 'sb-btn-secondary'}`}
                      style={{ minHeight: 32, padding: '4px 12px', fontSize: 12.5 }}
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
          ))}
        </div>
      )}
    </section>
  )
}

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
  /* Mira's presence outside the chat tab — one noticed thing, built locally
     from the same state the stats read. No model call. */
  const noticed = miraNoticed(state, lang)

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

      {/* Each stat routes to the surface that owns the number — '—' is the
          shared no-data marker across the strip. */}
      <div className="sb-stats">
        <Link to="/health/check-in" className="sb-stat sb-stat-link">
          <div className="k">{x(HM.health_ov_today)}</div>
          <div className="v small">{today ? x(HM.health_ov_today_done) : x(HM.health_ov_today_none)}</div>
        </Link>
        <Link to="/health/insights" className="sb-stat sb-stat-link">
          <div className="k">{x(HM.health_ov_mood_7d)}</div>
          <div className="v">{mood7 == null ? '—' : `${mood7.toFixed(1)} · ${moodLabel(mood7, lang)}`}</div>
        </Link>
        <Link to="/health/check-in" className="sb-stat sb-stat-link">
          <div className="k">{x(HM.health_ov_streak)}</div>
          <div className="v">
            {streak === 0
              ? '—'
              : streak === 1
                ? x(HM.health_ov_streak_day)
                : x(HM.health_ov_streak_days).replace('{count}', String(streak))}
          </div>
        </Link>
        <Link to="/health/journal" className="sb-stat sb-stat-link">
          <div className="k">{x(HM.health_ov_entries)}</div>
          <div className="v">{state.entries.length === 0 ? '—' : state.entries.length}</div>
        </Link>
        <Link to="/health/habits" className="sb-stat sb-stat-link">
          <div className="k">{x(HM.health_ov_habits)}</div>
          <div className="v">
            {habitsToday.total === 0 ? '—' : `${habitsToday.done}/${habitsToday.total}`}
          </div>
        </Link>
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
                  {c.note.trim() ? (
                    <span className="hb-row-meta" style={{ flex: 1, minWidth: 0 }}>
                      {c.note.trim()}
                    </span>
                  ) : null}
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
              {x(HM.health_ov_open_journal)}
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

      <MemoriesCard />
    </div>
  )
}
