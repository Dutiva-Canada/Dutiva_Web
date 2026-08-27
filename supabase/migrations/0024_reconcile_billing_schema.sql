-- Reconciles the live billing schema with what this repo's Stripe functions
-- actually need. `0013_add_billing_profiles.sql` was written against a fresh
-- database and never applied to the live project (which already had its own
-- `public.profiles` from the predecessor repo — see docs/DATABASE_SCHEMA.md on
-- why migrations here are a curated subset). Its `create table if not exists`
-- is a no-op against that table, so the two things it was meant to guarantee
-- never landed. This migration lands them against the schema that exists.
--
-- Ledger: shares sequence 0024 with 0024_match_advisor_guidance_review_topic.sql
-- (both applied on live — do not renumber). See docs/MIGRATION_LEDGER.md.
--
-- Everything here is additive and idempotent: no column is dropped, no plan
-- value is removed, no existing row is rewritten.

-- ── 1. Webhook idempotency ──────────────────────────────────────────────────
-- `stripe-webhook` inserts each event id here and treats a unique violation as
-- "already processed" (Stripe retries on any non-2xx, and can redeliver even
-- after a success). Without the table the insert errors, the handler logs and
-- continues, and the dedup guard protects nothing.
--
-- No RLS policies are defined on purpose: RLS enabled with no policy denies
-- every role except the service-role key the webhook uses, which bypasses RLS.
create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  received_at timestamptz not null default timezone('utc', now())
);

alter table public.stripe_webhook_events enable row level security;

-- ── 2. Let the plan this site actually sells be stored ──────────────────────
-- `profiles_plan_check` was written for the predecessor's tiers and does not
-- permit 'pro', which is the $99 plan on /pricing (src/config/plans.ts). A Pro
-- checkout therefore cannot be provisioned: the UPDATE fails the constraint.
--
-- The legacy values stay allowed rather than being replaced. 'advanced' and
-- 'enterprise' are still in use (the one existing profile row is 'enterprise'),
-- so narrowing the set would fail this very migration and would rewrite live
-- data to make itself pass. Widening is the non-destructive half of the
-- reconciliation; retiring the legacy tiers is a product decision with its own
-- data migration.
alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles add constraint profiles_plan_check
  check (plan in ('free', 'starter', 'growth', 'pro', 'advanced', 'enterprise'));

-- ── 3. Keep billing columns server-authoritative ────────────────────────────
-- Production grants "Users can update their own profile" so the workspace can
-- save its own settings (company name, theme, language). That policy does not
-- distinguish columns, so a signed-in account can also set its own `plan` —
-- granting itself a paid tier without ever reaching Stripe. 0013 avoided this
-- by shipping no update policy at all; that isn't available here without
-- breaking the settings writes the policy exists for.
--
-- Instead, pin the billing columns for client writers. The Stripe functions
-- write with the service-role key, whose PostgREST role is `service_role`, and
-- are unaffected; so is direct SQL (no JWT, so no role claim). Silently
-- reverting rather than raising keeps unrelated settings updates working —
-- the client never intended to change these columns in the first place.
create or replace function public.pin_profile_billing_columns()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') not in ('authenticated', 'anon') then
    return new;
  end if;

  new.plan := old.plan;
  new.subscription_status := old.subscription_status;
  new.billing_period := old.billing_period;
  new.stripe_customer_id := old.stripe_customer_id;
  new.stripe_subscription_id := old.stripe_subscription_id;
  return new;
end;
$$;

revoke execute on function public.pin_profile_billing_columns() from public, anon, authenticated;

drop trigger if exists profiles_pin_billing_columns on public.profiles;
create trigger profiles_pin_billing_columns
  before update on public.profiles
  for each row
  execute function public.pin_profile_billing_columns();
