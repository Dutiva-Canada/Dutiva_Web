import '@/features/invest/portal/strategies.css'
import './health.css'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { healthMessages as HM } from '@/i18n/messages/health'
import { useHealthData } from '@/features/health/data/HealthDataContext'
import { addCheckIn, deleteCheckIn, sendHealthReaction, updateCheckIn } from '@/features/health/data/api'
import { hasCheckInToday } from '@/features/health/data/healthStats'
import { useToasts } from '@/features/app/toasts/toastsContext'
import type { HealthCheckIn } from '@/features/health/data/types'
import { ENERGY_LABELS, energyLabel, fmtRelativeDateTime, MOOD_LABELS, moodLabel } from './healthUi'
import { HealthDataError } from './HealthDataError'
import { HealthLoading } from './HealthLoading'
import { HealthScalePicker } from './HealthScalePicker'
import { MiraNote } from './MiraNote'
import { useHealthHead } from './useHealthHead'

/* History renders the newest rows first; beyond this cap the rest unfold
   on demand so a mature account doesn't mount hundreds of rows at once. */
const CHECKIN_RENDER_CAP = 30

/* Inline editor for a saved check-in — the same pickers the entry form
   uses, prefilled with the row's values. Saving refreshes and tells Mira
   (checkin_edited) the record changed — she reacts to the revision, not
   the original. */
