-- Admin signing-status emails, signing-link reissue, and helper to resolve org admin mailboxes.
--
-- ROLLBACK:
--   drop function if exists public.reissue_hr_document_signing_token(uuid);
--   drop function if exists public._hr_signing_notify_admins(uuid, text);
--   drop function if exists public._hr_org_admin_emails(uuid);

create or replace function public._hr_org_admin_emails(p_org_id uuid)
returns setof text
language sql
security definer
set search_path = public
stable
as $$
  select distinct coalesce(nullif(btrim(p.account_email), ''), u.email::text)
  from public.organization_members om
  join auth.users u on u.id = om.user_id
  left join public.profiles p on p.id = om.user_id
  where om.organization_id = p_org_id
    and om.status = 'active'
    and om.role in ('owner', 'admin')
    and coalesce(nullif(btrim(p.account_email), ''), u.email::text) is not null;
$$;

revoke execute on function public._hr_org_admin_emails(uuid) from public, anon, authenticated;
grant execute on function public._hr_org_admin_emails(uuid) to service_role;

create or replace function public._hr_signing_notify_admins(
  p_document_id uuid,
  p_event text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_org_id uuid;
  v_key text;
  v_secret text;
begin
  if p_event not in ('completed', 'declined') then
    return;
  end if;

  select organization_id into v_org_id
  from public.hr_generated_documents
  where id = p_document_id;

  if v_org_id is null then
    return;
  end if;

  select decrypted_secret into v_key
    from vault.decrypted_secrets
   where name = 'support_scheduler_service_key';
  select decrypted_secret into v_secret
    from vault.decrypted_secrets
   where name = 'support_notify_secret';

  if v_secret is null or length(btrim(v_secret)) = 0 then
    return;
  end if;

  perform net.http_post(
    url := 'https://khtwpxnvziiyplaflwru.supabase.co/functions/v1/notify-signing-status',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(v_key, ''),
      'x-trigger-secret', v_secret
    ),
    body := jsonb_build_object(
      'organization_id', v_org_id,
      'document_id', p_document_id,
      'event', p_event
    ),
    timeout_milliseconds := 30000
  );
end;
$$;

revoke execute on function public._hr_signing_notify_admins(uuid, text) from public, anon, authenticated;
grant execute on function public._hr_signing_notify_admins(uuid, text) to service_role;

create or replace function public.reissue_hr_document_signing_token(p_recipient_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient public.hr_document_recipients;
  v_sig_status text;
  v_new_token uuid := gen_random_uuid();
  v_expires timestamptz := now() + interval '30 days';
  v_now timestamptz := now();
begin
  select r.*
  into v_recipient
  from public.hr_document_recipients r
  where r.id = p_recipient_id;

  if not found then
    raise exception 'Recipient not found';
  end if;

  select status into v_sig_status
  from public.hr_document_signatures
  where id = v_recipient.signature_id;

  if not public.is_org_admin(v_recipient.organization_id, auth.uid()) then
    raise exception 'Only organization admins can reissue signing links';
  end if;

  if v_sig_status in ('signed', 'voided') then
    raise exception 'Cannot reissue links on a completed or voided envelope';
  end if;

  if v_recipient.status in ('signed', 'declined') then
    raise exception 'Recipient has already finished this envelope';
  end if;

  update public.hr_document_recipients
  set signing_token = v_new_token,
      token_expires_at = v_expires,
      token_revoked_at = null,
      last_invite_sent_at = null,
      last_reminder_sent_at = null,
      invite_provider_message_id = null,
      invite_delivery_status = null,
      invite_delivery_detail = null,
      invite_delivery_updated_at = null
  where id = p_recipient_id;

  insert into public.hr_document_audit_events (
    organization_id, document_id, event_type, actor_label, meta
  )
  values (
    v_recipient.organization_id,
    v_recipient.document_id,
    'signing_link_reissued',
    coalesce((select auth.jwt() ->> 'email'), 'Admin'),
    v_recipient.email
  );

  return jsonb_build_object(
    'recipient_id', p_recipient_id,
    'signing_token', v_new_token,
    'token_expires_at', v_expires
  );
end;
$$;

revoke execute on function public.reissue_hr_document_signing_token(uuid) from public, anon;
grant execute on function public.reissue_hr_document_signing_token(uuid) to authenticated;

-- Patch signing RPCs to notify org admins on completion or decline.
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
    perform public._hr_signing_notify_admins(v_recipient.document_id, 'completed');
  end if;

  if not v_all_signed and v_some_signed then
    perform public._hr_signing_notify_next_signer(v_recipient.document_id);
  end if;

  return jsonb_build_object(
    'document_id', v_recipient.document_id,
    'signature_status', v_signature_status
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
    perform public._hr_signing_notify_admins(v_recipient.document_id, 'completed');
  end if;

  if not v_all_signed and v_some_signed then
    perform public._hr_signing_notify_next_signer(v_recipient.document_id);
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

  perform public._hr_signing_notify_admins(v_recipient.document_id, 'declined');

  return jsonb_build_object(
    'document_id', v_recipient.document_id,
    'signature_status', 'declined'
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

  perform public._hr_signing_notify_admins(v_recipient.document_id, 'declined');

  return jsonb_build_object(
    'document_id', v_recipient.document_id,
    'signature_status', 'declined'
  );
end;
$$;
