-- Grant Dutiva Health access to internal Dutiva staff.
--
-- Existing @dutiva.ca accounts are backfilled, and future signups or email
-- changes into the domain receive the same grant automatically. Access is
-- still represented by a health_access row, so the portal's RLS boundary
-- remains unchanged.
--
-- ROLLBACK:
--   drop trigger if exists health_access_dutiva_staff on auth.users;
--   drop function if exists public._health_grant_dutiva_staff();

insert into public.health_access (user_id, granted_by, note)
select
  u.id,
  'system',
  '@dutiva.ca staff access (0193).'
from auth.users u
where right(lower(coalesce(u.email, '')), 10) = '@dutiva.ca'
on conflict (user_id) do nothing;

create or replace function public._health_grant_dutiva_staff()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if right(lower(coalesce(new.email, '')), 10) = '@dutiva.ca' then
    insert into public.health_access (user_id, granted_by, note)
    values (new.id, 'system', '@dutiva.ca staff access (0193).')
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public._health_grant_dutiva_staff() from public;

drop trigger if exists health_access_dutiva_staff on auth.users;
create trigger health_access_dutiva_staff
  after insert or update of email on auth.users
  for each row execute function public._health_grant_dutiva_staff();