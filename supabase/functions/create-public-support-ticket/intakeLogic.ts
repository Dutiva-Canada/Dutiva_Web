/*
 * Pure intake logic for the public support form — extracted from index.ts
 * so the decisions that gate a public submission (category allowlists,
 * triage, CAPTCHA interpretation, rate-limit identity) are unit-testable
 * without a Deno runtime or a database. index.ts keeps the plumbing:
 * env reads, fetch, RPC calls, the response envelope.
 */

export const CATEGORIES = [
  'account_access',
  'billing',
  'technical',
  'product_question',
  'privacy',
  'security',
  'accessibility',
  'complaint',
  'sales',
  'other',
] as const
export type Category = (typeof CATEGORIES)[number]

/** Only these may be submitted without an account (mirror allowPublic in config). */
export const PUBLIC_CATEGORIES = new Set<Category>([
  'product_question',
  'privacy',
  'security',
  'accessibility',
  'sales',
])
/** Restricted handling: requester + admin only, off the ordinary product queue. */
export const RESTRICTED_CATEGORIES = new Set<Category>([
  'privacy',
  'security',
  'accessibility',
  'complaint',
])

export const IMPACTS = ['blocking', 'major', 'minor', 'none'] as const
export type Impact = (typeof IMPACTS)[number]
export const URGENCIES = ['urgent', 'soon', 'whenever'] as const
export type Urgency = (typeof URGENCIES)[number]
export const RESPONSE_METHODS = ['email', 'scheduled_call'] as const
export const LANGUAGES = ['en', 'fr'] as const

export const PRIORITIES = ['low', 'standard', 'high', 'critical'] as const
export const PAID_FLOOR_PLANS = new Set(['growth', 'pro'])
export const RESTRICTED_FROM_PAID_FLOOR = new Set<Category>([
  'privacy',
  'security',
  'accessibility',
  'complaint',
])

export function applyPaidSupportFloor(
  priority: string,
  plan: string | null,
  category: Category,
): string {
  if (!plan || !PAID_FLOOR_PLANS.has(plan)) return priority
  if (RESTRICTED_FROM_PAID_FLOOR.has(category)) return priority
  if (priority === 'high' || priority === 'critical') return priority
  return 'high'
}

export function normalizePlan(value: unknown): string | null {
  const plan = String(value ?? '').toLowerCase()
  return plan === 'free' || plan === 'starter' || plan === 'growth' || plan === 'pro' ? plan : null
}

/** Server-side priority — capped at 'high'; 'critical' is a human triage call. */
export function suggestPriority(category: Category, impact: Impact, urgency: Urgency): string {
  const impactRank = impact === 'blocking' ? 2 : impact === 'major' || impact === 'minor' ? 1 : 0
  const categoryFloor =
    category === 'security'
      ? 2
      : category === 'account_access' ||
          category === 'accessibility' ||
          category === 'privacy' ||
          category === 'billing' ||
          category === 'complaint'
        ? 1
        : 0
  let rank = Math.max(impactRank, categoryFloor)
  if (urgency === 'urgent' && impact !== 'none') rank += 1
  return PRIORITIES[Math.min(rank, 2)]!
}

/** Customer acknowledgement kind by category (mirror notifications.ts). */
export function acknowledgementKind(category: Category): string {
  if (category === 'privacy') return 'privacy_ack'
  if (category === 'security') return 'security_ack'
  if (category === 'accessibility') return 'accessibility_ack'
  if (category === 'complaint') return 'complaint_ack'
  return 'ticket_received'
}

export function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback
}

export function str(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length >= 1 && trimmed.length <= max ? trimmed : null
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function sha256hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Best-effort client IP from the usual proxy headers. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return req.headers.get('cf-connecting-ip') ?? req.headers.get('x-real-ip') ?? 'unknown'
}

// ── CAPTCHA (mirror of src/features/support/captcha.ts) ──────────────────
// Turnstile and hCaptcha share one siteverify request/response shape, so the
// provider is a config value rather than a second code path.

export const CAPTCHA_VERIFY_ENDPOINTS: Record<string, string> = {
  turnstile: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
  hcaptcha: 'https://api.hcaptcha.com/siteverify',
}

export type CaptchaResult = { ok: true } | { ok: false; reason: string }

export function interpretSiteverify(payload: unknown): CaptchaResult {
  if (typeof payload !== 'object' || payload === null)
    return { ok: false, reason: 'provider_error' }
  const record = payload as { success?: unknown; 'error-codes'?: unknown }
  if (record.success === true) return { ok: true }
  const codes = Array.isArray(record['error-codes'])
    ? record['error-codes'].filter((c): c is string => typeof c === 'string')
    : []
  // Our own misconfiguration ranks above the caller's token — a wrong secret
  // makes every token "fail", and blaming the token hides the real cause.
  if (codes.includes('missing-input-secret') || codes.includes('invalid-input-secret')) {
    return { ok: false, reason: 'bad_secret' }
  }
  if (codes.includes('missing-input-response')) return { ok: false, reason: 'missing_token' }
  if (codes.includes('timeout-or-duplicate')) return { ok: false, reason: 'duplicate_token' }
  if (codes.includes('invalid-input-response')) return { ok: false, reason: 'invalid_token' }
  if (codes.includes('bad-request') || codes.includes('internal-error')) {
    return { ok: false, reason: 'provider_error' }
  }
  return { ok: false, reason: 'invalid_token' }
}
