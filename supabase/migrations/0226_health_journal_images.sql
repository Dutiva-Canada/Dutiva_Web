-- ── Journal photo attachments ─────────────────────────────────────────────
-- One optional photo per journal entry. The row stores only the storage
-- path (never the bytes); the file lives in the private
-- `health-journal-images` bucket under `<uid>/<entry>/<file>`, matching the
-- uid-prefixed storage policies below (same pattern as migration 0014's
-- support-attachments bucket).
--
-- IMPORTANT: this file must be APPLIED to the project before the feature is
-- usable — the app capability-probes the bucket and hides the attach UI
-- until it exists, so a repo-only merge ships nothing broken.

alter table public.health_journal_entries
  add column if not exists image_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'health-journal-images', 'health-journal-images', false, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Object keys are namespaced by the owner's uid: `<uid>/<entry>/<file>`.
-- Authenticated users write, read, and remove only under their own prefix.
-- Nothing is public; reads go through signed URLs.
create policy "Users upload own journal images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'health-journal-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Users read own journal images"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'health-journal-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Users delete own journal images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'health-journal-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Users replace own journal images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'health-journal-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
