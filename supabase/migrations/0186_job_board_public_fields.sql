-- 0186: public job-board fields for the launch-ready careers board.
--
-- Adds the optional columns the candidate-facing detail page needs and a
-- stable SEO slug per posting, then rebuilds the public_job_postings view
-- (0165) to expose them. Everything is nullable/defaulted, so existing
-- postings and every pre-0186 client keep working unchanged.
--
-- - slug: '<slugified-title>-<id prefix>', generated once at insert and
--   stable afterwards (title edits never re-target a canonical URL).
--   uuid-bearing legacy links keep resolving because lookup accepts both.
-- - salary_*: structured fields so the detail page can emit a valid
--   schema.org baseSalary — free text can't carry Google's JobPosting.
-- - responsibilities / benefits: list fields mirroring requirements.
-- - employer_blurb: per-posting employer text — orgs have no public
--   profile table, and employers tailor it per role.

ALTER TABLE public.hr_job_postings
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS salary_min NUMERIC,
  ADD COLUMN IF NOT EXISTS salary_max NUMERIC,
  ADD COLUMN IF NOT EXISTS salary_period TEXT NOT NULL DEFAULT 'year'
    CHECK (salary_period IN ('year', 'hour')),
  ADD COLUMN IF NOT EXISTS responsibilities TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS benefits TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS employer_blurb TEXT;

-- Slugify is deliberately ASCII-only — accents fold through unaccent-free
-- lower()/regexp_replace, so a French title like "Coordonnateur·rice RH"
-- slugs to 'coordonnateur-rice-rh-…' which stays URL-clean.
CREATE OR REPLACE FUNCTION public.job_posting_slug(p_title TEXT, p_id UUID)
RETURNS TEXT AS $$
  SELECT left(
    trim(both '-' from lower(regexp_replace(p_title, '[^a-zA-Z0-9]+', '-', 'g'))),
    60
  ) || '-' || left(p_id::text, 6);
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.job_posting_set_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.job_posting_slug(NEW.title, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS job_posting_set_slug ON public.hr_job_postings;
CREATE TRIGGER job_posting_set_slug
  BEFORE INSERT ON public.hr_job_postings
  FOR EACH ROW EXECUTE FUNCTION public.job_posting_set_slug();

-- Backfill + tighten. Idempotent: only rows missing a slug are touched.
UPDATE public.hr_job_postings
SET slug = public.job_posting_slug(title, id)
WHERE slug IS NULL OR slug = '';

ALTER TABLE public.hr_job_postings
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS hr_job_postings_slug_key
  ON public.hr_job_postings (slug);

-- anon's column-scoped grant (0167) is a whitelist — add the new public
-- columns or old select=* clients would still read the board but never see
-- them. Internal screening columns remain ungranted.
GRANT SELECT (
  slug,
  salary_min,
  salary_max,
  salary_period,
  responsibilities,
  benefits,
  employer_blurb
) ON public.hr_job_postings TO anon;

-- CREATE OR REPLACE VIEW only appends columns at the end — the existing
-- column order is part of the view's contract with deployed clients.
CREATE OR REPLACE VIEW public.public_job_postings AS
SELECT
  jp.id,
  jp.organization_id,
  o.name AS organization_name,
  jp.title,
  jp.department,
  jp.location,
  jp.type,
  jp.description,
  jp.requirements,
  jp.status,
  jp.posted_date,
  jp.closing_date,
  jp.slug,
  jp.responsibilities,
  jp.benefits,
  jp.salary_min,
  jp.salary_max,
  jp.salary_period,
  jp.employer_blurb
FROM public.hr_job_postings jp
JOIN public.organizations o ON o.id = jp.organization_id
WHERE jp.status = 'active';

GRANT SELECT ON public.public_job_postings TO anon, authenticated;
