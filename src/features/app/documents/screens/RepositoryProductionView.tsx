import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Search } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { doclibMessages as M } from '@/i18n/messages/doclib'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useMdUp } from '@/lib/useMediaQuery'
import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { DocChip, JurisdictionPill } from '../components'
import { templateByTid } from '../data'
import { PRODUCTION_DOCUMENT_STATUSES, listDocuments } from '../productionApi'
import type { ProductionDocument, ProductionDocumentStatus } from '../productionApi'

/**
 * Document repository in production mode — real persistence on
 * public.hr_generated_documents (migration 0076). Leaner than the demo
 * register: search + status filter; signing states from migration 0077.
 */

const STATUS_LABEL: Record<ProductionDocumentStatus, (typeof M)[keyof typeof M]> = {
  draft: M.doclib_prod_status_draft,
  approved: M.doclib_prod_status_approved,
  archived: M.doclib_prod_status_archived,
  sent_for_signature: M.doclib_prod_status_sent,
  partially_signed: M.doclib_prod_status_partial,
  signed: M.doclib_prod_status_signed,
  voided: M.doclib_prod_status_voided,
  exported: M.doclib_prod_status_exported,
}

const STATUS_TONE: Record<ProductionDocumentStatus, 'neutral' | 'ok' | 'info' | 'warn' | 'risk'> = {
  draft: 'neutral',
  approved: 'ok',
  archived: 'info',
  sent_for_signature: 'info',
  partially_signed: 'warn',
  signed: 'ok',
  voided: 'risk',
  exported: 'ok',
}

const SELECT_CLASS =
  'cursor-pointer rounded-[9px] border border-border bg-surface px-[10px] py-[7px] text-[12.5px] font-medium text-text'
const TH_CLASS =
  'px-[14px] py-[11px] text-left text-[11px] font-bold tracking-[0.04em] text-text-muted uppercase whitespace-nowrap'
const TD_CLASS = 'px-[14px] py-[12px] align-middle'

function formatUpdated(iso: string, lang: 'en' | 'fr'): string {
  try {
    return new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso.slice(0, 10)
  }
}

