import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import type { Bi, Lang } from '@/i18n/core'
import { bi } from '@/i18n/core'
import { exportProtectionMessages as M } from '@/i18n/messages/exportProtection'
import { contentFingerprint, newExportId } from './fingerprint'
import type { ExportStamp } from './watermark'
import {
  appendExportAudit,
  localExportDecision,
  type ExportKind,
  type ExportSurface,
} from './localAudit'

/**
 * Export authorization — the decision every export path calls before any
 * artifact is built (docs/EXPORT_PROTECTION.md).
 *
 * Order of authority:
 *
 *   1. LOCAL velocity guard — always consulted first; a locally-refused
 *      export never even reaches the network.
 *   2. SERVER claim (signed-in only) — the record-export edge function
 *      atomically checks the server ceilings and writes the authoritative
 *      `export_events` row, returning the export id that row minted. Its
 *      refusal (429) is final.
 *   3. If the server is unreachable (offline PWA, demo mode, function not
 *      yet deployed) the export proceeds under the local decision with a
 *      locally-minted id. Deliberate fail-open: this app must keep working
 *      offline (docs/OFFLINE_PWA.md), and an artifact exported offline still
 *      carries its watermark — what is lost is only the server copy of the
 *      audit row, which `recordedRemotely: false` makes visible.
 *
 * Every allowed export lands in the device audit trail regardless of path.
 */

export interface ExportRequest {
  surface: ExportSurface
  kind: ExportKind
  /** Localized document title (for the audit rows, capped there). */
  title: string
  /** The exact text being exported — hashed, never stored client-side. */
  content: string
  lang: Lang
  actorLabel: string
  workspaceLabel: string
  session: Session | null
}

type ExportDenialScope = 'burst' | 'daily' | 'server'

export type ExportDecision =
  | { allowed: true; stamp: ExportStamp; recordedRemotely: boolean; contentSha256: string }
  | { allowed: false; scope: ExportDenialScope; retryAfterSeconds: number }

/** Wire shape of a record-export 429 (supabase/functions/_shared/exportGuard.ts). */
interface LimitBody {
  code?: string
  scope?: string
  retry_after_seconds?: number
}

const EXPORT_LIMIT_CODE = 'export_limit'

/**
 * Asks the edge function to claim a slot + write the audit row. Three
 * outcomes: an export id (allowed), a denial (server said 429), or null
 * (unreachable/misconfigured — caller falls back to the local decision).
 */
async function claimRemote(
  req: ExportRequest,
  sha256: string,
): Promise<{ exportId: string } | { denied: Extract<ExportDecision, { allowed: false }> } | null> {
  if (!supabase || !req.session) return null
  try {
    const { data, error } = await supabase.functions.invoke('record-export', {
      body: {
        surface: req.surface,
        kind: req.kind,
        title: req.title.slice(0, 200),
        content_sha256: sha256,
        content_chars: req.content.length,
        lang: req.lang,
      },
    })
    if (error) {
      /* A 429 from the guard is a real refusal; anything else (404 while the
         function is undeployed, 5xx, network) falls back to local. The typed
         FunctionsHttpError carries the Response as `context`. */
      const response = (error as { context?: unknown }).context
      if (response instanceof Response && response.status === 429) {
        const body = (await response.json().catch(() => ({}))) as LimitBody
        if (body.code === EXPORT_LIMIT_CODE) {
          return {
            denied: {
              allowed: false,
              scope: body.scope === 'burst' ? 'burst' : 'server',
              retryAfterSeconds: Math.max(1, Math.trunc(body.retry_after_seconds ?? 60)),
            },
          }
        }
      }
      return null
    }
    const exportId = (data as { export_id?: unknown } | null)?.export_id
    return typeof exportId === 'string' && exportId.length > 0 ? { exportId } : null
  } catch {
    return null
  }
}

export async function authorizeExport(req: ExportRequest): Promise<ExportDecision> {
  const local = localExportDecision()
  if (!local.allowed) {
    return { allowed: false, scope: local.scope, retryAfterSeconds: local.retryAfterSeconds }
  }

  const sha256 = await contentFingerprint(req.content)
  const remote = await claimRemote(req, sha256)
  if (remote && 'denied' in remote) return remote.denied

  const stamp: ExportStamp = {
    exportId: remote ? remote.exportId : newExportId(),
    actorLabel: req.actorLabel,
    workspaceLabel: req.workspaceLabel,
    exportedAt: new Date(),
  }
  appendExportAudit({
    exportId: stamp.exportId,
    surface: req.surface,
    kind: req.kind,
    title: req.title,
    contentSha256: sha256,
    contentChars: req.content.length,
    lang: req.lang,
    actorLabel: req.actorLabel,
    at: stamp.exportedAt.toISOString(),
    recordedRemotely: remote !== null,
  })
  return { allowed: true, stamp, recordedRemotely: remote !== null, contentSha256: sha256 }
}

/** "{count} minutes" / "an hour" — same deliberately-vague rounding-up voice
 * as the Advisor's usage refusals (advisor/usageLimit.ts). */
function waitPhrase(seconds: number): Bi {
  const safe = Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 60
  if (safe <= 90) return M.exportprot_wait_minute
  if (safe < 3600) {
    const count = String(Math.ceil(safe / 60))
    return bi(
      M.exportprot_wait_minutes.en.replace('{count}', count),
      M.exportprot_wait_minutes.fr.replace('{count}', count),
    )
  }
  if (safe <= 90 * 60) return M.exportprot_wait_hour
  const count = String(Math.min(24, Math.ceil(safe / 3600)))
  return bi(
    M.exportprot_wait_hours.en.replace('{count}', count),
    M.exportprot_wait_hours.fr.replace('{count}', count),
  )
}

/** The refusal toast for a denied export, bilingual. */
export function exportDenialMessage(denial: Extract<ExportDecision, { allowed: false }>): Bi {
  const wait = waitPhrase(denial.retryAfterSeconds)
  const template = denial.scope === 'burst' ? M.exportprot_limit_burst : M.exportprot_limit_daily
  return bi(template.en.replace('{wait}', wait.en), template.fr.replace('{wait}', wait.fr))
}
