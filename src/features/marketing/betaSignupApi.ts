import { supabase } from '@/lib/supabaseClient'

/**
 * Client for the `create-beta-signup` edge function — the unauthenticated
 * waiting-list intake behind the landing page's `#start` form. Sibling of
 * `features/support/publicSupportApi.ts`, and deliberately shaped the same
 * way: the server re-validates everything, rate-limits by hashed IP/email,
 * and answers a repeat address exactly like a new one, so this only shapes
 * the payload.
 *
 * `honeypot` maps to the server's hidden `contact_fax` trap; real users
 * leave it empty.
 */

type BetaSignupErrorCode = 'rate_limited' | 'validation' | 'captcha' | 'error'

export class BetaSignupError extends Error {
  constructor(public readonly code: BetaSignupErrorCode) {
    super(code)
    this.name = 'BetaSignupError'
  }
}

/** The jurisdictions the server accepts; anything else is stored as `other`. */
export type BetaProvince = 'on' | 'qc' | 'fed' | 'other'

interface BetaSignupInput {
  email: string
  company?: string
  /** Omitted when the visitor leaves the (optional) jurisdiction select blank. */
  province?: BetaProvince | ''
  language: 'en' | 'fr'
  /** CASL express consent — the server rejects the submission without it. */
  consent: boolean
  /** Honeypot — always empty for real users. */
  honeypot?: string
  /** CAPTCHA token, when the widget is configured; the server verifies it
   *  only once CAPTCHA_SECRET_KEY is set, mirroring the support intake. */
  captchaToken?: string | null
}

interface BetaSignupResult {
  /**
   * True when the first beta cohort (BETA_COHORT_LIMIT signups) was already
   * full before this submission, so this signup joined the waiting list
   * rather than gaining workspace access. Aggregate state only — the server
   * computes it identically for new and repeat addresses, so it can't be
   * read as "was this address already signed up".
   */
  waitlisted: boolean
}

/** Success body of `create-beta-signup` (inside supabase-js's own `data`). */
interface BetaSignupResponse {
  data?: { ok?: boolean; cohort_full?: boolean }
}

function errorCodeFromStatus(status: number | undefined): BetaSignupErrorCode {
  if (status === 429) return 'rate_limited'
  if (status === 400 || status === 422) return 'validation'
  /* 403 is the CAPTCHA rejection (create-beta-signup), so the form can tell
     the visitor to redo the check rather than showing a generic failure. */
  if (status === 403) return 'captcha'
  return 'error'
}

/**
 * Record a beta signup. Resolves on success — including for an address that
 * is already on the list, which the server reports as success on purpose so
 * the endpoint can't be used to test list membership.
 *
 * `waitlisted` defaults to false when the response carries no cohort bit
 * (an older deployed function), which reproduces the pre-cap behavior
 * rather than wrongly telling an admitted visitor they are waiting.
 */
export async function createBetaSignup(input: BetaSignupInput): Promise<BetaSignupResult> {
  if (!supabase) throw new BetaSignupError('error')

  const { data, error } = await supabase.functions.invoke<BetaSignupResponse>(
    'create-beta-signup',
    {
      body: {
        email: input.email,
        company: input.company?.trim() || undefined,
        province: input.province || undefined,
        language: input.language,
        source: 'landing',
        consent: input.consent,
        contact_fax: input.honeypot ?? '',
        captcha_token: input.captchaToken ?? '',
      },
    },
  )

  if (error) {
    const status = (error as { context?: { status?: number } }).context?.status
    throw new BetaSignupError(errorCodeFromStatus(status))
  }

  return { waitlisted: data?.data?.cohort_full === true }
}
