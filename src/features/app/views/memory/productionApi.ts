import { z } from 'zod'
import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import type {
  MemoryCategory,
  MemoryClassification,
  MemoryConfidence,
  MemoryFact,
  MemoryOrigin,
  MemoryRetentionCategory,
  MemoryRetrievalScope,
  MemoryScope,
  MemorySensitivity,
  MemorySourceType,
  MemoryStatus,
  MemoryVisibility,
} from '@/data'
import { supabase } from '@/lib/supabaseClient'
import { fetchAllPages } from '@/lib/supabasePagination'

/**
 * Real persistence for Advisor Memory (production mode) —
 * `public.hr_advisor_memory_facts` + `hr_advisor_memory_audit` (migrations
 * 0086 + 0155). Migration 0155 added the governance columns (status,
 * classification, sensitivity, retention, legal hold, Advisor-usable,
 * purpose, jurisdiction, provenance, retrieval scope). Same boundary
 * contract as employees/cases: zod-validated rows, throws on failure.
 * Demo mode keeps `memoryStore` + fixtures.
 */

export type MemoryAuditAction =
  | 'create'
  | 'confirm'
  | 'correct'
  | 'forget'
  | 'proposed'
  | 'rejected'
  | 'edited'
  | 'restored'
  | 'expired'
  | 'exported'
  | 'legal_hold_added'
  | 'legal_hold_removed'
  | 'review_requested'
  | 'memory_disabled'
  | 'memory_enabled'

export interface ProductionMemoryAuditEntry {
  id: string
  factId: string
  action: MemoryAuditAction
  statement: Bi
  createdAt: string
  actorUserId: string | null
}

export interface NewMemoryFact {
  scope: MemoryScope
  entityId: string
  category: MemoryCategory
  statementEn: string
  statementFr: string
  confidence?: MemoryConfidence
  sourceType?: MemorySourceType
  sourceDetailEn?: string
  sourceDetailFr?: string
  visibility?: MemoryVisibility
  sensitive?: boolean
  status?: MemoryStatus
  classification?: MemoryClassification
  origin?: MemoryOrigin
  sensitivity?: MemorySensitivity
  advisorUsable?: boolean
  retentionCategory?: MemoryRetentionCategory
  reviewDate?: string | null
  expiryDate?: string | null
  purposeEn?: string | null
  purposeFr?: string | null
  jurisdiction?: string | null
  proposedBy?: string | null
  confidenceScore?: number | null
  sourceExcerptEn?: string | null
  sourceExcerptFr?: string | null
  creatorLabel?: string | null
  confirmedByLabel?: string | null
  retrievalScope?: MemoryRetrievalScope | null
}

const SCOPE = z.enum(['person', 'case', 'thread'])
const CATEGORY = z.enum([
  'employment',
  'compensation',
  'matter',
  'record',
  'note',
  'case',
  'conversation',
])
const CONFIDENCE = z.enum(['confirmed', 'inferred'])
const SOURCE_TYPE = z.enum(['hris', 'document', 'chat', 'manual', 'inference', 'case'])
const VISIBILITY = z.enum(['hr', 'case', 'restricted'])
const STATUS = z.enum(['proposed', 'needs_review', 'confirmed', 'expired', 'removed'])
const CLASSIFICATION = z.enum([
  'fact',
  'preference',
  'allegation',
  'opinion',
  'evidence',
  'finding',
  'decision',
  'contextual',
])
const ORIGIN = z.enum(['explicit', 'inferred', 'manual'])
const SENSITIVITY = z.enum(['standard', 'restricted'])
const RETENTION_CATEGORY = z.enum([
  'advisor_conversation',
  'employee_preference',
  'employment_record',
  'payroll_tax',
  'investigation',
  'wellbeing_personal',
  'custom',
])
const RETRIEVAL_SCOPE_TYPE = z.enum(['workspace', 'case', 'conversation', 'workflow'])

