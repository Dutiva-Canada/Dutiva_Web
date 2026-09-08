import { supabase } from '@/lib/supabaseClient'
import type { Bi } from '@/i18n/core'
import type { CommsObjective } from './types'

function fromRow(raw: unknown): CommsObjective {
  const row = raw as {
    id: string
    initiative_id: string
    label: unknown
    baseline: string | null
    target: string | null
    period: unknown
    owner: string
    evidence_source: unknown
  }
  return {
    id: row.id,
    initiativeId: row.initiative_id,
    label: (row.label as Bi | undefined) ?? { en: '', fr: '' },
    baseline: row.baseline ?? undefined,
    target: row.target ?? undefined,
    period: row.period as Bi | undefined,
    owner: row.owner,
    evidenceSource: row.evidence_source as Bi | undefined,
  }
}

function toRow(workspaceOrgId: string, item: Omit<CommsObjective, 'id'>) {
  return {
    organization_id: workspaceOrgId,
    initiative_id: item.initiativeId,
    label: item.label as unknown,
    baseline: item.baseline ?? null,
    target: item.target ?? null,
    period: item.period ?? null,
    owner: item.owner,
    evidence_source: item.evidenceSource ?? null,
  }
}

function patchToRow(patch: Partial<CommsObjective>) {
  const row: Record<string, unknown> = {}
  if (patch.initiativeId !== undefined) row.initiative_id = patch.initiativeId
  if (patch.label !== undefined) row.label = patch.label as unknown
  if (patch.baseline !== undefined) row.baseline = patch.baseline ?? null
  if (patch.target !== undefined) row.target = patch.target ?? null
  if (patch.period !== undefined) row.period = patch.period ?? null
  if (patch.owner !== undefined) row.owner = patch.owner
  if (patch.evidenceSource !== undefined) row.evidence_source = patch.evidenceSource ?? null
  return row
}

export async function listObjectives(workspaceOrgId: string): Promise<CommsObjective[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_objectives')
    .select('*')
    .eq('organization_id', workspaceOrgId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function addObjective(
  workspaceOrgId: string,
  item: Omit<CommsObjective, 'id'>,
): Promise<CommsObjective> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_objectives')
    .insert(toRow(workspaceOrgId, item) as any)
    .select('*')
    .single()
  if (error) throw error
  return fromRow(data)
}

export async function updateObjective(
  workspaceOrgId: string,
  id: string,
  patch: Partial<CommsObjective>,
): Promise<CommsObjective | null> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_objectives')
    .update(patchToRow(patch) as any)
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
    .select('*')
    .single()
  if (error) throw error
  return data ? fromRow(data) : null
}

export async function removeObjective(workspaceOrgId: string, id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('comms_objectives')
    .delete()
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
  if (error) throw error
}
