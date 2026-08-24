import { z } from 'zod'
import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import type {
  MemoryCategory,
  MemoryConfidence,
  MemoryFact,
  MemoryScope,
  MemorySourceType,
  MemoryVisibility,
} from '@/data'
import { supabase } from '@/lib/supabaseClient'
import { fetchAllPages } from '@/lib/supabasePagination'

/**
 * Real persistence for Advisor Memory (production mode) —
 * `public.hr_advisor_memory_facts` + `hr_advisor_memory_audit` (migration 0086).
 * Same boundary contract as employees/cases: zod-validated rows, throws on
 * failure. Demo mode keeps `memoryStore` + fixtures.
 */

export type MemoryAuditAction = 'confirm' | 'correct' | 'forget' | 'create'

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
})

const auditRowSchema = z.object({
  id: z.string(),
  fact_id: z.string(),
  actor_user_id: z.string().nullable(),
  action: z.enum(['confirm', 'correct', 'forget', 'create']),
  statement_en: z.string(),
  statement_fr: z.string(),
  created_at: z.string(),
})

const SELECT_COLUMNS =
  'id, scope, entity_id, category, statement_en, statement_fr, confidence, source_type, source_detail_en, source_detail_fr, learned_at, confirmed_at, visibility, sensitive'

const AUDIT_COLUMNS =
  'id, fact_id, actor_user_id, action, statement_en, statement_fr, created_at'

function formatDateLabel(iso: string): Bi {
  const d = new Date(iso)
  return bi(
    d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }),
    d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }),
  )
}

function toFact(row: z.infer<typeof factRowSchema>): MemoryFact {
  return {
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
    learned: formatDateLabel(row.learned_at),
    confirmed: row.confirmed_at ? formatDateLabel(row.confirmed_at) : null,
    visibility: row.visibility,
    sensitive: row.sensitive,
  }
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
