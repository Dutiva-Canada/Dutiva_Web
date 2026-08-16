-- Organization capacity and controlled-admission system.
--
-- Design decisions:
--   * platform_capacity_config is a single-row table so capacity, admission
--     mode, and enforcement can be changed without code deployments.
--   * create_organization() enforces capacity server-side. It locks the
--     singleton config row for update so concurrent admissions serialize.
--   * The function returns jsonb so the caller can distinguish success,
--     CAPACITY_REACHED, and WAITLIST without parsing exception text.
--   * organization_admission_waitlist records users waiting for capacity.
--   * organization_admission_log stores capacity/rejection/config events for
--     observability and is readable only by admins.

CREATE TABLE IF NOT EXISTS "public"."platform_capacity_config" (
  "id" integer DEFAULT 1 NOT NULL,
  "capacity_limit" integer DEFAULT 100 NOT NULL,
  "capacity_enforcement_enabled" boolean DEFAULT false NOT NULL,
  "capacity_mode" text DEFAULT 'unlimited'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT "platform_capacity_config_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "platform_capacity_config_single_row" CHECK ("id" = 1),
  CONSTRAINT "platform_capacity_config_mode_check" CHECK ("capacity_mode" IN ('unlimited', 'capped', 'waitlist'))
);

COMMENT ON TABLE "public"."platform_capacity_config" IS 'Single-row configuration for organization capacity and admission mode.';

INSERT INTO "public"."platform_capacity_config" ("id", "capacity_limit", "capacity_enforcement_enabled", "capacity_mode")
VALUES (1, 100, false, 'unlimited')
ON CONFLICT ("id") DO NOTHING;

CREATE TABLE IF NOT EXISTS "public"."organization_admission_waitlist" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "email" text,
  "requested_name" text,
  "status" text DEFAULT 'waiting'::text NOT NULL,
  "source" text DEFAULT 'manual'::text,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT "organization_admission_waitlist_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "organization_admission_waitlist_status_check" CHECK ("status" IN ('waiting', 'invited', 'admitted', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS "organization_admission_waitlist_status_created_idx" ON "public"."organization_admission_waitlist" ("status", "created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "organization_admission_waitlist_one_waiting_per_user" ON "public"."organization_admission_waitlist" ("user_id") WHERE ("status" = 'waiting');

COMMENT ON TABLE "public"."organization_admission_waitlist" IS 'Users waiting for organization capacity to become available.';

CREATE TABLE IF NOT EXISTS "public"."organization_admission_log" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "event_type" text NOT NULL,
  "user_id" uuid,
  "details" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT "organization_admission_log_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "organization_admission_log_event_type_check" CHECK ("event_type" IN ('capacity_check', 'organization_created', 'capacity_reached', 'waitlist_joined', 'config_changed'))
);

CREATE INDEX IF NOT EXISTS "organization_admission_log_event_type_created_idx" ON "public"."organization_admission_log" ("event_type", "created_at" DESC);

COMMENT ON TABLE "public"."organization_admission_log" IS 'Capacity admission and configuration events for observability.';

ALTER TABLE "public"."platform_capacity_config" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."organization_admission_waitlist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."organization_admission_log" ENABLE ROW LEVEL SECURITY;

-- Users can see their own waitlist row; admins can see the whole queue.
CREATE POLICY "Users can read own waitlist row" ON "public"."organization_admission_waitlist" FOR SELECT TO "authenticated" USING ("user_id" = auth.uid());
CREATE POLICY "Admins can read waitlist" ON "public"."organization_admission_waitlist" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());
CREATE POLICY "Admins can update waitlist status" ON "public"."organization_admission_waitlist" FOR UPDATE TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());

-- Admission logs are admin-readable only.
CREATE POLICY "Admins can read admission log" ON "public"."organization_admission_log" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());

-- platform_capacity_config has no public policies: reads/writes go through
-- the admin-gated RPCs below. The create_organization() function bypasses
-- RLS because it is SECURITY DEFINER and checks capacity internally.

-- Drop the old row-returning signature. We're switching the return type to
-- jsonb, which OR REPLACE cannot reconcile.
DROP FUNCTION IF EXISTS "public"."create_organization"("org_name" "text", "org_legal_name" "text");

CREATE OR REPLACE FUNCTION "public"."create_organization"("org_name" "text", "org_legal_name" "text" DEFAULT NULL::"text")
RETURNS "jsonb"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public', 'auth'
AS $$
declare
  cfg public.platform_capacity_config;
  current_count integer;
  new_org public.organizations;
  user_email text;
  existing_waiting uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated';
  end if;

  -- Serialize concurrent admissions on the singleton config row.
  select * into cfg from public.platform_capacity_config where id = 1 for update;
  if cfg is null then
    raise exception 'capacity configuration missing';
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
    'created_at', new_org.created_at
  );
end;
$$;

CREATE OR REPLACE FUNCTION "public"."join_organization_waitlist"("requested_org_name" "text" DEFAULT NULL::"text")
RETURNS "jsonb"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public', 'auth'
AS $$
declare
  existing_waiting uuid;
  user_email text;
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated';
  end if;

  select id into existing_waiting
  from public.organization_admission_waitlist
  where user_id = auth.uid() and status = 'waiting';

  if existing_waiting is not null then
    return jsonb_build_object('status', 'already_waiting');
  end if;

  user_email := (select email from auth.users where id = auth.uid());
  insert into public.organization_admission_waitlist(user_id, email, requested_name, status, source)
  values (auth.uid(), user_email, requested_org_name, 'waiting', 'join_organization_waitlist');

  insert into public.organization_admission_log(event_type, user_id, details)
  values ('waitlist_joined', auth.uid(), jsonb_build_object(
    'requested_name', requested_org_name,
    'source', 'join_organization_waitlist'
  ));

  return jsonb_build_object('status', 'waiting');
