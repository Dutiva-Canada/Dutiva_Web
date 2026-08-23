-- Dutiva-native e-signature workflow (0077 tables).
-- Server-side RPCs enforce signing order, consent capture, and audit events.
-- No third-party e-sign vendor — authenticated org members sign in-workspace
-- when their account email matches the recipient row.

alter table public.hr_generated_documents
  drop constraint if exists hr_generated_documents_status_check;

alter table public.hr_generated_documents
  add constraint hr_generated_documents_status_check
  check (status in (
    'draft', 'approved', 'archived',
    'sent_for_signature', 'partially_signed', 'signed', 'voided'
  ));

alter table public.hr_document_signatures
  add column if not exists content_hash text;

alter table public.hr_document_recipients
  add column if not exists consent_at timestamptz,
  add column if not exists consent_version text,
  add column if not exists decline_reason text;

-- Org members may update only their own pending recipient row (email match).
drop policy if exists "Org admins can update document recipients"
  on public.hr_document_recipients;

create policy "Org admins can update document recipients"
  on public.hr_document_recipients for update
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));

create policy "Org members can update their recipient signature row"
  on public.hr_document_recipients for update
  using (
    public.is_org_member(organization_id, (select auth.uid()))
    and lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
    and status in ('pending', 'sent', 'viewed')
  )
  with check (
    public.is_org_member(organization_id, (select auth.uid()))
    and lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
    and status in ('viewed', 'signed', 'declined')
  );

-- Signers may mark envelope viewed / partially signed / signed (not void/decline on envelope alone).
drop policy if exists "Org admins can update document signatures"
  on public.hr_document_signatures;

create policy "Org admins can update document signatures"
  on public.hr_document_signatures for update
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));

