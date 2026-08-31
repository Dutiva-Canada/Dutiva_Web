-- Rename employment-location columns on the production HR tables so the schema
-- matches the app domain model (jurisdiction, not province). Values are
-- unchanged — full English jurisdiction names (e.g. 'Ontario').

alter table public.employees
  rename column province to jurisdiction;

comment on column public.employees.jurisdiction is
  'Employment jurisdiction — full English name (e.g. Ontario, Quebec).';

alter table public.hr_cases
  rename column province to jurisdiction;

comment on column public.hr_cases.jurisdiction is
  'Governing jurisdiction for the case — full English name (e.g. Ontario, Quebec).';
