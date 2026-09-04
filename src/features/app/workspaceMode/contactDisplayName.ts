/**
 * Person-facing display name for the workspace shell / Settings.
 * `profiles.primary_contact` is sometimes seeded with an email; never show that
 * as the bold name when a human-readable alternative exists.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function looksLikeEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}

/** `martin.constantineau` → `Martin Constantineau`; `martin_c` → `Martin C`. */
export function humanizeEmailLocalPart(localPart: string): string {
  const cleaned = localPart
    .trim()
    .replace(/\+/g, ' ')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
  if (!cleaned) return ''
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

export function resolveContactDisplayName(input: {
  readonly contactName?: string | null
  readonly email?: string | null
  readonly authFullName?: string | null
  readonly fallback?: string
}): string {
  const auth = input.authFullName?.trim()
  if (auth && !looksLikeEmail(auth)) return auth

  const contact = input.contactName?.trim()
  if (contact && !looksLikeEmail(contact)) return contact

  const email = input.email?.trim()
  if (email && looksLikeEmail(email)) {
    const local = email.slice(0, email.indexOf('@'))
    const fromEmail = humanizeEmailLocalPart(local)
    if (fromEmail) return fromEmail
  }

  if (contact && looksLikeEmail(contact)) {
    const local = contact.slice(0, contact.indexOf('@'))
    const fromContact = humanizeEmailLocalPart(local)
    if (fromContact) return fromContact
  }

  return input.fallback?.trim() || 'Account'
}
