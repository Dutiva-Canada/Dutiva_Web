-- Persist signed document PDF exports in private Supabase Storage.
-- Client uploads after building the watermarked PDF; hr_document_exports
-- stores the object path + integrity metadata for re-download.

alter table public.hr_document_exports
  add column if not exists storage_path text,
  add column if not exists file_sha256 text,
  add column if not exists size_bytes bigint,
  add column if not exists content_type text not null default 'application/pdf';

create index if not exists hr_document_exports_storage_path_idx
  on public.hr_document_exports (storage_path)
  where storage_path is not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hr-document-exports', 'hr-document-exports', false, 52428800,
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Object keys: `<organization_id>/<document_id>/<export_id>.pdf`
create policy "Org members read document export files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'hr-document-exports'
    and public.is_org_member(((storage.foldername(name))[1])::uuid, (select auth.uid()))
  );

create policy "Org admins upload document export files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'hr-document-exports'
    and public.is_org_admin(((storage.foldername(name))[1])::uuid, (select auth.uid()))
  );

create policy "Org admins update document export files"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'hr-document-exports'
    and public.is_org_admin(((storage.foldername(name))[1])::uuid, (select auth.uid()))
  )
  with check (
    bucket_id = 'hr-document-exports'
    and public.is_org_admin(((storage.foldername(name))[1])::uuid, (select auth.uid()))
  );