function CheckInEditor({
  entry,
  onDone,
  onSaved,
}: {
  entry: HealthCheckIn
  onDone: () => void
  onSaved: (mood: number, energy: number | null, note: string) => void
}) {
  const { x } = useI18n()
  const { showToast } = useToasts()
  const [mood, setMood] = useState<number | null>(entry.mood)
  const [energy, setEnergy] = useState<number | null>(entry.energy)
  const [note, setNote] = useState(entry.note)
  const [saving, setSaving] = useState(false)
  const [armCancel, setArmCancel] = useState(false)

  const dirty =
    mood !== entry.mood || energy !== entry.energy || note !== entry.note

  const save = async () => {
    if (mood == null || saving) return
    /* A save that changes nothing gets no write — and no false "Updated"
       toast or Mira reaction for a row that didn't move. */
    if (!dirty) {
      onDone()
      return
    }
    setSaving(true)
    try {
      await updateCheckIn(entry.id, { mood, energy, note })
      onSaved(mood, energy, note)
    } catch {
      showToast(HM.health_save_failed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-[14px]" style={{ width: '100%' }}>
      <HealthScalePicker
        idPrefix={`hb-edit-mood-${entry.id}`}
        legend={x(HM.health_checkin_mood)}
        labels={MOOD_LABELS}
        value={mood}
        onPick={setMood}
      />
      <HealthScalePicker
        idPrefix={`hb-edit-energy-${entry.id}`}
        legend={x(HM.health_checkin_energy)}
        labels={ENERGY_LABELS}
        value={energy}
        onPick={setEnergy}
        clearable
      />
      <div className="sb-field">
        <label className="sb-flabel" htmlFor={`hb-edit-note-${entry.id}`}>
          {x(HM.health_checkin_note)}
        </label>
        <textarea
          id={`hb-edit-note-${entry.id}`}
          className="hb-textarea"
          style={{ minHeight: 60 }}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={x(HM.health_checkin_note_ph)}
          maxLength={2000}
        />
      </div>
      <div className="sb-form-actions">
        <button
          type="button"
          className="sb-btn sb-btn-primary"
          disabled={mood == null || saving}
          onClick={() => void save()}
        >
          {saving && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
          {x(HM.health_checkin_save)}
        </button>
        <button
          type="button"
          className={`sb-btn ${armCancel ? 'sb-btn-danger sb-armed' : 'sb-btn-secondary'}`}
          disabled={saving}
          /* A cancel that would silently drop edits arms once first —
             same guard the journal editor carries. */
          onClick={() => {
            if (dirty && !armCancel) {
              setArmCancel(true)
              return
            }
            onDone()
          }}
          onBlur={() => setArmCancel(false)}
        >
          {armCancel ? x(HM.health_journal_cancel_confirm) : x(HM.health_checkin_cancel)}
        </button>
      </div>
    </div>
  )
}

export function HealthCheckInPage() {
  const { x, lang } = useI18n()
  const { state, loading, refresh } = useHealthData()
  const { showToast } = useToasts()
  useHealthHead(HM.health_checkin_title, HM.health_checkin_sub)

  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [armDelete, setArmDelete] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [miraLine, setMiraLine] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const submit = async () => {
    if (mood == null || saving) return
    setSaving(true)
    try {
      const saved = { mood, energy, note }
      await addCheckIn(saved)
      setMood(null)
      setEnergy(null)
      setNote('')
      showToast(HM.health_checkin_saved)
      /* refresh() never rejects (the provider swallows load errors into the
         stale-data note) — order doesn't carry failure risk. */
      await refresh()
      /* Best-effort: Mira reacts to what was just saved — her line shows
         here and lands in the chat thread too. A failed reaction never
         disturbs the save. */
      /* Throttled reactions resolve reply:null — leave any earlier line up. */
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

  const remove = async (id: string) => {
    if (armDelete !== id) {
      setArmDelete(id)
      return
    }
    setArmDelete(null)
    try {
      await deleteCheckIn(id)
      await refresh()
    } catch {
      showToast(HM.health_delete_failed)
    }
  }

  if (loading) return <HealthLoading />
  if (!state) return <HealthDataError />
  const checkIns = state.checkIns
  const loggedToday = hasCheckInToday(checkIns)
  const visibleCheckIns = showAll ? checkIns : checkIns.slice(0, CHECKIN_RENDER_CAP)

  return (
    <div className="sb hb sb-page">
      <div className="sb-head-row">
        <h1>{x(HM.health_checkin_title)}</h1>
      </div>
      <p className="sb-sub">{x(HM.health_checkin_sub)}</p>

      <section className="sb-card sb-card-pad" style={{ marginTop: 18 }}>
        <div className="flex flex-col gap-[18px]">
          <HealthScalePicker
            idPrefix="hb-mood"
            legend={x(HM.health_checkin_mood)}
            labels={MOOD_LABELS}
            value={mood}
            onPick={setMood}
          />
          <HealthScalePicker
            idPrefix="hb-energy"
            legend={x(HM.health_checkin_energy)}
            labels={ENERGY_LABELS}
            value={energy}
            onPick={setEnergy}
            clearable
          />
          <div className="sb-field">
            <label className="sb-flabel" htmlFor="hb-checkin-note">
              {x(HM.health_checkin_note)}
            </label>
            <textarea
              id="hb-checkin-note"
              className="hb-textarea"
              style={{ minHeight: 72 }}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={x(HM.health_checkin_note_ph)}
              maxLength={2000}
            />
            {note.length > 1800 && (
              <p className="sb-helper" style={{ marginTop: 4 }}>
                {note.length}/2000
              </p>
            )}
          </div>
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
            {mood == null && (
              <p className="sb-helper" style={{ margin: 0 }}>
                {x(HM.health_checkin_need_mood)}
              </p>
            )}
          </div>
          {loggedToday && (
            <p className="sb-helper" style={{ margin: 0 }}>
              {x(HM.health_checkin_logged_today)}{' '}
              <a href="#hb-history">{x(HM.health_checkin_history)}</a>
            </p>
          )}
          {miraLine && <MiraNote line={miraLine} onDismiss={() => setMiraLine(null)} />}
        </div>
      </section>

      <div className="sb-section-head" id="hb-history" style={{ scrollMarginTop: 70 }}>
        <h2>{x(HM.health_checkin_history)}</h2>
      </div>
      <section className="sb-card sb-card-pad">
        {checkIns.length === 0 ? (
          <div className="sb-empty">{x(HM.health_checkin_empty)}</div>
        ) : (
          <div className="hb-rows" role="list">
            {visibleCheckIns.map((c) => {
              const when = fmtRelativeDateTime(c.createdAt, lang)
              return (
                <div key={c.id} className="hb-row" role="listitem">
                  {editingId === c.id ? (
                    <CheckInEditor
                      entry={c}
                      onDone={() => setEditingId(null)}
                      onSaved={(m, e, n) => {
                        setEditingId(null)
                        void refresh()
                        showToast(HM.health_checkin_updated)
                        /* Best-effort — same pattern as checkin_saved. */
                        void sendHealthReaction(
                          { type: 'checkin_edited', mood: m, energy: e, note: n },
                          lang,
                          setMiraLine,
                        )
                          .then((r) => {
                            if (r.reply !== null) setMiraLine(r.reply)
                          })
                          .catch(() => {})
                      }}
                    />
                  ) : (
                    <>
                      <div className="hb-row-main">
                        <div className="flex flex-wrap items-center gap-[10px]">
                          <span
                            className="hb-mood-dot"
                            {...(c.mood <= 2 ? { 'data-low': true } : {})}
                          >
                            {x(HM.health_checkin_mood_short)}: {moodLabel(c.mood, lang)}
                          </span>
                          {c.energy != null && (
                            <span className="hb-row-meta">
                              {x(HM.health_checkin_energy_short)}: {energyLabel(c.energy, lang)}
                            </span>
                          )}
                        </div>
                        {c.note && <p className="hb-row-body">{c.note}</p>}
                        <span className="hb-row-meta">{when}</span>
                      </div>
                      <div className="hb-row-side hb-row-actions">
                        <button
                          type="button"
                          className="sb-btn sb-btn-sm sb-btn-secondary"
                          aria-label={x(HM.health_checkin_edit_named).replace('{when}', when)}
                          onClick={() => setEditingId(c.id)}
                        >
                          {x(HM.health_checkin_edit)}
                        </button>
                        <button
                          type="button"
                          className={`sb-btn sb-btn-sm ${armDelete === c.id ? 'sb-btn-danger sb-armed' : 'sb-btn-secondary'}`}
                          aria-label={x(HM.health_checkin_delete_named).replace('{when}', when)}
                          onClick={() => void remove(c.id)}
                          onBlur={() => setArmDelete(null)}
                        >
                          {armDelete === c.id
                            ? x(HM.health_checkin_delete_confirm)
                            : x(HM.health_checkin_delete)}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {checkIns.length > visibleCheckIns.length && (
          <div className="hb-pager">
            <button
              type="button"
              className="sb-btn sb-btn-sm sb-btn-secondary"
              onClick={() => setShowAll(true)}
            >
              {x(HM.health_checkin_show_all).replace('{count}', String(checkIns.length))}
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
