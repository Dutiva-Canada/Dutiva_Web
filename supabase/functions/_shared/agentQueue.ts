import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'

/**
 * Shared write path for agent_suggestions — the proposed → reviewed →
 * resolved loop. An agent (model call, cron pass, rule) files a pending row;
 * a human resolves it from the review surface; resolved rows are the audit
 * trail.
 *
 * Dedupe: when dedupeKey is set, at most one PENDING row exists per
 * (user, surface, kind, key) — a re-run returns the existing row rather
 * than piling up a twin. Pass null when every proposal is genuinely new.
 *
 * Best-effort: a queue write failure never fails the feature — callers get
 * null and still return their suggestion to the user.
 */

export type SuggestionSurface = 'pr' | 'health' | 'invest' | 'app'

export interface FiledSuggestion {
  id: string
  /** false when an identical pending row already existed (dedupe hit). */
  fresh: boolean
}

export async function fileSuggestion(
  admin: SupabaseClient,
  s: {
    userId: string
    surface: SuggestionSurface
    kind: string
    title: string
    payload: Record<string, unknown>
    source?: 'model' | 'cron' | 'rule'
    dedupeKey?: string | null
    /** 'dedupe' (default): an identical pending row is returned as-is.
        'supersede': any pending rows for the key are dismissed with
        resolved_action='superseded' before the new one files — for
        regenerated artifacts (a re-drafted pitch) where the latest
        version is the only one worth reviewing. */
    dedupeMode?: 'dedupe' | 'supersede'
  },
): Promise<FiledSuggestion | null> {
  try {
    if (s.dedupeKey) {
      const { data: existing } = await admin
        .from('agent_suggestions')
        .select('id')
        .eq('user_id', s.userId)
        .eq('surface', s.surface)
        .eq('kind', s.kind)
        .eq('dedupe_key', s.dedupeKey)
        .eq('status', 'pending')
      const rows = (existing ?? []) as { id: string }[]
      if (s.dedupeMode === 'supersede') {
        if (rows.length > 0) {
          await admin
            .from('agent_suggestions')
            .update({
              status: 'dismissed',
              resolved_at: new Date().toISOString(),
              resolved_action: 'superseded',
            })
            .in('id', rows.map((r) => r.id))
        }
      } else if (rows[0]) {
        return { id: rows[0].id, fresh: false }
      }
    }
    const { data, error } = await admin
      .from('agent_suggestions')
      .insert({
        user_id: s.userId,
        surface: s.surface,
        kind: s.kind,
        title: s.title.slice(0, 200),
        payload: s.payload,
        source: s.source ?? 'model',
        dedupe_key: s.dedupeKey ?? null,
      })
      .select('id')
      .single()
    if (error || !data?.id) {
      console.error('[agentQueue] insert failed:', error?.message ?? 'no id returned')
      return null
    }
    return { id: data.id as string, fresh: true }
  } catch (e) {
    console.error('[agentQueue] file threw:', e)
    return null
  }
}

/** Lowercase + collapse whitespace — the stable dedupe key for text-shaped
    suggestions (prompts, habit names) where near-identical strings should
    share a pending row. */
export function textDedupeKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 300)
}
