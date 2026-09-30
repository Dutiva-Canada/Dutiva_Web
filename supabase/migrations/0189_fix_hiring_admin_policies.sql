-- Fix hiring-module write policies: 0118 checked the literal role 'admin',
-- but real memberships carry 'owner', so every insert/update/delete on the
-- hiring tables failed RLS for actual org admins (candidate creation was the
-- visible symptom). Recreate them with public.is_org_admin(), the canonical
-- owner+admin helper used by employees (0006) and the earlier hr_* tables —
-- it also requires status = 'active', which the inline checks missed.

DROP POLICY IF EXISTS "Org admins can insert candidates" ON hr_candidates;
CREATE POLICY "Org admins can insert candidates"
  ON hr_candidates FOR INSERT
  WITH CHECK (public.is_org_admin(organization_id, (select auth.uid())));

DROP POLICY IF EXISTS "Org admins can update candidates" ON hr_candidates;
CREATE POLICY "Org admins can update candidates"
  ON hr_candidates FOR UPDATE
  USING (public.is_org_admin(organization_id, (select auth.uid())))
  WITH CHECK (public.is_org_admin(organization_id, (select auth.uid())));

DROP POLICY IF EXISTS "Org admins can delete candidates" ON hr_candidates;
CREATE POLICY "Org admins can delete candidates"
  ON hr_candidates FOR DELETE
  USING (public.is_org_admin(organization_id, (select auth.uid())));

DROP POLICY IF EXISTS "Org admins can manage job postings" ON hr_job_postings;
CREATE POLICY "Org admins can manage job postings"
  ON hr_job_postings FOR ALL
  USING (public.is_org_admin(organization_id, (select auth.uid())))
  WITH CHECK (public.is_org_admin(organization_id, (select auth.uid())));

DROP POLICY IF EXISTS "Org admins can manage evidence screening" ON hr_evidence_screening;
CREATE POLICY "Org admins can manage evidence screening"
  ON hr_evidence_screening FOR ALL
  USING (
    candidate_id IN (
      SELECT id FROM hr_candidates
      WHERE public.is_org_admin(organization_id, (select auth.uid()))
    )
  )
  WITH CHECK (
    candidate_id IN (
      SELECT id FROM hr_candidates
      WHERE public.is_org_admin(organization_id, (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Org admins can manage work samples" ON hr_work_samples;
CREATE POLICY "Org admins can manage work samples"
  ON hr_work_samples FOR ALL
  USING (
    candidate_id IN (
      SELECT id FROM hr_candidates
      WHERE public.is_org_admin(organization_id, (select auth.uid()))
    )
  )
  WITH CHECK (
    candidate_id IN (
      SELECT id FROM hr_candidates
      WHERE public.is_org_admin(organization_id, (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Org admins can manage interviews" ON hr_defense_interviews;
CREATE POLICY "Org admins can manage interviews"
  ON hr_defense_interviews FOR ALL
  USING (
    candidate_id IN (
      SELECT id FROM hr_candidates
      WHERE public.is_org_admin(organization_id, (select auth.uid()))
    )
  )
  WITH CHECK (
    candidate_id IN (
      SELECT id FROM hr_candidates
      WHERE public.is_org_admin(organization_id, (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Org admins can manage authenticity scores" ON hr_authenticity_scores;
CREATE POLICY "Org admins can manage authenticity scores"
  ON hr_authenticity_scores FOR ALL
  USING (
    candidate_id IN (
      SELECT id FROM hr_candidates
      WHERE public.is_org_admin(organization_id, (select auth.uid()))
    )
  )
  WITH CHECK (
    candidate_id IN (
      SELECT id FROM hr_candidates
      WHERE public.is_org_admin(organization_id, (select auth.uid()))
    )
  );
