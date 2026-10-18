/* 0244_scoped_consultant_access.sql
   Turns the consultant seat into a real, enforced access tier.

   0125 added role='consultant'/'viewer' plus the granted_modules and
   access_expires_at columns, and 0129 added the specialists directory that
   records them — but nothing enforced either: is_org_member accepted any
   active row forever, and no query ever read granted_modules. This migration
   closes that gap:

   1. is_org_member / is_org_admin now honour access_expires_at — a member
      whose access window has passed is not a member for RLS purposes.
   2. org_member_has_module(org, user, module) — the scoping predicate.
      Platform admins and non-scoped roles (owner/admin/manager/professional/
      member) pass unconditionally; 'consultant' and 'viewer' rows pass a
      module only when their granted_modules is empty (unscoped — the
      backward-compatible default) or names that module.
   3. A RESTRICTIVE policy per module table. Restrictive policies AND with
      the existing permissive member/admin policies, so one policy per table
      trims scoped members without rewriting any existing grants. Org
      primitives — memberships, invitations, billing/usage, notifications,
      activity/system events, comments, integrations, entity links,
      workspace_notes — are deliberately NOT module-scoped: they are the
      plumbing a member needs to resolve identity and receive ambient
      events, and none carry a module attribute to scope on. Ambient feeds
      (notifications, activity_events) may still name entities from modules
      a scoped member cannot open — the row link is visible, the module
      data behind it is not.
   4. organization_invitations gains granted_modules / access_expires_at so
      a consultant's scope is fixed at invite time — no window between
      claiming the invite and an admin narrowing it.
   5. claim_org_invitations copies the scope onto the membership and
      back-links any specialists directory row recorded for the invitee's
      mailbox (specialists.organization_member_id, workspace_access=true).
   6. workspace_preferences.active_organization_id — the server-side home
      for the active org of a user holding memberships in more than one
      organization (the consultant serving several client orgs).
   7. current_user_is_workspace_member's org-member clause honours expiry,
      matching is_org_member. */

-- ── 1. Expiry-aware membership predicates ────────────────────────────────

