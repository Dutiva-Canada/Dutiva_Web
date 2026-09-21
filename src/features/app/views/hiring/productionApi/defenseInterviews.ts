import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'

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

function toDefenseInterview(
  row: z.infer<typeof defenseInterviewRowSchema>,
): ProductionDefenseInterview {
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

export async function getDefenseInterview(
  candidateId: string,
): Promise<ProductionDefenseInterview | null> {
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
