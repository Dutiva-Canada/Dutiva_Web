-- 0199_law_update_reference_links.sql
--
-- Two small additions that let law-change cards answer "where do I read the
-- real text" and let the monitor remember per-statute state between runs.
--
--   law_updates.reference_url — the human-facing official page for the Act
--     (LégisQuébec / e-Laws / Justice Laws). `url` keeps recording where the
--     signal came from — for Québec rows that is a machine CKAN API endpoint
--     nobody should be asked to click.
--   law_page_hashes.meta — free-form per-page state. Québec detection now
--     stores each watched Act's section→in-force-date map here so the next
--     run can say which provisions actually moved.

alter table public.law_updates
  add column if not exists reference_url text;

alter table public.law_page_hashes
  add column if not exists meta jsonb;

-- Backfill the rows whose stored `url` is a machine endpoint rather than a
-- readable statute page. HTML-sourced laws are left null — their `url`
-- already is the page, and the UI falls back to it.
update public.law_updates set reference_url =
  'https://www.legisquebec.gouv.qc.ca/en/document/cs/N-1.1'
where law_name = 'Act respecting labour standards (LNT)' and reference_url is null;

update public.law_updates set reference_url =
  'https://www.legisquebec.gouv.qc.ca/en/document/cs/C-12'
where law_name = 'Charter of Human Rights and Freedoms (Quebec)' and reference_url is null;

update public.law_updates set reference_url =
  'https://laws-lois.justice.gc.ca/eng/acts/L-2/'
where law_name = 'Canada Labour Code' and reference_url is null;

update public.law_updates set reference_url =
  'https://laws-lois.justice.gc.ca/eng/acts/H-6/'
where law_name = 'Canadian Human Rights Act' and reference_url is null;

update public.law_updates set reference_url =
  'https://www.ontario.ca/laws/statute/00e41'
where law_name = 'Employment Standards Act, 2000' and reference_url is null;

update public.law_updates set reference_url =
  'https://www.ontario.ca/laws/statute/90h19'
where law_name = 'Ontario Human Rights Code' and reference_url is null;

update public.law_updates set reference_url =
  'https://www.ontario.ca/laws/statute/97w16'
where law_name = 'Workplace Safety and Insurance Act, 1997' and reference_url is null;
