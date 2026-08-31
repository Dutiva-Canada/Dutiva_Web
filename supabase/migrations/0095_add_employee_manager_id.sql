-- Optional direct line manager on production employee records. Nullable — unset
-- until an org admin assigns one; no demo fixture backfill.

alter table public.employees
  add column if not exists manager_id uuid references public.employees (id) on delete set null;

alter table public.employees
  drop constraint if exists employees_manager_not_self;

alter table public.employees
  add constraint employees_manager_not_self check (manager_id is distinct from id);

create index if not exists employees_manager_id_idx
  on public.employees (manager_id);

comment on column public.employees.manager_id is
  'Direct line manager within the organization; null when unset or unknown.';
