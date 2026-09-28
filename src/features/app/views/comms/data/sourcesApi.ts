import { supabase } from '@/lib/supabaseClient'
import { toJson } from '@/lib/supabaseJson'
import type { Bi } from '@/i18n/core'
import type { TablesInsert } from '@/lib/supabase/types'
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

function toRow(
  workspaceOrgId: string,
  item: Omit<CommsSource, 'id'>,
): TablesInsert<'comms_sources'> {
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

export async function removeSource(workspaceOrgId: string, id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('comms_sources')
    .delete()
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
  if (error) throw error
}
