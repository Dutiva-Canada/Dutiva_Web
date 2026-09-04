import { z } from 'zod'
import { isInternalDutivaAccount } from '@/lib/billing/adminAccess'
import { supabase } from '@/lib/supabaseClient'
import type { SupportCategory, SupportPriority, SupportStatus } from '@/config/support'
import { supportQueueRank, type RequesterPlan } from './triage'

/**
 * Admin/operator support API. Reads go through the session client — RLS
 * (migration 0014) grants an admin (`is_admin`) read across all tickets,
 * messages (incl. internal notes), attachments and feedback. All mutations go
 * through the `support-agent-action` edge function (service-role, is_admin-gated
 * server-side): replies, internal notes, status, and priority. No admin write
 * policy exists on the tables, so the browser can never mutate directly.
 */

export interface AdminTicketRow {
  id: string
  publicReference: string
  subject: string
  requesterEmail: string | null
  requesterPlan: RequesterPlan
  category: SupportCategory
  status: SupportStatus
  priority: SupportPriority
  restricted: boolean
  language: 'en' | 'fr'
  createdAt: string
  firstResponseAt: string | null
}

export interface AdminMessage {
  id: string
  authorRole: 'customer' | 'agent' | 'system'
  body: string
  isInternal: boolean
  createdAt: string
}

export interface AdminTicket extends AdminTicketRow {
  description: string
  impact: string | null
  urgency: string | null
  preferredResponseMethod: string
  messages: AdminMessage[]
}

export interface AdminTicketFilters {
  status?: SupportStatus | 'all'
  priority?: SupportPriority | 'all'
  category?: SupportCategory | 'all'
  restrictedOnly?: boolean
  search?: string
}

const rowSchema = z.object({
  id: z.string(),
  public_reference: z.string(),
  subject: z.string(),
  requester_email: z.string().nullable(),
  requester_plan: z.string().nullable().optional(),
  category: z.string(),
  status: z.string(),
  priority: z.string(),
  restricted: z.boolean(),
  language: z.string(),
  created_at: z.string(),
  first_response_at: z.string().nullable(),
})

const messageSchema = z.object({
  id: z.string(),
  author_role: z.enum(['customer', 'agent', 'system']),
  body: z.string(),
  is_internal_note: z.boolean(),
  created_at: z.string(),
})

const LIST_COLUMNS =
  'id, public_reference, subject, requester_email, requester_plan, category, status, priority, restricted, language, created_at, first_response_at'

function toRequesterPlan(value: string | null | undefined): RequesterPlan {
  return value === 'free' || value === 'starter' || value === 'growth' || value === 'pro'
    ? value
    : null
}

function toRow(r: z.infer<typeof rowSchema>): AdminTicketRow {
  return {
    id: r.id,
    publicReference: r.public_reference,
    subject: r.subject,
    requesterEmail: r.requester_email,
    requesterPlan: toRequesterPlan(r.requester_plan),
    category: r.category as SupportCategory,
    status: r.status as SupportStatus,
    priority: r.priority as SupportPriority,
    restricted: r.restricted,
    language: r.language === 'fr' ? 'fr' : 'en',
    createdAt: r.created_at,
    firstResponseAt: r.first_response_at,
  }
}

function toMessage(m: z.infer<typeof messageSchema>): AdminMessage {
  return {
    id: m.id,
    authorRole: m.author_role,
    body: m.body,
    isInternal: m.is_internal_note,
    createdAt: m.created_at,
  }
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  if (!supabase) return false
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  if (!user?.id) return false
  if (isInternalDutivaAccount(user.email)) return true
  /* Support RLS predicates use is_admin(uuid); keep the client gate aligned. */
  const { data, error } = await supabase.rpc('is_admin', { check_user_id: user.id })
  return !error && data === true
}

