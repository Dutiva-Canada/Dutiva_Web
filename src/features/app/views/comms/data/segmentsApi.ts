import { supabase } from '@/lib/supabaseClient'
import type { Bi } from '@/i18n/core'
import type { CommsSegment, CommsSegmentMembership } from './types'
import { z } from 'zod'

/**
 * Real persistence for comms contact segments and their memberships.
 *
 * Segments are bilingual labels used to group contacts for targeted outreach.
 * Memberships link a contact to a segment; deleting a segment removes its
 * memberships explicitly because the schema does not cascade deletes.
 */

const biSchema = z.object({
  en: z.string(),
  fr: z.string(),
})

function parseBi(value: unknown): Bi {
  return biSchema.parse(value)
}

function parseOptionalBi(value: unknown): Bi | undefined {
  if (value == null) return undefined
  return biSchema.parse(value)
}

function fromSegmentRow(row: {
  id: string
  name: unknown
  description: unknown
  created_at: string
  updated_at: string
}): CommsSegment {
  return {
    id: row.id,
    name: parseBi(row.name),
    description: parseOptionalBi(row.description),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toSegmentRow(organizationId: string, item: Omit<CommsSegment, 'id'>) {
  return {
    organization_id: organizationId,
    name: item.name,
    description: item.description ?? null,
  }
}

function patchToSegmentRow(patch: Partial<CommsSegment>) {
  const row: Record<string, unknown> = {}
  if (patch.name !== undefined) row.name = patch.name
  if (patch.description !== undefined) row.description = patch.description ?? null
  return row
}

function fromMembershipRow(row: {
  id: string
  comms_contact_id: string
  comms_segment_id: string
  created_at: string
}): CommsSegmentMembership {
  return {
    id: row.id,
    contactId: row.comms_contact_id,
    segmentId: row.comms_segment_id,
    createdAt: row.created_at,
  }
}

export async function listSegments(organizationId: string): Promise<CommsSegment[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_contact_segments')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => fromSegmentRow(row as any))
}

export async function createSegment(
  organizationId: string,
  item: Omit<CommsSegment, 'id'>,
): Promise<CommsSegment> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_contact_segments')
    .insert(toSegmentRow(organizationId, item) as any)
    .select('*')
    .single()
  if (error) throw error
  return fromSegmentRow(data)
}

export async function updateSegment(
  organizationId: string,
  id: string,
  patch: Partial<CommsSegment>,
): Promise<CommsSegment | null> {
  if (!supabase) throw new Error('Supabase is not configured')
  const row = patchToSegmentRow(patch)
  if (Object.keys(row).length === 0) {
    const existing = await listSegments(organizationId)
    return existing.find((s) => s.id === id) ?? null
  }
  const { data, error } = await supabase
    .from('comms_contact_segments')
    .update(row as any)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .select('*')
    .single()
  if (error) throw error
  return data ? fromSegmentRow(data) : null
}

export async function deleteSegment(organizationId: string, id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error: membershipError } = await supabase
    .from('comms_contact_segment_memberships')
    .delete()
    .eq('comms_segment_id', id)
    .eq('organization_id', organizationId)
  if (membershipError) throw membershipError

  const { error } = await supabase
    .from('comms_contact_segments')
    .delete()
    .eq('id', id)
    .eq('organization_id', organizationId)
  if (error) throw error
}

export async function listSegmentMemberships(
  organizationId: string,
): Promise<CommsSegmentMembership[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_contact_segment_memberships')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => fromMembershipRow(row as any))
}

export async function addContactToSegment(
  organizationId: string,
  contactId: string,
  segmentId: string,
): Promise<CommsSegmentMembership> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_contact_segment_memberships')
    .insert({
      organization_id: organizationId,
      comms_contact_id: contactId,
      comms_segment_id: segmentId,
    } as any)
    .select('*')
    .single()
  if (error) throw error
  return fromMembershipRow(data)
}

export async function removeContactFromSegment(
  organizationId: string,
  membershipId: string,
): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('comms_contact_segment_memberships')
    .delete()
    .eq('id', membershipId)
    .eq('organization_id', organizationId)
  if (error) throw error
}