const factRowSchema = z.object({
  id: z.string(),
  scope: SCOPE,
  entity_id: z.string(),
  category: CATEGORY,
  statement_en: z.string(),
  statement_fr: z.string(),
  confidence: CONFIDENCE,
  source_type: SOURCE_TYPE,
  source_detail_en: z.string(),
  source_detail_fr: z.string(),
  learned_at: z.string(),
  confirmed_at: z.string().nullable(),
  visibility: VISIBILITY,
  sensitive: z.boolean(),
  // Governance columns (migration 0155) — nullable for back-compat
  status: STATUS.nullable().catch(null),
  classification: CLASSIFICATION.nullable().catch(null),
  origin: ORIGIN.nullable().catch(null),
  sensitivity: SENSITIVITY.nullable().catch(null),
  advisor_usable: z.boolean().nullable().catch(null),
  retention_category: RETENTION_CATEGORY.nullable().catch(null),
  review_date: z.string().nullable().catch(null),
  expiry_date: z.string().nullable().catch(null),
  last_verified_at: z.string().nullable().catch(null),
  legal_hold_reason_en: z.string().nullable().catch(null),
  legal_hold_reason_fr: z.string().nullable().catch(null),
  legal_hold_placed_by: z.string().nullable().catch(null),
  legal_hold_placed_at: z.string().nullable().catch(null),
  purpose_en: z.string().nullable().catch(null),
  purpose_fr: z.string().nullable().catch(null),
  jurisdiction: z.string().nullable().catch(null),
  proposed_by: z.string().nullable().catch(null),
  confidence_score: z.number().nullable().catch(null),
  creator_label: z.string().nullable().catch(null),
  confirmed_by_label: z.string().nullable().catch(null),
  source_excerpt_en: z.string().nullable().catch(null),
  source_excerpt_fr: z.string().nullable().catch(null),
  retrieval_scope_type: RETRIEVAL_SCOPE_TYPE.nullable().catch(null),
  retrieval_scope_id: z.string().nullable().catch(null),
})

const auditRowSchema = z.object({
  id: z.string(),
  fact_id: z.string(),
  actor_user_id: z.string().nullable(),
  action: z.enum([
    'create',
    'confirm',
    'correct',
    'forget',
    'proposed',
    'rejected',
    'edited',
    'restored',
    'expired',
    'exported',
    'legal_hold_added',
    'legal_hold_removed',
    'review_requested',
    'memory_disabled',
    'memory_enabled',
  ]),
  statement_en: z.string(),
  statement_fr: z.string(),
  created_at: z.string(),
})

const SELECT_COLUMNS =
  'id, scope, entity_id, category, statement_en, statement_fr, confidence, source_type, source_detail_en, source_detail_fr, learned_at, confirmed_at, visibility, sensitive, status, classification, origin, sensitivity, advisor_usable, retention_category, review_date, expiry_date, last_verified_at, legal_hold_reason_en, legal_hold_reason_fr, legal_hold_placed_by, legal_hold_placed_at, purpose_en, purpose_fr, jurisdiction, proposed_by, confidence_score, creator_label, confirmed_by_label, source_excerpt_en, source_excerpt_fr, retrieval_scope_type, retrieval_scope_id'

const AUDIT_COLUMNS = 'id, fact_id, actor_user_id, action, statement_en, statement_fr, created_at'

function toFact(row: z.infer<typeof factRowSchema>): MemoryFact {
  const fact: MemoryFact = {
    id: row.id,
    scope: row.scope,
    entityId: row.entity_id,
    category: row.category,
    statement: bi(row.statement_en, row.statement_fr),
    confidence: row.confidence,
    source: {
      type: row.source_type,
      detail: bi(row.source_detail_en, row.source_detail_fr),
    },
    learnedAt: row.learned_at.slice(0, 10),
    confirmation: row.confirmed_at
      ? {
          at: row.confirmed_at.slice(0, 10),
          source: {
            type: 'manual',
            detail: bi('Confirmed in Memory', 'Confirmé dans la Mémoire'),
          },
        }
      : null,
    visibility: row.visibility,
    sensitive: row.sensitive,
  }
  // Governance fields (migration 0155) — only set when the column has a value
  if (row.status != null) fact.status = row.status
  if (row.classification != null) fact.classification = row.classification
  if (row.origin != null) fact.origin = row.origin
  if (row.sensitivity != null) fact.sensitivity = row.sensitivity
  if (row.advisor_usable != null) fact.advisorUsable = row.advisor_usable
  if (row.retention_category != null) fact.retentionCategory = row.retention_category
  if (row.review_date != null) fact.reviewDate = row.review_date.slice(0, 10)
  if (row.expiry_date != null) fact.expiryDate = row.expiry_date.slice(0, 10)
  if (row.last_verified_at != null) fact.lastVerifiedAt = row.last_verified_at.slice(0, 10)
  if (row.legal_hold_placed_at != null) {
    fact.legalHold = {
      reason: bi(
        row.legal_hold_reason_en ?? '',
        row.legal_hold_reason_fr ?? row.legal_hold_reason_en ?? '',
      ),
      placedAt: row.legal_hold_placed_at.slice(0, 10),
      placedBy: row.legal_hold_placed_by ?? '',
    }
  }
  if (row.purpose_en != null || row.purpose_fr != null) {
    fact.purpose = bi(row.purpose_en ?? '', row.purpose_fr ?? row.purpose_en ?? '')
  }
  if (row.jurisdiction != null) fact.jurisdiction = row.jurisdiction
  if (row.proposed_by != null) fact.proposedBy = row.proposed_by
  if (row.confidence_score != null) fact.confidenceScore = row.confidence_score
  if (row.source_excerpt_en != null || row.source_excerpt_fr != null) {
    fact.sourceExcerpt = bi(
      row.source_excerpt_en ?? '',
      row.source_excerpt_fr ?? row.source_excerpt_en ?? '',
    )
  }
  if (row.creator_label != null) fact.creator = row.creator_label
  if (row.confirmed_by_label != null) fact.confirmedBy = row.confirmed_by_label
  if (row.retrieval_scope_type != null) {
    fact.retrievalScope = {
      type: row.retrieval_scope_type,
      ...(row.retrieval_scope_id != null ? { id: row.retrieval_scope_id } : {}),
    }
  }
  return fact
}