create or replace function public.is_org_member(check_org_id uuid, check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.is_admin(check_user_id) or exists (
    select 1 from public.organization_members om
    where om.organization_id = check_org_id
      and om.user_id = check_user_id
      and om.status = 'active'
      and (om.access_expires_at is null or om.access_expires_at > now())
  );
$$;

create or replace function public.is_org_admin(check_org_id uuid, check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.is_admin(check_user_id) or exists (
    select 1 from public.organization_members om
    where om.organization_id = check_org_id
      and om.user_id = check_user_id
      and om.status = 'active'
      and om.role in ('owner','admin')
      and (om.access_expires_at is null or om.access_expires_at > now())
  );
$$;

-- ── 2. Module-scope predicate ────────────────────────────────────────────

create or replace function public.org_member_has_module(
  check_org_id uuid,
  check_user_id uuid,
  check_module text
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.is_admin(check_user_id) or exists (
    select 1 from public.organization_members om
    where om.organization_id = check_org_id
      and om.user_id = check_user_id
      and om.status = 'active'
      and (om.access_expires_at is null or om.access_expires_at > now())
      and (
        om.role not in ('consultant', 'viewer')
        or om.granted_modules is null
        or cardinality(om.granted_modules) = 0
        or check_module = any (om.granted_modules)
      )
  );
$$;

revoke all on function public.org_member_has_module(uuid, uuid, text) from public, anon;
grant execute on function public.org_member_has_module(uuid, uuid, text) to authenticated;

-- ── 3. Module-scope restrictive policies ─────────────────────────────────
-- One RESTRICTIVE policy per module table; the mapping is the canonical
-- table→module assignment mirrored by WORKSPACE_MODULE_KEYS on the client.

do $$
declare
  scope record;
begin
  for scope in
    select * from (values
        -- advisor
        ('advisor_memories', 'advisor'),
        ('agent_audit', 'advisor'),
        ('agent_runs', 'advisor'),
        ('ai_action_runs', 'advisor'),
        ('ai_recommendations', 'advisor'),
        ('conversations', 'advisor'),
        ('execution_traces', 'advisor'),
        ('hr_advisor_memory_audit', 'advisor'),
        ('hr_advisor_memory_facts', 'advisor'),
        ('multi_agent_plans', 'advisor'),
        ('playbook_runs', 'advisor'),
        -- analytics
        ('benchmark_snapshots', 'analytics'),
        ('operational_bottlenecks', 'analytics'),
        ('organization_maturity_scores', 'analytics'),
        ('organization_risk_snapshots', 'analytics'),
        ('predictive_risk_forecasts', 'analytics'),
        ('workflow_metrics_daily', 'analytics'),
        ('workspace_intelligence_items', 'analytics'),
        -- cases
        ('hr_advisor_case_narratives', 'cases'),
        ('hr_advisor_case_timeline_events', 'cases'),
        ('hr_case_notes', 'cases'),
        ('hr_cases', 'cases'),
        -- comms
        ('comms_approvals', 'comms'),
        ('comms_brand_claims', 'comms'),
        ('comms_contact_segment_memberships', 'comms'),
        ('comms_contact_segments', 'comms'),
        ('comms_contacts', 'comms'),
        ('comms_content_items', 'comms'),
        ('comms_coverage_items', 'comms'),
        ('comms_execution_events', 'comms'),
        ('comms_feeds', 'comms'),
        ('comms_initiatives', 'comms'),
        ('comms_integrations', 'comms'),
        ('comms_interactions', 'comms'),
        ('comms_issues', 'comms'),
        ('comms_metrics', 'comms'),
        ('comms_objectives', 'comms'),
        ('comms_organizations', 'comms'),
        ('comms_policy_files', 'comms'),
        ('comms_sources', 'comms'),
        ('comms_submissions', 'comms'),
        ('comms_usage_controls', 'comms'),
        -- communications
        ('hr_communications', 'communications'),
        -- compensation
        ('hr_compensation_records', 'compensation'),
        -- compliance
        ('compliance_assessments', 'compliance'),
        ('compliance_findings', 'compliance'),
        ('compliance_score_snapshots', 'compliance'),
        ('compliance_tasks', 'compliance'),
        ('hr_obligations', 'compliance'),
        ('law_change_impacts', 'compliance'),
        ('policy_gap_analyses', 'compliance'),
        -- documents
        ('ai_drafting_sessions', 'documents'),
        ('document_annotations', 'documents'),
        ('document_generation_runs', 'documents'),
        ('document_reviews', 'documents'),
        ('document_versions', 'documents'),
        ('documents', 'documents'),
        ('hr_document_audit_events', 'documents'),
        ('hr_document_exports', 'documents'),
        ('hr_document_recipients', 'documents'),
        ('hr_document_signatures', 'documents'),
        ('hr_document_versions', 'documents'),
        ('hr_generated_documents', 'documents'),
        -- employees
        ('employees', 'employees'),
        ('hr_employee_notes', 'employees'),
        ('hr_expiry_records', 'employees'),
        ('hr_leaves', 'employees'),
        ('hr_onboarding_tasks', 'employees'),
        ('hr_performance_reviews', 'employees'),
        -- finance
        ('finance_approvals', 'finance'),
        ('finance_audit_events', 'finance'),
        ('finance_bank_accounts', 'finance'),
        ('finance_bank_items', 'finance'),
        ('finance_bills', 'finance'),
        ('finance_books', 'finance'),
        ('finance_budgets', 'finance'),
        ('finance_capital_calls', 'finance'),
        ('finance_cash_sweeps', 'finance'),
        ('finance_categorization_feedback', 'finance'),
        ('finance_category_rules', 'finance'),
        ('finance_close_periods', 'finance'),
        ('finance_commitments', 'finance'),
        ('finance_credits', 'finance'),
        ('finance_deals', 'finance'),
        ('finance_debts', 'finance'),
        ('finance_decision_entries', 'finance'),
        ('finance_document_links', 'finance'),
        ('finance_entities', 'finance'),
        ('finance_expenses', 'finance'),
        ('finance_external_actions', 'finance'),
        ('finance_fiscal_periods', 'finance'),
        ('finance_forecasts', 'finance'),
        ('finance_holdings', 'finance'),
        ('finance_import_sessions', 'finance'),
        ('finance_invoices', 'finance'),
        ('finance_journals', 'finance'),
        ('finance_ledger_accounts', 'finance'),
        ('finance_parties', 'finance'),
        ('finance_pay_periods', 'finance'),
        ('finance_pay_runs', 'finance'),
        ('finance_payroll_liabilities', 'finance'),
        ('finance_purchase_orders', 'finance'),
        ('finance_receipts', 'finance'),
        ('finance_reconciliations', 'finance'),
        ('finance_reserve_goals', 'finance'),
        ('finance_scenarios', 'finance'),
        ('finance_spend_requests', 'finance'),
        ('finance_subscriptions', 'finance'),
        ('finance_tax_obligations', 'finance'),
        ('finance_tax_scenarios', 'finance'),
        ('finance_watchlist_items', 'finance'),
        ('finance_workspace_settings', 'finance'),
        -- governance
        ('governance_decisions', 'governance'),
        ('governance_officers', 'governance'),
        ('governance_records', 'governance'),
        ('governance_shareholders', 'governance'),
        -- hiring
        ('hr_candidates', 'hiring'),
        ('hr_job_postings', 'hiring'),
        -- knowledge
        ('guidance_chunks', 'knowledge'),
        -- operations
        ('operations_logistics', 'operations'),
        ('operations_projects', 'operations'),
        ('operations_quality_checks', 'operations'),
        ('operations_technology', 'operations'),
        ('operations_vendors', 'operations'),
        -- policies
        ('hr_policies', 'policies'),
        -- revenue
        ('revenue_invoices', 'revenue'),
        ('revenue_streams', 'revenue'),
        -- security
        ('security_access_reviews', 'security'),
        ('security_assets', 'security'),
        ('security_incidents', 'security'),
        ('security_risks', 'security'),
        ('security_vendor_reviews', 'security'),
        -- specialists
        ('specialist_engagements', 'specialists'),
        ('specialists', 'specialists'),
        -- wellbeing
        ('hr_wellbeing_initiatives', 'wellbeing'),
        -- workflows
        ('workflow_automation_runs', 'workflows')
    ) as v(table_name, module_key)
  loop
    execute format('drop policy if exists member_module_scope on public.%I', scope.table_name);
    execute format(
      'create policy member_module_scope on public.%I as restrictive for all to authenticated ' ||
      'using (public.org_member_has_module(organization_id, (select auth.uid()), %L)) ' ||
      'with check (public.org_member_has_module(organization_id, (select auth.uid()), %L))',
      scope.table_name, scope.module_key, scope.module_key
    );
  end loop;
end
$$;

-- ── 4. Invitations carry the scope ───────────────────────────────────────

alter table public.organization_invitations
  add column if not exists granted_modules text[] not null default '{}';

alter table public.organization_invitations
  add column if not exists access_expires_at timestamptz;

-- ── 5. Claim copies scope + links the specialists directory row ──────────

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
     become active memberships carrying the invited scope (skipped when a
     membership already exists). */
  with due as (
    select id, organization_id, role, granted_modules, access_expires_at
    from public.organization_invitations
    where status = 'pending'
      and expires_at > now()
      and lower(email) = v_email
  ), inserted as (
    insert into public.organization_members
      (organization_id, user_id, role, status, granted_modules, access_expires_at)
    select
      d.organization_id, v_uid, d.role, 'active',
      d.granted_modules, d.access_expires_at
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

  /* Specialists directory back-link: a specialist row recorded for this
     mailbox in an org the caller just joined gains its membership link and
     flips workspace_access true — the directory stays truthful without an
     admin revisiting it. */
  update public.specialists s
  set organization_member_id = om.id,
      workspace_access = true,
      updated_at = now()
  from public.organization_members om
  where om.user_id = v_uid
    and om.status = 'active'
    and s.organization_id = om.organization_id
    and s.organization_member_id is null
    and lower(coalesce(s.email, '')) = v_email;

  return v_count;
end;
$$;

revoke all on function public.claim_org_invitations() from public;
grant execute on function public.claim_org_invitations() to authenticated;

-- ── 6. Active-organization preference (multi-org memberships) ────────────

alter table public.workspace_preferences
  add column if not exists active_organization_id uuid;

-- ── 7. Workspace admission honours expiry ────────────────────────────────

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
      or exists (
        select 1 from public.organization_members
        where user_id = auth.uid()
          and status = 'active'
          and (access_expires_at is null or access_expires_at > now())
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
