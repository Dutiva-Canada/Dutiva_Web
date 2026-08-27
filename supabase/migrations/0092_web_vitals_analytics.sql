-- Web Vitals (LCP, INP, CLS, TTFB, FCP) for marketing pages — first-party,
-- consent-gated, routed through support-analytics-event (same sink as Help
-- Centre events). See src/lib/webVitals.ts and docs/SUPPORT_ANALYTICS.md.

alter table public.support_analytics_events
  drop constraint if exists support_analytics_events_event_type_check;

alter table public.support_analytics_events
  add constraint support_analytics_events_event_type_check
  check (event_type in (
    'helpfulness_vote',
    'help_search',
    'help_article_view',
    'ticket_submitted',
    'ticket_status_changed',
    'web_vital'
  ));

alter table public.support_analytics_events
  add column if not exists web_vital_name text,
  add column if not exists web_vital_value numeric,
  add column if not exists web_vital_rating text
    check (web_vital_rating is null or web_vital_rating in ('good', 'needs-improvement', 'poor')),
  add column if not exists page_path text;

alter table public.support_analytics_events
  drop constraint if exists support_analytics_events_web_vital_fields_check;

alter table public.support_analytics_events
  add constraint support_analytics_events_web_vital_fields_check
  check (
    event_type <> 'web_vital'
    or (
      web_vital_name is not null
      and web_vital_value is not null
      and page_path is not null
    )
  );

create index if not exists support_analytics_events_web_vital_idx
  on public.support_analytics_events (web_vital_name, occurred_at desc)
  where event_type = 'web_vital';

-- Extend the atomic ingest RPC so web_vital rows land with their metric fields.
create or replace function public.ingest_support_analytics_events(
  p_ip_hash        text,
  p_events         jsonb,
  p_window_seconds integer,
  p_limit          integer
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_since timestamptz := now() - make_interval(secs => greatest(p_window_seconds, 1));
  v_incoming integer := coalesce(jsonb_array_length(p_events), 0);
  v_used integer;
begin
  if v_incoming = 0 then
    return 'ok';
  end if;

  perform pg_advisory_xact_lock(hashtext(coalesce(p_ip_hash, '')));

  delete from public.support_analytics_rate_limit where created_at < v_since;

  select coalesce(sum(event_count), 0) into v_used
    from public.support_analytics_rate_limit
    where ip_hash = p_ip_hash and created_at >= v_since;

  if v_used + v_incoming > greatest(p_limit, 1) then
    return 'rate_limited';
  end if;

  insert into public.support_analytics_rate_limit (ip_hash, event_count)
  values (p_ip_hash, v_incoming);

  insert into public.support_analytics_events (
    event_type, workspace_id, anonymous_visitor_id, article_slug, search_query,
    search_result_count, vote_value, ticket_reference, ticket_category,
    ticket_source, locale, occurred_at, web_vital_name, web_vital_value,
    web_vital_rating, page_path
  )
  select
    e->>'event_type',
    nullif(e->>'workspace_id', '')::uuid,
    e->>'anonymous_visitor_id',
    e->>'article_slug',
    e->>'search_query',
    nullif(e->>'search_result_count', '')::integer,
    e->>'vote_value',
    e->>'ticket_reference',
    e->>'ticket_category',
    e->>'ticket_source',
    e->>'locale',
    (e->>'occurred_at')::timestamptz,
    e->>'web_vital_name',
    nullif(e->>'web_vital_value', '')::numeric,
    e->>'web_vital_rating',
    e->>'page_path'
  from jsonb_array_elements(p_events) as e;

  return 'ok';
end;
$$;
