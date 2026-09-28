import type { RenderedEmail } from './templates'

/**
 * Transactional email abstraction. No provider is wired yet — a concrete
 * adapter (Resend, Postmark, SES, …) implements `EmailProvider` and is
 * constructed server-side from a secret env var (SUPPORT_EMAIL_PROVIDER_API_KEY);
 * see docs/SUPPORT_ARCHITECTURE.md. With no provider, delivery is a logged
 * no-op so a missing provider never throws.
 */

export interface EmailMessage extends RenderedEmail {
  to: string
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>
}

interface DeliveryResult {
  delivered: boolean
}

export async function deliverSupportEmail(
  provider: EmailProvider | null,
  message: EmailMessage,
): Promise<DeliveryResult> {
  if (!provider) {
    // Subject is safe to log (no PII by design); body/recipient are not logged.
    console.info('[support-email] no provider configured; not sent:', message.subject)
    return { delivered: false }
  }
  await provider.send(message)
  return { delivered: true }
}
