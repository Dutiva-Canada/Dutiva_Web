-- 0167: column-scoped anon read on hr_job_postings.
--
-- 0165 moved public job-board reads to the public_job_postings view and
-- revoked anon's table-level SELECT. That is the right end state — but every
-- bundle deployed before 0165 still queries the base table by name, and for
-- them the board 401s until their deployment rolls forward. Column-level
-- grants restore the old clients without re-opening the leak: anon can read
-- exactly the columns it always selected, and knockout_criteria /
-- work_sample_scenario are simply never granted — select=* fails on them.
--
-- The policy is scoped TO anon on purpose: authenticated callers already hold
-- a table-level SELECT grant (employers need every column via the org-member
-- policies), and Postgres grants are additive — adding authenticated here
-- would hand candidates the internal columns again. Signed-in candidates read
-- the board through public_job_postings like everyone else.

GRANT SELECT (
  id,
  organization_id,
  title,
  department,
  location,
  type,
  description,
  requirements,
  status,
  posted_date,
  closing_date
) ON hr_job_postings TO anon;

CREATE POLICY "Anon can read active job posting columns"
  ON hr_job_postings FOR SELECT
  TO anon
  USING (status = 'active');
