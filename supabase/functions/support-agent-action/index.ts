import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  MAX_DURATION_MINUTES,
  MIN_DURATION_MINUTES,
  parseProposedSlots,
} from '../_shared/scheduledCalls.ts'

/**
 * Admin/operator actions on a support ticket: reply (customer-visible), add an
 * internal note, change status, set priority, or propose scheduled-call times
 * (TODO.md D3 — up to 3 candidate slots; the customer confirms one from their
 * own ticket view via support-confirm-call). Gated by is_admin server-side
 * (`user_roles` or `@dutiva.ca` via 0115) and executed with the service role,
 * so these mutations never depend on the browser. Priority here MAY be
 * 'critical' (unlike the customer intake, which is capped at 'high'). Every
 * action writes an audit event.
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

const STATUSES = [
  'new',
  'triaged',
  'in_progress',
  'waiting_on_customer',
  'waiting_on_dutiva',
  'scheduled_call',
  'resolved',
  'closed',
] as const
const PRIORITIES = ['critical', 'high', 'standard', 'low'] as const
const ACTIONS = ['reply', 'note', 'status', 'priority', 'propose_call'] as const

function has<T extends string>(list: readonly T[], v: unknown): v is T {
  return typeof v === 'string' && (list as readonly string[]).includes(v)
}

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

  // Server-side admin gate — the real boundary (RLS also limits reads).
  const { data: isAdmin } = await admin.rpc('is_admin', { check_user_id: user.id })
  if (isAdmin !== true) return json({ error: 'Admin access required.' }, 403)

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const action = body.action
  const ticketId = typeof body.ticket_id === 'string' ? body.ticket_id : ''
  if (!ticketId) return json({ error: 'ticket_id is required' }, 422)
  if (!has(ACTIONS, action)) return json({ error: 'Unknown action' }, 422)

  const { data: ticket, error: ticketError } = await admin
    .from('support_tickets')
    .select('id, status, first_response_at, public_reference, requester_email, language')
    .eq('id', ticketId)
    .maybeSingle()
  if (ticketError) return json({ error: ticketError.message }, 500)
  if (!ticket) return json({ error: 'Ticket not found' }, 404)

  const nowIso = new Date().toISOString()

  if (action === 'reply' || action === 'note') {
    const text = typeof body.body === 'string' ? body.body.trim() : ''
    if (!text || text.length > 20000) return json({ error: 'A message body is required.' }, 422)
    const isNote = action === 'note'
    const { data: message, error: msgError } = await admin
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        author_user_id: user.id,
        author_role: 'agent',
        body: text,
        is_internal_note: isNote,
      })
      .select('id, author_role, body, is_internal_note, created_at')
      .single()
    if (msgError) return json({ error: msgError.message }, 500)

    const ticketPatch: Record<string, unknown> = {}
    if (!isNote && !ticket.first_response_at) ticketPatch.first_response_at = nowIso
    if (!isNote && (ticket.status === 'new' || ticket.status === 'triaged')) {
      ticketPatch.status = 'waiting_on_customer'
    }
    if (Object.keys(ticketPatch).length > 0) {
      await admin.from('support_tickets').update(ticketPatch).eq('id', ticketId)
    }
    await admin.from('support_ticket_events').insert({
      ticket_id: ticketId,
      actor_user_id: user.id,
      event_type: isNote ? 'internal_note' : 'agent_reply',
      data: {},
    })
    // Notify the customer of a new (non-internal) reply via the outbox.
    if (!isNote && ticket.requester_email) {
      await admin.from('support_notifications').insert({
        ticket_id: ticketId,
        kind: 'agent_reply',
        audience: 'customer',
        recipient: ticket.requester_email,
        language: ticket.language ?? 'en',
        payload: { reference: ticket.public_reference },
      })
    }
    return json({ data: { message } })
  }

  if (action === 'status') {
    const status = body.status
    if (!has(STATUSES, status)) return json({ error: 'Unknown status' }, 422)
    const patch: Record<string, unknown> = { status }
    if (status === 'resolved') patch.resolved_at = nowIso
    if (status === 'closed') patch.closed_at = nowIso
    const { error } = await admin.from('support_tickets').update(patch).eq('id', ticketId)
    if (error) return json({ error: error.message }, 500)
    await admin.from('support_ticket_events').insert({
      ticket_id: ticketId,
      actor_user_id: user.id,
      event_type: 'status_change',
      data: { from: ticket.status, to: status },
    })
    return json({ data: { status } })
  }

  if (action === 'propose_call') {
    const slots = parseProposedSlots(body.slots, new Date(nowIso))
    if (!slots) return json({ error: 'slots must be 1-3 future {start, end} ranges' }, 422)
    const durationMinutes = body.duration_minutes
    if (
      typeof durationMinutes !== 'number' ||
      durationMinutes < MIN_DURATION_MINUTES ||
      durationMinutes > MAX_DURATION_MINUTES
    ) {
      return json(
        {
          error: `duration_minutes must be between ${MIN_DURATION_MINUTES} and ${MAX_DURATION_MINUTES}`,
        },
        422,
      )
    }

    const { error: scheduleError } = await admin.from('support_scheduled_calls').upsert(
      {
        ticket_id: ticketId,
        proposed_by: user.id,
        proposed_slots: slots,
        duration_minutes: durationMinutes,
        status: 'proposed',
        // A re-propose (reschedule before confirmation) clears any stale confirmation state.
        confirmed_start: null,
        confirmed_end: null,
        confirmed_by: null,
        confirmed_at: null,
        calendar_event_id: null,
        meet_link: null,
        reminder_sent_at: null,
        followup_flagged_at: null,
      },
      { onConflict: 'ticket_id' },
    )
    if (scheduleError) return json({ error: scheduleError.message }, 500)

    if (ticket.status !== 'scheduled_call') {
      await admin.from('support_tickets').update({ status: 'scheduled_call' }).eq('id', ticketId)
    }
    await admin.from('support_ticket_events').insert({
      ticket_id: ticketId,
      actor_user_id: user.id,
      event_type: 'call_proposed',
      data: { slots, duration_minutes: durationMinutes },
    })
    if (ticket.requester_email) {
      await admin.from('support_notifications').insert({
        ticket_id: ticketId,
        kind: 'call_proposed',
        audience: 'customer',
        recipient: ticket.requester_email,
        language: ticket.language ?? 'en',
        payload: { reference: ticket.public_reference },
      })
    }
    return json({ data: { slots, duration_minutes: durationMinutes } })
  }

  // action === 'priority'
  const priority = body.priority
  if (!has(PRIORITIES, priority)) return json({ error: 'Unknown priority' }, 422)
  const { error } = await admin.from('support_tickets').update({ priority }).eq('id', ticketId)
  if (error) return json({ error: error.message }, 500)
  await admin.from('support_ticket_events').insert({
    ticket_id: ticketId,
    actor_user_id: user.id,
    event_type: 'priority_change',
    data: { to: priority },
  })
  return json({ data: { priority } })
})
