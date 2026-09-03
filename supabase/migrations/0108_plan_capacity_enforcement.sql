-- Plan capacity enforcement (schema only — does not enable PLAN_FEATURE_GATES).
--
-- Hard limits mirror src/config/planEntitlements.ts (workspaceUsers /
-- activeEmployees / activeCases / openTasks). -1 means unlimited.
-- Never deletes data on downgrade; excess members may move to
-- suspended_plan_limit (added in 0107).
--
-- Status vocabulary discovered in schema (do not invent values):
--   employees: active | on_leave | terminated  (no archived yet; excluded
--     defensively for forward-compat with planEntitlements copy)
--   hr_cases: open | in_review | resolved  (no closed/archived yet)
--   compliance_tasks: open | in_progress | blocked | completed | cancelled
--
-- ROLLBACK:
--   drop trigger if exists organization_members_assert_capacity
--     on public.organization_members;
--   drop trigger if exists employees_assert_capacity on public.employees;
--   drop trigger if exists hr_cases_assert_capacity on public.hr_cases;
--   drop trigger if exists compliance_tasks_assert_capacity
--     on public.compliance_tasks;
--   drop function if exists public.assert_org_member_capacity();
--   drop function if exists public.assert_active_employee_capacity();
--   drop function if exists public.assert_active_case_capacity();
--   drop function if exists public.assert_open_task_capacity();
--   drop function if exists public.suspend_excess_members_for_plan(uuid);
--   drop function if exists public.plan_limit(text, text);
--   drop function if exists public.organization_effective_plan(uuid);
--   drop function if exists public._org_capacity_lock(uuid);

