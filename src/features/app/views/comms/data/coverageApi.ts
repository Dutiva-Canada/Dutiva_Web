import { supabase } from '@/lib/supabaseClient'
import type { Bi } from '@/i18n/core'
import type { CommsCoverageItem, CommsCoverageSentiment } from './types'

function fromRow(row: {
  id: string
  initiative_id: string | null
  source_id: string | null
  outlet: unknown
  headline: unknown
  language: string
  published_date: string | null
  url: string | null
  reach: number | null
  sentiment: string | null
  provenance: string
  owner: string
  notes: unknown
}): CommsCoverageItem {
  return {
    id: row.id,
    initiativeId: row.initiative_id ?? undefined,
    sourceId: row.source_id ?? undefined,
    outlet: row.outlet as Bi,
    headline: row.headline as Bi,
    language: row.language as 'en' | 'fr' | 'bilingual',
    publishedDate: row.published_date ?? undefined,
    url: row.url ?? undefined,
    reach: row.reach ?? undefined,
    sentiment: row.sentiment as CommsCoverageSentiment | undefined,
    provenance: row.provenance as 'manual' | 'provider' | 'ai_estimate',
    owner: row.owner,
    notes: row.notes as Bi | undefined,
  }
}

function toRow(workspaceOrgId: string, item: Omit<CommsCoverageItem, 'id'>) {
  return {
    organization_id: workspaceOrgId,
    initiative_id: item.initiativeId ?? null,
    source_id: item.sourceId ?? null,
    outlet: item.outlet as unknown,
    headline: item.headline as unknown,
    language: item.language,
    published_date: item.publishedDate ?? null,
    url: item.url ?? null,
    reach: item.reach ?? null,
    sentiment: item.sentiment ?? null,
    provenance: item.provenance,
    owner: item.owner,
    notes: item.notes ?? null,
  }
}

function patchToRow(patch: Partial<CommsCoverageItem>) {
  const row: Record<string, unknown> = {}
  if (patch.initiativeId !== undefined) row.initiative_id = patch.initiativeId ?? null
  if (patch.sourceId !== undefined) row.source_id = patch.sourceId ?? null
  if (patch.outlet !== undefined) row.outlet = patch.outlet as unknown
  if (patch.headline !== undefined) row.headline = patch.headline as unknown
  if (patch.language !== undefined) row.language = patch.language
  if (patch.publishedDate !== undefined) row.published_date = patch.publishedDate ?? null
  if (patch.url !== undefined) row.url = patch.url ?? null
  if (patch.reach !== undefined) row.reach = patch.reach ?? null
  if (patch.sentiment !== undefined) row.sentiment = patch.sentiment ?? null
  if (patch.provenance !== undefined) row.provenance = patch.provenance
  if (patch.owner !== undefined) row.owner = patch.owner
  if (patch.notes !== undefined) row.notes = patch.notes ?? null
  return row
}

export async function listCoverageItems(workspaceOrgId: string): Promise<CommsCoverageItem[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_coverage_items')
    .select('*')
    .eq('organization_id', workspaceOrgId)
    .order('published_date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function addCoverageItem(
  workspaceOrgId: string,
  item: Omit<CommsCoverageItem, 'id'>,
): Promise<CommsCoverageItem> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_coverage_items')
    .insert(toRow(workspaceOrgId, item) as any)
    .select('*')
    .single()
  if (error) throw error
  return fromRow(data)
}

export async function updateCoverageItem(
  workspaceOrgId: string,
  id: string,
  patch: Partial<CommsCoverageItem>,
): Promise<CommsCoverageItem | null> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_coverage_items')
    .update(patchToRow(patch) as any)
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
    .select('*')
    .single()
  if (error) throw error
  return data ? fromRow(data) : null
}

export async function removeCoverageItem(workspaceOrgId: string, id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('comms_coverage_items')
    .delete()
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
  if (error) throw error
}
