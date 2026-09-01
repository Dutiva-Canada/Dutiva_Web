/**
 * Beta program capacity — the source of truth for the "15" every other
 * surface states or enforces.
 *
 * Decision (founder, 2026-08-07): the beta can only accept 15
 * individuals/organizations to begin. Signup stays open past that — the
 * landing form keeps recording interest as a waiting list — but only the
 * first {@link BETA_COHORT_LIMIT} eligible signups are auto-admitted to the
 * workspace. Active paid subscribers (Starter/Growth/Pro with active or
 * trialing status) are also workspace members regardless of cohort position —
 * see migration `0089_paid_subscribers_are_workspace_members.sql`.
 *
 * Enforcement lives server-side in `current_user_is_workspace_member()`
 * (migration `0067_beta_cohort_capacity.sql`), the signup endpoint
 * (`supabase/functions/create-beta-signup`) reports whether the cohort is
 * full so the form can answer honestly, and `beta-cohort-status` exposes
 * the aggregate seat count for the landing counter. Those carry their own
 * copy of the number — SQL and Deno can't import this module — and
 * `src/canonicalFacts.test.ts` fails the build if any copy drifts from this
 * one, or from the `docs/CANONICAL_FACTS.md` row that records it.
 */
export const BETA_COHORT_LIMIT = 15
