-- Document save + signature-send usage limits (organization-scoped).
--
-- First repository save (hr_generated_documents INSERT) and first signature
-- envelope send (hr_document_signatures INSERT) each consume one unit.
-- Edits and re-saves do not double-count — uniqueness is (kind, resource_id).
--
-- Limits mirror src/config/planEntitlements.ts:
--   savedDocuments:     free 5 lifetime; starter 20 / growth 100 / pro 300 per UTC month
--   signatureEnvelopes: free 1 lifetime; starter 5 / growth 25 / pro 100 per UTC month
--
-- Enforcement is via BEFORE INSERT triggers that call claim_* RPCs. Clients that
-- insert outside those tables must call the RPCs first; raising
-- plan_limit:saved_documents / plan_limit:signature_envelopes (errcode P0001).
--
-- Depends on 0107 (org billing) and 0108 (organization_effective_plan).
--
-- ROLLBACK:
--   drop trigger if exists hr_generated_documents_claim_save
--     on public.hr_generated_documents;
--   drop trigger if exists hr_document_signatures_claim_send
--     on public.hr_document_signatures;
--   drop function if exists public.trg_claim_document_save();
--   drop function if exists public.trg_claim_signature_send();
--   drop function if exists public.claim_document_save(uuid, uuid);
--   drop function if exists public.claim_signature_send(uuid, uuid);
--   drop function if exists public.organization_usage_limit(text, text);
--   drop table if exists public.organization_usage_events;

-- ── 1. Event ledger (unique per kind + resource → first-save / first-send) ─
create table if not exists public.organization_usage_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  kind text not null check (kind in ('document_save', 'signature_send')),
  created_at timestamptz not null default timezone('utc', now()),
  actor_user_id uuid references auth.users (id) on delete set null,
  resource_id uuid not null,
  unique (kind, resource_id)
);

create index if not exists organization_usage_events_org_kind_created_idx
  on public.organization_usage_events (organization_id, kind, created_at desc);

alter table public.organization_usage_events enable row level security;

create policy "Deny client API access"
  on public.organization_usage_events
  for all
  to anon, authenticated
  using (false)
  with check (false);

revoke all on table public.organization_usage_events from anon, authenticated;
grant all on table public.organization_usage_events to service_role;

-- ── 2. Limit helper (mirrors planEntitlements savedDocuments / signatures) ─
create or replace function public.organization_usage_limit(
  p_plan text,
  p_kind text
) returns integer
language plpgsql
immutable
set search_path = public
as $$
declare
  v_plan text := coalesce(p_plan, 'free');
begin
  if v_plan not in ('free', 'starter', 'growth', 'pro') then
    v_plan := 'free';
  end if;

  if p_kind = 'document_save' then
    return case v_plan
      when 'free' then 5
      when 'starter' then 20
      when 'growth' then 100
      when 'pro' then 300
    end;
  elsif p_kind = 'signature_send' then
    return case v_plan
      when 'free' then 1
      when 'starter' then 5
      when 'growth' then 25
      when 'pro' then 100
    end;
  end if;

  raise exception 'unknown usage kind: %', p_kind
    using errcode = '22023';
end;
$$;

revoke all on function public.organization_usage_limit(text, text)
  from public, anon;
grant execute on function public.organization_usage_limit(text, text)
  to authenticated, service_role;

