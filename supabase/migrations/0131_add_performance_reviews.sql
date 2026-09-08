-- Performance review records per employee — basic HR tracking for review
-- dates, goals, ratings, and next review. Does not replace a full talent
-- management system.

create table if not exists public.hr_performance_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  review_date date not null,
  reviewer_id uuid references public.employees(id) on delete set null,
  goals text,
  rating text
    constraint hr_performance_reviews_rating_check
      check (rating in ('exceeds', 'meets', 'needs_improvement', 'unrated')),
  notes text,
  next_review_date date,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hr_performance_reviews_organization_id_idx
  on public.hr_performance_reviews (organization_id);
create index if not exists hr_performance_reviews_employee_id_idx
  on public.hr_performance_reviews (employee_id);

alter table public.hr_performance_reviews enable row level security;

create policy "Org members can view performance reviews"
  on public.hr_performance_reviews for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can insert performance reviews"
  on public.hr_performance_reviews for insert
  with check (public.is_org_admin(organization_id, (select auth.uid())));

create policy "Org admins can update performance reviews"
  on public.hr_performance_reviews for update
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));

create policy "Org admins can delete performance reviews"
  on public.hr_performance_reviews for delete
  using (public.is_org_admin(organization_id, (select auth.uid())));
