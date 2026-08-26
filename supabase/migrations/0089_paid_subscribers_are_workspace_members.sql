-- Paid subscribers skip the 15-person free waitlist.
--
-- Quiet-beta model: the public path in is a paid plan. The first 15 eligible
-- beta_signups remain auto-admitted (the waitlist). Anyone with an active or
-- trialing Starter/Growth/Pro profile is also a workspace member, so checkout
-- can admit them after stripe-webhook writes the plan.
--
-- Replaces the body of current_user_is_workspace_member() from
-- 0067_beta_cohort_capacity.sql. Cohort ordering, declined/bounced exclusion,
-- admin_beta_access override, and the founder email remain unchanged.
--
-- Keep BETA_COHORT_LIMIT (15) in sync with src/config/beta.ts and the
-- create-beta-signup / beta-cohort-status edge functions;
-- src/canonicalFacts.test.ts fails the build if any copy drifts.

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
      lower(auth.jwt() ->> 'email') = 'martin.constantineau@dutiva.ca'
      or lower(auth.jwt() ->> 'email') in (
        select lower(email)
        from public.beta_signups
        where status not in ('declined', 'bounced')
        order by created_at asc nulls first, id asc
        limit 15
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
