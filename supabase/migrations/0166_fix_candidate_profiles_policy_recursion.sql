-- 0166: break the RLS recursion introduced by 0165.
--
-- "Org members can read applicant profiles" on candidate_profiles queried
-- candidate_applications, whose candidate-ownership policy ("Candidates can
-- read own applications", 0153) queries candidate_profiles. Postgres detects
-- the circular policy reference and raises 42P17 (infinite recursion) on
-- EVERY read of either table — for candidates, employers, and anon alike.
--
-- Fix: move the applications→postings→membership join behind a SECURITY
-- DEFINER function. The function executes as the table owner (postgres),
-- which bypasses RLS on candidate_applications, so evaluating the
-- candidate_profiles policy never re-enters candidate_applications policy
-- evaluation.

CREATE OR REPLACE FUNCTION profile_applied_to_member_org(p_candidate_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM candidate_applications ca
    JOIN hr_job_postings jp ON jp.id = ca.job_posting_id
    JOIN organization_members om ON om.organization_id = jp.organization_id
    WHERE ca.candidate_id = p_candidate_id
      AND om.user_id = auth.uid()
  )
$$;

-- Only employers (authenticated) ever satisfy the policy; the function reveals
-- a boolean scoped to the caller's own orgs, so anon gets no new signal.
REVOKE EXECUTE ON FUNCTION profile_applied_to_member_org(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION profile_applied_to_member_org(UUID) TO authenticated;

DROP POLICY IF EXISTS "Org members can read applicant profiles" ON candidate_profiles;
CREATE POLICY "Org members can read applicant profiles"
  ON candidate_profiles FOR SELECT
  USING (profile_applied_to_member_org(id));
