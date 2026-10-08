import type { SupabaseClient } from './chatTypes.ts'
import type { MemoryFactForPrompt } from './memoryFacts.ts'
import type { ExtractedMemoryCandidate } from './memoryExtract.ts'
import { normalizeOrgPlan, type OrgPlanId } from './planEntitlements.ts'

/**
 * Org plan load + memory-fact read/write for the turn pipeline. Everything
 * here fails soft — plan and memory are enrichments, so a failure degrades
 * the turn instead of failing it (same posture as corpus retrieval).
 */

/**
 * Effective org plan for feature gates. Failures → free (fail closed for
 * premium injection, not for chat itself).
 */
export async function loadOrganizationPlan(
  adminClient: SupabaseClient,
  organizationId: string | null,
): Promise<OrgPlanId> {
  if (!organizationId) return 'free'
  try {
    const { data, error } = await adminClient
      .from('organizations')
      .select('plan, subscription_status')
      .eq('id', organizationId)
      .maybeSingle()
    if (error || !data) return 'free'
    const status = String((data as { subscription_status?: string }).subscription_status ?? '')
    if (status !== 'active' && status !== 'trialing') return 'free'
    return normalizeOrgPlan((data as { plan?: string }).plan)
  } catch {
    return 'free'
  }
}

/**
 * Load confirmed org memory for prompt injection. Failures return [] — memory
 * must never take the Advisor down (same posture as corpus retrieval).
 * When plan feature gates are on, Free/Starter never receive cross-record
 * memory in the prompt (facts remain stored for privacy/export paths).
 */
export async function loadOrgMemoryFacts(
  adminClient: SupabaseClient,
  organizationId: string | null,
  allowInjection: boolean,
): Promise<MemoryFactForPrompt[]> {
  if (!organizationId || !allowInjection) return []
  try {
    const { data, error } = await adminClient
      .from('hr_advisor_memory_facts')
      .select(
        'id, scope, entity_id, category, statement_en, statement_fr, source_type, visibility, sensitive, confidence',
      )
      .eq('organization_id', organizationId)
      .eq('confidence', 'confirmed')
      .eq('sensitive', false)
      .is('forgotten_at', null)
      .order('learned_at', { ascending: false })
      .limit(40)
    if (error) {
      console.error('advisor-chat: memory facts load failed —', error.message)
      return []
    }
    const rows = (data ?? []) as Array<{
      id: string
      scope: MemoryFactForPrompt['scope']
      entity_id: string
      category: string
      statement_en: string
      statement_fr: string
      source_type: string
      visibility: MemoryFactForPrompt['visibility']
      sensitive: boolean
      confidence: MemoryFactForPrompt['confidence']
    }>
    return rows.map((r) => ({
      id: r.id,
      scope: r.scope,
      entityId: r.entity_id,
      category: r.category,
      statementEn: r.statement_en,
      statementFr: r.statement_fr,
      sourceType: r.source_type,
      visibility: r.visibility,
      sensitive: r.sensitive,
      confidence: r.confidence,
    }))
  } catch (error) {
    console.error('advisor-chat: memory facts load failed —', error)
    return []
  }
}

/**
 * Persist inferred candidates from a dutiva-memory fence. Dedupes exact
 * statement_en matches for the same org+scope+entity. Failures are logged
 * and swallowed — extraction must never fail the user-visible reply.
 */
export async function persistExtractedFacts(
  adminClient: SupabaseClient,
  organizationId: string,
  conversationId: string,
  actorUserId: string,
  candidates: readonly ExtractedMemoryCandidate[],
): Promise<
  Array<{
    factId: string
    scope: 'person' | 'case' | 'thread'
    entityId: string
    statementEn: string
    statementFr: string
  }>
> {
  if (candidates.length === 0) return []
  const created: Array<{
    factId: string
    scope: 'person' | 'case' | 'thread'
    entityId: string
    statementEn: string
    statementFr: string
  }> = []
  try {
    const { data: existing, error: readError } = await adminClient
      .from('hr_advisor_memory_facts')
      .select('statement_en, scope, entity_id')
      .eq('organization_id', organizationId)
      .is('forgotten_at', null)
      .limit(200)
    if (readError) {
      console.error('advisor-chat: extract dedupe read failed —', readError.message)
      return []
    }
    const seen = new Set(
      ((existing ?? []) as Array<{ statement_en: string; scope: string; entity_id: string }>).map(
        (r) => `${r.scope}:${r.entity_id}:${r.statement_en.trim().toLowerCase()}`,
      ),
    )
    const now = new Date().toISOString()
    for (const c of candidates) {
      const key = `${c.scope}:${c.entityId}:${c.statementEn.trim().toLowerCase()}`
      if (seen.has(key)) continue
      seen.add(key)
      const entityId = c.entityId || conversationId
      const { data: inserted, error: insertError } = await adminClient
        .from('hr_advisor_memory_facts')
        .insert({
          organization_id: organizationId,
          scope: c.scope,
          entity_id: entityId,
          category: c.category,
          statement_en: c.statementEn,
          statement_fr: c.statementFr || c.statementEn,
          confidence: 'inferred',
          source_type: 'chat',
          source_detail_en: 'Extracted from Advisor conversation',
          source_detail_fr: 'Extrait d’une conversation avec le Conseiller',
          learned_at: now,
          confirmed_at: null,
          visibility: c.sensitive ? 'restricted' : 'hr',
          sensitive: c.sensitive,
          created_by: actorUserId,
          updated_by: actorUserId,
        })
        .select('id, statement_en, statement_fr, scope, entity_id')
        .single()
      if (insertError || !inserted) {
        console.error('advisor-chat: extract insert failed —', insertError?.message)
        continue
      }
      const row = inserted as {
        id: string
        statement_en: string
        statement_fr: string
        scope: 'person' | 'case' | 'thread'
        entity_id: string
      }
      await adminClient.from('hr_advisor_memory_audit').insert({
        organization_id: organizationId,
        fact_id: row.id,
        actor_user_id: actorUserId,
        action: 'create',
        statement_en: row.statement_en,
        statement_fr: row.statement_fr,
      })
      created.push({
        factId: row.id,
        scope: row.scope,
        entityId: row.entity_id,
        statementEn: row.statement_en,
        statementFr: row.statement_fr,
      })
    }
  } catch (error) {
    console.error('advisor-chat: extract persist failed —', error)
  }
  return created
}
