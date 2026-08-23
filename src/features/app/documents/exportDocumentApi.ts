import { supabase } from '@/lib/supabaseClient'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export interface DocumentExportStorageMeta {
  storagePath: string
  fileSha256: string
  sizeBytes: number
}

/**
 * Persist an HR document export row + audit event after a successful download.
 * Links to export_events when the export-protection pipeline wrote a server row.
 */
export async function recordDocumentExport(
  organizationId: string,
  documentId: string,
  versionNumber: number,
  format: 'pdf',
  exportId: string,
  recordedRemotely: boolean,
  actorLabel: string,
  storage?: DocumentExportStorageMeta,
): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')

  const exportEventId = recordedRemotely && UUID_RE.test(exportId) ? exportId : null
  const now = new Date().toISOString()

  const { error: exportError } = await supabase.from('hr_document_exports').insert({
    organization_id: organizationId,
    document_id: documentId,
    version_number: versionNumber,
    format,
    export_event_id: exportEventId,
    storage_path: storage?.storagePath ?? null,
    file_sha256: storage?.fileSha256 ?? null,
    size_bytes: storage?.sizeBytes ?? null,
    content_type: 'application/pdf',
  })
  if (exportError) throw exportError

  const { error: docError } = await supabase
    .from('hr_generated_documents')
    .update({
      status: 'exported',
      updated_at: now,
    })
    .eq('id', documentId)
    .eq('organization_id', organizationId)
  if (docError) throw docError

  const { error: auditError } = await supabase.from('hr_document_audit_events').insert({
    organization_id: organizationId,
    document_id: documentId,
    event_type: 'document_exported',
    actor_label: actorLabel,
    meta: storage
      ? `PDF · ${exportId.slice(0, 8)} · stored`
      : `PDF · ${exportId.slice(0, 8)}`,
  })
  if (auditError) throw auditError
}
