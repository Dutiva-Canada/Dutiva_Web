import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { resendSend } from '../_shared/resendSend.ts'
import { selectRelevantUpdates } from '../_shared/lawUpdateRelevance.ts'
import { selectDigestableUpdates } from '../_shared/lawUpdateDigest.ts'
import type { DigestCandidateRow } from '../_shared/lawUpdateDigest.ts'

/**
 * Weekly law-change digest (TODO.md D1, decided 2026-08-06: internal-only,
 * weekly, human-reviewed). Scheduled every Monday 08:00 UTC by
 * trigger_law_update_digest() (supabase/migrations/0046).
 *
 * Recipients are internal (SUPPORT_OPERATOR_EMAIL) for this phase — a
 * digest to an operational alias, not a customer, so the CASL
 * commercial-electronic-message question docs/LAW_CHANGE_NOTIFICATIONS.md §2
 * raises does not apply yet. Revisit Path A vs Path B before this ever
 * reaches an actual customer inbox.
 *
 * Only ever digests `law_updates` rows a human has flipped to
 * `review_status = 'reviewed'` — the monitor's own model writes
 * `change_summary` at detection time (monitor-law-changes/index.ts), and an
 * unsupervised model summary reaching an inbox is a materially different
 * risk than one shown in the Knowledge panel a reader chose to open. There
 * is no review UI yet; see supabase/migrations/0046 for the SQL to flip a
 * row, and the query to find what's waiting.
 *
 * Honest by construction, matching support-notify's own rule for a missing
 * provider: with no RESEND_API_KEY, this leaves every reviewed row
 * unrecorded (not marked sent) so wiring the key later flushes the backlog
 * rather than silently dropping a week's amendments.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-notify-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/**
 * Earliest `detected_at` this digest will ever include. Fixed at the date
 * this shipped rather than derived from "first successful run": the review
 * gate already keeps a backlog dump out (nothing old is pre-reviewed), but a
 * second, date-based floor costs nothing and matches
 * docs/LAW_CHANGE_NOTIFICATIONS.md §5's explicit warning about the first
 * email being a history dump.
 */
const GO_LIVE_AT = new Date('2026-08-06T00:00:00Z')

interface LawUpdateRow {
  id: string
  jurisdiction: string
  law_name: string
  url: string
  change_summary: string | null
  detected_at: string | null
  event_type: string | null
  review_status: string
}

function formatUpdate(row: LawUpdateRow): string {
  const date = row.detected_at
    ? new Date(row.detected_at).toLocaleDateString('en-CA')
    : 'unknown date'
  const lines = [
    `${row.jurisdiction} — ${row.law_name} (detected ${date})`,
    row.change_summary ?? '(no summary recorded)',
    row.url,
  ]
  return lines.join('\n')
}

const DISCLAIMER =
  'Dutiva provides practical HR workflow support and compliance-oriented guidance. It does not provide legal advice.'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Server configuration missing' }, 500)

  const requiredSecret = Deno.env.get('SUPPORT_NOTIFY_SECRET')
  if (requiredSecret && req.headers.get('x-notify-secret') !== requiredSecret) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey)
  const apiKey = Deno.env.get('RESEND_API_KEY') ?? Deno.env.get('SUPPORT_EMAIL_PROVIDER_API_KEY')
  const from = Deno.env.get('SUPPORT_EMAIL_FROM') ?? 'Dutiva Support <support@dutiva.ca>'
  const recipient = Deno.env.get('SUPPORT_OPERATOR_EMAIL') ?? 'support@dutiva.ca'

  const { data: rows, error } = await admin
    .from('law_updates')
    .select(
      'id, jurisdiction, law_name, url, change_summary, detected_at, event_type, review_status',
    )
    .eq('event_type', 'change')
    .eq('review_status', 'reviewed')
    .order('detected_at', { ascending: true })
  if (error) return json({ error: error.message }, 500)

  const candidates = (rows ?? []) as LawUpdateRow[]
  const relevant = selectRelevantUpdates(
    candidates.map((r) => ({ ...r, eventType: r.event_type })),
    ['ON', 'QC', 'FED'],
  )

  const { data: alreadySentRows, error: sentError } = await admin
    .from('law_update_notifications')
    .select('law_update_id')
    .eq('recipient', recipient)
    .eq('status', 'sent')
  if (sentError) return json({ error: sentError.message }, 500)
  const alreadySentIds = new Set((alreadySentRows ?? []).map((r) => r.law_update_id as string))

  const digestRows = selectDigestableUpdates(
    relevant.map((r): LawUpdateRow & DigestCandidateRow => ({
      ...r,
      reviewStatus: r.review_status,
    })),
    alreadySentIds,
    GO_LIVE_AT,
  )

  if (digestRows.length === 0) {
    return json({ ok: true, sent: false, reason: 'nothing_to_digest' })
  }

  if (!apiKey) {
    console.info(
      `[send-law-updates] no provider configured; ${digestRows.length} reviewed row(s) left unrecorded`,
    )
    return json({ ok: true, sent: false, reason: 'no_provider', pending: digestRows.length })
  }

  const subject = `Dutiva — weekly law-change digest (${digestRows.length} update${digestRows.length === 1 ? '' : 's'})`
  const text = [
    `${digestRows.length} reviewed law change${digestRows.length === 1 ? '' : 's'} this week:`,
    ...digestRows.map(formatUpdate),
    DISCLAIMER,
  ].join('\n\n')

  try {
    await resendSend(apiKey, from, { to: recipient, subject, text })
  } catch (err) {
    console.error('[send-law-updates] send failed:', err)
    return json({ error: String(err) }, 502)
  }

  const nowIso = new Date().toISOString()
  const { error: insertError } = await admin.from('law_update_notifications').upsert(
    digestRows.map((row) => ({
      law_update_id: row.id,
      recipient,
      status: 'sent',
      sent_at: nowIso,
    })),
    { onConflict: 'law_update_id,recipient' },
  )
  if (insertError) {
    // The email already went out; failing to record it risks a duplicate on
    // the next run rather than a missed one, and that's logged loudly here.
    console.error('[send-law-updates] sent but failed to record outbox rows:', insertError.message)
  }

  return json({ ok: true, sent: true, count: digestRows.length })
})
