-- Commercial Advisor-reply budget (included + prepaid packs + optional overage).
--
-- Abuse rails from 0027 stay the product's hard stop (burst / rolling-day /
-- platform). They are never for sale. This migration adds a separate monthly
-- included allowance on operation `chat` only (`support_firstline` stays on
-- abuse rails), prepaid pack credits, and an opt-in overage ledger for paid
-- subscriptions.
--
-- `CREATE OR REPLACE` cannot change a function's argument list, so the 0027
-- signature is dropped and recreated with the commercial parameters.
--
-- ROLLBACK:
--   drop function if exists public.set_advisor_overage_opt_in(boolean);
--   drop function if exists public.grant_ai_advisor_pack(uuid, integer, text);
--   drop function if exists public.claim_ai_usage(
--     uuid, text, uuid, text, text, integer, integer, integer, bigint, integer, text[],
--     integer, text[], integer);
--   -- restore 0027's claim_ai_usage
--   alter table public.profiles drop column if exists advisor_overage_opt_in;
--   drop table if exists public.ai_advisor_overage_months;
--   drop table if exists public.ai_advisor_credits;

-- ── 1. Prepaid pack ledger ────────────────────────────────────────────────
create table if not exists public.ai_advisor_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  remaining_replies integer not null check (remaining_replies >= 0),
  pack_size integer not null check (pack_size in (50, 200)),
  stripe_checkout_id text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists ai_advisor_credits_user_remaining_idx
  on public.ai_advisor_credits (user_id, created_at)
  where remaining_replies > 0;

alter table public.ai_advisor_credits enable row level security;
-- No policies: service-role (claim + webhook) only. Anon/authenticated denied.

-- ── 2. Opt-in metered overage (phase 2) ───────────────────────────────────
create table if not exists public.ai_advisor_overage_months (
  user_id uuid not null references auth.users (id) on delete cascade,
  month_start date not null,
  used integer not null default 0 check (used >= 0),
  primary key (user_id, month_start)
);

alter table public.ai_advisor_overage_months enable row level security;

alter table public.profiles
  add column if not exists advisor_overage_opt_in boolean not null default false;

-- ── 3. Credit a pack after Stripe Checkout (idempotent on session id) ─────
create or replace function public.grant_ai_advisor_pack(
  p_user_id uuid,
  p_pack_size integer,
  p_stripe_checkout_id text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_checkout text := nullif(btrim(coalesce(p_stripe_checkout_id, '')), '');
begin
  if p_user_id is null or v_checkout is null then
    return jsonb_build_object('granted', false, 'reason', 'missing_fields');
  end if;
  if p_pack_size not in (50, 200) then
    return jsonb_build_object('granted', false, 'reason', 'invalid_pack');
  end if;

  insert into public.ai_advisor_credits (
    user_id, remaining_replies, pack_size, stripe_checkout_id
  )
  values (p_user_id, p_pack_size, p_pack_size, v_checkout)
  on conflict (stripe_checkout_id) do nothing
  returning id into v_id;

  if v_id is null then
    return jsonb_build_object('granted', false, 'reason', 'duplicate');
  end if;
  return jsonb_build_object('granted', true, 'credit_id', v_id);
end;
$$;

revoke all on function public.grant_ai_advisor_pack(uuid, integer, text) from public;
revoke all on function public.grant_ai_advisor_pack(uuid, integer, text) from anon, authenticated;
grant execute on function public.grant_ai_advisor_pack(uuid, integer, text) to service_role;

-- ── 4. Signed-in account may toggle overage opt-in (not a billing column) ─
create or replace function public.set_advisor_overage_opt_in(p_opt_in boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_opt boolean := coalesce(p_opt_in, false);
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;

  insert into public.profiles (id, advisor_overage_opt_in)
  values (v_uid, v_opt)
  on conflict (id) do update
    set advisor_overage_opt_in = excluded.advisor_overage_opt_in;

  return v_opt;
end;
$$;

revoke all on function public.set_advisor_overage_opt_in(boolean) from public;
revoke all on function public.set_advisor_overage_opt_in(boolean) from anon;
grant execute on function public.set_advisor_overage_opt_in(boolean) to authenticated;
grant execute on function public.set_advisor_overage_opt_in(boolean) to service_role;

-- ── 5. claim_ai_usage: abuse rails, then commercial included / pack / overage
drop function if exists public.claim_ai_usage(
  uuid, text, uuid, text, text, integer, integer, integer, bigint, integer, text[]);

create function public.claim_ai_usage(
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

  -- Commercial included / pack / overage. Advisor `chat` only.
  if p_operation = any(coalesce(p_commercial_operations, array[]::text[])) then
    v_month_start := date_trunc('month', timezone('utc', v_now)) at time zone 'utc';
    v_next_month := (date_trunc('month', timezone('utc', v_now)) + interval '1 month') at time zone 'utc';
    v_month_date := (date_trunc('month', timezone('utc', v_now)))::date;

    select count(*) into v_count
      from public.ai_telemetry_events
      where user_id = p_user_id
        and operation = any(p_commercial_operations)
        and created_at >= v_month_start
        and status in ('started', 'completed', 'failed');

    if v_count >= greatest(p_monthly_chat_limit, 0) then
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
          'limit', p_monthly_chat_limit,
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
              'limit', p_monthly_chat_limit,
              'used', v_count,
              'retry_after_seconds',
                greatest(1, ceil(extract(epoch from (v_next_month - v_now)))::integer)
            );
          end if;
        else
          return jsonb_build_object(
            'allowed', false,
            'scope', 'commercial',
            'limit', p_monthly_chat_limit,
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

  select id into v_org from public.organizations where id = p_organization_id;

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
