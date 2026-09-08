-- Onboarding checklist tasks per employee. Basic HR tracking for task name,
-- due date, completion state, and assignee. Not a full talent system.

create table if not exists public.hr_onboarding_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  title text not null,
  due_date date,
  completed boolean not null default false,
  completed_at timestamptz,
  assignee_employee_id uuid references public.employees(id) on delete set null,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hr_onboarding_tasks_organization_id_idx
  on public.hr_onboarding_tasks (organization_id);
create index if not exists hr_onboarding_tasks_employee_id_idx
  on public.hr_onboarding_tasks (employee_id);

alter table public.hr_onboarding_tasks enable row level security;

create policy "Org members can view onboarding tasks"
  on public.hr_onboarding_tasks for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can manage onboarding tasks"
  on public.hr_onboarding_tasks for all
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));
