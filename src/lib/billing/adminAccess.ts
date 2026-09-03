/**
 * Internal `@dutiva.ca` staff entitlement — paywall bypass on the client, and
 * the same domain check the workspace admin gate uses. Mirrored in
 * `supabase/functions/_shared/adminAccess.ts` (Deno cannot import from src/).
 *
 * Distinct from workspace sign-in access (AuthContext's `authorized`, backed
 * by `current_user_is_workspace_member`): "is this staff / skip billing" vs
 * "may this account sign into the workspace". Postgres also treats
 * `@dutiva.ca` as platform admin (`is_admin_user`) and skips AI hard-caps
 * (`claim_ai_usage` / `user_is_dutiva_staff`) — see migration 0112.
 */
const ADMIN_EMAILS = ['martin.constantineau@dutiva.ca']

function normalizeEmail(email?: string | null): string {
  return String(email ?? '')
    .trim()
    .toLowerCase()
}

/** Explicitly listed internal accounts — always treated as fully entitled. */
export function isAdminEmail(email?: string | null): boolean {
  return ADMIN_EMAILS.includes(normalizeEmail(email))
}

/**
 * Any @dutiva.ca staff account. Prefer this over the explicit list when
 * checking "is this internal Dutiva staff" in new code — the explicit list
 * exists for the one account that must bypass billing even if the domain
 * check were ever narrowed.
 */
export function isInternalDutivaAccount(email?: string | null): boolean {
  return normalizeEmail(email).endsWith('@dutiva.ca')
}

/** True if this account should skip the paywall entirely. */
export function bypassesPaywall(email?: string | null): boolean {
  return isAdminEmail(email) || isInternalDutivaAccount(email)
}
