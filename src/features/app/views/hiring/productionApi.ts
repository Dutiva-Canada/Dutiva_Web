import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import { fetchAllPages } from '@/lib/supabasePagination'
import type { Json, TablesUpdate } from '@/lib/supabase/types'

/**
 * Real persistence for the Hiring module (production mode) — reads and
 * writes hiring-related tables, org-scoped by RLS.
 * 
 * Database schema (to be implemented via migration):
 * - hr_candidates: Main candidate records
 * - hr_evidence_screening: AI-extracted evidence data
 * - hr_work_samples: Work sample assessments
 * - hr_defense_interviews: Interview records and conversations
 * - hr_authenticity_scores: Five-score evaluation results
 * - hr_job_postings: Job posting management
 * 
 * These throw on failure: they only run for the signed-in admin in production
 * mode, where an error must surface, not vanish.
 */

export type ProductionCandidateStatus = 
  | 'application' 
  | 'basic_qualified' 
  | 'evidence_qualified' 
  | 'work_sample' 
  | 'interview' 
  | 'hired' 
  | 'rejected'

export type ProductionWorkAuthorization = 'authorized' | 'needs_sponsorship' | 'unknown'

export interface ProductionCandidate {
  id: string
  organizationId: string
  name: string
  email: string
  phone?: string
  location: string
  resume: string
  linkedIn?: string
  position: string
  currentRole: string
  yearsExperience: number
  workAuthorization: ProductionWorkAuthorization
  compensationExpectations?: string
  status: ProductionCandidateStatus
  appliedDate: string
  assignedTo?: string
  /** JSON-encoded knockout criteria */
  knockoutCriteria: {
    meets_requirements: boolean
    required_qualifications: string[]
    missing_requirements: string[]
  }
}

export interface NewCandidate {
  organizationId: string
  name: string
  email: string
  phone?: string
  location: string
  resume: string
  linkedIn?: string
  position: string
  currentRole: string
  yearsExperience: number
  workAuthorization: ProductionWorkAuthorization
  compensationExpectations?: string
}

const candidateRowSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  location: z.string(),
  resume: z.string(),
  linkedin: z.string().nullable(),
  position: z.string(),
  current_role: z.string(),
  years_experience: z.number(),
  work_authorization: z.enum(['authorized', 'needs_sponsorship', 'unknown']),
  compensation_expectations: z.string().nullable(),
  status: z.enum(['application', 'basic_qualified', 'evidence_qualified', 'work_sample', 'interview', 'hired', 'rejected']),
  applied_date: z.string(),
  assigned_to: z.string().nullable(),
  knockout_criteria: z.object({
    meets_requirements: z.boolean(),
    required_qualifications: z.array(z.string()),
    missing_requirements: z.array(z.string()),
  }),
})

const CANDIDATE_SELECT_COLUMNS =
  'id, organization_id, name, email, phone, location, resume, linkedin, position, current_role, years_experience, work_authorization, compensation_expectations, status, applied_date, assigned_to, knockout_criteria'

function toCandidate(row: z.infer<typeof candidateRowSchema>): ProductionCandidate {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    location: row.location,
    resume: row.resume,
    linkedIn: row.linkedin ?? undefined,
    position: row.position,
    currentRole: row.current_role,
    yearsExperience: row.years_experience,
    workAuthorization: row.work_authorization,
    compensationExpectations: row.compensation_expectations ?? undefined,
    status: row.status,
    appliedDate: row.applied_date,
    assignedTo: row.assigned_to ?? undefined,
    knockoutCriteria: row.knockout_criteria as any,
  }
}

export async function listCandidates(organizationId: string): Promise<ProductionCandidate[]> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const data = await fetchAllPages((from, to) =>
    client
      .from('hr_candidates')
      .select(CANDIDATE_SELECT_COLUMNS)
      .eq('organization_id', organizationId)
      .order('applied_date', { ascending: false })
      .range(from, to),
  )
  return z.array(candidateRowSchema).parse(data).map(toCandidate)
}

export async function getCandidate(id: string): Promise<ProductionCandidate | null> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client
    .from('hr_candidates')
    .select(CANDIDATE_SELECT_COLUMNS)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return toCandidate(candidateRowSchema.parse(data))
}

export async function addCandidate(
  organizationId: string,
  fields: NewCandidate,
): Promise<ProductionCandidate> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client
    .from('hr_candidates')
    .insert({
      organization_id: organizationId,
      name: fields.name,
      email: fields.email,
      phone: fields.phone ?? null,
      location: fields.location,
      resume: fields.resume,
      linkedin: fields.linkedIn ?? null,
      position: fields.position,
      current_role: fields.currentRole,
      years_experience: fields.yearsExperience,
      work_authorization: fields.workAuthorization,
      compensation_expectations: fields.compensationExpectations ?? null,
      status: 'application',
      applied_date: new Date().toISOString(),
      knockout_criteria: {
        meets_requirements: false,
        required_qualifications: [],
        missing_requirements: [],
      },
    })
    .select(CANDIDATE_SELECT_COLUMNS)
    .single()
  if (error) throw error
  if (!data) throw new Error('Failed to create candidate')
  return toCandidate(candidateRowSchema.parse(data))
}