-- ── 3. claim_document_save — first save only ────────────────────────────────
create or replace function public.claim_document_save(
  p_organization_id uuid,
  p_document_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_limit integer;
  v_used integer;
  v_month_start timestamptz;
  v_actor uuid := auth.uid();
  v_id uuid;
begin
  if p_organization_id is null or p_document_id is null then
    raise exception 'organization_id and document_id required'
      using errcode = '22023';
  end if;

  if coalesce(auth.role(), '') is distinct from 'service_role'
     and (
       v_actor is null
       or not public.is_org_member(p_organization_id, v_actor)
     )
  then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(
    hashtext('org_usage:document_save:' || p_organization_id::text)
  );

  -- Idempotent: same document never double-counts.
  if exists (
    select 1
      from public.organization_usage_events
      where kind = 'document_save'
        and resource_id = p_document_id
  ) then
    return jsonb_build_object(
      'allowed', true,
      'already_counted', true,
      'resource_id', p_document_id
    );
  end if;

  v_plan := public.organization_effective_plan(p_organization_id);
  v_limit := public.organization_usage_limit(v_plan, 'document_save');

  if v_plan = 'free' then
    select count(*) into v_used
      from public.organization_usage_events
      where organization_id = p_organization_id
        and kind = 'document_save';
  else
    v_month_start := date_trunc('month', timezone('utc', now())) at time zone 'utc';
    select count(*) into v_used
      from public.organization_usage_events
      where organization_id = p_organization_id
        and kind = 'document_save'
        and created_at >= v_month_start;
  end if;

  if coalesce(v_used, 0) >= greatest(v_limit, 0) then
    raise exception 'plan_limit:saved_documents'
      using errcode = 'P0001',
            detail = format('used=%s limit=%s plan=%s', v_used, v_limit, v_plan);
  end if;

  insert into public.organization_usage_events (
    organization_id, kind, actor_user_id, resource_id
  )
  values (
    p_organization_id, 'document_save', v_actor, p_document_id
  )
  on conflict (kind, resource_id) do nothing
  returning id into v_id;

  -- Race: concurrent insert of same resource won the unique race.
  if v_id is null and exists (
    select 1 from public.organization_usage_events
    where kind = 'document_save' and resource_id = p_document_id
  ) then
    return jsonb_build_object(
      'allowed', true,
      'already_counted', true,
      'resource_id', p_document_id
    );
  end if;

  if v_id is null then
    raise exception 'plan_limit:saved_documents'
      using errcode = 'P0001';
  end if;

  return jsonb_build_object(
    'allowed', true,
    'already_counted', false,
    'used', coalesce(v_used, 0) + 1,
    'limit', v_limit,
    'event_id', v_id
  );
end;
$$;

revoke all on function public.claim_document_save(uuid, uuid)
  from public, anon;
grant execute on function public.claim_document_save(uuid, uuid)
  to authenticated, service_role;

-- ── 4. claim_signature_send — first send only ───────────────────────────────
create or replace function public.claim_signature_send(
  p_organization_id uuid,
  p_envelope_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_limit integer;
  v_used integer;
  v_month_start timestamptz;
  v_actor uuid := auth.uid();
  v_id uuid;
begin
  if p_organization_id is null or p_envelope_id is null then
    raise exception 'organization_id and envelope_id required'
      using errcode = '22023';
  end if;

  if coalesce(auth.role(), '') is distinct from 'service_role'
     and (
       v_actor is null
       or not public.is_org_member(p_organization_id, v_actor)
     )
  then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(
    hashtext('org_usage:signature_send:' || p_organization_id::text)
  );

  if exists (
    select 1
      from public.organization_usage_events
      where kind = 'signature_send'
        and resource_id = p_envelope_id
  ) then
    return jsonb_build_object(
      'allowed', true,
      'already_counted', true,
      'resource_id', p_envelope_id
    );
  end if;

  v_plan := public.organization_effective_plan(p_organization_id);
  v_limit := public.organization_usage_limit(v_plan, 'signature_send');

  if v_plan = 'free' then
    select count(*) into v_used
      from public.organization_usage_events
      where organization_id = p_organization_id
        and kind = 'signature_send';
  else
    v_month_start := date_trunc('month', timezone('utc', now())) at time zone 'utc';
    select count(*) into v_used
      from public.organization_usage_events
      where organization_id = p_organization_id
        and kind = 'signature_send'
        and created_at >= v_month_start;
  end if;

  if coalesce(v_used, 0) >= greatest(v_limit, 0) then
    raise exception 'plan_limit:signature_envelopes'
      using errcode = 'P0001',
            detail = format('used=%s limit=%s plan=%s', v_used, v_limit, v_plan);
  end if;

  insert into public.organization_usage_events (
    organization_id, kind, actor_user_id, resource_id
  )
  values (
    p_organization_id, 'signature_send', v_actor, p_envelope_id
  )
  on conflict (kind, resource_id) do nothing
  returning id into v_id;

  if v_id is null and exists (
    select 1 from public.organization_usage_events
    where kind = 'signature_send' and resource_id = p_envelope_id
  ) then
    return jsonb_build_object(
      'allowed', true,
      'already_counted', true,
      'resource_id', p_envelope_id
    );
  end if;

  if v_id is null then
    raise exception 'plan_limit:signature_envelopes'
      using errcode = 'P0001';
  end if;

  return jsonb_build_object(
    'allowed', true,
    'already_counted', false,
    'used', coalesce(v_used, 0) + 1,
    'limit', v_limit,
    'event_id', v_id
  );
end;
$$;

revoke all on function public.claim_signature_send(uuid, uuid)
  from public, anon;
grant execute on function public.claim_signature_send(uuid, uuid)
  to authenticated, service_role;

-- ── 5. Triggers — first-save / first-send semantics on INSERT ───────────────
-- hr_generated_documents INSERT = first repository save (createDocument).
-- Subsequent version/audit updates do not touch this table's PK insert.
create or replace function public.trg_claim_document_save()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.claim_document_save(new.organization_id, new.id);
  return new;
end;
$$;

drop trigger if exists hr_generated_documents_claim_save
  on public.hr_generated_documents;
create trigger hr_generated_documents_claim_save
  before insert on public.hr_generated_documents
  for each row
  execute function public.trg_claim_document_save();

-- hr_document_signatures INSERT = first send (sendDocumentForSignature).
-- Status transitions afterward do not re-insert the envelope row.
create or replace function public.trg_claim_signature_send()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.claim_signature_send(new.organization_id, new.id);
  return new;
end;
$$;

drop trigger if exists hr_document_signatures_claim_send
  on public.hr_document_signatures;
create trigger hr_document_signatures_claim_send
  before insert on public.hr_document_signatures
  for each row
  execute function public.trg_claim_signature_send();

revoke all on function public.trg_claim_document_save() from public, anon, authenticated;
revoke all on function public.trg_claim_signature_send() from public, anon, authenticated;
grant execute on function public.trg_claim_document_save() to service_role;
grant execute on function public.trg_claim_signature_send() to service_role;
