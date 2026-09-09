import type { MemoryFact } from '@/data'
import { supabase } from '@/lib/supabaseClient'
import {
  requireUserId,
  insertAudit,
  factRowSchema,
  SELECT_COLUMNS,
  toFact,
} from './productionApi'

/**
 * Lifecycle + legal-hold actions for Advisor Memory facts — split out of
 * `productionApi.ts` to keep that file under the 800-line architecture budget.
 * Shares the schema, helpers, and audit writer with the main API module.
 */

/**
 * Mark a fact for human review (sets status to needs_review). Audits.
 */
export async function markForReview(organizationId: string, factId: string): Promise<MemoryFact> {
  if (!supabase) throw new Error('Supabase is not configured')
  const actorUserId = await requireUserId()
  const { data: existing, error: readError } = await supabase
    .from('hr_advisor_memory_facts')
    .select(SELECT_COLUMNS)
    .eq('id', factId)
    .eq('organization_id', organizationId)
    .is('forgotten_at', null)
    .maybeSingle()
  if (readError) throw readError
  if (!existing) throw new Error('Memory fact not found')
  const prior = factRowSchema.parse(existing)

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('hr_advisor_memory_facts')
    .update({ status: 'needs_review', updated_by: actorUserId, updated_at: now })
    .eq('id', factId)
    .eq('organization_id', organizationId)
    .select(SELECT_COLUMNS)
    .single()
  if (error) throw error
  await insertAudit({
    organizationId,
    factId,
    actorUserId,
    action: 'review_requested',
    statementEn: prior.statement_en,
    statementFr: prior.statement_fr,
  })
  return toFact(factRowSchema.parse(data))
}

/**
 * Reject a proposed memory (sets status to removed + forgotten_at). Audits.
 */
export async function rejectFact(organizationId: string, factId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const actorUserId = await requireUserId()
  const { data: existing, error: readError } = await supabase
    .from('hr_advisor_memory_facts')
    .select(SELECT_COLUMNS)
    .eq('id', factId)
    .eq('organization_id', organizationId)
    .is('forgotten_at', null)
    .maybeSingle()
  if (readError) throw readError
  if (!existing) throw new Error('Memory fact not found')
  const prior = factRowSchema.parse(existing)

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('hr_advisor_memory_facts')
    .update({
      status: 'removed',
      advisor_usable: false,
      forgotten_at: now,
      updated_by: actorUserId,
      updated_at: now,
    })
    .eq('id', factId)
    .eq('organization_id', organizationId)
  if (error) throw error
  await insertAudit({
    organizationId,
    factId,
    actorUserId,
    action: 'rejected',
    statementEn: prior.statement_en,
    statementFr: prior.statement_fr,
  })
}

/**
 * Restore a forgotten fact (clears forgotten_at, derives status from confidence).
 * Audits.
 */
export async function restoreFact(organizationId: string, factId: string): Promise<MemoryFact> {
  if (!supabase) throw new Error('Supabase is not configured')
  const actorUserId = await requireUserId()
  const { data: existing, error: readError } = await supabase
    .from('hr_advisor_memory_facts')
    .select(SELECT_COLUMNS)
    .eq('id', factId)
    .eq('organization_id', organizationId)
    .maybeSingle()
  if (readError) throw readError
  if (!existing) throw new Error('Memory fact not found')
  const prior = factRowSchema.parse(existing)

  const now = new Date().toISOString()
  const restoredStatus = prior.confidence === 'confirmed' ? 'confirmed' : 'proposed'
  const { data, error } = await supabase
    .from('hr_advisor_memory_facts')
    .update({
      forgotten_at: null,
      status: restoredStatus,
      advisor_usable: true,
      updated_by: actorUserId,
      updated_at: now,
    })
    .eq('id', factId)
    .eq('organization_id', organizationId)
    .select(SELECT_COLUMNS)
    .single()
  if (error) throw error
  await insertAudit({
    organizationId,
    factId,
    actorUserId,
    action: 'restored',
    statementEn: prior.statement_en,
    statementFr: prior.statement_fr,
  })
  return toFact(factRowSchema.parse(data))
}

/**
 * Add a legal hold to a fact (pauses scheduled expiration/deletion). Audits.
 */
export async function addLegalHold(
  organizationId: string,
  factId: string,
  reasonEn: string,
  reasonFr: string,
  placedBy: string,
): Promise<MemoryFact> {
  if (!supabase) throw new Error('Supabase is not configured')
  const actorUserId = await requireUserId()
  const { data: existing, error: readError } = await supabase
    .from('hr_advisor_memory_facts')
    .select(SELECT_COLUMNS)
    .eq('id', factId)
    .eq('organization_id', organizationId)
    .is('forgotten_at', null)
    .maybeSingle()
  if (readError) throw readError
  if (!existing) throw new Error('Memory fact not found')
  const prior = factRowSchema.parse(existing)

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('hr_advisor_memory_facts')
    .update({
      legal_hold_reason_en: reasonEn,
      legal_hold_reason_fr: reasonFr,
      legal_hold_placed_by: placedBy,
      legal_hold_placed_at: now,
      updated_by: actorUserId,
      updated_at: now,
    })
    .eq('id', factId)
    .eq('organization_id', organizationId)
    .select(SELECT_COLUMNS)
    .single()
  if (error) throw error
  await insertAudit({
    organizationId,
    factId,
    actorUserId,
    action: 'legal_hold_added',
    statementEn: prior.statement_en,
    statementFr: prior.statement_fr,
  })
  return toFact(factRowSchema.parse(data))
}

/**
 * Remove a legal hold from a fact. Audits.
 */
export async function removeLegalHold(organizationId: string, factId: string): Promise<MemoryFact> {
  if (!supabase) throw new Error('Supabase is not configured')
  const actorUserId = await requireUserId()
  const { data: existing, error: readError } = await supabase
    .from('hr_advisor_memory_facts')
    .select(SELECT_COLUMNS)
    .eq('id', factId)
    .eq('organization_id', organizationId)
    .is('forgotten_at', null)
    .maybeSingle()
  if (readError) throw readError
  if (!existing) throw new Error('Memory fact not found')
  const prior = factRowSchema.parse(existing)

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('hr_advisor_memory_facts')
    .update({
      legal_hold_reason_en: null,
      legal_hold_reason_fr: null,
      legal_hold_placed_by: null,
      legal_hold_placed_at: null,
      updated_by: actorUserId,
      updated_at: now,
    })
    .eq('id', factId)
    .eq('organization_id', organizationId)
    .select(SELECT_COLUMNS)
    .single()
  if (error) throw error
  await insertAudit({
    organizationId,
    factId,
    actorUserId,
    action: 'legal_hold_removed',
    statementEn: prior.statement_en,
    statementFr: prior.statement_fr,
  })
  return toFact(factRowSchema.parse(data))
}
