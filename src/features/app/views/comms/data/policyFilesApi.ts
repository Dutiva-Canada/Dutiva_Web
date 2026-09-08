import { supabase } from '@/lib/supabaseClient'
import type { Bi } from '@/i18n/core'
import type { CommsPolicyFile } from './types'

function fromRow(raw: unknown): CommsPolicyFile {
  const row = raw as {
    id: string
    initiative_id: string | null
    jurisdiction: unknown
    authority: unknown
    objective: unknown
    source_url: string | null
    stage: string
    deadline: string | null
    owner: string
  }
  return {
    id: row.id,
    initiativeId: row.initiative_id ?? undefined,
    jurisdiction: (row.jurisdiction as Bi | undefined) ?? { en: '', fr: '' },
    authority: (row.authority as Bi | undefined) ?? { en: '', fr: '' },
    objective: (row.objective as Bi | undefined) ?? { en: '', fr: '' },
    sourceUrl: row.source_url ?? undefined,
    stage: row.stage as CommsPolicyFile['stage'],
    deadline: row.deadline ?? undefined,
    owner: row.owner,
  }
}

function toRow(workspaceOrgId: string, item: Omit<CommsPolicyFile, 'id'>) {
  return {
    organization_id: workspaceOrgId,
    initiative_id: item.initiativeId ?? null,
    jurisdiction: item.jurisdiction as unknown,
    authority: item.authority as unknown,
    objective: item.objective as unknown,
    source_url: item.sourceUrl ?? null,
    stage: item.stage,
    deadline: item.deadline ?? null,
    owner: item.owner,
  }
}

function patchToRow(patch: Partial<CommsPolicyFile>) {
  const row: Record<string, unknown> = {}
  if (patch.initiativeId !== undefined) row.initiative_id = patch.initiativeId ?? null
  if (patch.jurisdiction !== undefined) row.jurisdiction = patch.jurisdiction as unknown
  if (patch.authority !== undefined) row.authority = patch.authority as unknown
  if (patch.objective !== undefined) row.objective = patch.objective as unknown
  if (patch.sourceUrl !== undefined) row.source_url = patch.sourceUrl ?? null
  if (patch.stage !== undefined) row.stage = patch.stage
  if (patch.deadline !== undefined) row.deadline = patch.deadline ?? null
  if (patch.owner !== undefined) row.owner = patch.owner
  return row
}

export async function listPolicyFiles(workspaceOrgId: string): Promise<CommsPolicyFile[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_policy_files')
    .select('*')
    .eq('organization_id', workspaceOrgId)
    .order('deadline', { ascending: true })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function addPolicyFile(
  workspaceOrgId: string,
  item: Omit<CommsPolicyFile, 'id'>,
): Promise<CommsPolicyFile> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_policy_files')
    .insert(toRow(workspaceOrgId, item) as any)
    .select('*')
    .single()
  if (error) throw error
  return fromRow(data)
}

export async function updatePolicyFile(
  workspaceOrgId: string,
  id: string,
  patch: Partial<CommsPolicyFile>,
): Promise<CommsPolicyFile | null> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_policy_files')
    .update(patchToRow(patch) as any)
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
    .select('*')
    .single()
  if (error) throw error
  return data ? fromRow(data) : null
}

export async function removePolicyFile(workspaceOrgId: string, id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('comms_policy_files')
    .delete()
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
  if (error) throw error
}
