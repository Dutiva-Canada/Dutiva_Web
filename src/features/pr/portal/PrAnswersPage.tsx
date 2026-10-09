import '@/features/invest/portal/strategies.css'
import './pr.css'
import { useEffect, useState } from 'react'
import { Info, Loader2, Sparkles, Trash2, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { prMessages as PM } from '@/i18n/messages/pr'
import { usePrData } from '@/features/pr/data/PrDataContext'
import { addGeoPrompt, deleteGeoPrompt, prSuggestGeoPrompts, recordGeoCheck, runGeoChecks, type PrPromptSuggestion } from '@/features/pr/data/api'
import { loadPendingSuggestions, resolveSuggestion } from '@/lib/agentQueue'
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
  const [running, setRunning] = useState(false)
  const [armDelete, setArmDelete] = useState<string | null>(null)
  const [checks, setChecks] = useState<Record<string, RowCheck>>({})
  const [suggestions, setSuggestions] = useState<PrPromptSuggestion[]>([])
  const [suggestBusy, setSuggestBusy] = useState(false)
  const [suggestFailed, setSuggestFailed] = useState(false)
  const [addingSuggestion, setAddingSuggestion] = useState<string | null>(null)

  /* Pending geo_prompt rows from the review queue survive refresh — load
     them on mount so a suggestion the user hasn't resolved yet is still
     here (the /pr/review page shows the same rows). */
  useEffect(() => {
    loadPendingSuggestions('pr')
      .then((rows) =>
        setSuggestions(
          rows
            .filter((r) => r.kind === 'geo_prompt')
            .map((r) => ({
              text: ((r.payload as { prompt?: string } | null)?.prompt ?? r.title).trim(),
              suggestionId: r.id,
            }))
            .filter((r) => r.text !== ''),
        ),
      )
      .catch(() => {})
  }, [])

  /** Manual "check my prompts now" — the scheduled sweep does the same daily;
      results land with checkedVia='auto' so they're never confused with a
      human spot-check. */
  const runChecks = async () => {
    if (running) return
    setRunning(true)
    try {
      const res = await runGeoChecks()
      await refresh()
      showToast({
        en: (res.checked === 1 ? PM.pr_ans_ran_one : PM.pr_ans_ran_many).en.replace(
          '{count}',
          String(res.checked),
        ),
        fr: (res.checked === 1 ? PM.pr_ans_ran_one : PM.pr_ans_ran_many).fr.replace(
          '{count}',
          String(res.checked),
        ),
      })
    } catch {
      showToast(PM.pr_ans_run_fail)
    } finally {
      setRunning(false)
    }
  }

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

  /* Suggest new questions to track — the model sees campaign names and the
     already-tracked list (to avoid repeats). Each suggestion stays a draft
     until the user adds it. */
  const suggestPrompts = async () => {
    if (suggestBusy || !state) return
    setSuggestBusy(true)
    setSuggestFailed(false)
    try {
      const out = await prSuggestGeoPrompts({
        campaigns: state.campaigns.map((c) => c.name),
        existing: state.geoPrompts.map((p) => p.prompt),
        lang,
      })
      /* Merge by id AND text — server-side dedupe returns the same pending
         row for a re-suggested question, and a null-id row shouldn't twin
         a queued one either. */
      setSuggestions((cur) => {
        const ids = new Set(cur.map((c) => c.suggestionId).filter(Boolean))
        const texts = new Set(cur.map((c) => c.text.toLowerCase()))
        const fresh = out.filter(
          (o) =>
            (!o.suggestionId || !ids.has(o.suggestionId)) &&
            !texts.has(o.text.toLowerCase()),
        )
        return [...cur, ...fresh]
      })
      if (out.length === 0) setSuggestFailed(true)
    } catch {
      setSuggestFailed(true)
    } finally {
      setSuggestBusy(false)
    }
  }

  const addSuggestion = async (s: PrPromptSuggestion) => {
    if (addingSuggestion) return
    setAddingSuggestion(s.text)
    try {
      await addGeoPrompt({ prompt: s.text, engine: 'chatgpt' })
      if (s.suggestionId) {
        await resolveSuggestion(s.suggestionId, 'accepted', 'added').catch(() => {})
      }
      setSuggestions((cur) => cur.filter((p) => p !== s))
      await refresh()
      showToast(PM.pr_ans_saved)
    } finally {
      setAddingSuggestion(null)
    }
  }

  const dismissSuggestion = async (s: PrPromptSuggestion) => {
    if (addingSuggestion) return
    if (s.suggestionId) {
      await resolveSuggestion(s.suggestionId, 'dismissed', 'dismissed').catch(() => {})
    }
    setSuggestions((cur) => cur.filter((p) => p !== s))
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
        <div className="flex gap-[8px]">
          <button
            type="button"
            className="sb-btn sb-btn-secondary"
            disabled={suggestBusy}
            onClick={() => void suggestPrompts()}
          >
            {suggestBusy ? (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles size={14} aria-hidden="true" />
            )}
            {x(suggestBusy ? PM.pr_ai_prompts_working : PM.pr_ai_prompts_btn)}
          </button>
          <button
            type="button"
            className="sb-btn sb-btn-secondary"
            disabled={running || state.geoPrompts.length === 0}
            onClick={() => void runChecks()}
          >
            {running && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            {x(running ? PM.pr_ans_running : PM.pr_ans_run)}
          </button>
          <button
            type="button"
            className="sb-btn sb-btn-primary"
            onClick={() => setFormOpen(true)}
          >
            {x(PM.pr_ans_new)}
          </button>
        </div>
      </div>
      <p className="sb-sub">{x(PM.pr_ans_sub)}</p>

      {suggestions.length > 0 && (
        <section className="sb-card sb-card-pad">
          <p className="sb-helper" style={{ marginTop: 0 }}>{x(PM.pr_ai_prompts_hint)}</p>
          <div className="sb-mini-list" style={{ marginBottom: 0 }}>
            {suggestions.map((p) => (
              <div
                key={p.suggestionId ?? p.text}
                className="flex items-center gap-[10px]"
                style={{ padding: '6px 0' }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  {p.text}
                  {p.suggestionId === null ? (
                    <span className="sb-notify-hint">{x(PM.pr_ai_not_filed)}</span>
                  ) : null}
                </span>
                <button
                  type="button"
                  className="sb-btn sb-btn-secondary sb-btn-sm"
                  disabled={addingSuggestion === p.text}
                  onClick={() => void addSuggestion(p)}
                >
                  {addingSuggestion === p.text && (
                    <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                  )}
                  {x(PM.pr_ai_add)}
                </button>
                <button
                  type="button"
                  className="sb-btn sb-btn-secondary sb-btn-sm"
                  disabled={addingSuggestion === p.text}
                  onClick={() => void dismissSuggestion(p)}
                  title={x(PM.pr_ai_dismiss)}
                >
                  <X size={13} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
      {suggestFailed && (
        <p className="sb-note" role="alert">{x(PM.pr_ai_prompts_failed)}</p>
      )}

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
                          ? `${x(PM.pr_ans_checked).replace('{date}', fmtDate(p.checkedAt, lang))} · ${x(
                              p.checkedVia === 'auto'
                                ? PM.pr_ans_via_auto
                                : PM.pr_ans_via_manual,
                            )}`
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
        <span>
          {x(PM.pr_ans_note_banner)} {x(PM.pr_ans_auto_note)}
        </span>
      </div>
    </div>
  )
}
