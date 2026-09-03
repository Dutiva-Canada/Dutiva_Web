-- Advisor phase 4: final permissive-policy merges, org_members ALL split, signing initplan.
--
-- job_queue / usage_events: member INSERT policies already cover admin paths.
drop policy if exists "Admins can insert jobs" on public.job_queue;
drop policy if exists "Admins can insert usage events" on public.usage_events;

-- organization_members: split ALL manage into IUD so SELECT is not doubled.
drop policy if exists "Org admins can manage organization members" on public.organization_members;
create policy "Org admins can insert organization members"
  on public.organization_members
  for insert
  to authenticated
  with check (public.is_org_admin(organization_id, (select auth.uid())));
create policy "Org admins can update organization members"
  on public.organization_members
  for update
  to authenticated
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));
create policy "Org admins can delete organization members"
  on public.organization_members
  for delete
  to authenticated
  using (public.is_org_admin(organization_id, (select auth.uid())));

-- Initplan: inline platform-admin check (avoid is_admin() STABLE helper in RLS).
alter policy "Org can update document recipients" on public.hr_document_recipients
  using (
    exists (
      select 1
      from public.user_roles ur
      where ur.user_id = (select auth.uid())
        and ur.role in ('owner', 'admin')
    )
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
  )
  with check (
    exists (
      select 1
      from public.user_roles ur
      where ur.user_id = (select auth.uid())
        and ur.role in ('owner', 'admin')
    )
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
  );

alter policy "Org can update document signatures" on public.hr_document_signatures
  using (
    exists (
      select 1
      from public.user_roles ur
      where ur.user_id = (select auth.uid())
        and ur.role in ('owner', 'admin')
    )
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
  )
  with check (
    exists (
      select 1
      from public.user_roles ur
      where ur.user_id = (select auth.uid())
        and ur.role in ('owner', 'admin')
    )
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
  );
