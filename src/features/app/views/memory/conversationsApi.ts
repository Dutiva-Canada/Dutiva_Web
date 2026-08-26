import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import { advisorResponseSchema } from '@/features/app/advisor/contract'
import type { AdvisorResponse } from '@/features/app/advisor/contract'

/**
 * Read the caller's own Advisor conversation transcript for Memory chat-recall
 * and Advisor thread reopen. RLS: "Users can manage their own conversations"
 * — no org admin bypass.
 */

export interface ConversationTurn {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ProductionConversation {
  id: string
  messages: ConversationTurn[]
  updatedAt: string
  /** Last structured Compliance Workspace payload, when still valid. */
  lastAdvisorResponse: AdvisorResponse | null
}

const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
})

const rowSchema = z.object({
  id: z.string(),
  messages: z.array(messageSchema).nullable(),
  updated_at: z.string(),
  last_advisor_response: z.unknown().nullable().optional(),
})

function parseLastAdvisorResponse(raw: unknown): AdvisorResponse | null {
  if (raw == null) return null
  const parsed = advisorResponseSchema.safeParse(raw)
  return parsed.success ? parsed.data : null
}

function toProductionConversation(
  row: z.infer<typeof rowSchema>,
): ProductionConversation {
  return {
    id: row.id,
    messages: row.messages ?? [],
    updatedAt: row.updated_at,
    lastAdvisorResponse: parseLastAdvisorResponse(row.last_advisor_response ?? null),
  }
}

export async function getOwnConversation(id: string): Promise<ProductionConversation | null> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('conversations')
    .select('id, messages, updated_at, last_advisor_response')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return toProductionConversation(rowSchema.parse(data))
}

export async function listOwnConversations(limit = 20): Promise<ProductionConversation[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('conversations')
    .select('id, messages, updated_at, last_advisor_response')
    .order('updated_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return z
    .array(rowSchema)
    .parse(data ?? [])
    .map(toProductionConversation)
}

/** Permanently delete one of the caller's Advisor conversations (RLS: own rows). */
export async function deleteOwnConversation(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.from('conversations').delete().eq('id', id)
  if (error) throw error
}
