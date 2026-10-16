-- 0232_pr_geo_note_source.sql
--
-- pr_geo_prompts.note holds two different kinds of text: a machine excerpt
-- from the scheduled check and a human's own observation from a manual
-- spot-check. checked_via records how the last CHECK ran, not who wrote
-- the note — so an auto check that preserves a manual note still flips
-- checked_via to 'auto', and the next sweep treats the human text as a
-- machine excerpt and overwrites it. note_source records who wrote the
-- note so a manual observation survives every auto check, while machine
-- excerpts keep refreshing.
--
--   note_source = 'manual' → note is the person's words; auto checks keep it
--   note_source = 'auto'   → note is the last answer excerpt; auto checks
--                            replace it each run
--
-- ROLLBACK:
--   alter table public.pr_geo_prompts drop column if exists note_source;

alter table public.pr_geo_prompts
  add column if not exists note_source text not null default 'auto'
    check (note_source in ('manual','auto'));

-- Rows that already carry a human note (checked manually, note has text)
-- get the right provenance so tonight's sweep doesn't clobber them.
update public.pr_geo_prompts
  set note_source = 'manual'
  where checked_via = 'manual' and btrim(note) <> '';
