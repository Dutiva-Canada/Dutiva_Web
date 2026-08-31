import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'

/**
 * Ticket attachments. Files upload straight to the private `support-attachments`
 * bucket (storage RLS lets a user write only under their own uid prefix); the
 * `support-attachment-action` edge function then records the metadata with the
 * service role (validating ownership + path + MIME + size) and mints short-lived
 * signed URLs for downloads. Listing goes through the session client — RLS scopes
 * it to tickets the caller may see.
 */

const BUCKET = 'support-attachments'
export const ATTACHMENT_MAX_SIZE = 26214400 // 25 MB (matches the bucket + function)
export const ATTACHMENT_ALLOWED_MIME: readonly string[] = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

export type AttachmentValidationError = 'too_large' | 'bad_type'

export function validateAttachment(file: {
  size: number
  type: string
}): AttachmentValidationError | null {
  if (file.size > ATTACHMENT_MAX_SIZE) return 'too_large'
  if (!ATTACHMENT_ALLOWED_MIME.includes(file.type)) return 'bad_type'
  return null
}

/**
 * Malware-scan state (migration 0014 + the `support-attachment-scan` worker).
 * `skipped` means the scan never established the file was safe — it is not a
 * synonym for `clean`, and the server refuses to sign it while scanning is on.
 */
export type AttachmentScanStatus = 'pending' | 'clean' | 'flagged' | 'skipped'

export interface SupportAttachment {
  id: string
  fileName: string
  mimeType: string
  sizeBytes: number
  scanStatus: AttachmentScanStatus
  createdAt: string
}

/** Why a download was refused, when the refusal was about the file itself. */
export type AttachmentDownloadRefusal = 'infected' | 'unscanned'

export class AttachmentBlockedError extends Error {
  constructor(public readonly reason: AttachmentDownloadRefusal) {
    super(reason)
    this.name = 'AttachmentBlockedError'
  }
}

const attachmentSchema = z.object({
  id: z.string(),
  file_name: z.string(),
  mime_type: z.string(),
  size_bytes: z.number(),
  scan_status: z.string(),
  created_at: z.string(),
})

const SCAN_STATUSES: readonly AttachmentScanStatus[] = ['pending', 'clean', 'flagged', 'skipped']

function toAttachment(r: z.infer<typeof attachmentSchema>): SupportAttachment {
  return {
    id: r.id,
    fileName: r.file_name,
    mimeType: r.mime_type,
    sizeBytes: r.size_bytes,
    // An unrecognised value reads as un-scanned, never as cleared.
    scanStatus: (SCAN_STATUSES as readonly string[]).includes(r.scan_status)
      ? (r.scan_status as AttachmentScanStatus)
      : 'pending',
    createdAt: r.created_at,
  }
}

/** Keep object keys filesystem-safe; the display name stays the original. */
function sanitizeName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120)
  return cleaned.replace(/^[._]+/, '') || 'file'
}

export async function listAttachments(ticketId: string): Promise<SupportAttachment[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('support_attachments')
    .select('id, file_name, mime_type, size_bytes, scan_status, created_at')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return z
    .array(attachmentSchema)
    .parse(data ?? [])
    .map(toAttachment)
}

export async function uploadAttachment(ticketId: string, file: File): Promise<SupportAttachment> {
  if (!supabase) throw new Error('Attachments are not available in this environment.')
  const { data: userData } = await supabase.auth.getUser()
  const uid = userData?.user?.id
  if (!uid) throw new Error('You must be signed in to attach a file.')

  const path = `${uid}/${ticketId}/${Date.now()}-${sanitizeName(file.name)}`
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false })
  if (uploadError) throw uploadError

  const { data, error } = await supabase.functions.invoke('support-attachment-action', {
    body: {
      action: 'record',
      ticket_id: ticketId,
      storage_path: path,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
    },
  })
  if (error) {
    // Recording failed — remove the orphaned object (best effort).
    await supabase.storage
      .from(BUCKET)
      .remove([path])
      .catch(() => undefined)
    throw error
  }
  return toAttachment(attachmentSchema.parse((data as { data: unknown }).data))
}

export async function getAttachmentDownloadUrl(attachmentId: string): Promise<string> {
  if (!supabase) throw new Error('Attachments are not available in this environment.')
  const { data, error } = await supabase.functions.invoke('support-attachment-action', {
    body: { action: 'sign', attachment_id: attachmentId },
  })
  if (error) {
    // 423 Locked is reserved for the malware-scan gate, so the caller can say
    // why the file is unavailable instead of showing a generic failure. The
    // server is the real gate — this only shapes the message.
    const context = (error as { context?: Response }).context
    if (context?.status === 423) {
      // Default to the softer reason: "still scanning" is both the commoner
      // case and the one that is harmless to state wrongly, whereas telling
      // someone their file holds malware when it does not is alarming.
      let reason: AttachmentDownloadRefusal = 'unscanned'
      try {
        const body = (await context.clone().json()) as { code?: unknown }
        if (body.code === 'infected') reason = 'infected'
      } catch {
        // Body already consumed or not JSON — keep the default.
      }
      throw new AttachmentBlockedError(reason)
    }
    throw error
  }
  return z.object({ data: z.object({ url: z.string() }) }).parse(data).data.url
}

/** Human-readable size (KB/MB) for the attachment list. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
