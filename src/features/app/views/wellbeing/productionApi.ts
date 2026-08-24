import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'

/**
 * Real persistence for the Wellbeing register (production mode) —
 * public.hr_wellbeing_initiatives, org-scoped by RLS (migration 0041). Same
 * boundary contract as the other productionApis: zod-validated rows, throws
 * on failure.
 *
 * **This records what the employer offers, never who is struggling.** There
 * is no employee reference in this module and there must not be one — the
 * migration header carries the full reasoning. The demo's per-person "support
 * signals" with confidence scores are not persisted, because inferred health
 * information about an identifiable person is the one thing Ring 2 is built
 * to avoid recording.
 *
 * Per-person support belongs on the accommodation path (hr_cases plus the
 * duty-to-accommodate flow), where there is an actual request and the
 * employee is a participant rather than a subject.
 */

export type ProductionInitiativeKind =
  'eap' | 'training' | 'policy' | 'check_in' | 'accommodation_support' | 'other'

export type ProductionInitiativeStatus = 'planned' | 'active' | 'paused' | 'retired'

export const PRODUCTION_INITIATIVE_KINDS: readonly ProductionInitiativeKind[] = [
  'eap',
  'training',
  'policy',
  'check_in',
  'accommodation_support',
  'other',
]

export const PRODUCTION_INITIATIVE_STATUSES: readonly ProductionInitiativeStatus[] = [
  'planned',
  'active',
  'paused',
  'retired',
]

export interface ProductionInitiative {
  id: string
  name: string
  kind: ProductionInitiativeKind
  status: ProductionInitiativeStatus
  owner: string | null
  reviewDate: string | null
  note: string | null
}

export interface UpdateInitiative {
  name: string
  kind: ProductionInitiativeKind
  status: ProductionInitiativeStatus
  owner: string
  reviewDate: string
  note: string
}

export interface NewInitiative {
  name: string
  kind: ProductionInitiativeKind
  status: ProductionInitiativeStatus
  owner: string
  reviewDate: string
  note: string
}

const rowSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(['eap', 'training', 'policy', 'check_in', 'accommodation_support', 'other']),
  status: z.enum(['planned', 'active', 'paused', 'retired']),
  owner: z.string().nullable(),
  review_date: z.string().nullable(),
  note: z.string().nullable(),
})

const SELECT_COLUMNS = 'id, name, kind, status, owner, review_date, note'

function toInitiative(row: z.infer<typeof rowSchema>): ProductionInitiative {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    status: row.status,
    owner: row.owner,
    reviewDate: row.review_date,
    note: row.note,
  }
}

export async function listInitiatives(organizationId: string): Promise<ProductionInitiative[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_wellbeing_initiatives')
    .select(SELECT_COLUMNS)
    .eq('organization_id', organizationId)
    .order('name')
  if (error) throw error
  return z.array(rowSchema).parse(data).map(toInitiative)
}

export async function addInitiative(
  organizationId: string,
  fields: NewInitiative,
): Promise<ProductionInitiative> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_wellbeing_initiatives')
    .insert({
      organization_id: organizationId,
      name: fields.name,
      kind: fields.kind,
      status: fields.status,
      owner: fields.owner.trim() || null,
      review_date: fields.reviewDate || null,
      note: fields.note.trim() || null,
    })
    .select(SELECT_COLUMNS)
    .single()
  if (error) throw error
  return toInitiative(rowSchema.parse(data))
}

export async function setInitiativeStatus(
  id: string,
  status: ProductionInitiativeStatus,
): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('hr_wellbeing_initiatives')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function updateInitiative(
  id: string,
  fields: UpdateInitiative,
): Promise<ProductionInitiative> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_wellbeing_initiatives')
    .update({
      name: fields.name,
      kind: fields.kind,
      status: fields.status,
      owner: fields.owner.trim() || null,
      review_date: fields.reviewDate || null,
      note: fields.note.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(SELECT_COLUMNS)
    .single()
  if (error) throw error
  return toInitiative(rowSchema.parse(data))
}

export async function removeInitiative(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.from('hr_wellbeing_initiatives').delete().eq('id', id)
  if (error) throw error
}

/**
 * Initiatives whose review date has passed — the one number this module
 * surfaces as a count. A review date nobody acts on is the failure mode a
 * wellbeing register actually has, and it is the employer's own data rather
 * than anything inferred.
 */
export function overdueReviews(
  rows: ProductionInitiative[],
  today: string,
): ProductionInitiative[] {
  return rows.filter((r) => r.status !== 'retired' && r.reviewDate !== null && r.reviewDate < today)
}
