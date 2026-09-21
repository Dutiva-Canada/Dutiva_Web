import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import type { Json } from '@/lib/supabase/types'

/* ── Authenticity Scores ─────────────────────────────────────────────────── */

export type ProductionScoreLevel = 'high' | 'medium' | 'low' | 'insufficient'

export interface ProductionAuthenticityScores {
  id: string
  candidateId: string
  qualification: ProductionScoreLevel
  evidence: ProductionScoreLevel
  capability: ProductionScoreLevel
  reasoning: ProductionScoreLevel
  motivation: ProductionScoreLevel
  overall: 'high' | 'medium' | 'low'
  explanations: Array<Record<string, unknown>>
  lastUpdated: string
}

const authenticityScoresRowSchema = z.object({
  id: z.string(),
  candidate_id: z.string(),
  qualification: z.string(),
  evidence: z.string(),
  capability: z.string(),
  reasoning: z.string(),
  motivation: z.string(),
  overall: z.string(),
  explanations: z.array(z.record(z.string(), z.unknown())),
  last_updated: z.string(),
})

function toAuthenticityScores(
  row: z.infer<typeof authenticityScoresRowSchema>,
): ProductionAuthenticityScores {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    qualification: row.qualification as ProductionScoreLevel,
    evidence: row.evidence as ProductionScoreLevel,
    capability: row.capability as ProductionScoreLevel,
    reasoning: row.reasoning as ProductionScoreLevel,
    motivation: row.motivation as ProductionScoreLevel,
    overall: row.overall as 'high' | 'medium' | 'low',
    explanations: row.explanations,
    lastUpdated: row.last_updated,
  }
}

const AUTHENTICITY_SCORES_SELECT_COLUMNS =
  'id, candidate_id, qualification, evidence, capability, reasoning, motivation, overall, explanations, last_updated'

export async function getAuthenticityScores(
  candidateId: string,
): Promise<ProductionAuthenticityScores | null> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client
    .from('hr_authenticity_scores')
    .select(AUTHENTICITY_SCORES_SELECT_COLUMNS)
    .eq('candidate_id', candidateId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return toAuthenticityScores(authenticityScoresRowSchema.parse(data))
}

export async function upsertAuthenticityScores(
  scores: Omit<ProductionAuthenticityScores, 'id' | 'lastUpdated'>,
): Promise<ProductionAuthenticityScores> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client
    .from('hr_authenticity_scores')
    .upsert({
      candidate_id: scores.candidateId,
      qualification: scores.qualification,
      evidence: scores.evidence,
      capability: scores.capability,
      reasoning: scores.reasoning,
      motivation: scores.motivation,
      overall: scores.overall,
      explanations: scores.explanations as unknown as Json,
      last_updated: new Date().toISOString(),
    })
    .select(AUTHENTICITY_SCORES_SELECT_COLUMNS)
    .single()
  if (error) throw error
  if (!data) throw new Error('Failed to upsert authenticity scores')
  return toAuthenticityScores(authenticityScoresRowSchema.parse(data))
}
