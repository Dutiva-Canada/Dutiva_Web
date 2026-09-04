/**
 * Internal-account billing bypass, shared by Stripe edge functions and any
 * other Deno path that needs the same staff check. Mirrors
 * src/lib/billing/adminAccess.ts — Deno cannot import from src/, so the two
 * copies must stay in sync by hand.
 */
const ADMIN_EMAILS = ['martin.constantineau@dutiva.ca']

function normalizeEmail(email: string | null | undefined): string {
  return String(email ?? '')
    .trim()
    .toLowerCase()
}

/** Explicitly listed internal accounts — always treated as fully entitled. */
export function isAdminEmail(email: string | null | undefined): boolean {
  return ADMIN_EMAILS.includes(normalizeEmail(email))
}

/** Any @dutiva.ca staff account. */
export function isInternalDutivaAccount(email: string | null | undefined): boolean {
  return normalizeEmail(email).endsWith('@dutiva.ca')
}

/** True if this account should skip the paywall entirely. */
export function bypassesPaywall(email: string | null | undefined): boolean {
  return isAdminEmail(email) || isInternalDutivaAccount(email)
}
