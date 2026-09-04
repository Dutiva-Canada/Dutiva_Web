-- Temporarily tighten the free beta cohort from 15 seats to 5.
--
-- Decision (founder, 2026-09-03): for now, only five free waitlist seats
-- auto-admit. Paid plans still skip the waitlist (0089). Signup stays open
-- as a waiting list past capacity.
--
-- Replaces the body of current_user_is_workspace_member() from
-- 0114_dutiva_staff_workspace_membership.sql. Staff domain, paid subscribers,
-- and admin_beta_access are unchanged.
--
-- Keep BETA_COHORT_LIMIT (5) in sync with src/config/beta.ts and the
-- create-beta-signup / beta-cohort-status edge functions;
-- src/canonicalFacts.test.ts fails the build if any copy drifts.
--
-- ROLLBACK:
--   -- restore body from 0114_dutiva_staff_workspace_membership.sql (limit 15)

create or replace function public.current_user_is_workspace_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(auth.jwt() ->> 'email', '') <> ''
    and (
      right(lower(coalesce(auth.jwt() ->> 'email', '')), 10) = '@dutiva.ca'
      or lower(auth.jwt() ->> 'email') in (
        select lower(email)
        from public.beta_signups
        where status not in ('declined', 'bounced')
        order by created_at asc nulls first, id asc
        limit 5
      )
      or exists (
        select 1 from public.admin_beta_access
        where lower(user_email) = lower(auth.jwt() ->> 'email')
          and status in ('invited', 'active')
      )
      or exists (
        select 1 from public.profiles
        where id = auth.uid()
          and plan in ('starter', 'growth', 'pro')
          and subscription_status in ('active', 'trialing')
      )
    )
$$;

revoke all on function public.current_user_is_workspace_member() from public, anon;
grant execute on function public.current_user_is_workspace_member() to authenticated;