-- ── 1. Advisory lock helper (transaction-scoped) ────────────────────────────
create or replace function public._org_capacity_lock(p_organization_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  if p_organization_id is null then
    return;
  end if;
  perform pg_advisory_xact_lock(
    hashtext('plan_cap:' || p_organization_id::text)
  );
end;
$$;

revoke all on function public._org_capacity_lock(uuid) from public, anon, authenticated;
grant execute on function public._org_capacity_lock(uuid) to service_role;

-- ── 2. Effective plan for limits ────────────────────────────────────────────
-- active/trialing → organizations.plan; inactive/canceled/past_due → free.
-- No SQL grace window yet (free_access_* is reserved for app-side windows).
-- @dutiva / admin bypass stays app-side (is_internal_admin_user exists but is
-- not consulted here).
create or replace function public.organization_effective_plan(p_organization_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_status text;
begin
  if p_organization_id is null then
    return 'free';
  end if;

  select o.plan, o.subscription_status
  into v_plan, v_status
  from public.organizations o
  where o.id = p_organization_id;

  if v_plan is null then
    return 'free';
  end if;

  if v_status in ('active', 'trialing') then
    if v_plan in ('free', 'starter', 'growth', 'pro') then
      return v_plan;
    end if;
    return 'free';
  end if;

  return 'free';
end;
$$;

revoke all on function public.organization_effective_plan(uuid) from public, anon;
grant execute on function public.organization_effective_plan(uuid)
  to authenticated, service_role;

-- ── 3. Hardcoded plan limits (-1 = unlimited) ───────────────────────────────
create or replace function public.plan_limit(p_plan text, p_limit_key text)
returns integer
language plpgsql
immutable
set search_path = public
as $$
declare
  v_plan text := coalesce(p_plan, 'free');
begin
  if v_plan not in ('free', 'starter', 'growth', 'pro') then
    v_plan := 'free';
  end if;

  case p_limit_key
    when 'users' then
      return case v_plan
        when 'free' then 1
        when 'starter' then 2
        when 'growth' then 5
        when 'pro' then 10
      end;
    when 'employees' then
      return case v_plan
        when 'free' then 5
        when 'starter' then 10
        when 'growth' then 50
        when 'pro' then 100
      end;
    when 'cases' then
      return case v_plan
        when 'free' then 3
        else -1
      end;
    when 'tasks' then
      return case v_plan
        when 'free' then 10
        else -1
      end;
    else
      raise exception 'unknown limit_key: %', p_limit_key
        using errcode = '22023';
  end case;
end;
$$;

revoke all on function public.plan_limit(text, text) from public, anon;
grant execute on function public.plan_limit(text, text)
  to authenticated, service_role;

-- ── 4. Member capacity ──────────────────────────────────────────────────────
create or replace function public.assert_org_member_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_limit integer;
  v_count integer;
  v_org_id uuid;
begin
  -- Downgrade / removal paths never block.
  if tg_op = 'UPDATE'
     and new.status in ('suspended', 'suspended_plan_limit', 'removed', 'invited')
  then
    return new;
  end if;

  -- Only gate transitions into active (or inserts that are already active).
  if new.status is distinct from 'active' then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and old.status is not distinct from 'active'
  then
    return new;
  end if;

  v_org_id := new.organization_id;
  perform public._org_capacity_lock(v_org_id);

  v_plan := public.organization_effective_plan(v_org_id);
  v_limit := public.plan_limit(v_plan, 'users');
  if v_limit < 0 then
    return new;
  end if;

  select count(*)::integer
  into v_count
  from public.organization_members om
  where om.organization_id = v_org_id
    and om.status = 'active'
    and (tg_op = 'INSERT' or om.id is distinct from new.id);

  if v_count >= v_limit then
    raise exception 'plan_limit:workspace_users'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists organization_members_assert_capacity
  on public.organization_members;
create trigger organization_members_assert_capacity
  before insert or update of status on public.organization_members
  for each row
  execute function public.assert_org_member_capacity();

-- ── 5. Employee capacity ────────────────────────────────────────────────────
create or replace function public.assert_active_employee_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_limit integer;
  v_count integer;
  v_org_id uuid;
  v_new_counts boolean;
  v_old_counts boolean;
begin
  -- Count everything except terminated/archived (archived not in CHECK yet).
  v_new_counts := new.status not in ('terminated', 'archived');

  if not v_new_counts then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    v_old_counts := old.status not in ('terminated', 'archived');
    if v_old_counts then
      return new;
    end if;
  end if;

  v_org_id := new.organization_id;
  perform public._org_capacity_lock(v_org_id);

  v_plan := public.organization_effective_plan(v_org_id);
  v_limit := public.plan_limit(v_plan, 'employees');
  if v_limit < 0 then
    return new;
  end if;

  select count(*)::integer
  into v_count
  from public.employees e
  where e.organization_id = v_org_id
    and e.status not in ('terminated', 'archived')
    and (tg_op = 'INSERT' or e.id is distinct from new.id);

  if v_count >= v_limit then
    raise exception 'plan_limit:active_employees'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists employees_assert_capacity on public.employees;
create trigger employees_assert_capacity
  before insert or update of status on public.employees
  for each row
  execute function public.assert_active_employee_capacity();

-- ── 6. Case capacity (finite on free only) ──────────────────────────────────
create or replace function public.assert_active_case_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_limit integer;
  v_count integer;
  v_org_id uuid;
  v_counts boolean;
begin
  -- Active case = not resolved/closed/archived (schema today: open|in_review|resolved).
  v_counts := new.status not in ('resolved', 'closed', 'archived');

  if not v_counts then
    return new;
  end if;

  -- Insert-only gate per product requirement (reopening is rare / paid).
  if tg_op <> 'INSERT' then
    return new;
  end if;

  v_org_id := new.organization_id;
  perform public._org_capacity_lock(v_org_id);

  v_plan := public.organization_effective_plan(v_org_id);
  v_limit := public.plan_limit(v_plan, 'cases');
  if v_limit < 0 then
    return new;
  end if;

  select count(*)::integer
  into v_count
  from public.hr_cases c
  where c.organization_id = v_org_id
    and c.status not in ('resolved', 'closed', 'archived');

  if v_count >= v_limit then
    raise exception 'plan_limit:active_cases'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists hr_cases_assert_capacity on public.hr_cases;
create trigger hr_cases_assert_capacity
  before insert on public.hr_cases
  for each row
  execute function public.assert_active_case_capacity();

-- ── 7. Open task capacity (finite on free only) ─────────────────────────────
-- Table is compliance_tasks (not "tasks"). Open = not completed/cancelled.
create or replace function public.assert_open_task_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_limit integer;
  v_count integer;
  v_org_id uuid;
begin
  if new.status in ('completed', 'cancelled') then
    return new;
  end if;

  if tg_op <> 'INSERT' then
    return new;
  end if;

  v_org_id := new.organization_id;
  perform public._org_capacity_lock(v_org_id);

  v_plan := public.organization_effective_plan(v_org_id);
  v_limit := public.plan_limit(v_plan, 'tasks');
  if v_limit < 0 then
    return new;
  end if;

  select count(*)::integer
  into v_count
  from public.compliance_tasks t
  where t.organization_id = v_org_id
    and t.status not in ('completed', 'cancelled');

  if v_count >= v_limit then
    raise exception 'plan_limit:open_tasks'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists compliance_tasks_assert_capacity
  on public.compliance_tasks;
create trigger compliance_tasks_assert_capacity
  before insert on public.compliance_tasks
  for each row
  execute function public.assert_open_task_capacity();

-- ── 8. Suspend excess members on downgrade (reversible) ─────────────────────
create or replace function public.suspend_excess_members_for_plan(
  p_organization_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_limit integer;
  v_active integer;
  v_to_suspend integer;
  v_suspended integer := 0;
begin
  if coalesce(auth.role(), '') in ('authenticated', 'anon') then
    raise exception 'not authorized'
      using errcode = '42501';
  end if;

  if p_organization_id is null then
    return 0;
  end if;

  perform public._org_capacity_lock(p_organization_id);

  v_plan := public.organization_effective_plan(p_organization_id);
  v_limit := public.plan_limit(v_plan, 'users');
  if v_limit < 0 then
    return 0;
  end if;

  select count(*)::integer
  into v_active
  from public.organization_members om
  where om.organization_id = p_organization_id
    and om.status = 'active';

  if v_active <= v_limit then
    return 0;
  end if;

  v_to_suspend := v_active - v_limit;

  -- Newest non-owners first; owners are never suspended.
  with ranked as (
    select om.id
    from public.organization_members om
    where om.organization_id = p_organization_id
      and om.status = 'active'
      and om.role is distinct from 'owner'
    order by om.created_at desc nulls last, om.id desc
    limit v_to_suspend
  )
  update public.organization_members om
  set
    status = 'suspended_plan_limit',
    updated_at = timezone('utc', now())
  from ranked
  where om.id = ranked.id;

  get diagnostics v_suspended = row_count;
  return coalesce(v_suspended, 0);
end;
$$;

revoke all on function public.suspend_excess_members_for_plan(uuid)
  from public, anon, authenticated;
grant execute on function public.suspend_excess_members_for_plan(uuid)
  to service_role;

revoke all on function public.assert_org_member_capacity()
  from public, anon, authenticated;
revoke all on function public.assert_active_employee_capacity()
  from public, anon, authenticated;
revoke all on function public.assert_active_case_capacity()
  from public, anon, authenticated;
revoke all on function public.assert_open_task_capacity()
  from public, anon, authenticated;
