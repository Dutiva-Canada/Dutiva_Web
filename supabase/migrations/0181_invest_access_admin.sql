-- 0181 — invest access tiers + durable owner grant
--
-- Adds a `role` column to `invest_access` ('client' | 'admin') so the portal
-- can distinguish invited clients from operators. Presence still grants
-- access; the role is the seam for admin-level capabilities (e.g. invoking
-- the run-all sweep with a user JWT instead of the trigger secret).
--
-- Grants are managed service-side only — users can read their own row via
-- the select policy from 0180, never write it.
--
-- The platform owner must never lose access: the row is seeded for the
-- existing account AND re-asserted by an auth.users trigger on every future
-- signup under the owner address (covers account re-registration after
-- deletion). The trigger is security-definer and does nothing for any other
-- address.
--
-- Idempotent: column add + trigger replace + upsert are all re-runnable.
-- Rollback (manual):
--   drop trigger if exists invest_access_owner_signup on auth.users;
--   drop function if exists public._invest_grant_owner_access();
--   alter table public.invest_access drop column if exists role;

alter table public.invest_access
  add column if not exists role text not null default 'client'
    check (role in ('client', 'admin'));

insert into public.invest_access (user_id, role, granted_by, note)
values (
  '4054436f-51a9-493b-a679-226aaf548b4e',
  'admin',
  'system',
  'Platform owner — permanent grant (0181).'
)
on conflict (user_id) do update
  set role = 'admin', granted_by = 'system';

create or replace function public._invest_grant_owner_access()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(new.email) = 'martin.constantineau@dutiva.ca' then
    insert into public.invest_access (user_id, role, granted_by, note)
    values (new.id, 'admin', 'system', 'Platform owner — permanent grant (0181).')
    on conflict (user_id) do update set role = 'admin', granted_by = 'system';
  end if;
  return new;
end;
$$;

revoke all on function public._invest_grant_owner_access() from public;

drop trigger if exists invest_access_owner_signup on auth.users;
create trigger invest_access_owner_signup
  after insert on auth.users
  for each row execute function public._invest_grant_owner_access();
