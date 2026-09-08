import { supabase } from '@/lib/supabaseClient'
import type { Bi } from '@/i18n/core'
import type { CommsIntegration } from './types'

function fromRow(raw: unknown): CommsIntegration {
  const row = raw as {
    id: string
    name: string
    type: unknown
    status: string
    owner: string
    notes: unknown
  }
  return {
    id: row.id,
    name: row.name,
    type: (row.type as Bi | undefined) ?? { en: '', fr: '' },
    status: row.status as CommsIntegration['status'],
    owner: row.owner,
    notes: row.notes as Bi | undefined,
  }
}

function toRow(workspaceOrgId: string, item: Omit<CommsIntegration, 'id'>) {
  return {
    organization_id: workspaceOrgId,
    name: item.name,
    type: item.type as unknown,
    status: item.status,
    owner: item.owner,
    notes: item.notes ?? null,
  }
}

function patchToRow(patch: Partial<CommsIntegration>) {
  const row: Record<string, unknown> = {}
  if (patch.name !== undefined) row.name = patch.name
  if (patch.type !== undefined) row.type = patch.type as unknown
  if (patch.status !== undefined) row.status = patch.status
  if (patch.owner !== undefined) row.owner = patch.owner
  if (patch.notes !== undefined) row.notes = patch.notes ?? null
  return row
}

export async function listIntegrations(workspaceOrgId: string): Promise<CommsIntegration[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_integrations')
    .select('*')
    .eq('organization_id', workspaceOrgId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function addIntegration(
  workspaceOrgId: string,
  item: Omit<CommsIntegration, 'id'>,
): Promise<CommsIntegration> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_integrations')
    .insert(toRow(workspaceOrgId, item) as any)
    .select('*')
    .single()
  if (error) throw error
  return fromRow(data)
}

export async function updateIntegration(
  workspaceOrgId: string,
  id: string,
  patch: Partial<CommsIntegration>,
): Promise<CommsIntegration | null> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_integrations')
    .update(patchToRow(patch) as any)
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
    .select('*')
    .single()
  if (error) throw error
  return data ? fromRow(data) : null
}

export async function removeIntegration(workspaceOrgId: string, id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('comms_integrations')
    .delete()
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
  if (error) throw error
}
