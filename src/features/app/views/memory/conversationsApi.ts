import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'

/**
 * Read the caller's own Advisor conversation transcript for Memory chat-recall.
 * RLS: "Users can manage their own conversations" — no org admin bypass.
 */

export interface ConversationTurn {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ProductionConversation {
  id: string
  messages: ConversationTurn[]
  updatedAt: string
}

const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
})

const rowSchema = z.object({
  id: z.string(),
  messages: z.array(messageSchema).nullable(),
  updated_at: z.string(),
})

export async function getOwnConversation(id: string): Promise<ProductionConversation | null> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('conversations')
    .select('id, messages, updated_at')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const row = rowSchema.parse(data)
  return {
    id: row.id,
    messages: row.messages ?? [],
    updatedAt: row.updated_at,
  }
}

export async function listOwnConversations(limit = 20): Promise<ProductionConversation[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('conversations')
    .select('id, messages, updated_at')
    .order('updated_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return z
    .array(rowSchema)
    .parse(data ?? [])
    .map((row) => ({
      id: row.id,
      messages: row.messages ?? [],
      updatedAt: row.updated_at,
    }))
}

/** Permanently delete one of the caller's Advisor conversations (RLS: own rows). */
export async function deleteOwnConversation(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.from('conversations').delete().eq('id', id)
  if (error) throw error
}
