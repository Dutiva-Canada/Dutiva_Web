-- 0168_org_invites_claim_and_directory.sql
-- Employer portal plumbing. organization_invitations predates the numbered
-- migrations (baseline schema; role check extended in 0125) but nothing ever
-- consumed it: no claim path, no member directory, and the workspace mode
-- gate was platform-admin-only so a real employer could never reach
-- production. This migration adds:
--
--   1. claim_org_invitations() — SECURITY DEFINER RPC the client calls once
--      per session before resolving membership: converts the caller's
--      pending, unexpired invitations into active organization_members rows.
--   2. org_member_directory(uuid) — org-admin-only member list including
--      email + display name. organization_members stores only user_id; emails
--      live in auth.users / profiles.account_email, so a SECURITY DEFINER
--      function is the narrow way to expose them to admins only.
--   3. RLS policies on organization_invitations so org admins (owner/admin
--      per is_org_admin) can manage their org's invites. Invitees never read
--      the table directly — claiming goes through the function above.
--   4. current_user_is_workspace_member() admits active org members and
--      pending invitees. Without this the /app gate (RequireAdminSession →
--      `authorized`) bounces every non-staff employer: a fresh
--      create_organization caller signs in unauthorized, and a pending
--      invitee's membership only exists after claim_org_invitations() runs —
--      which never happens if the shell never mounts. This is admission to
--      the shell only; every production table stays RLS-gated on
--      organization_membership.

-- ── 1. claim_org_invitations() ────────────────────────────────────────────
create or replace function public.claim_org_invitations()
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_count integer := 0;
begin
  if v_uid is null then
    return 0;
  end if;

  select lower(email) into v_email from auth.users where id = v_uid;
  if v_email is null then
    return 0;
  end if;

  /* Pending + unexpired invites addressed to the caller's verified email
     become active memberships (skipped when a membership already exists).
     Email identity is the proof: only the mailbox owner can complete the
     passwordless code sign-in, so address-matching is sufficient. */
  with due as (
    select id, organization_id, role
    from public.organization_invitations
    where status = 'pending'
      and expires_at > now()
      and lower(email) = v_email
  ), inserted as (
    insert into public.organization_members (organization_id, user_id, role, status)
    select d.organization_id, v_uid, d.role, 'active'
    from due d
    where not exists (
      select 1
      from public.organization_members om
      where om.organization_id = d.organization_id
        and om.user_id = v_uid
    )
    returning organization_id
  )
  select count(*) into v_count from inserted;

  update public.organization_invitations
  set status = 'accepted',
      accepted_at = now()
  where status = 'pending'
    and expires_at > now()
    and lower(email) = v_email;

  return v_count;
end;
$$;

revoke all on function public.claim_org_invitations() from public;
grant execute on function public.claim_org_invitations() to authenticated;

-- ── 2. org_member_directory(uuid) ─────────────────────────────────────────
create or replace function public.org_member_directory(p_org uuid)
returns table (
  member_id uuid,
  user_id uuid,
  email text,
  display_name text,
  role text,
  status text,
  granted_modules text[],
  access_expires_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    om.id,
    om.user_id,
    coalesce(nullif(p.account_email, ''), u.email::text) as email,
    coalesce(
      nullif(p.primary_contact, ''),
      nullif(u.raw_user_meta_data ->> 'full_name', ''),
      u.email::text
    ) as display_name,
    om.role,
    om.status,
    om.granted_modules,
    om.access_expires_at,
    om.created_at
  from public.organization_members om
  left join public.profiles p on p.id = om.user_id
  left join auth.users u on u.id = om.user_id
  where om.organization_id = p_org
    and public.is_org_admin(p_org, (select auth.uid()));
$$;

revoke all on function public.org_member_directory(uuid) from public;
grant execute on function public.org_member_directory(uuid) to authenticated;

-- ── 3. Invitation management policies ─────────────────────────────────────
alter table public.organization_invitations enable row level security;

drop policy if exists "Org admins can view invitations" on public.organization_invitations;
drop policy if exists "Org admins can create invitations" on public.organization_invitations;
drop policy if exists "Org admins can update invitations" on public.organization_invitations;
drop policy if exists "Org admins can delete invitations" on public.organization_invitations;

create policy "Org admins can view invitations"
  on public.organization_invitations
  for select
  to authenticated
  using (public.is_org_admin(organization_id, (select auth.uid())));

create policy "Org admins can create invitations"
  on public.organization_invitations
  for insert
  to authenticated
  with check (public.is_org_admin(organization_id, (select auth.uid())));

create policy "Org admins can update invitations"
  on public.organization_invitations
  for update
  to authenticated
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));

create policy "Org admins can delete invitations"
  on public.organization_invitations
  for delete
  to authenticated
  using (public.is_org_admin(organization_id, (select auth.uid())));

-- ── 4. Org members + pending invitees are workspace members ───────────────
-- Body from 0116 (staff domain, first-5 beta cohort, admin_beta_access, paid
-- plans) plus the two employer clauses. Ordering note: the invitee clause
-- uses the JWT email claim, same as the staff/beta checks — the invite is
-- addressed to a mailbox, and only the mailbox owner can produce a session
-- for it.
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
      /* Employer cohort: anyone holding an active organization_members row
         (create_organization is self-serve but capacity-gated) or a pending,
         unexpired invitation addressed to their email — the invite claim runs
         inside the workspace, so the gate has to let them reach it. */
      or exists (
        select 1 from public.organization_members
        where user_id = auth.uid()
          and status = 'active'
      )
      or exists (
        select 1 from public.organization_invitations
        where lower(email) = lower(auth.jwt() ->> 'email')
          and status = 'pending'
          and expires_at > now()
      )
    )
$$;

revoke all on function public.current_user_is_workspace_member() from public, anon;
grant execute on function public.current_user_is_workspace_member() to authenticated;
