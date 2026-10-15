import '@/features/invest/portal/strategies.css'
import './health.css'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2, Pencil, Plus, Sparkles } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { healthMessages as HM } from '@/i18n/messages/health'
import { useHealthData } from '@/features/health/data/HealthDataContext'
import {
  addJournalEntry,
  deleteJournalEntry,
  healthAiPrompt,
  listJournalEntriesBefore,
  shareEntryWithMira,
  unshareEntryFromMira,
  updateJournalEntry,
} from '@/features/health/data/api'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useSessionDraft } from '@/components/chat/portalChatUtils'
import { fillBi } from '@/lib/format'
import type { HealthJournalEntry } from '@/features/health/data/types'
import { fmtRelativeDateTime } from './healthUi'
import { HealthDataError } from './HealthDataError'
import { HealthLoading } from './HealthLoading'
import { MiraNote } from './MiraNote'
import { useHealthHead } from './useHealthHead'
import { useUndoableDelete } from './useUndoableDelete'

function EntryEditor({
  initial,
  entryId,
  shared,
  onDone,
}: {
  initial?: { title: string; body: string }
  entryId?: string
  /* Editing a shared entry changes what Mira reads — stated inline so the
     consent stays honest at the moment the shared text changes. */
  shared?: boolean
  onDone: () => void
}) {
  const { x } = useI18n()
  const { refresh } = useHealthData()
  const { showToast } = useToasts()
  /* Compose-mode drafts persist in sessionStorage — navigating away or a
     reload mid-entry doesn't lose the writing. Edit mode passes a null key
     (a saved row's edits stay transient; the arm-cancel guard covers slips)
     and simply reads `initial` like before. */
  const [title, setTitle] = useSessionDraft(
    entryId ? null : 'dutiva:health:draft:journal-title',
    initial?.title ?? '',
  )
  const [body, setBody] = useSessionDraft(
    entryId ? null : 'dutiva:health:draft:journal-body',
    initial?.body ?? '',
  )
  const [saving, setSaving] = useState(false)
  const [armCancel, setArmCancel] = useState(false)

  const dirty = body !== (initial?.body ?? '') || title !== (initial?.title ?? '')
  /* The requirement hint's id must be unique per editor — two rows open at
     once would otherwise both describe their button by the same node. */
  const reqId = entryId ? `hb-jb-req-${entryId}` : 'hb-jb-req'

  const save = async () => {
    const trimmed = body.trim()
    if (!trimmed || saving) return
    /* A save that changes nothing gets no write — and no false "Edited"
       stamp on the row. */
    if (entryId && trimmed === (initial?.body ?? '').trim() && title.trim() === initial?.title.trim()) {
      onDone()
      return
    }
    setSaving(true)
    try {
      if (entryId) await updateJournalEntry(entryId, { title, body: trimmed })
      else await addJournalEntry({ title, body: trimmed })
      /* refresh() never rejects — its failures surface as the layout's
         stale-data note, so awaiting it here can't false-report a save. */
      await refresh()
      showToast(HM.health_journal_saved)
      /* Saved = the draft is consumed — leave no residue for the next open. */
      setTitle('')
      setBody('')
      onDone()
    } catch {
      showToast(HM.health_journal_save_failed)
    } finally {
      setSaving(false)
    }
  }

  /* A cancel that would silently drop written words arms once first —
     losing a paragraph to a stray click is the worst failure a journal
     can have. */
  const cancel = () => {
    if (dirty && body.trim() && !armCancel) {
      setArmCancel(true)
      return
    }
    /* A confirmed discard clears the stored draft too — "cancel" means let
       go, so reopening the composer doesn't resurrect the abandoned text. */
    setTitle('')
    setBody('')
    onDone()
  }

  return (
    <form
      className="flex flex-col gap-[14px]"
      onSubmit={(e) => {
        e.preventDefault()
        void save()
      }}
    >
      <div className="sb-field">
        <label className="sb-flabel" htmlFor={entryId ? `hb-jt-${entryId}` : 'hb-jt'}>
          {x(HM.health_journal_entry_title)}
        </label>
        <input
          id={entryId ? `hb-jt-${entryId}` : 'hb-jt'}
          className="sb-input"
          style={{ width: '100%', minHeight: 44, fontSize: 15 }}
          value={title}
          autoFocus={!entryId}
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
          autoFocus={!!entryId}
          onChange={(e) => setBody(e.target.value)}
          placeholder={x(HM.health_journal_body_ph)}
        />
      </div>
      {shared && <p className="sb-helper">{x(HM.health_journal_shared_edit_hint)}</p>}
      <div className="sb-form-actions" style={{ gap: 10 }}>
        <button
          type="button"
          className={`sb-btn ${armCancel ? 'sb-btn-danger sb-armed' : 'sb-btn-secondary'}`}
          disabled={saving}
          onClick={cancel}
          onBlur={() => setArmCancel(false)}
        >
          {armCancel ? x(HM.health_journal_cancel_confirm) : x(HM.health_journal_cancel)}
        </button>
        <button
          type="submit"
          className="sb-btn sb-btn-primary"
          disabled={!body.trim() || saving}
          aria-describedby={!body.trim() ? reqId : undefined}
        >
          {saving && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
          {x(HM.health_journal_save)}
        </button>
        {!body.trim() && (
          <p className="sb-helper" id={reqId} style={{ margin: 0 }}>
            {x(HM.health_journal_body_required)}
          </p>
        )}
      </div>
    </form>
  )
}

function EntryRow({
  entry,
  onDeleted,
  onRestored,
}: {
  entry: HealthJournalEntry
  onDeleted: (id: string) => void
  onRestored: (id: string) => void
}) {
  const { x, lang } = useI18n()
  const { refresh } = useHealthData()
  const { showToast } = useToasts()
  const { queueDelete } = useUndoableDelete()
  const [editing, setEditing] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [miraLine, setMiraLine] = useState<string | null>(null)

  const title = entry.title.trim() || x(HM.health_journal_untitled)
  /* Long bodies clamp to a few lines — the list stays a list, not a wall. */
  const clampable = entry.body.length > 240 || entry.body.split('\n').length > 4

  /* One click hides the row; the real delete only fires when the undo
     toast lapses. deletedIds hides it locally — including the copy parked
     in the paged `earlier` list — and onUndo drops the id so it reappears
     untouched. A refresh mid-window can't resurrect it: the id stays in
     the filter until the commit lands. */
  const remove = () =>
    queueDelete({
      key: `entry:${entry.id}`,
      message: fillBi(HM.health_undo_deleted, { label: title }),
      commit: () => deleteJournalEntry(entry.id),
      onOptimistic: () => onDeleted(entry.id),
      onUndo: () => onRestored(entry.id),
      onCommitted: () => void refresh(),
    })

  /* Explicit per-entry consent — the press stamps shared_at on the row
     (that's the record), only this entry's body reaches Mira, and the
     excerpt joins her context until revoked. Her reply streams in here and
     lands in the chat thread. */
  const share = async () => {
    if (sharing) return
    setSharing(true)
    try {
      const out = await shareEntryWithMira(entry.id, lang, setMiraLine)
      setMiraLine(out.reply)
      await refresh()
    } catch {
      showToast(HM.health_journal_share_failed)
    } finally {
      setSharing(false)
    }
  }

  /* Revocation — shared_at clears, her context loses the excerpt at once. */
  const unshare = async () => {
    if (sharing) return
    setSharing(true)
    try {
      await unshareEntryFromMira(entry.id)
      setMiraLine(null)
      await refresh()
    } catch {
      showToast(HM.health_journal_unshare_failed)
    } finally {
      setSharing(false)
    }
  }

  if (editing) {
    return (
      <div className="hb-row" role="listitem" style={{ display: 'block' }}>
        <EntryEditor
          initial={{ title: entry.title, body: entry.body }}
          entryId={entry.id}
          shared={entry.sharedAt !== null}
          onDone={() => setEditing(false)}
        />
      </div>
    )
  }

  return (
    <div role="listitem">
      <div className="hb-row">
        <div className="hb-row-main">
          <h3 className="hb-row-title">{title}</h3>
          <p className={`hb-row-body${clampable && !expanded ? ' is-clamped' : ''}`}>
            {entry.body}
          </p>
          {clampable && (
            <button
              type="button"
              className="hb-row-expand"
              onClick={() => setExpanded((v) => !v)}
            >
              {x(expanded ? HM.health_journal_collapse : HM.health_journal_expand)}
            </button>
          )}
          <span className="hb-row-meta">
            {fmtRelativeDateTime(entry.createdAt, lang)}
            {entry.updatedAt !== entry.createdAt &&
              ` · ${x(HM.health_journal_edited).replace('{date}', fmtRelativeDateTime(entry.updatedAt, lang))}`}
          </span>
        </div>
        <div className="hb-row-side hb-row-actions">
          {entry.sharedAt !== null || miraLine !== null ? (
            /* Consent is recorded on the row — the state survives reloads
               and the same button now revokes it. */
            <>
              <span className="hb-share-pill">
                {x(HM.health_journal_shared_mira)}
              </span>
              <button
                type="button"
                className="sb-btn sb-btn-secondary sb-btn-sm"
                disabled={sharing}
                aria-label={x(HM.health_journal_unshare_named).replace('{title}', title)}
                title={x(HM.health_journal_unshare_hint)}
                onClick={() => void unshare()}
              >
                {sharing ? (
                  <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                ) : null}
                {x(HM.health_journal_unshare_mira)}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="sb-btn sb-btn-secondary sb-btn-sm"
              disabled={sharing}
              aria-label={x(HM.health_journal_share_named).replace('{title}', title)}
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
            aria-label={x(HM.health_journal_edit_named).replace('{title}', title)}
            onClick={() => setEditing(true)}
          >
            <Pencil size={12} aria-hidden="true" />
            {x(HM.health_journal_edit)}
          </button>
          <button
            type="button"
            className="sb-btn sb-btn-secondary sb-btn-sm"
            aria-label={x(HM.health_journal_delete_named).replace('{title}', title)}
            onClick={remove}
          >
            {x(HM.health_journal_delete)}
          </button>
        </div>
      </div>
      {miraLine && <MiraNote line={miraLine} onDismiss={() => setMiraLine(null)} />}
    </div>
  )
}

export function HealthJournalPage() {
  const { x, lang } = useI18n()
  const { state, loading } = useHealthData()
  const { showToast } = useToasts()
  useHealthHead(HM.health_journal_title, HM.health_journal_sub)
  const [searchParams, setSearchParams] = useSearchParams()
  const [composing, setComposing] = useState(searchParams.get('new') === '1')
  const [prompt, setPrompt] = useState<string | null>(null)
  const [prompting, setPrompting] = useState(false)
  const [earlier, setEarlier] = useState<HealthJournalEntry[]>([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [query, setQuery] = useState('')
  const [sharedOnly, setSharedOnly] = useState(false)
  /* Rows hidden while their delete waits out the undo window (and after
     it lands) — the filter covers both the fresh page and the paged
     `earlier` archive, and a mid-window refresh can't resurrect a row
     that's still on the server. */
  const [deletedIds, setDeletedIds] = useState<ReadonlySet<string>>(new Set())

  /* /health/journal?new=1 — the Overview's "New journal entry" CTA lands
     here with the editor already open. Consume the param once so a later
     Cancel doesn't re-open it on the same visit. */
  useEffect(() => {
    if (searchParams.get('new') !== '1') return
    setComposing(true)
    const next = new URLSearchParams(searchParams)
    next.delete('new')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const closeComposer = () => {
    setComposing(false)
    /* A suggested prompt belongs to the draft session it opened — it
       shouldn't hover over the next empty editor. */
    setPrompt(null)
  }

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

  /* The state fetch keeps the newest JOURNAL_CAP entries — the archive
     pages back from the oldest row shown. `earlier` survives a refresh;
     dedupe by id in case a save re-orders the window. */
  const fresh = state?.entries ?? []
  const freshIds = new Set(fresh.map((e) => e.id))
  const entries = [...fresh, ...earlier.filter((e) => !freshIds.has(e.id))].filter(
    (e) => !deletedIds.has(e.id),
  )
  const entriesTotal = state?.entriesTotal ?? entries.length
  const hasMore = entries.length < entriesTotal

  const q = query.trim().toLowerCase()
  const visible = entries.filter(
    (e) =>
      (!sharedOnly || e.sharedAt !== null) &&
      (!q || `${e.title} ${e.body}`.toLowerCase().includes(q)),
  )

  const loadMore = async () => {
    const oldest = entries[entries.length - 1]
    if (!oldest || loadingMore) return
    setLoadingMore(true)
    try {
      const rows = await listJournalEntriesBefore({ createdAt: oldest.createdAt, id: oldest.id })
      setEarlier((cur) => [...cur, ...rows])
    } catch {
      showToast(HM.health_journal_load_failed)
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading) return <HealthLoading />
  if (!state) return <HealthDataError />

  return (
    <div className="sb hb sb-page">
      <div className="sb-head-row">
        <h1>{x(HM.health_journal_title)}</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="sb-btn sb-btn-secondary"
            /* A draft is open — a fresh prompt would swap the seed line
               under half-written prose. */
            disabled={prompting || composing}
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
        <p className="sb-helper" style={{ margin: '-6px 0 0' }}>
          {x(HM.health_journal_prompt_busy)}
        </p>
      )}

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
          <EntryEditor onDone={closeComposer} />
        </section>
      )}

      <section className="sb-card sb-card-pad" style={{ marginTop: 18 }}>
        {entries.length === 0 ? (
          <div className="sb-empty">
            {x(HM.health_journal_empty)}
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                className="sb-btn sb-btn-secondary sb-btn-sm"
                onClick={() => setComposing(true)}
              >
                <Plus size={13} aria-hidden="true" />
                {x(HM.health_journal_empty_cta)}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-[10px]" style={{ marginBottom: 4 }}>
              <div className="sb-field" style={{ marginBottom: 0, flex: '1 1 200px' }}>
                <label className="sr-only" htmlFor="hb-j-search">
                  {x(HM.health_journal_search)}
                </label>
                <input
                  id="hb-j-search"
                  className="sb-input"
                  style={{ minHeight: 38 }}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={x(HM.health_journal_search)}
                />
              </div>
              <button
                type="button"
                className={`sb-btn sb-btn-sm ${sharedOnly ? 'sb-btn-primary' : 'sb-btn-secondary'}`}
                aria-pressed={sharedOnly}
                onClick={() => setSharedOnly((v) => !v)}
              >
                <Sparkles size={12} aria-hidden="true" />
                {x(HM.health_journal_filter_shared)}
              </button>
            </div>
            {visible.length === 0 ? (
              <div className="sb-empty">{x(HM.health_journal_no_results)}</div>
            ) : (
              <div className="hb-rows" role="list">
                {visible.map((e) => (
                  <EntryRow
                    key={e.id}
                    entry={e}
                    onDeleted={(id) =>
                      setDeletedIds((cur) => new Set(cur).add(id))
                    }
                    onRestored={(id) =>
                      setDeletedIds((cur) => {
                        const next = new Set(cur)
                        next.delete(id)
                        return next
                      })
                    }
                  />
                ))}
              </div>
            )}
            {hasMore && (
              <div className="hb-pager">
                <button
                  type="button"
                  className="sb-btn sb-btn-secondary sb-btn-sm"
                  disabled={loadingMore}
                  onClick={() => void loadMore()}
                >
                  {loadingMore && (
                    <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                  )}
                  {x(HM.health_journal_load_more)}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
