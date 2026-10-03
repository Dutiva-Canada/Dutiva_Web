import '@/features/invest/portal/strategies.css'
import './pr.css'
import { useState } from 'react'
import { ExternalLink, Info, Loader2, PenSquare, Sparkles, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { prMessages as PM } from '@/i18n/messages/pr'
import { usePrData } from '@/features/pr/data/PrDataContext'
import {
  addContentItem,
  deleteContentItem,
  draftPrContent,
  updateContentItem,
} from '@/features/pr/data/api'
import type { PrContentItem, PrContentKind, PrContentStatus } from '@/features/pr/data/types'
import { useToasts } from '@/features/app/toasts/toastsContext'
import {
  CONTENT_KINDS,
  contentKindLabel,
  CONTENT_STATUSES,
  contentStatusLabel,
  fmtDateTime,
} from './prUi'
import { usePrHead } from './usePrHead'

const STATUS_PILL: Record<PrContentStatus, string> = {
  draft: 'sb-pill sb-pill-draft',
  scheduled: 'sb-pill sb-pill-warn',
  published: 'sb-pill sb-pill-ok',
}

interface Draft {
  id: string | null
  kind: PrContentKind
  title: string
  channel: string
  campaignId: string
  status: PrContentStatus
  scheduledFor: string
  publishedUrl: string
  publishedAt: string | null
  body: string
}

const EMPTY: Draft = {
  id: null,
  kind: 'post',
  title: '',
  channel: '',
  campaignId: '',
  status: 'draft',
  scheduledFor: '',
  publishedUrl: '',
  publishedAt: null,
  body: '',
}

/** <input type="datetime-local"> needs "YYYY-MM-DDTHH:mm" local. */
function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`
}

export function PrContentPage() {
  const { x, lang } = useI18n()
  const { state, loading, error, refresh } = usePrData()
  const { showToast } = useToasts()
  usePrHead(PM.pr_content_title, PM.pr_content_sub)

  const [formOpen, setFormOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const [aiDrafted, setAiDrafted] = useState(false)
  const [armDelete, setArmDelete] = useState<string | null>(null)

  /* Rough notes in the body field become the model's input; the returned
     draft replaces them and stays marked until the user edits it. */
  const draftWithAi = async () => {
    if (drafting || (!draft.title.trim() && !draft.body.trim())) return
    setDrafting(true)
    try {
      const text = await draftPrContent({
        itemKind: draft.kind,
        channel: draft.channel,
        title: draft.title,
        notes: draft.body,
        lang,
      })
      setDraft((d) => ({ ...d, body: text }))
      setAiDrafted(true)
    } catch {
      showToast(PM.pr_ai_draft_failed)
    } finally {
      setDrafting(false)
    }
  }

  const openNew = () => {
    setDraft(EMPTY)
    setFormOpen(true)
  }

  const openEdit = (item: PrContentItem) => {
    setDraft({
      id: item.id,
      kind: item.kind,
      title: item.title,
      channel: item.channel,
      campaignId: item.campaignId ?? '',
      status: item.status,
      scheduledFor: toLocalInput(item.scheduledFor),
      publishedUrl: item.publishedUrl,
      publishedAt: item.publishedAt,
      body: item.body,
    })
    setFormOpen(true)
  }

  const submit = async () => {
    if ((!draft.title.trim() && !draft.body.trim()) || saving) return
    setSaving(true)
    try {
      const scheduled =
        draft.status === 'scheduled' && draft.scheduledFor
          ? new Date(draft.scheduledFor).toISOString()
          : null
      const fields = {
        kind: draft.kind,
        title: draft.title,
        body: draft.body,
        channel: draft.channel,
        status: draft.status,
        campaignId: draft.campaignId || null,
        scheduledFor: scheduled,
        publishedUrl: draft.publishedUrl,
        /* First transition to published stamps the date; unpublishing
           keeps the record — it did go out — so the history isn't
           rewritten. */
        publishedAt:
          draft.status === 'published' && !draft.publishedAt
            ? new Date().toISOString()
            : draft.publishedAt,
      }
      if (draft.id) await updateContentItem(draft.id, fields)
      else await addContentItem(fields)
      await refresh()
      setDraft(EMPTY)
      setFormOpen(false)
      showToast(PM.pr_content_saved)
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
    await deleteContentItem(id)
    await refresh()
  }

  const campaignName = (id: string | null) =>
    state?.campaigns.find((c) => c.id === id)?.name ?? ''

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
        <h1>{x(PM.pr_content_title)}</h1>
        <button type="button" className="sb-btn sb-btn-primary" onClick={openNew}>
          {x(PM.pr_content_new)}
        </button>
      </div>
      <p className="sb-sub">{x(PM.pr_content_sub)}</p>

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
              <label className="sb-flabel" htmlFor="pr-ct-kind">{x(PM.pr_content_kind)}</label>
              <select
                id="pr-ct-kind"
                className="sb-input"
                value={draft.kind}
                onChange={(e) => setDraft({ ...draft, kind: e.target.value as PrContentKind })}
              >
                {CONTENT_KINDS.map((k) => (
                  <option key={k} value={k}>{contentKindLabel(k, lang)}</option>
                ))}
              </select>
            </div>
            <div className="sb-field">
              <label className="sb-flabel" htmlFor="pr-ct-status">
                {x(PM.pr_content_status)}
              </label>
              <select
                id="pr-ct-status"
                className="sb-input"
                value={draft.status}
                onChange={(e) =>
                  setDraft({ ...draft, status: e.target.value as PrContentStatus })
                }
              >
                {CONTENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{contentStatusLabel(s, lang)}</option>
                ))}
              </select>
            </div>
            <div className="sb-field">
              <label className="sb-flabel" htmlFor="pr-ct-when">{x(PM.pr_content_when)}</label>
              <input
                id="pr-ct-when"
                className="sb-input"
                type="datetime-local"
                disabled={draft.status !== 'scheduled'}
                value={draft.scheduledFor}
                onChange={(e) => setDraft({ ...draft, scheduledFor: e.target.value })}
              />
            </div>
            <div className="sb-field">
              <label className="sb-flabel" htmlFor="pr-ct-channel">
                {x(PM.pr_content_channel)}
              </label>
              <input
                id="pr-ct-channel"
                className="sb-input"
                value={draft.channel}
                placeholder={x(PM.pr_content_channel_ph)}
                onChange={(e) => setDraft({ ...draft, channel: e.target.value })}
              />
            </div>
            <div className="sb-field">
              <label className="sb-flabel" htmlFor="pr-ct-camp">
                {x(PM.pr_content_campaign)}
              </label>
              <select
                id="pr-ct-camp"
                className="sb-input"
                value={draft.campaignId}
                onChange={(e) => setDraft({ ...draft, campaignId: e.target.value })}
              >
                <option value="">{x(PM.pr_content_no_campaign)}</option>
                {state.campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            {draft.status === 'published' && (
              <div className="sb-field" style={{ gridColumn: '1 / -1' }}>
                <label className="sb-flabel" htmlFor="pr-ct-live">
                  {x(PM.pr_content_live_url)}
                </label>
                <input
                  id="pr-ct-live"
                  className="sb-input"
                  type="url"
                  value={draft.publishedUrl}
                  placeholder={x(PM.pr_content_live_url_ph)}
                  onChange={(e) => setDraft({ ...draft, publishedUrl: e.target.value })}
                />
              </div>
            )}
            <div className="sb-field" style={{ gridColumn: '1 / -1' }}>
              <label className="sb-flabel" htmlFor="pr-ct-title">
                {x(PM.pr_content_title_field)}
              </label>
              <input
                id="pr-ct-title"
                className="sb-input"
                value={draft.title}
                placeholder={x(PM.pr_content_title_ph)}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
            <div className="sb-field" style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <label className="sb-flabel" htmlFor="pr-ct-body">{x(PM.pr_content_body)}</label>
                <button
                  type="button"
                  className="sb-btn sb-btn-secondary sb-btn-sm"
                  disabled={drafting || (!draft.title.trim() && !draft.body.trim())}
                  title={x(PM.pr_ai_draft_note)}
                  onClick={() => void draftWithAi()}
                >
                  {drafting ? (
                    <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Sparkles size={13} aria-hidden="true" />
                  )}
                  {x(drafting ? PM.pr_ai_drafting : PM.pr_ai_draft_btn)}
                </button>
              </div>
              <textarea
                id="pr-ct-body"
                className="sb-input"
                style={{ minHeight: 120, paddingTop: 12, resize: 'vertical' }}
                value={draft.body}
                placeholder={x(PM.pr_content_body_ph)}
                onChange={(e) => {
                  setDraft({ ...draft, body: e.target.value })
                  setAiDrafted(false)
                }}
              />
              {aiDrafted && (
                <p className="sb-helper" style={{ margin: '6px 0 0' }}>
                  {x(PM.pr_ai_draft_note)}
                </p>
              )}
            </div>
            <div className="sb-form-actions">
              {draft.id && (
                <button
                  type="button"
                  className="sb-btn sb-btn-secondary"
                  onClick={() => {
                    setDraft(EMPTY)
                    setFormOpen(false)
                  }}
                >
                  {x(PM.pr_content_cancel)}
                </button>
              )}
              <button type="submit" className="sb-btn sb-btn-primary" disabled={saving}>
                {saving && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                {x(PM.pr_content_save)}
              </button>
            </div>
          </div>
        </form>
      )}

      <section className="sb-card sb-card-pad">
        {state.contentItems.length === 0 ? (
          <div className="sb-empty">{x(PM.pr_content_empty)}</div>
        ) : (
          <div>
            {state.contentItems.map((item) => (
              <div key={item.id} className="prx-item">
                <div className="prx-item-main">
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span className="prx-chip">{contentKindLabel(item.kind, lang)}</span>
                    <span className={STATUS_PILL[item.status]}>
                      {contentStatusLabel(item.status, lang)}
                    </span>
                    {item.channel && (
                      <span className="prx-chip" data-plain>{item.channel}</span>
                    )}
                    {item.campaignId && (
                      <span
                        className="prx-chip"
                        data-plain
                        style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {campaignName(item.campaignId)}
                      </span>
                    )}
                    {item.publishedUrl && (
                      <a
                        href={item.publishedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="prx-chip"
                        style={{ textDecoration: 'none' }}
                      >
                        <ExternalLink size={11} aria-hidden="true" />
                        {x(PM.pr_content_live)}
                      </a>
                    )}
                  </div>
                  <p
                    style={{
                      margin: '6px 0 0',
                      fontWeight: 600,
                      fontSize: 14.5,
                      color: 'var(--sb-ink)',
                    }}
                  >
                    {item.title || x(PM.pr_content_untitled)}
                  </p>
                  {item.body && (
                    <p
                      style={{
                        margin: '3px 0 0',
                        fontSize: 13,
                        lineHeight: 1.55,
                        color: 'var(--sb-body)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {item.body}
                    </p>
                  )}
                  <p
                    style={{
                      margin: '5px 0 0',
                      fontSize: 12.5,
                      color: 'var(--sb-muted)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {item.scheduledFor
                      ? fmtDateTime(item.scheduledFor, lang)
                      : fmtDateTime(item.createdAt, lang)}
                  </p>
                </div>
                <div className="prx-item-actions">
                  <button
                    type="button"
                    className="sb-btn sb-btn-secondary sb-btn-sm"
                    onClick={() => openEdit(item)}
                  >
                    <PenSquare size={13} aria-hidden="true" />
                    {x(PM.pr_content_edit)}
                  </button>
                  <button
                    type="button"
                    className="sb-btn sb-btn-secondary sb-btn-sm"
                    onClick={() => void remove(item.id)}
                  >
                    <Trash2 size={13} aria-hidden="true" />
                    {armDelete === item.id
                      ? x(PM.pr_content_delete_confirm)
                      : x(PM.pr_content_delete)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="sb-note">
        <Info size={16} aria-hidden="true" />
        <span>{x(PM.pr_content_note)}</span>
      </div>
    </div>
  )
}
