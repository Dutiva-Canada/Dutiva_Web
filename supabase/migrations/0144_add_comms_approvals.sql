create table if not exists public.comms_approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  content_item_id uuid not null,
  approver text not null,
  policy_version text,
  decision text not null
    constraint comms_approvals_decision_check
      check (decision in ('approved', 'rejected', 'changes_requested')),
  rationale jsonb,
  decided_at text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comms_approvals_organization_id_idx
  on public.comms_approvals (organization_id);
create index if not exists comms_approvals_content_item_id_idx
  on public.comms_approvals (content_item_id);

alter table public.comms_approvals enable row level security;

create policy "Org members can view approvals"
  on public.comms_approvals for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can manage approvals"
  on public.comms_approvals for all
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));
