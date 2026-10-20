-- 0248_create_organization_membership_recheck.sql
-- create_organization()'s duplicate-guard in 0075 checks for an existing
-- membership BEFORE acquiring the platform_capacity_config row lock, so two
-- concurrent callers both pass the check, then serialize through the lock and
-- each mint an org — which is how one dev account accumulated 100+ identical
-- "Dutiva Canada Inc." tenants (bursts of several orgs within seconds).
-- Re-check membership inside the serialized section: the loser of the race
-- blocks on FOR UPDATE until the winner commits, then sees the committed
-- member row and returns it instead of creating a duplicate tenant.

CREATE OR REPLACE FUNCTION "public"."create_organization"("org_name" "text", "org_legal_name" "text" DEFAULT NULL::"text")
RETURNS "jsonb"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public', 'auth'
AS $$
declare
  cfg public.platform_capacity_config;
  current_count integer;
  new_org public.organizations;
  existing_membership public.organization_members;
  user_email text;
  existing_waiting uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated';
  end if;

  -- Fast path: caller already has an active membership → return that org so
  -- transient client-state loss cannot create a duplicate tenant.
  select * into existing_membership
  from public.organization_members
  where user_id = auth.uid() and status = 'active'
  limit 1;

  if existing_membership is not null then
    select * into new_org from public.organizations where id = existing_membership.organization_id;
    if new_org is not null then
      return jsonb_build_object(
        'id', new_org.id,
        'name', new_org.name,
        'legal_name', new_org.legal_name,
        'created_by', new_org.created_by,
        'created_at', new_org.created_at,
        'member_role', existing_membership.role
      );
    end if;
  end if;

  -- Serialize concurrent admissions on the singleton config row.
  select * into cfg from public.platform_capacity_config where id = 1 for update;
  if cfg is null then
    raise exception 'capacity configuration missing';
  end if;

  /* Race re-check: the pre-lock membership read above is not sufficient — a
     concurrent caller may have committed its org+member while this call
     waited on the lock. Re-read now that admissions are serialized. */
  select * into existing_membership
  from public.organization_members
  where user_id = auth.uid() and status = 'active'
  limit 1;

  if existing_membership is not null then
    select * into new_org from public.organizations where id = existing_membership.organization_id;
    if new_org is not null then
      return jsonb_build_object(
        'id', new_org.id,
        'name', new_org.name,
        'legal_name', new_org.legal_name,
        'created_by', new_org.created_by,
        'created_at', new_org.created_at,
        'member_role', existing_membership.role
      );
    end if;
  end if;

  insert into public.organization_admission_log(event_type, user_id, details)
  values ('capacity_check', auth.uid(), jsonb_build_object(
    'capacity_limit', cfg.capacity_limit,
    'capacity_mode', cfg.capacity_mode,
    'enforcement_enabled', cfg.capacity_enforcement_enabled
  ));

  select count(*) into current_count from public.organizations;

  if cfg.capacity_enforcement_enabled and cfg.capacity_mode <> 'unlimited' and current_count >= cfg.capacity_limit then
    if cfg.capacity_mode = 'waitlist' then
      select id into existing_waiting
      from public.organization_admission_waitlist
      where user_id = auth.uid() and status = 'waiting';

      if existing_waiting is null then
        user_email := (select email from auth.users where id = auth.uid());
        insert into public.organization_admission_waitlist(user_id, email, requested_name, status, source)
        values (auth.uid(), user_email, org_name, 'waiting', 'create_organization');
      end if;

      insert into public.organization_admission_log(event_type, user_id, details)
      values ('waitlist_joined', auth.uid(), jsonb_build_object('requested_name', org_name));

      return jsonb_build_object('error', 'WAITLIST');
    end if;

    insert into public.organization_admission_log(event_type, user_id, details)
    values ('capacity_reached', auth.uid(), jsonb_build_object(
      'current_count', current_count,
      'capacity_limit', cfg.capacity_limit
    ));

    return jsonb_build_object('error', 'CAPACITY_REACHED');
  end if;

  insert into public.organizations(name, legal_name, created_by)
  values (org_name, org_legal_name, auth.uid())
  returning * into new_org;

  insert into public.organization_members(organization_id, user_id, role, status)
  values (new_org.id, auth.uid(), 'owner', 'active');

  insert into public.organization_admission_log(event_type, user_id, details)
  values ('organization_created', auth.uid(), jsonb_build_object(
    'organization_id', new_org.id,
    'organization_name', new_org.name
  ));

  return jsonb_build_object(
    'id', new_org.id,
    'name', new_org.name,
    'legal_name', new_org.legal_name,
    'created_by', new_org.created_by,
    'created_at', new_org.created_at,
    'member_role', 'owner'
  );
end;
$$;

REVOKE ALL ON FUNCTION "public"."create_organization"("text", "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_organization"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_organization"("text", "text") TO "service_role";

ALTER FUNCTION "public"."create_organization"("text", "text") OWNER TO "postgres";
