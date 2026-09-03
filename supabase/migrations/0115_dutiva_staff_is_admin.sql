-- Platform is_admin(uuid) admits @dutiva.ca (support RLS + edge gates).
--
-- Support ticket policies and support-agent-action call is_admin(uuid), which
-- only checked public.user_roles. Staff on the domain need the same access
-- as is_admin_user (0112) without requiring a user_roles row.
--
-- ROLLBACK:
--   -- restore is_admin(uuid) body from schema dump / pre-0115

create or replace function public.is_admin(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = check_user_id
      and ur.role in ('owner','admin')
  )
  or exists (
    select 1
    from auth.users u
    where u.id = check_user_id
      and right(lower(u.email), 10) = '@dutiva.ca'
  );
$$;
