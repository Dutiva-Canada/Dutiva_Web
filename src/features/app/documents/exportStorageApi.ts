import { supabase } from '@/lib/supabaseClient'

const BUCKET = 'hr-document-exports'

export function exportStoragePath(
  organizationId: string,
  documentId: string,
  exportId: string,
): string {
  return `${organizationId}/${documentId}/${exportId}.pdf`
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes.buffer as ArrayBuffer)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function uploadDocumentExportPdf(
  organizationId: string,
  documentId: string,
  exportId: string,
  bytes: Uint8Array,
): Promise<{ storagePath: string; fileSha256: string; sizeBytes: number }> {
  if (!supabase) throw new Error('Supabase is not configured')
  const storagePath = exportStoragePath(organizationId, documentId, exportId)
  const fileSha256 = await sha256Hex(bytes)
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, bytes, {
    contentType: 'application/pdf',
    upsert: true,
  })
  if (error) throw error
  return { storagePath, fileSha256, sizeBytes: bytes.byteLength }
}

export async function createDocumentExportDownloadUrl(
  storagePath: string,
  expiresInSeconds = 3600,
): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds)
  if (error) throw error
  if (!data?.signedUrl) throw new Error('Could not create download URL')
  return data.signedUrl
}

export interface StoredDocumentExport {
  id: string
  versionNumber: number
  storagePath: string
  fileSha256: string | null
  sizeBytes: number | null
  createdAt: string
}

export async function listDocumentExports(
  organizationId: string,
  documentId: string,
): Promise<StoredDocumentExport[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_document_exports')
    .select('id, version_number, storage_path, file_sha256, size_bytes, created_at')
    .eq('organization_id', organizationId)
    .eq('document_id', documentId)
    .not('storage_path', 'is', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id as string,
    versionNumber: row.version_number as number,
    storagePath: row.storage_path as string,
    fileSha256: (row.file_sha256 as string | null) ?? null,
    sizeBytes: (row.size_bytes as number | null) ?? null,
    createdAt: row.created_at as string,
  }))
}
