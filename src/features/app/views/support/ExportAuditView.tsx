import { useCallback, useEffect, useState } from 'react'
import { useI18n } from '@/i18n/context'
import { useMdUp } from '@/lib/useMediaQuery'
import { supportMessages as M } from '@/i18n/messages/support'
import { isCurrentUserAdmin } from '@/features/support/supportAdminApi'
import { listExportEvents, lookupExport } from '@/features/support/exportAuditApi'
import type {
  ExportAuditFilters,
  ExportEventRow,
  ExportSurface,
  ExportKind,
} from '@/features/support/exportAuditApi'

const SURFACES: readonly ExportSurface[] = ['docstudio', 'doclib', 'memory', 'advisor']
const KINDS: readonly ExportKind[] = ['pdf', 'word', 'link', 'json', 'text']
const PER_PAGE = 50

const selectClass =
  'rounded-[8px] border border-border bg-surface px-[10px] py-[7px] text-[13px] text-text'

function formatDateTime(iso: string, lang: 'en' | 'fr'): string {
  return new Date(iso).toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function shortId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id
}

/** Admin viewer for the export audit trail (`export_events`).
 *
 * Reads go through the `export-audit-trail` edge function (service-role,
 * is_admin-gated server-side) — the table has RLS enabled with no policies,
 * so the browser cannot read it directly. Supports filtering by surface and
 * kind, pagination, and forensic lookup of a single export id.
 */
