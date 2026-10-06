import '@/features/invest/portal/strategies.css'
import './health.css'
import { useState } from 'react'
import { Loader2, Pencil, Plus, Sparkles } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { healthMessages as HM } from '@/i18n/messages/health'
import { useHealthData } from '@/features/health/data/HealthDataContext'
import { addJournalEntry, deleteJournalEntry, healthAiPrompt, shareEntryWithMira, updateJournalEntry } from '@/features/health/data/api'
import { useToasts } from '@/features/app/toasts/toastsContext'
import type { HealthJournalEntry } from '@/features/health/data/types'
import { fmtDateTime } from './healthUi'
import { MiraNote } from './MiraNote'
import { useHealthHead } from './useHealthHead'

function EntryEditor({
  initial,
  entryId,
  onDone,
}: {
  initial?: { title: string; body: string }
  entryId?: string
  onDone: () => void
}) {
  const { x } = useI18n()
  const { refresh } = useHealthData()
  const { showToast } = useToasts()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [body, setBody] = useState(initial?.body ?? '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!body.trim() || saving) return
    setSaving(true)
    try {
      if (entryId) await updateJournalEntry(entryId, { title, body })
      else await addJournalEntry({ title, body })
      await refresh()
      showToast(HM.health_journal_saved)
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-[14px]">
      <div className="sb-field">
        <label className="sb-flabel" htmlFor={entryId ? `hb-jt-${entryId}` : 'hb-jt'}>
          {x(HM.health_journal_entry_title)}
        </label>
        <input
          id={entryId ? `hb-jt-${entryId}` : 'hb-jt'}
          className="sb-input"
          style={{ width: '100%', minHeight: 44, fontSize: 15 }}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={x(HM.health_journal_title_ph)}
          maxLength={200}
        />
      </div>
      <div className="sb-field">
        <label className="sb-flabel" htmlFor={entryId ? `hb-jb-${entryId}` : 'hb-jb'}>
          {x(HM.health_journal_body)}
        </label>
        <textarea
          id={entryId ? `hb-jb-${entryId}` : 'hb-jb'}
          className="hb-textarea"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={x(HM.health_journal_body_ph)}
        />
      </div>
      <div className="sb-form-actions" style={{ gap: 10 }}>
        {onDone && (
          <button type="button" className="sb-btn sb-btn-secondary" onClick={onDone}>
            {x(HM.health_journal_cancel)}
          </button>
        )}
        <button
          type="button"
          className="sb-btn sb-btn-primary"
          disabled={!body.trim() || saving}
          title={!body.trim() ? x(HM.health_journal_body_required) : undefined}
          onClick={() => void save()}
        >
          {saving && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
          {x(HM.health_journal_save)}
        </button>
      </div>
    </div>
  )
}

function EntryRow({ entry }: { entry: HealthJournalEntry }) {
  const { x, lang } = useI18n()
  const { refresh } = useHealthData()
  const { showToast } = useToasts()
  const [editing, setEditing] = useState(false)
  const [armDelete, setArmDelete] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [miraLine, setMiraLine] = useState<string | null>(null)

  const remove = async () => {
    if (!armDelete) {
      setArmDelete(true)
      return
    }
    await deleteJournalEntry(entry.id)
    await refresh()
  }

  /* Explicit per-entry consent — only this entry's body reaches Mira, and
     only because the button was pressed. Her reply shows here and lands in
     the chat thread. */
  const share = async () => {
    if (sharing) return
    setSharing(true)
    try {
      const out = await shareEntryWithMira(entry.id, lang)
      setMiraLine(out.reply)
    } catch {
      showToast(HM.health_journal_share_failed)
    } finally {
      setSharing(false)
    }
  }

  if (editing) {
    return (
      <div className="hb-row" style={{ display: 'block' }}>
        <EntryEditor
          initial={{ title: entry.title, body: entry.body }}
          entryId={entry.id}
          onDone={() => setEditing(false)}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="hb-row">
        <div className="hb-row-main">
          <p className="hb-row-title">{entry.title.trim() || x(HM.health_journal_untitled)}</p>
          <p className="hb-row-body">{entry.body}</p>
          <span className="hb-row-meta">
            {fmtDateTime(entry.createdAt, lang)}
            {entry.updatedAt !== entry.createdAt &&
              ` · ${x(HM.health_journal_edited).replace('{date}', fmtDateTime(entry.updatedAt, lang))}`}
          </span>
        </div>
        <div className="hb-row-side" style={{ flexDirection: 'row', gap: 8 }}>
          {miraLine === null && (
            <button
              type="button"
              className="sb-btn sb-btn-secondary sb-btn-sm"
              style={{ minHeight: 32, padding: '4px 12px', fontSize: 12.5 }}
              disabled={sharing}
              title={x(HM.health_journal_share_mira_hint)}
              onClick={() => void share()}
            >
              {sharing ? (
                <Loader2 size={12} className="animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles size={12} aria-hidden="true" />
              )}
              {x(sharing ? HM.health_journal_share_mira_loading : HM.health_journal_share_mira)}
            </button>
          )}
          <button
            type="button"
            className="sb-btn sb-btn-secondary sb-btn-sm"
            style={{ minHeight: 32, padding: '4px 12px', fontSize: 12.5 }}
            onClick={() => setEditing(true)}
          >
            <Pencil size={12} aria-hidden="true" />
            {x(HM.health_journal_edit)}
          </button>
          <button
            type="button"
            className={`sb-btn sb-btn-sm ${armDelete ? 'sb-btn-danger sb-armed' : 'sb-btn-secondary'}`}
            style={{ minHeight: 32, padding: '4px 12px', fontSize: 12.5 }}
            onClick={() => void remove()}
            onBlur={() => setArmDelete(false)}
          >
            {armDelete ? x(HM.health_journal_delete_confirm) : x(HM.health_journal_delete)}
          </button>
        </div>
      </div>
      {miraLine && <MiraNote line={miraLine} />}
    </div>
  )
}

export function HealthJournalPage() {
  const { x, lang } = useI18n()
  const { state } = useHealthData()
  const { showToast } = useToasts()
  useHealthHead(HM.health_journal_title, HM.health_journal_sub)
  const [composing, setComposing] = useState(false)
  const [prompt, setPrompt] = useState<string | null>(null)
  const [prompting, setPrompting] = useState(false)

  /* Model-built writing idea — Mira reads the numbers and the user's own
     recent words. Lands as a note above the editor; the user still writes. */
  const suggestPrompt = async () => {
    if (prompting) return
    setPrompting(true)
    try {
      setPrompt(await healthAiPrompt(lang))
      setComposing(true)
    } catch {
      showToast(HM.health_ai_failed)
    } finally {
      setPrompting(false)
    }
  }

  const entries = state?.entries ?? []

  return (
    <div className="sb hb sb-page">
      <div className="sb-head-row">
        <h1>{x(HM.health_journal_title)}</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="sb-btn sb-btn-secondary"
            disabled={prompting}
            onClick={() => void suggestPrompt()}
          >
            {prompting ? (
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles size={15} aria-hidden="true" />
            )}
            {x(prompting ? HM.health_ai_prompt_loading : HM.health_ai_prompt_btn)}
          </button>
          {!composing && (
            <button
              type="button"
              className="sb-btn sb-btn-primary"
              onClick={() => setComposing(true)}
            >
              <Plus size={15} aria-hidden="true" />
              {x(HM.health_journal_new)}
            </button>
          )}
        </div>
      </div>
      <p className="sb-sub">{x(HM.health_journal_sub)}</p>

      {composing && (
        <section className="sb-card sb-card-pad" style={{ marginTop: 18 }}>
          {prompt && (
            <div className="sb-note" style={{ marginBottom: 14 }}>
              <Sparkles size={15} aria-hidden="true" style={{ flexShrink: 0 }} />
              <span>
                <strong>{prompt}</strong>
                <br />
                <span style={{ fontSize: '0.9em' }}>{x(HM.health_ai_prompt_label)}</span>
              </span>
            </div>
          )}
          <EntryEditor onDone={() => setComposing(false)} />
        </section>
      )}

      <section className="sb-card sb-card-pad" style={{ marginTop: 18 }}>
        {entries.length === 0 ? (
          <div className="sb-empty">{x(HM.health_journal_empty)}</div>
        ) : (
          <div className="hb-rows">
            {entries.map((e) => (
              <EntryRow key={e.id} entry={e} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