end;
$$;

CREATE OR REPLACE FUNCTION "public"."get_organization_capacity_status"()
RETURNS "jsonb"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
declare
  cfg public.platform_capacity_config;
  current_count integer;
  waitlist_count integer;
  remaining integer;
  utilization numeric;
  threshold_status text;
begin
  if not public.is_admin_user() then
    raise exception 'admin access required';
  end if;

  select * into cfg from public.platform_capacity_config where id = 1;
  if cfg is null then
    raise exception 'capacity configuration missing';
  end if;

  select count(*) into current_count from public.organizations;
  select count(*) into waitlist_count from public.organization_admission_waitlist where status = 'waiting';

  if cfg.capacity_mode = 'unlimited' or not cfg.capacity_enforcement_enabled then
    remaining := null;
    utilization := 0;
  else
    remaining := greatest(0, cfg.capacity_limit - current_count);
    utilization := case when cfg.capacity_limit > 0 then round((current_count::numeric / cfg.capacity_limit) * 100, 2) else 0 end;
  end if;

  threshold_status := case
    when not cfg.capacity_enforcement_enabled then 'monitoring_disabled'
    when cfg.capacity_mode = 'unlimited' then 'unlimited'
    when current_count >= cfg.capacity_limit then 'full'
    when utilization >= 90 then 'near'
    when utilization >= 80 then 'approaching'
    else 'normal'
  end;

  return jsonb_build_object(
    'current', current_count,
    'limit', cfg.capacity_limit,
    'remaining', remaining,
    'is_at_capacity', (cfg.capacity_enforcement_enabled and cfg.capacity_mode <> 'unlimited' and current_count >= cfg.capacity_limit),
    'enforcement_enabled', cfg.capacity_enforcement_enabled,
    'mode', cfg.capacity_mode,
    'utilization', utilization,
    'threshold_status', threshold_status,
    'waitlist_count', waitlist_count
  );
end;
$$;

CREATE OR REPLACE FUNCTION "public"."update_capacity_config"(
  "p_capacity_limit" integer,
  "p_capacity_enforcement_enabled" boolean,
  "p_capacity_mode" text
)
RETURNS "jsonb"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
declare
  old_cfg public.platform_capacity_config;
begin
  if not public.is_admin_user() then
    raise exception 'admin access required';
  end if;

  if p_capacity_mode not in ('unlimited', 'capped', 'waitlist') then
    raise exception 'invalid capacity mode';
  end if;

  if p_capacity_limit < 0 then
    raise exception 'capacity limit cannot be negative';
  end if;

  select * into old_cfg from public.platform_capacity_config where id = 1 for update;
  if old_cfg is null then
    insert into public.platform_capacity_config(id, capacity_limit, capacity_enforcement_enabled, capacity_mode)
    values (1, p_capacity_limit, p_capacity_enforcement_enabled, p_capacity_mode);
  else
    update public.platform_capacity_config
    set capacity_limit = p_capacity_limit,
        capacity_enforcement_enabled = p_capacity_enforcement_enabled,
        capacity_mode = p_capacity_mode,
        updated_at = timezone('utc'::text, now())
    where id = 1;
  end if;

  insert into public.organization_admission_log(event_type, user_id, details)
  values ('config_changed', auth.uid(), jsonb_build_object(
    'previous_limit', old_cfg.capacity_limit,
    'previous_enforcement', old_cfg.capacity_enforcement_enabled,
    'previous_mode', old_cfg.capacity_mode,
    'new_limit', p_capacity_limit,
    'new_enforcement', p_capacity_enforcement_enabled,
    'new_mode', p_capacity_mode
  ));

  return jsonb_build_object(
    'capacity_limit', p_capacity_limit,
    'capacity_enforcement_enabled', p_capacity_enforcement_enabled,
    'capacity_mode', p_capacity_mode
  );
end;
$$;

-- Permissions: authenticated users access through the RPCs; service_role
-- can still be used for admin scripts and Supabase edges.
GRANT ALL ON TABLE "public"."platform_capacity_config" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_capacity_config" TO "service_role";
GRANT ALL ON TABLE "public"."organization_admission_waitlist" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_admission_waitlist" TO "service_role";
GRANT ALL ON TABLE "public"."organization_admission_log" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_admission_log" TO "service_role";

REVOKE ALL ON FUNCTION "public"."create_organization"("text", "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_organization"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_organization"("text", "text") TO "service_role";

REVOKE ALL ON FUNCTION "public"."join_organization_waitlist"("text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."join_organization_waitlist"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."join_organization_waitlist"("text") TO "service_role";

REVOKE ALL ON FUNCTION "public"."get_organization_capacity_status"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_organization_capacity_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_organization_capacity_status"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."update_capacity_config"(integer, boolean, text) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_capacity_config"(integer, boolean, text) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_capacity_config"(integer, boolean, text) TO "service_role";

ALTER TABLE "public"."platform_capacity_config" OWNER TO "postgres";
ALTER TABLE "public"."organization_admission_waitlist" OWNER TO "postgres";
ALTER TABLE "public"."organization_admission_log" OWNER TO "postgres";
ALTER FUNCTION "public"."create_organization"("text", "text") OWNER TO "postgres";
ALTER FUNCTION "public"."join_organization_waitlist"("text") OWNER TO "postgres";
ALTER FUNCTION "public"."get_organization_capacity_status"() OWNER TO "postgres";
ALTER FUNCTION "public"."update_capacity_config"(integer, boolean, text) OWNER TO "postgres";
