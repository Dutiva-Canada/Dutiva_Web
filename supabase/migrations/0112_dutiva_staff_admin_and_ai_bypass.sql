-- @dutiva.ca staff: platform admin via domain check.
--
-- Paywall unlock already lives in app/edge adminAccess (bypassesPaywall).
-- This migration aligns is_admin_user / is_internal_admin_user for the whole
-- @dutiva.ca domain, and adds user_is_dutiva_staff for service-role callers
-- (empty JWT) such as claim_ai_usage — see 0113.
--
-- ROLLBACK:
--   -- restore is_admin_user / is_internal_admin_user from schema dump
--   drop function if exists public.user_is_dutiva_staff(uuid);

-- ── 1. Staff email helper (service-role claim has empty JWT) ────────────────
create or replace function public.user_is_dutiva_staff(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from auth.users u
     where u.id = p_user_id
       and right(lower(u.email), 10) = '@dutiva.ca'
  );
$$;

revoke all on function public.user_is_dutiva_staff(uuid) from public;
grant execute on function public.user_is_dutiva_staff(uuid) to service_role;

-- ── 2. Platform admin includes @dutiva.ca ───────────────────────────────────
create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    or coalesce((auth.jwt() ->> 'role') = 'admin', false)
    or exists (
      select 1 from public.admin_users au
      where au.user_id = auth.uid()
        and au.revoked_at is null
        and (au.expires_at is null or au.expires_at > now())
    )
    or right(lower(coalesce(auth.jwt() ->> 'email', '')), 10) = '@dutiva.ca'
    or exists (
      select 1 from auth.users u
      where u.id = auth.uid()
        and right(lower(u.email), 10) = '@dutiva.ca'
    );
$$;

-- Prefer suffix match over like '%@dutiva.ca' (same intent, clearer).
create or replace function public.is_internal_admin_user()
returns boolean
language sql
stable
set search_path = public
as $$
  select right(lower(coalesce(auth.jwt() ->> 'email', '')), 10) = '@dutiva.ca';
$$;
