-- Org-pooled Advisor replies: rollover ledger, org pack credits, org overage.
--
-- Extends 0091's user-scoped commercial budget. When claim_ai_usage receives an
-- organization_id, consumption is org-wide: oldest unexpired rollover → monthly
-- included → org packs → opted-in overage. Abuse rails (burst / daily /
-- platform) stay per-user as in 0027/0091.
--
-- Month transition is lazy via ensure_advisor_month_transition: unused *base*
-- included replies (not rollover/pack/overage) roll into a 90-day grant, capped
-- so the remaining bank never exceeds the current plan's monthly allowance.
-- Free plans never earn rollover. Paid access ending expires the bank
-- (expire_advisor_rollover_on_cancel — wire from apply_organization_billing later).
--
-- Depends on 0107 (org billing columns) and 0108 (organization_effective_plan).
-- Numbers mirror src/config/planEntitlements.ts advisorRepliesPerMonth.
--
-- ROLLBACK:
--   drop function if exists public.advisor_usage_summary(uuid);
--   drop function if exists public.cap_advisor_rollover_to_plan(uuid);
--   drop function if exists public.expire_advisor_rollover_on_cancel(uuid);
--   drop function if exists public.ensure_advisor_month_transition(uuid);
--   drop function if exists public.grant_ai_advisor_org_pack(uuid, integer, text, uuid);
--   drop function if exists public.advisor_monthly_included(text);
--   drop function if exists public.set_advisor_overage_opt_in(boolean);
--   -- restore 0091 set_advisor_overage_opt_in + claim_ai_usage bodies
--   drop function if exists public.claim_ai_usage(
--     uuid, text, uuid, text, text, integer, integer, integer, bigint, integer, text[],
--     integer, text[], integer);
--   -- restore 0091 claim_ai_usage
--   -- restore 0107 pin_organization_billing_columns (without overage GUC bypass)
--   drop table if exists public.ai_advisor_month_state;
--   drop table if exists public.ai_advisor_org_overage_months;
--   drop table if exists public.ai_advisor_org_credits;
--   drop table if exists public.ai_advisor_rollover_credits;

-- ── 1. Rollover ledger (idempotent monthly grant per org + source month) ────
create table if not exists public.ai_advisor_rollover_credits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  granted_replies integer not null check (granted_replies > 0),
  remaining_replies integer not null check (remaining_replies >= 0),
  granted_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  source_month date not null,
  unique (organization_id, source_month)
);

create index if not exists ai_advisor_rollover_credits_org_remaining_idx
  on public.ai_advisor_rollover_credits (organization_id, expires_at)
  where remaining_replies > 0;

alter table public.ai_advisor_rollover_credits enable row level security;

create policy "Deny client API access"
  on public.ai_advisor_rollover_credits
  for all
  to anon, authenticated
  using (false)
  with check (false);

revoke all on table public.ai_advisor_rollover_credits from anon, authenticated;
grant all on table public.ai_advisor_rollover_credits to service_role;

-- ── 2. Org-scoped prepaid packs (user table kept for back-compat) ───────────
create table if not exists public.ai_advisor_org_credits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  remaining_replies integer not null check (remaining_replies >= 0),
  pack_size integer not null check (pack_size in (50, 200)),
  stripe_checkout_id text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists ai_advisor_org_credits_org_remaining_idx
  on public.ai_advisor_org_credits (organization_id, created_at)
  where remaining_replies > 0;

alter table public.ai_advisor_org_credits enable row level security;

create policy "Deny client API access"
  on public.ai_advisor_org_credits
  for all
  to anon, authenticated
  using (false)
  with check (false);

revoke all on table public.ai_advisor_org_credits from anon, authenticated;
grant all on table public.ai_advisor_org_credits to service_role;

-- ── 3. Org metered overage by UTC month ─────────────────────────────────────
create table if not exists public.ai_advisor_org_overage_months (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  month_start date not null,
  used integer not null default 0 check (used >= 0),
  primary key (organization_id, month_start)
);

alter table public.ai_advisor_org_overage_months enable row level security;

create policy "Deny client API access"
  on public.ai_advisor_org_overage_months
  for all
  to anon, authenticated
  using (false)
  with check (false);

