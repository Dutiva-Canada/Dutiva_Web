-- Reduce multiple permissive policies flagged by the performance advisor.

-- Legacy doclib ALL policy on public duplicates per-action authenticated policies.
drop policy if exists "Users can access their own documents" on public.documents;

-- Redundant SELECT-only policies where ALL already grants the same access.
drop policy if exists "Members can view advisor memories" on public.advisor_memories;
drop policy if exists "Members can view drafting sessions" on public.ai_drafting_sessions;
drop policy if exists "Members can view AI recommendations" on public.ai_recommendations;
drop policy if exists "Members can view comments" on public.comments;
drop policy if exists "Members can view compliance findings" on public.compliance_findings;
drop policy if exists "Org members can view compliance tasks" on public.compliance_tasks;
drop policy if exists "Members can view annotations" on public.document_annotations;
drop policy if exists "Members can view document reviews" on public.document_reviews;
drop policy if exists "Members can view entity relationships" on public.entity_relationships;
drop policy if exists "Members can view law impacts" on public.law_change_impacts;
drop policy if exists "Admins can view legal ingestion runs" on public.legal_ingestion_runs;
drop policy if exists "Members can view bottlenecks" on public.operational_bottlenecks;
drop policy if exists "Members can view policy gap analyses" on public.policy_gap_analyses;
drop policy if exists "Admins can view queue health" on public.queue_health_snapshots;
drop policy if exists "Members can view workspace intelligence" on public.workspace_intelligence_items;
drop policy if exists "Members can view workspace notes" on public.workspace_notes;

-- Merge paired UPDATE policies on signing tables.
drop policy if exists "Org admins can update document recipients" on public.hr_document_recipients;
drop policy if exists "Org members can update their recipient signature row" on public.hr_document_recipients;
create policy "Org can update document recipients"
  on public.hr_document_recipients
  for update
  using (
    public.is_org_admin(organization_id, (select auth.uid()))
    or (
      public.is_org_member(organization_id, (select auth.uid()))
      and lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
      and status in ('pending', 'sent', 'viewed')
    )
  )
  with check (
    public.is_org_admin(organization_id, (select auth.uid()))
    or (
      public.is_org_member(organization_id, (select auth.uid()))
      and lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
      and status in ('viewed', 'signed', 'declined')
    )
  );

drop policy if exists "Org admins can update document signatures" on public.hr_document_signatures;
drop policy if exists "Org members can update active document signatures" on public.hr_document_signatures;
create policy "Org can update document signatures"
  on public.hr_document_signatures
  for update
  using (
    public.is_org_admin(organization_id, (select auth.uid()))
    or (
      public.is_org_member(organization_id, (select auth.uid()))
      and status in ('sent', 'viewed', 'pending', 'partially_signed')
      and exists (
        select 1
        from public.hr_document_recipients r
        where r.signature_id = hr_document_signatures.id
          and lower(r.email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
          and r.status in ('pending', 'sent', 'viewed')
      )
    )
  )
  with check (
    public.is_org_admin(organization_id, (select auth.uid()))
    or (
      public.is_org_member(organization_id, (select auth.uid()))
      and status in ('viewed', 'partially_signed', 'signed', 'declined')
    )
  );

-- admin_users: split ALL manage into IUD so SELECT is not doubled.
drop policy if exists "Admins can manage admin_users" on public.admin_users;
create policy "Admins can insert admin_users"
  on public.admin_users
  for insert
  to authenticated
  with check (
    (exists (
      select 1 from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.revoked_at is null
        and (au.expires_at is null or au.expires_at > now())
    ))
    or (((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin'
    or ((select auth.jwt()) ->> 'role') = 'admin'
  );

create policy "Admins can update admin_users"
  on public.admin_users
  for update
  to authenticated
  using (
    (exists (
      select 1 from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.revoked_at is null
        and (au.expires_at is null or au.expires_at > now())
    ))
    or (((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin'
    or ((select auth.jwt()) ->> 'role') = 'admin'
  )
  with check (
    (exists (
      select 1 from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.revoked_at is null
        and (au.expires_at is null or au.expires_at > now())
    ))
    or (((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin'
    or ((select auth.jwt()) ->> 'role') = 'admin'
  );

create policy "Admins can delete admin_users"
  on public.admin_users
  for delete
  to authenticated
  using (
    (exists (
      select 1 from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.revoked_at is null
        and (au.expires_at is null or au.expires_at > now())
    ))
    or (((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin'
    or ((select auth.jwt()) ->> 'role') = 'admin'
  );
