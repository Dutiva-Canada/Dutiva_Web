-- Hiring Module: Evidence-based Recruitment System
-- Migration 0118: Add tables for AI-resistant hiring funnel
-- 
-- This migration creates the database schema for the hiring module which implements:
-- 1. Candidate management and tracking
-- 2. Evidence screening (AI-extracted structured data)
-- 3. Work sample assessments
-- 4. Defense interviews
-- 5. Five-score authenticity evaluation
-- 6. Job posting management
-- 7. Funnel analytics

-- Enable RLS (assuming it's already enabled, but ensuring)
ALTER TABLE IF EXISTS hr_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS hr_evidence_screening ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS hr_work_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS hr_defense_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS hr_authenticity_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS hr_job_postings ENABLE ROW LEVEL SECURITY;

-- Main candidates table
CREATE TABLE IF NOT EXISTS hr_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT NOT NULL,
  resume TEXT NOT NULL, -- URL to resume file or storage path
  linkedin TEXT,
  position TEXT NOT NULL,
  "current_role" TEXT NOT NULL,
  years_experience INTEGER NOT NULL,
  work_authorization TEXT NOT NULL CHECK (work_authorization IN ('authorized', 'needs_sponsorship', 'unknown')),
  compensation_expectations TEXT,
  status TEXT NOT NULL DEFAULT 'application' CHECK (status IN ('application', 'basic_qualified', 'evidence_qualified', 'work_sample', 'interview', 'hired', 'rejected')),
  applied_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  assigned_to TEXT,
  knockout_criteria JSONB NOT NULL DEFAULT '{"meets_requirements": false, "required_qualifications": [], "missing_requirements": []}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Evidence screening table (AI-extracted structured data)
CREATE TABLE IF NOT EXISTS hr_evidence_screening (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES hr_candidates(id) ON DELETE CASCADE,
  relevant_experience JSONB NOT NULL DEFAULT '[]'::jsonb,
  scope JSONB NOT NULL DEFAULT '{"team_size": "", "scale": "", "complexity": "", "confidence": "medium"}'::jsonb,
  outcomes JSONB NOT NULL DEFAULT '[]'::jsonb,
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  career_trajectory JSONB NOT NULL DEFAULT '{"progression": "moderate", "evidence": "", "learning": "", "confidence": "medium"}'::jsonb,
  domain_knowledge JSONB NOT NULL DEFAULT '{"domain": "", "level": "intermediate", "evidence": "", "confidence": "medium"}'::jsonb,
  evidence_quality TEXT NOT NULL CHECK (evidence_quality IN ('high', 'medium', 'low', 'generic')),
  confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  missing_info TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(candidate_id)
);

-- Work sample assessments table
CREATE TABLE IF NOT EXISTS hr_work_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES hr_candidates(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('product_manager', 'sales', 'engineer', 'marketer', 'general')),
  scenario TEXT NOT NULL,
  submission TEXT NOT NULL,
  ai_allowed BOOLEAN NOT NULL DEFAULT true,
  ai_detected BOOLEAN NOT NULL DEFAULT false,
  time_taken TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  evaluator TEXT,
  evaluation JSONB,
  assigned_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(candidate_id)
);

-- Defense interviews table
CREATE TABLE IF NOT EXISTS hr_defense_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES hr_candidates(id) ON DELETE CASCADE,
  work_sample_id UUID NOT NULL REFERENCES hr_work_samples(id) ON DELETE CASCADE,
  format TEXT NOT NULL CHECK (format IN ('defend_work', 'technical_deep_dive', 'behavioral')),
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  interviewers TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  conversation JSONB NOT NULL DEFAULT '[]'::jsonb,
  assessment JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Authenticity scores table (five-score evaluation)
CREATE TABLE IF NOT EXISTS hr_authenticity_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES hr_candidates(id) ON DELETE CASCADE,
  qualification TEXT NOT NULL CHECK (qualification IN ('high', 'medium', 'low', 'insufficient')),
  evidence TEXT NOT NULL CHECK (evidence IN ('high', 'medium', 'low', 'insufficient')),
  capability TEXT NOT NULL CHECK (capability IN ('high', 'medium', 'low', 'insufficient')),
  reasoning TEXT NOT NULL CHECK (reasoning IN ('high', 'medium', 'low', 'insufficient')),
  motivation TEXT NOT NULL CHECK (motivation IN ('high', 'medium', 'low', 'insufficient')),
  overall TEXT NOT NULL CHECK (overall IN ('high', 'medium', 'low')),
  explanations JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(candidate_id)
);

