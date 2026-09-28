import { supabase } from '@/lib/supabaseClient'
import { toJson } from '@/lib/supabaseJson'
import type { Bi } from '@/i18n/core'
import type { TablesInsert } from '@/lib/supabase/types'
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

function toRow(
  workspaceOrgId: string,
  item: Omit<CommsIntegration, 'id'>,
): TablesInsert<'comms_integrations'> {
  return {
    organization_id: workspaceOrgId,
    name: item.name,
    type: toJson(item.type),
    status: item.status,
    owner: item.owner,
    notes: toJson(item.notes ?? null),
  }
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
    .insert(toRow(workspaceOrgId, item))
    .select('*')
    .single()
  if (error) throw error
  return fromRow(data)
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
