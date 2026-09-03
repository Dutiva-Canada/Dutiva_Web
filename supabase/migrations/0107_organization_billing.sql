-- Organization-scoped billing (schema only — does not enable PLAN_FEATURE_GATES).
--
-- Moves the commercial source of truth from profiles toward organizations while
-- keeping profile dual-write for backward compatibility with
-- 0089_paid_subscribers_are_workspace_members.sql (workspace membership still
-- reads profiles until a later cutover). Stripe webhooks will call
-- apply_organization_billing(); clients cannot elevate org billing columns
-- (same pin pattern as 0024_reconcile_billing_schema.sql for profiles).
--
-- Plan vocabulary on organizations is narrowed to the sold tiers
-- (free|starter|growth|pro). Legacy advanced → growth, enterprise → pro.
--
-- ROLLBACK:
--   drop trigger if exists organizations_pin_billing_columns on public.organizations;
--   drop function if exists public.pin_organization_billing_columns();
--   drop function if exists public.apply_organization_billing(
--     uuid, text, text, text, text, text, uuid);
--   drop function if exists public.backfill_organization_billing_from_profiles();
--   drop function if exists public.resolve_user_billing_organization(uuid);
--   drop table if exists public.organization_billing_events cascade;
--   alter table public.organizations
--     drop column if exists stripe_customer_id,
--     drop column if exists stripe_subscription_id,
--     drop column if exists billing_owner_user_id,
--     drop column if exists advisor_overage_opt_in,
--     drop column if exists free_access_starts_at,
--     drop column if exists free_access_ends_at;
--   -- restore organizations_plan_check to free|growth|advanced|enterprise
--   -- and organization_members_status_check without suspended_plan_limit
--   -- (re-apply prior constraint bodies from schema snapshot if needed).

-- ── 1. Plan check: migrate legacy values, then narrow ───────────────────────
update public.organizations
set plan = 'growth'
where plan = 'advanced';

update public.organizations
set plan = 'pro'
where plan = 'enterprise';

alter table public.organizations drop constraint if exists organizations_plan_check;
alter table public.organizations add constraint organizations_plan_check
  check (plan in ('free', 'starter', 'growth', 'pro'));

-- ── 2. Billing columns on organizations ─────────────────────────────────────
alter table public.organizations
  add column if not exists stripe_customer_id text;

alter table public.organizations
  add column if not exists stripe_subscription_id text;

alter table public.organizations
  add column if not exists billing_owner_user_id uuid references auth.users (id) on delete set null;

alter table public.organizations
  add column if not exists advisor_overage_opt_in boolean not null default false;

alter table public.organizations
  add column if not exists free_access_starts_at timestamptz;

alter table public.organizations
  add column if not exists free_access_ends_at timestamptz;

