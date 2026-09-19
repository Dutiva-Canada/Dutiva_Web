import { supabase } from '@/lib/supabaseClient'
import type { Json } from '@/lib/supabase/types'
import type { AgentAuditRecord } from './types'

/**
 * The agent audit log — every execution attempt, successful or refused.
 *
 * The record captures who (role + org), what (tool + params), when, and how
 * it ended. Interactive executions write here synchronously; a server-side
 * executor writes the same record shape to a table (spec §Audit).
 *
 * Two sinks: the in-memory list is authoritative for the session and never
 * loses a record; when the attempt ran against a production workspace and a
 * Supabase client exists, a best-effort copy also goes to the `agent_audit`
 * table (migration `0157_agent_audit.sql`). Persist failure never changes a
 * tool outcome — it warns and the in-memory record stands.
 */

const MAX_RECORDS = 200

const records: AgentAuditRecord[] = []

export function appendAudit(record: AgentAuditRecord): void {
  records.push(record)
  if (records.length > MAX_RECORDS) records.splice(0, records.length - MAX_RECORDS)
  void persistRecord(record)
}

/**
 * Best-effort durable copy. Only production attempts persist — demo records
 * describe fixture play, not real operations, and have no org to scope to.
 * `actor_id` and the row `id` are stamped by the database (DEFAULT
 * auth.uid() / gen_random_uuid()), so this insert carries no identity the
 * client could forge.
 *
 * `agent_audit` is applied (migration `0157`) and present in the generated
 * `Database` types, so the insert is fully typed — `params` is the only
 * cast, since tool params are `Record<string, unknown>` and the column is
 * `jsonb`.
 */
async function persistRecord(record: AgentAuditRecord): Promise<void> {
  if (record.mode !== 'production' || !record.organizationId || !supabase) return
  try {
    const { error } = await supabase.from('agent_audit').insert({
      organization_id: record.organizationId,
      tool_id: record.toolId,
      module: record.module,
      tier: record.tier,
      params: record.params as Json,
      mode: record.mode,
      role: record.role,
      status: record.status,
      error_code: record.errorCode ?? null,
      started_at: record.startedAt,
      finished_at: record.finishedAt,
    })
    if (error) {
      console.warn('agent_audit persist failed — record kept in memory:', error.message)
    }
  } catch (err) {
    console.warn('agent_audit persist threw — record kept in memory:', err)
  }
}

export function listAudit(): readonly AgentAuditRecord[] {
  return records
}

/** Test hook. */
export function resetAuditForTest(): void {
  records.length = 0
}