export function RepositoryProductionView() {
  const { x, lang } = useI18n()
  const { organizationId } = useWorkspaceMode()
  const mdUp = useMdUp()

  const [rows, setRows] = useState<ProductionDocument[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ProductionDocumentStatus>('all')

  const load = useCallback(async () => {
    if (!organizationId) return
    setLoadFailed(false)
    try {
      setRows(await listDocuments(organizationId))
    } catch {
      setRows([])
      setLoadFailed(true)
    }
  }, [organizationId])

  useEffect(() => {
    void load()
  }, [load])

  const visible = useMemo(() => {
    const list = rows ?? []
    const q = query.trim().toLowerCase()
    return list.filter((doc) => {
      if (statusFilter !== 'all' && doc.status !== statusFilter) return false
      if (!q) return true
      return `${doc.title.en} ${doc.title.fr} ${doc.ref} ${doc.templateTid}`
        .toLowerCase()
        .includes(q)
    })
  }, [rows, query, statusFilter])

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.doclib_prod_empty_title)} />
  }

  const count = rows?.length ?? 0
  const countLabel =
    rows === null
      ? x(M.doclib_prod_loading)
      : `${count} ${x(count === 1 ? M.doclib_prod_count_one : M.doclib_prod_count_many)}`

  return (
    <div className="px-[18px] pb-[48px] pt-[8px] max-[640px]:px-[12px]">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[22px] font-bold tracking-[-0.02em] text-text">
            {x(M.doclib_repo_title)}
          </h1>
          <p className="mt-1 text-[13.5px] text-text-muted">{x(M.doclib_repo_subtitle)}</p>
        </div>
        <Link
          to="/app/documents/studio"
          className="inline-flex min-h-[40px] items-center rounded-[9px] bg-navy px-[14px] py-[8px] text-[12.5px] font-semibold text-white hover:opacity-90"
        >
          {x(M.doclib_repo_createFrom)}
        </Link>
      </header>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="relative min-w-[200px] flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={x(M.doclib_prod_searchPh)}
            className="w-full rounded-[9px] border border-border bg-surface py-[7px] pr-[10px] pl-[32px] text-[12.5px] text-text"
          />
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | ProductionDocumentStatus)}
          className={SELECT_CLASS}
          aria-label={x(M.doclib_prod_col_status)}
        >
          <option value="all">{x(M.doclib_prod_status_all)}</option>
          {PRODUCTION_DOCUMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {x(STATUS_LABEL[status])}
            </option>
          ))}
        </select>
        <span className="text-[12.5px] text-text-muted">{countLabel}</span>
      </div>

      {loadFailed && (
        <div className="mb-[14px] flex items-center justify-between gap-[12px] rounded-[11px] border border-risk-border bg-risk-bg px-[16px] py-[12px]">
          <span className="text-[13px] text-risk-fg">{x(M.doclib_prod_error)}</span>
          <button
            type="button"
            onClick={() => void load()}
            className="cursor-pointer rounded-[8px] border-none bg-surface px-[12px] py-[6px] font-sans text-[12px] font-bold text-text"
          >
            {x(M.doclib_prod_retry)}
          </button>
        </div>
      )}

      {rows !== null && rows.length === 0 && !loadFailed && (
        <div className="rounded-[12px] border border-dashed border-border bg-inset px-[24px] py-[40px] text-center">
          <FileText size={28} className="mx-auto mb-3 text-text-muted" aria-hidden="true" />
          <h2 className="font-display text-[16px] font-bold text-text">
            {x(M.doclib_prod_empty_title)}
          </h2>
          <p className="mx-auto mt-1 max-w-[420px] text-[13px] text-text-muted">
            {x(M.doclib_prod_empty_body)}
          </p>
          <Link
            to="/app/documents/studio"
            className="mt-4 inline-flex rounded-[8px] bg-navy px-[14px] py-[8px] text-[13px] font-semibold text-white"
          >
            {x(M.doclib_prod_go_studio)}
          </Link>
        </div>
      )}

      {rows !== null && rows.length > 0 && visible.length === 0 && (
        <p className="py-8 text-center text-[13px] text-text-muted">{x(M.doclib_prod_no_match)}</p>
      )}

      {visible.length > 0 && mdUp && (
        <div className="overflow-x-auto rounded-[12px] border border-border">
          <table className="w-full min-w-[640px] border-collapse text-[13px]">
            <thead className="bg-inset">
              <tr>
                <th className={TH_CLASS}>{x(M.doclib_prod_col_ref)}</th>
                <th className={TH_CLASS}>{x(M.doclib_prod_col_title)}</th>
                <th className={TH_CLASS}>{x(M.doclib_prod_col_template)}</th>
                <th className={TH_CLASS}>{x(M.doclib_prod_col_status)}</th>
                <th className={TH_CLASS}>{x(M.doclib_prod_col_updated)}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((doc) => {
                const template = templateByTid.get(doc.templateTid)
                return (
                  <tr key={doc.id} className="border-t border-border hover:bg-inset/60">
                    <td className={`${TD_CLASS} font-mono text-[12px] text-text-muted`}>
                      <Link to={`/app/documents/${doc.id}`} className="text-text hover:underline">
                        {doc.ref}
                      </Link>
                    </td>
                    <td className={TD_CLASS}>
                      <Link
                        to={`/app/documents/${doc.id}`}
                        className="font-semibold text-text hover:underline"
                      >
                        {x(doc.title)}
                      </Link>
                      <div className="mt-0.5">
                        <JurisdictionPill code={doc.jurisdiction} />
                      </div>
                    </td>
                    <td className={`${TD_CLASS} text-text-muted`}>
                      {template ? x(template.name) : doc.templateTid}
                    </td>
                    <td className={TD_CLASS}>
                      <DocChip tone={STATUS_TONE[doc.status]}>
                        {x(STATUS_LABEL[doc.status])}
                      </DocChip>
                    </td>
                    <td className={`${TD_CLASS} text-text-muted`}>
                      {formatUpdated(doc.updatedAt, lang)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {visible.length > 0 && !mdUp && (
        <div className="flex flex-col gap-[10px]">
          {visible.map((doc) => {
            const template = templateByTid.get(doc.templateTid)
            return (
              <Link
                key={doc.id}
                to={`/app/documents/${doc.id}`}
                className="block rounded-[12px] border border-border bg-surface p-[14px]"
              >
                <div className="text-[13.5px] font-semibold text-text">{x(doc.title)}</div>
                <div className="mt-[2px] font-mono text-[11px] text-text-faint">{doc.ref}</div>
                <dl className="mt-3 flex flex-col gap-[8px] text-[12px]">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[11px] font-bold tracking-[0.03em] text-text-muted uppercase">
                      {x(M.doclib_prod_col_template)}
                    </dt>
                    <dd className="m-0 min-w-0 text-right text-text-2">
                      {template ? x(template.name) : doc.templateTid}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[11px] font-bold tracking-[0.03em] text-text-muted uppercase">
                      {x(M.doclib_prod_col_status)}
                    </dt>
                    <dd className="m-0">
                      <DocChip tone={STATUS_TONE[doc.status]}>
                        {x(STATUS_LABEL[doc.status])}
                      </DocChip>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="shrink-0 text-[11px] font-bold tracking-[0.03em] text-text-muted uppercase">
                      {x(M.doclib_prod_col_updated)}
                    </dt>
                    <dd className="m-0 text-text-muted">{formatUpdated(doc.updatedAt, lang)}</dd>
                  </div>
                </dl>
                <div className="mt-2">
                  <JurisdictionPill code={doc.jurisdiction} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
