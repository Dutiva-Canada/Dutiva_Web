import { supabase } from '@/lib/supabaseClient'
import type { Database } from '@/lib/supabase/database.types'

/**
 * Client side of the agent review queue (agent_suggestions, migration 0198).
 * Agents file pending rows through edge functions; the user resolves them —
 * accept or dismiss — from the page that produced them or the surface's
 * For-review list. The RLS column grant means only status/resolved_* are
 * writable from here; a client can never rewrite a proposal or fake its
 * provenance.
 */

export type AgentSurface = 'pr' | 'health' | 'invest' | 'app'
export type SuggestionStatus = 'accepted' | 'dismissed'

export type AgentSuggestion =
  Database['public']['Tables']['agent_suggestions']['Row']

function requireSupabase() {
  if (!supabase) throw new Error('Supabase client unavailable — check env vars.')
  return supabase
}

/** Pending rows for a surface, newest first — the review list. */
export async function loadPendingSuggestions(
  surface: AgentSurface,
): Promise<AgentSuggestion[]> {
  const sb = requireSupabase()
  const { data, error } = await sb
    .from('agent_suggestions')
    .select('*')
    .eq('surface', surface)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as AgentSuggestion[]
}

/** Accept or dismiss a suggestion. `action` records *how* it was resolved
    ('added', 'copied', 'opened_email', 'superseded', ...) — the audit word,
    not just the verdict. */
export async function resolveSuggestion(
  id: string,
  status: SuggestionStatus,
  action: string,
): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb
    .from('agent_suggestions')
    .update({
      status,
      resolved_at: new Date().toISOString(),
      resolved_action: action.slice(0, 60),
    })
    .eq('id', id)
  if (error) throw error
}