revoke all on table public.ai_advisor_org_overage_months from anon, authenticated;
grant all on table public.ai_advisor_org_overage_months to service_role;

-- ── 4. Lazy month state (included_used + rollover grant flag) ───────────────
create table if not exists public.ai_advisor_month_state (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  month_start date not null,
  included_used integer not null default 0 check (included_used >= 0),
  rollover_granted boolean not null default false,
  primary key (organization_id, month_start)
);

alter table public.ai_advisor_month_state enable row level security;

create policy "Deny client API access"
  on public.ai_advisor_month_state
  for all
  to anon, authenticated
  using (false)
  with check (false);

revoke all on table public.ai_advisor_month_state from anon, authenticated;
grant all on table public.ai_advisor_month_state to service_role;

-- ── 5. Plan → monthly included (mirrors planEntitlements) ───────────────────
create or replace function public.advisor_monthly_included(p_plan text)
returns integer
language plpgsql
immutable
set search_path = public
as $$
begin
  return case coalesce(p_plan, 'free')
    when 'starter' then 80
    when 'growth' then 200
    when 'pro' then 400
    else 20 -- free and unknown
  end;
end;
$$;

revoke all on function public.advisor_monthly_included(text) from public, anon;
grant execute on function public.advisor_monthly_included(text)
  to authenticated, service_role;

-- ── 6. Allow set_advisor_overage_opt_in to update org column despite pin ────
-- 0107 pins advisor_overage_opt_in for authenticated writers. Opt-in is a
-- user preference toggled via RPC; allow when the session GUC is set.
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
  new.free_access_starts_at := old.free_access_starts_at;
  new.free_access_ends_at := old.free_access_ends_at;

  if coalesce(current_setting('dutiva.allow_org_overage_opt_in', true), '') is distinct from '1'
  then
    new.advisor_overage_opt_in := old.advisor_overage_opt_in;
  end if;

  return new;
end;
$$;

