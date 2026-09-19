-- Customer directory for platform admins.
--
-- The production database already defines admin_list_users() and
-- admin_list_organizations() (see supabase/schema.sql): STABLE, SECURITY
-- DEFINER, and each raises 'not authorized' unless is_admin(auth.uid()) —
-- i.e. a @dutiva.ca account or a user_roles owner/admin row. But EXECUTE was
-- only ever granted to service_role, so no browser session could call them —
-- not even an admin's.
--
-- Granting authenticated is safe for the same reason 0050 gave for the RLS
-- predicate helpers: the function body itself is the authorization boundary.
-- A non-admin caller gets the 'not authorized' exception and zero rows.
-- anon is deliberately NOT granted, matching the boundary 0004/0020/0050 set.
--
-- ROLLBACK:
--   revoke execute on function public.admin_list_users() from authenticated;
--   revoke execute on function public.admin_list_organizations() from authenticated;

grant execute on function public.admin_list_users()         to authenticated;
grant execute on function public.admin_list_organizations() to authenticated;

revoke execute on function public.admin_list_users()         from anon;
revoke execute on function public.admin_list_organizations() from anon;
