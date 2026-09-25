import { useEffect, useState } from 'react'
import { FileText, Link2, Trash2 } from 'lucide-react'
import { WorkspaceLink as Link } from '@/features/app/workspaceRoot/WorkspaceLink'
import { useI18n } from '@/i18n/context'
import type { Bi } from '@/i18n/core'
import { financeMessages as M } from '@/i18n/messages/finance'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { listDocuments } from '@/features/app/documents/productionApi'
import type { ProductionDocument } from '@/features/app/documents/productionApi'
import { useFinanceData } from '../data/useFinanceData'

/**
 * Documents linked to a deal or holding (finance_document_links, 0175).
 * Renders the snapshot (ref + bilingual title) with a deep link into the
 * Documents module; production orgs can link a document picked from their
 * generated-document library (manual ref/title fallback if the picker
 * can't load).
 */
export function DocumentLinks({ dealId, holdingId }: { dealId?: string; holdingId?: string }) {
  const { x } = useI18n()
  const { showToast } = useToasts()
  const { state, canWrite, hasSupabase, removeDocumentLink } = useFinanceData()
  const { organization } = useWorkspaceMode()
  const [showForm, setShowForm] = useState(false)

  const links = state.documentLinks.filter(
    (l) => (dealId && l.dealId === dealId) || (holdingId && l.holdingId === holdingId),
  )

  if (links.length === 0 && !canWrite) return null

  const handleRemove = async (id: string) => {
    if (!window.confirm(x(M.finance_doc_link_remove_confirm))) return
    await removeDocumentLink(id)
  }

  return (
    <div className="mt-[8px] flex flex-col gap-[4px]">
      <div className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-text-faint">
        {x(M.finance_doc_links_title)}
      </div>
      {links.length === 0 ? (
        <div className="text-[12px] text-text-muted">{x(M.finance_doc_link_none)}</div>
      ) : (
        <ul className="m-0 flex flex-col gap-[3px] p-0">
          {links.map((link) => (
            <li key={link.id} className="flex items-center justify-between gap-[8px]">
              <Link
                to={`/app/documents/${link.documentId}`}
                className="flex min-w-0 items-center gap-[6px] text-[12.5px] font-medium text-accent no-underline hover:underline"
              >
                <FileText className="size-[13px] shrink-0 text-text-faint" aria-hidden />
                <span className="truncate">
                  {link.title ? x(link.title) : link.documentId}
                  {link.documentRef ? ` · ${link.documentRef}` : ''}
                </span>
              </Link>
              {canWrite && (
                <button
                  type="button"
                  onClick={() => handleRemove(link.id)}
                  aria-label={x(M.finance_doc_link_remove)}
                  title={x(M.finance_doc_link_remove)}
                  className="shrink-0 text-text-faint hover:text-text"
                >
                  <Trash2 className="size-[13px]" aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {canWrite && (
        <div className="mt-[2px]">
          {!showForm ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex items-center gap-[5px] text-[12px] font-semibold text-accent"
            >
              <Link2 className="size-[13px]" aria-hidden />
              {x(M.finance_doc_link_add)}
            </button>
          ) : (
            <DocumentLinkForm
              orgId={organization?.id}
              hasSupabase={hasSupabase}
              dealId={dealId}
              holdingId={holdingId}
              onCancel={() => setShowForm(false)}
              onLinked={() => setShowForm(false)}
              onError={() => showToast(M.finance_doc_link_save_failed, 'info')}
            />
          )}
        </div>
      )}
    </div>
  )
}

function DocumentLinkForm({
  orgId,
  hasSupabase,
  dealId,
  holdingId,
  onCancel,
  onLinked,
  onError,
}: {
  orgId?: string
  hasSupabase: boolean
  dealId?: string
  holdingId?: string
  onCancel: () => void
  onLinked: () => void
  onError: () => void
}) {
  const { x } = useI18n()
  const { addDocumentLink } = useFinanceData()
  const [docs, setDocs] = useState<ProductionDocument[]>([])
  const [pickerFailed, setPickerFailed] = useState(false)
  const [docId, setDocId] = useState('')
  const [ref, setRef] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [titleFr, setTitleFr] = useState('')

  useEffect(() => {
    if (!orgId || !hasSupabase) {
      setPickerFailed(true)
      return
    }
    let cancelled = false
    listDocuments(orgId)
      .then((rows) => {
        if (cancelled) return
        if (rows.length === 0) {
          setPickerFailed(true)
          return
        }
        setDocs(rows.slice(0, 20))
        setDocId(rows[0]!.id)
      })
      .catch(() => {
        if (!cancelled) setPickerFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [orgId, hasSupabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const pickerDoc = docs.find((d) => d.id === docId)
    const created = await addDocumentLink({
      dealId,
      holdingId,
      documentId: pickerDoc ? pickerDoc.id : docId,
      documentRef: pickerDoc ? pickerDoc.ref : ref.trim() || undefined,
      title: pickerDoc
        ? pickerDoc.title
        : titleEn.trim() || titleFr.trim()
          ? ({ en: titleEn.trim() || titleFr.trim(), fr: titleFr.trim() || titleEn.trim() } satisfies Bi)
          : undefined,
    })
    if (!created) {
      onError()
      return
    }
    onLinked()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-[6px] rounded-[8px] bg-inset p-[8px]"
    >
      {!pickerFailed && docs.length > 0 ? (
        <label className="flex flex-col gap-[3px] text-[12px] text-text-muted">
          {x(M.finance_doc_link_pick)}
          <select
            value={docId}
            onChange={(e) => setDocId(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[5px] text-[12.5px] text-text"
          >
            {docs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.ref} — {x(d.title)}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <>
          <label className="flex flex-col gap-[3px] text-[12px] text-text-muted">
            {x(M.finance_doc_link_ref)}
            <input
              type="text"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="DOC-2026-0000"
              className="rounded-[6px] border border-border bg-surface px-[8px] py-[5px] text-[12.5px] text-text"
            />
          </label>
          <div className="grid grid-cols-2 gap-[6px]">
            <label className="flex flex-col gap-[3px] text-[12px] text-text-muted">
              {x(M.finance_doc_link_title_en)}
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                className="rounded-[6px] border border-border bg-surface px-[8px] py-[5px] text-[12.5px] text-text"
              />
            </label>
            <label className="flex flex-col gap-[3px] text-[12px] text-text-muted">
              {x(M.finance_doc_link_title_fr)}
              <input
                type="text"
                value={titleFr}
                onChange={(e) => setTitleFr(e.target.value)}
                className="rounded-[6px] border border-border bg-surface px-[8px] py-[5px] text-[12.5px] text-text"
              />
            </label>
          </div>
        </>
      )}
      <div className="flex gap-[6px]">
        <button
          type="submit"
          className="rounded-[6px] bg-navy px-[8px] py-[4px] text-[12px] font-semibold text-white"
        >
          {x(M.finance_doc_link_save)}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[6px] bg-surface px-[8px] py-[4px] text-[12px] font-semibold text-text-2 border border-border"
        >
          {x(M.finance_cancel)}
        </button>
      </div>
    </form>
  )
}
