/**
 * Real persistence for the Hiring module (production mode) — reads and
 * writes hiring-related tables, org-scoped by RLS.
 *
 * Database schema (to be implemented via migration):
 * - hr_candidates: Main candidate records
 * - hr_evidence_screening: AI-extracted evidence data
 * - hr_work_samples: Work sample assessments
 * - hr_defense_interviews: Interview records and conversations
 * - hr_authenticity_scores: Five-score evaluation results
 * - hr_job_postings: Job posting management
 *
 * These throw on failure: they only run for the signed-in admin in production
 * mode, where an error must surface, not vanish.
 */
export * from './candidates'
export * from './evidenceScreening'
export * from './workSamples'
export * from './defenseInterviews'
export * from './authenticityScores'
export * from './jobPostings'
export * from './portalApplications'
export * from './funnelMetrics'
