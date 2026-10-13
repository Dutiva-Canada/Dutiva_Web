import { type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import type { MemoryPromptFact } from './handlers.ts'

/* The "knows you" loaders — confirmed memories plus the declared mandate.
   Shared by the draft actions (index.ts) and the chat-side draft path
   (chatActions.ts); a leaf module so neither imports the other. */

/** Confirmed memories for the draft prompts — the holder's own retained
    facts shape drafts the same way they shape chat context. */
export async function loadMemories(
  adminClient: SupabaseClient,
  userId: string,
): Promise<MemoryPromptFact[]> {
  const { data } = await adminClient
    .from('invest_memories')
    .select('symbol, kind, text')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30)
  return (data ?? []).map((m) => ({
    symbol: m.symbol ? String(m.symbol) : null,
    kind: String(m.kind ?? 'fact'),
    text: String(m.text ?? '').slice(0, 400),
  }))
}

/** Memories plus the declared mandate — the full personal context a
    draft should align with. Two reads in parallel; both are cheap. */
export async function loadPersonalContext(
  adminClient: SupabaseClient,
  userId: string,
): Promise<{ memories: MemoryPromptFact[]; mandate: string | null }> {
  const [memories, { data: profile }] = await Promise.all([
    loadMemories(adminClient, userId),
    adminClient
      .from('invest_user_profile')
      .select('mandate')
      .eq('user_id', userId)
      .maybeSingle(),
  ])
  return { memories, mandate: (profile?.mandate as string | null) ?? null }
}
