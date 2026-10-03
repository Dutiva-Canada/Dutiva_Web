import '@/features/invest/portal/strategies.css'
import './pr.css'
import { useState } from 'react'
import { Info, Loader2, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { prMessages as PM } from '@/i18n/messages/pr'
import { usePrData } from '@/features/pr/data/PrDataContext'
import { addGeoPrompt, deleteGeoPrompt, recordGeoCheck } from '@/features/pr/data/api'
import type { PrGeoEngine, PrGeoPrompt, PrGeoResult } from '@/features/pr/data/types'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { fmtDate, GEO_ENGINES, geoEngineLabel, GEO_RESULTS, geoResultLabel } from './prUi'
import { usePrHead } from './usePrHead'

/** Result pills — cited = green (you were a source), mentioned = accent
    (named, no link), absent = danger outline, unchecked = neutral draft. */
const RESULT_PILL: Record<PrGeoResult, string> = {
  unchecked: 'sb-pill sb-pill-draft',
  cited: 'sb-pill prx-sent-pos',
  mentioned: 'sb-pill sb-pill-warn',
  absent: 'sb-pill prx-sent-neg',
}

interface Draft {
  prompt: string
  engine: PrGeoEngine
}

interface RowCheck {
  result: PrGeoResult
  note: string
}

export function PrAnswersPage() {
  const { x, lang } = useI18n()
  const { state, loading, error, refresh } = usePrData()
  const { showToast } = useToasts()
  usePrHead(PM.pr_ans_title, PM.pr_ans_sub)

  const [formOpen, setFormOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>({ prompt: '', engine: 'chatgpt' })
  const [saving, setSaving] = useState(false)
  const [armDelete, setArmDelete] = useState<string | null>(null)
  const [checks, setChecks] = useState<Record<string, RowCheck>>({})

  const submit = async () => {
    if (!draft.prompt.trim() || saving) return
    setSaving(true)
    try {
      await addGeoPrompt(draft)
      await refresh()
      setDraft({ prompt: '', engine: 'chatgpt' })
      setFormOpen(false)
      showToast(PM.pr_ans_saved)
    } finally {
      setSaving(false)
    }
  }

  const check = (id: string): RowCheck => checks[id] ?? { result: 'unchecked', note: '' }

  const saveCheck = async (p: PrGeoPrompt) => {
    const c = check(p.id)
    if (c.result === 'unchecked') return
    await recordGeoCheck(p.id, c.result, c.note)
    setChecks((s) => ({ ...s, [p.id]: { result: 'unchecked', note: '' } }))
    await refresh()
    showToast(PM.pr_ans_updated)
  }

  const remove = async (id: string) => {
    if (armDelete !== id) {
      setArmDelete(id)
      return
    }
    setArmDelete(null)
    await deleteGeoPrompt(id)
    await refresh()
  }

  if (loading || !state) {
    return (
      <div className="flex items-center justify-center py-[80px]">
        <Loader2 size={24} className="animate-spin text-text-muted" aria-hidden="true" />
      </div>
    )
  }
  if (error) {
    return (
      <div className="sb prx sb-page">
        <p role="alert" className="sb-note">{x(PM.pr_load_error)}</p>
        <button type="button" className="sb-btn sb-btn-secondary" onClick={() => void refresh()}>
          {x(PM.pr_retry)}
        </button>
      </div>
    )
  }

  return (
    <div className="sb prx sb-page">
      <div className="sb-head-row">
        <h1>{x(PM.pr_ans_title)}</h1>
        <button
          type="button"
          className="sb-btn sb-btn-primary"
          onClick={() => setFormOpen(true)}
        >
          {x(PM.pr_ans_new)}
        </button>
      </div>
      <p className="sb-sub">{x(PM.pr_ans_sub)}</p>

      {formOpen && (
        <form
          className="sb-card sb-card-pad"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <div className="sb-form-grid">
            <div className="sb-field" style={{ gridColumn: '1 / -1' }}>
              <label className="sb-flabel" htmlFor="pr-an-prompt">{x(PM.pr_ans_prompt)}</label>
              <input
                id="pr-an-prompt"
                className="sb-input"
                required
                value={draft.prompt}
                placeholder={x(PM.pr_ans_prompt_ph)}
                onChange={(e) => setDraft({ ...draft, prompt: e.target.value })}
              />
            </div>
            <div className="sb-field">
              <label className="sb-flabel" htmlFor="pr-an-engine">{x(PM.pr_ans_engine)}</label>
              <select
                id="pr-an-engine"
                className="sb-input"
                value={draft.engine}
                onChange={(e) => setDraft({ ...draft, engine: e.target.value as PrGeoEngine })}
              >
                {GEO_ENGINES.map((en) => (
                  <option key={en} value={en}>{geoEngineLabel(en, lang)}</option>
                ))}
              </select>
            </div>
            <div className="sb-form-actions">
              <button type="submit" className="sb-btn sb-btn-primary" disabled={saving}>
                {saving && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                {x(PM.pr_ans_save)}
              </button>
            </div>
          </div>
        </form>
      )}

      <section className="sb-card sb-card-pad">
        {state.geoPrompts.length === 0 ? (
          <div className="sb-empty">{x(PM.pr_ans_empty)}</div>
        ) : (
          <div className="sb-table-wrap">
            <table className="sb-table">
              <thead>
                <tr>
                  <th>{x(PM.pr_ans_prompt)}</th>
                  <th>{x(PM.pr_ans_engine)}</th>
                  <th>{x(PM.pr_ans_result)}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {state.geoPrompts.map((p) => (
                  <tr key={p.id}>
                    <td style={{ minWidth: 200 }}>
                      <div style={{ fontWeight: 600 }}>{p.prompt}</div>
                      <div style={{ fontSize: 12, color: 'var(--sb-muted)' }}>
                        {p.checkedAt
                          ? x(PM.pr_ans_checked).replace('{date}', fmtDate(p.checkedAt, lang))
                          : x(PM.pr_ans_never)}
                        {p.note ? ` — ${p.note}` : ''}
                      </div>
                    </td>
                    <td>
                      <span className="prx-chip" data-plain>
                        {geoEngineLabel(p.engine, lang)}
                      </span>
                    </td>
                    <td>
                      <span className={RESULT_PILL[p.result]}>
                        {geoResultLabel(p.result, lang)}
                      </span>
                    </td>
                    <td>
                      <div className="sb-row-actions">
                        <select
                          className="sb-input sb-input-sm"
                          style={{ width: 130 }}
                          aria-label={`${x(PM.pr_ans_result)} — ${p.prompt}`}
                          value={check(p.id).result}
                          onChange={(e) =>
                            setChecks((s) => ({
                              ...s,
                              [p.id]: { ...check(p.id), result: e.target.value as PrGeoResult },
                            }))
                          }
                        >
                          <option value="unchecked" disabled hidden>
                            {geoResultLabel('unchecked', lang)}
                          </option>
                          {GEO_RESULTS.filter((r) => r !== 'unchecked').map((r) => (
                            <option key={r} value={r}>{geoResultLabel(r, lang)}</option>
                          ))}
                        </select>
                        <input
                          className="sb-input sb-input-sm"
                          style={{ width: 150 }}
                          aria-label={`${x(PM.pr_ans_note)} — ${p.prompt}`}
                          placeholder={x(PM.pr_ans_note_ph)}
                          value={check(p.id).note}
                          onChange={(e) =>
                            setChecks((s) => ({
                              ...s,
                              [p.id]: { ...check(p.id), note: e.target.value },
                            }))
                          }
                        />
                        <button
                          type="button"
                          className="sb-btn sb-btn-secondary sb-btn-sm"
                          disabled={check(p.id).result === 'unchecked'}
                          onClick={() => void saveCheck(p)}
                        >
                          {x(PM.pr_ans_check)}
                        </button>
                        <button
                          type="button"
                          className="sb-btn sb-btn-secondary sb-btn-sm"
                          onClick={() => void remove(p.id)}
                        >
                          <Trash2 size={13} aria-hidden="true" />
                          {armDelete === p.id
                            ? x(PM.pr_ans_delete_confirm)
                            : x(PM.pr_ans_delete)}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="sb-note">
        <Info size={16} aria-hidden="true" />
        <span>{x(PM.pr_ans_note_banner)}</span>
      </div>
    </div>
  )
}