function toAudit(row: z.infer<typeof auditRowSchema>): ProductionMemoryAuditEntry {
  return {
    id: row.id,
    factId: row.fact_id,
    action: row.action,
    statement: bi(row.statement_en, row.statement_fr),
    createdAt: row.created_at,
    actorUserId: row.actor_user_id,
  }
}

async function requireUserId(): Promise<string | null> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user?.id ?? null
}

async function insertAudit(input: {
  organizationId: string
  factId: string
  actorUserId: string | null
  action: MemoryAuditAction
  statementEn: string
  statementFr: string
}): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.from('hr_advisor_memory_audit').insert({
    organization_id: input.organizationId,
    fact_id: input.factId,
    actor_user_id: input.actorUserId,
    action: input.action,
    statement_en: input.statementEn,
    statement_fr: input.statementFr,
  })
  if (error) throw error
}

// Exported for the lifecycle API split (productionLifecycleApi.ts)
export { requireUserId, insertAudit, factRowSchema, SELECT_COLUMNS, toFact }

export async function listFacts(organizationId: string): Promise<MemoryFact[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const client = supabase
  const data = await fetchAllPages((from, to) =>
    client
      .from('hr_advisor_memory_facts')
      .select(SELECT_COLUMNS)
      .eq('organization_id', organizationId)
      .is('forgotten_at', null)
      .order('learned_at', { ascending: false })
      .order('id')
      .range(from, to),
  )
  return z.array(factRowSchema).parse(data).map(toFact)
}

export async function listFactsByEntity(
  organizationId: string,
  scope: MemoryScope,
  entityId: string,
): Promise<MemoryFact[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const client = supabase
  const data = await fetchAllPages((from, to) =>
    client
      .from('hr_advisor_memory_facts')
      .select(SELECT_COLUMNS)
      .eq('organization_id', organizationId)
      .eq('scope', scope)
      .eq('entity_id', entityId)
      .is('forgotten_at', null)
      .order('learned_at', { ascending: false })
      .order('id')
      .range(from, to),
  )
  return z.array(factRowSchema).parse(data).map(toFact)
}

export async function listAudit(organizationId: string): Promise<ProductionMemoryAuditEntry[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_advisor_memory_audit')
    .select(AUDIT_COLUMNS)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(40)
  if (error) throw error
  return z.array(auditRowSchema).parse(data).map(toAudit)
}

