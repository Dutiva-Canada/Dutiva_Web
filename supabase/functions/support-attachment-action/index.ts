import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

/**
 * Attachment actions for a support ticket:
 *   • `record` — after the browser uploads a file directly to the private
 *     `support-attachments` bucket (storage RLS lets a user write only under
 *     their own uid prefix), this validates ownership + path + MIME + size and
 *     inserts the metadata row with the service role. There is no authenticated
 *     INSERT policy on support_attachments, so this is the only way a row lands.
 *   • `sign` — returns a short-lived signed URL for an attachment the caller may
 *     see (ticket requester, an admin, or a non-restricted workspace member).
 *     The bucket is private, so this is the only read path.
 *
 * The metadata row never holds file bytes; the object key is
 * `<uid>/<ticket>/<file>` (matching the storage policies in migration 0014).
 * `scan_status` starts `pending`; the `support-attachment-scan` worker flips it.
 *
 * `sign` enforces the scan verdict — mirroring `canReleaseAttachment` in
 * src/features/support/attachmentScan.ts. A `flagged` file is refused outright,
 * for admins too; anything not yet `clean` is refused only while a scanner is
 * actually configured, so with no scanner the download path behaves exactly as
 * it always has.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const BUCKET = 'support-attachments'
const SIGNED_URL_TTL = 60 // seconds

/** Scanning is "on" exactly when the worker has somewhere to send files. */
const SCANNING_ENABLED = (Deno.env.get('SUPPORT_ATTACHMENT_SCAN_URL') ?? '') !== ''

/** Mirror of canReleaseAttachment (src/features/support/attachmentScan.ts). */
function canRelease(
  scanStatus: string,
): { allowed: true } | { allowed: false; reason: 'infected' | 'unscanned' } {
  // Unconditional: a known-bad file does not become releasable because the
  // operator later removed the scan URL.
  if (scanStatus === 'flagged') return { allowed: false, reason: 'infected' }
  if (!SCANNING_ENABLED) return { allowed: true }
  if (scanStatus === 'clean') return { allowed: true }
  return { allowed: false, reason: 'unscanned' }
}
const MAX_SIZE = 26214400 // 25 MB (matches the bucket limit)
const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Server configuration missing' }, 500)
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'Missing bearer token' }, 401)
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: userError } = await userClient.auth.getUser(
    authHeader.replace('Bearer ', ''),
  )
  const user = userData?.user
  if (userError || !user) return json({ error: 'Invalid user token' }, 401)

  const admin = createClient(supabaseUrl, serviceRoleKey)

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }
  const action = body.action

  async function canAccessTicket(ticket: {
    requester_user_id: string | null
    workspace_id: string | null
    restricted: boolean
  }): Promise<boolean> {
    if (ticket.requester_user_id && ticket.requester_user_id === user!.id) return true
    const { data: isAdmin } = await admin.rpc('is_admin', { check_user_id: user!.id })
    if (isAdmin === true) return true
    if (ticket.workspace_id && !ticket.restricted) {
      const { data: isMember } = await admin.rpc('is_org_member', {
        check_org_id: ticket.workspace_id,
        check_user_id: user!.id,
      })
      if (isMember === true) return true
    }
    return false
  }

  if (action === 'record') {
    const ticketId = typeof body.ticket_id === 'string' ? body.ticket_id : ''
    const storagePath = typeof body.storage_path === 'string' ? body.storage_path : ''
    const fileName = typeof body.file_name === 'string' ? body.file_name.trim() : ''
    const mimeType = typeof body.mime_type === 'string' ? body.mime_type : ''
    const sizeBytes = typeof body.size_bytes === 'number' ? body.size_bytes : -1
    const messageId = typeof body.message_id === 'string' ? body.message_id : null

    if (!ticketId || !storagePath || !fileName) return json({ error: 'Missing fields' }, 422)
    if (!ALLOWED_MIME.has(mimeType)) return json({ error: 'File type not allowed' }, 422)
    if (fileName.length > 255) return json({ error: 'File name too long' }, 422)
    if (sizeBytes < 0 || sizeBytes > MAX_SIZE) return json({ error: 'File too large' }, 422)
    // The path must be under THIS user's uid and THIS ticket — matching the
    // storage policy that only let them upload there in the first place.
    if (!storagePath.startsWith(`${user.id}/${ticketId}/`)) {
      return json({ error: 'Invalid storage path' }, 422)
    }

    const { data: ticket, error: ticketError } = await admin
      .from('support_tickets')
      .select('id, requester_user_id, workspace_id, restricted')
      .eq('id', ticketId)
      .maybeSingle()
    if (ticketError) return json({ error: ticketError.message }, 500)
    if (!ticket) return json({ error: 'Ticket not found' }, 404)
    // Uploads are the requester's or an admin's — not a workspace peer's.
    const { data: isAdmin } = await admin.rpc('is_admin', { check_user_id: user.id })
    const isOwner = ticket.requester_user_id === user.id
    if (!isOwner && isAdmin !== true) return json({ error: 'Not allowed' }, 403)

    const { data: attachment, error: insertError } = await admin
      .from('support_attachments')
      .insert({
        ticket_id: ticketId,
        message_id: messageId,
        uploaded_by: user.id,
        storage_path: storagePath,
        file_name: fileName,
        mime_type: mimeType,
        size_bytes: sizeBytes,
        scan_status: 'pending',
      })
      .select('id, file_name, mime_type, size_bytes, scan_status, created_at')
      .single()
    if (insertError || !attachment) {
      // Clean up the orphaned object so a failed record doesn't leave a file.
      await admin.storage.from(BUCKET).remove([storagePath])
      return json({ error: insertError?.message ?? 'Could not record the attachment.' }, 500)
    }

    await admin.from('support_ticket_events').insert({
      ticket_id: ticketId,
      actor_user_id: user.id,
      event_type: 'attachment_added',
      data: { attachment_id: attachment.id, mime_type: mimeType, size_bytes: sizeBytes },
    })

    return json({ data: attachment })
  }

  if (action === 'sign') {
    const attachmentId = typeof body.attachment_id === 'string' ? body.attachment_id : ''
    if (!attachmentId) return json({ error: 'attachment_id is required' }, 422)

    const { data: attachment, error: attachError } = await admin
      .from('support_attachments')
      .select('id, ticket_id, storage_path, file_name, scan_status')
      .eq('id', attachmentId)
      .maybeSingle()
    if (attachError) return json({ error: attachError.message }, 500)
    if (!attachment) return json({ error: 'Attachment not found' }, 404)

    const { data: ticket } = await admin
      .from('support_tickets')
      .select('requester_user_id, workspace_id, restricted')
      .eq('id', attachment.ticket_id)
      .maybeSingle()
    if (!ticket || !(await canAccessTicket(ticket))) {
      return json({ error: 'Not allowed' }, 403)
    }

    // Access is not the same question as safety — check both.
    const release = canRelease(attachment.scan_status ?? 'pending')
    if (!release.allowed) {
      return json(
        {
          error:
            release.reason === 'infected'
              ? 'This file was flagged by the malware scan and cannot be downloaded.'
              : 'This file has not finished the malware scan yet. Please try again shortly.',
          code: release.reason,
        },
        423,
      )
    }

    const { data: signed, error: signError } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(attachment.storage_path, SIGNED_URL_TTL, {
        download: attachment.file_name,
      })
    if (signError || !signed)
      return json({ error: signError?.message ?? 'Could not sign URL' }, 500)
    return json({ data: { url: signed.signedUrl } })
  }

  return json({ error: 'Unknown action' }, 422)
})