export function ExportAuditView() {
  const { x, lang } = useI18n()
  const mdUp = useMdUp()
  const [admin, setAdmin] = useState<boolean | null>(null)
  const [filters, setFilters] = useState<ExportAuditFilters>({})
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<ExportEventRow[] | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [error, setError] = useState(false)
  const [lookupId, setLookupId] = useState('')
  const [lookupResult, setLookupResult] = useState<ExportEventRow | null | undefined>(undefined)

  useEffect(() => {
    isCurrentUserAdmin()
      .then(setAdmin)
      .catch(() => setAdmin(false))
  }, [])

  const loadList = useCallback(() => {
    if (admin !== true) return
    let cancelled = false
    setError(false)
    listExportEvents(filters, page, PER_PAGE)
      .then((result) => {
        if (cancelled) return
        setRows(result.rows)
        setTotal(result.total)
        setTotalPages(result.totalPages)
      })
      .catch((e: unknown) => {
        console.error('export audit: list failed', e)
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [admin, filters, page])

  useEffect(() => {
    const cleanup = loadList()
    return cleanup
  }, [loadList])

  function handleLookup() {
    const id = lookupId.trim()
    if (!id) return
    setLookupResult(undefined)
    lookupExport(id)
      .then((row) => setLookupResult(row))
      .catch(() => setLookupResult(null))
  }

  if (admin === false) {
    return (
      <div className="mx-auto max-w-[900px] px-[28px] pt-[24px]">
        <p className="m-0 rounded-[12px] border border-border bg-inset px-[16px] py-[12px] text-[14px] text-text-2">
          {x(M.export_audit_denied)}
        </p>
      </div>
    )
  }

  if (admin === null) {
    return (
      <div className="mx-auto max-w-[1180px] px-[28px] pt-[24px]">
        <p className="m-0 text-[14px] text-text-muted">{x(M.export_audit_loading)}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1180px] px-[28px] pt-[8px] pb-[64px] max-[640px]:px-[16px]">
      <header className="mb-[18px]">
        <h1 className="m-0 font-display text-[24px] font-semibold tracking-[-0.015em] text-text">
          {x(M.export_audit_title)}
        </h1>
        <p className="mt-[6px] max-w-[80ch] text-[13px] leading-[1.55] text-text-muted">
          {x(M.export_audit_intro)}
        </p>
      </header>

      {/* Forensic lookup */}
      <div className="mb-[20px] rounded-[12px] border border-border bg-inset px-[16px] py-[14px]">
        <label className="mb-[8px] block text-[12px] font-semibold uppercase tracking-wide text-text-muted">
          {x(M.export_audit_lookup_label)}
        </label>
        <div className="flex items-center gap-[8px]">
          <input
            type="text"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            placeholder={x(M.export_audit_lookup_placeholder)}
            className="flex-1 rounded-[8px] border border-border bg-surface px-[10px] py-[7px] text-[13px] text-text"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLookup()
            }}
          />
          <button
            type="button"
            onClick={handleLookup}
            className="rounded-[8px] border border-border bg-surface px-[14px] py-[7px] text-[13px] font-semibold text-text hover:bg-inset"
          >
            {x(M.export_audit_lookup_button)}
          </button>
        </div>
        {lookupResult === null && (
          <p className="mt-[8px] m-0 text-[13px] text-text-muted">
            {x(M.export_audit_lookup_not_found)}
          </p>
        )}
        {lookupResult && (
          <div className="mt-[12px] rounded-[8px] border border-border bg-surface px-[14px] py-[10px]">
            <ExportRowDetail row={lookupResult} lang={lang} x={x} />
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mb-[16px] flex flex-wrap items-center gap-[10px]">
        <select
          aria-label={x(M.export_audit_filter_surface)}
          value={filters.surface ?? 'all'}
          onChange={(e) => {
            const v = e.target.value
            setFilters((f) => ({ ...f, surface: v === 'all' ? undefined : (v as ExportSurface) }))
            setPage(1)
          }}
          className={selectClass}
        >
          <option value="all">
            {x(M.export_audit_filter_surface)}: {x(M.export_audit_filter_all)}
          </option>
          {SURFACES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          aria-label={x(M.export_audit_filter_kind)}
          value={filters.kind ?? 'all'}
          onChange={(e) => {
            const v = e.target.value
            setFilters((f) => ({ ...f, kind: v === 'all' ? undefined : (v as ExportKind) }))
            setPage(1)
          }}
          className={selectClass}
        >
          <option value="all">
            {x(M.export_audit_filter_kind)}: {x(M.export_audit_filter_all)}
          </option>
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        {rows && (
          <span className="text-[13px] text-text-muted">
            {x(M.export_audit_total)}: <span className="font-semibold text-text-2">{total}</span>
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="m-0 mb-[16px] rounded-[12px] border border-risk-border bg-risk-bg px-[16px] py-[12px] text-[14px] text-risk-fg">
          {x(M.export_audit_error)}
        </p>
      )}

      {/* Table */}
      {rows && rows.length === 0 && !error && (
        <p className="m-0 rounded-[12px] border border-border bg-inset px-[16px] py-[12px] text-[14px] text-text-2">
          {x(M.export_audit_empty)}
        </p>
      )}
      {rows && rows.length > 0 && mdUp && (
        <div className="overflow-x-auto rounded-[12px] border border-border">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-border bg-inset text-left">
                <th className="px-[12px] py-[8px] font-semibold text-text-muted">
                  {x(M.export_audit_col_id)}
                </th>
                <th className="px-[12px] py-[8px] font-semibold text-text-muted">
                  {x(M.export_audit_col_surface)}
                </th>
                <th className="px-[12px] py-[8px] font-semibold text-text-muted">
                  {x(M.export_audit_col_kind)}
                </th>
                <th className="px-[12px] py-[8px] font-semibold text-text-muted">
                  {x(M.export_audit_col_title)}
                </th>
                <th className="px-[12px] py-[8px] font-semibold text-text-muted">
                  {x(M.export_audit_col_user)}
                </th>
                <th className="px-[12px] py-[8px] font-semibold text-text-muted">
                  {x(M.export_audit_col_chars)}
                </th>
                <th className="px-[12px] py-[8px] font-semibold text-text-muted">
                  {x(M.export_audit_col_created)}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-b-0">
                  <td className="px-[12px] py-[8px] font-mono text-text-2" title={row.id}>
                    {shortId(row.id)}
                  </td>
                  <td className="px-[12px] py-[8px] text-text-2">{row.surface}</td>
                  <td className="px-[12px] py-[8px] text-text-2">{row.kind}</td>
                  <td className="px-[12px] py-[8px] text-text-2">{row.title || '—'}</td>
                  <td
                    className="px-[12px] py-[8px] font-mono text-text-muted"
                    title={row.user_id ?? ''}
                  >
                    {row.user_id ? shortId(row.user_id) : '—'}
                  </td>
                  <td className="px-[12px] py-[8px] text-text-muted">
                    {row.content_chars.toLocaleString()}
                  </td>
                  <td className="px-[12px] py-[8px] text-text-muted">
                    {formatDateTime(row.created_at, lang)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows && rows.length > 0 && !mdUp && (
        <div className="flex flex-col gap-[10px]">
          {rows.map((row) => (
            <div
              key={row.id}
              className="rounded-[12px] border border-border bg-surface px-[14px] py-[12px]"
            >
              <div className="font-mono text-[12px] text-text-muted" title={row.id}>
                {shortId(row.id)}
              </div>
              <div className="mt-1 text-[13.5px] font-semibold text-text">{row.title || '—'}</div>
              <dl className="mt-3 grid grid-cols-1 gap-y-[6px] text-[12px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-text-muted">{x(M.export_audit_col_surface)}</dt>
                  <dd className="m-0 text-text-2">{row.surface}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-text-muted">{x(M.export_audit_col_kind)}</dt>
                  <dd className="m-0 text-text-2">{row.kind}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-text-muted">{x(M.export_audit_col_user)}</dt>
                  <dd className="m-0 font-mono text-text-muted">
                    {row.user_id ? shortId(row.user_id) : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-text-muted">{x(M.export_audit_col_chars)}</dt>
                  <dd className="m-0 text-text-muted">{row.content_chars.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-text-muted">{x(M.export_audit_col_created)}</dt>
                  <dd className="m-0 text-text-muted">{formatDateTime(row.created_at, lang)}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-[16px] flex items-center gap-[12px]">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-[8px] border border-border bg-surface px-[14px] py-[7px] text-[13px] font-semibold text-text disabled:opacity-40"
          >
            {x(M.export_audit_prev)}
          </button>
          <span className="text-[13px] text-text-muted">
            {x(M.export_audit_page)} {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-[8px] border border-border bg-surface px-[14px] py-[7px] text-[13px] font-semibold text-text disabled:opacity-40"
          >
            {x(M.export_audit_next)}
          </button>
        </div>
      )}
    </div>
  )
}

/** Detail card for a single export event (forensic lookup result). */
function ExportRowDetail({
  row,
  lang,
  x,
}: {
  row: ExportEventRow
  lang: 'en' | 'fr'
  x: (b: { en: string; fr: string }) => string
}) {
  return (
    <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-[16px] gap-y-[6px] text-[13px]">
      <dt className="font-semibold text-text-muted">{x(M.export_audit_col_id)}</dt>
      <dd className="m-0 font-mono text-text">{row.id}</dd>
      <dt className="font-semibold text-text-muted">{x(M.export_audit_col_surface)}</dt>
      <dd className="m-0 text-text">{row.surface}</dd>
      <dt className="font-semibold text-text-muted">{x(M.export_audit_col_kind)}</dt>
      <dd className="m-0 text-text">{row.kind}</dd>
      <dt className="font-semibold text-text-muted">{x(M.export_audit_col_title)}</dt>
      <dd className="m-0 text-text">{row.title || '—'}</dd>
      <dt className="font-semibold text-text-muted">{x(M.export_audit_col_user)}</dt>
      <dd className="m-0 font-mono text-text">{row.user_id ?? '—'}</dd>
      <dt className="font-semibold text-text-muted">{x(M.export_audit_col_chars)}</dt>
      <dd className="m-0 text-text">{row.content_chars.toLocaleString()}</dd>
      <dt className="font-semibold text-text-muted">{x(M.export_audit_col_lang)}</dt>
      <dd className="m-0 text-text">{row.lang}</dd>
      <dt className="font-semibold text-text-muted">{x(M.export_audit_col_created)}</dt>
      <dd className="m-0 text-text">{formatDateTime(row.created_at, lang)}</dd>
      <dt className="font-semibold text-text-muted">{x(M.export_audit_col_hash)}</dt>
      <dd className="m-0 break-all font-mono text-[11.5px] text-text-muted">
        {row.content_sha256}
      </dd>
    </dl>
  )
}