-- Job postings table
CREATE TABLE IF NOT EXISTS hr_job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  knockout_criteria TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  work_sample_scenario TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'closed', 'draft')),
  posted_date TIMESTAMP WITH TIME ZONE,
  closing_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hr_candidates_organization ON hr_candidates(organization_id);
CREATE INDEX IF NOT EXISTS idx_hr_candidates_status ON hr_candidates(status);
CREATE INDEX IF NOT EXISTS idx_hr_candidates_applied_date ON hr_candidates(applied_date DESC);
CREATE INDEX IF NOT EXISTS idx_hr_evidence_screening_candidate ON hr_evidence_screening(candidate_id);
CREATE INDEX IF NOT EXISTS idx_hr_work_samples_candidate ON hr_work_samples(candidate_id);
CREATE INDEX IF NOT EXISTS idx_hr_work_samples_status ON hr_work_samples(status);
CREATE INDEX IF NOT EXISTS idx_hr_defense_interviews_candidate ON hr_defense_interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_hr_defense_interviews_scheduled ON hr_defense_interviews(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_hr_authenticity_scores_candidate ON hr_authenticity_scores(candidate_id);
CREATE INDEX IF NOT EXISTS idx_hr_job_postings_organization ON hr_job_postings(organization_id);
CREATE INDEX IF NOT EXISTS idx_hr_job_postings_status ON hr_job_postings(status);

-- RLS Policies
-- Organization members can read their org's candidates
CREATE POLICY "Org members can read candidates"
  ON hr_candidates FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- Organization admins can insert candidates
CREATE POLICY "Org admins can insert candidates"
  ON hr_candidates FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Organization admins can update candidates
CREATE POLICY "Org admins can update candidates"
  ON hr_candidates FOR UPDATE
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Organization admins can delete candidates
CREATE POLICY "Org admins can delete candidates"
  ON hr_candidates FOR DELETE
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Similar RLS policies for other hiring tables
CREATE POLICY "Org members can read evidence screening"
  ON hr_evidence_screening FOR SELECT
  USING (
    candidate_id IN (
      SELECT id FROM hr_candidates 
      WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Org admins can manage evidence screening"
  ON hr_evidence_screening FOR ALL
  USING (
    candidate_id IN (
      SELECT id FROM hr_candidates 
      WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role = 'admin')
    )
  );

CREATE POLICY "Org members can read work samples"
  ON hr_work_samples FOR SELECT
  USING (
    candidate_id IN (
      SELECT id FROM hr_candidates 
      WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Org admins can manage work samples"
  ON hr_work_samples FOR ALL
  USING (
    candidate_id IN (
      SELECT id FROM hr_candidates 
      WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role = 'admin')
    )
  );

CREATE POLICY "Org members can read interviews"
  ON hr_defense_interviews FOR SELECT
  USING (
    candidate_id IN (
      SELECT id FROM hr_candidates 
      WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Org admins can manage interviews"
  ON hr_defense_interviews FOR ALL
  USING (
    candidate_id IN (
      SELECT id FROM hr_candidates 
      WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role = 'admin')
    )
  );

CREATE POLICY "Org members can read authenticity scores"
  ON hr_authenticity_scores FOR SELECT
  USING (
    candidate_id IN (
      SELECT id FROM hr_candidates 
      WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Org admins can manage authenticity scores"
  ON hr_authenticity_scores FOR ALL
  USING (
    candidate_id IN (
      SELECT id FROM hr_candidates 
      WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role = 'admin')
    )
  );

CREATE POLICY "Org members can read job postings"
  ON hr_job_postings FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Org admins can manage job postings"
  ON hr_job_postings FOR ALL
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Updated timestamp trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all hiring tables
DROP TRIGGER IF EXISTS update_hr_candidates_updated_at ON hr_candidates;
CREATE TRIGGER update_hr_candidates_updated_at
  BEFORE UPDATE ON hr_candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hr_evidence_screening_updated_at ON hr_evidence_screening;
CREATE TRIGGER update_hr_evidence_screening_updated_at
  BEFORE UPDATE ON hr_evidence_screening
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hr_work_samples_updated_at ON hr_work_samples;
CREATE TRIGGER update_hr_work_samples_updated_at
  BEFORE UPDATE ON hr_work_samples
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hr_defense_interviews_updated_at ON hr_defense_interviews;
CREATE TRIGGER update_hr_defense_interviews_updated_at
  BEFORE UPDATE ON hr_defense_interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hr_authenticity_scores_updated_at ON hr_authenticity_scores;
CREATE TRIGGER update_hr_authenticity_scores_updated_at
  BEFORE UPDATE ON hr_authenticity_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hr_job_postings_updated_at ON hr_job_postings;
CREATE TRIGGER update_hr_job_postings_updated_at
  BEFORE UPDATE ON hr_job_postings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
