-- Advisor phase 3: remaining FK indexes, signing initplan, permissive-policy cleanup.

-- Remaining unindexed foreign keys (organization_id and second-column FK pass).
create index if not exists activity_events_organization_id_fkey_idx on public.activity_events (organization_id);
create index if not exists admin_app_error_events_user_id_fkey_idx on public.admin_app_error_events (user_id);
create index if not exists admin_audit_log_actor_user_id_fkey_idx on public.admin_audit_log (actor_user_id);
create index if not exists admin_beta_feedback_events_user_id_fkey_idx on public.admin_beta_feedback_events (user_id);
create index if not exists advisor_memories_organization_id_fkey_idx on public.advisor_memories (organization_id);
create index if not exists advisor_memories_user_id_fkey_idx on public.advisor_memories (user_id);
create index if not exists agent_runs_organization_id_fkey_idx on public.agent_runs (organization_id);
create index if not exists ai_action_runs_organization_id_fkey_idx on public.ai_action_runs (organization_id);
create index if not exists ai_action_runs_recommendation_id_fkey_idx on public.ai_action_runs (recommendation_id);
create index if not exists ai_advisor_credits_user_id_fkey_idx on public.ai_advisor_credits (user_id);
create index if not exists ai_drafting_sessions_organization_id_fkey_idx on public.ai_drafting_sessions (organization_id);
create index if not exists ai_drafting_sessions_user_id_fkey_idx on public.ai_drafting_sessions (user_id);
create index if not exists ai_recommendations_organization_id_fkey_idx on public.ai_recommendations (organization_id);
create index if not exists ai_recommendations_user_id_fkey_idx on public.ai_recommendations (user_id);
create index if not exists ai_telemetry_events_organization_id_fkey_idx on public.ai_telemetry_events (organization_id);
create index if not exists ai_telemetry_events_user_id_fkey_idx on public.ai_telemetry_events (user_id);
create index if not exists benchmark_snapshots_organization_id_fkey_idx on public.benchmark_snapshots (organization_id);
create index if not exists billing_events_organization_id_fkey_idx on public.billing_events (organization_id);
create index if not exists clients_jurisdiction_id_fkey_idx on public.clients (jurisdiction_id);
create index if not exists clients_tier_id_fkey_idx on public.clients (tier_id);
create index if not exists comment_mentions_comment_id_fkey_idx on public.comment_mentions (comment_id);
create index if not exists comment_mentions_mentioned_user_id_fkey_idx on public.comment_mentions (mentioned_user_id);
create index if not exists comments_organization_id_fkey_idx on public.comments (organization_id);
create index if not exists compliance_assessments_document_id_fkey_idx on public.compliance_assessments (document_id);
create index if not exists compliance_assessments_organization_id_fkey_idx on public.compliance_assessments (organization_id);
create index if not exists compliance_findings_assessment_id_fkey_idx on public.compliance_findings (assessment_id);
create index if not exists compliance_findings_organization_id_fkey_idx on public.compliance_findings (organization_id);
create index if not exists compliance_tasks_assigned_to_fkey_idx on public.compliance_tasks (assigned_to);
create index if not exists compliance_tasks_organization_id_fkey_idx on public.compliance_tasks (organization_id);
create index if not exists conversations_organization_id_fkey_idx on public.conversations (organization_id);
create index if not exists conversations_user_id_fkey_idx on public.conversations (user_id);
create index if not exists document_annotations_document_id_fkey_idx on public.document_annotations (document_id);
create index if not exists document_annotations_organization_id_fkey_idx on public.document_annotations (organization_id);
create index if not exists document_reviews_document_id_fkey_idx on public.document_reviews (document_id);
create index if not exists document_reviews_organization_id_fkey_idx on public.document_reviews (organization_id);
create index if not exists document_reviews_reviewer_user_id_fkey_idx on public.document_reviews (reviewer_user_id);
create index if not exists document_versions_organization_id_fkey_idx on public.document_versions (organization_id);
create index if not exists documents_employer_profile_id_fkey_idx on public.documents (employer_profile_id);
create index if not exists documents_organization_id_fkey_idx on public.documents (organization_id);
create index if not exists employer_profiles_organization_id_fkey_idx on public.employer_profiles (organization_id);
create index if not exists employer_profiles_owner_id_fkey_idx on public.employer_profiles (owner_id);
create index if not exists execution_traces_organization_id_fkey_idx on public.execution_traces (organization_id);
create index if not exists execution_traces_parent_trace_id_fkey_idx on public.execution_traces (parent_trace_id);
create index if not exists guidance_chunks_organization_id_fkey_idx on public.guidance_chunks (organization_id);
create index if not exists guidance_chunks_source_id_fkey_idx on public.guidance_chunks (source_id);
create index if not exists hr_advisor_case_timeline_events_case_id_fkey_idx on public.hr_advisor_case_timeline_events (case_id);
create index if not exists hr_advisor_case_timeline_events_organization_id_fkey_idx on public.hr_advisor_case_timeline_events (organization_id);
create index if not exists hr_case_notes_case_id_fkey_idx on public.hr_case_notes (case_id);
create index if not exists hr_cases_organization_id_fkey_idx on public.hr_cases (organization_id);
create index if not exists hr_document_exports_document_id_fkey_idx on public.hr_document_exports (document_id);
create index if not exists hr_employee_notes_employee_id_fkey_idx on public.hr_employee_notes (employee_id);
create index if not exists job_attempts_job_id_fkey_idx on public.job_attempts (job_id);
create index if not exists job_queue_organization_id_fkey_idx on public.job_queue (organization_id);
create index if not exists law_change_impacts_document_id_fkey_idx on public.law_change_impacts (document_id);
create index if not exists law_change_impacts_law_update_id_fkey_idx on public.law_change_impacts (law_update_id);
create index if not exists law_change_impacts_organization_id_fkey_idx on public.law_change_impacts (organization_id);
create index if not exists legal_ingestion_runs_source_id_fkey_idx on public.legal_ingestion_runs (source_id);
create index if not exists multi_agent_plans_organization_id_fkey_idx on public.multi_agent_plans (organization_id);
create index if not exists notification_deliveries_notification_id_fkey_idx on public.notification_deliveries (notification_id);
create index if not exists notifications_organization_id_fkey_idx on public.notifications (organization_id);
create index if not exists notifications_user_id_fkey_idx on public.notifications (user_id);
create index if not exists offer_workflow_states_document_id_fkey_idx on public.offer_workflow_states (document_id);
create index if not exists offer_workflow_states_employer_profile_id_fkey_idx on public.offer_workflow_states (employer_profile_id);
create index if not exists offer_workflow_states_owner_id_fkey_idx on public.offer_workflow_states (owner_id);
create index if not exists operational_bottlenecks_organization_id_fkey_idx on public.operational_bottlenecks (organization_id);
create index if not exists organization_maturity_scores_organization_id_fkey_idx on public.organization_maturity_scores (organization_id);
create index if not exists organization_risk_snapshots_organization_id_fkey_idx on public.organization_risk_snapshots (organization_id);
create index if not exists playbook_runs_organization_id_fkey_idx on public.playbook_runs (organization_id);
create index if not exists policy_gap_analyses_organization_id_fkey_idx on public.policy_gap_analyses (organization_id);
create index if not exists predictive_risk_forecasts_organization_id_fkey_idx on public.predictive_risk_forecasts (organization_id);
create index if not exists scheduled_operations_organization_id_fkey_idx on public.scheduled_operations (organization_id);
create index if not exists signature_audit_events_signature_id_fkey_idx on public.signature_audit_events (signature_id);
create index if not exists signatures_document_id_fkey_idx on public.signatures (document_id);
create index if not exists signatures_user_id_fkey_idx on public.signatures (user_id);
create index if not exists support_messages_ticket_id_fkey_idx on public.support_messages (ticket_id);
create index if not exists support_notifications_ticket_id_fkey_idx on public.support_notifications (ticket_id);
create index if not exists support_ticket_assignments_ticket_id_fkey_idx on public.support_ticket_assignments (ticket_id);
create index if not exists support_ticket_events_ticket_id_fkey_idx on public.support_ticket_events (ticket_id);
create index if not exists support_tickets_assigned_to_fkey_idx on public.support_tickets (assigned_to);
create index if not exists support_tickets_requester_user_id_fkey_idx on public.support_tickets (requester_user_id);
create index if not exists system_events_organization_id_fkey_idx on public.system_events (organization_id);
create index if not exists template_documents_client_id_fkey_idx on public.template_documents (client_id);
create index if not exists template_documents_template_id_fkey_idx on public.template_documents (template_id);
create index if not exists template_documents_workflow_id_fkey_idx on public.template_documents (workflow_id);
create index if not exists usage_events_organization_id_fkey_idx on public.usage_events (organization_id);
create index if not exists webhook_events_organization_id_fkey_idx on public.webhook_events (organization_id);
create index if not exists workflow_automation_runs_organization_id_fkey_idx on public.workflow_automation_runs (organization_id);
create index if not exists workflows_client_id_fkey_idx on public.workflows (client_id);
create index if not exists workflows_template_id_fkey_idx on public.workflows (template_id);
create index if not exists workspace_intelligence_items_organization_id_fkey_idx on public.workspace_intelligence_items (organization_id);
create index if not exists workspace_notes_organization_id_fkey_idx on public.workspace_notes (organization_id);

