import { supabase } from '@/lib/supabaseClient'
import type { Bi } from '@/i18n/core'
import type { CommsApproval } from './types'

function fromRow(raw: unknown): CommsApproval {
  const row = raw as {
    id: string
    content_item_id: string
    approver: string
    policy_version: string | null
    decision: string
    rationale: unknown
    decided_at: string
  }
  return {
    id: row.id,
    contentItemId: row.content_item_id,
    approver: row.approver,
    policyVersion: row.policy_version ?? undefined,
    decision: row.decision as CommsApproval['decision'],
    rationale: row.rationale as Bi | undefined,
    decidedAt: row.decided_at,
  }
}

function toRow(workspaceOrgId: string, item: Omit<CommsApproval, 'id'>) {
  return {
    organization_id: workspaceOrgId,
    content_item_id: item.contentItemId,
    approver: item.approver,
    policy_version: item.policyVersion ?? null,
    decision: item.decision,
    rationale: item.rationale ?? null,
    decided_at: item.decidedAt,
  }
}

export async function listApprovals(workspaceOrgId: string): Promise<CommsApproval[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_approvals')
    .select('*')
    .eq('organization_id', workspaceOrgId)
    .order('decided_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function addApproval(
  workspaceOrgId: string,
  item: Omit<CommsApproval, 'id'>,
): Promise<CommsApproval> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_approvals')
    .insert(toRow(workspaceOrgId, item) as any)
    .select('*')
    .single()
  if (error) throw error
  return fromRow(data)
}

export async function removeApproval(workspaceOrgId: string, id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('comms_approvals')
    .delete()
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
  if (error) throw error
}