export async function updateCandidateStatus(
  id: string,
  status: ProductionCandidateStatus,
): Promise<void> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { error } = await client
    .from('hr_candidates')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function assignCandidate(
  id: string,
  assignedTo: string,
): Promise<void> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { error } = await client
    .from('hr_candidates')
    .update({ assigned_to: assignedTo, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

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

export async function getEvidenceScreening(candidateId: string): Promise<ProductionEvidenceScreening | null> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client
    .from('hr_evidence_screening')
    .select('*')
    .eq('candidate_id', candidateId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  // Parse and return the evidence screening data
  return data as unknown as ProductionEvidenceScreening
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
  return data as unknown as ProductionEvidenceScreening
}

/* ── Work Samples ───────────────────────────────────────────────────────── */

export type ProductionAssessmentType = 'product_manager' | 'sales' | 'engineer' | 'marketer' | 'general'
export type ProductionAssessmentStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'

export interface ProductionWorkSample {
  id: string
  candidateId: string
  assessmentType: ProductionAssessmentType
  scenario: string
  submission: string
  aiAllowed: boolean
  aiDetected: boolean
  timeTaken?: string
  status: ProductionAssessmentStatus
  evaluator?: string
  evaluation?: {
    quality: 'excellent' | 'good' | 'fair' | 'poor'
    approach: string
    aiUsage: string
    capability: 'high' | 'medium' | 'low'
    feedback: string
    recommendation: 'advance' | 'hold' | 'reject'
  }
  assignedDate: string
  completedDate?: string
}

export async function getWorkSample(candidateId: string): Promise<ProductionWorkSample | null> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client
    .from('hr_work_samples')
    .select('*')
    .eq('candidate_id', candidateId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return data as unknown as ProductionWorkSample
}

export async function createWorkSample(
  workSample: Omit<ProductionWorkSample, 'id' | 'assignedDate'>,
): Promise<ProductionWorkSample> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client
    .from('hr_work_samples')
    .insert({
      candidate_id: workSample.candidateId,
      assessment_type: workSample.assessmentType,
      scenario: workSample.scenario,
      submission: workSample.submission,
      ai_allowed: workSample.aiAllowed,
      ai_detected: workSample.aiDetected,
      time_taken: workSample.timeTaken ?? null,
      status: workSample.status,
      evaluator: workSample.evaluator ?? null,
      evaluation: (workSample.evaluation as unknown as Json) ?? null,
      completed_date: workSample.completedDate ?? null,
      assigned_date: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return data as unknown as ProductionWorkSample
}

export async function updateWorkSample(
  id: string,
  updates: Partial<ProductionWorkSample>,
): Promise<void> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const row: TablesUpdate<'hr_work_samples'> = { updated_at: new Date().toISOString() }
  if (updates.candidateId !== undefined) row.candidate_id = updates.candidateId
  if (updates.assessmentType !== undefined) row.assessment_type = updates.assessmentType
  if (updates.scenario !== undefined) row.scenario = updates.scenario
  if (updates.submission !== undefined) row.submission = updates.submission
  if (updates.aiAllowed !== undefined) row.ai_allowed = updates.aiAllowed
  if (updates.aiDetected !== undefined) row.ai_detected = updates.aiDetected
  if (updates.timeTaken !== undefined) row.time_taken = updates.timeTaken
  if (updates.status !== undefined) row.status = updates.status
  if (updates.evaluator !== undefined) row.evaluator = updates.evaluator
  if (updates.evaluation !== undefined) row.evaluation = updates.evaluation as unknown as Json
  if (updates.completedDate !== undefined) row.completed_date = updates.completedDate
  const { error } = await client
    .from('hr_work_samples')
    .update(row)
    .eq('id', id)
  if (error) throw error
}

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
  explanations: Array<{
    dimension: 'qualification' | 'evidence' | 'capability' | 'reasoning' | 'motivation'
    score: ProductionScoreLevel
    evidence: string
    confidence: 'high' | 'medium' | 'low'
  }>
  lastUpdated: string
}

export async function getAuthenticityScores(candidateId: string): Promise<ProductionAuthenticityScores | null> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client
    .from('hr_authenticity_scores')
    .select('*')
    .eq('candidate_id', candidateId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return data as unknown as ProductionAuthenticityScores
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
    .select()
    .single()
  if (error) throw error
  return data as unknown as ProductionAuthenticityScores
}

/* ── Funnel Metrics ─────────────────────────────────────────────────────── */

export interface ProductionFunnelMetrics {
  totalApplications: number
  basicQualified: number
  evidenceQualified: number
  workSamples: number
  interviews: number
  hires: number
}

export async function getFunnelMetrics(organizationId: string): Promise<ProductionFunnelMetrics> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  
  const { data: candidates, error } = await client
    .from('hr_candidates')
    .select('status')
    .eq('organization_id', organizationId)
  
  if (error) throw error
  
  const metrics: ProductionFunnelMetrics = {
    totalApplications: candidates?.length ?? 0,
    basicQualified: candidates?.filter(c => c.status === 'basic_qualified').length ?? 0,
    evidenceQualified: candidates?.filter(c => c.status === 'evidence_qualified').length ?? 0,
    workSamples: candidates?.filter(c => c.status === 'work_sample').length ?? 0,
    interviews: candidates?.filter(c => c.status === 'interview').length ?? 0,
    hires: candidates?.filter(c => c.status === 'hired').length ?? 0,
  }
  
  return metrics
}