-- Initplan: inline org membership in signing UPDATE policies (avoid is_org_* in RLS).
alter policy "Org can update document recipients" on public.hr_document_recipients
  using ((
  public.is_admin((select auth.uid()))
  or exists (
    select 1
    from public.organization_members om
    where om.organization_id = hr_document_recipients.organization_id
      and om.user_id = (select auth.uid())
      and om.status = 'active'
      and om.role in ('owner', 'admin')
  )
  or (
    exists (
      select 1
      from public.organization_members om
      where om.organization_id = hr_document_recipients.organization_id
        and om.user_id = (select auth.uid())
        and om.status = 'active'
    )
    and lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
    and status in ('pending', 'sent', 'viewed')
  )
))
  with check ((
  public.is_admin((select auth.uid()))
  or exists (
    select 1
    from public.organization_members om
    where om.organization_id = hr_document_recipients.organization_id
      and om.user_id = (select auth.uid())
      and om.status = 'active'
      and om.role in ('owner', 'admin')
  )
  or (
    exists (
      select 1
      from public.organization_members om
      where om.organization_id = hr_document_recipients.organization_id
        and om.user_id = (select auth.uid())
        and om.status = 'active'
    )
    and lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
    and status in ('viewed', 'signed', 'declined')
  )
));
alter policy "Org can update document signatures" on public.hr_document_signatures
  using ((
  public.is_admin((select auth.uid()))
  or exists (
    select 1
    from public.organization_members om
    where om.organization_id = hr_document_signatures.organization_id
      and om.user_id = (select auth.uid())
      and om.status = 'active'
      and om.role in ('owner', 'admin')
  )
  or (
    exists (
      select 1
      from public.organization_members om
      where om.organization_id = hr_document_signatures.organization_id
        and om.user_id = (select auth.uid())
        and om.status = 'active'
    )
    and status in ('sent', 'viewed', 'pending', 'partially_signed')
    and exists (
      select 1
      from public.hr_document_recipients r
      where r.signature_id = hr_document_signatures.id
        and lower(r.email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
        and r.status in ('pending', 'sent', 'viewed')
    )
  )
))
  with check ((
  public.is_admin((select auth.uid()))
  or exists (
    select 1
    from public.organization_members om
    where om.organization_id = hr_document_signatures.organization_id
      and om.user_id = (select auth.uid())
      and om.status = 'active'
      and om.role in ('owner', 'admin')
  )
  or (
    exists (
      select 1
      from public.organization_members om
      where om.organization_id = hr_document_signatures.organization_id
        and om.user_id = (select auth.uid())
        and om.status = 'active'
    )
    and status in ('viewed', 'partially_signed', 'signed', 'declined')
  )
));

-- Permissive policies: drop redundant SELECT where ALL already matches.
drop policy if exists "Org admins can view integrations" on public.external_integrations;

-- Merge duplicate waitlist SELECT policies.
drop policy if exists "Admins can read waitlist" on public.organization_admission_waitlist;
drop policy if exists "Users can read own waitlist row" on public.organization_admission_waitlist;
create policy "Users and admins can read waitlist"
  on public.organization_admission_waitlist
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_admin_user()
  );

