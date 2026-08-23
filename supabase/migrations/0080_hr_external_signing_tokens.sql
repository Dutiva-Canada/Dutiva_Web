-- Per-recipient signing tokens for external counterparties (no Dutiva login).
-- Access is through SECURITY DEFINER RPCs granted to anon — never open RLS
-- on signing tables (see migration 0073).

alter table public.hr_document_recipients
  add column if not exists signing_token uuid not null default gen_random_uuid(),
  add column if not exists token_expires_at timestamptz not null default (now() + interval '30 days'),
  add column if not exists token_revoked_at timestamptz;

create unique index if not exists hr_document_recipients_signing_token_idx
  on public.hr_document_recipients (signing_token);

-- Backfill any pre-migration rows that landed with null tokens (defensive).
update public.hr_document_recipients
set signing_token = gen_random_uuid()
where signing_token is null;

create or replace function public._hr_signing_recipient_for_token(p_token uuid)
returns public.hr_document_recipients
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_row public.hr_document_recipients;
  v_sig public.hr_document_signatures;
begin
  if p_token is null then
    raise exception 'Invalid signing token';
  end if;

  select r.*
  into v_row
  from public.hr_document_recipients r
  where r.signing_token = p_token
  limit 1;

  if not found then
    raise exception 'Signing link not found';
  end if;

  if v_row.token_revoked_at is not null then
    raise exception 'Signing link has been revoked';
  end if;

  if v_row.token_expires_at is not null and v_row.token_expires_at <= now() then
    raise exception 'Signing link has expired';
  end if;

  select s.*
  into v_sig
  from public.hr_document_signatures s
  where s.id = v_row.signature_id;

  if v_sig.status = 'voided' then
    raise exception 'This signature envelope has been voided';
  end if;

  if v_sig.expires_at is not null and v_sig.expires_at <= now() then
    raise exception 'This signature envelope has expired';
  end if;

  return v_row;
end;
$$;

create or replace function public.get_hr_signing_package_by_token(p_token uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_recipient public.hr_document_recipients;
  v_sig public.hr_document_signatures;
  v_doc public.hr_generated_documents;
  v_content jsonb;
  v_turn_order integer;
begin
  v_recipient := public._hr_signing_recipient_for_token(p_token);

  select s.*
  into v_sig
  from public.hr_document_signatures s
  where s.id = v_recipient.signature_id;

  select d.*
  into v_doc
  from public.hr_generated_documents d
  where d.id = v_recipient.document_id;

  select v.content_json
  into v_content
  from public.hr_document_versions v
  where v.document_id = v_doc.id
    and v.version_number = v_doc.current_version
  limit 1;

  select min(signing_order)
  into v_turn_order
  from public.hr_document_recipients
  where signature_id = v_recipient.signature_id
    and status in ('pending', 'sent', 'viewed');

  return jsonb_build_object(
    'document', jsonb_build_object(
      'id', v_doc.id,
      'ref', v_doc.ref,
      'title_en', v_doc.title_en,
      'title_fr', v_doc.title_fr,
      'language', v_doc.language,
      'jurisdiction', v_doc.jurisdiction,
      'signature_status', v_doc.signature_status,
      'current_version', v_doc.current_version,
      'content', coalesce(v_content, '{}'::jsonb)
    ),
    'recipient', jsonb_build_object(
      'id', v_recipient.id,
      'name', v_recipient.name,
      'email', v_recipient.email,
      'type', v_recipient.recipient_type,
      'order', v_recipient.signing_order,
      'status', v_recipient.status
    ),
    'signature', jsonb_build_object(
      'envelope_id', v_sig.external_envelope_id,
      'status', v_sig.status,
      'content_hash', v_sig.content_hash
    ),
    'turn_order', v_turn_order,
    'recipients', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'order', r.signing_order,
          'name', r.name,
          'email', r.email,
          'status', r.status
        )
        order by r.signing_order
      ), '[]'::jsonb)
      from public.hr_document_recipients r
      where r.signature_id = v_recipient.signature_id
    )
  );
end;
$$;

create or replace function public.record_hr_document_signature_view_by_token(p_token uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient public.hr_document_recipients;
  v_now timestamptz := now();
begin
  v_recipient := public._hr_signing_recipient_for_token(p_token);

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
    v_recipient.email || ' · external link'
  );
end;
$$;

create or replace function public.apply_hr_document_signature_by_token(
  p_token uuid,
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

  v_recipient := public._hr_signing_recipient_for_token(p_token);

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
    v_recipient.email || ' · external link'
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

create or replace function public.decline_hr_document_signature_by_token(
  p_token uuid,
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
  v_recipient := public._hr_signing_recipient_for_token(p_token);

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
    coalesce(nullif(trim(p_reason), ''), v_recipient.email) || ' · external link'
  );

  return jsonb_build_object(
    'document_id', v_recipient.document_id,
    'signature_status', 'declined'
  );
end;
$$;

-- Revoke tokens when an envelope is voided.
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

    update public.hr_document_recipients
    set token_revoked_at = v_now
    where signature_id = v_sig_id
      and token_revoked_at is null;
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

revoke all on function public._hr_signing_recipient_for_token(uuid) from public;

grant execute on function public.get_hr_signing_package_by_token(uuid) to anon, authenticated;
grant execute on function public.record_hr_document_signature_view_by_token(uuid) to anon, authenticated;
grant execute on function public.apply_hr_document_signature_by_token(uuid, text, text, text, text) to anon, authenticated;
grant execute on function public.decline_hr_document_signature_by_token(uuid, text) to anon, authenticated;
