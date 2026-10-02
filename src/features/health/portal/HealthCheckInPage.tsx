import '@/features/invest/portal/strategies.css'
import './health.css'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { healthMessages as HM } from '@/i18n/messages/health'
import { useHealthData } from '@/features/health/data/HealthDataContext'
import { addCheckIn, deleteCheckIn } from '@/features/health/data/api'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { ENERGY_LABELS, fmtDateTime, MOOD_LABELS, moodLabel } from './healthUi'
import { useHealthHead } from './useHealthHead'

function ScalePicker({
  idPrefix,
  legend,
  labels,
  value,
  onPick,
  clearable,
}: {
  idPrefix: string
  legend: string
  labels: Record<number, { en: string; fr: string }>
  value: number | null
  onPick: (v: number | null) => void
  clearable?: boolean
}) {
  const { x } = useI18n()
  return (
    <fieldset className="sb-field">
      <legend className="sb-flabel">{legend}</legend>
      <div className="hb-scale" role="radiogroup">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            id={`${idPrefix}-${n}`}
            type="button"
            role="radio"
            aria-checked={value === n}
            className={`hb-scale-btn${value === n ? ' is-on' : ''}`}
            onClick={() => onPick(clearable && value === n ? null : n)}
          >
            <span className="hb-scale-num" aria-hidden="true">
              {n}
            </span>
            <span className="hb-scale-label">{x(labels[n] ?? { en: '', fr: '' })}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function HealthCheckInPage() {
  const { x, lang } = useI18n()
  const { state, refresh } = useHealthData()
  const { showToast } = useToasts()
  useHealthHead(HM.health_checkin_title, HM.health_checkin_sub)

  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [armDelete, setArmDelete] = useState<string | null>(null)

  const submit = async () => {
    if (mood == null || saving) return
    setSaving(true)
    try {
      await addCheckIn({ mood, energy, note })
      await refresh()
      setMood(null)
      setEnergy(null)
      setNote('')
      showToast(HM.health_checkin_saved)
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

  const checkIns = state?.checkIns ?? []

  return (
    <div className="sb hb sb-page">
      <div className="sb-head-row">
        <h1>{x(HM.health_checkin_title)}</h1>
      </div>
      <p className="sb-sub">{x(HM.health_checkin_sub)}</p>

      <section className="sb-card sb-card-pad" style={{ marginTop: 18 }}>
        <div className="flex flex-col gap-[18px]">
          <ScalePicker
            idPrefix="hb-mood"
            legend={x(HM.health_checkin_mood)}
            labels={MOOD_LABELS}
            value={mood}
            onPick={setMood}
          />
          <ScalePicker
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
                <div className="hb-row-side">
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
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
