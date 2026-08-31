import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

/**
 * Malware-scan worker for support ticket attachments. Drains `pending` rows
 * from public.support_attachments, hands each file to the operator-configured
 * scanner, and writes the verdict back as `scan_status` + `scan_detail`. Runs
 * on a schedule (pg_cron -> this function, migration 0038) and can be invoked
 * manually to flush a backlog — see docs/SUPPORT_RUNBOOK.md.
 *
 * `scan_status` has existed since migration 0014 and nothing ever flipped it,
 * so every attachment ever uploaded reads 'pending'. This is the worker that
 * makes the column mean something.
 *
 * Honest by construction, in the same shape as support-notify:
 *   • With no SUPPORT_ATTACHMENT_SCAN_URL configured, rows are LEFT pending and
 *     nothing is marked clean — so wiring a scanner later scans the backlog
 *     rather than silently blessing it.
 *   • An unrecognised scanner response is `unknown`, never `clean`
 *     (src/features/support/attachmentScan.ts holds that rule and its tests).
 *   • A flagged object is NOT deleted. Downloads are refused, but the bytes
 *     stay so the founder can hand them to an incident responder; destroying
 *     the only copy of the evidence is not the worker's call to make.
 *
 * The scanner never receives a bearer token or ticket content — only a
 * 5-minute signed URL for the object, plus its declared name/type/size.
 *
 * Keep in sync with (the tested source of truth):
 *   • src/features/support/attachmentScan.ts  (verdict + status + release rules)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-scan-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const BUCKET = 'support-attachments'
/** Long enough for the scanner to fetch the object, short enough to be useless if leaked. */
const SIGNED_URL_TTL = 300
const SCAN_TIMEOUT_MS = 30_000

// ── Mirror of src/features/support/attachmentScan.ts ─────────────────────────

const SCAN_MAX_ATTEMPTS = 5
const SCAN_BATCH_SIZE = 25

type ScanVerdict = 'clean' | 'flagged' | 'skipped' | 'unknown'

const CLEAN_WORDS = new Set([
  'clean',
  'ok',
  'no_threats',
  'no-threats',
  'negative',
  'pass',
  'passed',
])
const FLAGGED_WORDS = new Set([
  'infected',
  'malicious',
  'found',
  'positive',
  'flagged',
  'threat',
  'virus',
  'fail',
  'failed',
])
const SKIPPED_WORDS = new Set([
  'unsupported',
  'too_large',
  'too-large',
  'skipped',
  'encrypted',
  'unscannable',
])

function fromWord(value: string): ScanVerdict {
  const word = value.trim().toLowerCase()
  if (CLEAN_WORDS.has(word)) return 'clean'
  if (FLAGGED_WORDS.has(word)) return 'flagged'
  if (SKIPPED_WORDS.has(word)) return 'skipped'
  return 'unknown'
}

function interpretScanResponse(payload: unknown): ScanVerdict {
  if (typeof payload === 'string') return fromWord(payload)
  if (typeof payload !== 'object' || payload === null) return 'unknown'
  const record = payload as Record<string, unknown>
  if (typeof record.infected === 'boolean') return record.infected ? 'flagged' : 'clean'
  if (typeof record.malicious === 'boolean') return record.malicious ? 'flagged' : 'clean'
  // `clean: false` says "not cleared", not "malware found" — do not invent a detection.
  if (typeof record.clean === 'boolean') return record.clean ? 'clean' : 'unknown'
  for (const key of ['status', 'result', 'verdict']) {
    const value = record[key]
    if (typeof value === 'string') {
      const verdict = fromWord(value)
      if (verdict !== 'unknown') return verdict
    }
  }
  return 'unknown'
}

function scanDetail(payload: unknown, max = 200): string | null {
  if (typeof payload !== 'object' || payload === null) return null
  const record = payload as Record<string, unknown>
  for (const key of ['detail', 'message', 'reason', 'signature', 'threat']) {
    const value = record[key]
    if (typeof value === 'string' && value.trim() !== '') return value.trim().slice(0, max)
  }
  return null
}

function nextScanStatus(verdict: ScanVerdict, attemptsSoFar: number): string {
  if (verdict === 'clean') return 'clean'
  if (verdict === 'flagged') return 'flagged'
  if (verdict === 'skipped') return 'skipped'
  return attemptsSoFar + 1 >= SCAN_MAX_ATTEMPTS ? 'skipped' : 'pending'
}

