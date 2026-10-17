-- 0240 — muted headline sources
--
-- invest_news_source_mutes — publisher names a user no longer wants in the
-- headline feed. A preference, not a content claim: rows are user-owned and
-- the portal hides matching sources on read; nothing is deleted from
-- invest_market_news, so unmuting restores instantly.
--
-- Rollback (manual):
--   drop table if exists public.invest_news_source_mutes;

create table if not exists public.invest_news_source_mutes (
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, source)
);

alter table public.invest_news_source_mutes enable row level security;

drop policy if exists invest_news_source_mutes_owner on public.invest_news_source_mutes;
create policy invest_news_source_mutes_owner on public.invest_news_source_mutes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
