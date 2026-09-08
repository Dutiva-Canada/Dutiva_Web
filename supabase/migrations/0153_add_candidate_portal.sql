-- Candidate Portal: B2C job application product
-- Migration 0153: Add tables for the public-facing candidate experience
--
-- This migration creates the database schema for the Dutiva candidate portal,
-- a B2C product where candidates browse job postings, create profiles, and
-- apply with optional AI assistance (resume tailoring, cover letter
-- generation, match scoring, interview prep).
--
-- Tables created:
-- 1. candidate_profiles — candidate profile (linked to auth.users, not org-scoped)
-- 2. candidate_applications — applications linking candidates to job postings
-- 3. candidate_resumes — resume versions (base + AI-tailored per job)
--
-- RLS changes:
-- - hr_job_postings: public read access for active postings (candidates browse)
-- - candidate_profiles: users read/write only their own profile
-- - candidate_applications: users read/write only their own applications
-- - candidate_resumes: users read/write only their own resumes

-- ── candidate_profiles ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS candidate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT,
  location TEXT NOT NULL DEFAULT '',
  headline TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  resume_text TEXT NOT NULL DEFAULT '',
  linkedin TEXT,
  website TEXT,
  "current_role" TEXT,
  years_experience INTEGER,
  work_authorization TEXT NOT NULL DEFAULT 'unknown'
    CHECK (work_authorization IN ('authorized', 'needs_sponsorship', 'unknown')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_user ON candidate_profiles(user_id);

-- ── candidate_resumes ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS candidate_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'My resume',
  content TEXT NOT NULL DEFAULT '',
  is_base BOOLEAN NOT NULL DEFAULT false,
  tailored_for_posting_id UUID REFERENCES hr_job_postings(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE candidate_resumes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_candidate_resumes_candidate ON candidate_resumes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_resumes_base ON candidate_resumes(candidate_id, is_base);

-- ── candidate_applications ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS candidate_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  job_posting_id UUID NOT NULL REFERENCES hr_job_postings(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'under_review', 'shortlisted', 'interview', 'offered', 'hired', 'rejected', 'withdrawn')),
  cover_letter TEXT,
  submitted_resume TEXT NOT NULL DEFAULT '',
  ai_match_score INTEGER,
  ai_suggestions JSONB,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(candidate_id, job_posting_id)
);

ALTER TABLE candidate_applications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_candidate_applications_candidate ON candidate_applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_applications_posting ON candidate_applications(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_candidate_applications_status ON candidate_applications(status);

-- ── RLS: Public read access for active job postings ──────────────────────
-- Candidates (including anonymous visitors) can browse active postings.
-- Org-scoped policies from 0118 remain; this is an additive public-read policy.
DROP POLICY IF EXISTS "Public can read active job postings" ON hr_job_postings;
CREATE POLICY "Public can read active job postings"
  ON hr_job_postings FOR SELECT
  USING (status = 'active');

-- ── RLS: candidate_profiles — users manage only their own profile ────────
CREATE POLICY "Users can read own candidate profile"
  ON candidate_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own candidate profile"
  ON candidate_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own candidate profile"
  ON candidate_profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own candidate profile"
  ON candidate_profiles FOR DELETE
  USING (user_id = auth.uid());

-- ── RLS: candidate_resumes — users manage only their own resumes ──────────
CREATE POLICY "Users can read own candidate resumes"
  ON candidate_resumes FOR SELECT
  USING (
    candidate_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own candidate resumes"
  ON candidate_resumes FOR INSERT
  WITH CHECK (
    candidate_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own candidate resumes"
  ON candidate_resumes FOR UPDATE
  USING (
    candidate_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    candidate_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own candidate resumes"
  ON candidate_resumes FOR DELETE
  USING (
    candidate_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
  );

-- ── RLS: candidate_applications — users manage only their own applications ─
CREATE POLICY "Users can read own candidate applications"
  ON candidate_applications FOR SELECT
  USING (
    candidate_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own candidate applications"
  ON candidate_applications FOR INSERT
  WITH CHECK (
    candidate_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own candidate applications"
  ON candidate_applications FOR UPDATE
  USING (
    candidate_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    candidate_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own candidate applications"
  ON candidate_applications FOR DELETE
  USING (
    candidate_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
  );

-- ── Org members can read applications to their job postings ───────────────
-- Employers see who applied to their jobs (read-only; application status
-- changes flow through the existing hr_candidates pipeline, not here).
CREATE POLICY "Org members can read applications to their postings"
  ON candidate_applications FOR SELECT
  USING (
    job_posting_id IN (
      SELECT id FROM hr_job_postings
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

-- ── Updated-at triggers ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_candidate_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_candidate_profiles_updated_at ON candidate_profiles;
CREATE TRIGGER update_candidate_profiles_updated_at
  BEFORE UPDATE ON candidate_profiles
  FOR EACH ROW EXECUTE FUNCTION update_candidate_updated_at();

DROP TRIGGER IF EXISTS update_candidate_resumes_updated_at ON candidate_resumes;
CREATE TRIGGER update_candidate_resumes_updated_at
  BEFORE UPDATE ON candidate_resumes
  FOR EACH ROW EXECUTE FUNCTION update_candidate_updated_at();

DROP TRIGGER IF EXISTS update_candidate_applications_updated_at ON candidate_applications;
CREATE TRIGGER update_candidate_applications_updated_at
  BEFORE UPDATE ON candidate_applications
  FOR EACH ROW EXECUTE FUNCTION update_candidate_updated_at();