-- Split admin ALL manage policies into IUD so SELECT is not doubled.
drop policy if exists "Admins can manage agent runs" on public.agent_runs;
create policy "Admins can insert agent runs"
  on public.agent_runs
  for insert
  to authenticated
  with check (is_admin((select auth.uid())));
create policy "Admins can update agent runs"
  on public.agent_runs
  for update
  to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
create policy "Admins can delete agent runs"
  on public.agent_runs
  for delete
  to authenticated
  using (is_admin((select auth.uid())));

drop policy if exists "Admins can manage AI agents" on public.ai_agents;
create policy "Admins can insert AI agents"
  on public.ai_agents
  for insert
  to authenticated
  with check (is_admin((select auth.uid())));
create policy "Admins can update AI agents"
  on public.ai_agents
  for update
  to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
create policy "Admins can delete AI agents"
  on public.ai_agents
  for delete
  to authenticated
  using (is_admin((select auth.uid())));

drop policy if exists "Admins can manage model routes" on public.ai_model_routes;
create policy "Admins can insert model routes"
  on public.ai_model_routes
  for insert
  to authenticated
  with check (is_admin((select auth.uid())));
create policy "Admins can update model routes"
  on public.ai_model_routes
  for update
  to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
create policy "Admins can delete model routes"
  on public.ai_model_routes
  for delete
  to authenticated
  using (is_admin((select auth.uid())));

