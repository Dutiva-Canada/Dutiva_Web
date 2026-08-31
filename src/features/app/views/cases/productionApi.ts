import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'

/**
 * Real persistence for Case Files (production mode) — public.hr_cases,
 * org-scoped by RLS (migration 0007). Same boundary contract as the
 * employees productionApi: zod-validated rows, throws on failure (these
 * calls only run for the signed-in admin in production, where an error
 * must surface).
 */

export type ProductionCaseType = 'Termination' | 'Performance' | 'Accommodation' | 'Onboarding'
export type ProductionCaseStatus = 'open' | 'in_review' | 'resolved'

export const PRODUCTION_CASE_TYPES: readonly ProductionCaseType[] = [
  'Termination',
  'Performance',
  'Accommodation',
  'Onboarding',
]

export const PRODUCTION_CASE_STATUSES: readonly ProductionCaseStatus[] = [
  'open',
  'in_review',
  'resolved',
]

export interface ProductionCase {
  id: string
  title: string
  caseType: ProductionCaseType
  employeeId: string | null
  /** Governing jurisdiction — full English name stored in DB column `jurisdiction`. */
  jurisdiction: string
  status: ProductionCaseStatus
  dueDate: string | null
  /** ISO timestamp the row was created — Analytics derives case aging from it. */
  createdAt: string
}

export interface NewCase {
  title: string
  caseType: ProductionCaseType
  employeeId: string
  jurisdiction: string
  dueDate: string
}

const rowSchema = z.object({
  id: z.string(),
  title: z.string(),
  case_type: z.enum(['Termination', 'Performance', 'Accommodation', 'Onboarding']),
  employee_id: z.string().nullable(),
  jurisdiction: z.string(),
  status: z.enum(['open', 'in_review', 'resolved']),
  due_date: z.string().nullable(),
  created_at: z.string(),
})

const SELECT_COLUMNS =
  'id, title, case_type, employee_id, jurisdiction, status, due_date, created_at'

function toCase(row: z.infer<typeof rowSchema>): ProductionCase {
  return {
    id: row.id,
    title: row.title,
    caseType: row.case_type,
    employeeId: row.employee_id,
    jurisdiction: row.jurisdiction,
    status: row.status,
    dueDate: row.due_date,
    createdAt: row.created_at,
  }
}

export async function listCases(organizationId: string): Promise<ProductionCase[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_cases')
    .select(SELECT_COLUMNS)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return z.array(rowSchema).parse(data).map(toCase)
}

export async function addCase(organizationId: string, fields: NewCase): Promise<ProductionCase> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_cases')
    .insert({
      organization_id: organizationId,
      title: fields.title,
      case_type: fields.caseType,
      employee_id: fields.employeeId || null,
      jurisdiction: fields.jurisdiction,
      due_date: fields.dueDate || null,
    })
    .select(SELECT_COLUMNS)
    .single()
  if (error) throw error
  const created = toCase(rowSchema.parse(data))
  /* Best-effort Memory timeline seed — never fail case creation on it. */
  try {
    const { addCaseTimelineEvent } = await import('@/features/app/views/memory/caseNarrativeApi')
    await addCaseTimelineEvent(organizationId, created.id, {
      bodyEn: `Case opened: ${created.title}`,
      bodyFr: `Dossier ouvert : ${created.title}`,
      sessionLabelEn: 'Case opened',
      sessionLabelFr: 'Dossier ouvert',
      source: 'system',
      occurredAt: created.createdAt,
    })
  } catch {
    /* timeline is additive */
  }
  return created
}

export async function updateCaseStatus(id: string, status: ProductionCaseStatus): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('hr_cases')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function removeCase(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.from('hr_cases').delete().eq('id', id)
  if (error) throw error
}

/* ── Case detail (Phase 11): single-case fetch + the notes thread ───────── */

export interface ProductionCaseNote {
  id: string
  body: string
  /** ISO timestamp — displayed date-only. */
  createdAt: string
}

const noteRowSchema = z.object({
  id: z.string(),
  body: z.string(),
  created_at: z.string(),
})

export async function getCase(id: string): Promise<ProductionCase | null> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_cases')
    .select(SELECT_COLUMNS)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return toCase(rowSchema.parse(data))
}

export async function listCaseNotes(caseId: string): Promise<ProductionCaseNote[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_case_notes')
    .select('id, body, created_at')
    .eq('case_id', caseId)
    .order('created_at')
  if (error) throw error
  return z
    .array(noteRowSchema)
    .parse(data)
    .map((r) => ({ id: r.id, body: r.body, createdAt: r.created_at }))
}

export async function addCaseNote(
  organizationId: string,
  caseId: string,
  body: string,
): Promise<ProductionCaseNote> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_case_notes')
    .insert({ organization_id: organizationId, case_id: caseId, body })
    .select('id, body, created_at')
    .single()
  if (error) throw error
  const row = noteRowSchema.parse(data)
  /* Mirror the note onto the Memory case timeline (0087). */
  try {
    const { addCaseTimelineEvent } = await import('@/features/app/views/memory/caseNarrativeApi')
    await addCaseTimelineEvent(organizationId, caseId, {
      bodyEn: row.body,
      bodyFr: row.body,
      sessionLabelEn: 'Case note',
      sessionLabelFr: 'Note de dossier',
      source: 'note',
      occurredAt: row.created_at,
    })
  } catch {
    /* timeline is additive */
  }
  return { id: row.id, body: row.body, createdAt: row.created_at }
}

/** Open-case count for the nav badge — a server-side head count, no rows. */
export async function countOpenCases(organizationId: string): Promise<number> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { count, error } = await supabase
    .from('hr_cases')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .neq('status', 'resolved')
  if (error) throw error
  return count ?? 0
}
