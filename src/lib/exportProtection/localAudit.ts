/**
 * Device-local export audit trail + velocity guard.
 *
 * Two jobs, one localStorage ring buffer (`dutiva-export-audit`):
 *
 *   1. AUDIT — every export (demo or signed-in) appends an entry, so the
 *      Settings audit log can show real export activity even offline. The
 *      server-side trail (`export_events`, written by the record-export edge
 *      function) is the authoritative copy for signed-in exports; this one
 *      is the device's own record and the only record demo mode has.
 *   2. GUARD — a sliding-window rate check over those entries. The threat is
 *      bulk exfiltration: someone sitting on the export button (or scripting
 *      it) to walk out with the whole library. A real HR workday exports a
 *      handful of documents; the ceilings are far above that and far below
 *      "the entire catalogue in an afternoon".
 *
 * The guard is deliberately storage-honest: if localStorage is unavailable
 * (private mode), there is no history to count, so it allows — velocity
 * enforcement then rests on the server guard for signed-in exports, and every
 * artifact still carries its watermark either way. Clearing site data resets
 * the local window; that is understood — the local guard is friction for the
 * casual case, the server guard is the one a determined user has to beat.
 */

const EXPORT_SURFACES = ['docstudio', 'doclib', 'memory', 'advisor'] as const
const EXPORT_KINDS = ['pdf', 'word', 'link', 'json', 'text'] as const

export type ExportSurface = (typeof EXPORT_SURFACES)[number]
export type ExportKind = (typeof EXPORT_KINDS)[number]

export interface ExportAuditEntry {
  exportId: string
  surface: ExportSurface
  kind: ExportKind
  /** Document title as exported (already localized) — capped for storage. */
  title: string
  contentSha256: string
  contentChars: number
  lang: 'en' | 'fr'
  /** "Name (email)" or the demo workspace label. */
  actorLabel: string
  /** ISO timestamp. */
  at: string
  /** Whether the server audit trail also has this export. */
  recordedRemotely: boolean
}

const STORE_KEY = 'dutiva-export-audit'
/** Ring-buffer cap — ~a month of heavy real use; the guard windows below only
 * ever look 24h back, so the cap never truncates what the guard counts. */
const MAX_ENTRIES = 300
const TITLE_CAP = 120

interface LocalGuardPolicy {
  burstWindowSeconds: number
  burstLimit: number
  dailyLimit: number
}

/** Client-side ceilings — mirrored (tighter) by the server policy in
 * supabase/functions/_shared/exportGuard.ts; keep the two in sight of each
 * other when tuning. */
export const LOCAL_GUARD_POLICY: LocalGuardPolicy = {
  burstWindowSeconds: 300,
  burstLimit: 12,
  dailyLimit: 100,
}

type LocalGuardDecision =
  { allowed: true } | { allowed: false; scope: 'burst' | 'daily'; retryAfterSeconds: number }

function isEntry(value: unknown): value is ExportAuditEntry {
  if (value === null || typeof value !== 'object') return false
  const e = value as Record<string, unknown>
  return (
    typeof e.exportId === 'string' &&
    /* Validate against the full surface/kind vocabularies. This predicate
       used to hard-code only docstudio/memory + pdf/word/link/json, so
       advisor 'Copy' and doclib exports were written by appendExportAudit
       and then filtered straight back out by readExportAudit — invisible to
       the velocity guard and to Settings → Export activity. Driving both
       off the exported arrays keeps the check from drifting from the type
       again (2026-08-08 security audit). */
    EXPORT_SURFACES.includes(e.surface as ExportSurface) &&
    EXPORT_KINDS.includes(e.kind as ExportKind) &&
    typeof e.title === 'string' &&
    typeof e.contentSha256 === 'string' &&
    typeof e.contentChars === 'number' &&
    (e.lang === 'en' || e.lang === 'fr') &&
    typeof e.actorLabel === 'string' &&
    typeof e.at === 'string' &&
    typeof e.recordedRemotely === 'boolean'
  )
}

/** Newest first. Tolerant of missing/corrupt storage — a bad trail reads as
 * empty rather than throwing inside an export. */
export function readExportAudit(): ExportAuditEntry[] {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isEntry)
  } catch {
    return []
  }
}

export function appendExportAudit(entry: ExportAuditEntry): void {
  try {
    const next = [{ ...entry, title: entry.title.slice(0, TITLE_CAP) }, ...readExportAudit()]
    localStorage.setItem(STORE_KEY, JSON.stringify(next.slice(0, MAX_ENTRIES)))
  } catch {
    /* best effort — same posture as writePref */
  }
}

/** Test hook. */
export function clearExportAudit(): void {
  try {
    localStorage.removeItem(STORE_KEY)
  } catch {
    /* best effort */
  }
}

/**
 * Sliding-window velocity check over the local trail. Retry-after is when the
 * oldest export in the offending window ages out — same shape as the server's
 * claim_export_slot, so refusals read identically wherever they come from.
 */
export function localExportDecision(
  now: Date = new Date(),
  policy: LocalGuardPolicy = LOCAL_GUARD_POLICY,
): LocalGuardDecision {
  const entries = readExportAudit()
  const nowMs = now.getTime()
  const windows: { scope: 'burst' | 'daily'; seconds: number; limit: number }[] = [
    { scope: 'burst', seconds: policy.burstWindowSeconds, limit: policy.burstLimit },
    { scope: 'daily', seconds: 24 * 3600, limit: policy.dailyLimit },
  ]
  for (const w of windows) {
    const since = nowMs - w.seconds * 1000
    const inWindow = entries.filter((e) => {
      const t = Date.parse(e.at)
      return Number.isFinite(t) && t >= since && t <= nowMs
    })
    if (inWindow.length >= w.limit) {
      const oldest = Math.min(...inWindow.map((e) => Date.parse(e.at)))
      const retry = Math.ceil((oldest + w.seconds * 1000 - nowMs) / 1000)
      return { allowed: false, scope: w.scope, retryAfterSeconds: Math.max(1, retry) }
    }
  }
  return { allowed: true }
}
