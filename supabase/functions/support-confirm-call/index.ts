import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { parseSlotIndex } from '../_shared/scheduledCalls.ts'
import { createCalendarEvent, parseServiceAccountKey } from '../_shared/googleCalendar.ts'
import { makeCorsHeaders, withCors } from '../_shared/cors.ts'

/**
 * Customer confirms one of the call times an admin proposed
 * (support-agent-action's `propose_call`) on their OWN ticket. TODO.md D3.
 *
 * Deliberately its own function rather than a support-agent-action branch:
 * that function is is_admin-gated; this one instead checks the caller is the
 * ticket's requester, which is a materially different authorization rule and
 * is clearer kept apart than folded into one action list with a conditional
 * gate per action.
 *
 * Honest by construction, matching support-notify's own rule for a missing
 * provider: confirmation ALWAYS succeeds and is always recorded once the
 * slot is valid, whether or not Google Calendar is configured.
 * GOOGLE_CALENDAR_CLIENT_EMAIL / GOOGLE_CALENDAR_PRIVATE_KEY /
 * GOOGLE_CALENDAR_ID unset, or the Calendar API call itself failing, both
 * leave `calendar_event_id` / `meet_link` null and record a
 * support_ticket_events row saying so — never blocks the customer's
 * confirmation on infrastructure they can't see. See
 * docs/SUPPORT_CALL_SCHEDULING.md.
 */

const corsHeaders = makeCorsHeaders()
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}

const CALL_DESCRIPTION_TEMPLATE = (reference: string, ticketUrl: string) =>
  `Dutiva support call for ticket ${reference}.\n\n${ticketUrl}\n\n` +
  'Dutiva provides practical HR workflow support and compliance-oriented guidance. It does not provide legal advice.'

const handler = async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
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

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }
  const ticketId = typeof body.ticket_id === 'string' ? body.ticket_id : ''
  if (!ticketId) return json({ error: 'ticket_id is required' }, 422)

  const admin = createClient(supabaseUrl, serviceRoleKey)

  const { data: ticket, error: ticketError } = await admin
    .from('support_tickets')
    .select('id, public_reference, requester_user_id, requester_email, language')
    .eq('id', ticketId)
    .maybeSingle()
  if (ticketError) return json({ error: ticketError.message }, 500)
  if (!ticket) return json({ error: 'Ticket not found' }, 404)
  // Own ticket only — a scheduled call is a personal appointment, not a
  // workspace-shared one, so the wider "requester or workspace member" read
  // rule support_tickets.select otherwise grants does not extend to booking.
  if (ticket.requester_user_id !== user.id) return json({ error: 'Not your ticket' }, 403)

  const { data: call, error: callError } = await admin
    .from('support_scheduled_calls')
    .select('id, proposed_slots, duration_minutes, status')
    .eq('ticket_id', ticketId)
    .maybeSingle()
  if (callError) return json({ error: callError.message }, 500)
  if (!call) return json({ error: 'No call has been proposed on this ticket' }, 404)
  if (call.status !== 'proposed') return json({ error: `Call is already ${call.status}` }, 409)

  const slots = Array.isArray(call.proposed_slots) ? call.proposed_slots : []
  const slotIndex = parseSlotIndex(body.slot_index, slots.length)
  if (slotIndex === null) return json({ error: 'slot_index is out of range' }, 422)
  const chosen = slots[slotIndex] as { start: string; end: string }

  const nowIso = new Date().toISOString()
  const appUrl = Deno.env.get('SUPPORT_APP_URL') ?? 'https://app.dutiva.ca'
  const ticketUrl = `${appUrl}/app/support/requests/${ticketId}`

  let calendarEventId: string | null = null
  let meetLink: string | null = null
  const key = parseServiceAccountKey(
    Deno.env.get('GOOGLE_CALENDAR_CLIENT_EMAIL'),
    Deno.env.get('GOOGLE_CALENDAR_PRIVATE_KEY'),
  )
  const calendarId = Deno.env.get('GOOGLE_CALENDAR_ID')
  if (key && calendarId) {
    try {
      const created = await createCalendarEvent(key, {
        calendarId,
        summary: `Dutiva support call — ${ticket.public_reference}`,
        description: CALL_DESCRIPTION_TEMPLATE(ticket.public_reference, ticketUrl),
        startIso: chosen.start,
        endIso: chosen.end,
        attendeeEmail: ticket.requester_email ?? null,
        requestId: call.id,
      })
      calendarEventId = created.eventId
      meetLink = created.meetLink
    } catch (err) {
      // Calendar failing is not the customer's problem to see — confirm anyway
      // and leave a record for the operator to create the invite by hand.
      console.error('[support-confirm-call] calendar event creation failed:', err)
      await admin.from('support_ticket_events').insert({
        ticket_id: ticketId,
        event_type: 'calendar_sync_failed',
        data: { error: String(err) },
      })
    }
  } else {
    await admin.from('support_ticket_events').insert({
      ticket_id: ticketId,
      event_type: 'calendar_sync_skipped',
      data: { reason: 'Google Calendar secrets not configured' },
    })
  }

  const { error: updateError } = await admin
    .from('support_scheduled_calls')
    .update({
      status: 'confirmed',
      confirmed_start: chosen.start,
      confirmed_end: chosen.end,
      confirmed_by: user.id,
      confirmed_at: nowIso,
      calendar_event_id: calendarEventId,
      meet_link: meetLink,
    })
    .eq('id', call.id)
  if (updateError) return json({ error: updateError.message }, 500)

  await admin.from('support_ticket_events').insert({
    ticket_id: ticketId,
    actor_user_id: user.id,
    event_type: 'call_confirmed',
    data: { start: chosen.start, end: chosen.end },
  })

  // No separate operator notification: when Calendar is configured, the event
  // itself (organized by the shared calendar's owner) is how the founder sees
  // it; when it isn't, the calendar_sync_skipped event above is visible on
  // the ticket in the admin view already. Duplicating that as an email would
  // just be a second, weaker signal of the same fact.
  if (ticket.requester_email) {
    await admin.from('support_notifications').insert({
      ticket_id: ticketId,
      kind: 'call_confirmed',
      audience: 'customer',
      recipient: ticket.requester_email,
      language: ticket.language ?? 'en',
      payload: { reference: ticket.public_reference },
    })
  }

  return json({ data: { start: chosen.start, end: chosen.end, meet_link: meetLink } })
}

Deno.serve(async (req) => withCors(req, await handler(req)))