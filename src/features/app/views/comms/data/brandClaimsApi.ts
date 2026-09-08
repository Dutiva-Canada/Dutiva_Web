import { supabase } from '@/lib/supabaseClient'
import type { Bi } from '@/i18n/core'
import type { CommsBrandClaim } from './types'

function fromRow(raw: unknown): CommsBrandClaim {
  const row = raw as {
    id: string
    text: unknown
    evidence: unknown
    owner: string
    review_date: string | null
    status: string
  }
  return {
    id: row.id,
    text: (row.text as Bi | undefined) ?? { en: '', fr: '' },
    evidence: (row.evidence as Bi | undefined) ?? { en: '', fr: '' },
    owner: row.owner,
    reviewDate: row.review_date ?? undefined,
    status: row.status as CommsBrandClaim['status'],
  }
}

function toRow(workspaceOrgId: string, item: Omit<CommsBrandClaim, 'id'>) {
  return {
    organization_id: workspaceOrgId,
    text: item.text as unknown,
    evidence: item.evidence as unknown,
    owner: item.owner,
    review_date: item.reviewDate ?? null,
    status: item.status,
  }
}

function patchToRow(patch: Partial<CommsBrandClaim>) {
  const row: Record<string, unknown> = {}
  if (patch.text !== undefined) row.text = patch.text as unknown
  if (patch.evidence !== undefined) row.evidence = patch.evidence as unknown
  if (patch.owner !== undefined) row.owner = patch.owner
  if (patch.reviewDate !== undefined) row.review_date = patch.reviewDate ?? null
  if (patch.status !== undefined) row.status = patch.status
  return row
}

export async function listBrandClaims(workspaceOrgId: string): Promise<CommsBrandClaim[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_brand_claims')
    .select('*')
    .eq('organization_id', workspaceOrgId)
    .order('review_date', { ascending: true })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function addBrandClaim(
  workspaceOrgId: string,
  item: Omit<CommsBrandClaim, 'id'>,
): Promise<CommsBrandClaim> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_brand_claims')
    .insert(toRow(workspaceOrgId, item) as any)
    .select('*')
    .single()
  if (error) throw error
  return fromRow(data)
}

export async function updateBrandClaim(
  workspaceOrgId: string,
  id: string,
  patch: Partial<CommsBrandClaim>,
): Promise<CommsBrandClaim | null> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_brand_claims')
    .update(patchToRow(patch) as any)
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
    .select('*')
    .single()
  if (error) throw error
  return data ? fromRow(data) : null
}

export async function removeBrandClaim(workspaceOrgId: string, id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('comms_brand_claims')
    .delete()
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
  if (error) throw error
}
