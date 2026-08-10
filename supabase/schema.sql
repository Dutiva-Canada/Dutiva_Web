


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "hypopg" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "index_advisor" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA "extensions";






CREATE TYPE "public"."signature_token_view" AS (
	"id" "uuid",
	"document_id" "uuid",
	"signer_name" "text",
	"signer_role" "text",
	"status" "text",
	"expires_at" timestamp with time zone
);


ALTER TYPE "public"."signature_token_view" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ai_recommendations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "user_id" "uuid",
    "related_document_id" "uuid",
    "related_task_id" "uuid",
    "related_finding_id" "uuid",
    "recommendation_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "rationale" "text",
    "recommended_action" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_by_ai" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "decided_at" timestamp with time zone,
    "executed_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "ai_recommendations_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "ai_recommendations_recommendation_type_check" CHECK (("recommendation_type" = ANY (ARRAY['create_task'::"text", 'review_document'::"text", 'update_policy'::"text", 'generate_document'::"text", 'invite_reviewer'::"text", 'run_assessment'::"text", 'monitor_law'::"text", 'general'::"text"]))),
    CONSTRAINT "ai_recommendations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'dismissed'::"text", 'executed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."ai_recommendations" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_ai_recommendation"("target_recommendation_id" "uuid") RETURNS "public"."ai_recommendations"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  rec public.ai_recommendations;
begin
  select * into rec from public.ai_recommendations where id = target_recommendation_id;
  if rec.id is null then raise exception 'recommendation not found'; end if;

  if not (
    public.is_admin((select auth.uid()))
    or rec.user_id = (select auth.uid())
    or public.is_org_member(rec.organization_id, (select auth.uid()))
  ) then
    raise exception 'not authorized';
  end if;

  update public.ai_recommendations
  set status = 'accepted', decided_at = timezone('utc', now())
  where id = target_recommendation_id
  returning * into rec;

  insert into public.ai_action_runs(organization_id, recommendation_id, actor_user_id, action_type, status, input)
  values (rec.organization_id, rec.id, (select auth.uid()), coalesce(rec.recommended_action->>'action_type', 'custom'), 'queued', rec.recommended_action);

  insert into public.admin_audit_log(actor_user_id, action, target_table, target_id, metadata)
  values ((select auth.uid()), 'accept_ai_recommendation', 'ai_recommendations', rec.id::text, jsonb_build_object('recommendation_type', rec.recommendation_type));

  return rec;
end;
$$;


ALTER FUNCTION "public"."accept_ai_recommendation"("target_recommendation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."acquire_cron_lock"("p_job_name" "text", "p_instance_id" "text", "p_ttl_seconds" integer DEFAULT 1800) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare
  v_now        timestamptz := timezone('utc'::text, now());
  v_expires_at timestamptz := v_now + make_interval(secs => p_ttl_seconds);
  v_owner      text;
begin
  insert into public.cron_locks (job_name, instance_id, acquired_at, expires_at)
  values (p_job_name, p_instance_id, v_now, v_expires_at)
  on conflict (job_name) do update
    set instance_id = excluded.instance_id,
        acquired_at = excluded.acquired_at,
        expires_at  = excluded.expires_at
    where public.cron_locks.expires_at < v_now
  returning instance_id into v_owner;

  return v_owner is not null and v_owner = p_instance_id;
end;
$$;


ALTER FUNCTION "public"."acquire_cron_lock"("p_job_name" "text", "p_instance_id" "text", "p_ttl_seconds" integer) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "entity_table" "text" NOT NULL,
    "entity_id" "text" NOT NULL,
    "parent_comment_id" "uuid",
    "author_user_id" "uuid",
    "body" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "comments_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'edited'::"text", 'deleted'::"text", 'resolved'::"text"])))
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_comment"("target_organization_id" "uuid", "target_entity_table" "text", "target_entity_id" "text", "comment_body" "text", "parent_id" "uuid" DEFAULT NULL::"uuid") RETURNS "public"."comments"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  comment_row public.comments;
begin
  if not (public.is_admin((select auth.uid())) or public.is_org_member(target_organization_id, (select auth.uid()))) then
    raise exception 'not authorized';
  end if;

  insert into public.comments(organization_id, entity_table, entity_id, parent_comment_id, author_user_id, body)
  values (target_organization_id, target_entity_table, target_entity_id, parent_id, (select auth.uid()), comment_body)
  returning * into comment_row;

  insert into public.activity_events(organization_id, actor_user_id, event_type, entity_table, entity_id, title, metadata)
  values (target_organization_id, (select auth.uid()), 'comment_added', target_entity_table, target_entity_id, 'Comment added', jsonb_build_object('comment_id', comment_row.id));

  return comment_row;
end;
$$;


ALTER FUNCTION "public"."add_comment"("target_organization_id" "uuid", "target_entity_table" "text", "target_entity_id" "text", "comment_body" "text", "parent_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_annotations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "document_id" "uuid" NOT NULL,
    "author_user_id" "uuid",
    "annotation_type" "text" DEFAULT 'note'::"text" NOT NULL,
    "anchor" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "body" "text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "document_annotations_annotation_type_check" CHECK (("annotation_type" = ANY (ARRAY['note'::"text", 'risk'::"text", 'suggestion'::"text", 'question'::"text", 'citation'::"text"]))),
    CONSTRAINT "document_annotations_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'resolved'::"text", 'dismissed'::"text", 'deleted'::"text"])))
);


ALTER TABLE "public"."document_annotations" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_document_annotation"("target_document_id" "uuid", "annotation_kind" "text", "annotation_body" "text", "annotation_anchor" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "public"."document_annotations"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  doc public.documents;
  annotation public.document_annotations;
begin
  select * into doc from public.documents where id = target_document_id;
  if doc.id is null then raise exception 'document not found'; end if;

  if not (public.is_admin((select auth.uid())) or doc.user_id = (select auth.uid()) or public.is_org_member(doc.organization_id, (select auth.uid()))) then
    raise exception 'not authorized';
  end if;

  insert into public.document_annotations(organization_id, document_id, author_user_id, annotation_type, anchor, body)
  values (doc.organization_id, doc.id, (select auth.uid()), annotation_kind, coalesce(annotation_anchor, '{}'::jsonb), annotation_body)
  returning * into annotation;

  insert into public.activity_events(organization_id, actor_user_id, event_type, entity_table, entity_id, title, metadata)
  values (doc.organization_id, (select auth.uid()), 'document_annotation_added', 'documents', doc.id::text, 'Document annotation added', jsonb_build_object('annotation_id', annotation.id));

  return annotation;
end;
$$;


ALTER FUNCTION "public"."add_document_annotation"("target_document_id" "uuid", "annotation_kind" "text", "annotation_body" "text", "annotation_anchor" "jsonb") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."backup_verification_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "backup_target" "text",
    "verified_at" timestamp with time zone,
    "result_summary" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "backup_verification_runs_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'running'::"text", 'passed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."backup_verification_runs" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_create_backup_verification_run"("target" "text" DEFAULT 'supabase-managed-backups'::"text") RETURNS "public"."backup_verification_runs"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  run public.backup_verification_runs;
begin
  if not public.is_admin((select auth.uid())) then raise exception 'not authorized'; end if;
  insert into public.backup_verification_runs(status, backup_target, result_summary, metadata)
  values ('queued', target, 'Backup verification queued. Requires external restore verification process.', jsonb_build_object('created_from','admin_create_backup_verification_run'))
  returning * into run;
  return run;
end;
$$;


ALTER FUNCTION "public"."admin_create_backup_verification_run"("target" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."multi_agent_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "title" "text" NOT NULL,
    "objective" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "lead_agent_id" "uuid",
    "plan_steps" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "output" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "multi_agent_plans_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'queued'::"text", 'running'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."multi_agent_plans" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_create_multi_agent_plan"("target_organization_id" "uuid", "plan_title" "text", "plan_objective" "text", "lead_agent_key" "text" DEFAULT NULL::"text") RETURNS "public"."multi_agent_plans"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  agent_id uuid;
  plan public.multi_agent_plans;
begin
  if not public.is_admin((select auth.uid())) then raise exception 'not authorized'; end if;
  if lead_agent_key is not null then select id into agent_id from public.ai_agents where key = lead_agent_key; end if;
  insert into public.multi_agent_plans(organization_id, title, objective, lead_agent_id, created_by, plan_steps)
  values (target_organization_id, plan_title, plan_objective, agent_id, (select auth.uid()), jsonb_build_array())
  returning * into plan;
  return plan;
end;
$$;


ALTER FUNCTION "public"."admin_create_multi_agent_plan"("target_organization_id" "uuid", "plan_title" "text", "plan_objective" "text", "lead_agent_key" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "agent_id" "uuid",
    "triggered_by" "uuid",
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "goal" "text",
    "input" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "output" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "agent_runs_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'running'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."agent_runs" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_list_agent_runs"("run_status" "text" DEFAULT NULL::"text") RETURNS SETOF "public"."agent_runs"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_admin((select auth.uid())) then raise exception 'not authorized'; end if;
  return query select * from public.agent_runs where run_status is null or status = run_status order by created_at desc;
end;
$$;


ALTER FUNCTION "public"."admin_list_agent_runs"("run_status" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_action_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "recommendation_id" "uuid",
    "actor_user_id" "uuid",
    "action_type" "text" NOT NULL,
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "input" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "output" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "error_message" "text",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "ai_action_runs_action_type_check" CHECK (("action_type" = ANY (ARRAY['create_task'::"text", 'create_review'::"text", 'create_document_snapshot'::"text", 'transition_document'::"text", 'record_memory'::"text", 'create_law_impact_task'::"text", 'custom'::"text"]))),
    CONSTRAINT "ai_action_runs_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'running'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."ai_action_runs" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_list_ai_action_runs"("run_status" "text" DEFAULT NULL::"text") RETURNS SETOF "public"."ai_action_runs"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_admin((select auth.uid())) then raise exception 'not authorized'; end if;
  return query select * from public.ai_action_runs where run_status is null or status = run_status order by created_at desc;
end;
$$;


ALTER FUNCTION "public"."admin_list_ai_action_runs"("run_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_list_ai_recommendations"("rec_status" "text" DEFAULT NULL::"text") RETURNS SETOF "public"."ai_recommendations"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_admin((select auth.uid())) then raise exception 'not authorized'; end if;
  return query select * from public.ai_recommendations where rec_status is null or status = rec_status order by created_at desc;
end;
$$;


ALTER FUNCTION "public"."admin_list_ai_recommendations"("rec_status" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_user_id" "uuid",
    "action" "text" NOT NULL,
    "target_table" "text",
    "target_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."admin_audit_log" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_list_audit_log"("limit_count" integer DEFAULT 100) RETURNS SETOF "public"."admin_audit_log"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'not authorized';
  end if;
  return query select * from public.admin_audit_log order by created_at desc limit least(greatest(limit_count, 1), 500);
end;
$$;


ALTER FUNCTION "public"."admin_list_audit_log"("limit_count" integer) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."beta_signups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "name" "text",
    "company" "text",
    "team_size" "text",
    "province" "text",
    "role" "text",
    "hr_challenge" "text",
    "source" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "status" "text" DEFAULT 'new'::"text",
    "internal_notes" "text",
    "language" "text",
    "consent_granted" boolean,
    "consent_text" "text",
    "consent_at" timestamp with time zone,
    CONSTRAINT "beta_signups_language_check" CHECK ((("language" IS NULL) OR ("language" = ANY (ARRAY['en'::"text", 'fr'::"text"]))))
);


ALTER TABLE "public"."beta_signups" OWNER TO "postgres";


COMMENT ON COLUMN "public"."beta_signups"."consent_granted" IS 'CASL express consent. NULL = signed up before consent was recorded; consent was enforced at submission but is not evidenced.';



COMMENT ON COLUMN "public"."beta_signups"."consent_text" IS 'Verbatim wording the signer agreed to, in the language shown. Stored literally so later copy edits cannot rewrite what past signups consented to.';



COMMENT ON COLUMN "public"."beta_signups"."consent_at" IS 'When consent was given.';



CREATE OR REPLACE FUNCTION "public"."admin_list_beta_signups"() RETURNS SETOF "public"."beta_signups"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'not authorized';
  end if;
  return query select * from public.beta_signups order by created_at desc nulls last;
end;
$$;


ALTER FUNCTION "public"."admin_list_beta_signups"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."compliance_findings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assessment_id" "uuid",
    "organization_id" "uuid",
    "document_id" "uuid",
    "source_chunk_id" "uuid",
    "severity" "text" DEFAULT 'medium'::"text" NOT NULL,
    "category" "text" DEFAULT 'general'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "recommendation" "text",
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "resolved_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "compliance_findings_severity_check" CHECK (("severity" = ANY (ARRAY['info'::"text", 'low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "compliance_findings_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'accepted'::"text", 'in_progress'::"text", 'resolved'::"text", 'dismissed'::"text"])))
);


ALTER TABLE "public"."compliance_findings" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_list_compliance_findings"("finding_status" "text" DEFAULT NULL::"text") RETURNS SETOF "public"."compliance_findings"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_admin((select auth.uid())) then raise exception 'not authorized'; end if;
  return query select * from public.compliance_findings where finding_status is null or status = finding_status order by created_at desc;
end;
$$;


ALTER FUNCTION "public"."admin_list_compliance_findings"("finding_status" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."compliance_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "document_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "jurisdiction" "text",
    "category" "text" DEFAULT 'general'::"text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "assigned_to" "uuid",
    "created_by" "uuid",
    "due_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "compliance_tasks_category_check" CHECK (("category" = ANY (ARRAY['general'::"text", 'document'::"text", 'onboarding'::"text", 'policy'::"text", 'law_update'::"text", 'renewal'::"text", 'signature'::"text", 'review'::"text"]))),
    CONSTRAINT "compliance_tasks_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "compliance_tasks_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'blocked'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."compliance_tasks" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_list_compliance_tasks"("task_status" "text" DEFAULT NULL::"text") RETURNS SETOF "public"."compliance_tasks"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_admin((select auth.uid())) then raise exception 'not authorized'; end if;
  return query
  select * from public.compliance_tasks
  where task_status is null or status = task_status
  order by due_at asc nulls last, created_at desc;
end;
$$;


ALTER FUNCTION "public"."admin_list_compliance_tasks"("task_status" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."external_integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "provider" "text" NOT NULL,
    "integration_type" "text" DEFAULT 'api'::"text" NOT NULL,
    "status" "text" DEFAULT 'inactive'::"text" NOT NULL,
    "display_name" "text",
    "external_account_id" "text",
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "secret_ref" "text",
    "last_synced_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "external_integrations_integration_type_check" CHECK (("integration_type" = ANY (ARRAY['api'::"text", 'oauth'::"text", 'webhook'::"text", 'manual'::"text"]))),
    CONSTRAINT "external_integrations_provider_check" CHECK (("provider" = ANY (ARRAY['stripe'::"text", 'sendgrid'::"text", 'resend'::"text", 'slack'::"text", 'teams'::"text", 'google'::"text", 'microsoft'::"text", 'webhook'::"text", 'custom'::"text"]))),
    CONSTRAINT "external_integrations_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'error'::"text", 'revoked'::"text"])))
);


ALTER TABLE "public"."external_integrations" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_list_integrations"() RETURNS SETOF "public"."external_integrations"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_admin((select auth.uid())) then raise exception 'not authorized'; end if;
  return query select * from public.external_integrations order by created_at desc;
end;
$$;


ALTER FUNCTION "public"."admin_list_integrations"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "job_type" "text" NOT NULL,
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "priority" integer DEFAULT 100 NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "attempts" integer DEFAULT 0 NOT NULL,
    "max_attempts" integer DEFAULT 3 NOT NULL,
    "locked_by" "text",
    "locked_at" timestamp with time zone,
    "run_after" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "last_error" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "job_queue_attempts_check" CHECK (("attempts" >= 0)),
    CONSTRAINT "job_queue_job_type_check" CHECK (("job_type" = ANY (ARRAY['ai_action'::"text", 'law_scan'::"text", 'embedding_generation'::"text", 'compliance_assessment'::"text", 'document_review'::"text", 'notification'::"text", 'billing_sync'::"text", 'custom'::"text"]))),
    CONSTRAINT "job_queue_max_attempts_check" CHECK (("max_attempts" > 0)),
    CONSTRAINT "job_queue_priority_check" CHECK ((("priority" >= 1) AND ("priority" <= 1000))),
    CONSTRAINT "job_queue_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'locked'::"text", 'running'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text", 'dead_letter'::"text"])))
);


ALTER TABLE "public"."job_queue" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_list_jobs"("job_status" "text" DEFAULT NULL::"text") RETURNS SETOF "public"."job_queue"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_admin((select auth.uid())) then raise exception 'not authorized'; end if;
  return query select * from public.job_queue where job_status is null or status = job_status order by priority asc, created_at desc;
end;
$$;


