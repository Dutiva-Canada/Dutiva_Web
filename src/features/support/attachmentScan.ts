/**
 * Malware-scan verdicts for support ticket attachments.
 *
 * Pure and dependency-free so it is unit-tested here and **mirrored** by the
 * `support-attachment-scan` worker — the same convention as `captcha.ts` and
 * `svixSignature.ts`. Keep the two in sync.
 *
 * The scanner itself is an operator-provided HTTP endpoint
 * (`SUPPORT_ATTACHMENT_SCAN_URL`) — typically a ClamAV wrapper — so this module
 * defines the contract we hold it to and, more importantly, decides what an
 * answer we do NOT understand means.
 *
 * **Unrecognised is never clean.** Every ambiguous response maps to `unknown`,
 * which leaves the row `pending` for a later attempt rather than marking a file
 * safe on a shrug. That asymmetry is the whole point: a false `flagged` costs a
 * customer one re-upload, a false `clean` puts malware behind a download button
 * the founder is about to click.
 */

export type ScanVerdict =
  /** Scanned, nothing found — safe to release for download. */
  | 'clean'
  /** Malware found — the object stays, downloads stay blocked. */
  | 'flagged'
  /** The scanner cannot handle this file at all; retrying will not change that. */
  | 'skipped'
  /** Indeterminate — leave pending and try again. */
  | 'unknown'

/** How many times a single attachment is offered to the scanner before we stop. */
export const SCAN_MAX_ATTEMPTS = 5

/** Rows drained per worker run — bounds a run against the function timeout. */
export const SCAN_BATCH_SIZE = 25

const CLEAN_WORDS = new Set([
  'clean',
  'ok',
  'no_threats',
  'no-threats',
  'negative',
  'pass',
  'passed',
])
const FLAGGED_WORDS = new Set([
  'infected',
  'malicious',
  'found',
  'positive',
  'flagged',
  'threat',
  'virus',
  'fail',
  'failed',
])
const SKIPPED_WORDS = new Set([
  'unsupported',
  'too_large',
  'too-large',
  'skipped',
  'encrypted',
  'unscannable',
])

function fromWord(value: string): ScanVerdict {
  const word = value.trim().toLowerCase()
  if (CLEAN_WORDS.has(word)) return 'clean'
  if (FLAGGED_WORDS.has(word)) return 'flagged'
  if (SKIPPED_WORDS.has(word)) return 'skipped'
  return 'unknown'
}

/**
 * Read a scanner response into a verdict.
 *
 * The documented contract is `{ status: 'clean' | 'infected' | 'unsupported' }`,
 * but the common boolean shapes (`infected` / `clean`) and the `result` alias
 * are accepted too, so an operator can point at an off-the-shelf ClamAV wrapper
 * without writing an adapter. Anything else is `unknown`.
 */
export function interpretScanResponse(payload: unknown): ScanVerdict {
  if (typeof payload === 'string') return fromWord(payload)
  if (typeof payload !== 'object' || payload === null) return 'unknown'

  const record = payload as Record<string, unknown>

  // Explicit booleans first — they are unambiguous where a word may not be.
  if (typeof record.infected === 'boolean') return record.infected ? 'flagged' : 'clean'
  if (typeof record.malicious === 'boolean') return record.malicious ? 'flagged' : 'clean'
  // `clean: false` only says "not clean"; it does not say malware was found,
  // and we must not upgrade a negative into a positive detection.
  if (typeof record.clean === 'boolean') return record.clean ? 'clean' : 'unknown'

  for (const key of ['status', 'result', 'verdict']) {
    const value = record[key]
    if (typeof value === 'string') {
      const verdict = fromWord(value)
      if (verdict !== 'unknown') return verdict
    }
  }
  return 'unknown'
}

/** Short, non-sensitive detail string to store alongside the verdict. */
export function scanDetail(payload: unknown, max = 200): string | null {
  if (typeof payload !== 'object' || payload === null) return null
  const record = payload as Record<string, unknown>
  for (const key of ['detail', 'message', 'reason', 'signature', 'threat']) {
    const value = record[key]
    if (typeof value === 'string' && value.trim() !== '') return value.trim().slice(0, max)
  }
  return null
}

/**
 * Decide the row's next `scan_status` from a verdict and the attempt count.
 *
 * `unknown` keeps the row pending until the attempts are spent, then settles on
 * `skipped` — an honest "we never established this was safe", distinct from
 * `clean`. Downloads treat `skipped` as un-scanned, not as approved.
 */
export function nextScanStatus(
  verdict: ScanVerdict,
  attemptsSoFar: number,
  maxAttempts = SCAN_MAX_ATTEMPTS,
): 'pending' | 'clean' | 'flagged' | 'skipped' {
  if (verdict === 'clean') return 'clean'
  if (verdict === 'flagged') return 'flagged'
  if (verdict === 'skipped') return 'skipped'
  return attemptsSoFar + 1 >= maxAttempts ? 'skipped' : 'pending'
}

/**
 * Whether a file may be handed to a customer or the founder for download.
 *
 * `flagged` is refused unconditionally — including for admins, and including
 * after the scanner is switched off. Everything else is releasable only when
 * scanning is not enabled; with a scanner configured, a file that has not come
 * back `clean` is still an unknown quantity.
 */
export function canReleaseAttachment(
  scanStatus: string,
  scanningEnabled: boolean,
): { allowed: true } | { allowed: false; reason: 'infected' | 'unscanned' } {
  if (scanStatus === 'flagged') return { allowed: false, reason: 'infected' }
  if (!scanningEnabled) return { allowed: true }
  if (scanStatus === 'clean') return { allowed: true }
  return { allowed: false, reason: 'unscanned' }
}