drop policy if exists "Admins can manage AI telemetry" on public.ai_telemetry_events;
create policy "Admins can insert AI telemetry"
  on public.ai_telemetry_events
  for insert
  to authenticated
  with check (is_admin((select auth.uid())));
create policy "Admins can update AI telemetry"
  on public.ai_telemetry_events
  for update
  to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
create policy "Admins can delete AI telemetry"
  on public.ai_telemetry_events
  for delete
  to authenticated
  using (is_admin((select auth.uid())));

drop policy if exists "Admins can manage benchmarks" on public.benchmark_snapshots;
create policy "Admins can insert benchmarks"
  on public.benchmark_snapshots
  for insert
  to authenticated
  with check (is_admin((select auth.uid())));
create policy "Admins can update benchmarks"
  on public.benchmark_snapshots
  for update
  to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
create policy "Admins can delete benchmarks"
  on public.benchmark_snapshots
  for delete
  to authenticated
  using (is_admin((select auth.uid())));

drop policy if exists "Admins can manage billing events" on public.billing_events;
create policy "Admins can insert billing events"
  on public.billing_events
  for insert
  to authenticated
  with check (is_admin((select auth.uid())));
create policy "Admins can update billing events"
  on public.billing_events
  for update
  to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
create policy "Admins can delete billing events"
  on public.billing_events
  for delete
  to authenticated
  using (is_admin((select auth.uid())));

drop policy if exists "Admins can manage execution traces" on public.execution_traces;
create policy "Admins can insert execution traces"
  on public.execution_traces
  for insert
  to authenticated
  with check (is_admin((select auth.uid())));
create policy "Admins can update execution traces"
  on public.execution_traces
  for update
  to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
create policy "Admins can delete execution traces"
  on public.execution_traces
  for delete
  to authenticated
  using (is_admin((select auth.uid())));

drop policy if exists "Admins can manage job attempts" on public.job_attempts;
create policy "Admins can insert job attempts"
  on public.job_attempts
  for insert
  to authenticated
  with check (is_admin((select auth.uid())));
create policy "Admins can update job attempts"
  on public.job_attempts
  for update
  to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
create policy "Admins can delete job attempts"
  on public.job_attempts
  for delete
  to authenticated
  using (is_admin((select auth.uid())));

drop policy if exists "Admins can manage jobs" on public.job_queue;
create policy "Admins can insert jobs"
  on public.job_queue
  for insert
  to authenticated
  with check (is_admin((select auth.uid())));
create policy "Admins can update jobs"
  on public.job_queue
  for update
  to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
create policy "Admins can delete jobs"
  on public.job_queue
  for delete
  to authenticated
  using (is_admin((select auth.uid())));

drop policy if exists "Admins can manage multi-agent plans" on public.multi_agent_plans;
create policy "Admins can insert multi-agent plans"
  on public.multi_agent_plans
  for insert
  to authenticated
  with check (is_admin((select auth.uid())));
create policy "Admins can update multi-agent plans"
  on public.multi_agent_plans
  for update
  to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
create policy "Admins can delete multi-agent plans"
  on public.multi_agent_plans
  for delete
  to authenticated
  using (is_admin((select auth.uid())));

drop policy if exists "Admins can manage notification deliveries" on public.notification_deliveries;
create policy "Admins can insert notification deliveries"
  on public.notification_deliveries
  for insert
  to authenticated
  with check (is_admin((select auth.uid())));
