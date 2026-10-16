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
    /* An inbox is shallow by design — 200 pending rows is already a
       neglected queue; bound it rather than stream an unbounded list. */
    .limit(200)
  if (error) throw error
  return (data ?? []) as AgentSuggestion[]
}

/** Resolved rows for a surface since `sinceIso`, newest first — the
    outcome history the "what Tally notices" readout derives from. Same
    learning input the server-side suggestion pass reads. */
export async function loadResolvedSuggestions(
  surface: AgentSurface,
  sinceIso: string,
): Promise<AgentSuggestion[]> {
  const sb = requireSupabase()
  const { data, error } = await sb
    .from('agent_suggestions')
    .select('*')
    .eq('surface', surface)
    .neq('status', 'pending')
    .gte('resolved_at', sinceIso)
    .order('resolved_at', { ascending: false })
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

/** Send a resolved row back to pending — the undo for a mis-dismiss or a
    premature accept. Clears the resolution stamp so the audit trail reads
    "still open", not "resolved twice". */
export async function reopenSuggestion(id: string): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb
    .from('agent_suggestions')
    .update({ status: 'pending', resolved_at: null, resolved_action: null })
    .eq('id', id)
  if (error) throw error
}
