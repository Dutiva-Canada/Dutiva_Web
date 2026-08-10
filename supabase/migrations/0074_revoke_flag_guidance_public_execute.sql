-- Close a lint gap introduced by 0071.
--
-- flag_guidance_chunks_on_law_change() is a SECURITY DEFINER trigger
-- function. It does not need to be reachable as a /rest/v1/rpc endpoint,
-- and the security advisor flags it as "Public can execute SECURITY DEFINER
-- function" because it is exposed by default in the public schema.
-- Revoke client execute while leaving it available to the trigger and to
-- service_role (the function owner already has implicit execute).

REVOKE EXECUTE ON FUNCTION public.flag_guidance_chunks_on_law_change() FROM PUBLIC, anon, authenticated;