-- ── 7. Credit an org pack after Stripe Checkout (idempotent on session id) ─
create or replace function public.grant_ai_advisor_org_pack(
  p_organization_id uuid,
  p_pack_size integer,
  p_stripe_checkout_id text,
  p_purchaser_user_id uuid default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_checkout text := nullif(btrim(coalesce(p_stripe_checkout_id, '')), '');
begin
  if p_organization_id is null or v_checkout is null then
    return jsonb_build_object('granted', false, 'reason', 'missing_fields');
  end if;
  if p_pack_size not in (50, 200) then
    return jsonb_build_object('granted', false, 'reason', 'invalid_pack');
  end if;
  if not exists (select 1 from public.organizations where id = p_organization_id) then
    return jsonb_build_object('granted', false, 'reason', 'org_not_found');
  end if;

  insert into public.ai_advisor_org_credits (
    organization_id, user_id, remaining_replies, pack_size, stripe_checkout_id
  )
  values (
    p_organization_id, p_purchaser_user_id, p_pack_size, p_pack_size, v_checkout
  )
  on conflict (stripe_checkout_id) do nothing
  returning id into v_id;

  if v_id is null then
    return jsonb_build_object('granted', false, 'reason', 'duplicate');
  end if;
  return jsonb_build_object('granted', true, 'credit_id', v_id);
end;
$$;

revoke all on function public.grant_ai_advisor_org_pack(uuid, integer, text, uuid)
  from public, anon, authenticated;
grant execute on function public.grant_ai_advisor_org_pack(uuid, integer, text, uuid)
  to service_role;

-- ── 8. Lazy UTC month transition + rollover grant ───────────────────────────
create or replace function public.ensure_advisor_month_transition(p_organization_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_month_trunc timestamptz := date_trunc('month', v_now);
  v_month date := v_month_trunc::date;
  v_prev date := (v_month_trunc - interval '1 month')::date;
  v_org_created timestamptz;
  v_plan text;
  v_limit integer;
  v_prev_used integer;
  v_prev_granted boolean;
  v_unused integer;
  v_bank integer;
  v_room integer;
  v_grant integer;
begin
  if p_organization_id is null then
    return;
  end if;

  perform pg_advisory_xact_lock(
    hashtext('advisor_month:' || p_organization_id::text)
  );

  -- Ensure current month row exists.
  insert into public.ai_advisor_month_state (
    organization_id, month_start, included_used, rollover_granted
  )
  values (p_organization_id, v_month, 0, false)
  on conflict (organization_id, month_start) do nothing;

  select created_at into v_org_created
    from public.organizations
    where id = p_organization_id;

  -- Brand-new orgs must not earn a full prior-month rollover they never held.
  if v_org_created is null or v_org_created >= v_month_trunc then
    return;
  end if;

  -- Ensure previous month row exists so quiet paid months still roll unused
  -- base allowance (included_used defaults to 0).
  insert into public.ai_advisor_month_state (
    organization_id, month_start, included_used, rollover_granted
  )
  values (p_organization_id, v_prev, 0, false)
  on conflict (organization_id, month_start) do nothing;

  select included_used, rollover_granted
    into v_prev_used, v_prev_granted
    from public.ai_advisor_month_state
    where organization_id = p_organization_id
      and month_start = v_prev
    for update;

  if coalesce(v_prev_granted, true) then
    return;
  end if;

  v_plan := public.organization_effective_plan(p_organization_id);
  v_limit := public.advisor_monthly_included(v_plan);

  -- Free: mark processed, never grant.
  if v_plan = 'free' or v_limit <= 0 then
    update public.ai_advisor_month_state
      set rollover_granted = true
      where organization_id = p_organization_id
        and month_start = v_prev;
    return;
  end if;

  v_unused := greatest(0, v_limit - coalesce(v_prev_used, 0));

  select coalesce(sum(remaining_replies), 0) into v_bank
    from public.ai_advisor_rollover_credits
    where organization_id = p_organization_id
      and remaining_replies > 0
      and expires_at > v_now;

  -- Cap so total remaining rollover bank <= current plan monthly allowance.
  v_room := greatest(0, v_limit - v_bank);
  v_grant := least(v_unused, v_room);

  if v_grant > 0 then
    insert into public.ai_advisor_rollover_credits (
      organization_id,
      granted_replies,
      remaining_replies,
      expires_at,
      source_month
    )
    values (
      p_organization_id,
      v_grant,
      v_grant,
      v_now + interval '90 days',
      v_prev
    )
    on conflict (organization_id, source_month) do nothing;
  end if;

  update public.ai_advisor_month_state
    set rollover_granted = true
    where organization_id = p_organization_id
      and month_start = v_prev;
end;
$$;

revoke all on function public.ensure_advisor_month_transition(uuid)
  from public, anon, authenticated;
grant execute on function public.ensure_advisor_month_transition(uuid)
  to service_role;

-- ── 9. Expire rollover when paid access ends ────────────────────────────────
create or replace function public.expire_advisor_rollover_on_cancel(p_organization_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n integer;
begin
  if p_organization_id is null then
    return 0;
  end if;

  update public.ai_advisor_rollover_credits
    set remaining_replies = 0
    where organization_id = p_organization_id
      and remaining_replies > 0
      and expires_at > timezone('utc', now());

  get diagnostics v_n = row_count;
  return coalesce(v_n, 0);
end;
$$;

revoke all on function public.expire_advisor_rollover_on_cancel(uuid)
  from public, anon, authenticated;
grant execute on function public.expire_advisor_rollover_on_cancel(uuid)
  to service_role;

-- ── 10. Cap rollover bank after plan change (newest grants first) ───────────
create or replace function public.cap_advisor_rollover_to_plan(p_organization_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_limit integer;
  v_bank integer;
  v_excess integer;
  v_row record;
  v_take integer;
  v_reduced integer := 0;
begin
  if p_organization_id is null then
    return 0;
  end if;

  v_limit := public.advisor_monthly_included(
    public.organization_effective_plan(p_organization_id)
  );

  if v_limit <= 0 then
    return public.expire_advisor_rollover_on_cancel(p_organization_id);
  end if;

  select coalesce(sum(remaining_replies), 0) into v_bank
    from public.ai_advisor_rollover_credits
    where organization_id = p_organization_id
      and remaining_replies > 0
      and expires_at > v_now;

  v_excess := v_bank - v_limit;
  if v_excess <= 0 then
    return 0;
  end if;

  for v_row in
    select id, remaining_replies
      from public.ai_advisor_rollover_credits
      where organization_id = p_organization_id
        and remaining_replies > 0
        and expires_at > v_now
      order by granted_at desc, id desc
      for update
  loop
    exit when v_excess <= 0;
    v_take := least(v_row.remaining_replies, v_excess);
    update public.ai_advisor_rollover_credits
      set remaining_replies = remaining_replies - v_take
      where id = v_row.id;
    v_excess := v_excess - v_take;
    v_reduced := v_reduced + v_take;
  end loop;

  return v_reduced;
end;
$$;

revoke all on function public.cap_advisor_rollover_to_plan(uuid)
  from public, anon, authenticated;
grant execute on function public.cap_advisor_rollover_to_plan(uuid)
  to service_role;

-- ── 11. Overage opt-in: profile + billing org when resolvable ───────────────
create or replace function public.set_advisor_overage_opt_in(p_opt_in boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_opt boolean := coalesce(p_opt_in, false);
  v_org uuid;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;

  insert into public.profiles (id, advisor_overage_opt_in)
  values (v_uid, v_opt)
  on conflict (id) do update
    set advisor_overage_opt_in = excluded.advisor_overage_opt_in;

  v_org := public.resolve_user_billing_organization(v_uid);
  if v_org is not null then
    perform set_config('dutiva.allow_org_overage_opt_in', '1', true);
    update public.organizations
      set advisor_overage_opt_in = v_opt,
          updated_at = timezone('utc', now())
      where id = v_org;
  end if;

  return v_opt;
end;
$$;

revoke all on function public.set_advisor_overage_opt_in(boolean) from public;
revoke all on function public.set_advisor_overage_opt_in(boolean) from anon;
grant execute on function public.set_advisor_overage_opt_in(boolean) to authenticated;
grant execute on function public.set_advisor_overage_opt_in(boolean) to service_role;

-- ── 12. claim_ai_usage: org pool when organization_id present ───────────────
create or replace function public.claim_ai_usage(
  p_user_id uuid,
  p_operation text,
  p_organization_id uuid,
  p_provider text,
  p_model text,
  p_burst_window_seconds integer,
  p_burst_limit integer,
  p_daily_request_limit integer,
  p_daily_token_limit bigint,
  p_platform_daily_limit integer,
  p_metered_operations text[],
  p_monthly_chat_limit integer,
  p_commercial_operations text[],
  p_overage_monthly_cap integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_utc_now timestamptz := timezone('utc', now());
  v_burst_since timestamptz := v_now - make_interval(secs => greatest(p_burst_window_seconds, 1));
  v_day_since timestamptz := v_now - interval '24 hours';
  v_count integer;
  v_tokens bigint;
  v_oldest timestamptz;
  v_org uuid;
  v_claim uuid;
  v_commercial text;
  v_credit_id uuid;
  v_overage_used integer;
  v_opt boolean;
  v_sub text;
  v_cust text;
  v_month_start timestamptz;
  v_next_month timestamptz;
  v_month_date date;
  v_plan text;
  v_monthly_limit integer;
  v_included_used integer;
  v_rollover_id uuid;
begin
  if p_user_id is null then
    return jsonb_build_object('allowed', false, 'scope', 'unauthenticated');
  end if;

  perform pg_advisory_xact_lock(hashtext('ai_usage_claim'));

  -- Burst: this user, this operation, short window.
  select count(*), min(created_at) into v_count, v_oldest
    from public.ai_telemetry_events
    where user_id = p_user_id
      and operation = p_operation
      and created_at >= v_burst_since;
  if v_count >= greatest(p_burst_limit, 1) then
    return jsonb_build_object(
      'allowed', false,
      'scope', 'burst',
      'limit', p_burst_limit,
      'used', v_count,
      'retry_after_seconds',
        greatest(1, ceil(extract(epoch from
          (v_oldest + make_interval(secs => greatest(p_burst_window_seconds, 1)) - v_now)))::integer)
    );
  end if;

  -- Daily requests: this user, rolling 24h, every metered operation.
  select count(*), min(created_at) into v_count, v_oldest
    from public.ai_telemetry_events
    where user_id = p_user_id
      and operation = any(p_metered_operations)
      and created_at >= v_day_since;
  if v_count >= greatest(p_daily_request_limit, 1) then
    return jsonb_build_object(
      'allowed', false,
      'scope', 'daily',
      'limit', p_daily_request_limit,
      'used', v_count,
      'retry_after_seconds',
        greatest(1, ceil(extract(epoch from (v_oldest + interval '24 hours' - v_now)))::integer)
    );
  end if;

  -- Daily tokens.
  select coalesce(sum(total_tokens), 0), min(created_at) into v_tokens, v_oldest
    from public.ai_telemetry_events
    where user_id = p_user_id
      and operation = any(p_metered_operations)
      and created_at >= v_day_since
      and total_tokens is not null;
  if v_tokens >= greatest(p_daily_token_limit, 1) then
    return jsonb_build_object(
      'allowed', false,
      'scope', 'daily_tokens',
      'limit', p_daily_token_limit,
      'used', v_tokens,
      'retry_after_seconds',
        greatest(1, ceil(extract(epoch from
          (coalesce(v_oldest, v_now) + interval '24 hours' - v_now)))::integer)
    );
  end if;

  -- Platform ceiling.
  select count(*), min(created_at) into v_count, v_oldest
    from public.ai_telemetry_events
    where operation = any(p_metered_operations)
      and created_at >= v_day_since;
  if v_count >= greatest(p_platform_daily_limit, 1) then
    return jsonb_build_object(
      'allowed', false,
      'scope', 'platform_daily',
      'limit', p_platform_daily_limit,
      'used', v_count,
      'retry_after_seconds',
        greatest(1, ceil(extract(epoch from (v_oldest + interval '24 hours' - v_now)))::integer)
    );
  end if;

  -- Resolve org (null when absent or unknown id).
  select id into v_org from public.organizations where id = p_organization_id;

  -- Commercial included / rollover / pack / overage. Advisor `chat` only.
  if p_operation = any(coalesce(p_commercial_operations, array[]::text[])) then
    v_month_start := date_trunc('month', timezone('utc', v_now)) at time zone 'utc';
    v_next_month := (date_trunc('month', timezone('utc', v_now)) + interval '1 month') at time zone 'utc';
    v_month_date := (date_trunc('month', timezone('utc', v_now)))::date;

    if v_org is not null then
      -- ── Org-pooled commercial path ──────────────────────────────────────
      perform public.ensure_advisor_month_transition(v_org);

      v_plan := public.organization_effective_plan(v_org);
      v_monthly_limit := public.advisor_monthly_included(v_plan);

      -- 1) Oldest unexpired rollover
      update public.ai_advisor_rollover_credits
        set remaining_replies = remaining_replies - 1
        where id = (
          select id from public.ai_advisor_rollover_credits
          where organization_id = v_org
            and remaining_replies > 0
            and expires_at > v_utc_now
          order by expires_at asc, granted_at asc, id asc
          limit 1
          for update
        )
      returning id into v_rollover_id;

      if v_rollover_id is not null then
        v_commercial := 'rollover';
      else
        select included_used into v_included_used
          from public.ai_advisor_month_state
          where organization_id = v_org
            and month_start = v_month_date
          for update;

        v_included_used := coalesce(v_included_used, 0);

        -- 2) Current monthly included
        if v_included_used < greatest(v_monthly_limit, 0) then
          update public.ai_advisor_month_state
            set included_used = included_used + 1
            where organization_id = v_org
              and month_start = v_month_date;
          v_commercial := 'included';
        else
          -- 3) Org pack credits (oldest first)
          update public.ai_advisor_org_credits
            set remaining_replies = remaining_replies - 1
            where id = (
              select id from public.ai_advisor_org_credits
              where organization_id = v_org and remaining_replies > 0
              order by created_at
              limit 1
              for update
            )
          returning id into v_credit_id;

          if v_credit_id is not null then
            v_commercial := 'pack';
          elsif greatest(p_overage_monthly_cap, 0) <= 0 then
            return jsonb_build_object(
              'allowed', false,
              'scope', 'commercial',
              'limit', v_monthly_limit,
              'used', v_included_used,
              'retry_after_seconds',
                greatest(1, ceil(extract(epoch from (v_next_month - v_now)))::integer)
            );
          else
            -- 4) Org overage when opted in + paid + Stripe customer
            select advisor_overage_opt_in, subscription_status, stripe_customer_id
              into v_opt, v_sub, v_cust
              from public.organizations
              where id = v_org;

            if coalesce(v_opt, false)
               and v_sub in ('active', 'trialing')
               and v_cust is not null
               and length(btrim(v_cust)) > 0 then
              insert into public.ai_advisor_org_overage_months (
                organization_id, month_start, used
              )
              values (v_org, v_month_date, 1)
              on conflict (organization_id, month_start) do update
                set used = public.ai_advisor_org_overage_months.used + 1
                where public.ai_advisor_org_overage_months.used
                      < greatest(p_overage_monthly_cap, 0)
              returning used into v_overage_used;

              if v_overage_used is not null then
                v_commercial := 'overage';
              else
                return jsonb_build_object(
                  'allowed', false,
                  'scope', 'commercial',
                  'limit', v_monthly_limit,
                  'used', v_included_used,
                  'retry_after_seconds',
                    greatest(1, ceil(extract(epoch from (v_next_month - v_now)))::integer)
                );
              end if;
            else
              return jsonb_build_object(
                'allowed', false,
                'scope', 'commercial',
                'limit', v_monthly_limit,
                'used', v_included_used,
                'retry_after_seconds',
                  greatest(1, ceil(extract(epoch from (v_next_month - v_now)))::integer)
              );
            end if;
          end if;
        end if;
      end if;
    else
      -- ── Legacy user-scoped path (null org / unknown id) ─────────────────
      v_monthly_limit := greatest(coalesce(p_monthly_chat_limit, 0), 0);

      select count(*) into v_count
        from public.ai_telemetry_events
        where user_id = p_user_id
          and operation = any(p_commercial_operations)
          and created_at >= v_month_start
          and status in ('started', 'completed', 'failed');

      if v_count >= v_monthly_limit then
        update public.ai_advisor_credits
          set remaining_replies = remaining_replies - 1
          where id = (
            select id from public.ai_advisor_credits
            where user_id = p_user_id and remaining_replies > 0
            order by created_at
            limit 1
            for update
          )
        returning id into v_credit_id;

        if v_credit_id is not null then
          v_commercial := 'pack';
        elsif greatest(p_overage_monthly_cap, 0) <= 0 then
          return jsonb_build_object(
            'allowed', false,
            'scope', 'commercial',
            'limit', v_monthly_limit,
            'used', v_count,
            'retry_after_seconds',
              greatest(1, ceil(extract(epoch from (v_next_month - v_now)))::integer)
          );
        else
          select advisor_overage_opt_in, subscription_status, stripe_customer_id
            into v_opt, v_sub, v_cust
            from public.profiles
            where id = p_user_id;

          if coalesce(v_opt, false)
             and v_sub in ('active', 'trialing')
             and v_cust is not null
             and length(btrim(v_cust)) > 0 then
            insert into public.ai_advisor_overage_months (user_id, month_start, used)
            values (p_user_id, v_month_date, 1)
            on conflict (user_id, month_start) do update
              set used = public.ai_advisor_overage_months.used + 1
              where public.ai_advisor_overage_months.used < greatest(p_overage_monthly_cap, 0)
            returning used into v_overage_used;

            if v_overage_used is not null then
              v_commercial := 'overage';
            else
              return jsonb_build_object(
                'allowed', false,
                'scope', 'commercial',
                'limit', v_monthly_limit,
                'used', v_count,
                'retry_after_seconds',
                  greatest(1, ceil(extract(epoch from (v_next_month - v_now)))::integer)
              );
            end if;
          else
            return jsonb_build_object(
              'allowed', false,
              'scope', 'commercial',
              'limit', v_monthly_limit,
              'used', v_count,
              'retry_after_seconds',
                greatest(1, ceil(extract(epoch from (v_next_month - v_now)))::integer)
            );
          end if;
        end if;
      else
        v_commercial := 'included';
      end if;
    end if;
  end if;

  insert into public.ai_telemetry_events
    (organization_id, user_id, provider, model, operation, status, metadata)
  values
    (
      v_org,
      p_user_id,
      p_provider,
      p_model,
      p_operation,
      'started',
      case
        when v_commercial is null then '{}'::jsonb
        else jsonb_build_object('commercial', v_commercial)
      end
    )
  returning id into v_claim;

  return jsonb_build_object(
    'allowed', true,
    'claim_id', v_claim,
    'commercial', v_commercial
  );
end;
$$;

revoke all on function public.claim_ai_usage(
  uuid, text, uuid, text, text, integer, integer, integer, bigint, integer, text[],
  integer, text[], integer) from public;
revoke all on function public.claim_ai_usage(
  uuid, text, uuid, text, text, integer, integer, integer, bigint, integer, text[],
  integer, text[], integer) from anon, authenticated;
grant execute on function public.claim_ai_usage(
  uuid, text, uuid, text, text, integer, integer, integer, bigint, integer, text[],
  integer, text[], integer) to service_role;

-- ── 13. UI summary RPC (org members + service role) ─────────────────────────
create or replace function public.advisor_usage_summary(p_organization_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text := coalesce(auth.role(), '');
  v_now timestamptz := timezone('utc', now());
  v_month date := (date_trunc('month', v_now))::date;
  v_next_reset timestamptz :=
    (date_trunc('month', v_now) + interval '1 month') at time zone 'utc';
  v_plan text;
  v_limit integer;
  v_included_used integer := 0;
  v_rollover integer := 0;
  v_nearest timestamptz;
  v_pack integer := 0;
  v_opt boolean := false;
  v_sub text;
  v_cust text;
  v_overage_used integer := 0;
  v_overage_enabled boolean := false;
  v_overage_cap integer := 500;
begin
  if p_organization_id is null then
    raise exception 'organization_id required' using errcode = '22023';
  end if;

  if v_role is distinct from 'service_role'
     and (
       v_uid is null
       or not public.is_org_member(p_organization_id, v_uid)
     )
  then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  -- Lazy transition so summary reflects a fresh month bank.
  perform public.ensure_advisor_month_transition(p_organization_id);

  v_plan := public.organization_effective_plan(p_organization_id);
  v_limit := public.advisor_monthly_included(v_plan);

  select coalesce(included_used, 0) into v_included_used
    from public.ai_advisor_month_state
    where organization_id = p_organization_id
      and month_start = v_month;

  select
    coalesce(sum(remaining_replies), 0),
    min(expires_at) filter (where remaining_replies > 0 and expires_at > v_now)
  into v_rollover, v_nearest
    from public.ai_advisor_rollover_credits
    where organization_id = p_organization_id
      and remaining_replies > 0
      and expires_at > v_now;

  select coalesce(sum(remaining_replies), 0) into v_pack
    from public.ai_advisor_org_credits
    where organization_id = p_organization_id
      and remaining_replies > 0;

  select advisor_overage_opt_in, subscription_status, stripe_customer_id
    into v_opt, v_sub, v_cust
    from public.organizations
    where id = p_organization_id;

  v_overage_enabled :=
    coalesce(v_opt, false)
    and coalesce(v_sub, '') in ('active', 'trialing')
    and v_cust is not null
    and length(btrim(v_cust)) > 0;

  select coalesce(used, 0) into v_overage_used
    from public.ai_advisor_org_overage_months
    where organization_id = p_organization_id
      and month_start = v_month;

  return jsonb_build_object(
    'organization_id', p_organization_id,
    'plan', v_plan,
    'monthly_limit', v_limit,
    'monthly_used', coalesce(v_included_used, 0),
    'monthly_remaining', greatest(0, v_limit - coalesce(v_included_used, 0)),
    'rollover_balance', coalesce(v_rollover, 0),
    'nearest_rollover_expiry', v_nearest,
    'pack_balance', coalesce(v_pack, 0),
    'overage_enabled', v_overage_enabled,
    'overage_used', coalesce(v_overage_used, 0),
    'overage_cap', v_overage_cap,
    'next_reset_at', v_next_reset,
    'consumption_order', jsonb_build_array(
      'rollover',
      'monthly_included',
      'pack',
      'overage'
    ),
    'consumption_order_keys', jsonb_build_object(
      'rollover', 'advisor_usage_order_rollover',
      'monthly_included', 'advisor_usage_order_monthly_included',
      'pack', 'advisor_usage_order_pack',
      'overage', 'advisor_usage_order_overage'
    )
  );
end;
$$;

revoke all on function public.advisor_usage_summary(uuid) from public, anon;
grant execute on function public.advisor_usage_summary(uuid)
  to authenticated, service_role;
