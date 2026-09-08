import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import { fetchAllPages } from '@/lib/supabasePagination'
import type { EntityLink, EntityLinkInsert } from './types'

const entityLinkRowSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  from_table: z.string(),
  from_id: z.string(),
  to_table: z.string(),
  to_id: z.string(),
  relationship: z.string(),
  created_by: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
})

export const entityLinkInsertSchema = z.object({
  organization_id: z.string(),
  from_table: z.string().min(1),
  from_id: z.string().min(1),
  to_table: z.string().min(1),
  to_id: z.string().min(1),
  relationship: z.string().min(1).default('relates_to'),
  created_by: z.string().nullable().optional(),
})

function toEntityLink(row: z.infer<typeof entityLinkRowSchema>): EntityLink {
  return { ...row }
}

function getClient() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

export interface EntityLinkFilters {
  fromTable?: string
  fromId?: string
  toTable?: string
  toId?: string
}

export async function listEntityLinks(
  organizationId: string,
  filters: EntityLinkFilters = {},
): Promise<EntityLink[]> {
  const client = getClient()
  const data = await fetchAllPages((from, to) => {
    let query = client
      .from('entity_links')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at')
      .order('id')
    if (filters.fromTable) query = query.eq('from_table', filters.fromTable)
    if (filters.fromId) query = query.eq('from_id', filters.fromId)
    if (filters.toTable) query = query.eq('to_table', filters.toTable)
    if (filters.toId) query = query.eq('to_id', filters.toId)
    return query.range(from, to)
  })
  const parsed = z.array(entityLinkRowSchema).parse(data)
  return parsed.map(toEntityLink)
}

export async function createEntityLink(
  organizationId: string,
  values: Omit<EntityLinkInsert, 'organization_id'>,
): Promise<EntityLink> {
  const client = getClient()
  const insert = entityLinkInsertSchema.parse({ ...values, organization_id: organizationId })
  const { data, error } = await client.from('entity_links').insert(insert).select().single()
  if (error) throw new Error(error.message)
  return toEntityLink(entityLinkRowSchema.parse(data))
}

export async function deleteEntityLink(id: string): Promise<void> {
  const client = getClient()
  const { error } = await client.from('entity_links').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
