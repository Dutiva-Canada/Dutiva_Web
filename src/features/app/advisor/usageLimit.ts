import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import {
  ADVISOR_MONTHLY_INCLUDED,
  ADVISOR_PACK_50_PRICE_CAD,
  ADVISOR_PACK_50_REPLIES,
  ADVISOR_PACK_200_PRICE_CAD,
  ADVISOR_PACK_200_REPLIES,
} from '@/config/advisorUsage'
import { advisorViewMessages as M } from '@/i18n/messages/advisorView'
import { AdvisorUsageLimitError } from './chatApi'

/**
 * Turns a beta usage-limit refusal into the sentence the Advisor says back.
 *
 * The wait is deliberately vague ("about 20 minutes", "about 2 hours"): the
 * server's Retry-After is exact to the second, but a countdown implies a
 * promise the rolling window doesn't make — the ceiling frees as individual
 * calls age out, so the useful information is the order of magnitude, not the
 * number. Rounding is always UP, so acting on what we say cannot land the user
 * on a second refusal.
 */

const MINUTE = 60
const HOUR = 60 * MINUTE

function fill(template: string, token: string, value: string): string {
  return template.replace(token, value)
}

function fillMany(template: string, vars: Record<string, string>): string {
  let out = template
  for (const [token, value] of Object.entries(vars)) {
    out = out.replaceAll(token, value)
  }
  return out
}

/** "a minute" / "20 minutes" / "an hour" / "3 hours", bilingual. */
export function usageWaitPhrase(seconds: number): Bi {
  const safe = Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : MINUTE
  /* Anything under 90s is "a minute" — "2 minutes" for 91 seconds is precision
     the window does not actually have. */
  if (safe <= 90) return bi(M.advisorview_usage_wait_minute.en, M.advisorview_usage_wait_minute.fr)
  if (safe < HOUR) {
    const minutes = String(Math.ceil(safe / MINUTE))
    return bi(
      fill(M.advisorview_usage_wait_minutes.en, '{count}', minutes),
      fill(M.advisorview_usage_wait_minutes.fr, '{count}', minutes),
    )
  }
  if (safe <= 90 * MINUTE)
    return bi(M.advisorview_usage_wait_hour.en, M.advisorview_usage_wait_hour.fr)
  /* The longest ceiling is the rolling 24h budget, so the wait cannot exceed a
     day; clamp rather than ever saying "25 hours". */
  const hours = String(Math.min(24, Math.ceil(safe / HOUR)))
  return bi(
    fill(M.advisorview_usage_wait_hours.en, '{count}', hours),
    fill(M.advisorview_usage_wait_hours.fr, '{count}', hours),
  )
}

/**
 * The full bilingual reply. A platform-wide ceiling gets its own wording — the
 * user did nothing to hit it, and telling them they used too much would be
 * false.
 */
export function usageLimitReply(error: AdvisorUsageLimitError): Bi {
  if (error.scope === 'commercial') {
    const vars = {
      '{included}': String(ADVISOR_MONTHLY_INCLUDED),
      '{pack50}': String(ADVISOR_PACK_50_REPLIES),
      '{price50}': String(ADVISOR_PACK_50_PRICE_CAD),
      '{pack200}': String(ADVISOR_PACK_200_REPLIES),
      '{price200}': String(ADVISOR_PACK_200_PRICE_CAD),
    }
    return bi(
      fillMany(M.advisorview_usage_limit_commercial.en, vars),
      fillMany(M.advisorview_usage_limit_commercial.fr, vars),
    )
  }
  const wait = usageWaitPhrase(error.retryAfterSeconds)
  const template =
    error.scope === 'platform_daily'
      ? M.advisorview_usage_limit_platform
      : M.advisorview_usage_limit_personal
  return bi(fill(template.en, '{wait}', wait.en), fill(template.fr, '{wait}', wait.fr))
}
