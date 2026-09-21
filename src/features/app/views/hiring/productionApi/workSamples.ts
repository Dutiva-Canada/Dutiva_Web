import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import type { Json, TablesUpdate } from '@/lib/supabase/types'

/* ── Work Samples ───────────────────────────────────────────────────────── */

export type ProductionAssessmentType =
  'product_manager' | 'sales' | 'engineer' | 'marketer' | 'general'
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
  const { error } = await client.from('hr_work_samples').update(row).eq('id', id)
  if (error) throw error
}
