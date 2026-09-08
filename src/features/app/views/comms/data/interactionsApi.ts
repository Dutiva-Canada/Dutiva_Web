import { supabase } from '@/lib/supabaseClient'
import type { Bi } from '@/i18n/core'
import type { CommsInteraction, CommsInteractionStatus } from './types'

function fromRow(raw: unknown): CommsInteraction {
  const row = raw as {
    id: string
    initiative_id: string | null
    contact_id: string | null
    type: string
    source: unknown
    visibility: string
    summary: unknown
    response_target: string | null
    owner: string
    status: string
    escalation_reason: unknown
    moderation_reason: unknown
  }
  return {
    id: row.id,
    initiativeId: row.initiative_id ?? undefined,
    contactId: row.contact_id ?? undefined,
    type: row.type as CommsInteraction['type'],
    source: (row.source as Bi | undefined) ?? { en: 'Unknown', fr: 'Inconnu' },
    visibility: row.visibility as CommsInteraction['visibility'],
    summary: (row.summary as Bi | undefined) ?? { en: '', fr: '' },
    responseTarget: row.response_target ?? undefined,
    owner: row.owner,
    status: row.status as CommsInteractionStatus,
    escalationReason: row.escalation_reason as Bi | undefined,
    moderationReason: row.moderation_reason as Bi | undefined,
  }
}

function toRow(workspaceOrgId: string, item: Omit<CommsInteraction, 'id'>) {
  return {
    organization_id: workspaceOrgId,
    initiative_id: item.initiativeId ?? null,
    contact_id: item.contactId ?? null,
    type: item.type,
    source: item.source as unknown,
    visibility: item.visibility,
    summary: item.summary as unknown,
    response_target: item.responseTarget ?? null,
    owner: item.owner,
    status: item.status,
    escalation_reason: item.escalationReason ?? null,
    moderation_reason: item.moderationReason ?? null,
  }
}

function patchToRow(patch: Partial<CommsInteraction>) {
  const row: Record<string, unknown> = {}
  if (patch.initiativeId !== undefined) row.initiative_id = patch.initiativeId ?? null
  if (patch.contactId !== undefined) row.contact_id = patch.contactId ?? null
  if (patch.type !== undefined) row.type = patch.type
  if (patch.source !== undefined) row.source = patch.source ?? null
  if (patch.visibility !== undefined) row.visibility = patch.visibility
  if (patch.summary !== undefined) row.summary = patch.summary ?? null
  if (patch.responseTarget !== undefined) row.response_target = patch.responseTarget ?? null
  if (patch.owner !== undefined) row.owner = patch.owner
  if (patch.status !== undefined) row.status = patch.status
  if (patch.escalationReason !== undefined) row.escalation_reason = patch.escalationReason ?? null
  if (patch.moderationReason !== undefined) row.moderation_reason = patch.moderationReason ?? null
  return row
}

export async function listInteractions(workspaceOrgId: string): Promise<CommsInteraction[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_interactions')
    .select('*')
    .eq('organization_id', workspaceOrgId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function addInteraction(
  workspaceOrgId: string,
  item: Omit<CommsInteraction, 'id'>,
): Promise<CommsInteraction> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_interactions')
    .insert(toRow(workspaceOrgId, item) as any)
    .select('*')
    .single()
  if (error) throw error
  return fromRow(data)
}

export async function updateInteraction(
  workspaceOrgId: string,
  id: string,
  patch: Partial<CommsInteraction>,
): Promise<CommsInteraction | null> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_interactions')
    .update(patchToRow(patch) as any)
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
    .select('*')
    .single()
  if (error) throw error
  return data ? fromRow(data) : null
}

export async function removeInteraction(workspaceOrgId: string, id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('comms_interactions')
    .delete()
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
  if (error) throw error
}
