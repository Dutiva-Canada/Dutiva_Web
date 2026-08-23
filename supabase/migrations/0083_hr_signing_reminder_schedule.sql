-- Signing invite reminders + automatic next-signer emails after partial completion.
--
-- WHY: Turn-aware invites only reach the current signer; reminders nudge stale
-- turn-holders, and pg_net notifies the next signer when someone completes.
--
-- ROLLBACK:
--   select cron.unschedule('signing-reminder-sweep');
--   drop function if exists public.signing_reminder_scheduler_status();
--   drop function if exists public.trigger_signing_reminder_scheduler();
--   drop function if exists public.hr_signing_recipients_needing_reminder();
--   drop function if exists public._hr_signing_notify_next_signer(uuid);
--   alter table public.hr_document_recipients drop column if exists last_reminder_sent_at;

alter table public.hr_document_recipients
  add column if not exists last_reminder_sent_at timestamptz;

create index if not exists hr_document_recipients_reminder_idx
  on public.hr_document_recipients (last_invite_sent_at)
  where last_invite_sent_at is not null
    and status in ('pending', 'sent', 'viewed');

-- Fire-and-forget next-signer invite after a partial signature (service role + shared secret).
create or replace function public._hr_signing_notify_next_signer(p_document_id uuid)
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
    url := 'https://khtwpxnvziiyplaflwru.supabase.co/functions/v1/send-signing-invite',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(v_key, ''),
      'x-trigger-secret', v_secret
    ),
    body := jsonb_build_object(
      'organization_id', v_org_id,
      'document_id', p_document_id,
      'turn_only', true,
      'auto_after_signature', true
    ),
    timeout_milliseconds := 30000
  );
end;
$$;

revoke execute on function public._hr_signing_notify_next_signer(uuid) from public, anon, authenticated;
grant execute on function public._hr_signing_notify_next_signer(uuid) to service_role;

-- Recipients on turn whose initial invite is stale and no recent reminder was sent.
create or replace function public.hr_signing_recipients_needing_reminder()
returns table (
  recipient_id uuid,
  organization_id uuid,
  document_id uuid
)
language sql
security definer
set search_path = public
stable
as $$
  with active as (
    select
      r.id,
      r.organization_id,
      r.document_id,
      r.signing_order,
      r.last_invite_sent_at,
      r.last_reminder_sent_at,
      r.invite_delivery_status,
      min(r.signing_order) over (partition by r.signature_id) as turn_order
    from public.hr_document_recipients r
    join public.hr_generated_documents d on d.id = r.document_id
    join public.hr_document_signatures s on s.id = r.signature_id
    where r.status in ('pending', 'sent', 'viewed')
      and r.token_revoked_at is null
      and (r.token_expires_at is null or r.token_expires_at > now())
      and r.last_invite_sent_at is not null
      and r.last_invite_sent_at < now() - interval '3 days'
      and (r.last_reminder_sent_at is null or r.last_reminder_sent_at < now() - interval '3 days')
      and coalesce(r.invite_delivery_status, '') not in ('bounced', 'complained')
      and d.signature_status in ('sent', 'viewed', 'pending', 'partially_signed')
      and s.status in ('sent', 'viewed', 'pending', 'partially_signed')
  )
  select id, organization_id, document_id
  from active
  where signing_order = turn_order;
$$;

revoke execute on function public.hr_signing_recipients_needing_reminder() from public, anon, authenticated;
grant execute on function public.hr_signing_recipients_needing_reminder() to service_role;

-- Patch apply_hr_document_signature to notify the next signer when still partial.
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

create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.trigger_signing_reminder_scheduler() returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_key text;
  v_secret text;
begin
  select decrypted_secret into v_key
    from vault.decrypted_secrets
   where name = 'support_scheduler_service_key';
  select decrypted_secret into v_secret
    from vault.decrypted_secrets
   where name = 'support_notify_secret';

  if v_secret is null or length(btrim(v_secret)) = 0 then
    raise warning '[signing-reminder-scheduler] vault secret "support_notify_secret" is not set; skipping run';
    return;
  end if;

  perform net.http_post(
    url := 'https://khtwpxnvziiyplaflwru.supabase.co/functions/v1/signing-reminder-scheduler',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(v_key, ''),
      'x-trigger-secret', v_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
end;
$$;

revoke execute on function public.trigger_signing_reminder_scheduler() from public, anon, authenticated;
grant execute on function public.trigger_signing_reminder_scheduler() to service_role;

create or replace function public.signing_reminder_scheduler_status()
returns table (
  secret_configured boolean,
  job_scheduled boolean,
  awaiting_reminder bigint,
  last_reminder_sent timestamptz
)
language sql
security definer
set search_path = pg_catalog, public
as $$
  select
    exists (select 1 from vault.decrypted_secrets where name = 'support_notify_secret'),
    exists (select 1 from cron.job where jobname = 'signing-reminder-sweep' and active),
    (select count(*) from public.hr_signing_recipients_needing_reminder()),
    (select max(last_reminder_sent_at) from public.hr_document_recipients);
$$;

revoke execute on function public.signing_reminder_scheduler_status() from public, anon, authenticated;
grant execute on function public.signing_reminder_scheduler_status() to service_role;

do $$
begin
  perform cron.unschedule('signing-reminder-sweep');
exception
  when others then null;
end;
$$;

select cron.schedule(
  'signing-reminder-sweep',
  '0 */6 * * *',
  $$select public.trigger_signing_reminder_scheduler();$$
);
