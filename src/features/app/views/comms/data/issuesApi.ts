import { supabase } from '@/lib/supabaseClient'
import type { Bi } from '@/i18n/core'
import type { CommsIssue } from './types'

function fromRow(raw: unknown): CommsIssue {
  const row = raw as {
    id: string
    initiative_id: string | null
    title: unknown
    severity: string
    status: string
    lead: string
    spokesperson: string | null
    affected_channels: string[]
    restricted: boolean
    summary: unknown
    resolution: unknown
  }
  return {
    id: row.id,
    initiativeId: row.initiative_id ?? undefined,
    title: (row.title as Bi | undefined) ?? { en: '', fr: '' },
    severity: row.severity as CommsIssue['severity'],
    status: row.status as CommsIssue['status'],
    lead: row.lead,
    spokesperson: row.spokesperson ?? undefined,
    affectedChannels: row.affected_channels as CommsIssue['affectedChannels'],
    restricted: row.restricted,
    summary: row.summary as Bi | undefined,
    resolution: row.resolution as Bi | undefined,
  }
}

function toRow(workspaceOrgId: string, item: Omit<CommsIssue, 'id'>) {
  return {
    organization_id: workspaceOrgId,
    initiative_id: item.initiativeId ?? null,
    title: item.title as unknown,
    severity: item.severity,
    status: item.status,
    lead: item.lead,
    spokesperson: item.spokesperson ?? null,
    affected_channels: item.affectedChannels,
    restricted: item.restricted,
    summary: item.summary ?? null,
    resolution: item.resolution ?? null,
  }
}

function patchToRow(patch: Partial<CommsIssue>) {
  const row: Record<string, unknown> = {}
  if (patch.initiativeId !== undefined) row.initiative_id = patch.initiativeId ?? null
  if (patch.title !== undefined) row.title = patch.title as unknown
  if (patch.severity !== undefined) row.severity = patch.severity
  if (patch.status !== undefined) row.status = patch.status
  if (patch.lead !== undefined) row.lead = patch.lead
  if (patch.spokesperson !== undefined) row.spokesperson = patch.spokesperson ?? null
  if (patch.affectedChannels !== undefined) row.affected_channels = patch.affectedChannels
  if (patch.restricted !== undefined) row.restricted = patch.restricted
  if (patch.summary !== undefined) row.summary = patch.summary ?? null
  if (patch.resolution !== undefined) row.resolution = patch.resolution ?? null
  return row
}

export async function listIssues(workspaceOrgId: string): Promise<CommsIssue[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_issues')
    .select('*')
    .eq('organization_id', workspaceOrgId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function addIssue(
  workspaceOrgId: string,
  item: Omit<CommsIssue, 'id'>,
): Promise<CommsIssue> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_issues')
    .insert(toRow(workspaceOrgId, item) as any)
    .select('*')
    .single()
  if (error) throw error
  return fromRow(data)
}

export async function updateIssue(
  workspaceOrgId: string,
  id: string,
  patch: Partial<CommsIssue>,
): Promise<CommsIssue | null> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_issues')
    .update(patchToRow(patch) as any)
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
    .select('*')
    .single()
  if (error) throw error
  return data ? fromRow(data) : null
}

export async function removeIssue(workspaceOrgId: string, id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('comms_issues')
    .delete()
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
  if (error) throw error
}
