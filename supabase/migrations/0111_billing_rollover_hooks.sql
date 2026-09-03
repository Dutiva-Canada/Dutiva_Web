-- Wire rollover cap/expiry into apply_organization_billing (0107 + 0109).
--
-- After an org plan/status change: cap rollover to the new plan's monthly
-- allowance; when paid access ends, zero remaining rollover. Also grant
-- Advisor packs to the organization ledger when the checkout carries an org.
--
-- ROLLBACK:
--   -- restore apply_organization_billing body from 0107
--   drop function if exists public.apply_organization_billing_with_rollover_hooks();

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
  v_prev_plan text;
  v_prev_status text;
begin
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

  select plan, subscription_status
    into v_prev_plan, v_prev_status
    from public.organizations
    where id = p_organization_id;

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

  -- Rollover: expire when paid access ends; otherwise cap to new plan max.
  if p_plan = 'free'
     or p_subscription_status not in ('active', 'trialing')
  then
    perform public.expire_advisor_rollover_on_cancel(p_organization_id);
  else
    perform public.cap_advisor_rollover_to_plan(p_organization_id);
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
      'billing_owner_user_id', v_owner,
      'previous_plan', v_prev_plan,
      'previous_subscription_status', v_prev_status
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
