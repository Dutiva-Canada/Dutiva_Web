-- 0206_health_journal_shared.sql
--
-- Dutiva Health — per-entry consent for Mira. "Let Mira read this" sets
-- shared_at on the journal row; revoking clears it. Null = private (the
-- default): the health-ai function includes an entry's excerpt in
-- companion context only while shared_at is set.
--
-- A timestamp rather than a boolean — it records when consent was given
-- and doubles as the flag. RLS is unchanged: the existing owner policy
-- already scopes the write, and the column is just another field on the
-- user's own row.
--
--   shared_at — consent given at / null = not shared
--
-- ROLLBACK:
--   alter table public.health_journal_entries drop column if exists shared_at;

alter table public.health_journal_entries
  add column if not exists shared_at timestamptz;
