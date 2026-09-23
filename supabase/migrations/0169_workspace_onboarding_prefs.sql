-- Server-side onboarding marks for the production setup path
-- (docs/EMPTY_WORKSPACE_ONBOARDING.md).
--
-- The empty-workspace setup path and its Keep-going card track three soft
-- marks per organization: guided-process visit, studio visit, and card
-- dismissal. v2 stored them in localStorage — which meant dismissing the
-- card on one device left it nagging on every other device, and a fresh
-- browser looked like day one.
--
-- This adds a per-user `onboarding` jsonb column keyed by organization id:
--
--   { "<orgId>": { "studioVisited": true, "workflowVisited": true,
--                  "setupCardDismissed": true } }
--
-- Per-user is the correct granularity: dismissal is a personal preference,
-- not an org setting, and the workspace_preferences row is already the
-- per-user preference slot (mode lives here).
--
-- The existing RLS policy is unchanged — it gates this table to platform
-- admins (`is_admin_user()`), matching the mode column's contract. Non-admin
-- org members keep the device-local fallback in emptyWorkspaceOnboarding.ts;
-- widening the policy to members is a separate access-policy decision.
--
-- Marks are monotonic (a visit or a dismissal never un-happens), so the
-- client merges with OR semantics and writes the union back — last writer
-- wins without losing marks.

alter table public.workspace_preferences
  add column if not exists onboarding jsonb not null default '{}'::jsonb;
