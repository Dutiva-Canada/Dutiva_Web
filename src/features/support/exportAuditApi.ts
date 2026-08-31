import { supabase } from '@/lib/supabaseClient'

/**
 * Admin read-only API for the export audit trail (`export_events`).
 *
 * The table has RLS enabled with **no policies** — service-role only — so
 * the browser cannot read it directly. All reads go through the
 * `export-audit-trail` edge function, which checks `is_admin` server-side
 * and queries with the service role. No mutations are exposed: the table is
 * written only by `record-export` (service role via `claim_export_slot`).
 *
 * See docs/EXPORT_PROTECTION.md for the threat model and the three
 * fingerprint channels this trail resolves.
 */

export type ExportSurface = 'docstudio' | 'doclib' | 'memory' | 'advisor'
export type ExportKind = 'pdf' | 'word' | 'link' | 'json' | 'text'

export interface ExportEventRow {
  id: string
  user_id: string | null
  surface: ExportSurface
  kind: ExportKind
  title: string
  content_sha256: string
  content_chars: number
  lang: 'en' | 'fr'
  created_at: string
}

export interface ExportAuditFilters {
  surface?: ExportSurface
  kind?: ExportKind
  userId?: string
  /** ISO date lower bound (inclusive). */
  from?: string
  /** ISO date upper bound (inclusive). */
  to?: string
}

export interface ExportAuditPage {
  rows: ExportEventRow[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface ExportAuditLookup {
  row: ExportEventRow
}

/** Resolve a single export id to its audit row (the forensic use case). */
export async function lookupExport(exportId: string): Promise<ExportEventRow | null> {
  if (!supabase) return null
  const { data, error } = await supabase.functions.invoke<ExportAuditLookup>('export-audit-trail', {
    body: { exportId },
  })
  if (error || !data?.row) return null
  return data.row
}

/** List export events with optional filters and pagination (1-based page). */
export async function listExportEvents(
  filters: ExportAuditFilters = {},
  page = 1,
  perPage = 50,
): Promise<ExportAuditPage> {
  if (!supabase) {
    return { rows: [], total: 0, page, perPage, totalPages: 0 }
  }
  const { data, error } = await supabase.functions.invoke<ExportAuditPage>('export-audit-trail', {
    body: { ...filters, page, perPage },
  })
  if (error || !data) {
    throw new Error(`export-audit-trail: ${error?.message ?? 'no data returned'}`)
  }
  return data
}
