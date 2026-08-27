import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import type { TablesUpdate } from '@/lib/supabase/types'
import { fetchAllPages } from '@/lib/supabasePagination'

/**
 * Real persistence for the Policy register (production mode) —
 * public.hr_policies, org-scoped by RLS (migration 0008). Same boundary
 * contract as the other productionApis: zod-validated rows, throws on
 * failure. A row can be a written policy (up to date / needs review) or a
 * known gap ('missing') — identified gaps live in the same register.
 */

export type ProductionPolicyStatus = 'up_to_date' | 'needs_review' | 'missing'

export const PRODUCTION_POLICY_STATUSES: readonly ProductionPolicyStatus[] = [
  'up_to_date',
  'needs_review',
  'missing',
]

export interface ProductionPolicy {
  id: string
  name: string
  status: ProductionPolicyStatus
  lastReviewed: string | null
}

export interface NewPolicy {
  name: string
  status: ProductionPolicyStatus
  lastReviewed: string
}

const rowSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['up_to_date', 'needs_review', 'missing']),
  last_reviewed: z.string().nullable(),
})

const SELECT_COLUMNS = 'id, name, status, last_reviewed'

function toPolicy(row: z.infer<typeof rowSchema>): ProductionPolicy {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    lastReviewed: row.last_reviewed,
  }
}

export async function listPolicies(organizationId: string): Promise<ProductionPolicy[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const client = supabase
  const data = await fetchAllPages((from, to) =>
    client
      .from('hr_policies')
      .select(SELECT_COLUMNS)
      .eq('organization_id', organizationId)
      .order('name')
      .order('id')
      .range(from, to),
  )
  return z.array(rowSchema).parse(data).map(toPolicy)
}

export async function addPolicy(
  organizationId: string,
  fields: NewPolicy,
): Promise<ProductionPolicy> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_policies')
    .insert({
      organization_id: organizationId,
      name: fields.name,
      status: fields.status,
      last_reviewed: fields.lastReviewed || null,
    })
    .select(SELECT_COLUMNS)
    .single()
  if (error) throw error
  return toPolicy(rowSchema.parse(data))
}

/**
 * Status transition. Moving to up_to_date is a review — it stamps
 * last_reviewed to today (the caller passes the date so tests stay
 * deterministic); other statuses leave the review date untouched.
 */
export async function setPolicyStatus(
  id: string,
  status: ProductionPolicyStatus,
  reviewedOn?: string,
): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const patch: TablesUpdate<'hr_policies'> = { status, updated_at: new Date().toISOString() }
  if (status === 'up_to_date' && reviewedOn) patch.last_reviewed = reviewedOn
  const { error } = await supabase.from('hr_policies').update(patch).eq('id', id)
  if (error) throw error
}

export async function removePolicy(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.from('hr_policies').delete().eq('id', id)
  if (error) throw error
}