create policy "Org members can update active document signatures"
  on public.hr_document_signatures for update
  using (
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
  with check (
    public.is_org_member(organization_id, (select auth.uid()))
    and status in ('viewed', 'partially_signed', 'signed', 'declined')
  );

create or replace function public._hr_signing_actor_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public._hr_signing_recipient_for_envelope(p_envelope_id text)
returns public.hr_document_recipients
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_email text := public._hr_signing_actor_email();
  v_row public.hr_document_recipients;
begin
  if v_email = '' or auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select r.*
  into v_row
  from public.hr_document_recipients r
  join public.hr_document_signatures s on s.id = r.signature_id
  where s.external_envelope_id = p_envelope_id
    and lower(r.email) = v_email
    and public.is_org_member(r.organization_id, auth.uid())
  limit 1;

  if not found then
    raise exception 'Recipient not found for this envelope';
  end if;

  return v_row;
end;
$$;

create or replace function public._hr_signing_assert_turn(p_signature_id uuid, p_signing_order integer)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_min_order integer;
begin
  select min(signing_order)
  into v_min_order
  from public.hr_document_recipients
  where signature_id = p_signature_id
    and status in ('pending', 'sent', 'viewed');

  if v_min_order is null then
    raise exception 'No pending recipients on this envelope';
  end if;

  if p_signing_order <> v_min_order then
    raise exception 'Signing order: recipient % must sign before you', v_min_order;
  end if;
end;
$$;

create or replace function public.record_hr_document_signature_view(p_envelope_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient public.hr_document_recipients;
  v_now timestamptz := now();
begin
  v_recipient := public._hr_signing_recipient_for_envelope(p_envelope_id);

  if v_recipient.status in ('signed', 'declined') then
    return;
  end if;

  update public.hr_document_recipients
  set status = case when status = 'pending' then 'viewed' else status end,
      viewed_at = coalesce(viewed_at, v_now)
  where id = v_recipient.id
    and status in ('pending', 'sent', 'viewed');

  update public.hr_document_signatures
  set status = case when status = 'sent' then 'viewed' else status end,
      viewed_at = coalesce(viewed_at, v_now)
  where id = v_recipient.signature_id
    and status in ('sent', 'viewed', 'pending', 'partially_signed');

  insert into public.hr_document_audit_events (
    organization_id, document_id, event_type, actor_label, meta
  )
  values (
    v_recipient.organization_id,
    v_recipient.document_id,
    'signature_viewed',
    v_recipient.name,
    v_recipient.email
  );
end;
$$;

create or replace function public.apply_hr_document_signature(
  p_envelope_id text,
  p_signed_name text,
  p_signature_image text default null,
  p_signature_text text default null,
  p_consent_version text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient public.hr_document_recipients;
  v_now timestamptz := now();
  v_all_signed boolean;
  v_some_signed boolean;
  v_signature_status text;
  v_doc_status text;
begin
  if coalesce(trim(p_signed_name), '') = '' then
    raise exception 'Signed name is required';
  end if;
  if coalesce(trim(p_consent_version), '') = '' then
    raise exception 'Electronic signature consent is required';
  end if;

  v_recipient := public._hr_signing_recipient_for_envelope(p_envelope_id);

  if v_recipient.status in ('signed', 'declined') then
    raise exception 'Recipient has already completed this envelope';
  end if;

  perform public._hr_signing_assert_turn(v_recipient.signature_id, v_recipient.signing_order);

  update public.hr_document_recipients
  set status = 'signed',
      signed_at = v_now,
      viewed_at = coalesce(viewed_at, v_now),
      signed_name = trim(p_signed_name),
      signature_image = p_signature_image,
      signature_text = p_signature_text,
      consent_at = v_now,
      consent_version = p_consent_version
  where id = v_recipient.id;

  select
    bool_and(status = 'signed'),
    bool_or(status = 'signed')
  into v_all_signed, v_some_signed
  from public.hr_document_recipients
  where signature_id = v_recipient.signature_id;

  if v_all_signed then
    v_signature_status := 'signed';
    v_doc_status := 'signed';
  elsif v_some_signed then
    v_signature_status := 'partially_signed';
    v_doc_status := 'partially_signed';
  else
    v_signature_status := 'sent';
    v_doc_status := 'sent_for_signature';
  end if;

  update public.hr_document_signatures
  set status = v_signature_status,
      signed_at = case when v_all_signed then v_now else signed_at end
  where id = v_recipient.signature_id;

  update public.hr_generated_documents
  set status = v_doc_status,
      signature_status = v_signature_status,
      updated_at = v_now
  where id = v_recipient.document_id;

  insert into public.hr_document_audit_events (
    organization_id, document_id, event_type, actor_label, meta
  )
  values (
    v_recipient.organization_id,
    v_recipient.document_id,
    'signature_applied',
    trim(p_signed_name),
    v_recipient.email
  );

  if v_all_signed then
    insert into public.hr_document_audit_events (
      organization_id, document_id, event_type, actor_label, meta
    )
    values (
      v_recipient.organization_id,
      v_recipient.document_id,
      'signature_completed',
      trim(p_signed_name),
      'all recipients signed'
    );
  end if;

  return jsonb_build_object(
    'document_id', v_recipient.document_id,
    'signature_status', v_signature_status
  );
end;
$$;

create or replace function public.decline_hr_document_signature(
  p_envelope_id text,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient public.hr_document_recipients;
  v_now timestamptz := now();
begin
  v_recipient := public._hr_signing_recipient_for_envelope(p_envelope_id);

  if v_recipient.status in ('signed', 'declined') then
    raise exception 'Recipient has already completed this envelope';
  end if;

  perform public._hr_signing_assert_turn(v_recipient.signature_id, v_recipient.signing_order);

  update public.hr_document_recipients
  set status = 'declined',
      viewed_at = coalesce(viewed_at, v_now),
      decline_reason = nullif(trim(p_reason), '')
  where id = v_recipient.id;

  update public.hr_document_signatures
  set status = 'declined',
      declined_at = v_now
  where id = v_recipient.signature_id;

  update public.hr_generated_documents
  set status = 'sent_for_signature',
      signature_status = 'declined',
      updated_at = v_now
  where id = v_recipient.document_id;

  insert into public.hr_document_audit_events (
    organization_id, document_id, event_type, actor_label, meta
  )
  values (
    v_recipient.organization_id,
    v_recipient.document_id,
    'signature_declined',
    v_recipient.name,
    coalesce(nullif(trim(p_reason), ''), v_recipient.email)
  );

  return jsonb_build_object(
    'document_id', v_recipient.document_id,
    'signature_status', 'declined'
  );
end;
$$;

create or replace function public.void_hr_document_signature(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_sig_id uuid;
  v_now timestamptz := now();
begin
  select organization_id
  into v_org_id
  from public.hr_generated_documents
  where id = p_document_id;

  if not found then
    raise exception 'Document not found';
  end if;

  if not public.is_org_admin(v_org_id, auth.uid()) then
    raise exception 'Only organization admins can void a signature envelope';
  end if;

  select id
  into v_sig_id
  from public.hr_document_signatures
  where document_id = p_document_id
  order by created_at desc
  limit 1;

  if v_sig_id is not null then
    update public.hr_document_signatures
    set status = 'voided'
    where id = v_sig_id;
  end if;

  update public.hr_generated_documents
  set status = 'voided',
      signature_status = 'voided',
      updated_at = v_now
  where id = p_document_id;

  insert into public.hr_document_audit_events (
    organization_id, document_id, event_type, actor_label, meta
  )
  values (
    v_org_id,
    p_document_id,
    'document_voided',
    coalesce((select auth.jwt() ->> 'email'), 'Admin'),
    'signature envelope voided'
  );
end;
$$;

revoke all on function public._hr_signing_actor_email() from public;
revoke all on function public._hr_signing_recipient_for_envelope(text) from public;
revoke all on function public._hr_signing_assert_turn(uuid, integer) from public;

grant execute on function public.record_hr_document_signature_view(text) to authenticated;
grant execute on function public.apply_hr_document_signature(text, text, text, text, text) to authenticated;
grant execute on function public.decline_hr_document_signature(text, text) to authenticated;
grant execute on function public.void_hr_document_signature(uuid) to authenticated;
