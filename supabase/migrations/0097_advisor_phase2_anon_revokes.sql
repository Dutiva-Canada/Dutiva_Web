-- Close remaining unintended anon EXECUTE grants flagged by the advisor.
revoke execute on function public.join_organization_waitlist(text)
  from public, anon;
grant execute on function public.join_organization_waitlist(text)
  to authenticated, service_role;

revoke execute on function public.void_hr_document_signature(uuid)
  from public, anon;
grant execute on function public.void_hr_document_signature(uuid)
  to authenticated, service_role;
