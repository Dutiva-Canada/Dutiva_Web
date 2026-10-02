import '@/features/invest/portal/strategies.css'
import './pr.css'
import { useState } from 'react'
import { ExternalLink, Loader2, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { prMessages as PM } from '@/i18n/messages/pr'
import { usePrData } from '@/features/pr/data/PrDataContext'
import { addMention, deleteMention } from '@/features/pr/data/api'
import type { PrSentiment } from '@/features/pr/data/types'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { fmtDate, SENTIMENTS, sentimentLabel } from './prUi'
import { usePrHead } from './usePrHead'

const SENT_PILL: Record<PrSentiment, string> = {
  positive: 'prx-sent-pos',
  neutral: 'prx-sent-neu',
  negative: 'prx-sent-neg',
}

interface Draft {
  source: string
  title: string
  url: string
  sentiment: PrSentiment
  date: string
}

export function PrMentionsPage() {
  const { x, lang } = useI18n()
  const { state, loading, error, refresh } = usePrData()
  const { showToast } = useToasts()
  usePrHead(PM.pr_men_title, PM.pr_men_sub)

  const [formOpen, setFormOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>({
    source: '',
    title: '',
    url: '',
    sentiment: 'neutral',
    date: '',
  })
  const [saving, setSaving] = useState(false)
  const [armDelete, setArmDelete] = useState<string | null>(null)

  const submit = async () => {
    if (!draft.title.trim() || saving) return
    setSaving(true)
    try {
      await addMention({
        source: draft.source,
        title: draft.title,
        url: draft.url,
        sentiment: draft.sentiment,
        publishedAt: draft.date
          ? new Date(`${draft.date}T12:00:00`).toISOString()
          : undefined,
      })
      await refresh()
      setDraft({ source: '', title: '', url: '', sentiment: 'neutral', date: '' })
      setFormOpen(false)
      showToast(PM.pr_men_saved)
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
    await deleteMention(id)
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
        <h1>{x(PM.pr_men_title)}</h1>
        <button
          type="button"
          className="sb-btn sb-btn-primary"
          onClick={() => setFormOpen(true)}
        >
          {x(PM.pr_men_new)}
        </button>
      </div>
      <p className="sb-sub">{x(PM.pr_men_sub)}</p>

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
              <label className="sb-flabel" htmlFor="pr-mn-title">{x(PM.pr_men_headline)}</label>
              <input
                id="pr-mn-title"
                className="sb-input"
                required
                value={draft.title}
                placeholder={x(PM.pr_men_headline_ph)}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
            <div className="sb-field">
              <label className="sb-flabel" htmlFor="pr-mn-source">{x(PM.pr_men_source)}</label>
              <input
                id="pr-mn-source"
                className="sb-input"
                value={draft.source}
                placeholder={x(PM.pr_men_source_ph)}
                onChange={(e) => setDraft({ ...draft, source: e.target.value })}
              />
            </div>
            <div className="sb-field">
              <label className="sb-flabel" htmlFor="pr-mn-url">{x(PM.pr_men_url)}</label>
              <input
                id="pr-mn-url"
                className="sb-input"
                type="url"
                value={draft.url}
                placeholder={x(PM.pr_men_url_ph)}
                onChange={(e) => setDraft({ ...draft, url: e.target.value })}
              />
            </div>
            <div className="sb-field">
              <label className="sb-flabel" htmlFor="pr-mn-sent">{x(PM.pr_men_sentiment)}</label>
              <select
                id="pr-mn-sent"
                className="sb-input"
                value={draft.sentiment}
                onChange={(e) =>
                  setDraft({ ...draft, sentiment: e.target.value as PrSentiment })
                }
              >
                {SENTIMENTS.map((s) => (
                  <option key={s} value={s}>{sentimentLabel(s, lang)}</option>
                ))}
              </select>
            </div>
            <div className="sb-field">
              <label className="sb-flabel" htmlFor="pr-mn-date">{x(PM.pr_men_date)}</label>
              <input
                id="pr-mn-date"
                className="sb-input"
                type="date"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              />
            </div>
            <div className="sb-form-actions">
              <button type="submit" className="sb-btn sb-btn-primary" disabled={saving}>
                {saving && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                {x(PM.pr_men_save)}
              </button>
            </div>
          </div>
        </form>
      )}

      <section className="sb-card sb-card-pad">
        {state.mentions.length === 0 ? (
          <div className="sb-empty">{x(PM.pr_men_empty)}</div>
        ) : (
          <div>
            {state.mentions.map((m) => (
              <div key={m.id} className="prx-mention">
                <div className="prx-mention-main">
                  <p className="prx-mention-title">
                    {m.url ? (
                      <a href={m.url} target="_blank" rel="noreferrer">
                        {m.title}
                      </a>
                    ) : (
                      m.title
                    )}
                  </p>
                  <div className="prx-mention-meta">
                    {m.source && <span>{m.source}</span>}
                    <span>{fmtDate(m.publishedAt, lang)}</span>
                  </div>
                </div>
                <div className="prx-mention-side">
                  <span className={`sb-pill ${SENT_PILL[m.sentiment]}`}>
                    {sentimentLabel(m.sentiment, lang)}
                  </span>
                  <div className="sb-row-actions">
                    {m.url && (
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noreferrer"
                        className="sb-btn sb-btn-secondary sb-btn-sm"
                      >
                        <ExternalLink size={13} aria-hidden="true" />
                        {x(PM.pr_men_view)}
                      </a>
                    )}
                    <button
                      type="button"
                      className="sb-btn sb-btn-secondary sb-btn-sm"
                      onClick={() => void remove(m.id)}
                    >
                      <Trash2 size={13} aria-hidden="true" />
                      {armDelete === m.id
                        ? x(PM.pr_men_delete_confirm)
                        : x(PM.pr_men_delete)}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
