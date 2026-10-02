import '@/features/invest/portal/strategies.css'
import './health.css'
import { useState } from 'react'
import { Loader2, Pencil, Plus } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { healthMessages as HM } from '@/i18n/messages/health'
import { useHealthData } from '@/features/health/data/HealthDataContext'
import { addJournalEntry, deleteJournalEntry, updateJournalEntry } from '@/features/health/data/api'
import type { HealthJournalEntry } from '@/features/health/data/types'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { fmtDateTime } from './healthUi'
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
  const [editing, setEditing] = useState(false)
  const [armDelete, setArmDelete] = useState(false)

  const remove = async () => {
    if (!armDelete) {
      setArmDelete(true)
      return
    }
    await deleteJournalEntry(entry.id)
    await refresh()
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
  )
}

export function HealthJournalPage() {
  const { x } = useI18n()
  const { state } = useHealthData()
  useHealthHead(HM.health_journal_title, HM.health_journal_sub)
  const [composing, setComposing] = useState(false)

  const entries = state?.entries ?? []

  return (
    <div className="sb hb sb-page">
      <div className="sb-head-row">
        <h1>{x(HM.health_journal_title)}</h1>
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
      <p className="sb-sub">{x(HM.health_journal_sub)}</p>

      {composing && (
        <section className="sb-card sb-card-pad" style={{ marginTop: 18 }}>
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
