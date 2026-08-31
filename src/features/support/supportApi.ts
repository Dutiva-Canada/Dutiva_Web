import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import type {
  ResponseMethod,
  SupportCategory,
  SupportImpact,
  SupportPriority,
  SupportStatus,
  SupportUrgency,
} from '@/config/support'
import type { SupportDiagnostics } from './diagnostics'

/**
 * Client for the `create-support-ticket` edge function. The server re-validates
 * everything and decides priority + restricted visibility (see the function),
 * so this only shapes the payload and validates the reply.
 */

export interface SupportRequestInput {
  category: SupportCategory
  subject: string
  description: string
  impact: SupportImpact
  urgency: SupportUrgency
  language: 'en' | 'fr'
  preferredResponseMethod: ResponseMethod
  workspaceId?: string | null
  diagnostics?: SupportDiagnostics
}

const responseSchema = z.object({
  data: z.object({
    id: z.string(),
    public_reference: z.string(),
    status: z.string(),
    priority: z.string(),
  }),
})

export interface SupportTicketResult {
  id: string
  publicReference: string
  status: string
  priority: string
}

export async function createSupportTicket(
  input: SupportRequestInput,
): Promise<SupportTicketResult> {
  if (!supabase) {
    throw new Error('Support requests are not available in this environment.')
  }
  const { data, error } = await supabase.functions.invoke('create-support-ticket', {
    body: {
      category: input.category,
      subject: input.subject,
      description: input.description,
      impact: input.impact,
      urgency: input.urgency,
      language: input.language,
      preferred_response_method: input.preferredResponseMethod,
      workspace_id: input.workspaceId ?? null,
      diagnostics: input.diagnostics ?? {},
    },
  })
  if (error) throw error
  const parsed = responseSchema.parse(data)
  return {
    id: parsed.data.id,
    publicReference: parsed.data.public_reference,
    status: parsed.data.status,
    priority: parsed.data.priority,
  }
}

/* ── Reading & replying to the caller's own tickets ─────────────────────────
   These go straight through the anon+session client: RLS (migration 0014)
   already limits a customer to their own tickets, their non-internal messages,
   and inserting their own non-internal replies — no edge function needed. */

export interface SupportTicketSummary {
  id: string
  publicReference: string
  subject: string
  category: SupportCategory
  status: SupportStatus
  priority: SupportPriority
  createdAt: string
  updatedAt: string
}

export interface SupportMessageView {
  id: string
  authorRole: 'customer' | 'agent' | 'system'
  body: string
  createdAt: string
}

export interface SupportTicketThread extends SupportTicketSummary {
  messages: SupportMessageView[]
}

const ticketRowSchema = z.object({
  id: z.string(),
  public_reference: z.string(),
  subject: z.string(),
  category: z.string(),
  status: z.string(),
  priority: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})

const messageRowSchema = z.object({
  id: z.string(),
  author_role: z.enum(['customer', 'agent', 'system']),
  body: z.string(),
  created_at: z.string(),
})

function toSummary(row: z.infer<typeof ticketRowSchema>): SupportTicketSummary {
  return {
    id: row.id,
    publicReference: row.public_reference,
    subject: row.subject,
    category: row.category as SupportCategory,
    status: row.status as SupportStatus,
    priority: row.priority as SupportPriority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toMessage(row: z.infer<typeof messageRowSchema>): SupportMessageView {
  return { id: row.id, authorRole: row.author_role, body: row.body, createdAt: row.created_at }
}

const TICKET_COLUMNS =
  'id, public_reference, subject, category, status, priority, created_at, updated_at'

export async function listMySupportTickets(): Promise<SupportTicketSummary[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('support_tickets')
    .select(TICKET_COLUMNS)
    .order('created_at', { ascending: false })
  if (error) throw error
  return z
    .array(ticketRowSchema)
    .parse(data ?? [])
    .map(toSummary)
}

export async function getSupportTicket(id: string): Promise<SupportTicketThread | null> {
  if (!supabase) return null
  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .select(TICKET_COLUMNS)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!ticket) return null
  const { data: messages, error: msgError } = await supabase
    .from('support_messages')
    .select('id, author_role, body, created_at')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true })
  if (msgError) throw msgError
  return {
    ...toSummary(ticketRowSchema.parse(ticket)),
    messages: z
      .array(messageRowSchema)
      .parse(messages ?? [])
      .map(toMessage),
  }
}

export async function replyToSupportTicket(
  ticketId: string,
  body: string,
): Promise<SupportMessageView> {
  if (!supabase) throw new Error('Support replies are not available in this environment.')
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id
  if (!userId) throw new Error('You must be signed in to reply.')
  const { data, error } = await supabase
    .from('support_messages')
    .insert({
      ticket_id: ticketId,
      author_user_id: userId,
      author_role: 'customer',
      body,
      is_internal_note: false,
    })
    .select('id, author_role, body, created_at')
    .single()
  if (error) throw error
  return toMessage(messageRowSchema.parse(data))
}

/* ── Scheduled call (TODO.md D3) ────────────────────────────────────────────
   An admin proposes up to 3 candidate times (support-agent-action); the
   customer picks one here. Reading is RLS-direct like the ticket/messages
   above; confirming goes through support-confirm-call (service-role, checks
   the caller is the ticket's own requester) because it also creates the
   Google Calendar event server-side. */

export interface ScheduledCallSlot {
  start: string
  end: string
}

export type ScheduledCallStatus = 'proposed' | 'confirmed' | 'completed' | 'cancelled'

export interface ScheduledCallView {
  id: string
  proposedSlots: ScheduledCallSlot[]
  durationMinutes: number
  status: ScheduledCallStatus
  confirmedStart: string | null
  confirmedEnd: string | null
  meetLink: string | null
}

const scheduledCallRowSchema = z.object({
  id: z.string(),
  proposed_slots: z.array(z.object({ start: z.string(), end: z.string() })),
  duration_minutes: z.number(),
  status: z.enum(['proposed', 'confirmed', 'completed', 'cancelled']),
  confirmed_start: z.string().nullable(),
  confirmed_end: z.string().nullable(),
  meet_link: z.string().nullable(),
})

function toScheduledCall(row: z.infer<typeof scheduledCallRowSchema>): ScheduledCallView {
  return {
    id: row.id,
    proposedSlots: row.proposed_slots,
    durationMinutes: row.duration_minutes,
    status: row.status,
    confirmedStart: row.confirmed_start,
    confirmedEnd: row.confirmed_end,
    meetLink: row.meet_link,
  }
}

export async function getScheduledCall(ticketId: string): Promise<ScheduledCallView | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('support_scheduled_calls')
    .select(
      'id, proposed_slots, duration_minutes, status, confirmed_start, confirmed_end, meet_link',
    )
    .eq('ticket_id', ticketId)
    .maybeSingle()
  if (error) throw error
  return data ? toScheduledCall(scheduledCallRowSchema.parse(data)) : null
}

export async function confirmScheduledCall(
  ticketId: string,
  slotIndex: number,
): Promise<{ start: string; end: string; meetLink: string | null }> {
  if (!supabase) throw new Error('Call confirmation is not available in this environment.')
  const { data, error } = await supabase.functions.invoke('support-confirm-call', {
    body: { ticket_id: ticketId, slot_index: slotIndex },
  })
  if (error) throw error
  const parsed = z
    .object({
      data: z.object({ start: z.string(), end: z.string(), meet_link: z.string().nullable() }),
    })
    .parse(data)
  return { start: parsed.data.start, end: parsed.data.end, meetLink: parsed.data.meet_link }
}
