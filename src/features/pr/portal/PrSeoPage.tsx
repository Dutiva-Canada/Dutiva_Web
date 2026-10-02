import '@/features/invest/portal/strategies.css'
import './pr.css'
import { useState } from 'react'
import { Loader2, Minus, MoveDown, MoveUp, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { prMessages as PM } from '@/i18n/messages/pr'
import { usePrData } from '@/features/pr/data/PrDataContext'
import { addKeyword, deleteKeyword, updateKeywordPosition } from '@/features/pr/data/api'
import { rankDelta } from '@/features/pr/data/prStats'
import type { PrKeyword } from '@/features/pr/data/types'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { fmtDate } from './prUi'
import { usePrHead } from './usePrHead'

interface Draft {
  keyword: string
  targetUrl: string
}

export function PrSeoPage() {
  const { x, lang } = useI18n()
  const { state, loading, error, refresh } = usePrData()
  const { showToast } = useToasts()
  usePrHead(PM.pr_seo_title, PM.pr_seo_sub)

  const [formOpen, setFormOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>({ keyword: '', targetUrl: '' })
  const [saving, setSaving] = useState(false)
  const [armDelete, setArmDelete] = useState<string | null>(null)
  const [positions, setPositions] = useState<Record<string, string>>({})

  const submit = async () => {
    if (!draft.keyword.trim() || saving) return
    setSaving(true)
    try {
      await addKeyword(draft)
      await refresh()
      setDraft({ keyword: '', targetUrl: '' })
      setFormOpen(false)
      showToast(PM.pr_seo_saved)
    } finally {
      setSaving(false)
    }
  }

  const savePosition = async (kw: PrKeyword) => {
    const raw = (positions[kw.id] ?? '').trim()
    if (raw === '') return
    const pos = Number(raw)
    if (!Number.isFinite(pos) || pos < 1 || pos > 100) return
    await updateKeywordPosition(kw.id, Math.round(pos))
    setPositions((p) => ({ ...p, [kw.id]: '' }))
    await refresh()
  }

  const remove = async (id: string) => {
    if (armDelete !== id) {
      setArmDelete(id)
      return
    }
    setArmDelete(null)
    await deleteKeyword(id)
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
        <h1>{x(PM.pr_seo_title)}</h1>
        <button
          type="button"
          className="sb-btn sb-btn-primary"
          onClick={() => setFormOpen(true)}
        >
          {x(PM.pr_seo_new)}
        </button>
      </div>
      <p className="sb-sub">{x(PM.pr_seo_sub)}</p>

      {formOpen && (
        <form
          className="sb-card sb-card-pad"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <div className="sb-form-grid">
            <div className="sb-field">
              <label className="sb-flabel" htmlFor="pr-kw-word">{x(PM.pr_seo_keyword)}</label>
              <input
                id="pr-kw-word"
                className="sb-input"
                required
                value={draft.keyword}
                placeholder={x(PM.pr_seo_keyword_ph)}
                onChange={(e) => setDraft({ ...draft, keyword: e.target.value })}
              />
            </div>
            <div className="sb-field">
              <label className="sb-flabel" htmlFor="pr-kw-url">{x(PM.pr_seo_url)}</label>
              <input
                id="pr-kw-url"
                className="sb-input"
                type="url"
                value={draft.targetUrl}
                placeholder={x(PM.pr_seo_url_ph)}
                onChange={(e) => setDraft({ ...draft, targetUrl: e.target.value })}
              />
            </div>
            <div className="sb-form-actions">
              <button type="submit" className="sb-btn sb-btn-primary" disabled={saving}>
                {saving && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                {x(PM.pr_seo_save)}
              </button>
            </div>
          </div>
        </form>
      )}

      <section className="sb-card sb-card-pad">
        {state.keywords.length === 0 ? (
          <div className="sb-empty">{x(PM.pr_seo_empty)}</div>
        ) : (
          <div className="sb-table-wrap">
            <table className="sb-table">
              <thead>
                <tr>
                  <th>{x(PM.pr_seo_keyword)}</th>
                  <th>{x(PM.pr_seo_url_col)}</th>
                  <th>{x(PM.pr_seo_pos_col)}</th>
                  <th>{x(PM.pr_seo_delta_col)}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {state.keywords.map((kw) => {
                  const delta = rankDelta(kw)
                  return (
                    <tr key={kw.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{kw.keyword}</div>
                        <div style={{ fontSize: 12, color: 'var(--sb-muted)' }}>
                          {kw.checkedAt
                            ? x(PM.pr_seo_checked).replace(
                                '{date}',
                                fmtDate(kw.checkedAt, lang),
                              )
                            : x(PM.pr_seo_never)}
                        </div>
                      </td>
                      <td
                        style={{
                          maxWidth: 220,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {kw.targetUrl ? (
                          <a
                            href={kw.targetUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: 'var(--sb-accent-ink)', textDecoration: 'none' }}
                          >
                            {kw.targetUrl.replace(/^https?:\/\//, '')}
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        {kw.position ?? x(PM.pr_seo_unranked)}
                      </td>
                      <td>
                        {delta.dir == null ? (
                          '—'
                        ) : delta.dir === 'flat' ? (
                          <span className="prx-delta" data-dir="flat">
                            <Minus size={13} aria-hidden="true" />
                          </span>
                        ) : (
                          <span className="prx-delta" data-dir={delta.dir}>
                            {delta.dir === 'up' ? (
                              <MoveUp size={13} aria-hidden="true" />
                            ) : (
                              <MoveDown size={13} aria-hidden="true" />
                            )}
                            {delta.spots}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="sb-row-actions">
                          <input
                            className="sb-input sb-input-sm"
                            style={{ width: 76 }}
                            type="number"
                            min={1}
                            max={100}
                            inputMode="numeric"
                            aria-label={`${x(PM.pr_seo_position)} — ${kw.keyword}`}
                            placeholder={x(PM.pr_seo_position_ph)}
                            value={positions[kw.id] ?? ''}
                            onChange={(e) =>
                              setPositions((p) => ({ ...p, [kw.id]: e.target.value }))
                            }
                          />
                          <button
                            type="button"
                            className="sb-btn sb-btn-secondary sb-btn-sm"
                            disabled={(positions[kw.id] ?? '').trim() === ''}
                            onClick={() => void savePosition(kw)}
                          >
                            {x(PM.pr_seo_update_position)}
                          </button>
                          <button
                            type="button"
                            className="sb-btn sb-btn-secondary sb-btn-sm"
                            onClick={() => void remove(kw.id)}
                          >
                            <Trash2 size={13} aria-hidden="true" />
                            {armDelete === kw.id
                              ? x(PM.pr_seo_delete_confirm)
                              : x(PM.pr_seo_delete)}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="sb-note">
        <span>{x(PM.pr_seo_note)}</span>
      </div>
    </div>
  )
}