create index if not exists organizations_stripe_customer_id_idx
  on public.organizations (stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists organizations_billing_owner_user_id_idx
  on public.organizations (billing_owner_user_id)
  where billing_owner_user_id is not null;

-- ── 3. Membership status: plan-limit suspension (reversible, no deletes) ────
alter table public.organization_members
  drop constraint if exists organization_members_status_check;
alter table public.organization_members
  add constraint organization_members_status_check
  check (status in (
    'active', 'invited', 'suspended', 'suspended_plan_limit', 'removed'
  ));

-- ── 4. Audit ledger (service role only) ─────────────────────────────────────
create table if not exists public.organization_billing_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists organization_billing_events_org_created_idx
  on public.organization_billing_events (organization_id, created_at desc);

alter table public.organization_billing_events enable row level security;

create policy "Deny client API access"
  on public.organization_billing_events
  for all
  to anon, authenticated
  using (false)
  with check (false);

revoke all on table public.organization_billing_events from anon, authenticated;
grant all on table public.organization_billing_events to service_role;

-- ── 5. Pin billing columns for client writers ───────────────────────────────
-- Org admins may update name/jurisdiction/etc. via existing UPDATE policy;
-- silently revert billing fields for authenticated/anon the same way profiles
-- do. service_role / postgres / direct SQL are unaffected.
create or replace function public.pin_organization_billing_columns()
returns trigger
language plpgsql
set search_path = pg_catalog, public
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
  new.billing_owner_user_id := old.billing_owner_user_id;
  new.advisor_overage_opt_in := old.advisor_overage_opt_in;
  new.free_access_starts_at := old.free_access_starts_at;
  new.free_access_ends_at := old.free_access_ends_at;
  return new;
end;
$$;

revoke execute on function public.pin_organization_billing_columns()
  from public, anon, authenticated;

drop trigger if exists organizations_pin_billing_columns on public.organizations;
create trigger organizations_pin_billing_columns
  before update on public.organizations
  for each row
  execute function public.pin_organization_billing_columns();

-- ── 6. Server-side apply (org + optional profile mirror) ────────────────────
create or replace function public.apply_organization_billing(
  p_organization_id uuid,
  p_plan text,
  p_subscription_status text,
  p_billing_period text,
  p_stripe_customer_id text default null,
  p_stripe_subscription_id text default null,
  p_billing_owner_user_id uuid default null
)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org public.organizations;
  v_owner uuid;
begin
  -- service_role / postgres / direct SQL only (same posture as pin triggers).
  if coalesce(auth.role(), '') in ('authenticated', 'anon') then
    raise exception 'not authorized'
      using errcode = '42501';
  end if;

  if p_organization_id is null then
    raise exception 'organization_id required'
      using errcode = '22023';
  end if;

  if p_plan is null or p_plan not in ('free', 'starter', 'growth', 'pro') then
    raise exception 'invalid plan'
      using errcode = '22023';
  end if;

  if p_subscription_status is null
     or p_subscription_status not in (
       'active', 'inactive', 'past_due', 'canceled', 'trialing'
     )
  then
    raise exception 'invalid subscription_status'
      using errcode = '22023';
  end if;

  if p_billing_period is null
     or p_billing_period not in ('monthly', 'annual')
  then
    raise exception 'invalid billing_period'
      using errcode = '22023';
  end if;

  update public.organizations
  set
    plan = p_plan,
    subscription_status = p_subscription_status,
    billing_period = p_billing_period,
    stripe_customer_id = coalesce(p_stripe_customer_id, stripe_customer_id),
    stripe_subscription_id = coalesce(p_stripe_subscription_id, stripe_subscription_id),
    billing_owner_user_id = coalesce(p_billing_owner_user_id, billing_owner_user_id),
    updated_at = timezone('utc', now())
  where id = p_organization_id
  returning * into v_org;

  if v_org.id is null then
    raise exception 'organization not found'
      using errcode = 'P0002';
  end if;

  v_owner := coalesce(p_billing_owner_user_id, v_org.billing_owner_user_id);

  -- Dual-write for 0089 workspace-membership checks (profiles remain the
  -- gate until a later cutover). Only when we know the billing owner.
  if v_owner is not null then
    insert into public.profiles (
      id,
      plan,
      subscription_status,
      billing_period,
      stripe_customer_id,
      stripe_subscription_id
    )
    values (
      v_owner,
      p_plan,
      p_subscription_status,
      p_billing_period,
      coalesce(p_stripe_customer_id, v_org.stripe_customer_id),
      coalesce(p_stripe_subscription_id, v_org.stripe_subscription_id)
    )
    on conflict (id) do update
    set
      plan = excluded.plan,
      subscription_status = excluded.subscription_status,
      billing_period = excluded.billing_period,
      stripe_customer_id = coalesce(
        excluded.stripe_customer_id,
        public.profiles.stripe_customer_id
      ),
      stripe_subscription_id = coalesce(
        excluded.stripe_subscription_id,
        public.profiles.stripe_subscription_id
      );
  end if;

  insert into public.organization_billing_events (
    organization_id, event_type, payload
  )
  values (
    p_organization_id,
    'apply_organization_billing',
    jsonb_build_object(
      'plan', p_plan,
      'subscription_status', p_subscription_status,
      'billing_period', p_billing_period,
      'stripe_customer_id', coalesce(p_stripe_customer_id, v_org.stripe_customer_id),
      'stripe_subscription_id', coalesce(p_stripe_subscription_id, v_org.stripe_subscription_id),
      'billing_owner_user_id', v_owner
    )
  );

  return v_org;
end;
$$;

revoke all on function public.apply_organization_billing(
  uuid, text, text, text, text, text, uuid
) from public, anon, authenticated;
grant execute on function public.apply_organization_billing(
  uuid, text, text, text, text, text, uuid
) to service_role;

-- ── 7. Backfill from existing paid profiles ─────────────────────────────────
create or replace function public.backfill_organization_billing_from_profiles()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_org_id uuid;
  v_count integer := 0;
begin
  if coalesce(auth.role(), '') in ('authenticated', 'anon') then
    raise exception 'not authorized'
      using errcode = '42501';
  end if;

  for r in
    select
      p.id as user_id,
      p.plan,
      p.subscription_status,
      p.billing_period,
      p.stripe_customer_id,
      p.stripe_subscription_id
    from public.profiles p
    where p.plan in ('starter', 'growth', 'pro')
      and p.subscription_status in ('active', 'trialing')
  loop
    -- Prefer an org the user owns; else an org they admin.
    select om.organization_id
    into v_org_id
    from public.organization_members om
    where om.user_id = r.user_id
      and om.status = 'active'
      and om.role in ('owner', 'admin')
    order by
      case when om.role = 'owner' then 0 else 1 end,
      om.created_at asc
    limit 1;

    if v_org_id is null then
      continue;
    end if;

    -- Idempotent: skip when org already mirrors this subscription.
    if exists (
      select 1
      from public.organizations o
      where o.id = v_org_id
        and o.plan = r.plan
        and o.subscription_status = r.subscription_status
        and o.billing_period = r.billing_period
        and o.stripe_customer_id is not distinct from r.stripe_customer_id
        and o.stripe_subscription_id is not distinct from r.stripe_subscription_id
        and o.billing_owner_user_id is not distinct from r.user_id
    ) then
      continue;
    end if;

    perform public.apply_organization_billing(
      v_org_id,
      r.plan,
      r.subscription_status,
      coalesce(nullif(r.billing_period, ''), 'monthly'),
      r.stripe_customer_id,
      r.stripe_subscription_id,
      r.user_id
    );
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.backfill_organization_billing_from_profiles()
  from public, anon, authenticated;
grant execute on function public.backfill_organization_billing_from_profiles()
  to service_role;

-- ── 8. Resolve which org owns a user's billing context ──────────────────────
create or replace function public.resolve_user_billing_organization(p_user_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  if p_user_id is null then
    return null;
  end if;

  -- Prefer an owned org with a paid active/trialing subscription.
  select om.organization_id
  into v_org_id
  from public.organization_members om
  join public.organizations o on o.id = om.organization_id
  where om.user_id = p_user_id
    and om.status = 'active'
    and om.role = 'owner'
    and o.plan in ('starter', 'growth', 'pro')
    and o.subscription_status in ('active', 'trialing')
  order by o.updated_at desc nulls last, om.created_at asc
  limit 1;

  if v_org_id is not null then
    return v_org_id;
  end if;

  -- Else any active membership (prefer owner, then admin, then oldest).
  select om.organization_id
  into v_org_id
  from public.organization_members om
  where om.user_id = p_user_id
    and om.status = 'active'
  order by
    case om.role
      when 'owner' then 0
      when 'admin' then 1
      else 2
    end,
    om.created_at asc
  limit 1;

  return v_org_id;
end;
$$;

revoke all on function public.resolve_user_billing_organization(uuid)
  from public, anon;
grant execute on function public.resolve_user_billing_organization(uuid)
  to authenticated, service_role;

-- Members already SELECT organizations via "Members can view organizations".
-- Billing columns are visible on that SELECT; UPDATE of billing cols is pinned
-- above. No additional RLS change required for read access.
