-- 0192_dutiva_pr.sql
--
-- Dutiva PR — the standalone, access-gated communications surface at /pr
-- (own auth gate, own layout — the same standalone pattern as the invest and
-- health portals). One working desk for the whole communications function:
-- campaigns, a content/composer desk, a media-contact list, keyword tracking,
-- and a coverage log. Data is per-user, not per-org. Access is invite-only:
-- a row in `pr_access` is the gate.
--
--   pr_access          — user_id → granted_at; presence = access
--   pr_campaigns       — marketing/PR campaigns (channel, status, budget, dates)
--   pr_content_items   — content desk: posts, releases, ad copy, articles, briefs
--   pr_media_contacts  — press/outreach contacts (name, outlet, beat, email)
--   pr_keywords        — SEO keyword tracker (position + previous, for deltas)
--   pr_mentions        — coverage/mentions log (source, title, url, sentiment)
--
-- This surface records and plans communications work — it never publishes,
-- posts, or sends anything itself. Status fields like 'scheduled' describe
-- intent only; no automation acts on them.
--
-- ROLLBACK:
--   drop table if exists public.pr_mentions, public.pr_keywords,
--     public.pr_media_contacts, public.pr_content_items, public.pr_campaigns,
--     public.pr_access;

create table if not exists public.pr_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_by text not null default '',
  note text not null default '',
  granted_at timestamptz not null default now()
);

create table if not exists public.pr_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  channel text not null default 'mixed'
    check (channel in ('mixed','social','search','display','email','press','events','other')),
  status text not null default 'draft'
    check (status in ('draft','active','paused','done')),
  objective text not null default '',
  budget_cad numeric(12,2) check (budget_cad is null or budget_cad >= 0),
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pr_content_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid references public.pr_campaigns(id) on delete set null,
  kind text not null default 'post'
    check (kind in ('post','release','ad','article','brief')),
  title text not null default '',
  body text not null default '',
  channel text not null default '',
  status text not null default 'draft'
    check (status in ('draft','scheduled','published')),
  scheduled_for timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pr_media_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  outlet text not null default '',
  beat text not null default '',
  email text not null default '',
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.pr_keywords (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  keyword text not null,
  target_url text not null default '',
  position smallint check (position is null or position between 1 and 100),
  previous_position smallint check (previous_position is null or previous_position between 1 and 100),
  checked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.pr_mentions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null default '',
  title text not null,
  url text not null default '',
  sentiment text not null default 'neutral'
    check (sentiment in ('positive','neutral','negative')),
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists pr_campaigns_user_idx
  on public.pr_campaigns (user_id, created_at desc);
create index if not exists pr_content_items_user_idx
  on public.pr_content_items (user_id, created_at desc);
create index if not exists pr_content_items_campaign_idx
  on public.pr_content_items (campaign_id) where campaign_id is not null;
create index if not exists pr_media_contacts_user_idx
  on public.pr_media_contacts (user_id, created_at desc);
create index if not exists pr_keywords_user_idx
  on public.pr_keywords (user_id, created_at desc);
create index if not exists pr_mentions_user_idx
  on public.pr_mentions (user_id, published_at desc);

-- pr_access is read-only for its owner (the gate check); grants are
-- inserted by service role / dashboard, not self-served.
alter table public.pr_access enable row level security;
create policy "Users read their own pr access"
  on public.pr_access for select
  using ((select auth.uid()) = user_id);

do $$
declare
  t text;
begin
  foreach t in array array[
    'pr_campaigns', 'pr_content_items', 'pr_media_contacts',
    'pr_keywords', 'pr_mentions'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "Users manage their own %I" on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t, t
    );
  end loop;
end
$$;
