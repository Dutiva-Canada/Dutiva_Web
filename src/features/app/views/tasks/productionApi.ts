import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import type { Json } from '@/lib/supabase/database.types'
import { fetchAllPages } from '@/lib/supabasePagination'

/**
 * Real persistence for Tasks (production mode) — reads and writes the
 * backend's own public.compliance_tasks table (no new migration: it
 * already exists, org-scoped, with RLS letting org members manage their
 * org's tasks). Same boundary contract as the employees/cases
 * productionApis: zod-validated rows, throws on failure.
 *
 * The table's status vocabulary is richer than the checklist UI
 * (open/in_progress/blocked/completed/cancelled) — the view treats
 * 'completed' as done and everything else as open, and only ever writes
 * 'open'/'completed', so rows created by the backend's automation render
 * correctly without the UI needing their full lifecycle yet.
 */

export type ProductionTaskPriority = 'low' | 'medium' | 'high' | 'critical'

export const PRODUCTION_TASK_PRIORITIES: readonly ProductionTaskPriority[] = [
  'low',
  'medium',
  'high',
  'critical',
]

/** A user note on a task, stored in the row's jsonb metadata.notes. */
export interface TaskNote {
  id: string
  text: string
  /** ISO timestamp. */
  at: string
}

export interface ProductionTask {
  id: string
  title: string
  priority: ProductionTaskPriority
  status: string
  done: boolean
  /** Table category ('general' default; pipeline/module rows set others). */
  category: string
  /** YYYY-MM-DD, derived from the table's timestamptz due_at. */
  dueDate: string | null
  /** Advisor-authored work plan — the table's own description column. */
  description: string | null
  jurisdiction: string | null
  assignedTo: string | null
  /** User notes from metadata.notes. */
  notes: TaskNote[]
  /** From metadata.employee_id, when the task is linked to a person. */
  linkedEmployeeId: string | null
  /** From metadata.kind — e.g. 'probation_review' for tasks this app creates. */
  linkedKind: string | null
}

export interface NewTask {
  title: string
  priority: ProductionTaskPriority
  dueDate: string
  /** Optional Advisor-authored plan, stored to the description column. */
  details?: string
}

const noteSchema = z.object({
  id: z.string(),
  text: z.string(),
  at: z.string(),
})

const rowSchema = z.object({
  id: z.string(),
  title: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.string(),
  category: z.string(),
  due_at: z.string().nullable(),
  /* Nullish (not just nullable): real rows always return these columns, but
     older test mocks may omit the keys entirely. */
  description: z.string().nullish(),
  jurisdiction: z.string().nullish(),
  assigned_to: z.string().nullish(),
  /* Optional-tolerant: the table's jsonb metadata carries the employee
     linkage this app writes ({employee_id, kind}) and the user notes list
     ({notes: TaskNote[]}); rows from the backend's pipeline (or older test
     mocks) may have anything or nothing here. */
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

const SELECT_COLUMNS =
  'id, title, priority, status, category, due_at, description, jurisdiction, assigned_to, metadata'

function toTask(row: z.infer<typeof rowSchema>): ProductionTask {
  const meta = row.metadata ?? {}
  const notes = z.array(noteSchema).safeParse(meta.notes)
  return {
    id: row.id,
    title: row.title,
    priority: row.priority,
    status: row.status,
    category: row.category,
    done: row.status === 'completed',
    dueDate: row.due_at ? row.due_at.slice(0, 10) : null,
    description: row.description ?? null,
    jurisdiction: row.jurisdiction ?? null,
    assignedTo: row.assigned_to ?? null,
    notes: notes.success ? notes.data : [],
    linkedEmployeeId: typeof meta.employee_id === 'string' ? meta.employee_id : null,
    linkedKind: typeof meta.kind === 'string' ? meta.kind : null,
  }
}

export async function listTasks(organizationId: string): Promise<ProductionTask[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const client = supabase
  const data = await fetchAllPages((from, to) =>
    client
      .from('compliance_tasks')
      .select(SELECT_COLUMNS)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .order('id')
      .range(from, to),
  )
  return z.array(rowSchema).parse(data).map(toTask)
}

export async function addTask(organizationId: string, fields: NewTask): Promise<ProductionTask> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('compliance_tasks')
    .insert({
      organization_id: organizationId,
      title: fields.title,
      priority: fields.priority,
      due_at: fields.dueDate || null,
      description: fields.details || null,
    })
    .select(SELECT_COLUMNS)
    .single()
  if (error) throw error
  return toTask(rowSchema.parse(data))
}

/** Single row for the detail route. */
export async function getTask(id: string): Promise<ProductionTask> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('compliance_tasks')
    .select(SELECT_COLUMNS)
    .eq('id', id)
    .single()
  if (error) throw error
  return toTask(rowSchema.parse(data))
}

/** Overwrite the Advisor-authored plan on the detail view. */
export async function updateTaskDescription(id: string, description: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('compliance_tasks')
    .update({ description, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

/**
 * Append a user note to metadata.notes — read-modify-write so the merge keeps
 * sibling keys (employee_id, kind) the row already carries.
 */
export async function addTaskNote(id: string, text: string): Promise<TaskNote> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('compliance_tasks')
    .select('metadata')
    .eq('id', id)
    .single()
  if (error) throw error
  const meta = (data?.metadata ?? {}) as Record<string, unknown>
  const prev = z.array(noteSchema).safeParse(meta.notes)
  const note: TaskNote = { id: crypto.randomUUID(), text, at: new Date().toISOString() }
  const { error: updateError } = await supabase
    .from('compliance_tasks')
    .update({
      metadata: { ...meta, notes: [...(prev.success ? prev.data : []), note] } as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (updateError) throw updateError
  return note
}

/**
 * A probation-review task linked to its employee through the table's jsonb
 * metadata ({employee_id, kind: 'probation_review'}) — the linkage the
 * profile and the Analytics probation card check, exactly, instead of
 * guessing from titles. Category 'review' is in the table's own vocabulary.
 */
export async function addProbationReviewTask(
  organizationId: string,
  employeeId: string,
  title: string,
  dueDate: string | null,
): Promise<ProductionTask> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('compliance_tasks')
    .insert({
      organization_id: organizationId,
      title,
      priority: 'medium',
      category: 'review',
      due_at: dueDate,
      metadata: { employee_id: employeeId, kind: 'probation_review' },
    })
    .select(SELECT_COLUMNS)
    .single()
  if (error) throw error
  return toTask(rowSchema.parse(data))
}

/** True when an open probation-review task is linked to this employee. */
export function hasProbationReviewTask(
  tasks: readonly ProductionTask[],
  employeeId: string,
): boolean {
  return tasks.some(
    (t) => !t.done && t.linkedKind === 'probation_review' && t.linkedEmployeeId === employeeId,
  )
}

/** Checklist toggle: done ⇄ open, stamping/clearing completed_at. */
export async function setTaskDone(id: string, done: boolean): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('compliance_tasks')
    .update({
      status: done ? 'completed' : 'open',
      completed_at: done ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}

export async function removeTask(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.from('compliance_tasks').delete().eq('id', id)
  if (error) throw error
}

/** Open-task count for the nav badge — matches the checklist's !done rule. */
export async function countOpenTasks(organizationId: string): Promise<number> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { count, error } = await supabase
    .from('compliance_tasks')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .neq('status', 'completed')
  if (error) throw error
  return count ?? 0
}