create policy "Admins can update notification deliveries"
  on public.notification_deliveries
  for update
  to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
create policy "Admins can delete notification deliveries"
  on public.notification_deliveries
  for delete
  to authenticated
  using (is_admin((select auth.uid())));

drop policy if exists "Admins can manage maturity scores" on public.organization_maturity_scores;
create policy "Admins can insert maturity scores"
  on public.organization_maturity_scores
  for insert
  to authenticated
  with check (is_admin((select auth.uid())));
create policy "Admins can update maturity scores"
  on public.organization_maturity_scores
  for update
  to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
create policy "Admins can delete maturity scores"
  on public.organization_maturity_scores
  for delete
  to authenticated
  using (is_admin((select auth.uid())));

drop policy if exists "Admins can manage org risk snapshots" on public.organization_risk_snapshots;
create policy "Admins can insert org risk snapshots"
  on public.organization_risk_snapshots
  for insert
  to authenticated
  with check (is_admin((select auth.uid())));
create policy "Admins can update org risk snapshots"
  on public.organization_risk_snapshots
  for update
  to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
create policy "Admins can delete org risk snapshots"
  on public.organization_risk_snapshots
  for delete
  to authenticated
  using (is_admin((select auth.uid())));

drop policy if exists "Admins can manage forecasts" on public.predictive_risk_forecasts;
create policy "Admins can insert forecasts"
  on public.predictive_risk_forecasts
  for insert
  to authenticated
  with check (is_admin((select auth.uid())));
create policy "Admins can update forecasts"
  on public.predictive_risk_forecasts
  for update
  to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
create policy "Admins can delete forecasts"
  on public.predictive_risk_forecasts
  for delete
  to authenticated
  using (is_admin((select auth.uid())));

drop policy if exists "Admins can manage scheduled operations" on public.scheduled_operations;
create policy "Admins can insert scheduled operations"
  on public.scheduled_operations
  for insert
  to authenticated
  with check (is_admin((select auth.uid())));
create policy "Admins can update scheduled operations"
  on public.scheduled_operations
  for update
  to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
create policy "Admins can delete scheduled operations"
  on public.scheduled_operations
  for delete
  to authenticated
  using (is_admin((select auth.uid())));

drop policy if exists "Admins can manage webhook events" on public.webhook_events;
create policy "Admins can insert webhook events"
  on public.webhook_events
  for insert
  to authenticated
  with check (is_admin((select auth.uid())));
create policy "Admins can update webhook events"
  on public.webhook_events
  for update
  to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
create policy "Admins can delete webhook events"
  on public.webhook_events
  for delete
  to authenticated
  using (is_admin((select auth.uid())));

drop policy if exists "Admins can manage workflow metrics" on public.workflow_metrics_daily;
create policy "Admins can insert workflow metrics"
  on public.workflow_metrics_daily
  for insert
  to authenticated
  with check (is_admin((select auth.uid())));
create policy "Admins can update workflow metrics"
  on public.workflow_metrics_daily
  for update
  to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
create policy "Admins can delete workflow metrics"
  on public.workflow_metrics_daily
  for delete
  to authenticated
  using (is_admin((select auth.uid())));

drop policy if exists "Admins can manage usage events" on public.usage_events;
create policy "Admins can insert usage events"
  on public.usage_events
  for insert
  to authenticated
  with check (is_admin((select auth.uid())));
create policy "Admins can update usage events"
  on public.usage_events
  for update
  to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
create policy "Admins can delete usage events"
  on public.usage_events
  for delete
  to authenticated
  using (is_admin((select auth.uid())));

drop policy if exists "Admins can manage roles" on public.user_roles;
create policy "Admins can insert roles"
  on public.user_roles
  for insert
  to authenticated
  with check (is_admin((select auth.uid())));
create policy "Admins can update roles"
  on public.user_roles
  for update
  to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
create policy "Admins can delete roles"
  on public.user_roles
  for delete
  to authenticated
  using (is_admin((select auth.uid())));

drop policy if exists "Admins can manage feature flags" on public.frontend_feature_flags;
create policy "Admins can insert feature flags"
  on public.frontend_feature_flags
  for insert
  to authenticated
  with check (is_admin((select auth.uid())));
create policy "Admins can update feature flags"
  on public.frontend_feature_flags
  for update
  to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
