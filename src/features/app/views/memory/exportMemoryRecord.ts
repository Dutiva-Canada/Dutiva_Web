import type { Session } from '@supabase/supabase-js'
import type { Lang } from '@/i18n/core'
import { pick } from '@/i18n/core'
import { memoryMessages as M } from '@/i18n/messages/memory'
import {
  authorizeExport,
  encodeInvisibleTag,
  exportDenialMessage,
  exportFilename,
  triggerDownload,
  watermarkNotice,
} from '@/lib/exportProtection'
import type { MemoryFact } from '@/data'
import type { ProductionMemoryAuditEntry } from './productionApi'

/**
 * PIPEDA / Law 25 access+portability export for Advisor Memory — same
 * authorizeExport pipeline as the demo manager (velocity guard, audit trail,
 * `_export` provenance manifest with invisible tag in the notice).
 */

export type MemoryExportResult =
  | { ok: true }
  | { ok: false; denial: ReturnType<typeof exportDenialMessage> }

export async function exportMemoryRecord(input: {
  facts: readonly MemoryFact[]
  audit?: readonly ProductionMemoryAuditEntry[]
  lang: Lang
  actorLabel: string
  workspaceLabel: string
  session: Session | null
}): Promise<MemoryExportResult> {
  const title = pick(M.memory_mgr_export_title, input.lang)
  const body = {
    facts: input.facts,
    ...(input.audit != null ? { audit: input.audit } : {}),
  }
  const content = JSON.stringify(body, null, 2)
  const decision = await authorizeExport({
    surface: 'memory',
    kind: 'json',
    title,
    content,
    lang: input.lang,
    actorLabel: input.actorLabel,
    workspaceLabel: input.workspaceLabel,
    session: input.session,
  })
  if (!decision.allowed) {
    return { ok: false, denial: exportDenialMessage(decision) }
  }
  const { stamp } = decision
  const payload = {
    _export: {
      export_id: stamp.exportId,
      exported_by: stamp.actorLabel,
      workspace: stamp.workspaceLabel,
      exported_at: stamp.exportedAt.toISOString(),
      content_sha256: decision.contentSha256,
      notice: pick(watermarkNotice(stamp), input.lang) + encodeInvisibleTag(stamp.exportId),
    },
    ...body,
  }
  triggerDownload(
    exportFilename(title, 'json', stamp.exportedAt),
    new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
  )
  return { ok: true }
}
