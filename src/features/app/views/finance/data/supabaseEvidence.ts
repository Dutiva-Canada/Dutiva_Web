import { supabase as supabaseTyped } from '@/lib/supabaseClient'
import type { FinanceReceipt } from './types'
import { mapReceipt } from './supabaseMappers'

/* eslint-disable @typescript-eslint/no-explicit-any */
const supabase: any = supabaseTyped

const EVIDENCE_BUCKET = 'finance-evidence'
const RECEIPTS_TABLE = 'finance_receipts'

export function financeEvidencePath(
  organizationId: string,
  entityId: string,
  receiptId: string,
  ext: string,
): string {
  return `${organizationId}/${entityId}/${receiptId}.${ext}`
}

export async function uploadReceiptFile(
  organizationId: string,
  entityId: string,
  receiptId: string,
  file: File,
): Promise<{ storagePath: string; sha256: string; sizeBytes: number }> {
  if (!supabase) throw new Error('Supabase is not configured')
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const storagePath = financeEvidencePath(organizationId, entityId, receiptId, ext)
  const { error } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .upload(storagePath, file, { contentType: file.type || 'application/octet-stream', upsert: false })
  if (error) throw error
  // SHA-256 is computed server-side by the edge function in a future phase;
  // for now we record size only.
  return { storagePath, sha256: '', sizeBytes: file.size }
}

export async function createReceiptDownloadUrl(storagePath: string, expiresInSeconds = 3600): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.storage.from(EVIDENCE_BUCKET).createSignedUrl(storagePath, expiresInSeconds)
  if (error) throw error
  if (!data?.signedUrl) throw new Error('Could not create download URL')
  return data.signedUrl
}

export async function insertReceipt(
  orgId: string,
  item: Omit<FinanceReceipt, 'id'> & { storagePath: string; sha256?: string; sizeBytes?: number; contentType?: string },
): Promise<FinanceReceipt | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(RECEIPTS_TABLE)
    .insert({
      organization_id: orgId,
      entity_id: item.entityId,
      bill_id: item.billId,
      expense_id: item.expenseId,
      file_name: item.fileName,
      storage_path: item.storagePath,
      file_sha256: item.sha256 ?? null,
      size_bytes: item.sizeBytes ?? null,
      content_type: item.contentType ?? 'application/octet-stream',
      uploaded_at: item.uploadedAt,
      reviewed: item.reviewed,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapReceipt(data as Record<string, unknown>)
}

export async function markReceiptReviewed(
  orgId: string,
  id: string,
  reviewer: string,
): Promise<FinanceReceipt | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(RECEIPTS_TABLE)
    .update({
      reviewed: true,
      reviewed_by: reviewer,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapReceipt(data as Record<string, unknown>)
}
