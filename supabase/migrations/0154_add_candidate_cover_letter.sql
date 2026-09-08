-- Add default cover letter to candidate profiles

ALTER TABLE candidate_profiles
ADD COLUMN IF NOT EXISTS cover_letter TEXT;
