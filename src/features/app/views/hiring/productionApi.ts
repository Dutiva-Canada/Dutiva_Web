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
    knockoutCriteria: row.knockout_criteria as ProductionCandidate['knockoutCriteria'],
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
  timeTaken?: string | null
  status: ProductionAssessmentStatus
  evaluator?: string | null
  evaluation?: Record<string, unknown>
  assignedDate: string
  completedDate?: string | null
}

const workSampleRowSchema = z.object({
  id: z.string(),
  candidate_id: z.string(),
  assessment_type: z.string(),
  scenario: z.string(),
  submission: z.string(),
  ai_allowed: z.boolean(),
  ai_detected: z.boolean(),
  time_taken: z.string().nullable(),
  status: z.string(),
  evaluator: z.string().nullable(),
  evaluation: z.record(z.string(), z.unknown()).nullable(),
  assigned_date: z.string(),
  completed_date: z.string().nullable(),
})

function toWorkSample(row: z.infer<typeof workSampleRowSchema>): ProductionWorkSample {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    assessmentType: row.assessment_type as ProductionAssessmentType,
    scenario: row.scenario,
    submission: row.submission,
    aiAllowed: row.ai_allowed,
    aiDetected: row.ai_detected,
    timeTaken: row.time_taken ?? undefined,
    status: row.status as ProductionAssessmentStatus,
    evaluator: row.evaluator ?? undefined,
    evaluation: row.evaluation ?? undefined,
    assignedDate: row.assigned_date,
    completedDate: row.completed_date ?? undefined,
  }
}

const WORK_SAMPLE_SELECT_COLUMNS =
  'id, candidate_id, assessment_type, scenario, submission, ai_allowed, ai_detected, time_taken, status, evaluator, evaluation, assigned_date, completed_date'

export async function getWorkSample(candidateId: string): Promise<ProductionWorkSample | null> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client
    .from('hr_work_samples')
    .select(WORK_SAMPLE_SELECT_COLUMNS)
    .eq('candidate_id', candidateId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return toWorkSample(workSampleRowSchema.parse(data))
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
    .select(WORK_SAMPLE_SELECT_COLUMNS)
    .single()
  if (error) throw error
  if (!data) throw new Error('Failed to create work sample')
  return toWorkSample(workSampleRowSchema.parse(data))
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

/* ── Defense Interviews ─────────────────────────────────────────────────── */

export interface ProductionDefenseInterview {
  id: string
  candidateId: string
  workSampleId: string
  format: string
  scheduledDate: string
  interviewers: string[]
  status: string
  conversation: Array<Record<string, unknown>>
  assessment?: Record<string, unknown>
}

const defenseInterviewRowSchema = z.object({
  id: z.string(),
  candidate_id: z.string(),
  work_sample_id: z.string(),
  format: z.string(),
  scheduled_date: z.string(),
  interviewers: z.array(z.string()),
  status: z.string(),
  conversation: z.array(z.record(z.string(), z.unknown())),
  assessment: z.record(z.string(), z.unknown()).nullable(),
})

function toDefenseInterview(row: z.infer<typeof defenseInterviewRowSchema>): ProductionDefenseInterview {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    workSampleId: row.work_sample_id,
    format: row.format,
    scheduledDate: row.scheduled_date,
    interviewers: row.interviewers,
    status: row.status,
    conversation: row.conversation,
    assessment: row.assessment ?? undefined,
  }
}

const DEFENSE_INTERVIEW_SELECT_COLUMNS =
  'id, candidate_id, work_sample_id, format, scheduled_date, interviewers, status, conversation, assessment'

export async function getDefenseInterview(candidateId: string): Promise<ProductionDefenseInterview | null> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client
    .from('hr_defense_interviews')
    .select(DEFENSE_INTERVIEW_SELECT_COLUMNS)
    .eq('candidate_id', candidateId)
    .order('scheduled_date', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return toDefenseInterview(defenseInterviewRowSchema.parse(data))
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

function toAuthenticityScores(row: z.infer<typeof authenticityScoresRowSchema>): ProductionAuthenticityScores {
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

export async function getAuthenticityScores(candidateId: string): Promise<ProductionAuthenticityScores | null> {
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

/* ── Job Postings ─────────────────────────────────────────────────────── */

export interface ProductionJobPosting {
  id: string
  organizationId: string
  title: string
  department: string
  location: string
  type: string
  description: string
  requirements: string[]
  knockoutCriteria: string[]
  workSampleScenario: string
  status: string
  postedDate: string | null
  closingDate: string | null
}

const jobPostingRowSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  title: z.string(),
  department: z.string(),
  location: z.string(),
  type: z.string(),
  description: z.string(),
  requirements: z.array(z.string()),
  knockout_criteria: z.array(z.string()),
  work_sample_scenario: z.string(),
  status: z.string(),
  posted_date: z.string().nullable(),
  closing_date: z.string().nullable(),
})

function toJobPosting(row: z.infer<typeof jobPostingRowSchema>): ProductionJobPosting {
  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    department: row.department,
    location: row.location,
    type: row.type,
    description: row.description,
    requirements: row.requirements,
    knockoutCriteria: row.knockout_criteria,
    workSampleScenario: row.work_sample_scenario,
    status: row.status,
    postedDate: row.posted_date,
    closingDate: row.closing_date,
  }
}

export async function listJobPostings(organizationId: string): Promise<ProductionJobPosting[]> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const data = await fetchAllPages((from, to) =>
    client
      .from('hr_job_postings')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .range(from, to),
  )
  return z.array(jobPostingRowSchema).parse(data).map(toJobPosting)
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

const STAGE_ORDER: ProductionCandidateStatus[] = [
  'application',
  'basic_qualified',
  'evidence_qualified',
  'work_sample',
  'interview',
  'hired',
]

export async function getFunnelMetrics(organizationId: string): Promise<ProductionFunnelMetrics> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')

  const { data: candidates, error } = await client
    .from('hr_candidates')
    .select('status')
    .eq('organization_id', organizationId)

  if (error) throw error

  const active = (candidates ?? []).filter(
    (c): c is { status: ProductionCandidateStatus } =>
      !!c.status && c.status !== 'rejected' && STAGE_ORDER.includes(c.status as ProductionCandidateStatus),
  )

  const metrics: ProductionFunnelMetrics = {
    totalApplications: active.filter((c) => STAGE_ORDER.indexOf(c.status) >= 0).length,
    basicQualified: active.filter((c) => STAGE_ORDER.indexOf(c.status) >= 1).length,
    evidenceQualified: active.filter((c) => STAGE_ORDER.indexOf(c.status) >= 2).length,
    workSamples: active.filter((c) => STAGE_ORDER.indexOf(c.status) >= 3).length,
    interviews: active.filter((c) => STAGE_ORDER.indexOf(c.status) >= 4).length,
    hires: active.filter((c) => STAGE_ORDER.indexOf(c.status) >= 5).length,
  }

  return metrics
}
