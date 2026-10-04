import '@/features/invest/portal/strategies.css'
import './pr.css'
import { useEffect, useState } from 'react'
import { Copy, Loader2, Mail, MailPlus, Sparkles, Trash2, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { prMessages as PM } from '@/i18n/messages/pr'
import { usePrData } from '@/features/pr/data/PrDataContext'
import { addMediaContact, deleteMediaContact, draftPitch, type PrPitchDraft } from '@/features/pr/data/api'
import { loadPendingSuggestions, resolveSuggestion } from '@/lib/agentQueue'
import type { PrMediaContact } from '@/features/pr/data/types'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { usePrHead } from './usePrHead'

interface Draft {
  name: string
  outlet: string
  beat: string
  email: string
  note: string
}

const EMPTY: Draft = { name: '', outlet: '', beat: '', email: '', note: '' }

interface PitchState extends PrPitchDraft {
  contactId: string
  contactName: string
  email: string
  /** True when the queue write didn't land upstream — the card still works
      (copy/mailto) but isn't filed for review. Captured at draft time;
      suggestionId itself is cleared after resolution so it can't flag it. */
  ephemeral?: boolean
}

export function PrMediaPage() {
  const { x, lang } = useI18n()
  const { state, loading, error, refresh } = usePrData()
  const { showToast } = useToasts()
  usePrHead(PM.pr_media_title, PM.pr_media_sub)

  const [formOpen, setFormOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [armDelete, setArmDelete] = useState<string | null>(null)
  const [pitch, setPitch] = useState<PitchState | null>(null)
  const [pitchBusy, setPitchBusy] = useState<string | null>(null)
  const [pitchFailed, setPitchFailed] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [queued, setQueued] = useState<PitchState[]>([])

  /* Pending pitch rows from the review queue — drafts filed earlier that
     nobody resolved yet. They render as the same card, oldest first. */
  const reloadQueued = async (excludeId?: string | null) => {
    try {
      const rows = await loadPendingSuggestions('pr')
      setQueued(
        rows
          .filter((r) => r.kind === 'pitch' && r.id !== excludeId)
          .map((r) => {
            const p = (r.payload as {
              contactId?: string | null
              contactName?: string
              email?: string
              subject?: string
              body?: string
            } | null) ?? {}
            return {
              contactId: p.contactId ?? '',
              contactName: p.contactName ?? r.title,
              email: p.email ?? '',
              subject: p.subject ?? '',
              body: p.body ?? '',
              suggestionId: r.id,
            }
          }),
      )
    } catch {
      /* queue list is cosmetic — a failed reload keeps the current one */
    }
  }

  useEffect(() => {
    void reloadQueued()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = async () => {
    if (!draft.name.trim() || saving) return
    setSaving(true)
    try {
      await addMediaContact(draft)
      await refresh()
      setDraft(EMPTY)
      setFormOpen(false)
      showToast(PM.pr_media_saved)
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
    await deleteMediaContact(id)
    await refresh()
  }

  /* Pitch draft — the model gets the contact's public details plus active
     campaign names, and returns subject + body. It only ever lands in the
     card below: copy it or open it in the user's own mail app. */
  const draftFor = async (c: PrMediaContact) => {
    if (pitchBusy || !state) return
    setPitchBusy(c.id)
    setPitchFailed(null)
    try {
      const out = await draftPitch({
        contactId: c.id,
        name: c.name,
        outlet: c.outlet,
        beat: c.beat,
        note: c.note,
        email: c.email,
        campaigns: state.campaigns.filter((k) => k.status === 'active').map((k) => k.name),
        lang,
      })
      setPitch({
        contactId: c.id,
        contactName: c.name,
        email: c.email,
        ...out,
        ephemeral: out.suggestionId === null,
      })
      /* The new row is the active card — keep it out of the queued list so
         it doesn't render twice; a re-draft superseded the old one upstream. */
      void reloadQueued(out.suggestionId)
    } catch {
      setPitch(null)
      setPitchFailed(c.id)
    } finally {
      setPitchBusy(null)
    }
  }

  /* Resolving the queued row is best-effort — suggestionId is null when the
     queue write didn't land upstream, and a resolve failure must not block
     the local action. After the first resolution the id is cleared so a
     second click can't overwrite the recorded outcome. */
  const resolve = (action: string) => {
    if (!pitch?.suggestionId) return
    const id = pitch.suggestionId
    setPitch((p) => (p ? { ...p, suggestionId: null } : p))
    setQueued((q) => q.filter((r) => r.suggestionId !== id))
    void resolveSuggestion(id, 'accepted', action).catch(() => {})
  }

  const copyPitch = async () => {
    if (!pitch) return
    try {
      await navigator.clipboard.writeText(
        `${pitch.subject ? `Subject: ${pitch.subject}\n\n` : ''}${pitch.body}`,
      )
      resolve('copied')
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      showToast(PM.pr_ai_pitch_failed)
    }
  }

  const dismissPitch = () => {
    if (pitch?.suggestionId) {
      void resolveSuggestion(pitch.suggestionId, 'dismissed', 'dismissed').catch(() => {})
    }
    setPitch(null)
    void reloadQueued()
  }

  /* Queued-row actions mirror the fresh card's — resolve + drop the row. */
  const queuedCopy = async (q: PitchState) => {
    try {
      await navigator.clipboard.writeText(
        `${q.subject ? `Subject: ${q.subject}\n\n` : ''}${q.body}`,
      )
    } catch {
      showToast(PM.pr_ai_pitch_failed)
      return
    }
    if (q.suggestionId) {
      setQueued((cur) => cur.filter((r) => r.suggestionId !== q.suggestionId))
      void resolveSuggestion(q.suggestionId, 'accepted', 'copied').catch(() => {})
    }
  }

  const queuedOpen = (q: PitchState) => {
    if (q.suggestionId) {
      setQueued((cur) => cur.filter((r) => r.suggestionId !== q.suggestionId))
      void resolveSuggestion(q.suggestionId, 'accepted', 'opened_email').catch(() => {})
    }
  }

  const queuedDismiss = (q: PitchState) => {
    if (q.suggestionId) {
      setQueued((cur) => cur.filter((r) => r.suggestionId !== q.suggestionId))
      void resolveSuggestion(q.suggestionId, 'dismissed', 'dismissed').catch(() => {})
    }
  }

  const queuedMailto = (q: PitchState) =>
    `mailto:${q.email}?subject=${encodeURIComponent(q.subject)}&body=${encodeURIComponent(q.body)}`

  const mailtoHref = pitch
    ? `mailto:${pitch.email}?subject=${encodeURIComponent(pitch.subject)}&body=${encodeURIComponent(pitch.body)}`
    : ''

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
        <h1>{x(PM.pr_media_title)}</h1>
        <button
          type="button"
          className="sb-btn sb-btn-primary"
          onClick={() => {
            setDraft(EMPTY)
            setFormOpen(true)
          }}
        >
          {x(PM.pr_media_new)}
        </button>
      </div>
      <p className="sb-sub">{x(PM.pr_media_sub)}</p>

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
              <label className="sb-flabel" htmlFor="pr-md-name">{x(PM.pr_media_name)}</label>
              <input
                id="pr-md-name"
                className="sb-input"
                required
                value={draft.name}
                placeholder={x(PM.pr_media_name_ph)}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div className="sb-field">
              <label className="sb-flabel" htmlFor="pr-md-outlet">{x(PM.pr_media_outlet)}</label>
              <input
                id="pr-md-outlet"
                className="sb-input"
                value={draft.outlet}
                placeholder={x(PM.pr_media_outlet_ph)}
                onChange={(e) => setDraft({ ...draft, outlet: e.target.value })}
              />
            </div>
            <div className="sb-field">
              <label className="sb-flabel" htmlFor="pr-md-beat">{x(PM.pr_media_beat)}</label>
              <input
                id="pr-md-beat"
                className="sb-input"
                value={draft.beat}
                placeholder={x(PM.pr_media_beat_ph)}
                onChange={(e) => setDraft({ ...draft, beat: e.target.value })}
              />
            </div>
            <div className="sb-field">
              <label className="sb-flabel" htmlFor="pr-md-email">{x(PM.pr_media_email)}</label>
              <input
                id="pr-md-email"
                className="sb-input"
                type="email"
                value={draft.email}
                placeholder="name@outlet.ca"
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </div>
            <div className="sb-field" style={{ gridColumn: '1 / -1' }}>
              <label className="sb-flabel" htmlFor="pr-md-note">{x(PM.pr_media_note)}</label>
              <input
                id="pr-md-note"
                className="sb-input"
                value={draft.note}
                placeholder={x(PM.pr_media_note_ph)}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
              />
            </div>
            <div className="sb-form-actions">
              <button type="submit" className="sb-btn sb-btn-primary" disabled={saving}>
                {saving && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                {x(PM.pr_media_save)}
              </button>
            </div>
          </div>
        </form>
      )}

      <section className="sb-card sb-card-pad">
        {state.contacts.length === 0 ? (
          <div className="sb-empty">{x(PM.pr_media_empty)}</div>
        ) : (
          <div className="sb-table-wrap">
            <table className="sb-table">
              <thead>
                <tr>
                  <th>{x(PM.pr_media_name)}</th>
                  <th>{x(PM.pr_media_outlet)}</th>
                  <th>{x(PM.pr_media_beat)}</th>
                  <th>{x(PM.pr_media_email)}</th>
                  <th>{x(PM.pr_media_note)}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {state.contacts.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600, minWidth: 130 }}>{c.name}</td>
                    <td style={{ minWidth: 110 }}>{c.outlet || '—'}</td>
                    <td style={{ minWidth: 110 }}>{c.beat || '—'}</td>
                    <td>
                      {c.email ? (
                        <a
                          href={`mailto:${c.email}`}
                          className="inline-flex items-center gap-1"
                          style={{ color: 'var(--sb-accent-ink)', textDecoration: 'none' }}
                        >
                          <Mail size={12} aria-hidden="true" />
                          {c.email}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td
                      style={{
                        maxWidth: 220,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'var(--sb-muted)',
                      }}
                    >
                      {c.note || '—'}
                    </td>
                    <td>
                      <div className="sb-row-actions">
                        <button
                          type="button"
                          className="sb-btn sb-btn-secondary sb-btn-sm"
                          onClick={() => void draftFor(c)}
                          disabled={pitchBusy !== null}
                          title={x(PM.pr_ai_pitch_btn)}
                        >
                          {pitchBusy === c.id ? (
                            <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                          ) : (
                            <Sparkles size={13} aria-hidden="true" />
                          )}
                          {x(PM.pr_ai_pitch_btn)}
                        </button>
                        <button
                          type="button"
                          className="sb-btn sb-btn-secondary sb-btn-sm"
                          onClick={() => void remove(c.id)}
                        >
                          <Trash2 size={13} aria-hidden="true" />
                          {armDelete === c.id
                            ? x(PM.pr_media_delete_confirm)
                            : x(PM.pr_media_delete)}
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

      {pitchFailed ? <div className="sb-empty">{x(PM.pr_ai_pitch_failed)}</div> : null}

      {pitch ? (
        <section className="sb-card sb-card-pad">
          <div className="sb-card-head">
            <div>
              <h3 className="sb-card-title">
                {x(PM.pr_ai_pitch_btn)} — {pitch.contactName}
              </h3>
              <p className="sb-card-sub">{x(PM.pr_ai_pitch_note)}</p>
            </div>
          </div>
          {pitch.subject !== '' ? (
            <p style={{ fontWeight: 600, margin: '0 0 6px' }}>
              Subject: {pitch.subject}
            </p>
          ) : null}
          <p style={{ whiteSpace: 'pre-wrap', margin: 0, color: 'var(--sb-muted)' }}>
            {pitch.body}
          </p>
          {pitch.ephemeral ? (
            <p className="sb-notify-hint" style={{ margin: '10px 0 0' }}>
              {x(PM.pr_ai_not_filed)}
            </p>
          ) : null}
          <div className="sb-form-actions" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="sb-btn sb-btn-secondary sb-btn-sm"
              onClick={() => void copyPitch()}
            >
              <Copy size={13} aria-hidden="true" />
              {x(copied ? PM.pr_ai_pitch_copied : PM.pr_ai_pitch_copy)}
            </button>
            {pitch.email !== '' ? (
              <a
                className="sb-btn sb-btn-secondary sb-btn-sm"
                href={mailtoHref}
                onClick={() => resolve('opened_email')}
              >
                <MailPlus size={13} aria-hidden="true" />
                {x(PM.pr_ai_pitch_mailto)}
              </a>
            ) : null}
            <button
              type="button"
              className="sb-btn sb-btn-secondary sb-btn-sm"
              onClick={() => dismissPitch()}
            >
              <X size={13} aria-hidden="true" />
              {x(PM.pr_ai_dismiss)}
            </button>
          </div>
        </section>
      ) : null}

      {queued.map((q) => (
        <section key={q.suggestionId ?? q.contactName} className="sb-card sb-card-pad">
          <div className="sb-card-head">
            <div>
              <h3 className="sb-card-title">
                {x(PM.pr_ai_pitch_btn)} — {q.contactName}
              </h3>
              <p className="sb-card-sub">{x(PM.pr_ai_pitch_note)}</p>
            </div>
          </div>
          {q.subject !== '' ? (
            <p style={{ fontWeight: 600, margin: '0 0 6px' }}>
              Subject: {q.subject}
            </p>
          ) : null}
          <p style={{ whiteSpace: 'pre-wrap', margin: 0, color: 'var(--sb-muted)' }}>
            {q.body}
          </p>
          <div className="sb-form-actions" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="sb-btn sb-btn-secondary sb-btn-sm"
              onClick={() => void queuedCopy(q)}
            >
              <Copy size={13} aria-hidden="true" />
              {x(PM.pr_ai_pitch_copy)}
            </button>
            {q.email !== '' ? (
              <a
                className="sb-btn sb-btn-secondary sb-btn-sm"
                href={queuedMailto(q)}
                onClick={() => queuedOpen(q)}
              >
                <MailPlus size={13} aria-hidden="true" />
                {x(PM.pr_ai_pitch_mailto)}
              </a>
            ) : null}
            <button
              type="button"
              className="sb-btn sb-btn-secondary sb-btn-sm"
              onClick={() => queuedDismiss(q)}
            >
              <X size={13} aria-hidden="true" />
              {x(PM.pr_ai_dismiss)}
            </button>
          </div>
        </section>
      ))}
    </div>
  )
}
