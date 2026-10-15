import '@/features/invest/portal/strategies.css'
import './health.css'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { healthMessages as HM } from '@/i18n/messages/health'
import { useHealthData } from '@/features/health/data/HealthDataContext'
import { addCheckIn, deleteCheckIn, sendHealthReaction, updateCheckIn } from '@/features/health/data/api'
import { useToasts } from '@/features/app/toasts/toastsContext'
import type { HealthCheckIn } from '@/features/health/data/types'
import { ENERGY_LABELS, fmtDateTime, MOOD_LABELS, moodLabel } from './healthUi'
import { HealthLoading } from './HealthLoading'
import { HealthScalePicker } from './HealthScalePicker'
import { MiraNote } from './MiraNote'
import { useHealthHead } from './useHealthHead'

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
  const [mood, setMood] = useState<number | null>(entry.mood)
  const [energy, setEnergy] = useState<number | null>(entry.energy)
  const [note, setNote] = useState(entry.note)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (mood == null || saving) return
    setSaving(true)
    try {
      await updateCheckIn(entry.id, { mood, energy, note })
      onSaved(mood, energy, note)
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
          className="sb-btn sb-btn-secondary"
          onClick={onDone}
        >
          {x(HM.health_checkin_cancel)}
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

  const submit = async () => {
    if (mood == null || saving) return
    setSaving(true)
    try {
      const saved = { mood, energy, note }
      await addCheckIn(saved)
      await refresh()
      setMood(null)
      setEnergy(null)
      setNote('')
      showToast(HM.health_checkin_saved)
      /* Best-effort: Mira reacts to what was just saved — her line shows
         here and lands in the chat thread too. A failed reaction never
         disturbs the save. */
      /* Throttled reactions resolve reply:null — leave any earlier line up. */
      void sendHealthReaction({ type: 'checkin_saved', ...saved }, lang, setMiraLine)
        .then((r) => {
          if (r.reply !== null) setMiraLine(r.reply)
        })
        .catch(() => {})
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
    await deleteCheckIn(id)
    await refresh()
  }

  if (loading || !state) return <HealthLoading />
  const checkIns = state.checkIns

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
          </div>
          {miraLine && <MiraNote line={miraLine} />}
        </div>
      </section>

      <div className="sb-section-head">
        <h2>{x(HM.health_checkin_history)}</h2>
      </div>
      <section className="sb-card sb-card-pad">
        {checkIns.length === 0 ? (
          <div className="sb-empty">{x(HM.health_checkin_empty)}</div>
        ) : (
          <div className="hb-rows">
            {checkIns.map((c) => (
              <div key={c.id} className="hb-row">
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
                            {x(HM.health_checkin_energy_short)}: {c.energy}/5
                          </span>
                        )}
                      </div>
                      {c.note && <p className="hb-row-body">{c.note}</p>}
                      <span className="hb-row-meta">{fmtDateTime(c.createdAt, lang)}</span>
                    </div>
                    <div className="hb-row-side" style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      <button
                        type="button"
                        className="sb-btn sb-btn-sm sb-btn-secondary"
                        style={{ minHeight: 32, padding: '4px 12px', fontSize: 12.5 }}
                        onClick={() => setEditingId(c.id)}
                      >
                        {x(HM.health_checkin_edit)}
                      </button>
                      <button
                        type="button"
                        className={`sb-btn sb-btn-sm ${armDelete === c.id ? 'sb-btn-danger sb-armed' : 'sb-btn-secondary'}`}
                        style={{ minHeight: 32, padding: '4px 12px', fontSize: 12.5 }}
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
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
