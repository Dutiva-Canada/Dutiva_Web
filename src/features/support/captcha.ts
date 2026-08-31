/**
 * CAPTCHA verification for the public (unauthenticated) support intake — the
 * second anti-abuse layer beyond the honeypot and the per-IP/per-email rate
 * limits, which a determined script defeats trivially.
 *
 * Pure and dependency-free (the network call is injectable) so it is unit-tested
 * here and **mirrored** by the `create-public-support-ticket` edge function —
 * same convention as `svixSignature.ts` / the `resend-webhook` mirror. Keep the
 * two in sync.
 *
 * Cloudflare Turnstile and hCaptcha share one request/response shape
 * (`secret` + `response` form-encoded, `{ success, "error-codes" }` back), so a
 * single verifier covers both and the provider is a config value rather than a
 * rewrite — the same seam `emailService.ts` gives the email provider.
 *
 * **Configured-or-absent, never half-on.** The secret lives server-side; the
 * site key is public and ships in the client bundle. When no secret is set the
 * server skips verification entirely and the intake keeps working on the
 * honeypot + rate limits alone (this is how it ships — see AGENTS.md's
 * two-halves rule). Once the secret IS set, a missing or bad token is a hard
 * reject: a configured CAPTCHA that silently passes traffic is worse than none,
 * because the operator believes they are protected.
 */

export type CaptchaProvider = 'turnstile' | 'hcaptcha'

export const CAPTCHA_PROVIDERS: readonly CaptchaProvider[] = ['turnstile', 'hcaptcha'] as const

/** Provider siteverify endpoints — the only network dependency. */
export const CAPTCHA_VERIFY_ENDPOINTS: Record<CaptchaProvider, string> = {
  turnstile: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
  hcaptcha: 'https://api.hcaptcha.com/siteverify',
}

/** Client-side widget script, loaded only when a site key is configured. */
export const CAPTCHA_SCRIPT_URLS: Record<CaptchaProvider, string> = {
  turnstile: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
  hcaptcha: 'https://js.hcaptcha.com/1/api.js?render=explicit',
}

export type CaptchaFailure =
  /** The caller sent no token (bot, or the widget never solved). */
  | 'missing_token'
  /** The provider rejected the token — forged, expired, or wrong site key. */
  | 'invalid_token'
  /** Already redeemed, or past its validity window — a replay. */
  | 'duplicate_token'
  /** Our own secret is missing/wrong — an operator error, not a bot. */
  | 'bad_secret'
  /** Provider unreachable or returned something unparseable. */
  | 'provider_error'

export type CaptchaResult = { ok: true } | { ok: false; reason: CaptchaFailure }

/** Normalize an env value to a supported provider; unknown values fall back. */
export function resolveCaptchaProvider(value: string | undefined | null): CaptchaProvider {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return (CAPTCHA_PROVIDERS as readonly string[]).includes(normalized)
    ? (normalized as CaptchaProvider)
    : 'turnstile'
}

// ── Client configuration ─────────────────────────────────────────────────
// The site key is public by design and is compiled into the bundle; the secret
// half lives only in the edge function's environment. These sit here rather
// than beside the widget so the component file exports a component and nothing
// else (and so the predicate is testable without rendering).

export const CAPTCHA_SITE_KEY: string | undefined = import.meta.env.VITE_CAPTCHA_SITE_KEY as
  string | undefined

export const CAPTCHA_PROVIDER: CaptchaProvider = resolveCaptchaProvider(
  import.meta.env.VITE_CAPTCHA_PROVIDER as string | undefined,
)

/** Whether the client must obtain a token before the public form may submit. */
export function isCaptchaConfigured(siteKey: string | undefined = CAPTCHA_SITE_KEY): boolean {
  return typeof siteKey === 'string' && siteKey.trim() !== ''
}

/**
 * Map a siteverify payload onto our failure vocabulary. Split out from the
 * fetch so the mapping is testable without a network, and so both providers'
 * (identical) error-code sets are handled in one place.
 */
export function interpretSiteverify(payload: unknown): CaptchaResult {
  if (typeof payload !== 'object' || payload === null)
    return { ok: false, reason: 'provider_error' }
  const record = payload as { success?: unknown; 'error-codes'?: unknown }
  if (record.success === true) return { ok: true }

  const codes = Array.isArray(record['error-codes'])
    ? record['error-codes'].filter((c): c is string => typeof c === 'string')
    : []

  // Our own misconfiguration ranks above the caller's token: if the secret is
  // wrong, every token "fails", and reporting that as a bad token would send
  // the operator hunting for a bot that isn't there.
  if (codes.includes('missing-input-secret') || codes.includes('invalid-input-secret')) {
    return { ok: false, reason: 'bad_secret' }
  }
  if (codes.includes('missing-input-response')) return { ok: false, reason: 'missing_token' }
  if (codes.includes('timeout-or-duplicate')) return { ok: false, reason: 'duplicate_token' }
  if (codes.includes('invalid-input-response')) return { ok: false, reason: 'invalid_token' }
  if (codes.includes('bad-request') || codes.includes('internal-error')) {
    return { ok: false, reason: 'provider_error' }
  }
  // `success: false` with no recognised code still means "not verified".
  return { ok: false, reason: 'invalid_token' }
}

export interface VerifyCaptchaOptions {
  provider: CaptchaProvider
  /** Server-side secret. Callers decide what an absent secret means. */
  secret: string
  /** The widget's token from the client. */
  token: string
  /** Optional requester IP — providers use it as a corroborating signal. */
  remoteIp?: string | null
  /** Injected for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch
}

/**
 * Redeem a CAPTCHA token with the provider. A token is single-use: the provider
 * marks it redeemed, so `duplicate_token` on a retry is expected and the client
 * must reset the widget rather than resubmit the same token.
 */
export async function verifyCaptcha({
  provider,
  secret,
  token,
  remoteIp,
  fetchImpl = fetch,
}: VerifyCaptchaOptions): Promise<CaptchaResult> {
  if (!secret) return { ok: false, reason: 'bad_secret' }
  if (!token) return { ok: false, reason: 'missing_token' }

  const form = new URLSearchParams({ secret, response: token })
  // 'unknown' is what the intake records when no proxy header identifies the
  // caller; sending it as an IP would just make the provider reject the call.
  if (remoteIp && remoteIp !== 'unknown') form.set('remoteip', remoteIp)

  let payload: unknown
  try {
    const response = await fetchImpl(CAPTCHA_VERIFY_ENDPOINTS[provider], {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
    if (!response.ok) return { ok: false, reason: 'provider_error' }
    payload = await response.json()
  } catch {
    return { ok: false, reason: 'provider_error' }
  }
  return interpretSiteverify(payload)
}
