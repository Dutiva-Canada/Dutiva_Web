-- Case Memory narratives + timeline (production resume surface).
-- Complements hr_advisor_memory_facts (0086). Facts stay one-row-one-fact;
-- narratives hold the running summary / resume / what-changed / next-steps
-- and an append-only session timeline.

create table if not exists public.hr_advisor_case_narratives (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  case_id uuid not null references public.hr_cases(id) on delete cascade,
  summary_en text not null default '',
  summary_fr text not null default '',
  resume_since_en text not null default '',
  resume_since_fr text not null default '',
  changed jsonb not null default '[]'::jsonb,
  next_steps jsonb not null default '[]'::jsonb,
  last_activity_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint hr_advisor_case_narratives_org_case_unique unique (organization_id, case_id),
  constraint hr_advisor_case_narratives_changed_is_array check (jsonb_typeof(changed) = 'array'),
  constraint hr_advisor_case_narratives_next_steps_is_array check (jsonb_typeof(next_steps) = 'array')
);

create index if not exists hr_advisor_case_narratives_org_idx
  on public.hr_advisor_case_narratives (organization_id);

alter table public.hr_advisor_case_narratives enable row level security;

create policy "Org members can view case narratives"
  on public.hr_advisor_case_narratives for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can insert case narratives"
  on public.hr_advisor_case_narratives for insert
  with check (public.is_org_admin(organization_id, (select auth.uid())));

create policy "Org admins can update case narratives"
  on public.hr_advisor_case_narratives for update
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));

create policy "Org admins can delete case narratives"
  on public.hr_advisor_case_narratives for delete
  using (public.is_org_admin(organization_id, (select auth.uid())));

create table if not exists public.hr_advisor_case_timeline_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  case_id uuid not null references public.hr_cases(id) on delete cascade,
  occurred_at timestamptz not null default timezone('utc', now()),
  session_label_en text not null default '',
  session_label_fr text not null default '',
  body_en text not null,
  body_fr text not null,
  source text not null default 'manual'
    check (source in ('manual', 'note', 'system', 'chat', 'status', 'memory')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists hr_advisor_case_timeline_case_idx
  on public.hr_advisor_case_timeline_events (organization_id, case_id, occurred_at desc);

alter table public.hr_advisor_case_timeline_events enable row level security;

create policy "Org members can view case timeline"
  on public.hr_advisor_case_timeline_events for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can insert case timeline"
  on public.hr_advisor_case_timeline_events for insert
  with check (public.is_org_admin(organization_id, (select auth.uid())));

create policy "Org admins can delete case timeline"
  on public.hr_advisor_case_timeline_events for delete
  using (public.is_org_admin(organization_id, (select auth.uid())));

comment on table public.hr_advisor_case_narratives is
  'Advisor Memory case resume summary (one row per case).';
comment on table public.hr_advisor_case_timeline_events is
  'Append-only Advisor Memory case timeline events.';
