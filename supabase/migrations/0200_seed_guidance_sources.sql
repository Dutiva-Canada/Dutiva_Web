-- 0200_seed_guidance_sources.sql
--
-- The Knowledge panel's "Guidance sources" list reads guidance_sources,
-- which has been empty since the table shipped — the section rendered
-- "No guidance sources yet" even though the Advisor's retrieval corpus
-- (advisor_guidance_chunks) cites ~30 official sources. Seed the table from
-- the corpus itself: one row per distinct source_url the Advisor actually
-- draws on, so the list is literally the bibliography of the guidance the
-- product gives.
--
-- source_type values come from guidance_sources_source_type_check:
-- 'regulation' for the consolidated regulation text on LégisQuébec,
-- 'public_guidance' for everything else (canada.ca, CNESST, OHRC, CHRC,
-- CDPDJ, WSIB, ontario.ca ESA guides).
--
-- Idempotent: re-running is a no-op while a row with the same url exists.

insert into guidance_sources (title, source_type, jurisdiction, url, effective_date)
select
  /* Titles carry " — {document}; {chunk section}" tails from ingestion;
     the document part alone is the cleaner card title. */
  left(split_part(min(c.source_name), ';', 1), 200),
  case
    when c.source_url like '%legisquebec.gouv.qc.ca%' then 'regulation'
    else 'public_guidance'
  end,
  case
    when c.jurisdiction = 'FED' then 'Federal'
    when c.jurisdiction = 'ON' then 'Ontario'
    when c.jurisdiction = 'QC' then 'Quebec'
    else c.jurisdiction
  end,
  c.source_url,
  null
from advisor_guidance_chunks c
where c.source_url is not null
  and btrim(c.source_url) <> ''
group by c.source_url, c.jurisdiction
having not exists (
  select 1 from guidance_sources g where g.url = c.source_url
);