export async function createFact(
  organizationId: string,
  fields: NewMemoryFact,
): Promise<MemoryFact> {
  if (!supabase) throw new Error('Supabase is not configured')
  const actorUserId = await requireUserId()
  const confidence = fields.confidence ?? 'confirmed'
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('hr_advisor_memory_facts')
    .insert({
      organization_id: organizationId,
      scope: fields.scope,
      entity_id: fields.entityId,
      category: fields.category,
      statement_en: fields.statementEn.trim(),
      statement_fr: fields.statementFr.trim() || fields.statementEn.trim(),
      confidence,
      source_type: fields.sourceType ?? 'manual',
      source_detail_en: fields.sourceDetailEn ?? 'Manual entry',
      source_detail_fr: fields.sourceDetailFr ?? 'Saisie manuelle',
      learned_at: now,
      confirmed_at: confidence === 'confirmed' ? now : null,
      visibility: fields.visibility ?? 'hr',
      sensitive: fields.sensitive ?? false,
      created_by: actorUserId,
      updated_by: actorUserId,
      // Governance columns (migration 0155)
      status: fields.status ?? (confidence === 'confirmed' ? 'confirmed' : 'proposed'),
      classification: fields.classification ?? 'fact',
      origin: fields.origin ?? 'manual',
      sensitivity: fields.sensitivity ?? (fields.sensitive ? 'restricted' : 'standard'),
      advisor_usable: fields.advisorUsable ?? true,
      ...(fields.retentionCategory != null ? { retention_category: fields.retentionCategory } : {}),
      ...(fields.reviewDate != null ? { review_date: fields.reviewDate } : {}),
      ...(fields.expiryDate != null ? { expiry_date: fields.expiryDate } : {}),
      ...(fields.purposeEn != null ? { purpose_en: fields.purposeEn } : {}),
      ...(fields.purposeFr != null ? { purpose_fr: fields.purposeFr } : {}),
      ...(fields.jurisdiction != null ? { jurisdiction: fields.jurisdiction } : {}),
      ...(fields.proposedBy != null ? { proposed_by: fields.proposedBy } : {}),
      ...(fields.confidenceScore != null ? { confidence_score: fields.confidenceScore } : {}),
      ...(fields.sourceExcerptEn != null ? { source_excerpt_en: fields.sourceExcerptEn } : {}),
      ...(fields.sourceExcerptFr != null ? { source_excerpt_fr: fields.sourceExcerptFr } : {}),
      ...(fields.creatorLabel != null ? { creator_label: fields.creatorLabel } : {}),
      ...(fields.confirmedByLabel != null ? { confirmed_by_label: fields.confirmedByLabel } : {}),
      ...(fields.retrievalScope != null
        ? {
            retrieval_scope_type: fields.retrievalScope.type,
            ...(fields.retrievalScope.id != null ? { retrieval_scope_id: fields.retrievalScope.id } : {}),
          }
        : {}),
    })
    .select(SELECT_COLUMNS)
    .single()
  if (error) throw error
  const fact = toFact(factRowSchema.parse(data))
  await insertAudit({
    organizationId,
    factId: fact.id,
    actorUserId,
    action: 'create',
    statementEn: fact.statement.en,
    statementFr: fact.statement.fr,
  })
  return fact
}

export async function confirmFact(organizationId: string, factId: string): Promise<MemoryFact> {
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
  if (prior.confidence === 'confirmed') return toFact(prior)

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('hr_advisor_memory_facts')
    .update({
      confidence: 'confirmed',
      confirmed_at: now,
      status: 'confirmed',
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
    action: 'confirm',
    statementEn: prior.statement_en,
    statementFr: prior.statement_fr,
  })
  return toFact(factRowSchema.parse(data))
}

export async function correctFact(
  organizationId: string,
  factId: string,
  statement: string,
): Promise<MemoryFact> {
  if (!supabase) throw new Error('Supabase is not configured')
  const trimmed = statement.trim()
  if (trimmed.length === 0) throw new Error('Statement cannot be empty')
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
  /* Correction is operator-entered — store the same text in both columns until
     a localization workflow exists (matches demo memoryStore behaviour). */
  const { data, error } = await supabase
    .from('hr_advisor_memory_facts')
    .update({
      statement_en: trimmed,
      statement_fr: trimmed,
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
    action: 'correct',
    statementEn: prior.statement_en,
    statementFr: prior.statement_fr,
  })
  return toFact(factRowSchema.parse(data))
}

export async function forgetFact(organizationId: string, factId: string): Promise<void> {
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
      forgotten_at: now,
      status: 'removed',
      advisor_usable: false,
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
    action: 'forget',
    statementEn: prior.statement_en,
    statementFr: prior.statement_fr,
  })
}

/**
 * Soft-forget every active fact for a person (PIPEDA / Law 25 erasure of
 * that person's memory record). Audits each row. Returns how many were forgotten.
 */
export async function forgetFactsForEntity(
  organizationId: string,
  scope: MemoryScope,
  entityId: string,
): Promise<number> {
  if (!supabase) throw new Error('Supabase is not configured')
  const actorUserId = await requireUserId()
  const { data: existing, error: readError } = await supabase
    .from('hr_advisor_memory_facts')
    .select(SELECT_COLUMNS)
    .eq('organization_id', organizationId)
    .eq('scope', scope)
    .eq('entity_id', entityId)
    .is('forgotten_at', null)
  if (readError) throw readError
  const rows = z.array(factRowSchema).parse(existing ?? [])
  const now = new Date().toISOString()
  for (const prior of rows) {
    const { error } = await supabase
      .from('hr_advisor_memory_facts')
      .update({
        forgotten_at: now,
        updated_by: actorUserId,
        updated_at: now,
      })
      .eq('id', prior.id)
      .eq('organization_id', organizationId)
    if (error) throw error
    await insertAudit({
      organizationId,
      factId: prior.id,
      actorUserId,
      action: 'forget',
      statementEn: prior.statement_en,
      statementFr: prior.statement_fr,
    })
  }
  return rows.length
}