create policy "Admins can delete feature flags"
  on public.frontend_feature_flags
  for delete
  to authenticated
  using (is_admin((select auth.uid())));

drop policy if exists "Admins can manage guidance chunks" on public.guidance_chunks;
create policy "Admins can insert guidance chunks"
  on public.guidance_chunks
  for insert
  to authenticated
  with check (is_admin((select auth.uid())));
create policy "Admins can update guidance chunks"
  on public.guidance_chunks
  for update
  to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
create policy "Admins can delete guidance chunks"
  on public.guidance_chunks
  for delete
  to authenticated
  using (is_admin((select auth.uid())));

drop policy if exists "Admins can manage guidance sources" on public.guidance_sources;
create policy "Admins can insert guidance sources"
  on public.guidance_sources
  for insert
  to authenticated
  with check (is_admin((select auth.uid())));
create policy "Admins can update guidance sources"
  on public.guidance_sources
  for update
  to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
create policy "Admins can delete guidance sources"
  on public.guidance_sources
  for delete
  to authenticated
  using (is_admin((select auth.uid())));

drop policy if exists "Admins can manage jurisdiction comparisons" on public.jurisdiction_comparisons;
create policy "Admins can insert jurisdiction comparisons"
  on public.jurisdiction_comparisons
  for insert
  to authenticated
  with check (is_admin((select auth.uid())));
create policy "Admins can update jurisdiction comparisons"
  on public.jurisdiction_comparisons
  for update
  to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
create policy "Admins can delete jurisdiction comparisons"
  on public.jurisdiction_comparisons
  for delete
  to authenticated
  using (is_admin((select auth.uid())));

drop policy if exists "Admins can manage legal ingestion sources" on public.legal_ingestion_sources;
create policy "Admins can insert legal ingestion sources"
  on public.legal_ingestion_sources
  for insert
  to authenticated
  with check (is_admin((select auth.uid())));
create policy "Admins can update legal ingestion sources"
  on public.legal_ingestion_sources
  for update
  to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
create policy "Admins can delete legal ingestion sources"
  on public.legal_ingestion_sources
  for delete
  to authenticated
  using (is_admin((select auth.uid())));

drop policy if exists "Admins can manage playbooks" on public.workflow_playbooks;
create policy "Admins can insert playbooks"
  on public.workflow_playbooks
  for insert
  to authenticated
  with check (is_admin((select auth.uid())));
create policy "Admins can update playbooks"
  on public.workflow_playbooks
  for update
  to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));
create policy "Admins can delete playbooks"
  on public.workflow_playbooks
  for delete
  to authenticated
  using (is_admin((select auth.uid())));

drop policy if exists "Admins can manage content variants" on public.template_content_variants;
create policy "Admins can insert content variants"
  on public.template_content_variants
  for insert
  to authenticated
  with check (is_admin_user());
create policy "Admins can update content variants"
  on public.template_content_variants
  for update
  to authenticated
  using (is_admin_user())
  with check (is_admin_user());
create policy "Admins can delete content variants"
  on public.template_content_variants
  for delete
  to authenticated
  using (is_admin_user());

drop policy if exists "Admins can manage template fields" on public.template_fields;
create policy "Admins can insert template fields"
  on public.template_fields
  for insert
  to authenticated
  with check (is_admin_user());
create policy "Admins can update template fields"
  on public.template_fields
  for update
  to authenticated
  using (is_admin_user())
  with check (is_admin_user());
create policy "Admins can delete template fields"
  on public.template_fields
  for delete
  to authenticated
  using (is_admin_user());

drop policy if exists "Admins can manage template versions" on public.template_versions;
create policy "Admins can insert template versions"
  on public.template_versions
  for insert
  to authenticated
  with check (is_admin_user());
create policy "Admins can update template versions"
  on public.template_versions
  for update
  to authenticated
  using (is_admin_user())
  with check (is_admin_user());
create policy "Admins can delete template versions"
  on public.template_versions
  for delete
  to authenticated
  using (is_admin_user());

drop policy if exists "Admins can manage templates" on public.templates;
create policy "Admins can insert templates"
  on public.templates
  for insert
  to authenticated
  with check (is_admin_user());
create policy "Admins can update templates"
  on public.templates
  for update
  to authenticated
  using (is_admin_user())
  with check (is_admin_user());
create policy "Admins can delete templates"
  on public.templates
  for delete
  to authenticated
  using (is_admin_user());
