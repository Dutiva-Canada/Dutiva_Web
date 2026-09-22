-- Candidate Portal hardening — closes the gaps found in the 2026-09 portal audit.
--
-- 1. public_job_postings view: the job board read surface. Anon callers used
--    to read hr_job_postings directly, which leaked employer-internal columns
--    (knockout_criteria, work_sample_scenario) to anyone holding the anon key.
--    The view exposes only public columns plus the employer name, and is
--    owned by postgres so it bypasses RLS on the base tables — the
--    status='active' filter lives in the view itself.
-- 2. The direct public-read policy on hr_job_postings is dropped; only org
--    members (0118) read the table now. Anon loses the table grant as well —
--    both board reads and the build-time sitemap query go through the view.
-- 3. guard_candidate_application_update(): a candidate could previously
--    UPDATE any column on their own row (self-assign 'hired', rewrite the
--    submitted resume, repoint the posting). Now only `status` may change,
--    and the owner may only set it to 'withdrawn'.
-- 4. Org members get UPDATE on applications to their postings so employers
--    can actually move candidates through the pipeline (the guard restricts
--    them to the status column too).
-- 5. Org members can read the profile of anyone who applied to their
--    postings — the employer inbox needs the applicant's name/email.
-- 6. candidate_ai_usage + claim_candidate_ai_call(): a per-user daily rail
--    for the free candidate-ai edge function (previously unmetered).

-- ── 1. Public postings view ──────────────────────────────────────────────
CREATE OR REPLACE VIEW public_job_postings AS
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
  jp.closing_date
FROM hr_job_postings jp
JOIN organizations o ON o.id = jp.organization_id
WHERE jp.status = 'active';

GRANT SELECT ON public_job_postings TO anon, authenticated;

-- ── 2. Close direct public reads on the base table ───────────────────────
DROP POLICY IF EXISTS "Public can read active job postings" ON hr_job_postings;
REVOKE SELECT ON hr_job_postings FROM anon;

-- ── 3. Update guard: status is the only mutable column ───────────────────
CREATE OR REPLACE FUNCTION guard_candidate_application_update()
RETURNS TRIGGER AS $$
DECLARE
  is_owner boolean;
BEGIN
  IF NEW.candidate_id IS DISTINCT FROM OLD.candidate_id
     OR NEW.job_posting_id IS DISTINCT FROM OLD.job_posting_id
     OR NEW.cover_letter IS DISTINCT FROM OLD.cover_letter
     OR NEW.submitted_resume IS DISTINCT FROM OLD.submitted_resume
     OR NEW.ai_match_score IS DISTINCT FROM OLD.ai_match_score
     OR NEW.ai_suggestions IS DISTINCT FROM OLD.ai_suggestions
     OR NEW.applied_at IS DISTINCT FROM OLD.applied_at THEN
    RAISE EXCEPTION 'Only application status can be updated';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT EXISTS (
      SELECT 1 FROM candidate_profiles
      WHERE id = NEW.candidate_id AND user_id = auth.uid()
    ) INTO is_owner;
    IF is_owner AND NEW.status <> 'withdrawn' THEN
      RAISE EXCEPTION 'Candidates may only withdraw their application';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS guard_candidate_application_update ON candidate_applications;
CREATE TRIGGER guard_candidate_application_update
  BEFORE UPDATE ON candidate_applications
  FOR EACH ROW EXECUTE FUNCTION guard_candidate_application_update();

-- ── 4. Org members can move applications through the pipeline ────────────
CREATE POLICY "Org members can update application status"
  ON candidate_applications FOR UPDATE
  USING (
    job_posting_id IN (
      SELECT id FROM hr_job_postings
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    job_posting_id IN (
      SELECT id FROM hr_job_postings
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

-- ── 5. Org members can read applicant profiles ────────────────────────────
CREATE POLICY "Org members can read applicant profiles"
  ON candidate_profiles FOR SELECT
  USING (
    id IN (
      SELECT candidate_id FROM candidate_applications
      WHERE job_posting_id IN (
        SELECT id FROM hr_job_postings
        WHERE organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- ── 5b. Drop the dead candidate_resumes table ────────────────────────────
-- Migration 0153 created it for a "resume versions" feature that was never
-- wired up — no code path reads or writes it (applications snapshot the
-- resume text onto candidate_applications.submitted_resume instead). It is
-- personal-data storage with no purpose, so it goes rather than sitting
-- there collecting risk. Verified empty of any writer before dropping.
DROP TABLE IF EXISTS candidate_resumes;

-- ── 6. Daily rail for candidate-ai ───────────────────────────────────────
-- Counter table, not a log — one row per user per day. RLS enabled with no
-- user policies: only the service role (the edge function) touches it.
CREATE TABLE IF NOT EXISTS candidate_ai_usage (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  calls INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);

ALTER TABLE candidate_ai_usage ENABLE ROW LEVEL SECURITY;

-- Atomic claim: increments today's counter and reports whether the call is
-- under the daily cap. Over-counts on concurrent bursts by design — same
-- fail-safe direction as claim_ai_usage for Advisor.
CREATE OR REPLACE FUNCTION claim_candidate_ai_call(p_user_id UUID)
RETURNS BOOLEAN AS $$
  WITH upsert AS (
    INSERT INTO candidate_ai_usage AS u (user_id, day, calls)
    VALUES (p_user_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, day) DO UPDATE SET calls = u.calls + 1
    RETURNING calls
  )
  SELECT calls <= 30 FROM upsert;
$$ LANGUAGE sql;

-- Postgres grants EXECUTE to PUBLIC by default; without this, any signed-in
-- user could RPC-increment another user's counter and burn their daily quota.
REVOKE EXECUTE ON FUNCTION claim_candidate_ai_call(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_candidate_ai_call(UUID) TO service_role;