// ─────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Server configuration missing' }, 500)

  const scanUrl = Deno.env.get('SUPPORT_ATTACHMENT_SCAN_URL') ?? ''
  const scanKey = Deno.env.get('SUPPORT_ATTACHMENT_SCAN_KEY') ?? ''

  // Always authenticated — one of two credentials, never neither. The pg_cron
  // job (migration 0038) presents the service-role bearer; a manual flush from
  // the runbook presents the shared secret. Deliberately NOT "only check the
  // secret if one is configured": that shape leaves the drain endpoint open on
  // a project that never set SUPPORT_NOTIFY_SECRET, and anyone could then make
  // us re-scan the queue at the operator's expense.
  const sharedSecret = Deno.env.get('SUPPORT_NOTIFY_SECRET') ?? ''
  const bySecret = sharedSecret !== '' && req.headers.get('x-scan-secret') === sharedSecret
  const byServiceRole = (req.headers.get('Authorization') ?? '') === `Bearer ${serviceRoleKey}`
  if (!bySecret && !byServiceRole) return json({ error: 'Forbidden' }, 403)

  const admin = createClient(supabaseUrl, serviceRoleKey)

  const { data: pending, error: pendingError } = await admin
    .from('support_attachments')
    .select('id, ticket_id, storage_path, file_name, mime_type, size_bytes, scan_attempts')
    .eq('scan_status', 'pending')
    .lt('scan_attempts', SCAN_MAX_ATTEMPTS)
    .order('created_at', { ascending: true })
    .limit(SCAN_BATCH_SIZE)
  if (pendingError) return json({ error: pendingError.message }, 500)

  const queue = pending ?? []
  if (!scanUrl) {
    // Inert until configured — the backlog stays pending on purpose.
    return json({ processed: 0, pending: queue.length, note: 'no_scanner' })
  }
  if (queue.length === 0) return json({ processed: 0, pending: 0 })

  let clean = 0
  let flagged = 0
  let skipped = 0
  let retry = 0

  for (const row of queue) {
    const attempts = typeof row.scan_attempts === 'number' ? row.scan_attempts : 0

    let verdict: ScanVerdict = 'unknown'
    let detail: string | null = null

    const { data: signed, error: signError } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(row.storage_path, SIGNED_URL_TTL)

    if (signError || !signed?.signedUrl) {
      // The object is gone or unreadable — retrying will not fix that, and it
      // is certainly not a clean file.
      verdict = 'skipped'
      detail = 'object_unavailable'
    } else {
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS)
        const response = await fetch(scanUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(scanKey ? { Authorization: `Bearer ${scanKey}` } : {}),
          },
          body: JSON.stringify({
            url: signed.signedUrl,
            file_name: row.file_name,
            mime_type: row.mime_type,
            size_bytes: row.size_bytes,
            reference: row.id,
          }),
          signal: controller.signal,
        })
        clearTimeout(timer)

        if (response.ok) {
          const text = await response.text()
          let payload: unknown = text
          try {
            payload = JSON.parse(text)
          } catch {
            // A plain-text 'OK'/'FOUND' is a shape real ClamAV wrappers return.
          }
          verdict = interpretScanResponse(payload)
          detail = scanDetail(payload)
        } else {
          detail = `http_${response.status}`
        }
      } catch (error) {
        detail =
          error instanceof Error && error.name === 'AbortError' ? 'timeout' : 'scanner_unreachable'
      }
    }

    const status = nextScanStatus(verdict, attempts)
    const settled = status !== 'pending'

    const { error: updateError } = await admin
      .from('support_attachments')
      .update({
        scan_status: status,
        scan_detail: detail,
        scan_attempts: attempts + 1,
        ...(settled ? { scanned_at: new Date().toISOString() } : {}),
      })
      .eq('id', row.id)
    if (updateError) {
      console.error('attachment scan: could not record verdict', {
        id: row.id,
        error: updateError.message,
      })
      continue
    }

    if (status === 'clean') clean += 1
    else if (status === 'flagged') flagged += 1
    else if (status === 'skipped') skipped += 1
    else retry += 1

    if (status === 'flagged' || status === 'skipped') {
      // Both outcomes change what the founder may safely do with the file, so
      // both belong in the ticket's audit trail — not just the scary one.
      await admin.from('support_ticket_events').insert({
        ticket_id: row.ticket_id,
        actor_user_id: null,
        event_type: status === 'flagged' ? 'attachment_flagged' : 'attachment_scan_skipped',
        data: { attachment_id: row.id, detail },
      })
    }
    if (status === 'flagged') {
      console.error('attachment scan: malware detected', {
        id: row.id,
        ticket: row.ticket_id,
        detail,
      })
    }
  }

  return json({ processed: queue.length, clean, flagged, skipped, retry })
})
