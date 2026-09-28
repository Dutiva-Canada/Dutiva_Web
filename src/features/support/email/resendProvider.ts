import type { EmailMessage, EmailProvider } from './emailService'

/**
 * Resend adapter for the support `EmailProvider` seam. Pure and injectable so
 * the request contract is unit-tested here — the `support-notify` edge function
 * (Deno) mirrors this exact request shape when it drains the outbox, so keep the
 * two in sync (the same convention as `suggestPriority`).
 *
 * The API key and verified sender come from server-side env
 * (`SUPPORT_EMAIL_PROVIDER_API_KEY`, `SUPPORT_EMAIL_FROM`) — never the browser
 * bundle. This module is a library adapter with no top-level side effects; it is
 * not imported by client code and tree-shakes out of the app bundle.
 */

interface ResendConfig {
  apiKey: string
  /** Verified sender, e.g. `Dutiva Support <support@dutiva.ca>`. */
  from: string
  /** Injected in tests; defaults to the global `fetch`. */
  fetchImpl?: typeof fetch
  /** Endpoint override (tests). */
  endpoint?: string
}

export const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export function createResendProvider(config: ResendConfig): EmailProvider {
  const { apiKey, from, fetchImpl = fetch, endpoint = RESEND_ENDPOINT } = config
  return {
    async send(message: EmailMessage): Promise<void> {
      const res = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: message.to,
          subject: message.subject,
          text: message.text,
        }),
      })
      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        throw new Error(`Resend send failed (${res.status}): ${detail.slice(0, 300)}`)
      }
    },
  }
}
