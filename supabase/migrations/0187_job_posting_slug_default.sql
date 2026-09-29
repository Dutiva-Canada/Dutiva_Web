-- 0187: slug DEFAULT '' on hr_job_postings.
--
-- The 0186 BEFORE INSERT trigger turns '' into the computed
-- '<slugified-title>-<id6>' slug, so the default is never what gets stored —
-- it exists so inserts (and the generated Supabase Insert type) may omit
-- slug entirely instead of passing a throwaway value.

ALTER TABLE public.hr_job_postings
  ALTER COLUMN slug SET DEFAULT '';
