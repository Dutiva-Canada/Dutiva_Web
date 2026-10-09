-- 0198_agent_suggestions.sql
--
-- Durable review queue for agent-produced work across every surface.
-- Today's AI features return suggestions that vanish on refresh; this table
-- makes them rows: an agent proposes, a human approves or dismisses, and the
-- resolution is recorded — the proposed → reviewed → resolved loop that
-- lets more of the desk run unattended while humans keep the veto.
--
--   surface   — which portal filed it ('pr' | 'health' | 'invest' | 'app')
--   kind      — the artifact shape ('pitch' | 'geo_prompt' | 'habit' | ...)
--   title     — one-line human label for the review list
--   payload   — the suggested artifact (subject+body, prompt text, ...)
--   source    — provenance: 'model' | 'cron' | 'rule'
--   status    — 'pending' → 'accepted' | 'dismissed'
--   dedupe_key — optional; at most one PENDING row per (user, surface, kind,
--                dedupe_key) so re-running a feature can't pile up identical
--                suggestions. NULL means "always a new row".
--
-- Write paths are asymmetric on purpose:
--   INSERT — service role only (edge functions filing after a model call)
--   UPDATE — owner, restricted to the three resolution columns via column
--            grants, so a client can resolve a row but never rewrite the
--            agent's proposal or its provenance
--   SELECT — owner
--
-- ROLLBACK:
--   drop table if exists public.agent_suggestions;

create table if not exists public.agent_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  surface text not null check (surface in ('pr','health','invest','app')),
  kind text not null,
  title text not null,
  payload jsonb not null default '{}'::jsonb,
  source text not null default 'model' check (source in ('model','cron','rule')),
  status text not null default 'pending' check (status in ('pending','accepted','dismissed')),
  dedupe_key text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_action text
);

comment on table public.agent_suggestions is
  'Agent-produced work awaiting human review — approve or dismiss; the resolution is the audit trail.';

/* One pending suggestion per dedupe key; resolved rows never block a new
   proposal for the same thing. */
create unique index if not exists agent_suggestions_pending_dedupe
  on public.agent_suggestions (user_id, surface, kind, dedupe_key)
  where status = 'pending' and dedupe_key is not null;

create index if not exists agent_suggestions_user_pending_idx
  on public.agent_suggestions (user_id, surface, status, created_at desc);

alter table public.agent_suggestions enable row level security;

create policy "Users read their own agent_suggestions"
  on public.agent_suggestions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users resolve their own agent_suggestions"
  on public.agent_suggestions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

/* No authenticated INSERT/DELETE — only edge functions (service role) file
   suggestions. The UPDATE policy is paired with a column grant so resolving
   a row can't touch title/payload/source. */
revoke all on public.agent_suggestions from authenticated;
grant select on public.agent_suggestions to authenticated;
grant update (status, resolved_at, resolved_action)
  on public.agent_suggestions to authenticated;

/* 'pr_coverage_alert' joins the notification kinds — the negative-coverage
   interrupt sends immediately at ingest rather than waiting for the daily
   digest, but dedupes to one alert email per user per day like the rest. */
alter table public.notification_log
  drop constraint if exists notification_log_kind_check;
alter table public.notification_log
  add constraint notification_log_kind_check
    check (kind in ('pr_coverage','pr_coverage_alert','health_streak_risk'));