ALTER FUNCTION "public"."admin_list_jobs"("job_status" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."law_change_impacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "law_update_id" "uuid",
    "organization_id" "uuid",
    "document_id" "uuid",
    "template_id" "uuid",
    "impact_type" "text" DEFAULT 'review_required'::"text" NOT NULL,
    "severity" "text" DEFAULT 'medium'::"text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "summary" "text",
    "recommendation" "text",
    "detected_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "resolved_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "law_change_impacts_impact_type_check" CHECK (("impact_type" = ANY (ARRAY['review_required'::"text", 'document_update'::"text", 'policy_update'::"text", 'template_update'::"text", 'training_required'::"text", 'no_action'::"text"]))),
    CONSTRAINT "law_change_impacts_severity_check" CHECK (("severity" = ANY (ARRAY['info'::"text", 'low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "law_change_impacts_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'reviewing'::"text", 'task_created'::"text", 'resolved'::"text", 'dismissed'::"text"])))
);


ALTER TABLE "public"."law_change_impacts" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_list_law_change_impacts"("impact_status" "text" DEFAULT NULL::"text") RETURNS SETOF "public"."law_change_impacts"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_admin((select auth.uid())) then raise exception 'not authorized'; end if;
  return query select * from public.law_change_impacts where impact_status is null or status = impact_status order by detected_at desc;
end;
$$;


ALTER FUNCTION "public"."admin_list_law_change_impacts"("impact_status" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."law_updates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "jurisdiction" "text" NOT NULL,
    "law_name" "text" NOT NULL,
    "url" "text" NOT NULL,
    "content_hash" "text",
    "change_summary" "text",
    "raw_diff" "text",
    "detected_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "is_new" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "event_type" "text" DEFAULT 'change'::"text",
    "review_status" "text" DEFAULT 'machine_curated'::"text" NOT NULL,
    CONSTRAINT "law_updates_event_type_check" CHECK (("event_type" = ANY (ARRAY['change'::"text", 'redirect'::"text", 'broken'::"text", 'first_seen'::"text"]))),
    CONSTRAINT "law_updates_review_status_check" CHECK (("review_status" = ANY (ARRAY['machine_curated'::"text", 'reviewed'::"text"])))
);


ALTER TABLE "public"."law_updates" OWNER TO "postgres";


COMMENT ON COLUMN "public"."law_updates"."event_type" IS 'Type of monitoring event: change (content diff), redirect (URL moved), broken (persistent 404/5xx), first_seen (baseline)';



COMMENT ON COLUMN "public"."law_updates"."review_status" IS 'machine_curated (default) or reviewed. Only a human flips a row to reviewed; send-law-updates only digests reviewed rows.';



CREATE OR REPLACE FUNCTION "public"."admin_list_law_updates"() RETURNS SETOF "public"."law_updates"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'not authorized';
  end if;
  return query select * from public.law_updates order by detected_at desc nulls last, created_at desc nulls last;
end;
$$;


ALTER FUNCTION "public"."admin_list_law_updates"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."legal_ingestion_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_id" "uuid",
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "documents_found" integer DEFAULT 0 NOT NULL,
    "chunks_created" integer DEFAULT 0 NOT NULL,
    "impacts_created" integer DEFAULT 0 NOT NULL,
    "error_message" "text",
    "output" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "legal_ingestion_runs_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'running'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."legal_ingestion_runs" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_list_legal_ingestion_runs"("run_status" "text" DEFAULT NULL::"text") RETURNS SETOF "public"."legal_ingestion_runs"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_admin((select auth.uid())) then raise exception 'not authorized'; end if;
  return query select * from public.legal_ingestion_runs where run_status is null or status = run_status order by created_at desc;
end;
$$;


ALTER FUNCTION "public"."admin_list_legal_ingestion_runs"("run_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_list_organizations"() RETURNS TABLE("organization_id" "uuid", "name" "text", "legal_name" "text", "plan" "text", "subscription_status" "text", "billing_period" "text", "member_count" bigint, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'not authorized';
  end if;

  return query
  select
    o.id,
    o.name,
    o.legal_name,
    o.plan,
    o.subscription_status,
    o.billing_period,
    count(om.id)::bigint,
    o.created_at
  from public.organizations o
  left join public.organization_members om on om.organization_id = o.id and om.status = 'active'
  group by o.id
  order by o.created_at desc;
end;
$$;


ALTER FUNCTION "public"."admin_list_organizations"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."policy_gap_analyses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "jurisdiction" "text",
    "analysis_type" "text" DEFAULT 'organization'::"text" NOT NULL,
    "target_table" "text",
    "target_id" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "summary" "text",
    "missing_items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "recommended_actions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "policy_gap_analyses_analysis_type_check" CHECK (("analysis_type" = ANY (ARRAY['organization'::"text", 'document'::"text", 'template'::"text", 'onboarding'::"text"]))),
    CONSTRAINT "policy_gap_analyses_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'reviewed'::"text", 'accepted'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."policy_gap_analyses" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_list_policy_gap_analyses"("analysis_status" "text" DEFAULT NULL::"text") RETURNS SETOF "public"."policy_gap_analyses"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_admin((select auth.uid())) then raise exception 'not authorized'; end if;
  return query select * from public.policy_gap_analyses where analysis_status is null or status = analysis_status order by created_at desc;
end;
$$;


ALTER FUNCTION "public"."admin_list_policy_gap_analyses"("analysis_status" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."predictive_risk_forecasts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "forecast_type" "text" NOT NULL,
    "forecast_window_days" integer DEFAULT 30 NOT NULL,
    "risk_score" numeric(5,2),
    "risk_level" "text" DEFAULT 'unknown'::"text" NOT NULL,
    "summary" "text",
    "drivers" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "recommended_actions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "generated_by" "text" DEFAULT 'system'::"text" NOT NULL,
    "generated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "predictive_risk_forecasts_forecast_type_check" CHECK (("forecast_type" = ANY (ARRAY['compliance_risk'::"text", 'task_overdue_risk'::"text", 'document_staleness'::"text", 'policy_gap'::"text", 'onboarding_delay'::"text", 'operational_bottleneck'::"text"]))),
    CONSTRAINT "predictive_risk_forecasts_forecast_window_days_check" CHECK (("forecast_window_days" > 0)),
    CONSTRAINT "predictive_risk_forecasts_generated_by_check" CHECK (("generated_by" = ANY (ARRAY['system'::"text", 'ai'::"text", 'admin'::"text"]))),
    CONSTRAINT "predictive_risk_forecasts_risk_level_check" CHECK (("risk_level" = ANY (ARRAY['unknown'::"text", 'low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "predictive_risk_forecasts_risk_score_check" CHECK ((("risk_score" IS NULL) OR (("risk_score" >= (0)::numeric) AND ("risk_score" <= (100)::numeric))))
);


ALTER TABLE "public"."predictive_risk_forecasts" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_list_risk_forecasts"("forecast_kind" "text" DEFAULT NULL::"text") RETURNS SETOF "public"."predictive_risk_forecasts"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_admin((select auth.uid())) then raise exception 'not authorized'; end if;
  return query
  select * from public.predictive_risk_forecasts
  where forecast_kind is null or forecast_type = forecast_kind
  order by generated_at desc;
end;
$$;


ALTER FUNCTION "public"."admin_list_risk_forecasts"("forecast_kind" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_list_users"() RETURNS TABLE("user_id" "uuid", "email" "text", "created_at" timestamp with time zone, "last_sign_in_at" timestamp with time zone, "company_name" "text", "plan" "text", "subscription_status" "text", "billing_period" "text", "roles" "text"[])
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'not authorized';
  end if;

  return query
  select
    u.id,
    u.email::text,
    u.created_at,
    u.last_sign_in_at,
    p.company_name,
    p.plan,
    p.subscription_status,
    p.billing_period,
    coalesce(array_agg(ur.role order by ur.role) filter (where ur.role is not null), array[]::text[]) as roles
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join public.user_roles ur on ur.user_id = u.id
  group by u.id, u.email, u.created_at, u.last_sign_in_at, p.company_name, p.plan, p.subscription_status, p.billing_period
  order by u.created_at desc;
end;
$$;


ALTER FUNCTION "public"."admin_list_users"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspace_intelligence_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "item_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text",
    "severity" "text" DEFAULT 'info'::"text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "related_entity_table" "text",
    "related_entity_id" "text",
    "generated_by" "text" DEFAULT 'system'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "workspace_intelligence_items_generated_by_check" CHECK (("generated_by" = ANY (ARRAY['system'::"text", 'ai'::"text", 'admin'::"text", 'user'::"text"]))),
    CONSTRAINT "workspace_intelligence_items_item_type_check" CHECK (("item_type" = ANY (ARRAY['insight'::"text", 'risk'::"text", 'opportunity'::"text", 'trend'::"text", 'bottleneck'::"text", 'recommendation'::"text", 'summary'::"text"]))),
    CONSTRAINT "workspace_intelligence_items_severity_check" CHECK (("severity" = ANY (ARRAY['info'::"text", 'low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "workspace_intelligence_items_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'acknowledged'::"text", 'resolved'::"text", 'dismissed'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."workspace_intelligence_items" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_list_workspace_intelligence"("item_status" "text" DEFAULT NULL::"text") RETURNS SETOF "public"."workspace_intelligence_items"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_admin((select auth.uid())) then raise exception 'not authorized'; end if;
  return query
  select * from public.workspace_intelligence_items
  where item_status is null or status = item_status
  order by created_at desc;
end;
$$;


ALTER FUNCTION "public"."admin_list_workspace_intelligence"("item_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_reporting_overview"() RETURNS TABLE("total_organizations" bigint, "active_organizations" bigint, "total_jobs" bigint, "failed_jobs" bigint, "pending_ai_recommendations" bigint, "open_findings" bigint, "overdue_tasks" bigint)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_admin((select auth.uid())) then raise exception 'not authorized'; end if;

  return query
  select
    (select count(*) from public.organizations),
    (select count(*) from public.organizations where subscription_status in ('active','trialing')),
    (select count(*) from public.job_queue),
    (select count(*) from public.job_queue where status in ('failed','dead_letter')),
    (select count(*) from public.ai_recommendations where status = 'pending'),
    (select count(*) from public.compliance_findings where status in ('open','in_progress')),
    (select count(*) from public.compliance_tasks where status not in ('completed','cancelled') and due_at < timezone('utc', now()));
end;
$$;


ALTER FUNCTION "public"."admin_reporting_overview"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_runtime_overview"() RETURNS TABLE("queued_jobs" bigint, "running_jobs" bigint, "dead_letter_jobs" bigint, "failed_traces" bigint, "ai_events_today" bigint, "avg_ai_latency_ms" numeric)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_admin((select auth.uid())) then raise exception 'not authorized'; end if;

  return query
  select
    (select count(*) from public.job_queue where status = 'queued'),
    (select count(*) from public.job_queue where status in ('locked','running')),
    (select count(*) from public.job_queue where status = 'dead_letter'),
    (select count(*) from public.execution_traces where status = 'failed'),
    (select count(*) from public.ai_telemetry_events where created_at >= date_trunc('day', timezone('utc', now()))),
    (select avg(latency_ms)::numeric from public.ai_telemetry_events where created_at >= date_trunc('day', timezone('utc', now())) and latency_ms is not null);
end;
$$;


ALTER FUNCTION "public"."admin_runtime_overview"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_update_beta_signup_status"("signup_id" "uuid", "new_status" "text", "notes" "text" DEFAULT NULL::"text") RETURNS "public"."beta_signups"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  updated_signup public.beta_signups;
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'not authorized';
  end if;

  update public.beta_signups
  set status = new_status,
      internal_notes = coalesce(notes, internal_notes)
  where id = signup_id
  returning * into updated_signup;

  if updated_signup.id is null then
    raise exception 'beta signup not found';
  end if;

  insert into public.admin_audit_log(actor_user_id, action, target_table, target_id, metadata)
  values ((select auth.uid()), 'admin_update_beta_signup_status', 'beta_signups', signup_id::text, jsonb_build_object('status', new_status));

  return updated_signup;
end;
$$;


ALTER FUNCTION "public"."admin_update_beta_signup_status"("signup_id" "uuid", "new_status" "text", "notes" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "account_email" "text",
    "primary_email" "text" DEFAULT 'info@dutiva.ca'::"text" NOT NULL,
    "company_name" "text" DEFAULT 'Dutiva Canada'::"text" NOT NULL,
    "legal_name" "text" DEFAULT 'Dutiva Canada Inc.'::"text" NOT NULL,
    "website" "text" DEFAULT 'dutiva.ca'::"text" NOT NULL,
    "province" "text" DEFAULT 'Ontario'::"text" NOT NULL,
    "city" "text" DEFAULT 'Ottawa'::"text" NOT NULL,
    "primary_contact" "text" DEFAULT 'Martin Constantineau'::"text" NOT NULL,
    "company_size" "text" DEFAULT '1-10'::"text" NOT NULL,
    "language_default" "text" DEFAULT 'English'::"text" NOT NULL,
    "theme_default" "text" DEFAULT 'Dark'::"text" NOT NULL,
    "compliance_mode" "text" DEFAULT 'Canadian SMB'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "stripe_customer_id" "text",
    "plan" "text" DEFAULT 'free'::"text" NOT NULL,
    "subscription_status" "text" DEFAULT 'inactive'::"text" NOT NULL,
    "billing_period" "text" DEFAULT 'monthly'::"text" NOT NULL,
    "stripe_subscription_id" "text",
    CONSTRAINT "profiles_billing_period_check" CHECK (("billing_period" = ANY (ARRAY['monthly'::"text", 'annual'::"text"]))),
    CONSTRAINT "profiles_company_size_check" CHECK (("company_size" = ANY (ARRAY['1-10'::"text", '11-50'::"text", '51-200'::"text", '200+'::"text"]))),
    CONSTRAINT "profiles_compliance_mode_check" CHECK (("compliance_mode" = ANY (ARRAY['Canadian SMB'::"text", 'Multi-province employer'::"text", 'Custom'::"text"]))),
    CONSTRAINT "profiles_language_default_check" CHECK (("language_default" = ANY (ARRAY['English'::"text", 'French'::"text", 'Bilingual'::"text"]))),
    CONSTRAINT "profiles_plan_check" CHECK (("plan" = ANY (ARRAY['free'::"text", 'starter'::"text", 'growth'::"text", 'pro'::"text", 'advanced'::"text", 'enterprise'::"text"]))),
    CONSTRAINT "profiles_subscription_status_check" CHECK (("subscription_status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'past_due'::"text", 'canceled'::"text", 'trialing'::"text"]))),
    CONSTRAINT "profiles_theme_default_check" CHECK (("theme_default" = ANY (ARRAY['Dark'::"text", 'Light'::"text", 'System'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_update_user_plan"("target_user_id" "uuid", "new_plan" "text", "new_subscription_status" "text" DEFAULT NULL::"text", "new_billing_period" "text" DEFAULT NULL::"text") RETURNS "public"."profiles"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  updated_profile public.profiles;
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'not authorized';
  end if;

  if new_plan not in ('free','growth','advanced') then
    raise exception 'invalid plan';
  end if;

  if new_subscription_status is not null and new_subscription_status not in ('active','inactive','past_due','canceled','trialing') then
    raise exception 'invalid subscription status';
  end if;

  if new_billing_period is not null and new_billing_period not in ('monthly','annual') then
    raise exception 'invalid billing period';
  end if;

  update public.profiles
  set
    plan = new_plan,
    subscription_status = coalesce(new_subscription_status, subscription_status),
    billing_period = coalesce(new_billing_period, billing_period),
    updated_at = timezone('utc', now())
  where id = target_user_id
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'profile not found';
  end if;

  insert into public.admin_audit_log(actor_user_id, action, target_table, target_id, metadata)
  values ((select auth.uid()), 'admin_update_user_plan', 'profiles', target_user_id::text, jsonb_build_object('plan', new_plan, 'subscription_status', new_subscription_status, 'billing_period', new_billing_period));

  return updated_profile;
end;
$$;


ALTER FUNCTION "public"."admin_update_user_plan"("target_user_id" "uuid", "new_plan" "text", "new_subscription_status" "text", "new_billing_period" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_usage_summary"("days_back" integer DEFAULT 30) RETURNS TABLE("user_id" "uuid", "event_type" "text", "total_quantity" bigint, "event_count" bigint, "first_event_at" timestamp with time zone, "last_event_at" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'not authorized';
  end if;

  return query
  select
    ue.user_id,
    ue.event_type,
    sum(ue.quantity)::bigint,
    count(*)::bigint,
    min(ue.created_at),
    max(ue.created_at)
  from public.usage_events ue
  where ue.created_at >= timezone('utc', now()) - make_interval(days => greatest(days_back, 1))
  group by ue.user_id, ue.event_type
  order by max(ue.created_at) desc;
end;
$$;


ALTER FUNCTION "public"."admin_usage_summary"("days_back" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."archive_old_document_versions"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    archived_count INTEGER := 0;
BEGIN
    UPDATE public.documents
    SET 
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('archived_at', now()),
        updated_at = now()
    WHERE status = 'signed'
    AND created_at < now() - interval '7 years'
    AND (metadata->>'archived_at') IS NULL;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    IF archived_count > 0 THEN
        INSERT INTO public.admin_activity_log (action, entity_type, entity_id, details)
        VALUES (
            'data_retention_cleanup',
            'documents',
            NULL,
            jsonb_build_object(
                'archived_count', archived_count,
                'job_type', 'old_document_archive',
                'retention_period', '7 years',
                'run_at', now()
            )
        );
    END IF;
    
    RETURN archived_count;
END;
$$;


ALTER FUNCTION "public"."archive_old_document_versions"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."archive_old_document_versions"() IS 'Archives document versions older than retention period. Run via pg_cron or manually.';



CREATE OR REPLACE FUNCTION "public"."attachment_scan_status"() RETURNS TABLE("secret_configured" boolean, "job_scheduled" boolean, "pending_count" bigint, "flagged_count" bigint, "skipped_count" bigint, "oldest_pending_at" timestamp with time zone, "last_scanned_at" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
  select
    exists (select 1 from vault.decrypted_secrets where name = 'support_notify_secret'),
    exists (select 1 from cron.job where jobname = 'support-attachment-scan' and active),
    (select count(*) from public.support_attachments where scan_status = 'pending'),
    (select count(*) from public.support_attachments where scan_status = 'flagged'),
    (select count(*) from public.support_attachments where scan_status = 'skipped'),
    (select min(created_at) from public.support_attachments where scan_status = 'pending'),
    (select max(scanned_at) from public.support_attachments);
$$;


ALTER FUNCTION "public"."attachment_scan_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_increment_version"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  select coalesce(max(version_number), 0) + 1
  into new.version_number
  from public.template_versions
  where template_id = new.template_id;

  update public.template_versions
  set is_current = false
  where template_id = new.template_id and is_current = true;

  new.is_current := true;
  return new;
end;
$$;


ALTER FUNCTION "public"."auto_increment_version"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_maturity_scores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "score" numeric(5,2),
    "level" "text" DEFAULT 'unknown'::"text" NOT NULL,
    "summary" "text",
    "evidence" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "recommendations" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "calculated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "organization_maturity_scores_category_check" CHECK (("category" = ANY (ARRAY['hr_foundation'::"text", 'document_governance'::"text", 'compliance_operations'::"text", 'onboarding'::"text", 'policy_management'::"text", 'ai_readiness'::"text", 'overall'::"text"]))),
    CONSTRAINT "organization_maturity_scores_level_check" CHECK (("level" = ANY (ARRAY['unknown'::"text", 'early'::"text", 'developing'::"text", 'managed'::"text", 'advanced'::"text", 'optimized'::"text"]))),
    CONSTRAINT "organization_maturity_scores_score_check" CHECK ((("score" IS NULL) OR (("score" >= (0)::numeric) AND ("score" <= (100)::numeric))))
);


ALTER TABLE "public"."organization_maturity_scores" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_basic_maturity_score"("target_organization_id" "uuid", "maturity_category" "text" DEFAULT 'overall'::"text") RETURNS "public"."organization_maturity_scores"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  score_row public.organization_maturity_scores;
  docs_count int;
  tasks_count int;
  findings_count int;
  reviews_count int;
  score_value numeric(5,2);
  level_value text;
begin
  if not (public.is_admin((select auth.uid())) or public.is_org_member(target_organization_id, (select auth.uid()))) then
    raise exception 'not authorized';
  end if;

  select count(*) into docs_count from public.documents where organization_id = target_organization_id;
  select count(*) into tasks_count from public.compliance_tasks where organization_id = target_organization_id;
  select count(*) into findings_count from public.compliance_findings where organization_id = target_organization_id and status in ('open','in_progress');
  select count(*) into reviews_count from public.document_reviews where organization_id = target_organization_id;

  score_value := least(100, greatest(0, 20 + (docs_count * 8) + (tasks_count * 4) + (reviews_count * 5) - (findings_count * 6)));
  level_value := case
    when score_value < 30 then 'early'
    when score_value < 50 then 'developing'
    when score_value < 70 then 'managed'
    when score_value < 90 then 'advanced'
    else 'optimized'
  end;

  insert into public.organization_maturity_scores(
    organization_id, category, score, level, summary, evidence, recommendations
  ) values (
    target_organization_id,
    maturity_category,
    score_value,
    level_value,
    'Basic maturity score generated from document, task, review, and finding activity.',
    jsonb_build_array(
      jsonb_build_object('documents', docs_count),
      jsonb_build_object('tasks', tasks_count),
      jsonb_build_object('open_findings', findings_count),
      jsonb_build_object('reviews', reviews_count)
    ),
    jsonb_build_array('Review open findings', 'Keep documents versioned and approved', 'Track compliance tasks to completion')
  ) returning * into score_row;

  return score_row;
end;
$$;


ALTER FUNCTION "public"."calculate_basic_maturity_score"("target_organization_id" "uuid", "maturity_category" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancel_signature_for_owner"("p_signature_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_sig public.signatures;
BEGIN
  SELECT *
  INTO v_sig
  FROM public.signatures
  WHERE id = p_signature_id
    AND user_id = auth.uid()
  LIMIT 1;

  IF v_sig.id IS NULL THEN
    RAISE EXCEPTION 'Signing request not found.';
  END IF;

  IF v_sig.status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending signing requests can be cancelled.';
  END IF;

  UPDATE public.signatures
  SET status = 'cancelled'
  WHERE id = v_sig.id
    AND user_id = auth.uid()
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Signing request could not be cancelled.';
  END IF;

  INSERT INTO public.signature_audit_events (signature_id, document_id, user_id, event_type)
  VALUES (v_sig.id, v_sig.document_id, v_sig.user_id, 'signature_cancelled');
END;
$$;


ALTER FUNCTION "public"."cancel_signature_for_owner"("p_signature_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_and_increment_usage_counter"("p_user_id" "uuid", "p_period_start" "date", "p_action" "text", "p_limit" integer) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_used integer;
begin
  if p_user_id is null then
    raise exception 'Missing usage counter user id.';
  end if;

  if p_period_start is null then
    raise exception 'Missing usage counter period start.';
  end if;

  if p_limit is null or p_limit < 0 then
    raise exception 'Usage limit must be a non-negative integer.';
  end if;

  insert into public.usage_counters (user_id, period_start)
  values (p_user_id, p_period_start)
  on conflict (user_id, period_start) do nothing;

  case p_action
    when 'advisor_messages' then
      update public.usage_counters
        set advisor_messages_used = advisor_messages_used + 1,
            updated_at = timezone('utc', now())
        where user_id = p_user_id
          and period_start = p_period_start
          and advisor_messages_used < p_limit
        returning advisor_messages_used into v_used;

    when 'documents_generated' then
      update public.usage_counters
        set documents_generated = documents_generated + 1,
            updated_at = timezone('utc', now())
        where user_id = p_user_id
          and period_start = p_period_start
          and documents_generated < p_limit
        returning documents_generated into v_used;

    when 'documents_saved' then
      update public.usage_counters
        set documents_saved = documents_saved + 1,
            updated_at = timezone('utc', now())
        where user_id = p_user_id
          and period_start = p_period_start
          and documents_saved < p_limit
        returning documents_saved into v_used;

    when 'exports' then
      update public.usage_counters
        set exports_used = exports_used + 1,
            updated_at = timezone('utc', now())
        where user_id = p_user_id
          and period_start = p_period_start
          and exports_used < p_limit
        returning exports_used into v_used;

    when 'compliance_reviews' then
      update public.usage_counters
        set compliance_reviews = compliance_reviews + 1,
            updated_at = timezone('utc', now())
        where user_id = p_user_id
          and period_start = p_period_start
          and compliance_reviews < p_limit
        returning compliance_reviews into v_used;

    when 'e_signature_sends' then
      update public.usage_counters
        set e_signature_sends = e_signature_sends + 1,
            updated_at = timezone('utc', now())
        where user_id = p_user_id
          and period_start = p_period_start
          and e_signature_sends < p_limit
        returning e_signature_sends into v_used;

    else
      raise exception 'Unknown usage action: %', p_action;
  end case;

  if found then
    return jsonb_build_object('allowed', true, 'used', v_used, 'limit', p_limit);
  end if;

  case p_action
    when 'advisor_messages' then
      select advisor_messages_used into v_used
      from public.usage_counters
      where user_id = p_user_id and period_start = p_period_start;

    when 'documents_generated' then
      select documents_generated into v_used
      from public.usage_counters
      where user_id = p_user_id and period_start = p_period_start;

    when 'documents_saved' then
      select documents_saved into v_used
      from public.usage_counters
      where user_id = p_user_id and period_start = p_period_start;

    when 'exports' then
      select exports_used into v_used
      from public.usage_counters
      where user_id = p_user_id and period_start = p_period_start;

    when 'compliance_reviews' then
      select compliance_reviews into v_used
      from public.usage_counters
      where user_id = p_user_id and period_start = p_period_start;

    when 'e_signature_sends' then
      select e_signature_sends into v_used
      from public.usage_counters
      where user_id = p_user_id and period_start = p_period_start;
  end case;

  return jsonb_build_object('allowed', false, 'used', coalesce(v_used, 0), 'limit', p_limit);
end;
$$;


ALTER FUNCTION "public"."check_and_increment_usage_counter"("p_user_id" "uuid", "p_period_start" "date", "p_action" "text", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claim_ai_usage"("p_user_id" "uuid", "p_operation" "text", "p_organization_id" "uuid", "p_provider" "text", "p_model" "text", "p_burst_window_seconds" integer, "p_burst_limit" integer, "p_daily_request_limit" integer, "p_daily_token_limit" bigint, "p_platform_daily_limit" integer, "p_metered_operations" "text"[]) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_now timestamptz := now();
  v_burst_since timestamptz := v_now - make_interval(secs => greatest(p_burst_window_seconds, 1));
  v_day_since timestamptz := v_now - interval '24 hours';
  v_count integer;
  v_tokens bigint;
  v_oldest timestamptz;
  v_org uuid;
  v_claim uuid;
begin
  if p_user_id is null then
    return jsonb_build_object('allowed', false, 'scope', 'unauthenticated');
  end if;

  -- Single constant lock key: the platform ceiling is a global count, so a
  -- per-user lock would leave exactly that ceiling raceable. Held only for
  -- this counting transaction, never across the upstream model call.
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

  -- Daily requests: this user, rolling 24h, across every metered operation.
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

  -- Daily tokens: request count alone does not bound cost.
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

  -- Platform ceiling: last, so a caller learns they personally are fine
  -- before being told the project is saturated.
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

  -- A client-supplied organization_id that does not resolve must not fail the
  -- claim — drop the attribution, keep the call.
  select id into v_org from public.organizations where id = p_organization_id;

  insert into public.ai_telemetry_events
    (organization_id, user_id, provider, model, operation, status)
  values
    (v_org, p_user_id, p_provider, p_model, p_operation, 'started')
  returning id into v_claim;

  return jsonb_build_object('allowed', true, 'claim_id', v_claim);
end;
$$;


ALTER FUNCTION "public"."claim_ai_usage"("p_user_id" "uuid", "p_operation" "text", "p_organization_id" "uuid", "p_provider" "text", "p_model" "text", "p_burst_window_seconds" integer, "p_burst_limit" integer, "p_daily_request_limit" integer, "p_daily_token_limit" bigint, "p_platform_daily_limit" integer, "p_metered_operations" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claim_export_slot"("p_user_id" "uuid", "p_surface" "text", "p_kind" "text", "p_title" "text", "p_sha256" "text", "p_content_chars" integer, "p_lang" "text", "p_burst_window_seconds" integer, "p_burst_limit" integer, "p_daily_limit" integer) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_now timestamptz := now();
  v_burst_since timestamptz := v_now - make_interval(secs => greatest(p_burst_window_seconds, 1));
  v_day_since timestamptz := v_now - interval '24 hours';
  v_count integer;
  v_oldest timestamptz;
  v_id uuid;
begin
  if p_user_id is null then
    return jsonb_build_object('allowed', false, 'scope', 'unauthenticated');
  end if;

  perform pg_advisory_xact_lock(hashtext('export_claim'));

  -- Burst: the scripted / button-hammering shape.
  select count(*), min(created_at) into v_count, v_oldest
    from public.export_events
    where user_id = p_user_id
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

  -- Rolling daily ceiling: the walk-out-with-the-library shape. One budget
  -- across every surface — moving between Document Studio and Memory must
  -- not double it.
  select count(*), min(created_at) into v_count, v_oldest
    from public.export_events
    where user_id = p_user_id
      and created_at >= v_day_since;
  if v_count >= greatest(p_daily_limit, 1) then
    return jsonb_build_object(
      'allowed', false,
      'scope', 'daily',
      'limit', p_daily_limit,
      'used', v_count,
      'retry_after_seconds',
        greatest(1, ceil(extract(epoch from (v_oldest + interval '24 hours' - v_now)))::integer)
    );
  end if;

  insert into public.export_events
    (user_id, surface, kind, title, content_sha256, content_chars, lang)
  values
    (p_user_id, p_surface, p_kind, left(coalesce(p_title, ''), 200), p_sha256,
     greatest(coalesce(p_content_chars, 0), 0), p_lang)
  returning id into v_id;

  return jsonb_build_object('allowed', true, 'export_id', v_id);
end;
$$;


ALTER FUNCTION "public"."claim_export_slot"("p_user_id" "uuid", "p_surface" "text", "p_kind" "text", "p_title" "text", "p_sha256" "text", "p_content_chars" integer, "p_lang" "text", "p_burst_window_seconds" integer, "p_burst_limit" integer, "p_daily_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claim_next_job"("worker_id" "text", "allowed_job_types" "text"[] DEFAULT NULL::"text"[]) RETURNS "public"."job_queue"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  job public.job_queue;
begin
  select * into job
  from public.job_queue
  where status = 'queued'
    and run_after <= timezone('utc', now())
    and (allowed_job_types is null or job_type = any(allowed_job_types))
  order by priority asc, created_at asc
  for update skip locked
  limit 1;

  if job.id is null then
    return null;
  end if;

  update public.job_queue
  set status = 'locked', locked_by = worker_id, locked_at = timezone('utc', now()), attempts = attempts + 1, updated_at = timezone('utc', now())
  where id = job.id
  returning * into job;

  insert into public.job_attempts(job_id, attempt_number, worker_id, status)
  values (job.id, job.attempts, worker_id, 'started');

  return job;
end;
$$;


ALTER FUNCTION "public"."claim_next_job"("worker_id" "text", "allowed_job_types" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_activity_logs"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    DELETE FROM public.admin_activity_log
    WHERE created_at < now() - interval '1 year'
    AND action NOT IN ('security_alert', 'data_breach', 'compliance_violation');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_activity_logs"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_old_activity_logs"() IS 'Removes old activity logs based on retention policy. Run via pg_cron or manually.';



CREATE OR REPLACE FUNCTION "public"."complete_job"("target_job_id" "uuid", "job_output" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "public"."job_queue"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  job public.job_queue;
begin
  update public.job_queue
  set status = 'completed', completed_at = timezone('utc', now()), updated_at = timezone('utc', now())
  where id = target_job_id
  returning * into job;

  update public.job_attempts
  set status = 'completed', output = coalesce(job_output, '{}'::jsonb), completed_at = timezone('utc', now())
  where job_id = target_job_id and attempt_number = job.attempts;

  return job;
end;
$$;


ALTER FUNCTION "public"."complete_job"("target_job_id" "uuid", "job_output" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_ai_recommendation"("target_organization_id" "uuid", "target_user_id" "uuid", "rec_type" "text", "rec_title" "text", "rec_rationale" "text" DEFAULT NULL::"text", "rec_action" "jsonb" DEFAULT '{}'::"jsonb", "rec_priority" "text" DEFAULT 'medium'::"text") RETURNS "public"."ai_recommendations"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  rec public.ai_recommendations;
begin
  if not (
    public.is_admin((select auth.uid()))
    or target_user_id = (select auth.uid())
    or public.is_org_member(target_organization_id, (select auth.uid()))
  ) then
    raise exception 'not authorized';
  end if;

  insert into public.ai_recommendations(organization_id, user_id, recommendation_type, title, rationale, recommended_action, priority)
  values (target_organization_id, target_user_id, rec_type, rec_title, rec_rationale, rec_action, rec_priority)
  returning * into rec;

  return rec;
end;
$$;


ALTER FUNCTION "public"."create_ai_recommendation"("target_organization_id" "uuid", "target_user_id" "uuid", "rec_type" "text", "rec_title" "text", "rec_rationale" "text", "rec_action" "jsonb", "rec_priority" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "organization_id" "uuid",
    "version_number" integer NOT NULL,
    "title" "text",
    "content" "text",
    "change_summary" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "document_versions_version_number_check" CHECK (("version_number" > 0))
);


ALTER TABLE "public"."document_versions" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_document_version_snapshot"("target_document_id" "uuid", "summary" "text" DEFAULT NULL::"text") RETURNS "public"."document_versions"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  doc public.documents;
  next_version integer;
  new_version public.document_versions;
begin
  select * into doc from public.documents where id = target_document_id;
  if doc.id is null then raise exception 'document not found'; end if;

  if not (
    public.is_admin((select auth.uid()))
    or public.is_org_member(doc.organization_id, (select auth.uid()))
    or doc.user_id = (select auth.uid())
  ) then
    raise exception 'not authorized';
  end if;

  select coalesce(max(version_number), 0) + 1 into next_version
  from public.document_versions where document_id = target_document_id;

  insert into public.document_versions(document_id, organization_id, version_number, title, content, change_summary, created_by)
  values (doc.id, doc.organization_id, next_version, doc.title, doc.content, summary, (select auth.uid()))
  returning * into new_version;

  update public.documents set current_version = next_version, updated_at = timezone('utc', now()) where id = doc.id;

  return new_version;
end;
$$;


ALTER FUNCTION "public"."create_document_version_snapshot"("target_document_id" "uuid", "summary" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_law_change_impact_task"("target_impact_id" "uuid") RETURNS "public"."compliance_tasks"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  impact public.law_change_impacts;
  task public.compliance_tasks;
begin
  select * into impact from public.law_change_impacts where id = target_impact_id;
  if impact.id is null then raise exception 'impact not found'; end if;
  if not (public.is_admin((select auth.uid())) or public.is_org_member(impact.organization_id, (select auth.uid()))) then raise exception 'not authorized'; end if;

  insert into public.compliance_tasks(
    organization_id, document_id, title, description, category, priority, status, created_by, metadata
  ) values (
    impact.organization_id,
    impact.document_id,
    coalesce(impact.summary, 'Review law change impact'),
    impact.recommendation,
    'law_update',
    case when impact.severity in ('critical','high') then 'high' when impact.severity = 'low' then 'low' else 'medium' end,
    'open',
    (select auth.uid()),
    jsonb_build_object('law_change_impact_id', impact.id, 'law_update_id', impact.law_update_id)
  ) returning * into task;

  update public.law_change_impacts set status = 'task_created' where id = impact.id;

  insert into public.admin_audit_log(actor_user_id, action, target_table, target_id, metadata)
  values ((select auth.uid()), 'create_law_change_impact_task', 'law_change_impacts', impact.id::text, jsonb_build_object('task_id', task.id));

  return task;
end;
$$;


ALTER FUNCTION "public"."create_law_change_impact_task"("target_impact_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "user_id" "uuid",
    "notification_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text",
    "severity" "text" DEFAULT 'info'::"text" NOT NULL,
    "read_at" timestamp with time zone,
    "action_url" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "notifications_notification_type_check" CHECK (("notification_type" = ANY (ARRAY['task_due'::"text", 'finding_created'::"text", 'law_impact'::"text", 'review_requested'::"text", 'ai_recommendation'::"text", 'system'::"text", 'billing'::"text"]))),
    CONSTRAINT "notifications_severity_check" CHECK (("severity" = ANY (ARRAY['info'::"text", 'success'::"text", 'warning'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification"("target_organization_id" "uuid", "target_user_id" "uuid", "kind" "text", "notification_title" "text", "notification_body" "text" DEFAULT NULL::"text", "notification_severity" "text" DEFAULT 'info'::"text", "notification_action_url" "text" DEFAULT NULL::"text", "notification_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "public"."notifications"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  notification public.notifications;
begin
  if not (public.is_admin((select auth.uid())) or target_user_id = (select auth.uid()) or public.is_org_member(target_organization_id, (select auth.uid()))) then
    raise exception 'not authorized';
  end if;

  insert into public.notifications(organization_id, user_id, notification_type, title, body, severity, action_url, metadata)
  values (target_organization_id, target_user_id, kind, notification_title, notification_body, notification_severity, notification_action_url, coalesce(notification_metadata, '{}'::jsonb))
  returning * into notification;

  return notification;
end;
$$;


ALTER FUNCTION "public"."create_notification"("target_organization_id" "uuid", "target_user_id" "uuid", "kind" "text", "notification_title" "text", "notification_body" "text", "notification_severity" "text", "notification_action_url" "text", "notification_metadata" "jsonb") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "legal_name" "text",
    "website" "text",
    "default_jurisdiction" "text" DEFAULT 'Ontario'::"text" NOT NULL,
    "default_language" "text" DEFAULT 'EN'::"text" NOT NULL,
    "plan" "text" DEFAULT 'free'::"text" NOT NULL,
    "subscription_status" "text" DEFAULT 'inactive'::"text" NOT NULL,
    "billing_period" "text" DEFAULT 'monthly'::"text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "organizations_billing_period_check" CHECK (("billing_period" = ANY (ARRAY['monthly'::"text", 'annual'::"text"]))),
    CONSTRAINT "organizations_default_jurisdiction_check" CHECK (("default_jurisdiction" = ANY (ARRAY['Ontario'::"text", 'Quebec'::"text", 'British Columbia'::"text", 'Alberta'::"text", 'Federal'::"text", 'Remote Federal'::"text"]))),
    CONSTRAINT "organizations_default_language_check" CHECK (("default_language" = ANY (ARRAY['EN'::"text", 'FR'::"text", 'BOTH'::"text"]))),
    CONSTRAINT "organizations_plan_check" CHECK (("plan" = ANY (ARRAY['free'::"text", 'growth'::"text", 'advanced'::"text", 'enterprise'::"text"]))),
    CONSTRAINT "organizations_subscription_status_check" CHECK (("subscription_status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'past_due'::"text", 'canceled'::"text", 'trialing'::"text"])))
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_organization"("org_name" "text", "org_legal_name" "text" DEFAULT NULL::"text") RETURNS "public"."organizations"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  new_org public.organizations;
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated';
  end if;

  insert into public.organizations(name, legal_name, created_by)
  values (org_name, org_legal_name, (select auth.uid()))
  returning * into new_org;

  insert into public.organization_members(organization_id, user_id, role, status)
  values (new_org.id, (select auth.uid()), 'owner', 'active');

  return new_org;
end;
$$;


ALTER FUNCTION "public"."create_organization"("org_name" "text", "org_legal_name" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_risk_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "overall_score" numeric(5,2),
    "risk_level" "text" DEFAULT 'unknown'::"text" NOT NULL,
    "open_findings_count" integer DEFAULT 0 NOT NULL,
    "critical_findings_count" integer DEFAULT 0 NOT NULL,
    "overdue_tasks_count" integer DEFAULT 0 NOT NULL,
    "documents_in_review_count" integer DEFAULT 0 NOT NULL,
    "law_impacts_open_count" integer DEFAULT 0 NOT NULL,
    "snapshot_payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "organization_risk_snapshots_critical_findings_count_check" CHECK (("critical_findings_count" >= 0)),
    CONSTRAINT "organization_risk_snapshots_documents_in_review_count_check" CHECK (("documents_in_review_count" >= 0)),
    CONSTRAINT "organization_risk_snapshots_law_impacts_open_count_check" CHECK (("law_impacts_open_count" >= 0)),
    CONSTRAINT "organization_risk_snapshots_open_findings_count_check" CHECK (("open_findings_count" >= 0)),
    CONSTRAINT "organization_risk_snapshots_overall_score_check" CHECK ((("overall_score" IS NULL) OR (("overall_score" >= (0)::numeric) AND ("overall_score" <= (100)::numeric)))),
    CONSTRAINT "organization_risk_snapshots_overdue_tasks_count_check" CHECK (("overdue_tasks_count" >= 0)),
    CONSTRAINT "organization_risk_snapshots_risk_level_check" CHECK (("risk_level" = ANY (ARRAY['unknown'::"text", 'low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."organization_risk_snapshots" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_organization_risk_snapshot"("target_organization_id" "uuid") RETURNS "public"."organization_risk_snapshots"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  snapshot public.organization_risk_snapshots;
  open_findings int;
  critical_findings int;
  overdue_tasks int;
  docs_review int;
  open_impacts int;
  computed_score numeric(5,2);
  computed_risk text;
begin
  if not (public.is_admin((select auth.uid())) or public.is_org_member(target_organization_id, (select auth.uid()))) then
    raise exception 'not authorized';
  end if;

  select count(*) into open_findings from public.compliance_findings where organization_id = target_organization_id and status in ('open','in_progress');
  select count(*) into critical_findings from public.compliance_findings where organization_id = target_organization_id and status in ('open','in_progress') and severity = 'critical';
  select count(*) into overdue_tasks from public.compliance_tasks where organization_id = target_organization_id and status not in ('completed','cancelled') and due_at < timezone('utc', now());
  select count(*) into docs_review from public.documents where organization_id = target_organization_id and lifecycle_status = 'in_review';
  select count(*) into open_impacts from public.law_change_impacts where organization_id = target_organization_id and status in ('open','reviewing','task_created');

  computed_score := greatest(0, 100 - (open_findings * 4) - (critical_findings * 12) - (overdue_tasks * 6) - (open_impacts * 5));
  computed_risk := case
    when critical_findings > 0 or computed_score < 50 then 'critical'
    when computed_score < 70 then 'high'
    when computed_score < 85 then 'medium'
    else 'low'
  end;

  insert into public.organization_risk_snapshots(
    organization_id, overall_score, risk_level, open_findings_count, critical_findings_count,
    overdue_tasks_count, documents_in_review_count, law_impacts_open_count, snapshot_payload
  ) values (
    target_organization_id, computed_score, computed_risk, open_findings, critical_findings,
    overdue_tasks, docs_review, open_impacts,
    jsonb_build_object('formula_version','v1','generated_at', timezone('utc', now()))
  ) returning * into snapshot;

  return snapshot;
end;
$$;


ALTER FUNCTION "public"."create_organization_risk_snapshot"("target_organization_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."queue_health_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "queued_count" integer DEFAULT 0 NOT NULL,
    "running_count" integer DEFAULT 0 NOT NULL,
    "failed_count" integer DEFAULT 0 NOT NULL,
    "dead_letter_count" integer DEFAULT 0 NOT NULL,
    "oldest_queued_at" timestamp with time zone,
    "snapshot_payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."queue_health_snapshots" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_queue_health_snapshot"() RETURNS "public"."queue_health_snapshots"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  snapshot public.queue_health_snapshots;
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'not authorized';
  end if;

  insert into public.queue_health_snapshots(
    queued_count, running_count, failed_count, dead_letter_count, oldest_queued_at, snapshot_payload
  ) values (
    (select count(*) from public.job_queue where status = 'queued'),
    (select count(*) from public.job_queue where status in ('locked','running')),
    (select count(*) from public.job_queue where status = 'failed'),
    (select count(*) from public.job_queue where status = 'dead_letter'),
    (select min(created_at) from public.job_queue where status = 'queued'),
    jsonb_build_object('generated_at', timezone('utc', now()))
  ) returning * into snapshot;

  return snapshot;
end;
$$;


ALTER FUNCTION "public"."create_queue_health_snapshot"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_workspace_intelligence_item"("target_organization_id" "uuid", "intelligence_type" "text", "item_title" "text", "item_body" "text" DEFAULT NULL::"text", "item_severity" "text" DEFAULT 'info'::"text", "related_table" "text" DEFAULT NULL::"text", "related_id" "text" DEFAULT NULL::"text", "generator" "text" DEFAULT 'system'::"text") RETURNS "public"."workspace_intelligence_items"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  item public.workspace_intelligence_items;
begin
  if not (public.is_admin((select auth.uid())) or public.is_org_member(target_organization_id, (select auth.uid()))) then
    raise exception 'not authorized';
  end if;

  insert into public.workspace_intelligence_items(
    organization_id, item_type, title, body, severity, related_entity_table, related_entity_id, generated_by
  ) values (
    target_organization_id, intelligence_type, item_title, item_body, item_severity, related_table, related_id, generator
  ) returning * into item;

  return item;
end;
$$;


ALTER FUNCTION "public"."create_workspace_intelligence_item"("target_organization_id" "uuid", "intelligence_type" "text", "item_title" "text", "item_body" "text", "item_severity" "text", "related_table" "text", "related_id" "text", "generator" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_is_workspace_member"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select
    coalesce(auth.jwt() ->> 'email', '') <> ''
    and (
      lower(auth.jwt() ->> 'email') = 'martin.constantineau@dutiva.ca'
      or lower(auth.jwt() ->> 'email') in (
        select lower(email)
        from public.beta_signups
        where status not in ('declined', 'bounced')
        order by created_at asc nulls first, id asc
        limit 15
      )
      or exists (
        select 1 from public.admin_beta_access
        where lower(user_email) = lower(auth.jwt() ->> 'email')
          and status in ('invited', 'active')
      )
    )
$$;


ALTER FUNCTION "public"."current_user_is_workspace_member"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."operational_bottlenecks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "bottleneck_type" "text" NOT NULL,
    "severity" "text" DEFAULT 'medium'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "affected_entity_table" "text",
    "affected_entity_id" "text",
    "detected_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "resolved_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "operational_bottlenecks_bottleneck_type_check" CHECK (("bottleneck_type" = ANY (ARRAY['review_delay'::"text", 'task_overload'::"text", 'document_staleness'::"text", 'approval_blocked'::"text", 'law_impact_backlog'::"text", 'ai_queue_backlog'::"text", 'integration_failure'::"text"]))),
    CONSTRAINT "operational_bottlenecks_severity_check" CHECK (("severity" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "operational_bottlenecks_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'acknowledged'::"text", 'resolved'::"text", 'dismissed'::"text"])))
);


ALTER TABLE "public"."operational_bottlenecks" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."detect_basic_bottlenecks"("target_organization_id" "uuid") RETURNS SETOF "public"."operational_bottlenecks"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
begin
  if not (public.is_admin((select auth.uid())) or public.is_org_member(target_organization_id, (select auth.uid()))) then
    raise exception 'not authorized';
  end if;

  insert into public.operational_bottlenecks(organization_id, bottleneck_type, severity, title, description, metadata)
  select target_organization_id, 'task_overload', 'high', 'High overdue task count', 'Several compliance tasks are overdue and may need attention.', jsonb_build_object('overdue_tasks', count(*))
  from public.compliance_tasks
  where organization_id = target_organization_id and status not in ('completed','cancelled') and due_at < timezone('utc', now())
  having count(*) >= 3;

  insert into public.operational_bottlenecks(organization_id, bottleneck_type, severity, title, description, metadata)
  select target_organization_id, 'ai_queue_backlog', 'medium', 'AI/runtime queue backlog', 'Queued or failed jobs may be slowing operational automation.', jsonb_build_object('jobs', count(*))
  from public.job_queue
  where organization_id = target_organization_id and status in ('queued','dead_letter')
  having count(*) >= 5;

  return query
  select * from public.operational_bottlenecks
  where organization_id = target_organization_id and status = 'open'
  order by detected_at desc;
end;
$$;


ALTER FUNCTION "public"."detect_basic_bottlenecks"("target_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."dismiss_ai_recommendation"("target_recommendation_id" "uuid", "reason" "text" DEFAULT NULL::"text") RETURNS "public"."ai_recommendations"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  rec public.ai_recommendations;
begin
  select * into rec from public.ai_recommendations where id = target_recommendation_id;
  if rec.id is null then raise exception 'recommendation not found'; end if;

  if not (
    public.is_admin((select auth.uid()))
    or rec.user_id = (select auth.uid())
    or public.is_org_member(rec.organization_id, (select auth.uid()))
  ) then
    raise exception 'not authorized';
  end if;

  update public.ai_recommendations
  set status = 'dismissed', decided_at = timezone('utc', now()), metadata = metadata || jsonb_build_object('dismiss_reason', reason)
  where id = target_recommendation_id
  returning * into rec;

  insert into public.admin_audit_log(actor_user_id, action, target_table, target_id, metadata)
  values ((select auth.uid()), 'dismiss_ai_recommendation', 'ai_recommendations', rec.id::text, jsonb_build_object('reason', reason));

  return rec;
end;
$$;


ALTER FUNCTION "public"."dismiss_ai_recommendation"("target_recommendation_id" "uuid", "reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enqueue_job"("target_organization_id" "uuid", "target_job_type" "text", "job_payload" "jsonb" DEFAULT '{}'::"jsonb", "job_priority" integer DEFAULT 100, "job_run_after" timestamp with time zone DEFAULT NULL::timestamp with time zone, "job_max_attempts" integer DEFAULT 3) RETURNS "public"."job_queue"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  job public.job_queue;
begin
  if not (public.is_admin((select auth.uid())) or public.is_org_member(target_organization_id, (select auth.uid()))) then
    raise exception 'not authorized';
  end if;

  insert into public.job_queue(organization_id, job_type, payload, priority, run_after, max_attempts, created_by)
  values (
    target_organization_id,
    target_job_type,
    coalesce(job_payload, '{}'::jsonb),
    least(greatest(job_priority, 1), 1000),
    coalesce(job_run_after, timezone('utc', now())),
    least(greatest(job_max_attempts, 1), 10),
    (select auth.uid())
  )
  returning * into job;

  return job;
end;
$$;


ALTER FUNCTION "public"."enqueue_job"("target_organization_id" "uuid", "target_job_type" "text", "job_payload" "jsonb", "job_priority" integer, "job_run_after" timestamp with time zone, "job_max_attempts" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fail_job"("target_job_id" "uuid", "error_text" "text", "retry_delay_seconds" integer DEFAULT 300) RETURNS "public"."job_queue"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  job public.job_queue;
begin
  select * into job from public.job_queue where id = target_job_id for update;
  if job.id is null then raise exception 'job not found'; end if;

  update public.job_attempts
  set status = 'failed', error_message = error_text, completed_at = timezone('utc', now())
  where job_id = target_job_id and attempt_number = job.attempts;

  update public.job_queue
  set status = case when attempts >= max_attempts then 'dead_letter' else 'queued' end,
      last_error = error_text,
      locked_by = null,
      locked_at = null,
      run_after = case when attempts >= max_attempts then run_after else timezone('utc', now()) + make_interval(secs => greatest(retry_delay_seconds, 1)) end,
      updated_at = timezone('utc', now())
  where id = target_job_id
  returning * into job;

  return job;
end;
$$;


ALTER FUNCTION "public"."fail_job"("target_job_id" "uuid", "error_text" "text", "retry_delay_seconds" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."flag_guidance_chunks_on_law_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare
  v_jurisdiction text;
begin
  if new.event_type <> 'change' then
    return new;
  end if;

  v_jurisdiction := case new.jurisdiction
    when 'Ontario' then 'ON'
    when 'Quebec' then 'QC'
    when 'Québec' then 'QC'
    when 'Federal' then 'FED'
    else null
  end;
  if v_jurisdiction is null then
    return new;
  end if;

  update public.advisor_guidance_chunks
     set source_changed_at = timezone('utc', now()),
         source_change_note = new.law_name,
         updated_at = timezone('utc', now())
   where jurisdiction = v_jurisdiction
     and status = 'active'
     and source_changed_at is null;

  return new;
end;
$$;


ALTER FUNCTION "public"."flag_guidance_chunks_on_law_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_basic_risk_forecast"("target_organization_id" "uuid", "window_days" integer DEFAULT 30) RETURNS "public"."predictive_risk_forecasts"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  forecast public.predictive_risk_forecasts;
  open_findings int;
  overdue_tasks int;
  queued_jobs int;
  score numeric(5,2);
  level text;
begin
  if not (public.is_admin((select auth.uid())) or public.is_org_member(target_organization_id, (select auth.uid()))) then
    raise exception 'not authorized';
  end if;

  select count(*) into open_findings from public.compliance_findings where organization_id = target_organization_id and status in ('open','in_progress');
  select count(*) into overdue_tasks from public.compliance_tasks where organization_id = target_organization_id and status not in ('completed','cancelled') and due_at < timezone('utc', now());
  select count(*) into queued_jobs from public.job_queue where organization_id = target_organization_id and status in ('queued','locked','running','dead_letter');

  score := least(100, greatest(0, (open_findings * 8) + (overdue_tasks * 10) + (queued_jobs * 2)));
  level := case when score >= 80 then 'critical' when score >= 60 then 'high' when score >= 35 then 'medium' when score > 0 then 'low' else 'unknown' end;

  insert into public.predictive_risk_forecasts(
    organization_id, forecast_type, forecast_window_days, risk_score, risk_level, summary, drivers, recommended_actions
  ) values (
    target_organization_id,
    'compliance_risk',
    greatest(window_days, 1),
    score,
    level,
    'Basic forecast generated from open findings, overdue tasks, and active/dead-letter jobs.',
    jsonb_build_array(jsonb_build_object('open_findings', open_findings), jsonb_build_object('overdue_tasks', overdue_tasks), jsonb_build_object('queued_or_failed_jobs', queued_jobs)),
    jsonb_build_array('Resolve overdue tasks', 'Review open findings', 'Clear failed or stalled jobs')
  ) returning * into forecast;

  return forecast;
end;
$$;


ALTER FUNCTION "public"."generate_basic_risk_forecast"("target_organization_id" "uuid", "window_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_dashboard_counts"() RETURNS TABLE("total_users" bigint, "total_profiles" bigint, "total_documents" bigint, "total_hr_documents" bigint, "total_beta_signups" bigint, "total_signatures" bigint, "total_conversations" bigint, "total_law_updates" bigint, "total_offer_workflow_states" bigint)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'not authorized';
  end if;

  return query
  select
    (select count(*) from auth.users),
    (select count(*) from public.profiles),
    (select count(*) from public.documents),
    (select count(*) from public.hr_documents),
    (select count(*) from public.beta_signups),
    (select count(*) from public.signatures),
    (select count(*) from public.conversations),
    (select count(*) from public.law_updates),
    (select count(*) from public.offer_workflow_states);
end;
$$;


ALTER FUNCTION "public"."get_admin_dashboard_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_advisor_context"("target_organization_id" "uuid" DEFAULT NULL::"uuid", "limit_count" integer DEFAULT 20) RETURNS TABLE("id" "uuid", "memory_type" "text", "title" "text", "content" "text", "importance" integer, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
begin
  if target_organization_id is not null and not public.is_org_member(target_organization_id, (select auth.uid())) and not public.is_admin((select auth.uid())) then
    raise exception 'not authorized';
  end if;

  return query
  select am.id, am.memory_type, am.title, am.content, am.importance, am.created_at
  from public.advisor_memories am
  where am.status = 'active'
    and (
      am.user_id = (select auth.uid())
      or (target_organization_id is not null and am.organization_id = target_organization_id)
    )
  order by am.importance desc, am.updated_at desc
  limit least(greatest(limit_count, 1), 100);
end;
$$;


ALTER FUNCTION "public"."get_advisor_context"("target_organization_id" "uuid", "limit_count" integer) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "actor_user_id" "uuid",
    "event_type" "text" NOT NULL,
    "entity_table" "text",
    "entity_id" "text",
    "title" "text",
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."activity_events" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_entity_activity"("target_entity_table" "text", "target_entity_id" "text", "limit_count" integer DEFAULT 100) RETURNS SETOF "public"."activity_events"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public', 'auth'
    AS $$
begin
  return query
  select ae.*
  from public.activity_events ae
  where ae.entity_table = target_entity_table
    and ae.entity_id = target_entity_id
    and (
      public.is_admin((select auth.uid()))
      or ae.actor_user_id = (select auth.uid())
      or public.is_org_member(ae.organization_id, (select auth.uid()))
    )
  order by ae.created_at desc
  limit least(greatest(limit_count, 1), 500);
end;
$$;


ALTER FUNCTION "public"."get_entity_activity"("target_entity_table" "text", "target_entity_id" "text", "limit_count" integer) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."entity_relationships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "source_table" "text" NOT NULL,
    "source_id" "text" NOT NULL,
    "target_table" "text" NOT NULL,
    "target_id" "text" NOT NULL,
    "relationship_type" "text" NOT NULL,
    "confidence" numeric(5,2) DEFAULT 100,
    "created_by" "uuid",
    "created_by_ai" boolean DEFAULT false NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "entity_relationships_confidence_check" CHECK ((("confidence" IS NULL) OR (("confidence" >= (0)::numeric) AND ("confidence" <= (100)::numeric)))),
    CONSTRAINT "entity_relationships_relationship_type_check" CHECK (("relationship_type" = ANY (ARRAY['relates_to'::"text", 'depends_on'::"text", 'blocks'::"text", 'caused_by'::"text", 'remediates'::"text", 'references'::"text", 'generated_from'::"text", 'supersedes'::"text", 'impacts'::"text", 'assigned_to'::"text", 'reviewed_by'::"text"])))
);


ALTER TABLE "public"."entity_relationships" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_entity_relationships"("target_entity_table" "text", "target_entity_id" "text", "limit_count" integer DEFAULT 100) RETURNS SETOF "public"."entity_relationships"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public', 'auth'
    AS $$
begin
  return query
  select er.*
  from public.entity_relationships er
  where (
      (er.source_table = target_entity_table and er.source_id = target_entity_id)
      or (er.target_table = target_entity_table and er.target_id = target_entity_id)
    )
    and (
      public.is_admin((select auth.uid()))
      or public.is_org_member(er.organization_id, (select auth.uid()))
      or er.created_by = (select auth.uid())
    )
  order by er.created_at desc
  limit least(greatest(limit_count, 1), 500);
end;
$$;


ALTER FUNCTION "public"."get_entity_relationships"("target_entity_table" "text", "target_entity_id" "text", "limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_frontend_bootstrap"() RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
begin
  return jsonb_build_object(
    'feature_flags', (select coalesce(jsonb_object_agg(key, jsonb_build_object('enabled', enabled, 'rollout_percentage', rollout_percentage)), '{}'::jsonb) from public.frontend_feature_flags),
    'active_agents', (select coalesce(jsonb_agg(jsonb_build_object('key', key, 'name', name, 'agent_type', agent_type, 'capabilities', capabilities)), '[]'::jsonb) from public.ai_agents where status = 'active')
  );
end;
$$;


ALTER FUNCTION "public"."get_frontend_bootstrap"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_organization_dashboard"("target_organization_id" "uuid") RETURNS TABLE("organization_id" "uuid", "open_tasks" bigint, "overdue_tasks" bigint, "open_findings" bigint, "critical_findings" bigint, "pending_reviews" bigint, "pending_ai_recommendations" bigint, "queued_jobs" bigint, "latest_risk_score" numeric, "latest_risk_level" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
begin
  if not (public.is_admin((select auth.uid())) or public.is_org_member(target_organization_id, (select auth.uid()))) then
    raise exception 'not authorized';
  end if;

  return query
  select
    target_organization_id,
    (select count(*) from public.compliance_tasks where organization_id = target_organization_id and status in ('open','in_progress','blocked')),
    (select count(*) from public.compliance_tasks where organization_id = target_organization_id and status not in ('completed','cancelled') and due_at < timezone('utc', now())),
    (select count(*) from public.compliance_findings where organization_id = target_organization_id and status in ('open','in_progress')),
    (select count(*) from public.compliance_findings where organization_id = target_organization_id and status in ('open','in_progress') and severity = 'critical'),
    (select count(*) from public.document_reviews where organization_id = target_organization_id and status in ('requested','in_review')),
    (select count(*) from public.ai_recommendations where organization_id = target_organization_id and status = 'pending'),
    (select count(*) from public.job_queue where organization_id = target_organization_id and status in ('queued','locked','running')),
    (select overall_score from public.organization_risk_snapshots where organization_id = target_organization_id order by created_at desc limit 1),
    (select risk_level from public.organization_risk_snapshots where organization_id = target_organization_id order by created_at desc limit 1);
end;
$$;


ALTER FUNCTION "public"."get_organization_dashboard"("target_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_signature_by_token"("p_token" "uuid") RETURNS "public"."signature_token_view"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_sig    public.signatures;
  v_result public.signature_token_view;
BEGIN
  SELECT *
  INTO   v_sig
  FROM   public.signatures
  WHERE  token = p_token
  LIMIT  1;

  IF v_sig.id IS NULL THEN
    RETURN NULL;
  END IF;

  IF v_sig.status = 'pending'
     AND (v_sig.expires_at IS NULL OR v_sig.expires_at > timezone('utc', now()))
  THEN
    INSERT INTO public.signature_audit_events (signature_id, document_id, user_id, event_type)
    VALUES (v_sig.id, v_sig.document_id, v_sig.user_id, 'signing_link_viewed');
  END IF;

  v_result.id          := v_sig.id;
  v_result.document_id := v_sig.document_id;
  v_result.signer_name := v_sig.signer_name;
  v_result.signer_role := v_sig.signer_role;
  v_result.status      := v_sig.status;
  v_result.expires_at  := v_sig.expires_at;

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_signature_by_token"("p_token" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (id, account_email)
  values (new.id, new.email)
  on conflict (id) do update
    set account_email = excluded.account_email;

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_usage_counter"("p_user_id" "uuid", "p_period_start" "date", "p_action" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.usage_counters (user_id, period_start)
  values (p_user_id, p_period_start)
  on conflict (user_id, period_start) do nothing;

  case p_action
    when 'advisor_messages' then
      update public.usage_counters
        set advisor_messages_used = advisor_messages_used + 1,
            updated_at = timezone('utc', now())
        where user_id = p_user_id
          and period_start = p_period_start;

    when 'documents_generated' then
      update public.usage_counters
        set documents_generated = documents_generated + 1,
            updated_at = timezone('utc', now())
        where user_id = p_user_id
          and period_start = p_period_start;

    when 'documents_saved' then
      update public.usage_counters
        set documents_saved = documents_saved + 1,
            updated_at = timezone('utc', now())
        where user_id = p_user_id
          and period_start = p_period_start;

    when 'exports' then
      update public.usage_counters
        set exports_used = exports_used + 1,
            updated_at = timezone('utc', now())
        where user_id = p_user_id
          and period_start = p_period_start;

    when 'compliance_reviews' then
      update public.usage_counters
        set compliance_reviews = compliance_reviews + 1,
            updated_at = timezone('utc', now())
        where user_id = p_user_id
          and period_start = p_period_start;

    when 'e_signature_sends' then
      update public.usage_counters
        set e_signature_sends = e_signature_sends + 1,
            updated_at = timezone('utc', now())
        where user_id = p_user_id
          and period_start = p_period_start;

    else
      raise exception 'Unknown usage action: %', p_action;
  end case;
end;
$$;


ALTER FUNCTION "public"."increment_usage_counter"("p_user_id" "uuid", "p_period_start" "date", "p_action" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ingest_client_error_report"("p_ip_hash" "text", "p_env" "text", "p_release" "text", "p_route" "text", "p_locale" "text", "p_kind" "text", "p_message" "text", "p_stack" "text", "p_user_agent" "text", "p_window_seconds" integer, "p_limit" integer) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_since timestamptz := now() - make_interval(secs => greatest(p_window_seconds, 1));
  v_count integer;
begin
  perform pg_advisory_xact_lock(hashtext(coalesce(p_ip_hash, '')));

  -- Sweep expired limiter rows for ALL sources, not just this one.
  delete from public.client_error_rate_limit where created_at < v_since;

  select count(*) into v_count
    from public.client_error_rate_limit
    where ip_hash = p_ip_hash and created_at >= v_since;

  if v_count >= greatest(p_limit, 1) then
    return 'rate_limited';
  end if;

  insert into public.client_error_rate_limit (ip_hash) values (p_ip_hash);

  insert into public.client_error_reports
    (env, release, route, locale, kind, message, stack, user_agent)
  values
    (p_env, p_release, p_route, p_locale, p_kind, p_message, p_stack, p_user_agent);

  -- Opportunistic retention: message/stack are free-form and may contain PII,
  -- so they must not accumulate. Amortized; the scheduled job below is the
  -- real guarantee.
  if random() < 0.02 then
    delete from public.client_error_reports where created_at < now() - interval '90 days';
  end if;

  return 'ok';
end;
$$;


ALTER FUNCTION "public"."ingest_client_error_report"("p_ip_hash" "text", "p_env" "text", "p_release" "text", "p_route" "text", "p_locale" "text", "p_kind" "text", "p_message" "text", "p_stack" "text", "p_user_agent" "text", "p_window_seconds" integer, "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ingest_support_analytics_events"("p_ip_hash" "text", "p_events" "jsonb", "p_window_seconds" integer, "p_limit" integer) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_since timestamptz := now() - make_interval(secs => greatest(p_window_seconds, 1));
  v_incoming integer := coalesce(jsonb_array_length(p_events), 0);
  v_used integer;
begin
  if v_incoming = 0 then
    return 'ok';
  end if;

  perform pg_advisory_xact_lock(hashtext(coalesce(p_ip_hash, '')));

  delete from public.support_analytics_rate_limit where created_at < v_since;

  select coalesce(sum(event_count), 0) into v_used
    from public.support_analytics_rate_limit
    where ip_hash = p_ip_hash and created_at >= v_since;

  if v_used + v_incoming > greatest(p_limit, 1) then
    return 'rate_limited';
  end if;

  insert into public.support_analytics_rate_limit (ip_hash, event_count)
  values (p_ip_hash, v_incoming);

  insert into public.support_analytics_events (
    event_type, workspace_id, anonymous_visitor_id, article_slug, search_query,
    search_result_count, vote_value, ticket_reference, ticket_category,
    ticket_source, locale, occurred_at
  )
  select
    e->>'event_type',
    nullif(e->>'workspace_id', '')::uuid,
    e->>'anonymous_visitor_id',
    e->>'article_slug',
    e->>'search_query',
    nullif(e->>'search_result_count', '')::integer,
    e->>'vote_value',
    e->>'ticket_reference',
    e->>'ticket_category',
    e->>'ticket_source',
    e->>'locale',
    (e->>'occurred_at')::timestamptz
  from jsonb_array_elements(p_events) as e;

  return 'ok';
end;
$$;


ALTER FUNCTION "public"."ingest_support_analytics_events"("p_ip_hash" "text", "p_events" "jsonb", "p_window_seconds" integer, "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("check_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = check_user_id
      and ur.role in ('owner','admin')
  );
$$;


ALTER FUNCTION "public"."is_admin"("check_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_user"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    OR COALESCE((auth.jwt() ->> 'role') = 'admin', false)
    OR EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid()
      AND au.revoked_at IS NULL
      AND (au.expires_at IS NULL OR au.expires_at > now())
    );
$$;


ALTER FUNCTION "public"."is_admin_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_internal_admin_user"() RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) like '%@dutiva.ca';
$$;


ALTER FUNCTION "public"."is_internal_admin_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_org_admin"("check_org_id" "uuid", "check_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select public.is_admin(check_user_id) or exists (
    select 1 from public.organization_members om
    where om.organization_id = check_org_id
      and om.user_id = check_user_id
      and om.status = 'active'
      and om.role in ('owner','admin')
  );
$$;


ALTER FUNCTION "public"."is_org_admin"("check_org_id" "uuid", "check_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_org_member"("check_org_id" "uuid", "check_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select public.is_admin(check_user_id) or exists (
    select 1 from public.organization_members om
    where om.organization_id = check_org_id
      and om.user_id = check_user_id
      and om.status = 'active'
  );
$$;


ALTER FUNCTION "public"."is_org_member"("check_org_id" "uuid", "check_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_super_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid()
    AND au.role = 'super_admin'
    AND au.revoked_at IS NULL
    AND (au.expires_at IS NULL OR au.expires_at > now())
  );
$$;


ALTER FUNCTION "public"."is_super_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."law_monitor_status"() RETURNS TABLE("secret_configured" boolean, "job_scheduled" boolean, "last_checked_at" timestamp with time zone, "hours_since_check" numeric, "monitored_pages" bigint, "broken_pages" bigint, "last_update_at" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
  select
    exists (select 1 from vault.decrypted_secrets where name = 'law_monitor_service_key'),
    exists (select 1 from cron.job where jobname = 'monitor-law-changes-daily' and active),
    (select max(last_checked) from public.law_page_hashes),
    round(extract(epoch from (now() - (select max(last_checked) from public.law_page_hashes))) / 3600, 1),
    (select count(*) from public.law_page_hashes),
    (select count(*) from public.law_page_hashes where is_broken),
    (select max(detected_at) from public.law_updates);
$$;


ALTER FUNCTION "public"."law_monitor_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."law_update_digest_status"() RETURNS TABLE("secret_configured" boolean, "job_scheduled" boolean, "unreviewed_count" bigint, "reviewed_unsent_count" bigint, "last_sent_at" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
  select
    exists (select 1 from vault.decrypted_secrets where name = 'law_update_digest_service_key'),
    exists (select 1 from cron.job where jobname = 'law-update-digest-weekly' and active),
    (select count(*) from public.law_updates where event_type = 'change' and review_status = 'machine_curated'),
    (select count(*) from public.law_updates lu
       where lu.event_type = 'change' and lu.review_status = 'reviewed'
         and not exists (
           select 1 from public.law_update_notifications n
           where n.law_update_id = lu.id and n.status = 'sent'
         )),
    (select max(sent_at) from public.law_update_notifications where status = 'sent');
$$;


ALTER FUNCTION "public"."law_update_digest_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."link_entities"("target_organization_id" "uuid", "source_table_name" "text", "source_entity_id" "text", "target_table_name" "text", "target_entity_id" "text", "relation_kind" "text", "relation_confidence" numeric DEFAULT 100, "ai_generated" boolean DEFAULT false) RETURNS "public"."entity_relationships"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  rel public.entity_relationships;
begin
  if not (public.is_admin((select auth.uid())) or public.is_org_member(target_organization_id, (select auth.uid()))) then
    raise exception 'not authorized';
  end if;

  insert into public.entity_relationships(
    organization_id, source_table, source_id, target_table, target_id, relationship_type, confidence, created_by, created_by_ai
  ) values (
    target_organization_id, source_table_name, source_entity_id, target_table_name, target_entity_id, relation_kind,
    least(greatest(relation_confidence, 0), 100), (select auth.uid()), ai_generated
  )
  on conflict (organization_id, source_table, source_id, target_table, target_id, relationship_type)
  do update set confidence = excluded.confidence
  returning * into rel;

  return rel;
end;
$$;


ALTER FUNCTION "public"."link_entities"("target_organization_id" "uuid", "source_table_name" "text", "source_entity_id" "text", "target_table_name" "text", "target_entity_id" "text", "relation_kind" "text", "relation_confidence" numeric, "ai_generated" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_notification_read"("target_notification_id" "uuid") RETURNS "public"."notifications"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  notification public.notifications;
begin
  update public.notifications
  set read_at = timezone('utc', now())
  where id = target_notification_id
    and (user_id = (select auth.uid()) or public.is_admin((select auth.uid())))
  returning * into notification;

  if notification.id is null then
    raise exception 'notification not found or not authorized';
  end if;

  return notification;
end;
$$;


ALTER FUNCTION "public"."mark_notification_read"("target_notification_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_advisor_guidance"("q" "text", "k" integer DEFAULT 4) RETURNS TABLE("title" "text", "content" "text", "source_url" "text", "source_name" "text", "jurisdiction" "text", "effective_note" "text", "topic" "text", "review_status" "text", "source_changed_at" timestamp with time zone)
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  with lex_en as (
    select to_tsquery(
      'english',
      string_agg(distinct '''' || replace(lexeme, '''', '''''') || '''', ' | ')
    ) as tq
    from unnest(tsvector_to_array(to_tsvector('english', q))) as lexeme
  ),
  lex_fr as (
    select to_tsquery(
      'french',
      string_agg(distinct '''' || replace(lexeme, '''', '''''') || '''', ' | ')
    ) as tq
    from unnest(tsvector_to_array(to_tsvector('french', q))) as lexeme
  )
  select c.title, c.content, c.source_url, c.source_name, c.jurisdiction,
         c.effective_note, c.topic, c.review_status, c.source_changed_at
  from public.advisor_guidance_chunks c, lex_en, lex_fr
  where c.status = 'active'
    and (
      (lex_en.tq is not null and c.fts @@ lex_en.tq)
      or (lex_fr.tq is not null and c.fts_fr is not null and c.fts_fr @@ lex_fr.tq)
    )
  order by greatest(
    coalesce(
      case when lex_en.tq is not null then ts_rank(c.fts, lex_en.tq) end,
      0
    ),
    coalesce(
      case
        when lex_fr.tq is not null and c.fts_fr is not null then ts_rank(c.fts_fr, lex_fr.tq)
      end,
      0
    )
  ) desc
  limit greatest(1, least(k, 8))
$$;


ALTER FUNCTION "public"."match_advisor_guidance"("q" "text", "k" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_guidance_chunks"("query_embedding" "extensions"."vector", "match_threshold" double precision DEFAULT 0.75, "match_count" integer DEFAULT 10, "filter_jurisdiction" "text" DEFAULT NULL::"text", "filter_organization_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("id" "uuid", "source_id" "uuid", "organization_id" "uuid", "title" "text", "content" "text", "jurisdiction" "text", "tags" "text"[], "similarity" double precision)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
begin
  return query
  select
    gc.id,
    gc.source_id,
    gc.organization_id,
    gc.title,
    gc.content,
    gc.jurisdiction,
    gc.tags,
    (1 - (gc.embedding <=> query_embedding))::float as similarity
  from public.guidance_chunks gc
  where gc.embedding is not null
    and (filter_jurisdiction is null or gc.jurisdiction = filter_jurisdiction)
    and (filter_organization_id is null or gc.organization_id is null or gc.organization_id = filter_organization_id)
    and (gc.organization_id is null or public.is_org_member(gc.organization_id, (select auth.uid())) or public.is_admin((select auth.uid())))
    and (1 - (gc.embedding <=> query_embedding)) >= match_threshold
  order by gc.embedding <=> query_embedding asc
  limit least(greatest(match_count, 1), 50);
end;
$$;


ALTER FUNCTION "public"."match_guidance_chunks"("query_embedding" "extensions"."vector", "match_threshold" double precision, "match_count" integer, "filter_jurisdiction" "text", "filter_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."normalize_document_jurisdiction_label"("p_code" "text", "p_fallback" "text" DEFAULT NULL::"text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    SET "search_path" TO ''
    AS $$
  select coalesce(
    nullif(btrim(p_fallback), ''),
    case upper(nullif(btrim(p_code), ''))
      when 'AB'  then 'Alberta'
      when 'BC'  then 'British Columbia'
      when 'MB'  then 'Manitoba'
      when 'NB'  then 'New Brunswick'
      when 'NL'  then 'Newfoundland and Labrador'
      when 'NS'  then 'Nova Scotia'
      when 'NT'  then 'Northwest Territories'
      when 'NU'  then 'Nunavut'
      when 'ON'  then 'Ontario'
      when 'PE'  then 'Prince Edward Island'
      when 'QC'  then 'Quebec'
      when 'SK'  then 'Saskatchewan'
      when 'YT'  then 'Yukon'
      when 'FED' then 'Federal'
      else nullif(btrim(p_code), '')
    end
  );
$$;


ALTER FUNCTION "public"."normalize_document_jurisdiction_label"("p_code" "text", "p_fallback" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."pin_profile_billing_columns"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  if coalesce(auth.role(), '') not in ('authenticated', 'anon') then
    return new;
  end if;

  new.plan := old.plan;
  new.subscription_status := old.subscription_status;
  new.billing_period := old.billing_period;
  new.stripe_customer_id := old.stripe_customer_id;
  new.stripe_subscription_id := old.stripe_subscription_id;
  return new;
end;
$$;


ALTER FUNCTION "public"."pin_profile_billing_columns"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_expired_data_deletions"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    processed_count INTEGER := 0;
BEGIN
    UPDATE public.data_deletion_requests
    SET 
        status = 'completed',
        completed_at = now(),
        notes = COALESCE(notes, '') || E'\nAuto-completed by retention job on ' || now()
    WHERE status = 'pending'
    AND grace_period_end < now()
    AND completed_at IS NULL;
    
    GET DIAGNOSTICS processed_count = ROW_COUNT;
    
    IF processed_count > 0 THEN
        INSERT INTO public.admin_activity_log (action, entity_type, entity_id, details)
        VALUES (
            'data_retention_cleanup',
            'data_deletion_requests',
            NULL,
            jsonb_build_object(
                'processed_count', processed_count,
                'job_type', 'expired_deletions',
                'run_at', now()
            )
        );
    END IF;
    
    RETURN processed_count;
END;
$$;


ALTER FUNCTION "public"."process_expired_data_deletions"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."process_expired_data_deletions"() IS 'Processes data deletion requests that have passed their grace period. Run via pg_cron or manually.';



CREATE OR REPLACE FUNCTION "public"."purge_ai_telemetry_data"() RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  delete from public.ai_telemetry_events
    where created_at < now() - interval '180 days';
$$;


ALTER FUNCTION "public"."purge_ai_telemetry_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."purge_client_error_data"() RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  delete from public.client_error_reports where created_at < now() - interval '90 days';
  delete from public.client_error_rate_limit where created_at < now() - interval '1 hour';
$$;


ALTER FUNCTION "public"."purge_client_error_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."purge_support_analytics_rate_limit"() RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
  delete from public.support_analytics_rate_limit
   where created_at < now() - interval '1 hour';
$$;


ALTER FUNCTION "public"."purge_support_analytics_rate_limit"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_deliveries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "notification_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "recipient" "text",
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "attempt_count" integer DEFAULT 0 NOT NULL,
    "last_attempt_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "error_message" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "notification_deliveries_attempt_count_check" CHECK (("attempt_count" >= 0)),
    CONSTRAINT "notification_deliveries_provider_check" CHECK (("provider" = ANY (ARRAY['email'::"text", 'in_app'::"text", 'sms'::"text", 'slack'::"text", 'teams'::"text", 'webhook'::"text"]))),
    CONSTRAINT "notification_deliveries_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'sent'::"text", 'delivered'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."notification_deliveries" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."queue_notification_delivery"("target_notification_id" "uuid", "delivery_provider" "text", "delivery_recipient" "text" DEFAULT NULL::"text") RETURNS "public"."notification_deliveries"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  n public.notifications;
  delivery public.notification_deliveries;
begin
  select * into n from public.notifications where id = target_notification_id;
  if n.id is null then raise exception 'notification not found'; end if;

  if not (public.is_admin((select auth.uid())) or n.user_id = (select auth.uid()) or public.is_org_member(n.organization_id, (select auth.uid()))) then
    raise exception 'not authorized';
  end if;

  insert into public.notification_deliveries(notification_id, provider, recipient)
  values (target_notification_id, delivery_provider, delivery_recipient)
  returning * into delivery;

  insert into public.job_queue(organization_id, job_type, payload, priority, created_by)
  values (n.organization_id, 'notification', jsonb_build_object('notification_delivery_id', delivery.id), 100, (select auth.uid()));

  return delivery;
end;
$$;


ALTER FUNCTION "public"."queue_notification_delivery"("target_notification_id" "uuid", "delivery_provider" "text", "delivery_recipient" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."advisor_memories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "user_id" "uuid",
    "memory_type" "text" DEFAULT 'preference'::"text" NOT NULL,
    "title" "text",
    "content" "text" NOT NULL,
    "importance" integer DEFAULT 3 NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "advisor_memories_importance_check" CHECK ((("importance" >= 1) AND ("importance" <= 5))),
    CONSTRAINT "advisor_memories_memory_type_check" CHECK (("memory_type" = ANY (ARRAY['preference'::"text", 'organization_context'::"text", 'policy_context'::"text", 'workflow_context'::"text", 'risk_context'::"text", 'advisor_note'::"text"]))),
    CONSTRAINT "advisor_memories_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'archived'::"text", 'deleted'::"text"])))
);


ALTER TABLE "public"."advisor_memories" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_advisor_memory"("target_organization_id" "uuid", "target_user_id" "uuid", "memory_kind" "text", "memory_title" "text", "memory_content" "text", "memory_importance" integer DEFAULT 3) RETURNS "public"."advisor_memories"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  memory public.advisor_memories;
begin
  if not (
    public.is_admin((select auth.uid()))
    or target_user_id = (select auth.uid())
    or public.is_org_member(target_organization_id, (select auth.uid()))
  ) then
    raise exception 'not authorized';
  end if;

  insert into public.advisor_memories(organization_id, user_id, memory_type, title, content, importance)
  values (target_organization_id, target_user_id, memory_kind, memory_title, memory_content, least(greatest(memory_importance, 1), 5))
  returning * into memory;

  return memory;
end;
$$;


ALTER FUNCTION "public"."record_advisor_memory"("target_organization_id" "uuid", "target_user_id" "uuid", "memory_kind" "text", "memory_title" "text", "memory_content" "text", "memory_importance" integer) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_telemetry_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "user_id" "uuid",
    "provider" "text",
    "model" "text",
    "operation" "text" NOT NULL,
    "prompt_tokens" integer,
    "completion_tokens" integer,
    "total_tokens" integer,
    "latency_ms" integer,
    "estimated_cost_cents" numeric(10,4),
    "status" "text" DEFAULT 'completed'::"text" NOT NULL,
    "related_entity_table" "text",
    "related_entity_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "ai_telemetry_events_completion_tokens_check" CHECK ((("completion_tokens" IS NULL) OR ("completion_tokens" >= 0))),
    CONSTRAINT "ai_telemetry_events_latency_ms_check" CHECK ((("latency_ms" IS NULL) OR ("latency_ms" >= 0))),
    CONSTRAINT "ai_telemetry_events_operation_check" CHECK (("operation" = ANY (ARRAY['chat'::"text", 'draft'::"text", 'embed'::"text", 'classify'::"text", 'summarize'::"text", 'recommend'::"text", 'score'::"text", 'tool_call'::"text", 'support_firstline'::"text", 'safety_backstop'::"text"]))),
    CONSTRAINT "ai_telemetry_events_prompt_tokens_check" CHECK ((("prompt_tokens" IS NULL) OR ("prompt_tokens" >= 0))),
    CONSTRAINT "ai_telemetry_events_status_check" CHECK (("status" = ANY (ARRAY['started'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "ai_telemetry_events_total_tokens_check" CHECK ((("total_tokens" IS NULL) OR ("total_tokens" >= 0)))
);


ALTER TABLE "public"."ai_telemetry_events" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_ai_telemetry"("target_organization_id" "uuid", "target_user_id" "uuid", "provider_name" "text", "model_name" "text", "operation_name" "text", "total_token_count" integer DEFAULT NULL::integer, "latency_value_ms" integer DEFAULT NULL::integer, "telemetry_status" "text" DEFAULT 'completed'::"text", "telemetry_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "public"."ai_telemetry_events"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  event public.ai_telemetry_events;
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'not authorized';
  end if;

  insert into public.ai_telemetry_events(
    organization_id, user_id, provider, model, operation, total_tokens, latency_ms, status, metadata
  ) values (
    target_organization_id, target_user_id, provider_name, model_name, operation_name, total_token_count, latency_value_ms, telemetry_status, coalesce(telemetry_metadata, '{}'::jsonb)
  ) returning * into event;

  return event;
end;
$$;


ALTER FUNCTION "public"."record_ai_telemetry"("target_organization_id" "uuid", "target_user_id" "uuid", "provider_name" "text", "model_name" "text", "operation_name" "text", "total_token_count" integer, "latency_value_ms" integer, "telemetry_status" "text", "telemetry_metadata" "jsonb") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."billing_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "user_id" "uuid",
    "provider" "text" DEFAULT 'stripe'::"text" NOT NULL,
    "external_customer_id" "text",
    "external_subscription_id" "text",
    "event_type" "text" NOT NULL,
    "plan" "text",
    "subscription_status" "text",
    "billing_period" "text",
    "amount_cents" integer,
    "currency" "text" DEFAULT 'cad'::"text",
    "occurred_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."billing_events" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_billing_event"("target_organization_id" "uuid", "target_user_id" "uuid", "billing_provider" "text", "billing_event_type" "text", "billing_plan" "text" DEFAULT NULL::"text", "billing_subscription_status" "text" DEFAULT NULL::"text", "billing_period_value" "text" DEFAULT NULL::"text", "billing_payload" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "public"."billing_events"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  event_row public.billing_events;
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'not authorized';
  end if;

  insert into public.billing_events(organization_id, user_id, provider, event_type, plan, subscription_status, billing_period, payload)
  values (target_organization_id, target_user_id, billing_provider, billing_event_type, billing_plan, billing_subscription_status, billing_period_value, coalesce(billing_payload, '{}'::jsonb))
  returning * into event_row;

  update public.organizations
  set plan = coalesce(billing_plan, plan),
      subscription_status = coalesce(billing_subscription_status, subscription_status),
      billing_period = coalesce(billing_period_value, billing_period),
      updated_at = timezone('utc', now())
  where id = target_organization_id;

  return event_row;
end;
$$;


ALTER FUNCTION "public"."record_billing_event"("target_organization_id" "uuid", "target_user_id" "uuid", "billing_provider" "text", "billing_event_type" "text", "billing_plan" "text", "billing_subscription_status" "text", "billing_period_value" "text", "billing_payload" "jsonb") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."execution_traces" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "trace_type" "text" NOT NULL,
    "trace_key" "text",
    "parent_trace_id" "uuid",
    "status" "text" DEFAULT 'started'::"text" NOT NULL,
    "actor_user_id" "uuid",
    "entity_table" "text",
    "entity_id" "text",
    "started_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "completed_at" timestamp with time zone,
    "duration_ms" integer,
    "error_message" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "execution_traces_duration_ms_check" CHECK ((("duration_ms" IS NULL) OR ("duration_ms" >= 0))),
    CONSTRAINT "execution_traces_status_check" CHECK (("status" = ANY (ARRAY['started'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "execution_traces_trace_type_check" CHECK (("trace_type" = ANY (ARRAY['edge_function'::"text", 'job'::"text", 'ai_action'::"text", 'playbook'::"text", 'workflow'::"text", 'webhook'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."execution_traces" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_execution_trace"("target_organization_id" "uuid", "trace_kind" "text", "trace_status" "text", "trace_key_value" "text" DEFAULT NULL::"text", "entity_table_value" "text" DEFAULT NULL::"text", "entity_id_value" "text" DEFAULT NULL::"text", "trace_metadata" "jsonb" DEFAULT '{}'::"jsonb", "trace_error" "text" DEFAULT NULL::"text") RETURNS "public"."execution_traces"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  trace public.execution_traces;
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'not authorized';
  end if;

  insert into public.execution_traces(
    organization_id, trace_type, trace_key, status, actor_user_id, entity_table, entity_id, completed_at, error_message, metadata
  ) values (
    target_organization_id, trace_kind, trace_key_value, trace_status, (select auth.uid()), entity_table_value, entity_id_value,
    case when trace_status in ('completed','failed','cancelled') then timezone('utc', now()) else null end,
    trace_error,
    coalesce(trace_metadata, '{}'::jsonb)
  ) returning * into trace;

  return trace;
end;
$$;


ALTER FUNCTION "public"."record_execution_trace"("target_organization_id" "uuid", "trace_kind" "text", "trace_status" "text", "trace_key_value" "text", "entity_table_value" "text", "entity_id_value" "text", "trace_metadata" "jsonb", "trace_error" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_signature_link_created"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.signature_audit_events (signature_id, document_id, user_id, event_type)
  VALUES (NEW.id, NEW.document_id, NEW.user_id, 'signing_link_created');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."record_signature_link_created"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "actor_user_id" "uuid",
    "event_type" "text" NOT NULL,
    "entity_table" "text",
    "entity_id" "text",
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "processed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."system_events" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_system_event"("target_organization_id" "uuid", "event_kind" "text", "source_table" "text" DEFAULT NULL::"text", "source_id" "text" DEFAULT NULL::"text", "event_payload" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "public"."system_events"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  event_row public.system_events;
begin
  if not (
    public.is_admin((select auth.uid()))
    or public.is_org_member(target_organization_id, (select auth.uid()))
  ) then
    raise exception 'not authorized';
  end if;

  insert into public.system_events(organization_id, actor_user_id, event_type, entity_table, entity_id, payload)
  values (target_organization_id, (select auth.uid()), event_kind, source_table, source_id, event_payload)
  returning * into event_row;

  return event_row;
end;
$$;


ALTER FUNCTION "public"."record_system_event"("target_organization_id" "uuid", "event_kind" "text", "source_table" "text", "source_id" "text", "event_payload" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."release_cron_lock"("p_job_name" "text", "p_instance_id" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare
  v_count integer;
begin
  delete from public.cron_locks
  where job_name = p_job_name and instance_id = p_instance_id;
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;


ALTER FUNCTION "public"."release_cron_lock"("p_job_name" "text", "p_instance_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_grant_gaps"() RETURNS TABLE("missing_function" "text", "on_table" "text", "policy_name" "text")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
  select distinct
    p.proname::text  as missing_function,
    c.relname::text  as on_table,
    pol.polname::text as policy_name
  from pg_policy pol
  join pg_class c on c.oid = pol.polrelid
  cross join lateral (
    select coalesce(pg_get_expr(pol.polqual, pol.polrelid), '') || ' ' ||
           coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '') as expr
  ) e
  join pg_proc p
    on p.pronamespace = 'public'::regnamespace
   and e.expr like '%' || p.proname || '(%'
  where not has_function_privilege('authenticated', p.oid, 'EXECUTE')
  order by 1, 2, 3;
$$;


ALTER FUNCTION "public"."rls_grant_gaps"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."score_snapshot_status"() RETURNS TABLE("secret_configured" boolean, "daily_job_scheduled" boolean, "close_job_scheduled" boolean, "organizations_total" bigint, "orgs_with_current_month" bigint, "orgs_with_closed_prev_month" bigint, "last_write_at" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
  select
    exists (select 1 from vault.decrypted_secrets where name = 'score_snapshot_service_key'),
    exists (select 1 from cron.job where jobname = 'record-score-snapshots-daily' and active),
    exists (select 1 from cron.job where jobname = 'record-score-snapshots-month-close' and active),
    (select count(*) from public.organizations),
    (select count(*) from public.compliance_score_snapshots
      where month = date_trunc('month', timezone('utc', now()))::date),
    (select count(*) from public.compliance_score_snapshots
      where month = (date_trunc('month', timezone('utc', now())) - interval '1 month')::date
        and updated_at >= date_trunc('month', now() at time zone 'utc') at time zone 'utc'),
    (select max(updated_at) from public.compliance_score_snapshots);
$$;


ALTER FUNCTION "public"."score_snapshot_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_support_ticket_reference"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  if new.public_reference is null or new.public_reference = '' then
    new.public_reference :=
      'DUT-' || to_char(timezone('utc', now()), 'YYYY') || '-' ||
      lpad(nextval('public.support_ticket_ref_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."set_support_ticket_reference"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."playbook_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "playbook_id" "uuid",
    "initiated_by" "uuid",
    "status" "text" DEFAULT 'running'::"text" NOT NULL,
    "current_step" integer DEFAULT 0 NOT NULL,
    "input" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "output" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "completed_at" timestamp with time zone,
    "error_message" "text",
    CONSTRAINT "playbook_runs_current_step_check" CHECK (("current_step" >= 0)),
    CONSTRAINT "playbook_runs_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'running'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."playbook_runs" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."start_playbook_run"("target_organization_id" "uuid", "target_playbook_key" "text", "run_input" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "public"."playbook_runs"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  pb public.workflow_playbooks;
  run public.playbook_runs;
begin
  if not (public.is_admin((select auth.uid())) or public.is_org_member(target_organization_id, (select auth.uid()))) then
    raise exception 'not authorized';
  end if;

  select * into pb from public.workflow_playbooks where key = target_playbook_key and status = 'active';
  if pb.id is null then raise exception 'active playbook not found'; end if;

  insert into public.playbook_runs(organization_id, playbook_id, initiated_by, input)
  values (target_organization_id, pb.id, (select auth.uid()), coalesce(run_input, '{}'::jsonb))
  returning * into run;

  insert into public.job_queue(organization_id, job_type, payload, priority, created_by)
  values (target_organization_id, 'custom', jsonb_build_object('playbook_run_id', run.id, 'playbook_key', target_playbook_key), 100, (select auth.uid()));

  return run;
end;
$$;


ALTER FUNCTION "public"."start_playbook_run"("target_organization_id" "uuid", "target_playbook_key" "text", "run_input" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_signature_by_token"("p_token" "uuid", "p_signature_data" "text", "p_signature_type" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_sig public.signatures;
BEGIN
  SELECT * INTO v_sig FROM public.signatures WHERE token = p_token LIMIT 1;

  IF v_sig.id IS NULL THEN
    RAISE EXCEPTION 'Signing link not found or invalid.';
  END IF;

  IF v_sig.status = 'signed' THEN
    RAISE EXCEPTION 'This document has already been signed.';
  END IF;

  IF v_sig.status = 'cancelled' THEN
    RAISE EXCEPTION 'This signing request has been cancelled by the sender.';
  END IF;

  IF v_sig.expires_at IS NOT NULL AND v_sig.expires_at <= timezone('utc', now()) THEN
    INSERT INTO public.signature_audit_events (signature_id, document_id, user_id, event_type)
    VALUES (v_sig.id, v_sig.document_id, v_sig.user_id, 'signature_failed_or_expired');
    RAISE EXCEPTION 'This signing link has expired.';
  END IF;

  UPDATE public.signatures
  SET    signature_data = p_signature_data,
         status         = 'signed',
         signed_at      = timezone('utc', now()),
         signature_type = p_signature_type
  WHERE  token      = p_token
    AND  status     = 'pending'
    AND  (expires_at IS NULL OR expires_at > timezone('utc', now()));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Signing link not found, already signed, cancelled, or expired.';
  END IF;

  INSERT INTO public.signature_audit_events (signature_id, document_id, user_id, event_type)
  VALUES (v_sig.id, v_sig.document_id, v_sig.user_id, 'signature_submitted');
END;
$$;


ALTER FUNCTION "public"."submit_signature_by_token"("p_token" "uuid", "p_signature_data" "text", "p_signature_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."support_analytics_rollup"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  insert into public.support_analytics_daily (
    day, event_type, workspace_id, article_slug, ticket_category,
    event_count, helpfulness_yes, helpfulness_no, search_zero_results
  )
  select
    date_trunc('day', occurred_at, 'UTC')::date as day,
    event_type,
    workspace_id,
    article_slug,
    ticket_category,
    count(*) as event_count,
    count(*) filter (where event_type = 'helpfulness_vote' and vote_value = 'yes') as helpfulness_yes,
    count(*) filter (where event_type = 'helpfulness_vote' and vote_value = 'no') as helpfulness_no,
    count(*) filter (where event_type = 'help_search' and search_result_count = 0) as search_zero_results
  from public.support_analytics_events
  where occurred_at >= date_trunc('day', now() - interval '1 day', 'UTC')
    and occurred_at <  date_trunc('day', now(), 'UTC')
  group by 1, 2, 3, 4, 5
  on conflict (day, event_type, workspace_id, article_slug, ticket_category)
  do update set
    event_count        = excluded.event_count,
    helpfulness_yes    = excluded.helpfulness_yes,
    helpfulness_no     = excluded.helpfulness_no,
    search_zero_results = excluded.search_zero_results;

  delete from public.support_analytics_events
   where occurred_at < timezone('utc', now()) - interval '90 days';
end;
$$;


ALTER FUNCTION "public"."support_analytics_rollup"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."support_analytics_status"() RETURNS TABLE("rollup_scheduled" boolean, "raw_event_count" bigint, "oldest_raw_event" timestamp with time zone, "daily_aggregate_rows" bigint, "latest_aggregate_day" "date", "rate_limit_purge_scheduled" boolean, "rate_limit_rows" bigint, "oldest_rate_limit_row" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
  select
    exists (select 1 from cron.job where jobname = 'support-analytics-rollup' and active),
    (select count(*) from public.support_analytics_events),
    (select min(occurred_at) from public.support_analytics_events),
    (select count(*) from public.support_analytics_daily),
    (select max(day) from public.support_analytics_daily),
    exists (select 1 from cron.job where jobname = 'purge-support-analytics-rate-limit' and active),
    (select count(*) from public.support_analytics_rate_limit),
    (select min(created_at) from public.support_analytics_rate_limit);
$$;


ALTER FUNCTION "public"."support_analytics_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."support_call_scheduler_status"() RETURNS TABLE("secret_configured" boolean, "job_scheduled" boolean, "proposed_count" bigint, "confirmed_count" bigint, "awaiting_reminder" bigint, "awaiting_followup" bigint, "last_reminder_sent" timestamp with time zone, "last_followup_flagged" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
  select
    exists (select 1 from vault.decrypted_secrets where name = 'support_scheduler_service_key'),
    exists (select 1 from cron.job where jobname = 'support-call-scheduler-sweep' and active),
    (select count(*) from public.support_scheduled_calls where status = 'proposed'),
    (select count(*) from public.support_scheduled_calls where status = 'confirmed'),
    (select count(*) from public.support_scheduled_calls
       where status = 'confirmed' and reminder_sent_at is null
         and confirmed_start < now() + interval '24 hours'),
    (select count(*) from public.support_scheduled_calls
       where status = 'confirmed' and followup_flagged_at is null
         and confirmed_end < now() - interval '2 hours'),
    (select max(reminder_sent_at) from public.support_scheduled_calls),
    (select max(followup_flagged_at) from public.support_scheduled_calls);
$$;


ALTER FUNCTION "public"."support_call_scheduler_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_document_jurisdiction_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  resolved_label text;
begin
  resolved_label := public.normalize_document_jurisdiction_label(
    new.jurisdiction_code,
    new.document_inputs #>> '{form,jurisdiction}'
  );

  if new.jurisdiction is null or btrim(new.jurisdiction) = '' then
    new.jurisdiction := resolved_label;
  end if;

  if new.province is null or btrim(new.province) = '' then
    new.province := resolved_label;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."sync_document_jurisdiction_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_advisor_guidance_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end
$$;


ALTER FUNCTION "public"."touch_advisor_guidance_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_employer_profiles_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;


ALTER FUNCTION "public"."touch_employer_profiles_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_offer_workflow_states_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;


ALTER FUNCTION "public"."touch_offer_workflow_states_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_support_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;


ALTER FUNCTION "public"."touch_support_updated_at"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "title" "text",
    "content" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "jurisdiction_code" "text",
    "template_key" "text",
    "jurisdiction_data_version" "text",
    "generated_at" timestamp with time zone,
    "organization_id" "uuid",
    "lifecycle_status" "text" DEFAULT 'draft'::"text",
    "current_version" integer DEFAULT 1 NOT NULL,
    "approved_at" timestamp with time zone,
    "published_at" timestamp with time zone,
    "archived_at" timestamp with time zone,
    "document_inputs" "jsonb",
    "employer_profile_id" "uuid",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "completed_at" timestamp with time zone,
    "archived_reason" "text",
    "province" "text",
    "jurisdiction" "text",
    CONSTRAINT "documents_current_version_check" CHECK (("current_version" > 0)),
    CONSTRAINT "documents_lifecycle_status_check" CHECK (("lifecycle_status" = ANY (ARRAY['draft'::"text", 'in_review'::"text", 'approved'::"text", 'published'::"text", 'archived'::"text", 'void'::"text"]))),
    CONSTRAINT "documents_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'complete'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


COMMENT ON COLUMN "public"."documents"."jurisdiction_code" IS 'Engine code (ON/QC/BC/AB/FED) at generation time — used by complianceAlerts engine.';



COMMENT ON COLUMN "public"."documents"."template_key" IS 'UI template name at generation time, e.g. "Offer Letter".';



COMMENT ON COLUMN "public"."documents"."jurisdiction_data_version" IS 'Value of LAW_DATA_VERSION from src/lib/generator/jurisdiction_data.js when generated.';



COMMENT ON COLUMN "public"."documents"."generated_at" IS 'Wall-clock timestamp of the generation that produced the current content. Distinct from updated_at.';



COMMENT ON COLUMN "public"."documents"."archived_at" IS 'UTC timestamp set when a user archives a saved document from active workspaces.';



COMMENT ON COLUMN "public"."documents"."document_inputs" IS 'Structured generator input snapshot used to reopen interactive generated documents without parsing documents.content.';



COMMENT ON COLUMN "public"."documents"."employer_profile_id" IS 'Employer profile whose defaults and approval settings were used for this document.';



COMMENT ON COLUMN "public"."documents"."status" IS 'Saved document lifecycle status for active, completed, and archived workspace views.';



COMMENT ON COLUMN "public"."documents"."completed_at" IS 'UTC timestamp set when a user marks a saved document complete.';



COMMENT ON COLUMN "public"."documents"."archived_reason" IS 'Optional user/system reason for archived saved documents.';



CREATE OR REPLACE FUNCTION "public"."transition_document_status"("target_document_id" "uuid", "new_status" "text", "note" "text" DEFAULT NULL::"text") RETURNS "public"."documents"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  doc public.documents;
  updated_doc public.documents;
begin
  select * into doc from public.documents where id = target_document_id;
  if doc.id is null then raise exception 'document not found'; end if;

  if new_status not in ('draft','in_review','approved','published','archived','void') then
    raise exception 'invalid lifecycle status';
  end if;

  if not (
    public.is_admin((select auth.uid()))
    or public.is_org_member(doc.organization_id, (select auth.uid()))
    or doc.user_id = (select auth.uid())
  ) then
    raise exception 'not authorized';
  end if;

  update public.documents
  set lifecycle_status = new_status,
      approved_at = case when new_status = 'approved' then timezone('utc', now()) else approved_at end,
      published_at = case when new_status = 'published' then timezone('utc', now()) else published_at end,
      archived_at = case when new_status in ('archived','void') then timezone('utc', now()) else archived_at end,
      updated_at = timezone('utc', now())
  where id = target_document_id
  returning * into updated_doc;

  insert into public.admin_audit_log(actor_user_id, action, target_table, target_id, metadata)
  values ((select auth.uid()), 'transition_document_status', 'documents', target_document_id::text, jsonb_build_object('status', new_status, 'note', note));

  return updated_doc;
end;
$$;


ALTER FUNCTION "public"."transition_document_status"("target_document_id" "uuid", "new_status" "text", "note" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_attachment_scan"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
    from vault.decrypted_secrets
   where name = 'support_notify_secret';

  if v_secret is null or length(btrim(v_secret)) = 0 then
    raise warning '[attachment-scan] vault secret "support_notify_secret" is not set; skipping run';
    return;
  end if;

  perform net.http_post(
    url     := 'https://khtwpxnvziiyplaflwru.supabase.co/functions/v1/support-attachment-scan',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'x-scan-secret', v_secret
    ),
    body                 := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
end;
$$;


ALTER FUNCTION "public"."trigger_attachment_scan"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_law_monitor"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare
  v_key    text;
  v_secret text;
begin
  select decrypted_secret into v_key
    from vault.decrypted_secrets where name = 'law_monitor_service_key';
  select decrypted_secret into v_secret
    from vault.decrypted_secrets where name = 'support_notify_secret';

  if v_secret is null or length(btrim(v_secret)) = 0 then
    raise warning '[law-monitor] vault secret "support_notify_secret" is not set; skipping run';
    return;
  end if;

  perform net.http_post(
    url     := 'https://khtwpxnvziiyplaflwru.supabase.co/functions/v1/monitor-law-changes',
    headers := jsonb_build_object(
      'Content-Type',      'application/json',
      'Authorization',     'Bearer ' || coalesce(v_key, ''),
      'x-trigger-secret',  v_secret
    ),
    body                 := '{}'::jsonb,
    timeout_milliseconds := 300000
  );
end;
$$;


ALTER FUNCTION "public"."trigger_law_monitor"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_law_update_digest"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
    from vault.decrypted_secrets where name = 'support_notify_secret';

  if v_secret is null or length(btrim(v_secret)) = 0 then
    raise warning '[law-update-digest] vault secret "support_notify_secret" is not set; skipping run';
    return;
  end if;

  perform net.http_post(
    url     := 'https://khtwpxnvziiyplaflwru.supabase.co/functions/v1/send-law-updates',
    headers := jsonb_build_object(
      'Content-Type',    'application/json',
      'x-notify-secret', v_secret
    ),
    body                 := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
end;
$$;


ALTER FUNCTION "public"."trigger_law_update_digest"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_score_snapshots"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare
  v_key text;
begin
  select decrypted_secret into v_key
    from vault.decrypted_secrets
   where name = 'score_snapshot_service_key';

  if v_key is null or length(btrim(v_key)) = 0 then
    raise warning '[score-snapshots] vault secret "score_snapshot_service_key" is not set; skipping run';
    return;
  end if;

  -- Fire-and-forget: pg_net queues the request and the edge function does
  -- the work (a handful of small per-org queries; the timeout is ample).
  perform net.http_post(
    url     := 'https://khtwpxnvziiyplaflwru.supabase.co/functions/v1/record-score-snapshots',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body                 := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
end;
$$;


ALTER FUNCTION "public"."trigger_score_snapshots"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_support_call_scheduler"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare
  v_key    text;
  v_secret text;
begin
  select decrypted_secret into v_key
    from vault.decrypted_secrets where name = 'support_scheduler_service_key';
  select decrypted_secret into v_secret
    from vault.decrypted_secrets where name = 'support_notify_secret';

  if v_secret is null or length(btrim(v_secret)) = 0 then
    raise warning '[support-call-scheduler] vault secret "support_notify_secret" is not set; skipping run';
    return;
  end if;

  perform net.http_post(
    url     := 'https://khtwpxnvziiyplaflwru.supabase.co/functions/v1/support-call-scheduler',
    headers := jsonb_build_object(
      'Content-Type',      'application/json',
      'Authorization',     'Bearer ' || coalesce(v_key, ''),
      'x-trigger-secret',  v_secret
    ),
    body                 := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
end;
$$;


ALTER FUNCTION "public"."trigger_support_call_scheduler"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_activity_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "action" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "text",
    "details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_activity_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_analytics_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "snapshot_key" "text" NOT NULL,
    "label" "text" NOT NULL,
    "value" "text" NOT NULL,
    "helper" "text",
    "captured_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."admin_analytics_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_app_error_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "account_email" "text",
    "source" "text" DEFAULT 'client_app'::"text" NOT NULL,
    "route" "text",
    "severity" "text" DEFAULT 'warning'::"text" NOT NULL,
    "summary" "text" NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "admin_app_error_events_severity_check" CHECK (("severity" = ANY (ARRAY['info'::"text", 'warning'::"text", 'error'::"text", 'critical'::"text"]))),
    CONSTRAINT "admin_app_error_events_summary_length_check" CHECK ((("char_length"("summary") >= 1) AND ("char_length"("summary") <= 500)))
);


ALTER TABLE "public"."admin_app_error_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."admin_app_error_events" IS 'Sanitized application error events for the internal Admin/Beta dashboard.';



CREATE TABLE IF NOT EXISTS "public"."admin_beta_access" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "user_email" "text" NOT NULL,
    "status" "text" DEFAULT 'invited'::"text" NOT NULL,
    "rings" "text"[] DEFAULT ARRAY['ring_1_hr_documents'::"text"] NOT NULL,
    "notes" "text",
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "admin_beta_access_status_check" CHECK (("status" = ANY (ARRAY['invited'::"text", 'active'::"text", 'paused'::"text", 'removed'::"text"])))
);


ALTER TABLE "public"."admin_beta_access" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_beta_feedback_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "account_email" "text",
    "source" "text" DEFAULT 'in_app'::"text" NOT NULL,
    "status" "text" DEFAULT 'triage'::"text" NOT NULL,
    "summary" "text" NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "admin_beta_feedback_events_status_check" CHECK (("status" = ANY (ARRAY['triage'::"text", 'reviewing'::"text", 'planned'::"text", 'resolved'::"text", 'closed'::"text"]))),
    CONSTRAINT "admin_beta_feedback_events_summary_length_check" CHECK ((("char_length"("summary") >= 1) AND ("char_length"("summary") <= 500)))
);


ALTER TABLE "public"."admin_beta_feedback_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."admin_beta_feedback_events" IS 'Sanitized beta/product feedback events for the internal Admin/Beta dashboard.';



CREATE TABLE IF NOT EXISTS "public"."admin_feature_flags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "enabled" boolean DEFAULT false NOT NULL,
    "audience" "text" DEFAULT 'internal'::"text" NOT NULL,
    "environment" "text" DEFAULT 'production'::"text" NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_feature_flags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_plan_overrides" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "user_email" "text" NOT NULL,
    "current_plan" "text",
    "override_plan" "text" NOT NULL,
    "reason" "text",
    "expires_at" timestamp with time zone,
    "removed_at" timestamp with time zone,
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_plan_overrides" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" DEFAULT 'admin'::"text" NOT NULL,
    "granted_by" "uuid",
    "granted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "revoked_at" timestamp with time zone,
    "revoked_by" "uuid",
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "admin_users_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."advisor_guidance_chunks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "jurisdiction" "text" NOT NULL,
    "topic" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "source_url" "text" NOT NULL,
    "source_name" "text" NOT NULL,
    "effective_note" "text",
    "retrieved_at" "date" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "review_status" "text" DEFAULT 'machine_curated'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "fts" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"english"'::"regconfig", (("title" || ' '::"text") || "content"))) STORED,
    "title_fr" "text",
    "content_fr" "text",
    "fts_fr" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"french"'::"regconfig", ((COALESCE("title_fr", ''::"text") || ' '::"text") || COALESCE("content_fr", ''::"text")))) STORED,
    "source_changed_at" timestamp with time zone,
    "source_change_note" "text",
    CONSTRAINT "advisor_guidance_chunks_jurisdiction_check" CHECK (("jurisdiction" = ANY (ARRAY['ON'::"text", 'QC'::"text", 'FED'::"text", 'ALL'::"text"]))),
    CONSTRAINT "advisor_guidance_chunks_review_status_check" CHECK (("review_status" = ANY (ARRAY['machine_curated'::"text", 'reviewed'::"text"]))),
    CONSTRAINT "advisor_guidance_chunks_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'retired'::"text"])))
);


ALTER TABLE "public"."advisor_guidance_chunks" OWNER TO "postgres";


COMMENT ON COLUMN "public"."advisor_guidance_chunks"."title_fr" IS 'Optional French title, authored from a live French official source -- never machine-translated from title. Null until backfilled.';



COMMENT ON COLUMN "public"."advisor_guidance_chunks"."content_fr" IS 'Optional French body, authored from a live French official source -- never machine-translated from content. Null until backfilled.';



COMMENT ON COLUMN "public"."advisor_guidance_chunks"."source_changed_at" IS 'Stamped by the law_updates trigger when the monitor detects a change in this chunk''s jurisdiction. While set, the chunk''s citation renders as needs-review even if review_status = reviewed. Cleared by a human on re-verification.';



CREATE TABLE IF NOT EXISTS "public"."ai_agents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "agent_type" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "capabilities" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "default_model" "text",
    "guardrails" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "ai_agents_agent_type_check" CHECK (("agent_type" = ANY (ARRAY['hr'::"text", 'compliance'::"text", 'legal_monitor'::"text", 'onboarding'::"text", 'policy'::"text", 'document'::"text", 'operations'::"text", 'admin'::"text"]))),
    CONSTRAINT "ai_agents_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'paused'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."ai_agents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_drafting_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "user_id" "uuid",
    "document_id" "uuid",
    "session_type" "text" NOT NULL,
    "jurisdiction" "text",
    "status" "text" DEFAULT 'drafting'::"text" NOT NULL,
    "prompt_summary" "text",
    "generated_output" "text",
    "citations" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "model_metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "ai_drafting_sessions_session_type_check" CHECK (("session_type" = ANY (ARRAY['offer_letter'::"text", 'policy'::"text", 'handbook'::"text", 'agreement'::"text", 'remediation_plan'::"text", 'general'::"text"]))),
    CONSTRAINT "ai_drafting_sessions_status_check" CHECK (("status" = ANY (ARRAY['drafting'::"text", 'ready_for_review'::"text", 'approved'::"text", 'published'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."ai_drafting_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_model_providers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_key" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "provider_type" "text" NOT NULL,
    "status" "text" DEFAULT 'inactive'::"text" NOT NULL,
    "secret_ref" "text",
    "base_url" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "ai_model_providers_provider_type_check" CHECK (("provider_type" = ANY (ARRAY['openai'::"text", 'anthropic'::"text", 'mistral'::"text", 'huggingface'::"text", 'local'::"text", 'custom'::"text"]))),
    CONSTRAINT "ai_model_providers_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'error'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."ai_model_providers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_model_routes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "route_key" "text" NOT NULL,
    "operation" "text" NOT NULL,
    "provider_id" "uuid",
    "model_name" "text" NOT NULL,
    "priority" integer DEFAULT 100 NOT NULL,
    "status" "text" DEFAULT 'inactive'::"text" NOT NULL,
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "ai_model_routes_operation_check" CHECK (("operation" = ANY (ARRAY['chat'::"text", 'draft'::"text", 'embed'::"text", 'classify'::"text", 'summarize'::"text", 'recommend'::"text", 'score'::"text", 'tool_call'::"text"]))),
    CONSTRAINT "ai_model_routes_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'fallback'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."ai_model_routes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."benchmark_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "benchmark_type" "text" NOT NULL,
    "metric_key" "text" NOT NULL,
    "metric_value" numeric,
    "percentile" numeric(5,2),
    "comparison_summary" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "benchmark_snapshots_benchmark_type_check" CHECK (("benchmark_type" = ANY (ARRAY['internal_trend'::"text", 'industry_placeholder'::"text", 'jurisdiction_placeholder'::"text", 'plan_segment'::"text"]))),
    CONSTRAINT "benchmark_snapshots_percentile_check" CHECK ((("percentile" IS NULL) OR (("percentile" >= (0)::numeric) AND ("percentile" <= (100)::numeric))))
);


ALTER TABLE "public"."benchmark_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."beta_signup_intake" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ip_hash" "text",
    "email_hash" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."beta_signup_intake" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_error_rate_limit" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ip_hash" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."client_error_rate_limit" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_error_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "env" "text",
    "release" "text",
    "route" "text",
    "locale" "text",
    "kind" "text",
    "message" "text",
    "stack" "text",
    "user_agent" "text",
    CONSTRAINT "client_error_reports_env_check" CHECK (("env" = ANY (ARRAY['production'::"text", 'preview'::"text"]))),
    CONSTRAINT "client_error_reports_kind_check" CHECK ((("kind" IS NULL) OR ("kind" = ANY (ARRAY['route-boundary'::"text", 'window-error'::"text", 'unhandled-rejection'::"text", 'recoverable-error'::"text"])))),
    CONSTRAINT "client_error_reports_locale_check" CHECK ((("locale" IS NULL) OR ("locale" = ANY (ARRAY['en-CA'::"text", 'fr-CA'::"text"])))),
    CONSTRAINT "client_error_reports_message_check" CHECK ((("message" IS NULL) OR ("char_length"("message") <= 2000))),
    CONSTRAINT "client_error_reports_release_check" CHECK ((("release" IS NULL) OR ("char_length"("release") <= 64))),
    CONSTRAINT "client_error_reports_route_check" CHECK ((("route" IS NULL) OR ("char_length"("route") <= 200))),
    CONSTRAINT "client_error_reports_stack_check" CHECK ((("stack" IS NULL) OR ("char_length"("stack") <= 8000))),
    CONSTRAINT "client_error_reports_user_agent_check" CHECK ((("user_agent" IS NULL) OR ("char_length"("user_agent") <= 200)))
);


ALTER TABLE "public"."client_error_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "name" "text" NOT NULL,
    "tier_id" "uuid",
    "jurisdiction_id" "uuid",
    "employee_count" integer,
    "industry" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comment_mentions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comment_id" "uuid" NOT NULL,
    "mentioned_user_id" "uuid",
    "mentioned_email" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."comment_mentions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."compliance_assessments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "document_id" "uuid",
    "assessment_type" "text" DEFAULT 'general'::"text" NOT NULL,
    "jurisdiction" "text",
    "score" numeric(5,2),
    "risk_level" "text" DEFAULT 'unknown'::"text" NOT NULL,
    "summary" "text",
    "assessed_by" "uuid",
    "assessed_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "compliance_assessments_assessment_type_check" CHECK (("assessment_type" = ANY (ARRAY['general'::"text", 'document'::"text", 'organization'::"text", 'law_update'::"text", 'onboarding'::"text", 'policy_gap'::"text"]))),
    CONSTRAINT "compliance_assessments_risk_level_check" CHECK (("risk_level" = ANY (ARRAY['unknown'::"text", 'low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "compliance_assessments_score_check" CHECK ((("score" IS NULL) OR (("score" >= (0)::numeric) AND ("score" <= (100)::numeric))))
);


ALTER TABLE "public"."compliance_assessments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."compliance_score_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "month" "date" NOT NULL,
    "score" integer NOT NULL,
    "components" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "headcount" integer,
    "formula_version" integer DEFAULT 1 NOT NULL,
    CONSTRAINT "compliance_score_snapshots_headcount_nonnegative" CHECK ((("headcount" IS NULL) OR ("headcount" >= 0))),
    CONSTRAINT "compliance_score_snapshots_month_is_month_start" CHECK (("month" = ("date_trunc"('month'::"text", ("month")::timestamp with time zone))::"date")),
    CONSTRAINT "compliance_score_snapshots_score_range" CHECK ((("score" >= 0) AND ("score" <= 100)))
);


ALTER TABLE "public"."compliance_score_snapshots" OWNER TO "postgres";


COMMENT ON COLUMN "public"."compliance_score_snapshots"."headcount" IS 'Active (non-terminated) employees at snapshot time; null for rows written before 0063.';



COMMENT ON COLUMN "public"."compliance_score_snapshots"."formula_version" IS 'Score formula that produced this row. 1: unweighted done/total blend. 2: severity-weighted findings, cancelled tasks excluded, open-critical ceiling of 69. 3: obligations component (status ok over all), tasks scoped to provenanced rows (category <> general or metadata.kind set). Source of truth: SCORE_FORMULA_VERSION in src/features/app/views/analytics/aggregation.ts and its mirror in supabase/functions/record-score-snapshots/scoring.ts.';



CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "province" "text" DEFAULT 'Ontario'::"text" NOT NULL,
    "messages" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "organization_id" "uuid"
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cron_locks" (
    "job_name" "text" NOT NULL,
    "instance_id" "text" NOT NULL,
    "acquired_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "expires_at" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."cron_locks" OWNER TO "postgres";


COMMENT ON TABLE "public"."cron_locks" IS 'Lease-style locks for edge-function cron jobs. Service-role only.';



CREATE TABLE IF NOT EXISTS "public"."devops_runbooks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "title" "text" NOT NULL,
    "category" "text" NOT NULL,
    "severity" "text" DEFAULT 'medium'::"text" NOT NULL,
    "steps" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "devops_runbooks_category_check" CHECK (("category" = ANY (ARRAY['backup'::"text", 'incident'::"text", 'security'::"text", 'deployment'::"text", 'database'::"text", 'ai'::"text", 'billing'::"text", 'support'::"text"]))),
    CONSTRAINT "devops_runbooks_severity_check" CHECK (("severity" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "devops_runbooks_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'draft'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."devops_runbooks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_generation_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "user_id" "uuid",
    "template_id" "uuid",
    "document_id" "uuid",
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "input" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "output" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "error_message" "text",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "document_generation_runs_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'running'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."document_generation_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "organization_id" "uuid",
    "requested_by" "uuid",
    "reviewer_user_id" "uuid",
    "reviewer_email" "text",
    "status" "text" DEFAULT 'requested'::"text" NOT NULL,
    "notes" "text",
    "due_at" timestamp with time zone,
    "decided_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "document_reviews_status_check" CHECK (("status" = ANY (ARRAY['requested'::"text", 'in_review'::"text", 'approved'::"text", 'changes_requested'::"text", 'rejected'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."document_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "title" "text",
    "email" "text",
    "province" "text" DEFAULT 'Ontario'::"text" NOT NULL,
    "start_date" "date",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "probation_end_date" "date",
    "termination_date" "date",
    CONSTRAINT "employees_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'on_leave'::"text", 'terminated'::"text"])))
);


ALTER TABLE "public"."employees" OWNER TO "postgres";


COMMENT ON COLUMN "public"."employees"."probation_end_date" IS 'End of the probationary period, entered per employee (never derived from start_date).';



COMMENT ON COLUMN "public"."employees"."termination_date" IS 'Date employment ended; null for pre-0066 terminations, which are excluded from turnover.';



CREATE TABLE IF NOT EXISTS "public"."employer_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "legal_name" "text" NOT NULL,
    "trade_name" "text",
    "default_jurisdiction" "text" DEFAULT 'Ontario'::"text" NOT NULL,
    "default_language" "text" DEFAULT 'EN'::"text" NOT NULL,
    "combined_offer_default" boolean DEFAULT true NOT NULL,
    "default_probation_length" "text" DEFAULT 'three (3) months'::"text",
    "default_vacation_weeks" integer DEFAULT 2,
    "default_benefits_plan_name" "text",
    "default_pay_frequency" "text" DEFAULT 'bi-weekly'::"text",
    "covenant_stance" "text" DEFAULT 'standard'::"text" NOT NULL,
    "employee_count_tier" "text" DEFAULT '1-4'::"text",
    "approval_required" boolean DEFAULT false NOT NULL,
    "approval_notes" "text",
    "default_hr_contact_name" "text",
    "default_hr_contact_email" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "organization_id" "uuid",
    CONSTRAINT "employer_profiles_covenant_stance_check" CHECK (("covenant_stance" = ANY (ARRAY['none'::"text", 'standard'::"text", 'strict'::"text"]))),
    CONSTRAINT "employer_profiles_default_jurisdiction_check" CHECK (("default_jurisdiction" = ANY (ARRAY['Ontario'::"text", 'Quebec'::"text", 'British Columbia'::"text", 'Alberta'::"text", 'Federal'::"text"]))),
    CONSTRAINT "employer_profiles_default_language_check" CHECK (("default_language" = ANY (ARRAY['EN'::"text", 'FR'::"text", 'BOTH'::"text"]))),
    CONSTRAINT "employer_profiles_default_pay_frequency_check" CHECK (("default_pay_frequency" = ANY (ARRAY['bi-weekly'::"text", 'semi-monthly'::"text", 'monthly'::"text"]))),
    CONSTRAINT "employer_profiles_employee_count_tier_check" CHECK (("employee_count_tier" = ANY (ARRAY['1-4'::"text", '5-24'::"text", '25-49'::"text", '50+'::"text"])))
);


ALTER TABLE "public"."employer_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employer_tiers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "code" character varying(2) NOT NULL,
    "name" "text" NOT NULL,
    "label" "text" NOT NULL,
    "description" "text",
    "size_range_min" integer DEFAULT 0 NOT NULL,
    "size_range_max" integer,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."employer_tiers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."export_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "surface" "text" NOT NULL,
    "kind" "text" NOT NULL,
    "title" "text" DEFAULT ''::"text" NOT NULL,
    "content_sha256" "text" NOT NULL,
    "content_chars" integer DEFAULT 0 NOT NULL,
    "lang" "text" DEFAULT 'en'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "export_events_content_chars_check" CHECK (("content_chars" >= 0)),
    CONSTRAINT "export_events_content_sha256_check" CHECK (("content_sha256" ~ '^([0-9a-f]{64}|fnv1a:[0-9a-f]{16})$'::"text")),
    CONSTRAINT "export_events_kind_check" CHECK (("kind" = ANY (ARRAY['pdf'::"text", 'word'::"text", 'link'::"text", 'json'::"text", 'text'::"text"]))),
    CONSTRAINT "export_events_lang_check" CHECK (("lang" = ANY (ARRAY['en'::"text", 'fr'::"text"]))),
    CONSTRAINT "export_events_surface_check" CHECK (("surface" = ANY (ARRAY['docstudio'::"text", 'doclib'::"text", 'memory'::"text", 'advisor'::"text"]))),
    CONSTRAINT "export_events_title_check" CHECK (("char_length"("title") <= 200))
);


ALTER TABLE "public"."export_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."export_events" IS 'One row per authorized export of company-generated content; the artifact''s embedded export id is this row''s id. Written only by record-export (service role).';



CREATE TABLE IF NOT EXISTS "public"."frontend_feature_flags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "description" "text",
    "enabled" boolean DEFAULT false NOT NULL,
    "rollout_percentage" integer DEFAULT 0 NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "frontend_feature_flags_rollout_percentage_check" CHECK ((("rollout_percentage" >= 0) AND ("rollout_percentage" <= 100)))
);


ALTER TABLE "public"."frontend_feature_flags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."generator_document_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_slug" "text" NOT NULL,
    "workflow_key" "text" NOT NULL,
    "title" "text" NOT NULL,
    "jurisdiction" "text" DEFAULT 'ontario'::"text" NOT NULL,
    "language" "text" DEFAULT 'en'::"text" NOT NULL,
    "doc_type" "text" DEFAULT 'letter'::"text" NOT NULL,
    "generator_schema" "jsonb" DEFAULT '{"fields": []}'::"jsonb" NOT NULL,
    "title_template" "text" DEFAULT '{{title}}'::"text" NOT NULL,
    "body_template" "text" NOT NULL,
    "is_generator_enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "generator_document_templates_language_check" CHECK (("language" = ANY (ARRAY['en'::"text", 'fr'::"text", 'both'::"text"])))
);


ALTER TABLE "public"."generator_document_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."generator_document_templates" IS 'Server-side HR document templates consumed by the generate-document Edge Function.';



CREATE OR REPLACE VIEW "public"."generator_templates" WITH ("security_invoker"='true') AS
 SELECT "id",
    "template_slug",
    "workflow_key",
    "title",
    "jurisdiction",
    "language",
    "doc_type",
    "generator_schema",
    "is_generator_enabled",
    "created_at",
    "updated_at"
   FROM "public"."generator_document_templates";


ALTER VIEW "public"."generator_templates" OWNER TO "postgres";


COMMENT ON VIEW "public"."generator_templates" IS 'Data API view of enabled generator templates used by the browser client.';



CREATE TABLE IF NOT EXISTS "public"."guidance_chunks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_id" "uuid",
    "organization_id" "uuid",
    "chunk_index" integer DEFAULT 0 NOT NULL,
    "title" "text",
    "content" "text" NOT NULL,
    "jurisdiction" "text",
    "tags" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL,
    "embedding_model" "text",
    "embedding" "extensions"."vector"(384),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."guidance_chunks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."guidance_sources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "source_type" "text" NOT NULL,
    "jurisdiction" "text",
    "url" "text",
    "version" "text",
    "effective_date" "date",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "guidance_sources_source_type_check" CHECK (("source_type" = ANY (ARRAY['law'::"text", 'regulation'::"text", 'policy'::"text", 'template'::"text", 'internal_guidance'::"text", 'public_guidance'::"text", 'case_note'::"text"]))),
    CONSTRAINT "guidance_sources_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'draft'::"text", 'archived'::"text", 'superseded'::"text"])))
);


ALTER TABLE "public"."guidance_sources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hr_case_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "case_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."hr_case_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hr_cases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "case_type" "text" DEFAULT 'Performance'::"text" NOT NULL,
    "employee_id" "uuid",
    "province" "text" DEFAULT 'Ontario'::"text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "due_date" "date",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "hr_cases_case_type_check" CHECK (("case_type" = ANY (ARRAY['Termination'::"text", 'Performance'::"text", 'Accommodation'::"text", 'Onboarding'::"text"]))),
    CONSTRAINT "hr_cases_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_review'::"text", 'resolved'::"text"])))
);


ALTER TABLE "public"."hr_cases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hr_communications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "audience" "text",
    "channel" "text" DEFAULT 'email'::"text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "scheduled_for" "date",
    "sent_on" "date",
    "template_tid" "text",
    "note" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "hr_communications_channel_check" CHECK (("channel" = ANY (ARRAY['email'::"text", 'meeting'::"text", 'intranet'::"text", 'letter'::"text", 'other'::"text"]))),
    CONSTRAINT "hr_communications_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'scheduled'::"text", 'sent'::"text"])))
);


ALTER TABLE "public"."hr_communications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hr_compensation_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "base_salary" numeric(12,2) NOT NULL,
    "band" "text",
    "band_midpoint" numeric(12,2),
    "effective_date" "date",
    "note" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "hr_compensation_records_band_midpoint_check" CHECK (("band_midpoint" > (0)::numeric)),
    CONSTRAINT "hr_compensation_records_base_salary_check" CHECK (("base_salary" >= (0)::numeric))
);


ALTER TABLE "public"."hr_compensation_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hr_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "filename" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "jurisdiction" "text" NOT NULL,
    "doc_type" "text" NOT NULL,
    "employer_size" "text" NOT NULL,
    "language" "text" DEFAULT 'en'::"text" NOT NULL,
    "description" "text",
    "storage_path" "text",
    "file_size_kb" integer,
    "version" "text" DEFAULT '1.0'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "template_slug" "text",
    "generator_schema" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "prompt_template" "text",
    "workflow_key" "text",
    "is_generator_enabled" boolean DEFAULT true NOT NULL,
    "requires_review" boolean DEFAULT true NOT NULL,
    CONSTRAINT "hr_documents_doc_type_check" CHECK (("doc_type" = ANY (ARRAY['offer_letter'::"text", 'employment_agreement'::"text", 'employee_handbook'::"text"]))),
    CONSTRAINT "hr_documents_employer_size_check" CHECK (("employer_size" = ANY (ARRAY['all'::"text", 'small'::"text", 'mid'::"text", 'large'::"text"]))),
    CONSTRAINT "hr_documents_jurisdiction_check" CHECK (("jurisdiction" = ANY (ARRAY['federal'::"text", 'ontario'::"text", 'quebec'::"text", 'remote_federal'::"text"]))),
    CONSTRAINT "hr_documents_language_check" CHECK (("language" = ANY (ARRAY['en'::"text", 'fr'::"text"])))
);


ALTER TABLE "public"."hr_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hr_employee_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."hr_employee_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hr_expiry_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "kind" "text" NOT NULL,
    "name" "text" NOT NULL,
    "expiry_date" "date" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "hr_expiry_records_kind_check" CHECK (("kind" = ANY (ARRAY['certification'::"text", 'document'::"text"])))
);


ALTER TABLE "public"."hr_expiry_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hr_leaves" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "leave_type" "text" NOT NULL,
    "is_protected" boolean DEFAULT false NOT NULL,
    "start_date" "date",
    "expected_return_date" "date",
    "ended_on" "date",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."hr_leaves" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hr_obligations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "area" "text",
    "jurisdiction" "text",
    "due_on" "date",
    "recurrence" "text",
    "owner_name" "text",
    "status" "text" DEFAULT 'needs_evidence'::"text" NOT NULL,
    "evidence" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "hr_obligations_status_check" CHECK (("status" = ANY (ARRAY['ok'::"text", 'in_progress'::"text", 'needs_evidence'::"text"])))
);


ALTER TABLE "public"."hr_obligations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hr_policies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "status" "text" DEFAULT 'up_to_date'::"text" NOT NULL,
    "last_reviewed" "date",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "hr_policies_status_check" CHECK (("status" = ANY (ARRAY['up_to_date'::"text", 'needs_review'::"text", 'missing'::"text"])))
);


ALTER TABLE "public"."hr_policies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hr_wellbeing_initiatives" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "kind" "text" DEFAULT 'other'::"text" NOT NULL,
    "status" "text" DEFAULT 'planned'::"text" NOT NULL,
    "owner" "text",
    "review_date" "date",
    "note" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "hr_wellbeing_initiatives_kind_check" CHECK (("kind" = ANY (ARRAY['eap'::"text", 'training'::"text", 'policy'::"text", 'check_in'::"text", 'accommodation_support'::"text", 'other'::"text"]))),
    CONSTRAINT "hr_wellbeing_initiatives_status_check" CHECK (("status" = ANY (ARRAY['planned'::"text", 'active'::"text", 'paused'::"text", 'retired'::"text"])))
);


ALTER TABLE "public"."hr_wellbeing_initiatives" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "attempt_number" integer NOT NULL,
    "worker_id" "text",
    "status" "text" NOT NULL,
    "error_message" "text",
    "output" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "completed_at" timestamp with time zone,
    CONSTRAINT "job_attempts_status_check" CHECK (("status" = ANY (ARRAY['started'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."job_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."jurisdiction_comparisons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comparison_key" "text" NOT NULL,
    "source_jurisdiction" "text" NOT NULL,
    "target_jurisdiction" "text" NOT NULL,
    "topic" "text" NOT NULL,
    "summary" "text",
    "differences" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "practical_implications" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "source_refs" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "jurisdiction_comparisons_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."jurisdiction_comparisons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."jurisdictions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "code" character varying(3) NOT NULL,
    "name" "text" NOT NULL,
    "name_fr" "text",
    "primary_language" character varying(2) DEFAULT 'en'::character varying NOT NULL,
    "requires_french" boolean DEFAULT false NOT NULL,
    "is_federal" boolean DEFAULT false NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."jurisdictions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."law_page_hashes" (
    "url" "text" NOT NULL,
    "jurisdiction" "text" NOT NULL,
    "law_name" "text" NOT NULL,
    "content_hash" "text" NOT NULL,
    "last_checked" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "redirect_url" "text",
    "is_broken" boolean DEFAULT false,
    "last_broken_at" timestamp with time zone,
    "consecutive_failures" integer DEFAULT 0
);


ALTER TABLE "public"."law_page_hashes" OWNER TO "postgres";


COMMENT ON COLUMN "public"."law_page_hashes"."redirect_url" IS 'Permanent redirect destination, auto-detected and stored';



COMMENT ON COLUMN "public"."law_page_hashes"."is_broken" IS 'TRUE when last fetch returned non-2xx and no redirect was found';



COMMENT ON COLUMN "public"."law_page_hashes"."consecutive_failures" IS 'Counter incremented on each failed fetch; resets to 0 on success';



CREATE TABLE IF NOT EXISTS "public"."law_update_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "law_update_id" "uuid" NOT NULL,
    "recipient" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "attempts" integer DEFAULT 0 NOT NULL,
    "last_error" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "sent_at" timestamp with time zone,
    CONSTRAINT "law_update_notifications_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."law_update_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."legal_ingestion_sources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_key" "text" NOT NULL,
    "title" "text" NOT NULL,
    "jurisdiction" "text" NOT NULL,
    "source_url" "text",
    "source_format" "text" DEFAULT 'xml'::"text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "last_ingested_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "legal_ingestion_sources_source_format_check" CHECK (("source_format" = ANY (ARRAY['xml'::"text", 'html'::"text", 'json'::"text", 'pdf'::"text", 'text'::"text"]))),
    CONSTRAINT "legal_ingestion_sources_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'paused'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."legal_ingestion_sources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."offer_workflow_states" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "employer_profile_id" "uuid",
    "owner_id" "uuid" NOT NULL,
    "stage" "text" DEFAULT 'draft'::"text" NOT NULL,
    "assigned_to_email" "text",
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "offer_workflow_states_stage_check" CHECK (("stage" = ANY (ARRAY['draft'::"text", 'in_review'::"text", 'approved'::"text", 'sent'::"text", 'signed'::"text", 'rejected'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."offer_workflow_states" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "invited_by" "uuid",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("timezone"('utc'::"text", "now"()) + '14 days'::interval) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "accepted_at" timestamp with time zone,
    CONSTRAINT "organization_invitations_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'manager'::"text", 'member'::"text", 'viewer'::"text"]))),
    CONSTRAINT "organization_invitations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'revoked'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."organization_invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "organization_members_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'member'::"text", 'viewer'::"text"]))),
    CONSTRAINT "organization_members_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'invited'::"text", 'suspended'::"text", 'removed'::"text"])))
);


ALTER TABLE "public"."organization_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scheduled_operations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "operation_type" "text" NOT NULL,
    "cron_expression" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "last_run_at" timestamp with time zone,
    "next_run_at" timestamp with time zone,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "scheduled_operations_operation_type_check" CHECK (("operation_type" = ANY (ARRAY['law_scan'::"text", 'risk_snapshot'::"text", 'queue_health'::"text", 'maturity_score'::"text", 'forecast'::"text", 'billing_sync'::"text", 'custom'::"text"]))),
    CONSTRAINT "scheduled_operations_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'paused'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."scheduled_operations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_status" (
    "component" "text" NOT NULL,
    "status" "text" DEFAULT 'operational'::"text" NOT NULL,
    "message" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "service_status_component_check" CHECK (("component" = ANY (ARRAY['platform'::"text", 'advisor'::"text", 'documents'::"text", 'support'::"text"]))),
    CONSTRAINT "service_status_message_check" CHECK ((("message" IS NULL) OR ("char_length"("message") <= 500))),
    CONSTRAINT "service_status_status_check" CHECK (("status" = ANY (ARRAY['operational'::"text", 'degraded'::"text", 'maintenance'::"text", 'outage'::"text"])))
);


ALTER TABLE "public"."service_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."signature_audit_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "signature_id" "uuid",
    "document_id" "uuid",
    "user_id" "uuid",
    "event_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "signature_audit_events_type_check" CHECK (("event_type" = ANY (ARRAY['signing_link_created'::"text", 'signing_link_viewed'::"text", 'signature_submitted'::"text", 'signature_failed_or_expired'::"text", 'signature_cancelled'::"text"])))
);


ALTER TABLE "public"."signature_audit_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."signatures" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "signer_name" "text" DEFAULT ''::"text" NOT NULL,
    "signer_email" "text" DEFAULT ''::"text" NOT NULL,
    "signed_at" timestamp with time zone,
    "signature_data" "text" DEFAULT ''::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "signature_type" "text" DEFAULT 'drawn'::"text",
    "signer_role" "text" DEFAULT 'employee'::"text",
    "expires_at" timestamp with time zone DEFAULT ("timezone"('utc'::"text", "now"()) + '14 days'::interval),
    CONSTRAINT "signatures_signature_type_check" CHECK (("signature_type" = ANY (ARRAY['drawn'::"text", 'typed'::"text"]))),
    CONSTRAINT "signatures_signer_role_check" CHECK (("signer_role" = ANY (ARRAY['employee'::"text", 'employer'::"text"]))),
    CONSTRAINT "signatures_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'signed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."signatures" OWNER TO "postgres";


COMMENT ON COLUMN "public"."signatures"."signature_type" IS 'How the signature was captured: drawn (canvas) or typed (text rendered to canvas)';



COMMENT ON COLUMN "public"."signatures"."signer_role" IS 'Role of the signer on this document: employee or employer';



CREATE TABLE IF NOT EXISTS "public"."stripe_webhook_events" (
    "event_id" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "received_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."stripe_webhook_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subfolders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "category_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "min_tier_code" character varying(2),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."subfolders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_analytics_daily" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "day" "date" NOT NULL,
    "event_type" "text" NOT NULL,
    "workspace_id" "uuid",
    "article_slug" "text",
    "ticket_category" "text",
    "event_count" integer DEFAULT 0 NOT NULL,
    "helpfulness_yes" integer DEFAULT 0 NOT NULL,
    "helpfulness_no" integer DEFAULT 0 NOT NULL,
    "search_zero_results" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."support_analytics_daily" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_analytics_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" "text" NOT NULL,
    "workspace_id" "uuid",
    "anonymous_visitor_id" "text",
    "article_slug" "text",
    "search_query" "text",
    "search_result_count" integer,
    "vote_value" "text",
    "ticket_reference" "text",
    "ticket_category" "text",
    "ticket_source" "text",
    "locale" "text",
    "occurred_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "support_analytics_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['helpfulness_vote'::"text", 'help_search'::"text", 'help_article_view'::"text", 'ticket_submitted'::"text", 'ticket_status_changed'::"text"]))),
    CONSTRAINT "support_analytics_events_locale_check" CHECK ((("locale" IS NULL) OR ("locale" = ANY (ARRAY['en'::"text", 'fr'::"text"])))),
    CONSTRAINT "support_analytics_events_search_result_count_check" CHECK ((("search_result_count" IS NULL) OR ("search_result_count" >= 0))),
    CONSTRAINT "support_analytics_events_vote_value_check" CHECK ((("vote_value" IS NULL) OR ("vote_value" = ANY (ARRAY['yes'::"text", 'no'::"text"]))))
);


ALTER TABLE "public"."support_analytics_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_analytics_rate_limit" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ip_hash" "text" NOT NULL,
    "event_count" smallint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."support_analytics_rate_limit" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "message_id" "uuid",
    "uploaded_by" "uuid",
    "storage_path" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "mime_type" "text" NOT NULL,
    "size_bytes" bigint NOT NULL,
    "scan_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "retention_review_at" timestamp with time zone,
    "scanned_at" timestamp with time zone,
    "scan_detail" "text",
    "scan_attempts" smallint DEFAULT 0 NOT NULL,
    CONSTRAINT "support_attachments_scan_status_check" CHECK (("scan_status" = ANY (ARRAY['pending'::"text", 'clean'::"text", 'flagged'::"text", 'skipped'::"text"]))),
    CONSTRAINT "support_attachments_size_bytes_check" CHECK ((("size_bytes" >= 0) AND ("size_bytes" <= 26214400)))
);


ALTER TABLE "public"."support_attachments" OWNER TO "postgres";


COMMENT ON COLUMN "public"."support_attachments"."scanned_at" IS 'When a scan verdict was last recorded. Null while never scanned.';



COMMENT ON COLUMN "public"."support_attachments"."scan_detail" IS 'Short non-sensitive scanner note (signature name, skip reason). Never file contents.';



COMMENT ON COLUMN "public"."support_attachments"."scan_attempts" IS 'Scan attempts made; bounds retries so a broken scanner cannot loop forever.';



CREATE TABLE IF NOT EXISTS "public"."support_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "author_user_id" "uuid",
    "author_role" "text" NOT NULL,
    "body" "text" NOT NULL,
    "is_internal_note" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "support_messages_author_role_check" CHECK (("author_role" = ANY (ARRAY['customer'::"text", 'agent'::"text", 'system'::"text"]))),
    CONSTRAINT "support_messages_body_check" CHECK ((("char_length"("body") >= 1) AND ("char_length"("body") <= 20000)))
);


ALTER TABLE "public"."support_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid",
    "kind" "text" NOT NULL,
    "audience" "text" NOT NULL,
    "recipient" "text" NOT NULL,
    "language" "text" DEFAULT 'en'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "attempts" integer DEFAULT 0 NOT NULL,
    "last_error" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "sent_at" timestamp with time zone,
    "provider_message_id" "text",
    "delivery_status" "text",
    "delivery_detail" "text",
    "delivery_updated_at" timestamp with time zone,
    CONSTRAINT "support_notifications_audience_check" CHECK (("audience" = ANY (ARRAY['customer'::"text", 'operator'::"text"]))),
    CONSTRAINT "support_notifications_delivery_status_check" CHECK ((("delivery_status" IS NULL) OR ("delivery_status" = ANY (ARRAY['delivered'::"text", 'bounced'::"text", 'complained'::"text", 'delayed'::"text"])))),
    CONSTRAINT "support_notifications_kind_check" CHECK (("kind" = ANY (ARRAY['ticket_received'::"text", 'agent_reply'::"text", 'info_requested'::"text", 'resolved'::"text", 'closed'::"text", 'call_proposed'::"text", 'call_confirmed'::"text", 'call_reminder'::"text", 'call_followup_needed'::"text", 'privacy_ack'::"text", 'accessibility_ack'::"text", 'security_ack'::"text", 'complaint_ack'::"text", 'operator_alert'::"text"]))),
    CONSTRAINT "support_notifications_language_check" CHECK (("language" = ANY (ARRAY['en'::"text", 'fr'::"text"]))),
    CONSTRAINT "support_notifications_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'failed'::"text", 'skipped'::"text"])))
);


ALTER TABLE "public"."support_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_public_intake" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ip_hash" "text",
    "email_hash" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."support_public_intake" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_scheduled_calls" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "proposed_by" "uuid",
    "proposed_slots" "jsonb" NOT NULL,
    "duration_minutes" smallint DEFAULT 30 NOT NULL,
    "status" "text" DEFAULT 'proposed'::"text" NOT NULL,
    "confirmed_start" timestamp with time zone,
    "confirmed_end" timestamp with time zone,
    "confirmed_by" "uuid",
    "confirmed_at" timestamp with time zone,
    "calendar_event_id" "text",
    "meet_link" "text",
    "reminder_sent_at" timestamp with time zone,
    "followup_flagged_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "support_scheduled_calls_duration_minutes_check" CHECK ((("duration_minutes" >= 10) AND ("duration_minutes" <= 120))),
    CONSTRAINT "support_scheduled_calls_status_check" CHECK (("status" = ANY (ARRAY['proposed'::"text", 'confirmed'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."support_scheduled_calls" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_ticket_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "assigned_to" "uuid",
    "assigned_by" "uuid",
    "assigned_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "unassigned_at" timestamp with time zone
);


ALTER TABLE "public"."support_ticket_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_ticket_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "actor_user_id" "uuid",
    "event_type" "text" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."support_ticket_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_ticket_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "submitted_by" "uuid",
    "rating" "text" NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "support_ticket_feedback_comment_check" CHECK ((("comment" IS NULL) OR ("char_length"("comment") <= 4000))),
    CONSTRAINT "support_ticket_feedback_rating_check" CHECK (("rating" = ANY (ARRAY['positive'::"text", 'neutral'::"text", 'negative'::"text"])))
);


ALTER TABLE "public"."support_ticket_feedback" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."support_ticket_ref_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."support_ticket_ref_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "public_reference" "text" NOT NULL,
    "requester_user_id" "uuid",
    "workspace_id" "uuid",
    "category" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "description" "text" NOT NULL,
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "priority" "text" DEFAULT 'standard'::"text" NOT NULL,
    "impact" "text",
    "urgency" "text",
    "language" "text" DEFAULT 'en'::"text" NOT NULL,
    "preferred_response_method" "text" DEFAULT 'email'::"text" NOT NULL,
    "source" "text" DEFAULT 'app_form'::"text" NOT NULL,
    "restricted" boolean DEFAULT false NOT NULL,
    "assigned_to" "uuid",
    "escalation_type" "text" DEFAULT 'none'::"text" NOT NULL,
    "escalation_reason" "text",
    "requester_email" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "first_response_at" timestamp with time zone,
    "resolved_at" timestamp with time zone,
    "closed_at" timestamp with time zone,
    "retention_review_at" timestamp with time zone,
    CONSTRAINT "support_tickets_category_check" CHECK (("category" = ANY (ARRAY['account_access'::"text", 'billing'::"text", 'technical'::"text", 'product_question'::"text", 'privacy'::"text", 'security'::"text", 'accessibility'::"text", 'complaint'::"text", 'sales'::"text", 'other'::"text"]))),
    CONSTRAINT "support_tickets_description_check" CHECK ((("char_length"("description") >= 1) AND ("char_length"("description") <= 20000))),
    CONSTRAINT "support_tickets_escalation_type_check" CHECK (("escalation_type" = ANY (ARRAY['none'::"text", 'phone'::"text", 'video'::"text"]))),
    CONSTRAINT "support_tickets_impact_check" CHECK (("impact" = ANY (ARRAY['blocking'::"text", 'major'::"text", 'minor'::"text", 'none'::"text"]))),
    CONSTRAINT "support_tickets_language_check" CHECK (("language" = ANY (ARRAY['en'::"text", 'fr'::"text"]))),
    CONSTRAINT "support_tickets_preferred_response_method_check" CHECK (("preferred_response_method" = ANY (ARRAY['email'::"text", 'in_app'::"text", 'scheduled_call'::"text"]))),
    CONSTRAINT "support_tickets_priority_check" CHECK (("priority" = ANY (ARRAY['critical'::"text", 'high'::"text", 'standard'::"text", 'low'::"text"]))),
    CONSTRAINT "support_tickets_source_check" CHECK (("source" = ANY (ARRAY['app_form'::"text", 'public_form'::"text", 'email'::"text", 'ai_escalation'::"text"]))),
    CONSTRAINT "support_tickets_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'triaged'::"text", 'in_progress'::"text", 'waiting_on_customer'::"text", 'waiting_on_dutiva'::"text", 'scheduled_call'::"text", 'resolved'::"text", 'closed'::"text"]))),
    CONSTRAINT "support_tickets_subject_check" CHECK ((("char_length"("subject") >= 1) AND ("char_length"("subject") <= 200))),
    CONSTRAINT "support_tickets_urgency_check" CHECK (("urgency" = ANY (ARRAY['urgent'::"text", 'soon'::"text", 'whenever'::"text"])))
);


ALTER TABLE "public"."support_tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."template_audit_log" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" "uuid" NOT NULL,
    "action" character varying(10) NOT NULL,
    "old_data" "jsonb",
    "new_data" "jsonb",
    "performed_by" "uuid",
    "performed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ip_address" "inet",
    CONSTRAINT "template_audit_log_action_check" CHECK ((("action")::"text" = ANY (ARRAY[('INSERT'::character varying)::"text", ('UPDATE'::character varying)::"text", ('DELETE'::character varying)::"text"])))
);


ALTER TABLE "public"."template_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."template_content_variants" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "template_version_id" "uuid" NOT NULL,
    "jurisdiction_id" "uuid" NOT NULL,
    "language" character varying(2) DEFAULT 'en'::character varying NOT NULL,
    "content" "jsonb",
    "legal_references" "text"[],
    "mandatory_requirements" "text"[],
    "compliance_notes" "text",
    "status" character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "template_content_variants_language_check" CHECK ((("language")::"text" = ANY (ARRAY[('en'::character varying)::"text", ('fr'::character varying)::"text"]))),
    CONSTRAINT "template_content_variants_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('draft'::character varying)::"text", ('review'::character varying)::"text", ('approved'::character varying)::"text", ('published'::character varying)::"text"])))
);


ALTER TABLE "public"."template_content_variants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."template_documents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "generated_by" "uuid" DEFAULT "auth"."uid"(),
    "workflow_id" "uuid",
    "template_id" "uuid" NOT NULL,
    "template_version_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "jurisdiction_id" "uuid" NOT NULL,
    "language" character varying(2) DEFAULT 'en'::character varying NOT NULL,
    "title" "text" NOT NULL,
    "content" "jsonb",
    "status" character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    "file_url" "text",
    "file_type" character varying(10),
    "signed_at" timestamp with time zone,
    "signed_by" "text",
    "generated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "template_documents_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('draft'::character varying)::"text", ('final'::character varying)::"text", ('signed'::character varying)::"text", ('voided'::character varying)::"text"])))
);


ALTER TABLE "public"."template_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."template_fields" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "template_id" "uuid" NOT NULL,
    "field_key" "text" NOT NULL,
    "label" "text" NOT NULL,
    "field_type" character varying(30) DEFAULT 'text'::character varying NOT NULL,
    "options" "jsonb",
    "placeholder" "text",
    "is_required" boolean DEFAULT false NOT NULL,
    "validation_rules" "jsonb",
    "default_value" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "field_group" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "template_fields_field_type_check" CHECK ((("field_type")::"text" = ANY (ARRAY[('text'::character varying)::"text", ('textarea'::character varying)::"text", ('number'::character varying)::"text", ('date'::character varying)::"text", ('email'::character varying)::"text", ('phone'::character varying)::"text", ('select'::character varying)::"text", ('multi_select'::character varying)::"text", ('checkbox'::character varying)::"text", ('radio'::character varying)::"text", ('currency'::character varying)::"text", ('address'::character varying)::"text", ('signature'::character varying)::"text", ('file_upload'::character varying)::"text"])))
);


ALTER TABLE "public"."template_fields" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."template_versions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "template_id" "uuid" NOT NULL,
    "version_number" integer DEFAULT 1 NOT NULL,
    "change_notes" "text",
    "is_current" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."template_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."templates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "subfolder_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "document_type" character varying(50) DEFAULT 'template'::character varying,
    "status" character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "templates_document_type_check" CHECK ((("document_type")::"text" = ANY (ARRAY[('template'::character varying)::"text", ('form'::character varying)::"text", ('policy'::character varying)::"text", ('checklist'::character varying)::"text", ('letter'::character varying)::"text", ('guide'::character varying)::"text", ('kit'::character varying)::"text"]))),
    CONSTRAINT "templates_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('draft'::character varying)::"text", ('active'::character varying)::"text", ('archived'::character varying)::"text"])))
);


ALTER TABLE "public"."templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tier_categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tier_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "display_code" character varying(2) NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tier_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usage_counters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "period_start" "date" DEFAULT ("date_trunc"('month'::"text", (CURRENT_DATE)::timestamp with time zone))::"date" NOT NULL,
    "advisor_messages_used" integer DEFAULT 0 NOT NULL,
    "documents_generated" integer DEFAULT 0 NOT NULL,
    "documents_saved" integer DEFAULT 0 NOT NULL,
    "exports_used" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "e_signature_sends" integer DEFAULT 0 NOT NULL,
    "compliance_reviews" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."usage_counters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usage_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "organization_id" "uuid",
    CONSTRAINT "usage_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['advisor_message'::"text", 'document_generated'::"text", 'template_download'::"text", 'signature_sent'::"text", 'law_monitor_check'::"text", 'admin_action'::"text"]))),
    CONSTRAINT "usage_events_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."usage_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "user_roles_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'staff'::"text", 'user'::"text"])))
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_navigation_tree" WITH ("security_invoker"='true') AS
 SELECT "et"."code" AS "tier_code",
    "et"."label" AS "tier_label",
    "tc"."display_code" AS "category_code",
    "c"."name" AS "category_name",
    "c"."slug" AS "category_slug",
    "sf"."name" AS "subfolder_name",
    "sf"."slug" AS "subfolder_slug",
    "sf"."sort_order" AS "subfolder_sort",
    "sf"."id" AS "subfolder_id",
    "c"."id" AS "category_id",
    "et"."id" AS "tier_id"
   FROM ((("public"."employer_tiers" "et"
     JOIN "public"."tier_categories" "tc" ON (("tc"."tier_id" = "et"."id")))
     JOIN "public"."categories" "c" ON (("c"."id" = "tc"."category_id")))
     LEFT JOIN "public"."subfolders" "sf" ON ((("sf"."category_id" = "c"."id") AND (("sf"."min_tier_code" IS NULL) OR (("sf"."min_tier_code")::"text" <= ("et"."code")::"text")))))
  ORDER BY "et"."sort_order", "tc"."sort_order", "sf"."sort_order";


ALTER VIEW "public"."v_navigation_tree" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_template_catalog" WITH ("security_invoker"='true') AS
 SELECT "t"."id" AS "template_id",
    "t"."name" AS "template_name",
    "t"."status" AS "template_status",
    "t"."document_type",
    "sf"."name" AS "subfolder_name",
    "c"."name" AS "category_name",
    "tv"."version_number" AS "current_version",
    "tv"."created_at" AS "version_date",
    ( SELECT "count"(*) AS "count"
           FROM "public"."template_content_variants" "tcv"
          WHERE ("tcv"."template_version_id" = "tv"."id")) AS "jurisdiction_count"
   FROM ((("public"."templates" "t"
     JOIN "public"."subfolders" "sf" ON (("sf"."id" = "t"."subfolder_id")))
     JOIN "public"."categories" "c" ON (("c"."id" = "sf"."category_id")))
     LEFT JOIN "public"."template_versions" "tv" ON ((("tv"."template_id" = "t"."id") AND ("tv"."is_current" = true))));


ALTER VIEW "public"."v_template_catalog" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_tier_stats" WITH ("security_invoker"='true') AS
 SELECT "et"."code" AS "tier_code",
    "et"."label" AS "tier_label",
    "count"(DISTINCT "tc"."category_id") AS "category_count",
    "count"(DISTINCT "sf"."id") AS "subfolder_count",
    "count"(DISTINCT "t"."id") AS "template_count"
   FROM (((("public"."employer_tiers" "et"
     LEFT JOIN "public"."tier_categories" "tc" ON (("tc"."tier_id" = "et"."id")))
     LEFT JOIN "public"."categories" "c" ON (("c"."id" = "tc"."category_id")))
     LEFT JOIN "public"."subfolders" "sf" ON ((("sf"."category_id" = "c"."id") AND (("sf"."min_tier_code" IS NULL) OR (("sf"."min_tier_code")::"text" <= ("et"."code")::"text")))))
     LEFT JOIN "public"."templates" "t" ON (("t"."subfolder_id" = "sf"."id")))
  GROUP BY "et"."code", "et"."label", "et"."sort_order"
  ORDER BY "et"."sort_order";


ALTER VIEW "public"."v_tier_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" "text" NOT NULL,
    "external_event_id" "text",
    "organization_id" "uuid",
    "event_type" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "received_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "processed_at" timestamp with time zone,
    "processing_status" "text" DEFAULT 'received'::"text" NOT NULL,
    "error_message" "text",
    CONSTRAINT "webhook_events_processing_status_check" CHECK (("processing_status" = ANY (ARRAY['received'::"text", 'processing'::"text", 'processed'::"text", 'ignored'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."webhook_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_automation_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "run_type" "text" NOT NULL,
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "error_message" "text",
    "input" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "output" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "workflow_automation_runs_run_type_check" CHECK (("run_type" = ANY (ARRAY['law_impact_scan'::"text", 'compliance_assessment'::"text", 'advisor_task_generation'::"text", 'document_review_generation'::"text"]))),
    CONSTRAINT "workflow_automation_runs_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'running'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."workflow_automation_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_metrics_daily" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "metric_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "tasks_created" integer DEFAULT 0 NOT NULL,
    "tasks_completed" integer DEFAULT 0 NOT NULL,
    "documents_generated" integer DEFAULT 0 NOT NULL,
    "reviews_requested" integer DEFAULT 0 NOT NULL,
    "findings_created" integer DEFAULT 0 NOT NULL,
    "ai_recommendations_created" integer DEFAULT 0 NOT NULL,
    "jobs_completed" integer DEFAULT 0 NOT NULL,
    "jobs_failed" integer DEFAULT 0 NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."workflow_metrics_daily" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_playbooks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text" DEFAULT 'general'::"text" NOT NULL,
    "jurisdiction" "text",
    "steps" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "default_tasks" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "workflow_playbooks_category_check" CHECK (("category" = ANY (ARRAY['general'::"text", 'onboarding'::"text", 'document_review'::"text", 'law_update'::"text", 'policy_gap'::"text", 'signature'::"text", 'billing'::"text", 'compliance'::"text"]))),
    CONSTRAINT "workflow_playbooks_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."workflow_playbooks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_questions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "template_id" "uuid" NOT NULL,
    "field_id" "uuid",
    "question_text" "text" NOT NULL,
    "help_text" "text",
    "step_number" integer DEFAULT 1 NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "conditional_logic" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."workflow_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_responses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "workflow_id" "uuid" NOT NULL,
    "question_id" "uuid" NOT NULL,
    "field_id" "uuid",
    "response_value" "text",
    "response_data" "jsonb",
    "answered_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."workflow_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflows" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "template_id" "uuid" NOT NULL,
    "template_version_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "jurisdiction_id" "uuid" NOT NULL,
    "language" character varying(2) DEFAULT 'en'::character varying NOT NULL,
    "status" character varying(20) DEFAULT 'in_progress'::character varying NOT NULL,
    "started_by" "uuid",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "workflows_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('in_progress'::character varying)::"text", ('completed'::character varying)::"text", ('cancelled'::character varying)::"text", ('expired'::character varying)::"text"])))
);


ALTER TABLE "public"."workflows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspace_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "author_user_id" "uuid",
    "title" "text" NOT NULL,
    "body" "text",
    "note_type" "text" DEFAULT 'general'::"text" NOT NULL,
    "visibility" "text" DEFAULT 'team'::"text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "workspace_notes_note_type_check" CHECK (("note_type" = ANY (ARRAY['general'::"text", 'policy'::"text", 'risk'::"text", 'decision'::"text", 'meeting'::"text", 'advisor_context'::"text"]))),
    CONSTRAINT "workspace_notes_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'archived'::"text", 'deleted'::"text"]))),
    CONSTRAINT "workspace_notes_visibility_check" CHECK (("visibility" = ANY (ARRAY['private'::"text", 'team'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."workspace_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspace_preferences" (
    "user_id" "uuid" NOT NULL,
    "mode" "text" DEFAULT 'demo'::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "workspace_preferences_mode_check" CHECK (("mode" = ANY (ARRAY['demo'::"text", 'production'::"text"])))
);


ALTER TABLE "public"."workspace_preferences" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activity_events"
    ADD CONSTRAINT "activity_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_activity_log"
    ADD CONSTRAINT "admin_activity_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_analytics_snapshots"
    ADD CONSTRAINT "admin_analytics_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_app_error_events"
    ADD CONSTRAINT "admin_app_error_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_audit_log"
    ADD CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_beta_access"
    ADD CONSTRAINT "admin_beta_access_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_beta_feedback_events"
    ADD CONSTRAINT "admin_beta_feedback_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_feature_flags"
    ADD CONSTRAINT "admin_feature_flags_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."admin_feature_flags"
    ADD CONSTRAINT "admin_feature_flags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_plan_overrides"
    ADD CONSTRAINT "admin_plan_overrides_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."advisor_guidance_chunks"
    ADD CONSTRAINT "advisor_guidance_chunks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."advisor_memories"
    ADD CONSTRAINT "advisor_memories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_runs"
    ADD CONSTRAINT "agent_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_action_runs"
    ADD CONSTRAINT "ai_action_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_agents"
    ADD CONSTRAINT "ai_agents_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."ai_agents"
    ADD CONSTRAINT "ai_agents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_drafting_sessions"
    ADD CONSTRAINT "ai_drafting_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_model_providers"
    ADD CONSTRAINT "ai_model_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_model_providers"
    ADD CONSTRAINT "ai_model_providers_provider_key_key" UNIQUE ("provider_key");



ALTER TABLE ONLY "public"."ai_model_routes"
    ADD CONSTRAINT "ai_model_routes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_model_routes"
    ADD CONSTRAINT "ai_model_routes_route_key_key" UNIQUE ("route_key");



ALTER TABLE ONLY "public"."ai_recommendations"
    ADD CONSTRAINT "ai_recommendations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_telemetry_events"
    ADD CONSTRAINT "ai_telemetry_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."backup_verification_runs"
    ADD CONSTRAINT "backup_verification_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."benchmark_snapshots"
    ADD CONSTRAINT "benchmark_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."beta_signup_intake"
    ADD CONSTRAINT "beta_signup_intake_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."beta_signups"
    ADD CONSTRAINT "beta_signups_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."beta_signups"
    ADD CONSTRAINT "beta_signups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."billing_events"
    ADD CONSTRAINT "billing_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."client_error_rate_limit"
    ADD CONSTRAINT "client_error_rate_limit_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_error_reports"
    ADD CONSTRAINT "client_error_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comment_mentions"
    ADD CONSTRAINT "comment_mentions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compliance_assessments"
    ADD CONSTRAINT "compliance_assessments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compliance_findings"
    ADD CONSTRAINT "compliance_findings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compliance_score_snapshots"
    ADD CONSTRAINT "compliance_score_snapshots_org_month_key" UNIQUE ("organization_id", "month");



ALTER TABLE ONLY "public"."compliance_score_snapshots"
    ADD CONSTRAINT "compliance_score_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compliance_tasks"
    ADD CONSTRAINT "compliance_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cron_locks"
    ADD CONSTRAINT "cron_locks_pkey" PRIMARY KEY ("job_name");



ALTER TABLE ONLY "public"."devops_runbooks"
    ADD CONSTRAINT "devops_runbooks_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."devops_runbooks"
    ADD CONSTRAINT "devops_runbooks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_annotations"
    ADD CONSTRAINT "document_annotations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_generation_runs"
    ADD CONSTRAINT "document_generation_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_reviews"
    ADD CONSTRAINT "document_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_versions"
    ADD CONSTRAINT "document_versions_document_id_version_number_key" UNIQUE ("document_id", "version_number");



ALTER TABLE ONLY "public"."document_versions"
    ADD CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employer_profiles"
    ADD CONSTRAINT "employer_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employer_tiers"
    ADD CONSTRAINT "employer_tiers_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."employer_tiers"
    ADD CONSTRAINT "employer_tiers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."entity_relationships"
    ADD CONSTRAINT "entity_relationships_organization_id_source_table_source_id_key" UNIQUE ("organization_id", "source_table", "source_id", "target_table", "target_id", "relationship_type");



ALTER TABLE ONLY "public"."entity_relationships"
    ADD CONSTRAINT "entity_relationships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."execution_traces"
    ADD CONSTRAINT "execution_traces_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."export_events"
    ADD CONSTRAINT "export_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."external_integrations"
    ADD CONSTRAINT "external_integrations_organization_id_provider_external_acc_key" UNIQUE ("organization_id", "provider", "external_account_id");



ALTER TABLE ONLY "public"."external_integrations"
    ADD CONSTRAINT "external_integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."frontend_feature_flags"
    ADD CONSTRAINT "frontend_feature_flags_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."frontend_feature_flags"
    ADD CONSTRAINT "frontend_feature_flags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."generator_document_templates"
    ADD CONSTRAINT "generator_document_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."generator_document_templates"
    ADD CONSTRAINT "generator_document_templates_template_slug_key" UNIQUE ("template_slug");



ALTER TABLE ONLY "public"."guidance_chunks"
    ADD CONSTRAINT "guidance_chunks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."guidance_sources"
    ADD CONSTRAINT "guidance_sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hr_case_notes"
    ADD CONSTRAINT "hr_case_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hr_cases"
    ADD CONSTRAINT "hr_cases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hr_communications"
    ADD CONSTRAINT "hr_communications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hr_compensation_records"
    ADD CONSTRAINT "hr_compensation_records_employee_unique" UNIQUE ("employee_id");



ALTER TABLE ONLY "public"."hr_compensation_records"
    ADD CONSTRAINT "hr_compensation_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hr_documents"
    ADD CONSTRAINT "hr_documents_filename_key" UNIQUE ("filename");



ALTER TABLE ONLY "public"."hr_documents"
    ADD CONSTRAINT "hr_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hr_employee_notes"
    ADD CONSTRAINT "hr_employee_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hr_expiry_records"
    ADD CONSTRAINT "hr_expiry_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hr_leaves"
    ADD CONSTRAINT "hr_leaves_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hr_obligations"
    ADD CONSTRAINT "hr_obligations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hr_policies"
    ADD CONSTRAINT "hr_policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hr_wellbeing_initiatives"
    ADD CONSTRAINT "hr_wellbeing_initiatives_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_attempts"
    ADD CONSTRAINT "job_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_queue"
    ADD CONSTRAINT "job_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jurisdiction_comparisons"
    ADD CONSTRAINT "jurisdiction_comparisons_comparison_key_source_jurisdiction_key" UNIQUE ("comparison_key", "source_jurisdiction", "target_jurisdiction");



ALTER TABLE ONLY "public"."jurisdiction_comparisons"
    ADD CONSTRAINT "jurisdiction_comparisons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jurisdictions"
    ADD CONSTRAINT "jurisdictions_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."jurisdictions"
    ADD CONSTRAINT "jurisdictions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."law_change_impacts"
    ADD CONSTRAINT "law_change_impacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."law_page_hashes"
    ADD CONSTRAINT "law_page_hashes_pkey" PRIMARY KEY ("url");



ALTER TABLE ONLY "public"."law_update_notifications"
    ADD CONSTRAINT "law_update_notifications_law_update_id_recipient_key" UNIQUE ("law_update_id", "recipient");



ALTER TABLE ONLY "public"."law_update_notifications"
    ADD CONSTRAINT "law_update_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."law_updates"
    ADD CONSTRAINT "law_updates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."legal_ingestion_runs"
    ADD CONSTRAINT "legal_ingestion_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."legal_ingestion_sources"
    ADD CONSTRAINT "legal_ingestion_sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."legal_ingestion_sources"
    ADD CONSTRAINT "legal_ingestion_sources_source_key_key" UNIQUE ("source_key");



ALTER TABLE ONLY "public"."multi_agent_plans"
    ADD CONSTRAINT "multi_agent_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_deliveries"
    ADD CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offer_workflow_states"
    ADD CONSTRAINT "offer_workflow_states_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."operational_bottlenecks"
    ADD CONSTRAINT "operational_bottlenecks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_invitations"
    ADD CONSTRAINT "organization_invitations_organization_id_email_key" UNIQUE ("organization_id", "email");



ALTER TABLE ONLY "public"."organization_invitations"
    ADD CONSTRAINT "organization_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_maturity_scores"
    ADD CONSTRAINT "organization_maturity_scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_organization_id_user_id_key" UNIQUE ("organization_id", "user_id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_risk_snapshots"
    ADD CONSTRAINT "organization_risk_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."playbook_runs"
    ADD CONSTRAINT "playbook_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."policy_gap_analyses"
    ADD CONSTRAINT "policy_gap_analyses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predictive_risk_forecasts"
    ADD CONSTRAINT "predictive_risk_forecasts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."queue_health_snapshots"
    ADD CONSTRAINT "queue_health_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scheduled_operations"
    ADD CONSTRAINT "scheduled_operations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_status"
    ADD CONSTRAINT "service_status_pkey" PRIMARY KEY ("component");



ALTER TABLE ONLY "public"."signature_audit_events"
    ADD CONSTRAINT "signature_audit_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."signatures"
    ADD CONSTRAINT "signatures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_webhook_events"
    ADD CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("event_id");



ALTER TABLE ONLY "public"."subfolders"
    ADD CONSTRAINT "subfolders_category_id_slug_key" UNIQUE ("category_id", "slug");



ALTER TABLE ONLY "public"."subfolders"
    ADD CONSTRAINT "subfolders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_analytics_daily"
    ADD CONSTRAINT "support_analytics_daily_day_event_type_workspace_id_article_key" UNIQUE ("day", "event_type", "workspace_id", "article_slug", "ticket_category");



ALTER TABLE ONLY "public"."support_analytics_daily"
    ADD CONSTRAINT "support_analytics_daily_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_analytics_events"
    ADD CONSTRAINT "support_analytics_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_analytics_rate_limit"
    ADD CONSTRAINT "support_analytics_rate_limit_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_attachments"
    ADD CONSTRAINT "support_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_attachments"
    ADD CONSTRAINT "support_attachments_storage_path_key" UNIQUE ("storage_path");



ALTER TABLE ONLY "public"."support_messages"
    ADD CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_notifications"
    ADD CONSTRAINT "support_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_public_intake"
    ADD CONSTRAINT "support_public_intake_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_scheduled_calls"
    ADD CONSTRAINT "support_scheduled_calls_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_scheduled_calls"
    ADD CONSTRAINT "support_scheduled_calls_ticket_id_key" UNIQUE ("ticket_id");



ALTER TABLE ONLY "public"."support_ticket_assignments"
    ADD CONSTRAINT "support_ticket_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_ticket_events"
    ADD CONSTRAINT "support_ticket_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_ticket_feedback"
    ADD CONSTRAINT "support_ticket_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_ticket_feedback"
    ADD CONSTRAINT "support_ticket_feedback_ticket_id_key" UNIQUE ("ticket_id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_public_reference_key" UNIQUE ("public_reference");



ALTER TABLE ONLY "public"."system_events"
    ADD CONSTRAINT "system_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."template_audit_log"
    ADD CONSTRAINT "template_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."template_content_variants"
    ADD CONSTRAINT "template_content_variants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."template_content_variants"
    ADD CONSTRAINT "template_content_variants_template_version_id_jurisdiction__key" UNIQUE ("template_version_id", "jurisdiction_id", "language");



ALTER TABLE ONLY "public"."template_documents"
    ADD CONSTRAINT "template_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."template_fields"
    ADD CONSTRAINT "template_fields_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."template_fields"
    ADD CONSTRAINT "template_fields_template_id_field_key_key" UNIQUE ("template_id", "field_key");



ALTER TABLE ONLY "public"."template_versions"
    ADD CONSTRAINT "template_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."template_versions"
    ADD CONSTRAINT "template_versions_template_id_version_number_key" UNIQUE ("template_id", "version_number");



ALTER TABLE ONLY "public"."templates"
    ADD CONSTRAINT "templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."templates"
    ADD CONSTRAINT "templates_subfolder_id_slug_key" UNIQUE ("subfolder_id", "slug");



ALTER TABLE ONLY "public"."tier_categories"
    ADD CONSTRAINT "tier_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tier_categories"
    ADD CONSTRAINT "tier_categories_tier_id_category_id_key" UNIQUE ("tier_id", "category_id");



ALTER TABLE ONLY "public"."tier_categories"
    ADD CONSTRAINT "tier_categories_tier_id_display_code_key" UNIQUE ("tier_id", "display_code");



ALTER TABLE ONLY "public"."usage_counters"
    ADD CONSTRAINT "usage_counters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usage_counters"
    ADD CONSTRAINT "usage_counters_user_id_period_start_key" UNIQUE ("user_id", "period_start");



ALTER TABLE ONLY "public"."usage_events"
    ADD CONSTRAINT "usage_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



ALTER TABLE ONLY "public"."webhook_events"
    ADD CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_events"
    ADD CONSTRAINT "webhook_events_provider_external_event_id_key" UNIQUE ("provider", "external_event_id");



ALTER TABLE ONLY "public"."workflow_automation_runs"
    ADD CONSTRAINT "workflow_automation_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_metrics_daily"
    ADD CONSTRAINT "workflow_metrics_daily_organization_id_metric_date_key" UNIQUE ("organization_id", "metric_date");



ALTER TABLE ONLY "public"."workflow_metrics_daily"
    ADD CONSTRAINT "workflow_metrics_daily_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_playbooks"
    ADD CONSTRAINT "workflow_playbooks_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."workflow_playbooks"
    ADD CONSTRAINT "workflow_playbooks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_questions"
    ADD CONSTRAINT "workflow_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_questions"
    ADD CONSTRAINT "workflow_questions_template_id_field_id_key" UNIQUE ("template_id", "field_id");



ALTER TABLE ONLY "public"."workflow_responses"
    ADD CONSTRAINT "workflow_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_responses"
    ADD CONSTRAINT "workflow_responses_workflow_id_question_id_key" UNIQUE ("workflow_id", "question_id");



ALTER TABLE ONLY "public"."workflows"
    ADD CONSTRAINT "workflows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspace_intelligence_items"
    ADD CONSTRAINT "workspace_intelligence_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspace_notes"
    ADD CONSTRAINT "workspace_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspace_preferences"
    ADD CONSTRAINT "workspace_preferences_pkey" PRIMARY KEY ("user_id");



CREATE INDEX "activity_events_entity_idx" ON "public"."activity_events" USING "btree" ("entity_table", "entity_id", "created_at" DESC);



CREATE INDEX "activity_events_org_created_idx" ON "public"."activity_events" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "admin_app_error_events_created_at_idx" ON "public"."admin_app_error_events" USING "btree" ("created_at" DESC);



CREATE INDEX "admin_app_error_events_user_created_at_idx" ON "public"."admin_app_error_events" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "admin_audit_log_actor_created_idx" ON "public"."admin_audit_log" USING "btree" ("actor_user_id", "created_at" DESC);



CREATE INDEX "admin_beta_feedback_events_created_at_idx" ON "public"."admin_beta_feedback_events" USING "btree" ("created_at" DESC);



CREATE INDEX "admin_beta_feedback_events_user_created_at_idx" ON "public"."admin_beta_feedback_events" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "advisor_guidance_chunks_fts_fr_idx" ON "public"."advisor_guidance_chunks" USING "gin" ("fts_fr");



CREATE INDEX "advisor_guidance_chunks_fts_idx" ON "public"."advisor_guidance_chunks" USING "gin" ("fts");



CREATE INDEX "advisor_memories_org_type_idx" ON "public"."advisor_memories" USING "btree" ("organization_id", "memory_type", "status");



CREATE INDEX "advisor_memories_user_type_idx" ON "public"."advisor_memories" USING "btree" ("user_id", "memory_type", "status");



CREATE INDEX "agent_runs_org_status_idx" ON "public"."agent_runs" USING "btree" ("organization_id", "status", "created_at" DESC);



CREATE INDEX "ai_action_runs_org_status_idx" ON "public"."ai_action_runs" USING "btree" ("organization_id", "status", "created_at" DESC);



CREATE INDEX "ai_action_runs_recommendation_idx" ON "public"."ai_action_runs" USING "btree" ("recommendation_id");



CREATE INDEX "ai_agents_type_status_idx" ON "public"."ai_agents" USING "btree" ("agent_type", "status");



CREATE INDEX "ai_drafting_sessions_org_status_idx" ON "public"."ai_drafting_sessions" USING "btree" ("organization_id", "status", "created_at" DESC);



CREATE INDEX "ai_drafting_sessions_user_idx" ON "public"."ai_drafting_sessions" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "ai_recommendations_org_status_idx" ON "public"."ai_recommendations" USING "btree" ("organization_id", "status", "priority", "created_at" DESC);



CREATE INDEX "ai_recommendations_user_status_idx" ON "public"."ai_recommendations" USING "btree" ("user_id", "status", "created_at" DESC);



CREATE INDEX "ai_telemetry_created_idx" ON "public"."ai_telemetry_events" USING "btree" ("created_at" DESC);



CREATE INDEX "ai_telemetry_model_idx" ON "public"."ai_telemetry_events" USING "btree" ("provider", "model", "operation", "created_at" DESC);



CREATE INDEX "ai_telemetry_org_created_idx" ON "public"."ai_telemetry_events" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "ai_telemetry_user_op_created_idx" ON "public"."ai_telemetry_events" USING "btree" ("user_id", "operation", "created_at" DESC);



CREATE INDEX "benchmark_snapshots_org_metric_idx" ON "public"."benchmark_snapshots" USING "btree" ("organization_id", "metric_key", "created_at" DESC);



CREATE INDEX "beta_signup_intake_created_idx" ON "public"."beta_signup_intake" USING "btree" ("created_at");



CREATE INDEX "beta_signup_intake_email_idx" ON "public"."beta_signup_intake" USING "btree" ("email_hash", "created_at");



CREATE INDEX "beta_signup_intake_ip_idx" ON "public"."beta_signup_intake" USING "btree" ("ip_hash", "created_at");



CREATE INDEX "beta_signups_consent_idx" ON "public"."beta_signups" USING "btree" ("consent_granted");



CREATE INDEX "beta_signups_created_idx" ON "public"."beta_signups" USING "btree" ("created_at" DESC);



CREATE INDEX "beta_signups_status_idx" ON "public"."beta_signups" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "billing_events_customer_idx" ON "public"."billing_events" USING "btree" ("provider", "external_customer_id");



CREATE INDEX "billing_events_org_occurred_idx" ON "public"."billing_events" USING "btree" ("organization_id", "occurred_at" DESC);



CREATE INDEX "client_error_rate_limit_created_idx" ON "public"."client_error_rate_limit" USING "btree" ("created_at");



CREATE INDEX "client_error_rate_limit_ip_idx" ON "public"."client_error_rate_limit" USING "btree" ("ip_hash", "created_at");



CREATE INDEX "client_error_reports_created_idx" ON "public"."client_error_reports" USING "btree" ("created_at" DESC);



CREATE INDEX "client_error_reports_release_idx" ON "public"."client_error_reports" USING "btree" ("release", "created_at" DESC);



CREATE INDEX "comment_mentions_comment_idx" ON "public"."comment_mentions" USING "btree" ("comment_id");



CREATE INDEX "comment_mentions_user_idx" ON "public"."comment_mentions" USING "btree" ("mentioned_user_id", "created_at" DESC);



CREATE INDEX "comments_entity_idx" ON "public"."comments" USING "btree" ("entity_table", "entity_id", "created_at" DESC);



CREATE INDEX "comments_org_idx" ON "public"."comments" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "compliance_assessments_document_idx" ON "public"."compliance_assessments" USING "btree" ("document_id", "assessed_at" DESC);



CREATE INDEX "compliance_assessments_org_idx" ON "public"."compliance_assessments" USING "btree" ("organization_id", "assessed_at" DESC);



CREATE INDEX "compliance_findings_assessment_idx" ON "public"."compliance_findings" USING "btree" ("assessment_id");



CREATE INDEX "compliance_findings_org_status_idx" ON "public"."compliance_findings" USING "btree" ("organization_id", "status", "severity");



CREATE INDEX "compliance_score_snapshots_organization_id_idx" ON "public"."compliance_score_snapshots" USING "btree" ("organization_id");



CREATE INDEX "compliance_tasks_assigned_status_idx" ON "public"."compliance_tasks" USING "btree" ("assigned_to", "status");



CREATE INDEX "compliance_tasks_org_status_due_idx" ON "public"."compliance_tasks" USING "btree" ("organization_id", "status", "due_at");



CREATE INDEX "conversations_organization_idx" ON "public"."conversations" USING "btree" ("organization_id");



CREATE INDEX "conversations_user_id_idx" ON "public"."conversations" USING "btree" ("user_id");



CREATE INDEX "document_annotations_document_idx" ON "public"."document_annotations" USING "btree" ("document_id", "status", "created_at" DESC);



CREATE INDEX "document_annotations_org_idx" ON "public"."document_annotations" USING "btree" ("organization_id", "status", "created_at" DESC);



CREATE INDEX "document_reviews_document_idx" ON "public"."document_reviews" USING "btree" ("document_id");



CREATE INDEX "document_reviews_org_status_idx" ON "public"."document_reviews" USING "btree" ("organization_id", "status", "created_at" DESC);



CREATE INDEX "document_reviews_reviewer_idx" ON "public"."document_reviews" USING "btree" ("reviewer_user_id", "status");



CREATE INDEX "document_versions_document_idx" ON "public"."document_versions" USING "btree" ("document_id", "version_number" DESC);



CREATE INDEX "document_versions_org_idx" ON "public"."document_versions" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "documents_employer_profile_id_idx" ON "public"."documents" USING "btree" ("employer_profile_id");



CREATE INDEX "documents_generated_at_idx" ON "public"."documents" USING "btree" ("user_id", "generated_at");



CREATE INDEX "documents_org_lifecycle_idx" ON "public"."documents" USING "btree" ("organization_id", "lifecycle_status", "updated_at" DESC);



CREATE INDEX "documents_organization_idx" ON "public"."documents" USING "btree" ("organization_id");



CREATE INDEX "documents_user_id_created_at_idx" ON "public"."documents" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "documents_user_status_created_at_idx" ON "public"."documents" USING "btree" ("user_id", "status", "created_at" DESC);



CREATE INDEX "employees_organization_id_idx" ON "public"."employees" USING "btree" ("organization_id");



CREATE INDEX "employer_profiles_organization_idx" ON "public"."employer_profiles" USING "btree" ("organization_id");



CREATE INDEX "employer_profiles_owner_idx" ON "public"."employer_profiles" USING "btree" ("owner_id", "legal_name");



CREATE INDEX "entity_relationships_org_idx" ON "public"."entity_relationships" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "entity_relationships_source_idx" ON "public"."entity_relationships" USING "btree" ("source_table", "source_id", "relationship_type");



CREATE INDEX "entity_relationships_target_idx" ON "public"."entity_relationships" USING "btree" ("target_table", "target_id", "relationship_type");



CREATE INDEX "execution_traces_org_started_idx" ON "public"."execution_traces" USING "btree" ("organization_id", "started_at" DESC);



CREATE INDEX "execution_traces_parent_idx" ON "public"."execution_traces" USING "btree" ("parent_trace_id");



CREATE INDEX "execution_traces_type_status_idx" ON "public"."execution_traces" USING "btree" ("trace_type", "status", "started_at" DESC);



CREATE INDEX "export_events_user_created_idx" ON "public"."export_events" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "external_integrations_org_provider_idx" ON "public"."external_integrations" USING "btree" ("organization_id", "provider", "status");



CREATE INDEX "generator_document_templates_lookup_idx" ON "public"."generator_document_templates" USING "btree" ("is_generator_enabled", "jurisdiction", "language", "doc_type");



CREATE INDEX "guidance_chunks_jurisdiction_idx" ON "public"."guidance_chunks" USING "btree" ("jurisdiction");



CREATE INDEX "guidance_chunks_org_idx" ON "public"."guidance_chunks" USING "btree" ("organization_id");



CREATE INDEX "guidance_chunks_source_idx" ON "public"."guidance_chunks" USING "btree" ("source_id", "chunk_index");



CREATE INDEX "hr_case_notes_case_id_idx" ON "public"."hr_case_notes" USING "btree" ("case_id");



CREATE INDEX "hr_cases_organization_id_idx" ON "public"."hr_cases" USING "btree" ("organization_id");



CREATE INDEX "hr_communications_organization_id_idx" ON "public"."hr_communications" USING "btree" ("organization_id");



CREATE INDEX "hr_compensation_records_organization_id_idx" ON "public"."hr_compensation_records" USING "btree" ("organization_id");



CREATE INDEX "hr_docs_jurisdiction_idx" ON "public"."hr_documents" USING "btree" ("jurisdiction");



CREATE INDEX "hr_docs_lang_idx" ON "public"."hr_documents" USING "btree" ("language");



CREATE INDEX "hr_docs_size_idx" ON "public"."hr_documents" USING "btree" ("employer_size");



CREATE INDEX "hr_docs_type_idx" ON "public"."hr_documents" USING "btree" ("doc_type");



CREATE INDEX "hr_documents_generator_lookup_idx" ON "public"."hr_documents" USING "btree" ("jurisdiction", "doc_type", "language", "is_generator_enabled");



CREATE UNIQUE INDEX "hr_documents_template_slug_idx" ON "public"."hr_documents" USING "btree" ("template_slug") WHERE ("template_slug" IS NOT NULL);



CREATE INDEX "hr_employee_notes_employee_id_idx" ON "public"."hr_employee_notes" USING "btree" ("employee_id");



CREATE INDEX "hr_expiry_records_employee_id_idx" ON "public"."hr_expiry_records" USING "btree" ("employee_id");



CREATE INDEX "hr_expiry_records_organization_id_idx" ON "public"."hr_expiry_records" USING "btree" ("organization_id");



CREATE INDEX "hr_leaves_employee_id_idx" ON "public"."hr_leaves" USING "btree" ("employee_id");



CREATE INDEX "hr_leaves_organization_id_idx" ON "public"."hr_leaves" USING "btree" ("organization_id");



CREATE INDEX "hr_obligations_organization_id_idx" ON "public"."hr_obligations" USING "btree" ("organization_id");



CREATE INDEX "hr_policies_organization_id_idx" ON "public"."hr_policies" USING "btree" ("organization_id");



CREATE INDEX "hr_wellbeing_initiatives_organization_id_idx" ON "public"."hr_wellbeing_initiatives" USING "btree" ("organization_id");



CREATE INDEX "idx_admin_users_active" ON "public"."admin_users" USING "btree" ("user_id") WHERE ("revoked_at" IS NULL);



CREATE INDEX "idx_admin_users_email" ON "public"."admin_users" USING "btree" ("email");



CREATE INDEX "idx_admin_users_user_id" ON "public"."admin_users" USING "btree" ("user_id");



CREATE INDEX "idx_clients_created_by" ON "public"."clients" USING "btree" ("created_by");



CREATE INDEX "idx_clients_jurisdiction" ON "public"."clients" USING "btree" ("jurisdiction_id");



CREATE INDEX "idx_clients_tier" ON "public"."clients" USING "btree" ("tier_id");



CREATE INDEX "idx_content_variants_jurisdiction" ON "public"."template_content_variants" USING "btree" ("jurisdiction_id");



CREATE INDEX "idx_content_variants_version" ON "public"."template_content_variants" USING "btree" ("template_version_id");



CREATE INDEX "idx_conversations_created_at" ON "public"."conversations" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_conversations_user_id" ON "public"."conversations" USING "btree" ("user_id");



CREATE INDEX "idx_documents_created_at" ON "public"."documents" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_documents_employer_profile" ON "public"."documents" USING "btree" ("employer_profile_id");



CREATE INDEX "idx_documents_template_jurisdiction" ON "public"."documents" USING "btree" ("template_key", "jurisdiction");



CREATE INDEX "idx_documents_user_status" ON "public"."documents" USING "btree" ("user_id", "status");



COMMENT ON INDEX "public"."idx_documents_user_status" IS 'Optimizes dashboard queries filtering by user and document status';



CREATE INDEX "idx_employer_tiers_sort" ON "public"."employer_tiers" USING "btree" ("sort_order");



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notifications_user_unread" ON "public"."notifications" USING "btree" ("user_id") WHERE ("read_at" IS NULL);



COMMENT ON INDEX "public"."idx_notifications_user_unread" IS 'Optimizes unread notification count queries';



CREATE INDEX "idx_profiles_plan" ON "public"."profiles" USING "btree" ("plan");



CREATE INDEX "idx_profiles_stripe_subscription" ON "public"."profiles" USING "btree" ("stripe_subscription_id") WHERE ("stripe_subscription_id" IS NOT NULL);



CREATE INDEX "idx_signatures_document_id" ON "public"."signatures" USING "btree" ("document_id");



CREATE INDEX "idx_signatures_user_id" ON "public"."signatures" USING "btree" ("user_id");



CREATE INDEX "idx_subfolders_category" ON "public"."subfolders" USING "btree" ("category_id");



CREATE INDEX "idx_template_audit_log_performed_at" ON "public"."template_audit_log" USING "btree" ("performed_at");



CREATE INDEX "idx_template_audit_log_table_record" ON "public"."template_audit_log" USING "btree" ("table_name", "record_id");



CREATE INDEX "idx_template_documents_client" ON "public"."template_documents" USING "btree" ("client_id");



CREATE INDEX "idx_template_documents_generated_by" ON "public"."template_documents" USING "btree" ("generated_by");



CREATE INDEX "idx_template_documents_status" ON "public"."template_documents" USING "btree" ("status");



CREATE INDEX "idx_template_documents_template" ON "public"."template_documents" USING "btree" ("template_id");



CREATE INDEX "idx_template_documents_workflow" ON "public"."template_documents" USING "btree" ("workflow_id");



CREATE INDEX "idx_template_fields_template" ON "public"."template_fields" USING "btree" ("template_id");



CREATE INDEX "idx_template_versions_current" ON "public"."template_versions" USING "btree" ("template_id", "is_current") WHERE ("is_current" = true);



CREATE INDEX "idx_template_versions_template" ON "public"."template_versions" USING "btree" ("template_id");



CREATE INDEX "idx_templates_status" ON "public"."templates" USING "btree" ("status");



CREATE INDEX "idx_templates_subfolder" ON "public"."templates" USING "btree" ("subfolder_id");



CREATE INDEX "idx_templates_tags" ON "public"."templates" USING "gin" ("tags");



CREATE INDEX "idx_tier_categories_category" ON "public"."tier_categories" USING "btree" ("category_id");



CREATE INDEX "idx_tier_categories_tier" ON "public"."tier_categories" USING "btree" ("tier_id");



CREATE INDEX "idx_usage_counters_user_period" ON "public"."usage_counters" USING "btree" ("user_id", "period_start");



COMMENT ON INDEX "public"."idx_usage_counters_user_period" IS 'Optimizes plan enforcement counter lookups';



CREATE INDEX "idx_workflow_questions_template" ON "public"."workflow_questions" USING "btree" ("template_id");



CREATE INDEX "idx_workflow_responses_workflow" ON "public"."workflow_responses" USING "btree" ("workflow_id");



CREATE INDEX "idx_workflows_client" ON "public"."workflows" USING "btree" ("client_id");



CREATE INDEX "idx_workflows_status" ON "public"."workflows" USING "btree" ("status");



CREATE INDEX "idx_workflows_template" ON "public"."workflows" USING "btree" ("template_id");



CREATE INDEX "job_attempts_job_idx" ON "public"."job_attempts" USING "btree" ("job_id", "attempt_number" DESC);



CREATE INDEX "job_queue_org_status_idx" ON "public"."job_queue" USING "btree" ("organization_id", "status", "created_at" DESC);



CREATE INDEX "job_queue_status_priority_idx" ON "public"."job_queue" USING "btree" ("status", "run_after", "priority", "created_at");



CREATE INDEX "jurisdiction_comparisons_topic_idx" ON "public"."jurisdiction_comparisons" USING "btree" ("topic", "status");



CREATE INDEX "law_change_impacts_document_idx" ON "public"."law_change_impacts" USING "btree" ("document_id");



CREATE INDEX "law_change_impacts_law_update_idx" ON "public"."law_change_impacts" USING "btree" ("law_update_id");



CREATE INDEX "law_change_impacts_org_status_idx" ON "public"."law_change_impacts" USING "btree" ("organization_id", "status", "severity");



CREATE INDEX "law_update_notifications_law_update_idx" ON "public"."law_update_notifications" USING "btree" ("law_update_id");



CREATE INDEX "law_updates_detected_at_idx" ON "public"."law_updates" USING "btree" ("detected_at" DESC);



CREATE INDEX "law_updates_event_type_idx" ON "public"."law_updates" USING "btree" ("event_type", "detected_at" DESC);



CREATE INDEX "legal_ingestion_runs_source_status_idx" ON "public"."legal_ingestion_runs" USING "btree" ("source_id", "status", "created_at" DESC);



CREATE INDEX "legal_ingestion_sources_jurisdiction_idx" ON "public"."legal_ingestion_sources" USING "btree" ("jurisdiction", "status");



CREATE INDEX "multi_agent_plans_org_status_idx" ON "public"."multi_agent_plans" USING "btree" ("organization_id", "status", "created_at" DESC);



CREATE INDEX "notification_deliveries_notification_idx" ON "public"."notification_deliveries" USING "btree" ("notification_id", "status");



CREATE INDEX "notification_deliveries_status_idx" ON "public"."notification_deliveries" USING "btree" ("status", "created_at");



CREATE INDEX "notifications_org_created_idx" ON "public"."notifications" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "notifications_user_read_created_idx" ON "public"."notifications" USING "btree" ("user_id", "read_at", "created_at" DESC);



CREATE INDEX "offer_workflow_states_document_idx" ON "public"."offer_workflow_states" USING "btree" ("document_id", "created_at" DESC);



CREATE INDEX "offer_workflow_states_employer_profile_id_idx" ON "public"."offer_workflow_states" USING "btree" ("employer_profile_id");



CREATE INDEX "offer_workflow_states_owner_stage_idx" ON "public"."offer_workflow_states" USING "btree" ("owner_id", "stage");



CREATE INDEX "operational_bottlenecks_org_status_idx" ON "public"."operational_bottlenecks" USING "btree" ("organization_id", "status", "severity", "detected_at" DESC);



CREATE INDEX "organization_invitations_email_idx" ON "public"."organization_invitations" USING "btree" ("lower"("email"));



CREATE INDEX "organization_maturity_scores_org_category_idx" ON "public"."organization_maturity_scores" USING "btree" ("organization_id", "category", "calculated_at" DESC);



CREATE INDEX "organization_members_org_role_idx" ON "public"."organization_members" USING "btree" ("organization_id", "role");



CREATE INDEX "organization_members_user_idx" ON "public"."organization_members" USING "btree" ("user_id");



CREATE INDEX "organization_risk_snapshots_org_created_idx" ON "public"."organization_risk_snapshots" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "playbook_runs_org_status_idx" ON "public"."playbook_runs" USING "btree" ("organization_id", "status", "started_at" DESC);



CREATE INDEX "policy_gap_analyses_org_status_idx" ON "public"."policy_gap_analyses" USING "btree" ("organization_id", "status", "created_at" DESC);



CREATE INDEX "predictive_risk_forecasts_org_type_idx" ON "public"."predictive_risk_forecasts" USING "btree" ("organization_id", "forecast_type", "generated_at" DESC);



CREATE INDEX "queue_health_snapshots_created_idx" ON "public"."queue_health_snapshots" USING "btree" ("created_at" DESC);



CREATE INDEX "scheduled_operations_next_run_idx" ON "public"."scheduled_operations" USING "btree" ("status", "next_run_at");



CREATE INDEX "scheduled_operations_org_idx" ON "public"."scheduled_operations" USING "btree" ("organization_id", "status");



CREATE INDEX "signature_audit_events_created_at_idx" ON "public"."signature_audit_events" USING "btree" ("created_at" DESC);



CREATE INDEX "signature_audit_events_signature_id_idx" ON "public"."signature_audit_events" USING "btree" ("signature_id");



CREATE INDEX "signatures_document_id_idx" ON "public"."signatures" USING "btree" ("document_id");



CREATE UNIQUE INDEX "signatures_token_idx" ON "public"."signatures" USING "btree" ("token");



CREATE INDEX "signatures_user_id_idx" ON "public"."signatures" USING "btree" ("user_id");



CREATE INDEX "support_analytics_daily_day_idx" ON "public"."support_analytics_daily" USING "btree" ("day" DESC);



CREATE INDEX "support_analytics_daily_type_idx" ON "public"."support_analytics_daily" USING "btree" ("event_type", "day" DESC);



CREATE INDEX "support_analytics_events_article_idx" ON "public"."support_analytics_events" USING "btree" ("article_slug", "occurred_at" DESC) WHERE ("article_slug" IS NOT NULL);



CREATE INDEX "support_analytics_events_occurred_idx" ON "public"."support_analytics_events" USING "btree" ("occurred_at" DESC);



CREATE INDEX "support_analytics_events_type_idx" ON "public"."support_analytics_events" USING "btree" ("event_type", "occurred_at" DESC);



CREATE INDEX "support_analytics_events_workspace_idx" ON "public"."support_analytics_events" USING "btree" ("workspace_id", "occurred_at" DESC) WHERE ("workspace_id" IS NOT NULL);



CREATE INDEX "support_analytics_rate_limit_created_idx" ON "public"."support_analytics_rate_limit" USING "btree" ("created_at");



CREATE INDEX "support_analytics_rate_limit_ip_idx" ON "public"."support_analytics_rate_limit" USING "btree" ("ip_hash", "created_at");



CREATE INDEX "support_attachments_pending_scan_idx" ON "public"."support_attachments" USING "btree" ("created_at") WHERE ("scan_status" = 'pending'::"text");



CREATE INDEX "support_attachments_ticket_idx" ON "public"."support_attachments" USING "btree" ("ticket_id");



CREATE INDEX "support_messages_ticket_idx" ON "public"."support_messages" USING "btree" ("ticket_id", "created_at");



CREATE INDEX "support_notifications_pending_idx" ON "public"."support_notifications" USING "btree" ("created_at") WHERE ("status" = 'pending'::"text");



CREATE INDEX "support_notifications_provider_msg_idx" ON "public"."support_notifications" USING "btree" ("provider_message_id") WHERE ("provider_message_id" IS NOT NULL);



CREATE INDEX "support_notifications_ticket_idx" ON "public"."support_notifications" USING "btree" ("ticket_id");



CREATE INDEX "support_notifications_undelivered_idx" ON "public"."support_notifications" USING "btree" ("delivery_status") WHERE ("delivery_status" = ANY (ARRAY['bounced'::"text", 'complained'::"text"]));



CREATE INDEX "support_public_intake_created_idx" ON "public"."support_public_intake" USING "btree" ("created_at");



CREATE INDEX "support_public_intake_email_idx" ON "public"."support_public_intake" USING "btree" ("email_hash", "created_at");



CREATE INDEX "support_public_intake_ip_idx" ON "public"."support_public_intake" USING "btree" ("ip_hash", "created_at");



CREATE INDEX "support_scheduled_calls_followup_idx" ON "public"."support_scheduled_calls" USING "btree" ("confirmed_end") WHERE (("status" = 'confirmed'::"text") AND ("followup_flagged_at" IS NULL));



CREATE INDEX "support_scheduled_calls_reminder_idx" ON "public"."support_scheduled_calls" USING "btree" ("confirmed_start") WHERE (("status" = 'confirmed'::"text") AND ("reminder_sent_at" IS NULL));



CREATE INDEX "support_ticket_assignments_ticket_idx" ON "public"."support_ticket_assignments" USING "btree" ("ticket_id");



CREATE INDEX "support_ticket_events_ticket_idx" ON "public"."support_ticket_events" USING "btree" ("ticket_id", "created_at");



CREATE INDEX "support_tickets_assigned_idx" ON "public"."support_tickets" USING "btree" ("assigned_to") WHERE ("assigned_to" IS NOT NULL);



CREATE INDEX "support_tickets_category_idx" ON "public"."support_tickets" USING "btree" ("category");



CREATE INDEX "support_tickets_open_created_idx" ON "public"."support_tickets" USING "btree" ("created_at" DESC) WHERE ("status" <> ALL (ARRAY['resolved'::"text", 'closed'::"text"]));



CREATE INDEX "support_tickets_priority_idx" ON "public"."support_tickets" USING "btree" ("priority");



CREATE INDEX "support_tickets_requester_idx" ON "public"."support_tickets" USING "btree" ("requester_user_id");



CREATE INDEX "support_tickets_status_idx" ON "public"."support_tickets" USING "btree" ("status");



CREATE INDEX "support_tickets_workspace_idx" ON "public"."support_tickets" USING "btree" ("workspace_id") WHERE ("workspace_id" IS NOT NULL);



CREATE INDEX "system_events_org_processed_idx" ON "public"."system_events" USING "btree" ("organization_id", "processed", "created_at" DESC);



CREATE INDEX "system_events_type_idx" ON "public"."system_events" USING "btree" ("event_type", "created_at" DESC);



CREATE INDEX "usage_counters_user_id_period_idx" ON "public"."usage_counters" USING "btree" ("user_id", "period_start" DESC);



CREATE INDEX "usage_events_organization_created_idx" ON "public"."usage_events" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "usage_events_type_created_idx" ON "public"."usage_events" USING "btree" ("event_type", "created_at" DESC);



CREATE INDEX "usage_events_user_created_idx" ON "public"."usage_events" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "webhook_events_org_idx" ON "public"."webhook_events" USING "btree" ("organization_id", "received_at" DESC);



CREATE INDEX "webhook_events_provider_status_idx" ON "public"."webhook_events" USING "btree" ("provider", "processing_status", "received_at" DESC);



CREATE INDEX "workflow_automation_runs_org_status_idx" ON "public"."workflow_automation_runs" USING "btree" ("organization_id", "status", "created_at" DESC);



CREATE INDEX "workflow_metrics_daily_org_date_idx" ON "public"."workflow_metrics_daily" USING "btree" ("organization_id", "metric_date" DESC);



CREATE INDEX "workflow_playbooks_category_status_idx" ON "public"."workflow_playbooks" USING "btree" ("category", "status");



CREATE INDEX "workspace_intelligence_items_org_status_idx" ON "public"."workspace_intelligence_items" USING "btree" ("organization_id", "status", "severity", "created_at" DESC);



CREATE INDEX "workspace_intelligence_items_related_idx" ON "public"."workspace_intelligence_items" USING "btree" ("related_entity_table", "related_entity_id");



CREATE INDEX "workspace_notes_org_type_idx" ON "public"."workspace_notes" USING "btree" ("organization_id", "note_type", "status", "created_at" DESC);



CREATE OR REPLACE TRIGGER "admin_beta_access_set_updated_at" BEFORE UPDATE ON "public"."admin_beta_access" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "admin_feature_flags_set_updated_at" BEFORE UPDATE ON "public"."admin_feature_flags" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "admin_plan_overrides_set_updated_at" BEFORE UPDATE ON "public"."admin_plan_overrides" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "admin_users_set_updated_at" BEFORE UPDATE ON "public"."admin_users" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "advisor_guidance_chunks_touch_updated_at" BEFORE UPDATE ON "public"."advisor_guidance_chunks" FOR EACH ROW EXECUTE FUNCTION "public"."touch_advisor_guidance_updated_at"();



CREATE OR REPLACE TRIGGER "law_updates_flag_guidance" AFTER INSERT ON "public"."law_updates" FOR EACH ROW EXECUTE FUNCTION "public"."flag_guidance_chunks_on_law_change"();



CREATE OR REPLACE TRIGGER "profiles_pin_billing_columns" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."pin_profile_billing_columns"();



CREATE OR REPLACE TRIGGER "set_conversations_updated_at" BEFORE UPDATE ON "public"."conversations" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_documents_updated_at" BEFORE UPDATE ON "public"."documents" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_generator_document_templates_updated_at" BEFORE UPDATE ON "public"."generator_document_templates" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_usage_counters_updated_at" BEFORE UPDATE ON "public"."usage_counters" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "signatures_on_insert_audit" AFTER INSERT ON "public"."signatures" FOR EACH ROW EXECUTE FUNCTION "public"."record_signature_link_created"();



CREATE OR REPLACE TRIGGER "support_scheduled_calls_touch_updated_at" BEFORE UPDATE ON "public"."support_scheduled_calls" FOR EACH ROW EXECUTE FUNCTION "public"."touch_support_updated_at"();



CREATE OR REPLACE TRIGGER "support_tickets_set_reference" BEFORE INSERT ON "public"."support_tickets" FOR EACH ROW EXECUTE FUNCTION "public"."set_support_ticket_reference"();



CREATE OR REPLACE TRIGGER "support_tickets_touch_updated_at" BEFORE UPDATE ON "public"."support_tickets" FOR EACH ROW EXECUTE FUNCTION "public"."touch_support_updated_at"();



CREATE OR REPLACE TRIGGER "trg_auto_version" BEFORE INSERT ON "public"."template_versions" FOR EACH ROW EXECUTE FUNCTION "public"."auto_increment_version"();



CREATE OR REPLACE TRIGGER "trg_categories_updated_at" BEFORE UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_clients_updated_at" BEFORE UPDATE ON "public"."clients" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_employer_profiles_touch" BEFORE UPDATE ON "public"."employer_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."touch_employer_profiles_updated_at"();



CREATE OR REPLACE TRIGGER "trg_employer_tiers_updated_at" BEFORE UPDATE ON "public"."employer_tiers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_offer_workflow_states_touch" BEFORE UPDATE ON "public"."offer_workflow_states" FOR EACH ROW EXECUTE FUNCTION "public"."touch_offer_workflow_states_updated_at"();



CREATE OR REPLACE TRIGGER "trg_subfolders_updated_at" BEFORE UPDATE ON "public"."subfolders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_sync_document_jurisdiction_fields" BEFORE INSERT OR UPDATE OF "jurisdiction_code", "jurisdiction", "province", "document_inputs" ON "public"."documents" FOR EACH ROW EXECUTE FUNCTION "public"."sync_document_jurisdiction_fields"();



CREATE OR REPLACE TRIGGER "trg_template_content_variants_updated_at" BEFORE UPDATE ON "public"."template_content_variants" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_template_documents_updated_at" BEFORE UPDATE ON "public"."template_documents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_templates_updated_at" BEFORE UPDATE ON "public"."templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."activity_events"
    ADD CONSTRAINT "activity_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activity_events"
    ADD CONSTRAINT "activity_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_activity_log"
    ADD CONSTRAINT "admin_activity_log_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_analytics_snapshots"
    ADD CONSTRAINT "admin_analytics_snapshots_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_app_error_events"
    ADD CONSTRAINT "admin_app_error_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_audit_log"
    ADD CONSTRAINT "admin_audit_log_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_beta_access"
    ADD CONSTRAINT "admin_beta_access_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_beta_access"
    ADD CONSTRAINT "admin_beta_access_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_beta_access"
    ADD CONSTRAINT "admin_beta_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_beta_feedback_events"
    ADD CONSTRAINT "admin_beta_feedback_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_feature_flags"
    ADD CONSTRAINT "admin_feature_flags_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_feature_flags"
    ADD CONSTRAINT "admin_feature_flags_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_plan_overrides"
    ADD CONSTRAINT "admin_plan_overrides_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_plan_overrides"
    ADD CONSTRAINT "admin_plan_overrides_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_plan_overrides"
    ADD CONSTRAINT "admin_plan_overrides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."advisor_memories"
    ADD CONSTRAINT "advisor_memories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."advisor_memories"
    ADD CONSTRAINT "advisor_memories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_runs"
    ADD CONSTRAINT "agent_runs_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."ai_agents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."agent_runs"
    ADD CONSTRAINT "agent_runs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_runs"
    ADD CONSTRAINT "agent_runs_triggered_by_fkey" FOREIGN KEY ("triggered_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_action_runs"
    ADD CONSTRAINT "ai_action_runs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_action_runs"
    ADD CONSTRAINT "ai_action_runs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_action_runs"
    ADD CONSTRAINT "ai_action_runs_recommendation_id_fkey" FOREIGN KEY ("recommendation_id") REFERENCES "public"."ai_recommendations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_drafting_sessions"
    ADD CONSTRAINT "ai_drafting_sessions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_drafting_sessions"
    ADD CONSTRAINT "ai_drafting_sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_drafting_sessions"
    ADD CONSTRAINT "ai_drafting_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_model_routes"
    ADD CONSTRAINT "ai_model_routes_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."ai_model_providers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_recommendations"
    ADD CONSTRAINT "ai_recommendations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_recommendations"
    ADD CONSTRAINT "ai_recommendations_related_document_id_fkey" FOREIGN KEY ("related_document_id") REFERENCES "public"."documents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_recommendations"
    ADD CONSTRAINT "ai_recommendations_related_finding_id_fkey" FOREIGN KEY ("related_finding_id") REFERENCES "public"."compliance_findings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_recommendations"
    ADD CONSTRAINT "ai_recommendations_related_task_id_fkey" FOREIGN KEY ("related_task_id") REFERENCES "public"."compliance_tasks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_recommendations"
    ADD CONSTRAINT "ai_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_telemetry_events"
    ADD CONSTRAINT "ai_telemetry_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_telemetry_events"
    ADD CONSTRAINT "ai_telemetry_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."benchmark_snapshots"
    ADD CONSTRAINT "benchmark_snapshots_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."billing_events"
    ADD CONSTRAINT "billing_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."billing_events"
    ADD CONSTRAINT "billing_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_jurisdiction_id_fkey" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "public"."employer_tiers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."comment_mentions"
    ADD CONSTRAINT "comment_mentions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_mentions"
    ADD CONSTRAINT "comment_mentions_mentioned_user_id_fkey" FOREIGN KEY ("mentioned_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compliance_assessments"
    ADD CONSTRAINT "compliance_assessments_assessed_by_fkey" FOREIGN KEY ("assessed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."compliance_assessments"
    ADD CONSTRAINT "compliance_assessments_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."compliance_assessments"
    ADD CONSTRAINT "compliance_assessments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compliance_findings"
    ADD CONSTRAINT "compliance_findings_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."compliance_assessments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compliance_findings"
    ADD CONSTRAINT "compliance_findings_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."compliance_findings"
    ADD CONSTRAINT "compliance_findings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compliance_findings"
    ADD CONSTRAINT "compliance_findings_source_chunk_id_fkey" FOREIGN KEY ("source_chunk_id") REFERENCES "public"."guidance_chunks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."compliance_score_snapshots"
    ADD CONSTRAINT "compliance_score_snapshots_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compliance_tasks"
    ADD CONSTRAINT "compliance_tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."compliance_tasks"
    ADD CONSTRAINT "compliance_tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."compliance_tasks"
    ADD CONSTRAINT "compliance_tasks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."compliance_tasks"
    ADD CONSTRAINT "compliance_tasks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_annotations"
    ADD CONSTRAINT "document_annotations_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."document_annotations"
    ADD CONSTRAINT "document_annotations_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_annotations"
    ADD CONSTRAINT "document_annotations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_generation_runs"
    ADD CONSTRAINT "document_generation_runs_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."document_generation_runs"
    ADD CONSTRAINT "document_generation_runs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."document_generation_runs"
    ADD CONSTRAINT "document_generation_runs_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."hr_documents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."document_generation_runs"
    ADD CONSTRAINT "document_generation_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."document_reviews"
    ADD CONSTRAINT "document_reviews_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_reviews"
    ADD CONSTRAINT "document_reviews_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."document_reviews"
    ADD CONSTRAINT "document_reviews_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."document_reviews"
    ADD CONSTRAINT "document_reviews_reviewer_user_id_fkey" FOREIGN KEY ("reviewer_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."document_versions"
    ADD CONSTRAINT "document_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."document_versions"
    ADD CONSTRAINT "document_versions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_versions"
    ADD CONSTRAINT "document_versions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_employer_profile_id_fkey" FOREIGN KEY ("employer_profile_id") REFERENCES "public"."employer_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employer_profiles"
    ADD CONSTRAINT "employer_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employer_profiles"
    ADD CONSTRAINT "employer_profiles_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."entity_relationships"
    ADD CONSTRAINT "entity_relationships_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."entity_relationships"
    ADD CONSTRAINT "entity_relationships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."execution_traces"
    ADD CONSTRAINT "execution_traces_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."execution_traces"
    ADD CONSTRAINT "execution_traces_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."execution_traces"
    ADD CONSTRAINT "execution_traces_parent_trace_id_fkey" FOREIGN KEY ("parent_trace_id") REFERENCES "public"."execution_traces"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."export_events"
    ADD CONSTRAINT "export_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."external_integrations"
    ADD CONSTRAINT "external_integrations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."external_integrations"
    ADD CONSTRAINT "external_integrations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."guidance_chunks"
    ADD CONSTRAINT "guidance_chunks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."guidance_chunks"
    ADD CONSTRAINT "guidance_chunks_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."guidance_sources"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hr_case_notes"
    ADD CONSTRAINT "hr_case_notes_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "public"."hr_cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hr_case_notes"
    ADD CONSTRAINT "hr_case_notes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."hr_case_notes"
    ADD CONSTRAINT "hr_case_notes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hr_cases"
    ADD CONSTRAINT "hr_cases_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."hr_cases"
    ADD CONSTRAINT "hr_cases_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."hr_cases"
    ADD CONSTRAINT "hr_cases_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hr_communications"
    ADD CONSTRAINT "hr_communications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."hr_communications"
    ADD CONSTRAINT "hr_communications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hr_compensation_records"
    ADD CONSTRAINT "hr_compensation_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."hr_compensation_records"
    ADD CONSTRAINT "hr_compensation_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hr_compensation_records"
    ADD CONSTRAINT "hr_compensation_records_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hr_employee_notes"
    ADD CONSTRAINT "hr_employee_notes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."hr_employee_notes"
    ADD CONSTRAINT "hr_employee_notes_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hr_employee_notes"
    ADD CONSTRAINT "hr_employee_notes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hr_expiry_records"
    ADD CONSTRAINT "hr_expiry_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."hr_expiry_records"
    ADD CONSTRAINT "hr_expiry_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hr_expiry_records"
    ADD CONSTRAINT "hr_expiry_records_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hr_leaves"
    ADD CONSTRAINT "hr_leaves_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."hr_leaves"
    ADD CONSTRAINT "hr_leaves_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hr_leaves"
    ADD CONSTRAINT "hr_leaves_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hr_obligations"
    ADD CONSTRAINT "hr_obligations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."hr_obligations"
    ADD CONSTRAINT "hr_obligations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hr_policies"
    ADD CONSTRAINT "hr_policies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."hr_policies"
    ADD CONSTRAINT "hr_policies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hr_wellbeing_initiatives"
    ADD CONSTRAINT "hr_wellbeing_initiatives_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."hr_wellbeing_initiatives"
    ADD CONSTRAINT "hr_wellbeing_initiatives_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_attempts"
    ADD CONSTRAINT "job_attempts_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."job_queue"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_queue"
    ADD CONSTRAINT "job_queue_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."job_queue"
    ADD CONSTRAINT "job_queue_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."law_change_impacts"
    ADD CONSTRAINT "law_change_impacts_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."law_change_impacts"
    ADD CONSTRAINT "law_change_impacts_law_update_id_fkey" FOREIGN KEY ("law_update_id") REFERENCES "public"."law_updates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."law_change_impacts"
    ADD CONSTRAINT "law_change_impacts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."law_change_impacts"
    ADD CONSTRAINT "law_change_impacts_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."hr_documents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."law_update_notifications"
    ADD CONSTRAINT "law_update_notifications_law_update_id_fkey" FOREIGN KEY ("law_update_id") REFERENCES "public"."law_updates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."legal_ingestion_runs"
    ADD CONSTRAINT "legal_ingestion_runs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."legal_ingestion_runs"
    ADD CONSTRAINT "legal_ingestion_runs_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."legal_ingestion_sources"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."multi_agent_plans"
    ADD CONSTRAINT "multi_agent_plans_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."multi_agent_plans"
    ADD CONSTRAINT "multi_agent_plans_lead_agent_id_fkey" FOREIGN KEY ("lead_agent_id") REFERENCES "public"."ai_agents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."multi_agent_plans"
    ADD CONSTRAINT "multi_agent_plans_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_deliveries"
    ADD CONSTRAINT "notification_deliveries_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offer_workflow_states"
    ADD CONSTRAINT "offer_workflow_states_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offer_workflow_states"
    ADD CONSTRAINT "offer_workflow_states_employer_profile_id_fkey" FOREIGN KEY ("employer_profile_id") REFERENCES "public"."employer_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."offer_workflow_states"
    ADD CONSTRAINT "offer_workflow_states_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."operational_bottlenecks"
    ADD CONSTRAINT "operational_bottlenecks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_invitations"
    ADD CONSTRAINT "organization_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."organization_invitations"
    ADD CONSTRAINT "organization_invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_maturity_scores"
    ADD CONSTRAINT "organization_maturity_scores_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_risk_snapshots"
    ADD CONSTRAINT "organization_risk_snapshots_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."playbook_runs"
    ADD CONSTRAINT "playbook_runs_initiated_by_fkey" FOREIGN KEY ("initiated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."playbook_runs"
    ADD CONSTRAINT "playbook_runs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."playbook_runs"
    ADD CONSTRAINT "playbook_runs_playbook_id_fkey" FOREIGN KEY ("playbook_id") REFERENCES "public"."workflow_playbooks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."policy_gap_analyses"
    ADD CONSTRAINT "policy_gap_analyses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."policy_gap_analyses"
    ADD CONSTRAINT "policy_gap_analyses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."predictive_risk_forecasts"
    ADD CONSTRAINT "predictive_risk_forecasts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scheduled_operations"
    ADD CONSTRAINT "scheduled_operations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."scheduled_operations"
    ADD CONSTRAINT "scheduled_operations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."signature_audit_events"
    ADD CONSTRAINT "signature_audit_events_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."signature_audit_events"
    ADD CONSTRAINT "signature_audit_events_signature_id_fkey" FOREIGN KEY ("signature_id") REFERENCES "public"."signatures"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."signature_audit_events"
    ADD CONSTRAINT "signature_audit_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."signatures"
    ADD CONSTRAINT "signatures_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."signatures"
    ADD CONSTRAINT "signatures_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subfolders"
    ADD CONSTRAINT "subfolders_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_attachments"
    ADD CONSTRAINT "support_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."support_messages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."support_attachments"
    ADD CONSTRAINT "support_attachments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_attachments"
    ADD CONSTRAINT "support_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."support_messages"
    ADD CONSTRAINT "support_messages_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."support_messages"
    ADD CONSTRAINT "support_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_notifications"
    ADD CONSTRAINT "support_notifications_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_scheduled_calls"
    ADD CONSTRAINT "support_scheduled_calls_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."support_scheduled_calls"
    ADD CONSTRAINT "support_scheduled_calls_proposed_by_fkey" FOREIGN KEY ("proposed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."support_scheduled_calls"
    ADD CONSTRAINT "support_scheduled_calls_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_ticket_assignments"
    ADD CONSTRAINT "support_ticket_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."support_ticket_assignments"
    ADD CONSTRAINT "support_ticket_assignments_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."support_ticket_assignments"
    ADD CONSTRAINT "support_ticket_assignments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_ticket_events"
    ADD CONSTRAINT "support_ticket_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."support_ticket_events"
    ADD CONSTRAINT "support_ticket_events_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_ticket_feedback"
    ADD CONSTRAINT "support_ticket_feedback_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."support_ticket_feedback"
    ADD CONSTRAINT "support_ticket_feedback_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_requester_user_id_fkey" FOREIGN KEY ("requester_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."system_events"
    ADD CONSTRAINT "system_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."system_events"
    ADD CONSTRAINT "system_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."template_content_variants"
    ADD CONSTRAINT "template_content_variants_jurisdiction_id_fkey" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."template_content_variants"
    ADD CONSTRAINT "template_content_variants_template_version_id_fkey" FOREIGN KEY ("template_version_id") REFERENCES "public"."template_versions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."template_documents"
    ADD CONSTRAINT "template_documents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."template_documents"
    ADD CONSTRAINT "template_documents_jurisdiction_id_fkey" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id");



ALTER TABLE ONLY "public"."template_documents"
    ADD CONSTRAINT "template_documents_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id");



ALTER TABLE ONLY "public"."template_documents"
    ADD CONSTRAINT "template_documents_template_version_id_fkey" FOREIGN KEY ("template_version_id") REFERENCES "public"."template_versions"("id");



ALTER TABLE ONLY "public"."template_documents"
    ADD CONSTRAINT "template_documents_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."template_fields"
    ADD CONSTRAINT "template_fields_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."template_versions"
    ADD CONSTRAINT "template_versions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."templates"
    ADD CONSTRAINT "templates_subfolder_id_fkey" FOREIGN KEY ("subfolder_id") REFERENCES "public"."subfolders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tier_categories"
    ADD CONSTRAINT "tier_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tier_categories"
    ADD CONSTRAINT "tier_categories_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "public"."employer_tiers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."usage_counters"
    ADD CONSTRAINT "usage_counters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."usage_events"
    ADD CONSTRAINT "usage_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."usage_events"
    ADD CONSTRAINT "usage_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."webhook_events"
    ADD CONSTRAINT "webhook_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workflow_automation_runs"
    ADD CONSTRAINT "workflow_automation_runs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workflow_automation_runs"
    ADD CONSTRAINT "workflow_automation_runs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_metrics_daily"
    ADD CONSTRAINT "workflow_metrics_daily_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_questions"
    ADD CONSTRAINT "workflow_questions_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "public"."template_fields"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workflow_questions"
    ADD CONSTRAINT "workflow_questions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_responses"
    ADD CONSTRAINT "workflow_responses_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "public"."template_fields"("id");



ALTER TABLE ONLY "public"."workflow_responses"
    ADD CONSTRAINT "workflow_responses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."workflow_questions"("id");



ALTER TABLE ONLY "public"."workflow_responses"
    ADD CONSTRAINT "workflow_responses_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflows"
    ADD CONSTRAINT "workflows_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workflows"
    ADD CONSTRAINT "workflows_jurisdiction_id_fkey" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id");



ALTER TABLE ONLY "public"."workflows"
    ADD CONSTRAINT "workflows_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflows"
    ADD CONSTRAINT "workflows_template_version_id_fkey" FOREIGN KEY ("template_version_id") REFERENCES "public"."template_versions"("id");



ALTER TABLE ONLY "public"."workspace_intelligence_items"
    ADD CONSTRAINT "workspace_intelligence_items_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_notes"
    ADD CONSTRAINT "workspace_notes_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workspace_notes"
    ADD CONSTRAINT "workspace_notes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_preferences"
    ADD CONSTRAINT "workspace_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can insert activity log" ON "public"."admin_activity_log" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can insert audit log" ON "public"."admin_audit_log" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage AI agents" ON "public"."ai_agents" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage AI telemetry" ON "public"."ai_telemetry_events" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage admin_users" ON "public"."admin_users" TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."admin_users" "au"
  WHERE (("au"."user_id" = "auth"."uid"()) AND ("au"."revoked_at" IS NULL) AND (("au"."expires_at" IS NULL) OR ("au"."expires_at" > "now"()))))) OR ((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text") OR (("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"))) WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."admin_users" "au"
  WHERE (("au"."user_id" = "auth"."uid"()) AND ("au"."revoked_at" IS NULL) AND (("au"."expires_at" IS NULL) OR ("au"."expires_at" > "now"()))))) OR ((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text") OR (("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")));



CREATE POLICY "Admins can manage agent runs" ON "public"."agent_runs" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage analytics snapshots" ON "public"."admin_analytics_snapshots" TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can manage backup verification" ON "public"."backup_verification_runs" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage benchmarks" ON "public"."benchmark_snapshots" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage beta access" ON "public"."admin_beta_access" TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can manage billing events" ON "public"."billing_events" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage content variants" ON "public"."template_content_variants" TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can manage execution traces" ON "public"."execution_traces" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage feature flags" ON "public"."admin_feature_flags" TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can manage feature flags" ON "public"."frontend_feature_flags" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage forecasts" ON "public"."predictive_risk_forecasts" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage guidance chunks" ON "public"."guidance_chunks" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage guidance sources" ON "public"."guidance_sources" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage job attempts" ON "public"."job_attempts" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage jobs" ON "public"."job_queue" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage jurisdiction comparisons" ON "public"."jurisdiction_comparisons" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage legal ingestion runs" ON "public"."legal_ingestion_runs" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage legal ingestion sources" ON "public"."legal_ingestion_sources" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage maturity scores" ON "public"."organization_maturity_scores" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage model providers" ON "public"."ai_model_providers" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage model routes" ON "public"."ai_model_routes" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage multi-agent plans" ON "public"."multi_agent_plans" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage notification deliveries" ON "public"."notification_deliveries" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage org risk snapshots" ON "public"."organization_risk_snapshots" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage plan overrides" ON "public"."admin_plan_overrides" TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can manage playbooks" ON "public"."workflow_playbooks" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage queue health" ON "public"."queue_health_snapshots" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage roles" ON "public"."user_roles" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage runbooks" ON "public"."devops_runbooks" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage scheduled operations" ON "public"."scheduled_operations" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage template fields" ON "public"."template_fields" TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can manage template versions" ON "public"."template_versions" TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can manage templates" ON "public"."templates" TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



COMMENT ON POLICY "Admins can manage templates" ON "public"."templates" IS 'Only admins can create, update, or delete templates.';



CREATE POLICY "Admins can manage usage events" ON "public"."usage_events" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage webhook events" ON "public"."webhook_events" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can manage workflow metrics" ON "public"."workflow_metrics_daily" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can read activity log" ON "public"."admin_activity_log" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "Admins can read audit log" ON "public"."admin_audit_log" FOR SELECT TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can view legal ingestion runs" ON "public"."legal_ingestion_runs" FOR SELECT TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can view queue health" ON "public"."queue_health_snapshots" FOR SELECT TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins can view webhook events" ON "public"."webhook_events" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Admins manage their own workspace preference" ON "public"."workspace_preferences" USING ((("user_id" = "auth"."uid"()) AND "public"."is_admin_user"())) WITH CHECK ((("user_id" = "auth"."uid"()) AND "public"."is_admin_user"()));



CREATE POLICY "Admins read beta intake log" ON "public"."beta_signup_intake" FOR SELECT USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins read beta signups" ON "public"."beta_signups" FOR SELECT USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins read client error rate limit" ON "public"."client_error_rate_limit" FOR SELECT USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins read client error reports" ON "public"."client_error_reports" FOR SELECT USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins read law update notifications" ON "public"."law_update_notifications" FOR SELECT USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins read public intake log" ON "public"."support_public_intake" FOR SELECT USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins read support analytics daily" ON "public"."support_analytics_daily" FOR SELECT USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins read support analytics rate limit" ON "public"."support_analytics_rate_limit" FOR SELECT USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins read support notifications" ON "public"."support_notifications" FOR SELECT USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins read ticket assignments" ON "public"."support_ticket_assignments" FOR SELECT USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins read ticket events" ON "public"."support_ticket_events" FOR SELECT USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Admins update beta signups" ON "public"."beta_signups" FOR UPDATE USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Anyone can read service status" ON "public"."service_status" FOR SELECT USING (true);



CREATE POLICY "Authenticated can read active AI agents" ON "public"."ai_agents" FOR SELECT TO "authenticated" USING ((("status" = 'active'::"text") OR "public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Authenticated can read active jurisdiction comparisons" ON "public"."jurisdiction_comparisons" FOR SELECT TO "authenticated" USING ((("status" = 'active'::"text") OR "public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Authenticated can read active legal ingestion sources" ON "public"."legal_ingestion_sources" FOR SELECT TO "authenticated" USING ((("status" = 'active'::"text") OR "public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Authenticated can read active model routes" ON "public"."ai_model_routes" FOR SELECT TO "authenticated" USING ((("status" = ANY (ARRAY['active'::"text", 'fallback'::"text"])) OR "public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Authenticated can read active playbooks" ON "public"."workflow_playbooks" FOR SELECT TO "authenticated" USING ((("status" = 'active'::"text") OR "public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Authenticated can read active public guidance sources" ON "public"."guidance_sources" FOR SELECT TO "authenticated" USING (("public"."current_user_is_workspace_member"() AND (("status" = 'active'::"text") OR "public"."is_admin"(( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Authenticated can read feature flags" ON "public"."frontend_feature_flags" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated read active templates" ON "public"."templates" FOR SELECT TO "authenticated" USING (((("status")::"text" = 'active'::"text") OR "public"."is_admin_user"()));



COMMENT ON POLICY "Authenticated read active templates" ON "public"."templates" IS 'Regular users can only view active templates. Admins can view all templates.';



CREATE POLICY "Authenticated read content for active templates" ON "public"."template_content_variants" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM ("public"."template_versions" "tv"
     JOIN "public"."templates" "t" ON (("t"."id" = "tv"."template_id")))
  WHERE (("tv"."id" = "template_content_variants"."template_version_id") AND (("t"."status")::"text" = 'active'::"text")))) OR "public"."is_admin_user"()));



CREATE POLICY "Authenticated read fields for active templates" ON "public"."template_fields" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."templates" "t"
  WHERE (("t"."id" = "template_fields"."template_id") AND (("t"."status")::"text" = 'active'::"text")))) OR "public"."is_admin_user"()));



CREATE POLICY "Authenticated read published versions" ON "public"."template_versions" FOR SELECT TO "authenticated" USING ((("is_current" = true) OR "public"."is_admin_user"()));



COMMENT ON POLICY "Authenticated read published versions" ON "public"."template_versions" IS 'Regular users can only view current versions. Admins can view all versions.';



CREATE POLICY "Authenticated read workflow questions for active templates" ON "public"."workflow_questions" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."templates" "t"
  WHERE (("t"."id" = "workflow_questions"."template_id") AND (("t"."status")::"text" = 'active'::"text")))) OR "public"."is_admin_user"()));



CREATE POLICY "Authenticated read: categories" ON "public"."categories" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated read: employer_tiers" ON "public"."employer_tiers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated read: jurisdictions" ON "public"."jurisdictions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated read: subfolders" ON "public"."subfolders" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated read: tier_categories" ON "public"."tier_categories" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can create organizations" ON "public"."organizations" FOR INSERT TO "authenticated" WITH CHECK ((("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Authenticated users can read law updates" ON "public"."law_updates" FOR SELECT TO "authenticated" USING ("public"."current_user_is_workspace_member"());



CREATE POLICY "Authenticated users can submit app error events" ON "public"."admin_app_error_events" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users can submit feedback events" ON "public"."admin_beta_feedback_events" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users can view enabled generator templates" ON "public"."generator_document_templates" FOR SELECT TO "authenticated" USING (("is_generator_enabled" = true));



CREATE POLICY "Internal admins can read app error events" ON "public"."admin_app_error_events" FOR SELECT TO "authenticated" USING (("public"."is_internal_admin_user"() OR "public"."is_admin_user"()));



CREATE POLICY "Internal admins can read feedback events" ON "public"."admin_beta_feedback_events" FOR SELECT TO "authenticated" USING (("public"."is_internal_admin_user"() OR "public"."is_admin_user"()));



CREATE POLICY "Members can create AI action runs" ON "public"."ai_action_runs" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("actor_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can create activity events" ON "public"."activity_events" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("actor_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can create automation runs" ON "public"."workflow_automation_runs" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")) OR ("created_by" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can create compliance assessments" ON "public"."compliance_assessments" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")) OR ("assessed_by" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can create document versions" ON "public"."document_versions" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")) OR ("created_by" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can create jobs" ON "public"."job_queue" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can create mentions" ON "public"."comment_mentions" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."comments" "c"
  WHERE (("c"."id" = "comment_mentions"."comment_id") AND "public"."is_org_member"("c"."organization_id", ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Members can create notifications" ON "public"."notifications" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can create playbook runs" ON "public"."playbook_runs" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("initiated_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can create system events" ON "public"."system_events" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("actor_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can manage AI recommendations" ON "public"."ai_recommendations" TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can manage advisor memories" ON "public"."advisor_memories" TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can manage annotations" ON "public"."document_annotations" TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("author_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("author_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can manage bottlenecks" ON "public"."operational_bottlenecks" TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can manage comments" ON "public"."comments" TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("author_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("author_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can manage compliance findings" ON "public"."compliance_findings" TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can manage document reviews" ON "public"."document_reviews" TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")) OR ("requested_by" = ( SELECT "auth"."uid"() AS "uid")) OR ("reviewer_user_id" = ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")) OR ("requested_by" = ( SELECT "auth"."uid"() AS "uid")) OR ("reviewer_user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can manage drafting sessions" ON "public"."ai_drafting_sessions" TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can manage entity relationships" ON "public"."entity_relationships" TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")) OR ("created_by" = ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")) OR ("created_by" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can manage law impacts" ON "public"."law_change_impacts" TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can manage policy gap analyses" ON "public"."policy_gap_analyses" TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can manage workspace intelligence" ON "public"."workspace_intelligence_items" TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can manage workspace notes" ON "public"."workspace_notes" TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")) OR ("author_user_id" = ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")) OR ("author_user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can read guidance chunks" ON "public"."guidance_chunks" FOR SELECT TO "authenticated" USING (("public"."current_user_is_workspace_member"() AND ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("organization_id" IS NULL) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Members can view AI action runs" ON "public"."ai_action_runs" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("actor_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can view AI recommendations" ON "public"."ai_recommendations" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can view AI telemetry" ON "public"."ai_telemetry_events" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can view activity events" ON "public"."activity_events" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("actor_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can view advisor memories" ON "public"."advisor_memories" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can view agent runs" ON "public"."agent_runs" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("triggered_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can view annotations" ON "public"."document_annotations" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("author_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can view automation runs" ON "public"."workflow_automation_runs" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")) OR ("created_by" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can view benchmarks" ON "public"."benchmark_snapshots" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can view bottlenecks" ON "public"."operational_bottlenecks" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can view comments" ON "public"."comments" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("author_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can view compliance assessments" ON "public"."compliance_assessments" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")) OR ("assessed_by" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can view compliance findings" ON "public"."compliance_findings" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can view document reviews" ON "public"."document_reviews" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")) OR ("requested_by" = ( SELECT "auth"."uid"() AS "uid")) OR ("reviewer_user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can view document versions" ON "public"."document_versions" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."documents" "d"
  WHERE (("d"."id" = "document_versions"."document_id") AND ("d"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Members can view drafting sessions" ON "public"."ai_drafting_sessions" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can view entity relationships" ON "public"."entity_relationships" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")) OR ("created_by" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can view execution traces" ON "public"."execution_traces" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("actor_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can view forecasts" ON "public"."predictive_risk_forecasts" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can view job attempts" ON "public"."job_attempts" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."job_queue" "jq"
  WHERE (("jq"."id" = "job_attempts"."job_id") AND (("jq"."created_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("jq"."organization_id", ( SELECT "auth"."uid"() AS "uid"))))))));



CREATE POLICY "Members can view jobs" ON "public"."job_queue" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can view law impacts" ON "public"."law_change_impacts" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can view maturity scores" ON "public"."organization_maturity_scores" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can view multi-agent plans" ON "public"."multi_agent_plans" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can view org risk snapshots" ON "public"."organization_risk_snapshots" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can view organization members" ON "public"."organization_members" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Members can view organizations" ON "public"."organizations" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Members can view playbook runs" ON "public"."playbook_runs" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("initiated_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can view policy gap analyses" ON "public"."policy_gap_analyses" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can view system events" ON "public"."system_events" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("actor_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can view workflow metrics" ON "public"."workflow_metrics_daily" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can view workspace intelligence" ON "public"."workspace_intelligence_items" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Members can view workspace notes" ON "public"."workspace_notes" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")) OR ("author_user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Org admins can delete case notes" ON "public"."hr_case_notes" FOR DELETE USING ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can delete cases" ON "public"."hr_cases" FOR DELETE USING ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can delete communications" ON "public"."hr_communications" FOR DELETE USING ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can delete compensation records" ON "public"."hr_compensation_records" FOR DELETE USING ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can delete employee notes" ON "public"."hr_employee_notes" FOR DELETE USING ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can delete employees" ON "public"."employees" FOR DELETE USING ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can delete expiry records" ON "public"."hr_expiry_records" FOR DELETE USING ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can delete leaves" ON "public"."hr_leaves" FOR DELETE USING ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can delete obligations" ON "public"."hr_obligations" FOR DELETE USING ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can delete policies" ON "public"."hr_policies" FOR DELETE USING ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can delete score snapshots" ON "public"."compliance_score_snapshots" FOR DELETE USING ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can delete wellbeing initiatives" ON "public"."hr_wellbeing_initiatives" FOR DELETE USING ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can insert case notes" ON "public"."hr_case_notes" FOR INSERT WITH CHECK ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can insert cases" ON "public"."hr_cases" FOR INSERT WITH CHECK ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can insert communications" ON "public"."hr_communications" FOR INSERT WITH CHECK ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can insert compensation records" ON "public"."hr_compensation_records" FOR INSERT WITH CHECK ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can insert employee notes" ON "public"."hr_employee_notes" FOR INSERT WITH CHECK ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can insert employees" ON "public"."employees" FOR INSERT WITH CHECK ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can insert expiry records" ON "public"."hr_expiry_records" FOR INSERT WITH CHECK ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can insert leaves" ON "public"."hr_leaves" FOR INSERT WITH CHECK ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can insert obligations" ON "public"."hr_obligations" FOR INSERT WITH CHECK ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can insert policies" ON "public"."hr_policies" FOR INSERT WITH CHECK ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can insert score snapshots" ON "public"."compliance_score_snapshots" FOR INSERT WITH CHECK ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can insert wellbeing initiatives" ON "public"."hr_wellbeing_initiatives" FOR INSERT WITH CHECK ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can manage integrations" ON "public"."external_integrations" TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Org admins can manage invitations" ON "public"."organization_invitations" TO "authenticated" USING ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can manage organization members" ON "public"."organization_members" TO "authenticated" USING ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can update cases" ON "public"."hr_cases" FOR UPDATE USING ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can update communications" ON "public"."hr_communications" FOR UPDATE USING ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can update compensation records" ON "public"."hr_compensation_records" FOR UPDATE USING ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can update employees" ON "public"."employees" FOR UPDATE USING ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can update expiry records" ON "public"."hr_expiry_records" FOR UPDATE USING ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can update leaves" ON "public"."hr_leaves" FOR UPDATE USING ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can update obligations" ON "public"."hr_obligations" FOR UPDATE USING ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can update organizations" ON "public"."organizations" FOR UPDATE TO "authenticated" USING ("public"."is_org_admin"("id", ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_org_admin"("id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can update policies" ON "public"."hr_policies" FOR UPDATE USING ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can update score snapshots" ON "public"."compliance_score_snapshots" FOR UPDATE USING ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can update wellbeing initiatives" ON "public"."hr_wellbeing_initiatives" FOR UPDATE USING ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can view billing events" ON "public"."billing_events" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")) OR ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Org admins can view compensation records" ON "public"."hr_compensation_records" FOR SELECT USING ("public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org admins can view integrations" ON "public"."external_integrations" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Org admins can view scheduled operations" ON "public"."scheduled_operations" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_admin"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Org members can manage compliance tasks" ON "public"."compliance_tasks" TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")) OR ("assigned_to" = ( SELECT "auth"."uid"() AS "uid")) OR ("created_by" = ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")) OR ("assigned_to" = ( SELECT "auth"."uid"() AS "uid")) OR ("created_by" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Org members can view case notes" ON "public"."hr_case_notes" FOR SELECT USING ("public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org members can view cases" ON "public"."hr_cases" FOR SELECT USING ("public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org members can view communications" ON "public"."hr_communications" FOR SELECT USING ("public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org members can view compliance tasks" ON "public"."compliance_tasks" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")) OR ("assigned_to" = ( SELECT "auth"."uid"() AS "uid")) OR ("created_by" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Org members can view employee notes" ON "public"."hr_employee_notes" FOR SELECT USING ("public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org members can view employees" ON "public"."employees" FOR SELECT USING ("public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org members can view expiry records" ON "public"."hr_expiry_records" FOR SELECT USING ("public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org members can view leaves" ON "public"."hr_leaves" FOR SELECT USING ("public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org members can view obligations" ON "public"."hr_obligations" FOR SELECT USING ("public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org members can view policies" ON "public"."hr_policies" FOR SELECT USING ("public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org members can view score snapshots" ON "public"."compliance_score_snapshots" FOR SELECT USING ("public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Org members can view wellbeing initiatives" ON "public"."hr_wellbeing_initiatives" FOR SELECT USING ("public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Own clients" ON "public"."clients" TO "authenticated" USING (("created_by" = "auth"."uid"())) WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Own template documents" ON "public"."template_documents" TO "authenticated" USING ((("generated_by" = "auth"."uid"()) OR ("workflow_id" IN ( SELECT "workflows"."id"
   FROM "public"."workflows"
  WHERE ("workflows"."started_by" = "auth"."uid"()))))) WITH CHECK ((("generated_by" = "auth"."uid"()) OR ("workflow_id" IN ( SELECT "workflows"."id"
   FROM "public"."workflows"
  WHERE ("workflows"."started_by" = "auth"."uid"())))));



CREATE POLICY "Own workflow responses" ON "public"."workflow_responses" TO "authenticated" USING (("workflow_id" IN ( SELECT "workflows"."id"
   FROM "public"."workflows"
  WHERE ("workflows"."started_by" = "auth"."uid"())))) WITH CHECK (("workflow_id" IN ( SELECT "workflows"."id"
   FROM "public"."workflows"
  WHERE ("workflows"."started_by" = "auth"."uid"()))));



CREATE POLICY "Own workflows" ON "public"."workflows" TO "authenticated" USING (("started_by" = "auth"."uid"())) WITH CHECK (("started_by" = "auth"."uid"()));



CREATE POLICY "Owners can manage their signatures" ON "public"."signatures" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Owners can read their signature audit events" ON "public"."signature_audit_events" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."signatures" "s"
  WHERE (("s"."id" = "signature_audit_events"."signature_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "Public can submit beta signups with valid email" ON "public"."beta_signups" FOR INSERT TO "anon", "authenticated" WITH CHECK ((("email" IS NOT NULL) AND ("length"("email") <= 320) AND ("email" ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$'::"text")));



CREATE POLICY "Read attachments on a visible ticket" ON "public"."support_attachments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."support_tickets" "t"
  WHERE (("t"."id" = "support_attachments"."ticket_id") AND (("t"."requester_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (("t"."workspace_id" IS NOT NULL) AND (NOT "t"."restricted") AND "public"."is_org_member"("t"."workspace_id", ( SELECT "auth"."uid"() AS "uid"))) OR "public"."is_admin"(( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Read messages on a visible, non-internal ticket" ON "public"."support_messages" FOR SELECT USING ((((NOT "is_internal_note") OR "public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) AND (EXISTS ( SELECT 1
   FROM "public"."support_tickets" "t"
  WHERE (("t"."id" = "support_messages"."ticket_id") AND (("t"."requester_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (("t"."workspace_id" IS NOT NULL) AND (NOT "t"."restricted") AND "public"."is_org_member"("t"."workspace_id", ( SELECT "auth"."uid"() AS "uid"))) OR "public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))))))));



CREATE POLICY "Requester can reply to own ticket" ON "public"."support_messages" FOR INSERT WITH CHECK ((("is_internal_note" = false) AND ("author_role" = 'customer'::"text") AND ("author_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."support_tickets" "t"
  WHERE (("t"."id" = "support_messages"."ticket_id") AND ("t"."requester_user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Requester leaves feedback on own ticket" ON "public"."support_ticket_feedback" FOR INSERT WITH CHECK ((("submitted_by" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."support_tickets" "t"
  WHERE (("t"."id" = "support_ticket_feedback"."ticket_id") AND ("t"."requester_user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Requester or admin reads feedback" ON "public"."support_ticket_feedback" FOR SELECT USING ((("submitted_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Requester or workspace member can read own scheduled call" ON "public"."support_scheduled_calls" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."support_tickets" "t"
  WHERE (("t"."id" = "support_scheduled_calls"."ticket_id") AND (("t"."requester_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (("t"."workspace_id" IS NOT NULL) AND (NOT "t"."restricted") AND "public"."is_org_member"("t"."workspace_id", ( SELECT "auth"."uid"() AS "uid"))) OR "public"."is_admin"(( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Requester or workspace member can read own tickets" ON "public"."support_tickets" FOR SELECT USING ((("requester_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (("workspace_id" IS NOT NULL) AND (NOT "restricted") AND "public"."is_org_member"("workspace_id", ( SELECT "auth"."uid"() AS "uid"))) OR "public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Service role can insert law updates" ON "public"."law_updates" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service role can manage hashes" ON "public"."law_page_hashes" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role manages hashes" ON "public"."law_page_hashes" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Users can access their own documents" ON "public"."documents" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own generation runs" ON "public"."document_generation_runs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own documents" ON "public"."documents" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own employer profiles" ON "public"."employer_profiles" FOR DELETE TO "authenticated" USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their own workflow states" ON "public"."offer_workflow_states" FOR DELETE TO "authenticated" USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own documents" ON "public"."documents" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own employer profiles" ON "public"."employer_profiles" FOR INSERT TO "authenticated" WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own usage events" ON "public"."usage_events" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Users can insert their own workflow states" ON "public"."offer_workflow_states" FOR INSERT TO "authenticated" WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users can manage their own conversations" ON "public"."conversations" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own generation runs" ON "public"."document_generation_runs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own generation runs" ON "public"."document_generation_runs" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin"(( SELECT "auth"."uid"() AS "uid")))) WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Users can update their own documents" ON "public"."documents" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own employer profiles" ON "public"."employer_profiles" FOR UPDATE TO "authenticated" USING (("owner_id" = "auth"."uid"())) WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own workflow states" ON "public"."offer_workflow_states" FOR UPDATE TO "authenticated" USING (("owner_id" = "auth"."uid"())) WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users can view mentions" ON "public"."comment_mentions" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("mentioned_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."comments" "c"
  WHERE (("c"."id" = "comment_mentions"."comment_id") AND "public"."is_org_member"("c"."organization_id", ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can view notification deliveries" ON "public"."notification_deliveries" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."notifications" "n"
  WHERE (("n"."id" = "notification_deliveries"."notification_id") AND (("n"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("n"."organization_id", ( SELECT "auth"."uid"() AS "uid"))))))));



CREATE POLICY "Users can view notifications" ON "public"."notifications" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_org_member"("organization_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Users can view own admin record" ON "public"."admin_users" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own documents" ON "public"."documents" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own employer profiles" ON "public"."employer_profiles" FOR SELECT TO "authenticated" USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Users can view their own usage counters" ON "public"."usage_counters" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own usage events" ON "public"."usage_events" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Users can view their own workflow states" ON "public"."offer_workflow_states" FOR SELECT TO "authenticated" USING (("owner_id" = "auth"."uid"()));



ALTER TABLE "public"."activity_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_activity_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_analytics_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_app_error_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_beta_access" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_beta_feedback_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_feature_flags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_plan_overrides" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."advisor_guidance_chunks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."advisor_memories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."agent_runs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_action_runs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_agents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_drafting_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_model_providers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_model_routes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_recommendations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_telemetry_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."backup_verification_runs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."benchmark_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."beta_signup_intake" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."beta_signups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."billing_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."client_error_rate_limit" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."client_error_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment_mentions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."compliance_assessments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."compliance_findings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."compliance_score_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."compliance_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cron_locks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."devops_runbooks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_annotations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_generation_runs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employer_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employer_tiers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."entity_relationships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."execution_traces" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."export_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."external_integrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."frontend_feature_flags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."generator_document_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."guidance_chunks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."guidance_sources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hr_case_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hr_cases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hr_communications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hr_compensation_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hr_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hr_employee_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hr_expiry_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hr_leaves" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hr_obligations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hr_policies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hr_wellbeing_initiatives" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."jurisdiction_comparisons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."jurisdictions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."law_change_impacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."law_page_hashes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."law_update_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."law_updates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."legal_ingestion_runs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."legal_ingestion_sources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."multi_agent_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_deliveries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."offer_workflow_states" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."operational_bottlenecks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_maturity_scores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_risk_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."playbook_runs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."policy_gap_analyses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."predictive_risk_forecasts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."queue_health_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scheduled_operations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."signature_audit_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."signatures" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stripe_webhook_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subfolders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_analytics_daily" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_analytics_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_analytics_rate_limit" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_public_intake" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_scheduled_calls" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_ticket_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_ticket_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_ticket_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."template_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."template_content_variants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."template_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."template_fields" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."template_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tier_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."usage_counters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."usage_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."webhook_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_automation_runs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_metrics_daily" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_playbooks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workspace_intelligence_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workspace_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workspace_preferences" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."activity_events";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."ai_recommendations";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."comment_mentions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."comments";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."compliance_tasks";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."document_annotations";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."document_reviews";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."job_queue";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."workspace_intelligence_items";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";








































































































































































































































































































































































































































































































































































































































































































































































GRANT ALL ON TABLE "public"."ai_recommendations" TO "anon";
GRANT ALL ON TABLE "public"."ai_recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_recommendations" TO "service_role";



REVOKE ALL ON FUNCTION "public"."accept_ai_recommendation"("target_recommendation_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."accept_ai_recommendation"("target_recommendation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_ai_recommendation"("target_recommendation_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."acquire_cron_lock"("p_job_name" "text", "p_instance_id" "text", "p_ttl_seconds" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."acquire_cron_lock"("p_job_name" "text", "p_instance_id" "text", "p_ttl_seconds" integer) TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



REVOKE ALL ON FUNCTION "public"."add_comment"("target_organization_id" "uuid", "target_entity_table" "text", "target_entity_id" "text", "comment_body" "text", "parent_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."add_comment"("target_organization_id" "uuid", "target_entity_table" "text", "target_entity_id" "text", "comment_body" "text", "parent_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_comment"("target_organization_id" "uuid", "target_entity_table" "text", "target_entity_id" "text", "comment_body" "text", "parent_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."document_annotations" TO "anon";
GRANT ALL ON TABLE "public"."document_annotations" TO "authenticated";
GRANT ALL ON TABLE "public"."document_annotations" TO "service_role";



REVOKE ALL ON FUNCTION "public"."add_document_annotation"("target_document_id" "uuid", "annotation_kind" "text", "annotation_body" "text", "annotation_anchor" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."add_document_annotation"("target_document_id" "uuid", "annotation_kind" "text", "annotation_body" "text", "annotation_anchor" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_document_annotation"("target_document_id" "uuid", "annotation_kind" "text", "annotation_body" "text", "annotation_anchor" "jsonb") TO "service_role";



GRANT ALL ON TABLE "public"."backup_verification_runs" TO "anon";
GRANT ALL ON TABLE "public"."backup_verification_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."backup_verification_runs" TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_create_backup_verification_run"("target" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_create_backup_verification_run"("target" "text") TO "service_role";



GRANT ALL ON TABLE "public"."multi_agent_plans" TO "anon";
GRANT ALL ON TABLE "public"."multi_agent_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."multi_agent_plans" TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_create_multi_agent_plan"("target_organization_id" "uuid", "plan_title" "text", "plan_objective" "text", "lead_agent_key" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_create_multi_agent_plan"("target_organization_id" "uuid", "plan_title" "text", "plan_objective" "text", "lead_agent_key" "text") TO "service_role";



GRANT ALL ON TABLE "public"."agent_runs" TO "anon";
GRANT ALL ON TABLE "public"."agent_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_runs" TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_list_agent_runs"("run_status" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_list_agent_runs"("run_status" "text") TO "service_role";



GRANT ALL ON TABLE "public"."ai_action_runs" TO "anon";
GRANT ALL ON TABLE "public"."ai_action_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_action_runs" TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_list_ai_action_runs"("run_status" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_list_ai_action_runs"("run_status" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_list_ai_recommendations"("rec_status" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_list_ai_recommendations"("rec_status" "text") TO "service_role";



GRANT ALL ON TABLE "public"."admin_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."admin_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_audit_log" TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_list_audit_log"("limit_count" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_list_audit_log"("limit_count" integer) TO "service_role";



GRANT ALL ON TABLE "public"."beta_signups" TO "anon";
GRANT ALL ON TABLE "public"."beta_signups" TO "authenticated";
GRANT ALL ON TABLE "public"."beta_signups" TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_list_beta_signups"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_list_beta_signups"() TO "service_role";



GRANT ALL ON TABLE "public"."compliance_findings" TO "anon";
GRANT ALL ON TABLE "public"."compliance_findings" TO "authenticated";
GRANT ALL ON TABLE "public"."compliance_findings" TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_list_compliance_findings"("finding_status" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_list_compliance_findings"("finding_status" "text") TO "service_role";



GRANT ALL ON TABLE "public"."compliance_tasks" TO "anon";
GRANT ALL ON TABLE "public"."compliance_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."compliance_tasks" TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_list_compliance_tasks"("task_status" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_list_compliance_tasks"("task_status" "text") TO "service_role";



GRANT ALL ON TABLE "public"."external_integrations" TO "anon";
GRANT ALL ON TABLE "public"."external_integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."external_integrations" TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_list_integrations"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_list_integrations"() TO "service_role";



GRANT ALL ON TABLE "public"."job_queue" TO "anon";
GRANT ALL ON TABLE "public"."job_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."job_queue" TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_list_jobs"("job_status" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_list_jobs"("job_status" "text") TO "service_role";



GRANT ALL ON TABLE "public"."law_change_impacts" TO "anon";
GRANT ALL ON TABLE "public"."law_change_impacts" TO "authenticated";
GRANT ALL ON TABLE "public"."law_change_impacts" TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_list_law_change_impacts"("impact_status" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_list_law_change_impacts"("impact_status" "text") TO "service_role";



GRANT ALL ON TABLE "public"."law_updates" TO "anon";
GRANT ALL ON TABLE "public"."law_updates" TO "authenticated";
GRANT ALL ON TABLE "public"."law_updates" TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_list_law_updates"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_list_law_updates"() TO "service_role";



GRANT ALL ON TABLE "public"."legal_ingestion_runs" TO "anon";
GRANT ALL ON TABLE "public"."legal_ingestion_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."legal_ingestion_runs" TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_list_legal_ingestion_runs"("run_status" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_list_legal_ingestion_runs"("run_status" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_list_organizations"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_list_organizations"() TO "service_role";



GRANT ALL ON TABLE "public"."policy_gap_analyses" TO "anon";
GRANT ALL ON TABLE "public"."policy_gap_analyses" TO "authenticated";
GRANT ALL ON TABLE "public"."policy_gap_analyses" TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_list_policy_gap_analyses"("analysis_status" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_list_policy_gap_analyses"("analysis_status" "text") TO "service_role";



GRANT ALL ON TABLE "public"."predictive_risk_forecasts" TO "anon";
GRANT ALL ON TABLE "public"."predictive_risk_forecasts" TO "authenticated";
GRANT ALL ON TABLE "public"."predictive_risk_forecasts" TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_list_risk_forecasts"("forecast_kind" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_list_risk_forecasts"("forecast_kind" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_list_users"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_list_users"() TO "service_role";



GRANT ALL ON TABLE "public"."workspace_intelligence_items" TO "anon";
GRANT ALL ON TABLE "public"."workspace_intelligence_items" TO "authenticated";
GRANT ALL ON TABLE "public"."workspace_intelligence_items" TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_list_workspace_intelligence"("item_status" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_list_workspace_intelligence"("item_status" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_reporting_overview"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_reporting_overview"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_runtime_overview"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_runtime_overview"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_update_beta_signup_status"("signup_id" "uuid", "new_status" "text", "notes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_update_beta_signup_status"("signup_id" "uuid", "new_status" "text", "notes" "text") TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_update_user_plan"("target_user_id" "uuid", "new_plan" "text", "new_subscription_status" "text", "new_billing_period" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_update_user_plan"("target_user_id" "uuid", "new_plan" "text", "new_subscription_status" "text", "new_billing_period" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_usage_summary"("days_back" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_usage_summary"("days_back" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."archive_old_document_versions"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."archive_old_document_versions"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."attachment_scan_status"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."attachment_scan_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_increment_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_increment_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_increment_version"() TO "service_role";



GRANT ALL ON TABLE "public"."organization_maturity_scores" TO "anon";
GRANT ALL ON TABLE "public"."organization_maturity_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_maturity_scores" TO "service_role";



REVOKE ALL ON FUNCTION "public"."calculate_basic_maturity_score"("target_organization_id" "uuid", "maturity_category" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."calculate_basic_maturity_score"("target_organization_id" "uuid", "maturity_category" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_basic_maturity_score"("target_organization_id" "uuid", "maturity_category" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."cancel_signature_for_owner"("p_signature_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cancel_signature_for_owner"("p_signature_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_signature_for_owner"("p_signature_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."check_and_increment_usage_counter"("p_user_id" "uuid", "p_period_start" "date", "p_action" "text", "p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_and_increment_usage_counter"("p_user_id" "uuid", "p_period_start" "date", "p_action" "text", "p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."claim_ai_usage"("p_user_id" "uuid", "p_operation" "text", "p_organization_id" "uuid", "p_provider" "text", "p_model" "text", "p_burst_window_seconds" integer, "p_burst_limit" integer, "p_daily_request_limit" integer, "p_daily_token_limit" bigint, "p_platform_daily_limit" integer, "p_metered_operations" "text"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."claim_ai_usage"("p_user_id" "uuid", "p_operation" "text", "p_organization_id" "uuid", "p_provider" "text", "p_model" "text", "p_burst_window_seconds" integer, "p_burst_limit" integer, "p_daily_request_limit" integer, "p_daily_token_limit" bigint, "p_platform_daily_limit" integer, "p_metered_operations" "text"[]) TO "service_role";



REVOKE ALL ON FUNCTION "public"."claim_export_slot"("p_user_id" "uuid", "p_surface" "text", "p_kind" "text", "p_title" "text", "p_sha256" "text", "p_content_chars" integer, "p_lang" "text", "p_burst_window_seconds" integer, "p_burst_limit" integer, "p_daily_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."claim_export_slot"("p_user_id" "uuid", "p_surface" "text", "p_kind" "text", "p_title" "text", "p_sha256" "text", "p_content_chars" integer, "p_lang" "text", "p_burst_window_seconds" integer, "p_burst_limit" integer, "p_daily_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."claim_next_job"("worker_id" "text", "allowed_job_types" "text"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."claim_next_job"("worker_id" "text", "allowed_job_types" "text"[]) TO "service_role";



REVOKE ALL ON FUNCTION "public"."cleanup_old_activity_logs"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cleanup_old_activity_logs"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."complete_job"("target_job_id" "uuid", "job_output" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."complete_job"("target_job_id" "uuid", "job_output" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_ai_recommendation"("target_organization_id" "uuid", "target_user_id" "uuid", "rec_type" "text", "rec_title" "text", "rec_rationale" "text", "rec_action" "jsonb", "rec_priority" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_ai_recommendation"("target_organization_id" "uuid", "target_user_id" "uuid", "rec_type" "text", "rec_title" "text", "rec_rationale" "text", "rec_action" "jsonb", "rec_priority" "text") TO "service_role";



GRANT ALL ON TABLE "public"."document_versions" TO "anon";
GRANT ALL ON TABLE "public"."document_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."document_versions" TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_document_version_snapshot"("target_document_id" "uuid", "summary" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_document_version_snapshot"("target_document_id" "uuid", "summary" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_document_version_snapshot"("target_document_id" "uuid", "summary" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_law_change_impact_task"("target_impact_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_law_change_impact_task"("target_impact_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_notification"("target_organization_id" "uuid", "target_user_id" "uuid", "kind" "text", "notification_title" "text", "notification_body" "text", "notification_severity" "text", "notification_action_url" "text", "notification_metadata" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_notification"("target_organization_id" "uuid", "target_user_id" "uuid", "kind" "text", "notification_title" "text", "notification_body" "text", "notification_severity" "text", "notification_action_url" "text", "notification_metadata" "jsonb") TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_organization"("org_name" "text", "org_legal_name" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_organization"("org_name" "text", "org_legal_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_organization"("org_name" "text", "org_legal_name" "text") TO "service_role";



GRANT ALL ON TABLE "public"."organization_risk_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."organization_risk_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_risk_snapshots" TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_organization_risk_snapshot"("target_organization_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_organization_risk_snapshot"("target_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_organization_risk_snapshot"("target_organization_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."queue_health_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."queue_health_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."queue_health_snapshots" TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_queue_health_snapshot"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_queue_health_snapshot"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_workspace_intelligence_item"("target_organization_id" "uuid", "intelligence_type" "text", "item_title" "text", "item_body" "text", "item_severity" "text", "related_table" "text", "related_id" "text", "generator" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_workspace_intelligence_item"("target_organization_id" "uuid", "intelligence_type" "text", "item_title" "text", "item_body" "text", "item_severity" "text", "related_table" "text", "related_id" "text", "generator" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."current_user_is_workspace_member"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."current_user_is_workspace_member"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_is_workspace_member"() TO "service_role";



GRANT ALL ON TABLE "public"."operational_bottlenecks" TO "anon";
GRANT ALL ON TABLE "public"."operational_bottlenecks" TO "authenticated";
GRANT ALL ON TABLE "public"."operational_bottlenecks" TO "service_role";



REVOKE ALL ON FUNCTION "public"."detect_basic_bottlenecks"("target_organization_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."detect_basic_bottlenecks"("target_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."detect_basic_bottlenecks"("target_organization_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."dismiss_ai_recommendation"("target_recommendation_id" "uuid", "reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."dismiss_ai_recommendation"("target_recommendation_id" "uuid", "reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."dismiss_ai_recommendation"("target_recommendation_id" "uuid", "reason" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."enqueue_job"("target_organization_id" "uuid", "target_job_type" "text", "job_payload" "jsonb", "job_priority" integer, "job_run_after" timestamp with time zone, "job_max_attempts" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."enqueue_job"("target_organization_id" "uuid", "target_job_type" "text", "job_payload" "jsonb", "job_priority" integer, "job_run_after" timestamp with time zone, "job_max_attempts" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."fail_job"("target_job_id" "uuid", "error_text" "text", "retry_delay_seconds" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fail_job"("target_job_id" "uuid", "error_text" "text", "retry_delay_seconds" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."flag_guidance_chunks_on_law_change"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."flag_guidance_chunks_on_law_change"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."generate_basic_risk_forecast"("target_organization_id" "uuid", "window_days" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."generate_basic_risk_forecast"("target_organization_id" "uuid", "window_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_basic_risk_forecast"("target_organization_id" "uuid", "window_days" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_admin_dashboard_counts"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_admin_dashboard_counts"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_advisor_context"("target_organization_id" "uuid", "limit_count" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_advisor_context"("target_organization_id" "uuid", "limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_advisor_context"("target_organization_id" "uuid", "limit_count" integer) TO "service_role";



GRANT ALL ON TABLE "public"."activity_events" TO "anon";
GRANT ALL ON TABLE "public"."activity_events" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_events" TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_entity_activity"("target_entity_table" "text", "target_entity_id" "text", "limit_count" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_entity_activity"("target_entity_table" "text", "target_entity_id" "text", "limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_entity_activity"("target_entity_table" "text", "target_entity_id" "text", "limit_count" integer) TO "service_role";



GRANT ALL ON TABLE "public"."entity_relationships" TO "anon";
GRANT ALL ON TABLE "public"."entity_relationships" TO "authenticated";
GRANT ALL ON TABLE "public"."entity_relationships" TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_entity_relationships"("target_entity_table" "text", "target_entity_id" "text", "limit_count" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_entity_relationships"("target_entity_table" "text", "target_entity_id" "text", "limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_entity_relationships"("target_entity_table" "text", "target_entity_id" "text", "limit_count" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_frontend_bootstrap"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_frontend_bootstrap"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_frontend_bootstrap"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_organization_dashboard"("target_organization_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_organization_dashboard"("target_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_organization_dashboard"("target_organization_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_signature_by_token"("p_token" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_signature_by_token"("p_token" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_signature_by_token"("p_token" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."increment_usage_counter"("p_user_id" "uuid", "p_period_start" "date", "p_action" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."increment_usage_counter"("p_user_id" "uuid", "p_period_start" "date", "p_action" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."ingest_client_error_report"("p_ip_hash" "text", "p_env" "text", "p_release" "text", "p_route" "text", "p_locale" "text", "p_kind" "text", "p_message" "text", "p_stack" "text", "p_user_agent" "text", "p_window_seconds" integer, "p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."ingest_client_error_report"("p_ip_hash" "text", "p_env" "text", "p_release" "text", "p_route" "text", "p_locale" "text", "p_kind" "text", "p_message" "text", "p_stack" "text", "p_user_agent" "text", "p_window_seconds" integer, "p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."ingest_support_analytics_events"("p_ip_hash" "text", "p_events" "jsonb", "p_window_seconds" integer, "p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."ingest_support_analytics_events"("p_ip_hash" "text", "p_events" "jsonb", "p_window_seconds" integer, "p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_admin"("check_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin"("check_user_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."is_admin"("check_user_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."is_admin_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_internal_admin_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_internal_admin_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_internal_admin_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_org_admin"("check_org_id" "uuid", "check_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_org_admin"("check_org_id" "uuid", "check_user_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."is_org_admin"("check_org_id" "uuid", "check_user_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."is_org_member"("check_org_id" "uuid", "check_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_org_member"("check_org_id" "uuid", "check_user_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."is_org_member"("check_org_id" "uuid", "check_user_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."is_super_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."law_monitor_status"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."law_monitor_status"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."law_update_digest_status"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."law_update_digest_status"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."link_entities"("target_organization_id" "uuid", "source_table_name" "text", "source_entity_id" "text", "target_table_name" "text", "target_entity_id" "text", "relation_kind" "text", "relation_confidence" numeric, "ai_generated" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."link_entities"("target_organization_id" "uuid", "source_table_name" "text", "source_entity_id" "text", "target_table_name" "text", "target_entity_id" "text", "relation_kind" "text", "relation_confidence" numeric, "ai_generated" boolean) TO "service_role";



REVOKE ALL ON FUNCTION "public"."mark_notification_read"("target_notification_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_notification_read"("target_notification_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_notification_read"("target_notification_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."match_advisor_guidance"("q" "text", "k" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."match_advisor_guidance"("q" "text", "k" integer) TO "service_role";






GRANT ALL ON FUNCTION "public"."normalize_document_jurisdiction_label"("p_code" "text", "p_fallback" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."normalize_document_jurisdiction_label"("p_code" "text", "p_fallback" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."normalize_document_jurisdiction_label"("p_code" "text", "p_fallback" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."pin_profile_billing_columns"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."pin_profile_billing_columns"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."process_expired_data_deletions"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."process_expired_data_deletions"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."purge_ai_telemetry_data"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."purge_ai_telemetry_data"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."purge_client_error_data"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."purge_client_error_data"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."purge_support_analytics_rate_limit"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."purge_support_analytics_rate_limit"() TO "service_role";



GRANT ALL ON TABLE "public"."notification_deliveries" TO "anon";
GRANT ALL ON TABLE "public"."notification_deliveries" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_deliveries" TO "service_role";



REVOKE ALL ON FUNCTION "public"."queue_notification_delivery"("target_notification_id" "uuid", "delivery_provider" "text", "delivery_recipient" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."queue_notification_delivery"("target_notification_id" "uuid", "delivery_provider" "text", "delivery_recipient" "text") TO "service_role";



GRANT ALL ON TABLE "public"."advisor_memories" TO "anon";
GRANT ALL ON TABLE "public"."advisor_memories" TO "authenticated";
GRANT ALL ON TABLE "public"."advisor_memories" TO "service_role";



REVOKE ALL ON FUNCTION "public"."record_advisor_memory"("target_organization_id" "uuid", "target_user_id" "uuid", "memory_kind" "text", "memory_title" "text", "memory_content" "text", "memory_importance" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."record_advisor_memory"("target_organization_id" "uuid", "target_user_id" "uuid", "memory_kind" "text", "memory_title" "text", "memory_content" "text", "memory_importance" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_advisor_memory"("target_organization_id" "uuid", "target_user_id" "uuid", "memory_kind" "text", "memory_title" "text", "memory_content" "text", "memory_importance" integer) TO "service_role";



GRANT ALL ON TABLE "public"."ai_telemetry_events" TO "anon";
GRANT ALL ON TABLE "public"."ai_telemetry_events" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_telemetry_events" TO "service_role";



REVOKE ALL ON FUNCTION "public"."record_ai_telemetry"("target_organization_id" "uuid", "target_user_id" "uuid", "provider_name" "text", "model_name" "text", "operation_name" "text", "total_token_count" integer, "latency_value_ms" integer, "telemetry_status" "text", "telemetry_metadata" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."record_ai_telemetry"("target_organization_id" "uuid", "target_user_id" "uuid", "provider_name" "text", "model_name" "text", "operation_name" "text", "total_token_count" integer, "latency_value_ms" integer, "telemetry_status" "text", "telemetry_metadata" "jsonb") TO "service_role";



GRANT ALL ON TABLE "public"."billing_events" TO "anon";
GRANT ALL ON TABLE "public"."billing_events" TO "authenticated";
GRANT ALL ON TABLE "public"."billing_events" TO "service_role";



REVOKE ALL ON FUNCTION "public"."record_billing_event"("target_organization_id" "uuid", "target_user_id" "uuid", "billing_provider" "text", "billing_event_type" "text", "billing_plan" "text", "billing_subscription_status" "text", "billing_period_value" "text", "billing_payload" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."record_billing_event"("target_organization_id" "uuid", "target_user_id" "uuid", "billing_provider" "text", "billing_event_type" "text", "billing_plan" "text", "billing_subscription_status" "text", "billing_period_value" "text", "billing_payload" "jsonb") TO "service_role";



GRANT ALL ON TABLE "public"."execution_traces" TO "anon";
GRANT ALL ON TABLE "public"."execution_traces" TO "authenticated";
GRANT ALL ON TABLE "public"."execution_traces" TO "service_role";



REVOKE ALL ON FUNCTION "public"."record_execution_trace"("target_organization_id" "uuid", "trace_kind" "text", "trace_status" "text", "trace_key_value" "text", "entity_table_value" "text", "entity_id_value" "text", "trace_metadata" "jsonb", "trace_error" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."record_execution_trace"("target_organization_id" "uuid", "trace_kind" "text", "trace_status" "text", "trace_key_value" "text", "entity_table_value" "text", "entity_id_value" "text", "trace_metadata" "jsonb", "trace_error" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."record_signature_link_created"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."record_signature_link_created"() TO "service_role";



GRANT ALL ON TABLE "public"."system_events" TO "anon";
GRANT ALL ON TABLE "public"."system_events" TO "authenticated";
GRANT ALL ON TABLE "public"."system_events" TO "service_role";



REVOKE ALL ON FUNCTION "public"."record_system_event"("target_organization_id" "uuid", "event_kind" "text", "source_table" "text", "source_id" "text", "event_payload" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."record_system_event"("target_organization_id" "uuid", "event_kind" "text", "source_table" "text", "source_id" "text", "event_payload" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."release_cron_lock"("p_job_name" "text", "p_instance_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."release_cron_lock"("p_job_name" "text", "p_instance_id" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."rls_grant_gaps"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."rls_grant_gaps"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."score_snapshot_status"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."score_snapshot_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_support_ticket_reference"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_support_ticket_reference"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_support_ticket_reference"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."playbook_runs" TO "anon";
GRANT ALL ON TABLE "public"."playbook_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."playbook_runs" TO "service_role";



REVOKE ALL ON FUNCTION "public"."start_playbook_run"("target_organization_id" "uuid", "target_playbook_key" "text", "run_input" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."start_playbook_run"("target_organization_id" "uuid", "target_playbook_key" "text", "run_input" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."submit_signature_by_token"("p_token" "uuid", "p_signature_data" "text", "p_signature_type" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."submit_signature_by_token"("p_token" "uuid", "p_signature_data" "text", "p_signature_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_signature_by_token"("p_token" "uuid", "p_signature_data" "text", "p_signature_type" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."support_analytics_rollup"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."support_analytics_rollup"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."support_analytics_status"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."support_analytics_status"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."support_call_scheduler_status"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."support_call_scheduler_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_document_jurisdiction_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_document_jurisdiction_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_document_jurisdiction_fields"() TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_advisor_guidance_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_advisor_guidance_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_advisor_guidance_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_employer_profiles_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_employer_profiles_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_employer_profiles_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_offer_workflow_states_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_offer_workflow_states_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_offer_workflow_states_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_support_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_support_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_support_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



REVOKE ALL ON FUNCTION "public"."transition_document_status"("target_document_id" "uuid", "new_status" "text", "note" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."transition_document_status"("target_document_id" "uuid", "new_status" "text", "note" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."transition_document_status"("target_document_id" "uuid", "new_status" "text", "note" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."trigger_attachment_scan"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."trigger_attachment_scan"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."trigger_law_monitor"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."trigger_law_monitor"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."trigger_law_update_digest"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."trigger_law_update_digest"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."trigger_score_snapshots"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."trigger_score_snapshots"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."trigger_support_call_scheduler"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."trigger_support_call_scheduler"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";













































GRANT ALL ON TABLE "public"."admin_activity_log" TO "anon";
GRANT ALL ON TABLE "public"."admin_activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_activity_log" TO "service_role";



GRANT ALL ON TABLE "public"."admin_analytics_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."admin_analytics_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_analytics_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."admin_app_error_events" TO "anon";
GRANT ALL ON TABLE "public"."admin_app_error_events" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_app_error_events" TO "service_role";



GRANT ALL ON TABLE "public"."admin_beta_access" TO "anon";
GRANT ALL ON TABLE "public"."admin_beta_access" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_beta_access" TO "service_role";



GRANT ALL ON TABLE "public"."admin_beta_feedback_events" TO "anon";
GRANT ALL ON TABLE "public"."admin_beta_feedback_events" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_beta_feedback_events" TO "service_role";



GRANT ALL ON TABLE "public"."admin_feature_flags" TO "anon";
GRANT ALL ON TABLE "public"."admin_feature_flags" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_feature_flags" TO "service_role";



GRANT ALL ON TABLE "public"."admin_plan_overrides" TO "anon";
GRANT ALL ON TABLE "public"."admin_plan_overrides" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_plan_overrides" TO "service_role";



GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."advisor_guidance_chunks" TO "anon";
GRANT ALL ON TABLE "public"."advisor_guidance_chunks" TO "authenticated";
GRANT ALL ON TABLE "public"."advisor_guidance_chunks" TO "service_role";



GRANT ALL ON TABLE "public"."ai_agents" TO "anon";
GRANT ALL ON TABLE "public"."ai_agents" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_agents" TO "service_role";



GRANT ALL ON TABLE "public"."ai_drafting_sessions" TO "anon";
GRANT ALL ON TABLE "public"."ai_drafting_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_drafting_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."ai_model_providers" TO "anon";
GRANT ALL ON TABLE "public"."ai_model_providers" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_model_providers" TO "service_role";



GRANT ALL ON TABLE "public"."ai_model_routes" TO "anon";
GRANT ALL ON TABLE "public"."ai_model_routes" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_model_routes" TO "service_role";



GRANT ALL ON TABLE "public"."benchmark_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."benchmark_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."benchmark_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."beta_signup_intake" TO "anon";
GRANT ALL ON TABLE "public"."beta_signup_intake" TO "authenticated";
GRANT ALL ON TABLE "public"."beta_signup_intake" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."client_error_rate_limit" TO "anon";
GRANT ALL ON TABLE "public"."client_error_rate_limit" TO "authenticated";
GRANT ALL ON TABLE "public"."client_error_rate_limit" TO "service_role";



GRANT ALL ON TABLE "public"."client_error_reports" TO "anon";
GRANT ALL ON TABLE "public"."client_error_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."client_error_reports" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."comment_mentions" TO "anon";
GRANT ALL ON TABLE "public"."comment_mentions" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_mentions" TO "service_role";



GRANT ALL ON TABLE "public"."compliance_assessments" TO "anon";
GRANT ALL ON TABLE "public"."compliance_assessments" TO "authenticated";
GRANT ALL ON TABLE "public"."compliance_assessments" TO "service_role";



GRANT ALL ON TABLE "public"."compliance_score_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."compliance_score_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."compliance_score_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."cron_locks" TO "service_role";



GRANT ALL ON TABLE "public"."devops_runbooks" TO "anon";
GRANT ALL ON TABLE "public"."devops_runbooks" TO "authenticated";
GRANT ALL ON TABLE "public"."devops_runbooks" TO "service_role";



GRANT ALL ON TABLE "public"."document_generation_runs" TO "anon";
GRANT ALL ON TABLE "public"."document_generation_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."document_generation_runs" TO "service_role";



GRANT ALL ON TABLE "public"."document_reviews" TO "anon";
GRANT ALL ON TABLE "public"."document_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."document_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";
GRANT ALL ON TABLE "public"."employees" TO "service_role";



GRANT ALL ON TABLE "public"."employer_profiles" TO "anon";
GRANT ALL ON TABLE "public"."employer_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."employer_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."employer_tiers" TO "anon";
GRANT ALL ON TABLE "public"."employer_tiers" TO "authenticated";
GRANT ALL ON TABLE "public"."employer_tiers" TO "service_role";



GRANT ALL ON TABLE "public"."export_events" TO "service_role";



GRANT ALL ON TABLE "public"."frontend_feature_flags" TO "anon";
GRANT ALL ON TABLE "public"."frontend_feature_flags" TO "authenticated";
GRANT ALL ON TABLE "public"."frontend_feature_flags" TO "service_role";



GRANT ALL ON TABLE "public"."generator_document_templates" TO "anon";
GRANT ALL ON TABLE "public"."generator_document_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."generator_document_templates" TO "service_role";



GRANT ALL ON TABLE "public"."generator_templates" TO "anon";
GRANT ALL ON TABLE "public"."generator_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."generator_templates" TO "service_role";



GRANT ALL ON TABLE "public"."guidance_chunks" TO "anon";
GRANT ALL ON TABLE "public"."guidance_chunks" TO "authenticated";
GRANT ALL ON TABLE "public"."guidance_chunks" TO "service_role";



GRANT ALL ON TABLE "public"."guidance_sources" TO "anon";
GRANT ALL ON TABLE "public"."guidance_sources" TO "authenticated";
GRANT ALL ON TABLE "public"."guidance_sources" TO "service_role";



GRANT ALL ON TABLE "public"."hr_case_notes" TO "anon";
GRANT ALL ON TABLE "public"."hr_case_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."hr_case_notes" TO "service_role";



GRANT ALL ON TABLE "public"."hr_cases" TO "anon";
GRANT ALL ON TABLE "public"."hr_cases" TO "authenticated";
GRANT ALL ON TABLE "public"."hr_cases" TO "service_role";



GRANT ALL ON TABLE "public"."hr_communications" TO "anon";
GRANT ALL ON TABLE "public"."hr_communications" TO "authenticated";
GRANT ALL ON TABLE "public"."hr_communications" TO "service_role";



GRANT ALL ON TABLE "public"."hr_compensation_records" TO "anon";
GRANT ALL ON TABLE "public"."hr_compensation_records" TO "authenticated";
GRANT ALL ON TABLE "public"."hr_compensation_records" TO "service_role";



GRANT ALL ON TABLE "public"."hr_documents" TO "anon";
GRANT ALL ON TABLE "public"."hr_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."hr_documents" TO "service_role";



GRANT ALL ON TABLE "public"."hr_employee_notes" TO "anon";
GRANT ALL ON TABLE "public"."hr_employee_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."hr_employee_notes" TO "service_role";



GRANT ALL ON TABLE "public"."hr_expiry_records" TO "anon";
GRANT ALL ON TABLE "public"."hr_expiry_records" TO "authenticated";
GRANT ALL ON TABLE "public"."hr_expiry_records" TO "service_role";



GRANT ALL ON TABLE "public"."hr_leaves" TO "anon";
GRANT ALL ON TABLE "public"."hr_leaves" TO "authenticated";
GRANT ALL ON TABLE "public"."hr_leaves" TO "service_role";



GRANT ALL ON TABLE "public"."hr_obligations" TO "anon";
GRANT ALL ON TABLE "public"."hr_obligations" TO "authenticated";
GRANT ALL ON TABLE "public"."hr_obligations" TO "service_role";



GRANT ALL ON TABLE "public"."hr_policies" TO "anon";
GRANT ALL ON TABLE "public"."hr_policies" TO "authenticated";
GRANT ALL ON TABLE "public"."hr_policies" TO "service_role";



GRANT ALL ON TABLE "public"."hr_wellbeing_initiatives" TO "anon";
GRANT ALL ON TABLE "public"."hr_wellbeing_initiatives" TO "authenticated";
GRANT ALL ON TABLE "public"."hr_wellbeing_initiatives" TO "service_role";



GRANT ALL ON TABLE "public"."job_attempts" TO "anon";
GRANT ALL ON TABLE "public"."job_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."job_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."jurisdiction_comparisons" TO "anon";
GRANT ALL ON TABLE "public"."jurisdiction_comparisons" TO "authenticated";
GRANT ALL ON TABLE "public"."jurisdiction_comparisons" TO "service_role";



GRANT ALL ON TABLE "public"."jurisdictions" TO "anon";
GRANT ALL ON TABLE "public"."jurisdictions" TO "authenticated";
GRANT ALL ON TABLE "public"."jurisdictions" TO "service_role";



GRANT ALL ON TABLE "public"."law_page_hashes" TO "anon";
GRANT ALL ON TABLE "public"."law_page_hashes" TO "authenticated";
GRANT ALL ON TABLE "public"."law_page_hashes" TO "service_role";



GRANT ALL ON TABLE "public"."law_update_notifications" TO "anon";
GRANT ALL ON TABLE "public"."law_update_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."law_update_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."legal_ingestion_sources" TO "anon";
GRANT ALL ON TABLE "public"."legal_ingestion_sources" TO "authenticated";
GRANT ALL ON TABLE "public"."legal_ingestion_sources" TO "service_role";



GRANT ALL ON TABLE "public"."offer_workflow_states" TO "anon";
GRANT ALL ON TABLE "public"."offer_workflow_states" TO "authenticated";
GRANT ALL ON TABLE "public"."offer_workflow_states" TO "service_role";



GRANT ALL ON TABLE "public"."organization_invitations" TO "anon";
GRANT ALL ON TABLE "public"."organization_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."organization_members" TO "anon";
GRANT ALL ON TABLE "public"."organization_members" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_members" TO "service_role";



GRANT ALL ON TABLE "public"."scheduled_operations" TO "anon";
GRANT ALL ON TABLE "public"."scheduled_operations" TO "authenticated";
GRANT ALL ON TABLE "public"."scheduled_operations" TO "service_role";



GRANT ALL ON TABLE "public"."service_status" TO "anon";
GRANT ALL ON TABLE "public"."service_status" TO "authenticated";
GRANT ALL ON TABLE "public"."service_status" TO "service_role";



GRANT ALL ON TABLE "public"."signature_audit_events" TO "anon";
GRANT ALL ON TABLE "public"."signature_audit_events" TO "authenticated";
GRANT ALL ON TABLE "public"."signature_audit_events" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."signatures" TO "anon";
GRANT ALL ON TABLE "public"."signatures" TO "authenticated";
GRANT ALL ON TABLE "public"."signatures" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_webhook_events" TO "anon";
GRANT ALL ON TABLE "public"."stripe_webhook_events" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_webhook_events" TO "service_role";



GRANT ALL ON TABLE "public"."subfolders" TO "anon";
GRANT ALL ON TABLE "public"."subfolders" TO "authenticated";
GRANT ALL ON TABLE "public"."subfolders" TO "service_role";



GRANT ALL ON TABLE "public"."support_analytics_daily" TO "anon";
GRANT ALL ON TABLE "public"."support_analytics_daily" TO "authenticated";
GRANT ALL ON TABLE "public"."support_analytics_daily" TO "service_role";



GRANT ALL ON TABLE "public"."support_analytics_events" TO "anon";
GRANT ALL ON TABLE "public"."support_analytics_events" TO "authenticated";
GRANT ALL ON TABLE "public"."support_analytics_events" TO "service_role";



GRANT ALL ON TABLE "public"."support_analytics_rate_limit" TO "anon";
GRANT ALL ON TABLE "public"."support_analytics_rate_limit" TO "authenticated";
GRANT ALL ON TABLE "public"."support_analytics_rate_limit" TO "service_role";



GRANT ALL ON TABLE "public"."support_attachments" TO "anon";
GRANT ALL ON TABLE "public"."support_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."support_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."support_messages" TO "anon";
GRANT ALL ON TABLE "public"."support_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."support_messages" TO "service_role";



GRANT ALL ON TABLE "public"."support_notifications" TO "anon";
GRANT ALL ON TABLE "public"."support_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."support_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."support_public_intake" TO "anon";
GRANT ALL ON TABLE "public"."support_public_intake" TO "authenticated";
GRANT ALL ON TABLE "public"."support_public_intake" TO "service_role";



GRANT ALL ON TABLE "public"."support_scheduled_calls" TO "anon";
GRANT ALL ON TABLE "public"."support_scheduled_calls" TO "authenticated";
GRANT ALL ON TABLE "public"."support_scheduled_calls" TO "service_role";



GRANT ALL ON TABLE "public"."support_ticket_assignments" TO "anon";
GRANT ALL ON TABLE "public"."support_ticket_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."support_ticket_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."support_ticket_events" TO "anon";
GRANT ALL ON TABLE "public"."support_ticket_events" TO "authenticated";
GRANT ALL ON TABLE "public"."support_ticket_events" TO "service_role";



GRANT ALL ON TABLE "public"."support_ticket_feedback" TO "anon";
GRANT ALL ON TABLE "public"."support_ticket_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."support_ticket_feedback" TO "service_role";



GRANT ALL ON SEQUENCE "public"."support_ticket_ref_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."support_ticket_ref_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."support_ticket_ref_seq" TO "service_role";



GRANT ALL ON TABLE "public"."support_tickets" TO "anon";
GRANT ALL ON TABLE "public"."support_tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."support_tickets" TO "service_role";



GRANT ALL ON TABLE "public"."template_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."template_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."template_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."template_content_variants" TO "anon";
GRANT ALL ON TABLE "public"."template_content_variants" TO "authenticated";
GRANT ALL ON TABLE "public"."template_content_variants" TO "service_role";



GRANT ALL ON TABLE "public"."template_documents" TO "anon";
GRANT ALL ON TABLE "public"."template_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."template_documents" TO "service_role";



GRANT ALL ON TABLE "public"."template_fields" TO "anon";
GRANT ALL ON TABLE "public"."template_fields" TO "authenticated";
GRANT ALL ON TABLE "public"."template_fields" TO "service_role";



GRANT ALL ON TABLE "public"."template_versions" TO "anon";
GRANT ALL ON TABLE "public"."template_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."template_versions" TO "service_role";



GRANT ALL ON TABLE "public"."templates" TO "anon";
GRANT ALL ON TABLE "public"."templates" TO "authenticated";
GRANT ALL ON TABLE "public"."templates" TO "service_role";



GRANT ALL ON TABLE "public"."tier_categories" TO "anon";
GRANT ALL ON TABLE "public"."tier_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."tier_categories" TO "service_role";



GRANT ALL ON TABLE "public"."usage_counters" TO "anon";
GRANT ALL ON TABLE "public"."usage_counters" TO "authenticated";
GRANT ALL ON TABLE "public"."usage_counters" TO "service_role";



GRANT ALL ON TABLE "public"."usage_events" TO "anon";
GRANT ALL ON TABLE "public"."usage_events" TO "authenticated";
GRANT ALL ON TABLE "public"."usage_events" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."v_navigation_tree" TO "anon";
GRANT ALL ON TABLE "public"."v_navigation_tree" TO "authenticated";
GRANT ALL ON TABLE "public"."v_navigation_tree" TO "service_role";



GRANT ALL ON TABLE "public"."v_template_catalog" TO "anon";
GRANT ALL ON TABLE "public"."v_template_catalog" TO "authenticated";
GRANT ALL ON TABLE "public"."v_template_catalog" TO "service_role";



GRANT ALL ON TABLE "public"."v_tier_stats" TO "anon";
GRANT ALL ON TABLE "public"."v_tier_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."v_tier_stats" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_events" TO "anon";
GRANT ALL ON TABLE "public"."webhook_events" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_events" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_automation_runs" TO "anon";
GRANT ALL ON TABLE "public"."workflow_automation_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_automation_runs" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_metrics_daily" TO "anon";
GRANT ALL ON TABLE "public"."workflow_metrics_daily" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_metrics_daily" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_playbooks" TO "anon";
GRANT ALL ON TABLE "public"."workflow_playbooks" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_playbooks" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_questions" TO "anon";
GRANT ALL ON TABLE "public"."workflow_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_questions" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_responses" TO "anon";
GRANT ALL ON TABLE "public"."workflow_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_responses" TO "service_role";



GRANT ALL ON TABLE "public"."workflows" TO "anon";
GRANT ALL ON TABLE "public"."workflows" TO "authenticated";
GRANT ALL ON TABLE "public"."workflows" TO "service_role";



GRANT ALL ON TABLE "public"."workspace_notes" TO "anon";
GRANT ALL ON TABLE "public"."workspace_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."workspace_notes" TO "service_role";



GRANT ALL ON TABLE "public"."workspace_preferences" TO "anon";
GRANT ALL ON TABLE "public"."workspace_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."workspace_preferences" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































