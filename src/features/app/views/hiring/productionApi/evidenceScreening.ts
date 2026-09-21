import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import type { Json } from '@/lib/supabase/types'

/* ── Evidence Screening ─────────────────────────────────────────────────── */

export interface ProductionEvidenceScreening {
  id: string
  candidateId: string
  relevantExperience: Array<{
    claim: string
    evidence: string
    confidence: 'high' | 'medium' | 'low'
    specificity: 'specific' | 'moderate' | 'generic'
    missingInfo?: string
  }>
  scope: {
    teamSize: string
    scale: string
    complexity: string
    confidence: 'high' | 'medium' | 'low'
  }
  outcomes: Array<{
    claim: string
    evidence: string
    metrics?: string[]
    confidence: 'high' | 'medium' | 'low'
    contributionClarity: 'clear' | 'unclear' | 'mixed'
  }>
  skills: Array<{
    skill: string
    demonstrated: boolean
    evidence: string
    proficiency: 'expert' | 'advanced' | 'intermediate' | 'beginner'
  }>
  careerTrajectory: {
    progression: 'strong' | 'moderate' | 'flat' | 'declining'
    evidence: string
    learning: string
    confidence: 'high' | 'medium' | 'low'
  }
  domainKnowledge: {
    domain: string
    level: 'expert' | 'advanced' | 'intermediate' | 'beginner'
    evidence: string
    confidence: 'high' | 'medium' | 'low'
  }
  evidenceQuality: 'high' | 'medium' | 'low' | 'generic'
  confidence: 'high' | 'medium' | 'low'
  missingInfo: string[]
}

const evidenceRowSchema = z.object({
  id: z.string(),
  candidate_id: z.string(),
  relevant_experience: z.array(
    z.object({
      claim: z.string(),
      evidence: z.string(),
      confidence: z.enum(['high', 'medium', 'low']),
      specificity: z.enum(['specific', 'moderate', 'generic']),
      missing_info: z.string().optional(),
    }),
  ),
  scope: z.object({
    team_size: z.string(),
    scale: z.string(),
    complexity: z.string(),
    confidence: z.enum(['high', 'medium', 'low']),
  }),
  outcomes: z.array(
    z.object({
      claim: z.string(),
      evidence: z.string(),
      metrics: z.array(z.string()).optional(),
      confidence: z.enum(['high', 'medium', 'low']),
      contribution_clarity: z.enum(['clear', 'unclear', 'mixed']),
    }),
  ),
  skills: z.array(
    z.object({
      skill: z.string(),
      demonstrated: z.boolean(),
      evidence: z.string(),
      proficiency: z.enum(['expert', 'advanced', 'intermediate', 'beginner']),
    }),
  ),
  career_trajectory: z.object({
    progression: z.enum(['strong', 'moderate', 'flat', 'declining']),
    evidence: z.string(),
    learning: z.string(),
    confidence: z.enum(['high', 'medium', 'low']),
  }),
  domain_knowledge: z.object({
    domain: z.string(),
    level: z.enum(['expert', 'advanced', 'intermediate', 'beginner']),
    evidence: z.string(),
    confidence: z.enum(['high', 'medium', 'low']),
  }),
  evidence_quality: z.enum(['high', 'medium', 'low', 'generic']),
  confidence: z.enum(['high', 'medium', 'low']),
  missing_info: z.array(z.string()),
})

function toEvidenceScreening(row: z.infer<typeof evidenceRowSchema>): ProductionEvidenceScreening {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    relevantExperience: row.relevant_experience.map((item) => ({
      claim: item.claim,
      evidence: item.evidence,
      confidence: item.confidence,
      specificity: item.specificity,
      missingInfo: item.missing_info ?? undefined,
    })),
    scope: {
      teamSize: row.scope.team_size,
      scale: row.scope.scale,
      complexity: row.scope.complexity,
      confidence: row.scope.confidence,
    },
    outcomes: row.outcomes.map((item) => ({
      claim: item.claim,
      evidence: item.evidence,
      metrics: item.metrics,
      confidence: item.confidence,
      contributionClarity: item.contribution_clarity,
    })),
    skills: row.skills,
    careerTrajectory: row.career_trajectory,
    domainKnowledge: row.domain_knowledge,
    evidenceQuality: row.evidence_quality,
    confidence: row.confidence,
    missingInfo: row.missing_info,
  }
}

export async function getEvidenceScreening(
  candidateId: string,
): Promise<ProductionEvidenceScreening | null> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client
    .from('hr_evidence_screening')
    .select('*')
    .eq('candidate_id', candidateId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return toEvidenceScreening(evidenceRowSchema.parse(data))
}

export async function upsertEvidenceScreening(
  screening: Omit<ProductionEvidenceScreening, 'id'>,
): Promise<ProductionEvidenceScreening> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client
    .from('hr_evidence_screening')
    .upsert({
      candidate_id: screening.candidateId,
      relevant_experience: screening.relevantExperience as unknown as Json,
      scope: screening.scope as unknown as Json,
      outcomes: screening.outcomes as unknown as Json,
      skills: screening.skills as unknown as Json,
      career_trajectory: screening.careerTrajectory as unknown as Json,
      domain_knowledge: screening.domainKnowledge as unknown as Json,
      evidence_quality: screening.evidenceQuality,
      confidence: screening.confidence,
      missing_info: screening.missingInfo,
    })
    .select()
    .single()
  if (error) throw error
  if (!data) throw new Error('Failed to upsert evidence screening')
  return toEvidenceScreening(evidenceRowSchema.parse(data))
}
