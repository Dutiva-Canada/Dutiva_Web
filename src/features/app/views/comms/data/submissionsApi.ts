import { supabase } from '@/lib/supabaseClient'
import type { Bi } from '@/i18n/core'
import type { CommsSubmission, CommsSubmissionStatus } from './types'

function fromRow(raw: unknown): CommsSubmission {
  const row = raw as {
    id: string
    initiative_id: string
    policy_file_id: string | null
    authority: unknown
    submitted_at: string | null
    deadline: string | null
    method: unknown
    confirmation_ref: string | null
    owner: string
    status: string
  }
  return {
    id: row.id,
    initiativeId: row.initiative_id,
    policyFileId: row.policy_file_id ?? undefined,
    authority: (row.authority as Bi | undefined) ?? { en: '', fr: '' },
    submittedAt: row.submitted_at ?? undefined,
    deadline: row.deadline ?? undefined,
    method: (row.method as Bi | undefined) ?? { en: '', fr: '' },
    confirmationRef: row.confirmation_ref ?? undefined,
    owner: row.owner,
    status: row.status as CommsSubmissionStatus,
  }
}

function toRow(workspaceOrgId: string, item: Omit<CommsSubmission, 'id'>) {
  return {
    organization_id: workspaceOrgId,
    initiative_id: item.initiativeId,
    policy_file_id: item.policyFileId ?? null,
    authority: item.authority as unknown,
    submitted_at: item.submittedAt ?? null,
    deadline: item.deadline ?? null,
    method: item.method as unknown,
    confirmation_ref: item.confirmationRef ?? null,
    owner: item.owner,
    status: item.status,
  }
}

function patchToRow(patch: Partial<CommsSubmission>) {
  const row: Record<string, unknown> = {}
  if (patch.initiativeId !== undefined) row.initiative_id = patch.initiativeId
  if (patch.policyFileId !== undefined) row.policy_file_id = patch.policyFileId ?? null
  if (patch.authority !== undefined) row.authority = patch.authority as unknown
  if (patch.submittedAt !== undefined) row.submitted_at = patch.submittedAt ?? null
  if (patch.deadline !== undefined) row.deadline = patch.deadline ?? null
  if (patch.method !== undefined) row.method = patch.method as unknown
  if (patch.confirmationRef !== undefined) row.confirmation_ref = patch.confirmationRef ?? null
  if (patch.owner !== undefined) row.owner = patch.owner
  if (patch.status !== undefined) row.status = patch.status
  return row
}

export async function listSubmissions(workspaceOrgId: string): Promise<CommsSubmission[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_submissions')
    .select('*')
    .eq('organization_id', workspaceOrgId)
    .order('deadline', { ascending: true })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function addSubmission(
  workspaceOrgId: string,
  item: Omit<CommsSubmission, 'id'>,
): Promise<CommsSubmission> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_submissions')
    .insert(toRow(workspaceOrgId, item) as any)
    .select('*')
    .single()
  if (error) throw error
  return fromRow(data)
}

export async function updateSubmission(
  workspaceOrgId: string,
  id: string,
  patch: Partial<CommsSubmission>,
): Promise<CommsSubmission | null> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_submissions')
    .update(patchToRow(patch) as any)
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
    .select('*')
    .single()
  if (error) throw error
  return data ? fromRow(data) : null
}

export async function removeSubmission(workspaceOrgId: string, id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('comms_submissions')
    .delete()
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
  if (error) throw error
}
