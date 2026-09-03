-- Wrap auth.uid()/auth.jwt() in RLS policies so Postgres evaluates them once per query (initplan).
alter policy "Authenticated users can submit app error events" on public.admin_app_error_events
  with check (((select auth.uid()) = user_id));
alter policy "Authenticated users can submit feedback events" on public.admin_beta_feedback_events
  with check (((select auth.uid()) = user_id));
alter policy "Admins can manage admin_users" on public.admin_users
  using (((EXISTS ( SELECT 1
   FROM admin_users au
  WHERE ((au.user_id = (select auth.uid())) AND (au.revoked_at IS NULL) AND ((au.expires_at IS NULL) OR (au.expires_at > now()))))) OR ((((select auth.jwt()) -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (((select auth.jwt()) ->> 'role'::text) = 'admin'::text)))
  with check (((EXISTS ( SELECT 1
   FROM admin_users au
  WHERE ((au.user_id = (select auth.uid())) AND (au.revoked_at IS NULL) AND ((au.expires_at IS NULL) OR (au.expires_at > now()))))) OR ((((select auth.jwt()) -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (((select auth.jwt()) ->> 'role'::text) = 'admin'::text)));
alter policy "Users can view own admin record" on public.admin_users
  using ((user_id = (select auth.uid())));
alter policy "Own clients" on public.clients
  using ((created_by = (select auth.uid())))
  with check ((created_by = (select auth.uid())));
alter policy "Users can manage their own conversations" on public.conversations
  using (((select auth.uid()) = user_id))
  with check (((select auth.uid()) = user_id));
alter policy "Users can create own generation runs" on public.document_generation_runs
  with check (((select auth.uid()) = user_id));
alter policy "Users can read own generation runs" on public.document_generation_runs
  using (((select auth.uid()) = user_id));
alter policy "Users can update own generation runs" on public.document_generation_runs
  using (((select auth.uid()) = user_id))
  with check (((select auth.uid()) = user_id));
alter policy "Users can access their own documents" on public.documents
  using (((select auth.uid()) = user_id));
alter policy "Users can delete their own documents" on public.documents
  using (((select auth.uid()) = user_id));
alter policy "Users can insert their own documents" on public.documents
  with check (((select auth.uid()) = user_id));
alter policy "Users can update their own documents" on public.documents
  using (((select auth.uid()) = user_id))
  with check (((select auth.uid()) = user_id));
alter policy "Users can view their own documents" on public.documents
  using (((select auth.uid()) = user_id));
alter policy "Users can delete their own employer profiles" on public.employer_profiles
  using ((owner_id = (select auth.uid())));
alter policy "Users can insert their own employer profiles" on public.employer_profiles
  with check ((owner_id = (select auth.uid())));
alter policy "Users can update their own employer profiles" on public.employer_profiles
  using ((owner_id = (select auth.uid())))
  with check ((owner_id = (select auth.uid())));
alter policy "Users can view their own employer profiles" on public.employer_profiles
  using ((owner_id = (select auth.uid())));
alter policy "Users can delete their own workflow states" on public.offer_workflow_states
  using ((owner_id = (select auth.uid())));
alter policy "Users can insert their own workflow states" on public.offer_workflow_states
  with check ((owner_id = (select auth.uid())));
alter policy "Users can update their own workflow states" on public.offer_workflow_states
  using ((owner_id = (select auth.uid())))
  with check ((owner_id = (select auth.uid())));
alter policy "Users can view their own workflow states" on public.offer_workflow_states
  using ((owner_id = (select auth.uid())));
alter policy "Users can read own waitlist row" on public.organization_admission_waitlist
  using ((user_id = (select auth.uid())));
alter policy "Users can insert their own profile" on public.profiles
  with check (((select auth.uid()) = id));
alter policy "Users can update their own profile" on public.profiles
  using (((select auth.uid()) = id))
  with check (((select auth.uid()) = id));
alter policy "Users can view their own profile" on public.profiles
  using (((select auth.uid()) = id));
alter policy "Owners can read their signature audit events" on public.signature_audit_events
  using ((EXISTS ( SELECT 1
   FROM signatures s
  WHERE ((s.id = signature_audit_events.signature_id) AND (s.user_id = (select auth.uid()))))));
alter policy "Owners can manage their signatures" on public.signatures
  using (((select auth.uid()) = user_id))
  with check (((select auth.uid()) = user_id));
alter policy "Own template documents" on public.template_documents
  using (((generated_by = (select auth.uid())) OR (workflow_id IN ( SELECT workflows.id
   FROM workflows
  WHERE (workflows.started_by = (select auth.uid()))))))
  with check (((generated_by = (select auth.uid())) OR (workflow_id IN ( SELECT workflows.id
   FROM workflows
  WHERE (workflows.started_by = (select auth.uid()))))));
alter policy "Users can view their own usage counters" on public.usage_counters
  using (((select auth.uid()) = user_id));
alter policy "Own workflow responses" on public.workflow_responses
  using ((workflow_id IN ( SELECT workflows.id
   FROM workflows
  WHERE (workflows.started_by = (select auth.uid())))))
  with check ((workflow_id IN ( SELECT workflows.id
   FROM workflows
  WHERE (workflows.started_by = (select auth.uid())))));
alter policy "Own workflows" on public.workflows
  using ((started_by = (select auth.uid())))
  with check ((started_by = (select auth.uid())));
alter policy "Admins manage their own workspace preference" on public.workspace_preferences
  using (((user_id = (select auth.uid())) AND is_admin_user()))
  with check (((user_id = (select auth.uid())) AND is_admin_user()));
