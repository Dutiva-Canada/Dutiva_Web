import { supabase } from '@/lib/supabaseClient'
import type { Bi } from '@/i18n/core'
import type { CommsInitiative } from './types'

const emptyBi: Bi = { en: '', fr: '' }

function fromRow(raw: unknown): CommsInitiative {
  const row = raw as {
    id: string
    title: unknown
    type: string
    domain: string
    owner: string
    audience: unknown
    intended_outcome: unknown
    baseline: string | null
    target: string | null
    start_date: string | null
    end_date: string | null
    risk: string | null
    budget: number | null
    currency: string | null
    status: string
  }
  return {
    id: row.id,
    title: (row.title as Bi | undefined) ?? emptyBi,
    type: row.type as CommsInitiative['type'],
    domain: row.domain as CommsInitiative['domain'],
    owner: row.owner,
    audience: (row.audience as Bi | undefined) ?? emptyBi,
    intendedOutcome: (row.intended_outcome as Bi | undefined) ?? emptyBi,
    baseline: row.baseline ?? undefined,
    target: row.target ?? undefined,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    risk: (row.risk as CommsInitiative['risk'] | undefined) ?? 'low',
    budget: row.budget ?? undefined,
    currency: row.currency ?? undefined,
    status: row.status as CommsInitiative['status'],
  }
}

function toRow(workspaceOrgId: string, item: Omit<CommsInitiative, 'id'>) {
  return {
    organization_id: workspaceOrgId,
    title: item.title as unknown,
    type: item.type,
    domain: item.domain,
    owner: item.owner,
    audience: item.audience as unknown,
    intended_outcome: item.intendedOutcome as unknown,
    baseline: item.baseline ?? null,
    target: item.target ?? null,
    start_date: item.startDate ?? null,
    end_date: item.endDate ?? null,
    risk: item.risk,
    budget: item.budget ?? null,
    currency: item.currency ?? null,
    status: item.status,
  }
}

function patchToRow(patch: Partial<CommsInitiative>) {
  const row: Record<string, unknown> = {}
  if (patch.title !== undefined) row.title = patch.title as unknown
  if (patch.type !== undefined) row.type = patch.type
  if (patch.domain !== undefined) row.domain = patch.domain
  if (patch.owner !== undefined) row.owner = patch.owner
  if (patch.audience !== undefined) row.audience = patch.audience as unknown
  if (patch.intendedOutcome !== undefined) row.intended_outcome = patch.intendedOutcome as unknown
  if (patch.baseline !== undefined) row.baseline = patch.baseline ?? null
  if (patch.target !== undefined) row.target = patch.target ?? null
  if (patch.startDate !== undefined) row.start_date = patch.startDate ?? null
  if (patch.endDate !== undefined) row.end_date = patch.endDate ?? null
  if (patch.risk !== undefined) row.risk = patch.risk
  if (patch.budget !== undefined) row.budget = patch.budget ?? null
  if (patch.currency !== undefined) row.currency = patch.currency ?? null
  if (patch.status !== undefined) row.status = patch.status
  return row
}

export async function listInitiatives(workspaceOrgId: string): Promise<CommsInitiative[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_initiatives')
    .select('*')
    .eq('organization_id', workspaceOrgId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function addInitiative(
  workspaceOrgId: string,
  item: Omit<CommsInitiative, 'id'>,
): Promise<CommsInitiative> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_initiatives')
    .insert(toRow(workspaceOrgId, item) as any)
    .select('*')
    .single()
  if (error) throw error
  return fromRow(data)
}

export async function updateInitiative(
  workspaceOrgId: string,
  id: string,
  patch: Partial<CommsInitiative>,
): Promise<CommsInitiative | null> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_initiatives')
    .update(patchToRow(patch) as any)
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
    .select('*')
    .single()
  if (error) throw error
  return data ? fromRow(data) : null
}

export async function removeInitiative(workspaceOrgId: string, id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('comms_initiatives')
    .delete()
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
  if (error) throw error
}
