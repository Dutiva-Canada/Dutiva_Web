import { supabase } from '@/lib/supabaseClient'
import { toJson } from '@/lib/supabaseJson'
import type { Bi } from '@/i18n/core'
import type { TablesInsert, TablesUpdate } from '@/lib/supabase/types'
import type { CommsSource } from './types'

function fromRow(raw: unknown): CommsSource {
  const row = raw as {
    id: string
    initiative_id: string | null
    issue_id: string | null
    source_type: string
    url: string | null
    publisher: unknown
    published_date: string | null
    retrieved_at: string | null
    jurisdiction: unknown
    rights: unknown
    classification: unknown
    supports: unknown
  }
  return {
    id: row.id,
    initiativeId: row.initiative_id ?? undefined,
    issueId: row.issue_id ?? undefined,
    sourceType: row.source_type as CommsSource['sourceType'],
    url: row.url ?? undefined,
    publisher: (row.publisher as Bi | undefined) ?? { en: '', fr: '' },
    publishedDate: row.published_date ?? undefined,
    retrievedAt: row.retrieved_at ?? undefined,
    jurisdiction: row.jurisdiction as Bi | undefined,
    rights: row.rights as Bi | undefined,
    classification: (row.classification as Bi | undefined) ?? { en: '', fr: '' },
    supports: row.supports as Bi | undefined,
  }
}

function toRow(workspaceOrgId: string, item: Omit<CommsSource, 'id'>): TablesInsert<'comms_sources'> {
  return {
    organization_id: workspaceOrgId,
    initiative_id: item.initiativeId ?? null,
    issue_id: item.issueId ?? null,
    source_type: item.sourceType,
    url: item.url ?? null,
    publisher: toJson(item.publisher),
    published_date: item.publishedDate ?? null,
    retrieved_at: item.retrievedAt ?? null,
    jurisdiction: toJson(item.jurisdiction ?? null),
    rights: toJson(item.rights ?? null),
    classification: toJson(item.classification),
    supports: toJson(item.supports ?? null),
  }
}

function patchToRow(patch: Partial<CommsSource>): TablesUpdate<'comms_sources'> {
  const row: TablesUpdate<'comms_sources'> = {}
  if (patch.initiativeId !== undefined) row.initiative_id = patch.initiativeId ?? null
  if (patch.issueId !== undefined) row.issue_id = patch.issueId ?? null
  if (patch.sourceType !== undefined) row.source_type = patch.sourceType
  if (patch.url !== undefined) row.url = patch.url ?? null
  if (patch.publisher !== undefined) row.publisher = toJson(patch.publisher)
  if (patch.publishedDate !== undefined) row.published_date = patch.publishedDate ?? null
  if (patch.retrievedAt !== undefined) row.retrieved_at = patch.retrievedAt ?? null
  if (patch.jurisdiction !== undefined) row.jurisdiction = toJson(patch.jurisdiction ?? null)
  if (patch.rights !== undefined) row.rights = toJson(patch.rights ?? null)
  if (patch.classification !== undefined) row.classification = toJson(patch.classification)
  if (patch.supports !== undefined) row.supports = toJson(patch.supports ?? null)
  return row
}

export async function listSources(workspaceOrgId: string): Promise<CommsSource[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_sources')
    .select('*')
    .eq('organization_id', workspaceOrgId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function addSource(
  workspaceOrgId: string,
  item: Omit<CommsSource, 'id'>,
): Promise<CommsSource> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_sources')
    .insert(toRow(workspaceOrgId, item))
    .select('*')
    .single()
  if (error) throw error
  return fromRow(data)
}

export async function updateSource(
  workspaceOrgId: string,
  id: string,
  patch: Partial<CommsSource>,
): Promise<CommsSource | null> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_sources')
    .update(patchToRow(patch))
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
    .select('*')
    .single()
  if (error) throw error
  return data ? fromRow(data) : null
}

export async function removeSource(workspaceOrgId: string, id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('comms_sources')
    .delete()
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
  if (error) throw error
}
