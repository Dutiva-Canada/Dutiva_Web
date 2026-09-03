-- Supabase advisor phase 1 (2026-09-03):
--   * Close anon EXECUTE on org/capacity RPCs that 0075 intended to lock —
--     REVOKE FROM PUBLIC does not remove Supabase's explicit anon grant.
--   * Lock internal signing helper _hr_signing_actor_email and pin search_path.
--   * Drop four duplicate btree indexes flagged by the performance linter.

-- Org provisioning + capacity admin — authenticated (+ service_role) only.
revoke execute on function public.create_organization(text, text)
  from public, anon;
grant execute on function public.create_organization(text, text)
  to authenticated, service_role;

revoke execute on function public.get_organization_capacity_status()
  from public, anon;
grant execute on function public.get_organization_capacity_status()
  to authenticated, service_role;

revoke execute on function public.update_capacity_config(integer, boolean, text)
  from public, anon;
grant execute on function public.update_capacity_config(integer, boolean, text)
  to authenticated, service_role;

-- Internal helper — not a client RPC.
revoke execute on function public._hr_signing_actor_email()
  from public, anon, authenticated;

alter function public._hr_signing_actor_email()
  set search_path = pg_catalog, public;

-- Duplicate indexes — keep the legacy *_idx names from the doclib era.
drop index if exists public.idx_conversations_user_id;
drop index if exists public.idx_documents_employer_profile;
drop index if exists public.idx_signatures_document_id;
drop index if exists public.idx_signatures_user_id;
