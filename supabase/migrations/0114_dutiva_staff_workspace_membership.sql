-- Admit every @dutiva.ca staff account to the workspace (all views).
--
-- current_user_is_workspace_member previously hard-coded a single founder
-- email. Other staff were locked at /app/welcome even though paywall and
-- is_admin_user already treat the whole domain as internal (0112).
--
-- ROLLBACK:
--   -- restore body from 0089_paid_subscribers_are_workspace_members.sql

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
