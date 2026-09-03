-- Advisor phase 5: signing UPDATE policies — initplan-safe auth.jwt() email lookup.
--
-- Supabase initplan lint still flags `(select auth.jwt() ->> 'email')` because auth.jwt()
-- is evaluated inside the projection. Use `(select (select auth.jwt()) ->> 'email')` instead.
-- The five "unindexed foreign keys" advisor INFO items are false positives: composite unique
-- indexes already cover case_id, jurisdiction_id, category_id, field_id, and question_id.

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
      and lower(email) = lower(coalesce((select (select auth.jwt()) ->> 'email'), ''))
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
      and lower(email) = lower(coalesce((select (select auth.jwt()) ->> 'email'), ''))
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
          and lower(r.email) = lower(coalesce((select (select auth.jwt()) ->> 'email'), ''))
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
