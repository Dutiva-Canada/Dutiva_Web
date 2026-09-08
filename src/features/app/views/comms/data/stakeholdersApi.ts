import { supabase } from '@/lib/supabaseClient'
import type { Bi } from '@/i18n/core'
import type { CommsContact, CommsContactType, CommsOrganization } from './types'

/**
 * Real persistence for comms stakeholders (contacts and organizations).
 *
 * Phase 2 of the comms module: the rest of the workspace still uses the
 * in-browser localStorage stub, but stakeholders are now org-scoped and
 * RLS-protected (migration 0133).
 */

export interface ProductionCommsContact extends CommsContact {
  /** Copied from the parent organization for display. */
  organizationName?: string
}

function fromContactRow(row: {
  id: string
  comms_organization_id: string | null
  name: string
  type: string
  role: unknown
  purpose: unknown
  channel_preference: unknown
  source: unknown
  active: boolean
}): CommsContact {
  return {
    id: row.id,
    organizationId: row.comms_organization_id ?? undefined,
    name: row.name,
    type: row.type as CommsContactType,
    role: row.role as Bi | undefined,
    purpose: row.purpose as Bi | undefined,
    channelPreference: row.channel_preference as Bi | undefined,
    source: row.source as Bi | undefined,
    active: row.active,
  }
}

function toContactRow(
  organizationId: string,
  contact: Omit<CommsContact, 'id'>,
) {
  return {
    organization_id: organizationId,
    comms_organization_id: contact.organizationId ?? null,
    name: contact.name,
    type: contact.type,
    role: contact.role ?? null,
    purpose: contact.purpose ?? null,
    channel_preference: contact.channelPreference ?? null,
    source: contact.source ?? null,
    active: contact.active ?? true,
  }
}

function fromOrganizationRow(row: {
  id: string
  name: string
  type: unknown
  jurisdiction: unknown
  notes: unknown
}): CommsOrganization {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Bi,
    jurisdiction: row.jurisdiction as Bi | undefined,
    notes: row.notes as Bi | undefined,
  }
}

function toOrganizationRow(
  organizationId: string,
  organization: Omit<CommsOrganization, 'id'>,
) {
  return {
    organization_id: organizationId,
    name: organization.name,
    type: organization.type ?? null,
    jurisdiction: organization.jurisdiction ?? null,
    notes: organization.notes ?? null,
  }
}

export async function listOrganizations(
  workspaceOrgId: string,
): Promise<CommsOrganization[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_organizations')
    .select('*')
    .eq('organization_id', workspaceOrgId)
    .order('name')
  if (error) throw error
  return (data ?? []).map(fromOrganizationRow)
}

export async function addOrganization(
  workspaceOrgId: string,
  organization: Omit<CommsOrganization, 'id'>,
): Promise<CommsOrganization> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_organizations')
    .insert(toOrganizationRow(workspaceOrgId, organization) as any)
    .select('*')
    .single()
  if (error) throw error
  return fromOrganizationRow(data)
}

export async function updateOrganization(
  workspaceOrgId: string,
  id: string,
  patch: Partial<CommsOrganization>,
): Promise<CommsOrganization | null> {
  if (!supabase) throw new Error('Supabase is not configured')
  const row: Record<string, unknown> = {}
  if (patch.name !== undefined) row.name = patch.name
  if (patch.type !== undefined) row.type = patch.type ?? null
  if (patch.jurisdiction !== undefined) row.jurisdiction = patch.jurisdiction ?? null
  if (patch.notes !== undefined) row.notes = patch.notes ?? null
  const { data, error } = await supabase
    .from('comms_organizations')
    .update(row as any)
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
    .select('*')
    .single()
  if (error) throw error
  return data ? fromOrganizationRow(data) : null
}

export async function removeOrganization(
  workspaceOrgId: string,
  id: string,
): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('comms_organizations')
    .delete()
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
  if (error) throw error
}

export async function listContacts(
  workspaceOrgId: string,
): Promise<CommsContact[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_contacts')
    .select('*')
    .eq('organization_id', workspaceOrgId)
    .order('name')
  if (error) throw error
  return (data ?? []).map(fromContactRow)
}

export async function addContact(
  workspaceOrgId: string,
  contact: Omit<CommsContact, 'id'>,
): Promise<CommsContact> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_contacts')
    .insert(toContactRow(workspaceOrgId, contact) as any)
    .select('*')
    .single()
  if (error) throw error
  return fromContactRow(data)
}

export async function updateContact(
  workspaceOrgId: string,
  id: string,
  patch: Partial<CommsContact>,
): Promise<CommsContact | null> {
  if (!supabase) throw new Error('Supabase is not configured')
  const row: Record<string, unknown> = {}
  if (patch.organizationId !== undefined)
    row.comms_organization_id = patch.organizationId ?? null
  if (patch.name !== undefined) row.name = patch.name
  if (patch.type !== undefined) row.type = patch.type
  if (patch.role !== undefined) row.role = patch.role ?? null
  if (patch.purpose !== undefined) row.purpose = patch.purpose ?? null
  if (patch.channelPreference !== undefined)
    row.channel_preference = patch.channelPreference ?? null
  if (patch.source !== undefined) row.source = patch.source ?? null
  if (patch.active !== undefined) row.active = patch.active
  const { data, error } = await supabase
    .from('comms_contacts')
    .update(row as any)
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
    .select('*')
    .single()
  if (error) throw error
  return data ? fromContactRow(data) : null
}

export async function removeContact(
  workspaceOrgId: string,
  id: string,
): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('comms_contacts')
    .delete()
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
  if (error) throw error
}
