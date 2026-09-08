-- Deeper employee roster fields — department, employment type, and phone.
-- These are basic roster columns that HR actually needs, without trying to
-- replace a full HRIS.

alter table public.employees
  add column if not exists department text,
  add column if not exists employment_type text
    constraint employees_employment_type_check
      check (employment_type in ('full_time', 'part_time', 'contract', 'intern')),
  add column if not exists phone text;

comment on column public.employees.department is 'Free-form department or team name.';
comment on column public.employees.employment_type is 'Full-time, part-time, contract, or intern.';
comment on column public.employees.phone is 'Work or direct phone number.';
