-- Harden Dutiva Signature: public /sign RPC rate limits, configurable reminder
-- interval, and in-app admin notifications on complete/decline.
--
-- ROLLBACK:
--   drop function if exists public.mark_hr_workspace_notification_read(uuid);
--   drop function if exists public.mark_all_hr_workspace_notifications_read();
--   drop function if exists public._hr_signing_insert_admin_notifications(uuid, text);
--   drop function if exists public._hr_signing_check_rate_limit(text, integer, integer);
--   drop function if exists public._hr_signing_request_ip_hash();
--   drop table if exists public.hr_workspace_notifications;
--   drop table if exists public.hr_signing_rpc_rate_limit;
--   alter table public.organizations drop column if exists signing_reminder_days;

-- ── Rate-limit table for anon signing RPCs ─────────────────────────────────
create table if not exists public.hr_signing_rpc_rate_limit (
  id bigint generated always as identity primary key,
  bucket_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists hr_signing_rpc_rate_limit_bucket_idx
  on public.hr_signing_rpc_rate_limit (bucket_key, created_at);

create index if not exists hr_signing_rpc_rate_limit_created_idx
  on public.hr_signing_rpc_rate_limit (created_at);

alter table public.hr_signing_rpc_rate_limit enable row level security;

create or replace function public._hr_signing_request_ip_hash()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_headers jsonb;
  v_ip text;
begin
  begin
    v_headers := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    v_headers := null;
  end;

  v_ip := nullif(btrim(coalesce(
    v_headers->>'cf-connecting-ip',
    split_part(coalesce(v_headers->>'x-forwarded-for', ''), ',', 1),
    v_headers->>'x-real-ip',
    ''
  )), '');

  if v_ip is null then
    return 'unknown';
  end if;

  return encode(extensions.digest(v_ip, 'sha256'), 'hex');
exception when others then
  return 'unknown';
end;
$$;

revoke execute on function public._hr_signing_request_ip_hash() from public, anon, authenticated;
grant execute on function public._hr_signing_request_ip_hash() to service_role;

create or replace function public._hr_signing_check_rate_limit(
  p_bucket text,
  p_window_seconds integer,
  p_limit integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_since timestamptz := now() - make_interval(secs => greatest(p_window_seconds, 1));
  v_count integer;
  v_key text := left(coalesce(nullif(btrim(p_bucket), ''), 'empty'), 200);
begin
  perform pg_advisory_xact_lock(hashtext(v_key));

  delete from public.hr_signing_rpc_rate_limit where created_at < v_since;

  select count(*) into v_count
  from public.hr_signing_rpc_rate_limit
  where bucket_key = v_key and created_at >= v_since;

  if v_count >= greatest(p_limit, 1) then
    raise exception 'Too many signing requests. Please try again shortly.';
  end if;

  insert into public.hr_signing_rpc_rate_limit (bucket_key) values (v_key);

  if random() < 0.02 then
    delete from public.hr_signing_rpc_rate_limit
    where created_at < now() - interval '2 hours';
  end if;
end;
$$;

revoke execute on function public._hr_signing_check_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public._hr_signing_check_rate_limit(text, integer, integer)
  to service_role;

-- ── Configurable reminder interval (days) ──────────────────────────────────
alter table public.organizations
  add column if not exists signing_reminder_days integer not null default 3;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'organizations_signing_reminder_days_check'
  ) then
    alter table public.organizations
      add constraint organizations_signing_reminder_days_check
      check (signing_reminder_days between 1 and 14);
  end if;
end $$;

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
      greatest(1, least(14, coalesce(o.signing_reminder_days, 3))) as reminder_days,
      min(r.signing_order) over (partition by r.signature_id) as turn_order
    from public.hr_document_recipients r
    join public.hr_generated_documents d on d.id = r.document_id
    join public.hr_document_signatures s on s.id = r.signature_id
    join public.organizations o on o.id = r.organization_id
    where r.status in ('pending', 'sent', 'viewed')
      and r.token_revoked_at is null
      and (r.token_expires_at is null or r.token_expires_at > now())
      and r.last_invite_sent_at is not null
      and r.last_invite_sent_at < now() - (greatest(1, least(14, coalesce(o.signing_reminder_days, 3))) * interval '1 day')
      and (
        r.last_reminder_sent_at is null
        or r.last_reminder_sent_at < now() - (greatest(1, least(14, coalesce(o.signing_reminder_days, 3))) * interval '1 day')
      )
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

-- ── In-app workspace notifications for org admins ──────────────────────────
create table if not exists public.hr_workspace_notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null
    check (kind in ('signing_completed', 'signing_declined')),
  title_en text not null,
  title_fr text not null,
  body_en text,
  body_fr text,
  href text,
  document_id uuid references public.hr_generated_documents (id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists hr_workspace_notifications_user_idx
  on public.hr_workspace_notifications (user_id, created_at desc);

create index if not exists hr_workspace_notifications_org_idx
  on public.hr_workspace_notifications (organization_id, created_at desc);

alter table public.hr_workspace_notifications enable row level security;

create policy "Users read own workspace notifications"
  on public.hr_workspace_notifications for select
  using (user_id = (select auth.uid()));

create policy "Users update own workspace notifications"
  on public.hr_workspace_notifications for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create or replace function public._hr_signing_insert_admin_notifications(
  p_document_id uuid,
  p_event text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_ref text;
  v_title_en text;
  v_title_fr text;
  v_kind text;
  v_en_title text;
  v_fr_title text;
  v_en_body text;
  v_fr_body text;
begin
  if p_event not in ('completed', 'declined') then
    return;
  end if;

  select organization_id, ref, title_en, title_fr
  into v_org_id, v_ref, v_title_en, v_title_fr
  from public.hr_generated_documents
  where id = p_document_id;

  if v_org_id is null then
    return;
  end if;

  if p_event = 'completed' then
    v_kind := 'signing_completed';
    v_en_title := 'Signing complete';
    v_fr_title := 'Signature terminée';
    v_en_body := coalesce(nullif(btrim(v_title_en), ''), v_ref) || ' — all recipients have signed.';
    v_fr_body := coalesce(nullif(btrim(v_title_fr), ''), nullif(btrim(v_title_en), ''), v_ref)
      || ' — tous les destinataires ont signé.';
  else
    v_kind := 'signing_declined';
    v_en_title := 'Signature declined';
    v_fr_title := 'Signature refusée';
    v_en_body := coalesce(nullif(btrim(v_title_en), ''), v_ref) || ' — a recipient declined to sign.';
    v_fr_body := coalesce(nullif(btrim(v_title_fr), ''), nullif(btrim(v_title_en), ''), v_ref)
      || ' — un destinataire a refusé de signer.';
  end if;

  insert into public.hr_workspace_notifications (
    organization_id, user_id, kind, title_en, title_fr, body_en, body_fr, href, document_id
  )
  select
    v_org_id,
    om.user_id,
    v_kind,
    v_en_title,
    v_fr_title,
    v_en_body,
    v_fr_body,
    '/app/documents/' || p_document_id::text,
    p_document_id
  from public.organization_members om
  where om.organization_id = v_org_id
    and om.status = 'active'
    and om.role in ('owner', 'admin');
end;
$$;

revoke execute on function public._hr_signing_insert_admin_notifications(uuid, text)
  from public, anon, authenticated;
grant execute on function public._hr_signing_insert_admin_notifications(uuid, text)
  to service_role;

grant select, update on public.hr_workspace_notifications to authenticated;

create or replace function public.mark_hr_workspace_notification_read(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.hr_workspace_notifications
  set read_at = coalesce(read_at, now())
  where id = p_id and user_id = auth.uid();
end;
$$;

create or replace function public.mark_all_hr_workspace_notifications_read()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.hr_workspace_notifications
  set read_at = coalesce(read_at, now())
  where user_id = auth.uid() and read_at is null;
end;
$$;

revoke execute on function public.mark_hr_workspace_notification_read(uuid) from public, anon;
grant execute on function public.mark_hr_workspace_notification_read(uuid) to authenticated;
revoke execute on function public.mark_all_hr_workspace_notifications_read() from public, anon;
grant execute on function public.mark_all_hr_workspace_notifications_read() to authenticated;

-- Patch admin notify helper to also write in-app notifications.
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

  perform public._hr_signing_insert_admin_notifications(p_document_id, p_event);

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

-- ── Rate-limit public token RPCs (volatile — writes limiter rows) ──────────
create or replace function public.get_hr_signing_package_by_token(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient public.hr_document_recipients;
  v_sig public.hr_document_signatures;
  v_doc public.hr_generated_documents;
  v_content jsonb;
  v_turn_order integer;
  v_ip text := public._hr_signing_request_ip_hash();
begin
  perform public._hr_signing_check_rate_limit('ip:' || v_ip || ':get', 60, 60);
  perform public._hr_signing_check_rate_limit('token:' || coalesce(p_token::text, 'null') || ':get', 60, 30);

  v_recipient := public._hr_signing_recipient_for_token(p_token);

  select s.* into v_sig from public.hr_document_signatures s where s.id = v_recipient.signature_id;
  select d.* into v_doc from public.hr_generated_documents d where d.id = v_recipient.document_id;
  select v.content_json into v_content from public.hr_document_versions v
    where v.document_id = v_doc.id and v.version_number = v_doc.current_version limit 1;
  select min(signing_order) into v_turn_order from public.hr_document_recipients
    where signature_id = v_recipient.signature_id and status in ('pending', 'sent', 'viewed');

  return jsonb_build_object(
    'document', jsonb_build_object(
      'id', v_doc.id, 'ref', v_doc.ref, 'title_en', v_doc.title_en, 'title_fr', v_doc.title_fr,
      'language', v_doc.language, 'jurisdiction', v_doc.jurisdiction,
      'signature_status', v_doc.signature_status, 'current_version', v_doc.current_version,
      'content', coalesce(v_content, '{}'::jsonb)
    ),
    'recipient', jsonb_build_object(
      'id', v_recipient.id, 'name', v_recipient.name, 'email', v_recipient.email,
      'type', v_recipient.recipient_type, 'order', v_recipient.signing_order, 'status', v_recipient.status
    ),
    'signature', jsonb_build_object(
      'envelope_id', v_sig.external_envelope_id, 'status', v_sig.status, 'content_hash', v_sig.content_hash
    ),
    'turn_order', v_turn_order,
    'recipients', (
      select coalesce(jsonb_agg(
        jsonb_build_object('order', r.signing_order, 'name', r.name, 'email', r.email, 'status', r.status)
        order by r.signing_order
      ), '[]'::jsonb)
      from public.hr_document_recipients r where r.signature_id = v_recipient.signature_id
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
  v_ip text := public._hr_signing_request_ip_hash();
begin
  perform public._hr_signing_check_rate_limit('ip:' || v_ip || ':view', 60, 40);
  perform public._hr_signing_check_rate_limit('token:' || coalesce(p_token::text, 'null') || ':view', 60, 20);

  v_recipient := public._hr_signing_recipient_for_token(p_token);

  if v_recipient.status in ('signed', 'declined') then
    return;
  end if;

  update public.hr_document_recipients
  set status = case when status = 'pending' then 'viewed' else status end,
      viewed_at = coalesce(viewed_at, v_now)
  where id = v_recipient.id and status in ('pending', 'sent', 'viewed');

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
  v_ip text := public._hr_signing_request_ip_hash();
begin
  perform public._hr_signing_check_rate_limit('ip:' || v_ip || ':mutate', 60, 20);
  perform public._hr_signing_check_rate_limit('token:' || coalesce(p_token::text, 'null') || ':mutate', 60, 10);

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

  select bool_and(status = 'signed'), bool_or(status = 'signed')
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
  v_ip text := public._hr_signing_request_ip_hash();
begin
  perform public._hr_signing_check_rate_limit('ip:' || v_ip || ':mutate', 60, 20);
  perform public._hr_signing_check_rate_limit('token:' || coalesce(p_token::text, 'null') || ':mutate', 60, 10);

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
  set status = 'declined', declined_at = v_now
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

grant execute on function public.get_hr_signing_package_by_token(uuid) to anon, authenticated;
grant execute on function public.record_hr_document_signature_view_by_token(uuid) to anon, authenticated;
grant execute on function public.apply_hr_document_signature_by_token(uuid, text, text, text, text) to anon, authenticated;
grant execute on function public.decline_hr_document_signature_by_token(uuid, text) to anon, authenticated;
