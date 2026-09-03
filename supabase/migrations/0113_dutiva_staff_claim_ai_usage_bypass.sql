-- @dutiva.ca staff: claim_ai_usage never hard-denies (depends on 0112).
--
-- Staff still get a started telemetry row (metadata staff_bypass) so usage UI
-- remains a manual budget signal. Platform daily ceiling ignores those rows
-- so internal traffic cannot starve customer capacity.
--
-- ROLLBACK:
--   -- restore claim_ai_usage body from 0109

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

  -- Staff: meter for visibility, never deny (burst / daily / platform / commercial).
  if public.user_is_dutiva_staff(p_user_id) then
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
        jsonb_build_object('commercial', 'included', 'staff_bypass', true)
      )
    returning id into v_claim;
    return jsonb_build_object(
      'allowed', true,
      'claim_id', v_claim,
      'commercial', 'included'
    );
  end if;

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

  -- Platform ceiling (staff_bypass rows do not consume the shared beta budget).
  select count(*), min(created_at) into v_count, v_oldest
    from public.ai_telemetry_events
    where operation = any(p_metered_operations)
      and created_at >= v_day_since
      and coalesce(metadata ->> 'staff_bypass', '') is distinct from 'true';
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

