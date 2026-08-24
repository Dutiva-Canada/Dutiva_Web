-- Advisor Memory facts — production persistence beyond ModeGate.
--
-- WHY NOT reuse public.advisor_memories:
--   That table stores preference / org-context blobs (memory_type, title,
--   content, importance) for a different product path. The Memory UI model is
--   one row = one governed fact (scope, entity, confidence, visibility,
--   provenance) — see src/data/types.ts MemoryFact and the Advisor Memory
--   handoff. Stretching advisor_memories would corrupt both shapes.
--
-- OUT OF SCOPE THIS MIGRATION: case timeline narratives, chat-recall
-- transcripts, auto-extraction, Advisor engine retrieval injection.

create table if not exists public.hr_advisor_memory_facts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  scope text not null check (scope in ('person', 'case', 'thread')),
  entity_id text not null,
  category text not null check (
    category in (
      'employment',
      'compensation',
      'matter',
      'record',
      'note',
      'case',
      'conversation'
    )
  ),
  statement_en text not null,
  statement_fr text not null,
  confidence text not null default 'inferred'
    check (confidence in ('confirmed', 'inferred')),
  source_type text not null
    check (source_type in ('hris', 'document', 'chat', 'manual', 'inference', 'case')),
  source_detail_en text not null default '',
  source_detail_fr text not null default '',
  learned_at timestamptz not null default timezone('utc', now()),
  confirmed_at timestamptz,
  visibility text not null default 'hr'
    check (visibility in ('hr', 'case', 'restricted')),
  sensitive boolean not null default false,
  forgotten_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint hr_advisor_memory_facts_confirmed_coherence check (
    (confidence = 'inferred' and confirmed_at is null)
    or (confidence = 'confirmed')
  )
);

create index if not exists hr_advisor_memory_facts_org_idx
  on public.hr_advisor_memory_facts (organization_id)
  where forgotten_at is null;

create index if not exists hr_advisor_memory_facts_entity_idx
  on public.hr_advisor_memory_facts (organization_id, scope, entity_id)
  where forgotten_at is null;

alter table public.hr_advisor_memory_facts enable row level security;

create policy "Org members can view memory facts"
  on public.hr_advisor_memory_facts for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can insert memory facts"
  on public.hr_advisor_memory_facts for insert
  with check (public.is_org_admin(organization_id, (select auth.uid())));

create policy "Org admins can update memory facts"
  on public.hr_advisor_memory_facts for update
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));

create policy "Org admins can delete memory facts"
  on public.hr_advisor_memory_facts for delete
  using (public.is_org_admin(organization_id, (select auth.uid())));

create table if not exists public.hr_advisor_memory_audit (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  fact_id uuid not null references public.hr_advisor_memory_facts(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('confirm', 'correct', 'forget', 'create')),
  statement_en text not null,
  statement_fr text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists hr_advisor_memory_audit_org_idx
  on public.hr_advisor_memory_audit (organization_id, created_at desc);

alter table public.hr_advisor_memory_audit enable row level security;

create policy "Org members can view memory audit"
  on public.hr_advisor_memory_audit for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can insert memory audit"
  on public.hr_advisor_memory_audit for insert
  with check (public.is_org_admin(organization_id, (select auth.uid())));

comment on table public.hr_advisor_memory_facts is
  'Advisor Memory governed facts (one row = one fact). Soft-forget via forgotten_at.';
comment on table public.hr_advisor_memory_audit is
  'Append-only audit of create/confirm/correct/forget on hr_advisor_memory_facts.';