export async function adminListTickets(
  filters: AdminTicketFilters = {},
): Promise<AdminTicketRow[]> {
  if (!supabase) return []
  let query = supabase.from('support_tickets').select(LIST_COLUMNS)
  if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status)
  if (filters.priority && filters.priority !== 'all') query = query.eq('priority', filters.priority)
  if (filters.category && filters.category !== 'all') query = query.eq('category', filters.category)
  if (filters.restrictedOnly) query = query.eq('restricted', true)
  if (filters.search && filters.search.trim()) {
    const term = filters.search.trim().replace(/[%,]/g, '')
    query = query.or(`subject.ilike.%${term}%,public_reference.ilike.%${term}%`)
  }
  const { data, error } = await query.order('created_at', { ascending: false }).limit(200)
  if (error) throw error
  return z
    .array(rowSchema)
    .parse(data ?? [])
    .map(toRow)
    .sort((a, b) => {
      const rank = supportQueueRank(a.requesterPlan) - supportQueueRank(b.requesterPlan)
      if (rank !== 0) return rank
      return b.createdAt.localeCompare(a.createdAt)
    })
}

export async function adminGetTicket(id: string): Promise<AdminTicket | null> {
  if (!supabase) return null
  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .select(`${LIST_COLUMNS}, description, impact, urgency, preferred_response_method`)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!ticket) return null
  const { data: messages, error: msgError } = await supabase
    .from('support_messages')
    .select('id, author_role, body, is_internal_note, created_at')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true })
  if (msgError) throw msgError

  const row = rowSchema.parse(ticket)
  const detail = ticket as Record<string, unknown>
  return {
    ...toRow(row),
    description: String(detail.description ?? ''),
    impact: (detail.impact as string | null) ?? null,
    urgency: (detail.urgency as string | null) ?? null,
    preferredResponseMethod: String(detail.preferred_response_method ?? 'email'),
    messages: z
      .array(messageSchema)
      .parse(messages ?? [])
      .map(toMessage),
  }
}

export interface ScheduledCallSlot {
  start: string
  end: string
}

export type AgentAction =
  | { action: 'reply'; body: string }
  | { action: 'note'; body: string }
  | { action: 'status'; status: SupportStatus }
  | { action: 'priority'; priority: SupportPriority }
  | { action: 'propose_call'; slots: ScheduledCallSlot[]; duration_minutes: number }

export async function runAgentAction(ticketId: string, payload: AgentAction): Promise<void> {
  if (!supabase) throw new Error('Support actions are not available in this environment.')
  const { error } = await supabase.functions.invoke('support-agent-action', {
    body: { ticket_id: ticketId, ...payload },
  })
  if (error) throw error
}

/* ── Scheduled call (TODO.md D3) ────────────────────────────────────────────
   Read-only here — RLS (0014 + 0045) already grants an admin read across
   every ticket's scheduled call the same way it grants ticket/message reads;
   the only write is propose_call above, through the edge function. */

export type ScheduledCallStatus = 'proposed' | 'confirmed' | 'completed' | 'cancelled'

export interface AdminScheduledCall {
  id: string
  proposedSlots: ScheduledCallSlot[]
  durationMinutes: number
  status: ScheduledCallStatus
  confirmedStart: string | null
  confirmedEnd: string | null
  meetLink: string | null
}

const scheduledCallSchema = z.object({
  id: z.string(),
  proposed_slots: z.array(z.object({ start: z.string(), end: z.string() })),
  duration_minutes: z.number(),
  status: z.enum(['proposed', 'confirmed', 'completed', 'cancelled']),
  confirmed_start: z.string().nullable(),
  confirmed_end: z.string().nullable(),
  meet_link: z.string().nullable(),
})

export async function adminGetScheduledCall(ticketId: string): Promise<AdminScheduledCall | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('support_scheduled_calls')
    .select(
      'id, proposed_slots, duration_minutes, status, confirmed_start, confirmed_end, meet_link',
    )
    .eq('ticket_id', ticketId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const row = scheduledCallSchema.parse(data)
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
