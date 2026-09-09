-- Advisor Memory governance expansion — adds the lifecycle, classification,
-- sensitivity tier, retention, legal hold, Advisor-usable, purpose,
-- jurisdiction, provenance, confidence score, review/expiry, source excerpt,
-- and retrieval scope columns that the frontend MemoryFact model already
-- uses. Migration 0086 only persisted the original fact columns; this closes
-- that gap so production persistence matches the demo workspace.
--
-- All new columns are nullable or have safe defaults so existing rows and
-- the current productionApi.ts contract keep working unchanged. The frontend
-- continues to derive effective values when a column is null (see
-- memoryModel.ts effectiveStatus / effectiveSensitivity / effectiveAdvisorUsable).
--
-- Audit actions are expanded to cover the full lifecycle (proposed, rejected,
-- edited, restored, expired, exported, legal_hold_added,
-- legal_hold_removed, review_requested, memory_disabled, memory_enabled).

-- ---- Lifecycle + classification ----

ALTER TABLE public.hr_advisor_memory_facts
  ADD COLUMN IF NOT EXISTS status text
    check (status in ('proposed', 'needs_review', 'confirmed', 'expired', 'removed'));

ALTER TABLE public.hr_advisor_memory_facts
  ADD COLUMN IF NOT EXISTS classification text
    check (classification in (
      'fact', 'preference', 'allegation', 'opinion',
      'evidence', 'finding', 'decision', 'contextual'
    ));

ALTER TABLE public.hr_advisor_memory_facts
  ADD COLUMN IF NOT EXISTS origin text
    check (origin in ('explicit', 'inferred', 'manual'));

-- ---- Sensitivity tier (richer than the boolean sensitive flag) ----

ALTER TABLE public.hr_advisor_memory_facts
  ADD COLUMN IF NOT EXISTS sensitivity text
    check (sensitivity in ('standard', 'restricted'));

-- ---- Advisor-usable state (distinct from stored) ----

ALTER TABLE public.hr_advisor_memory_facts
  ADD COLUMN IF NOT EXISTS advisor_usable boolean;

-- ---- Retention category + schedule ----

ALTER TABLE public.hr_advisor_memory_facts
  ADD COLUMN IF NOT EXISTS retention_category text
    check (retention_category in (
      'advisor_conversation', 'employee_preference', 'employment_record',
      'payroll_tax', 'investigation', 'wellbeing_personal', 'custom'
    ));

ALTER TABLE public.hr_advisor_memory_facts
  ADD COLUMN IF NOT EXISTS review_date timestamptz;

ALTER TABLE public.hr_advisor_memory_facts
  ADD COLUMN IF NOT EXISTS expiry_date timestamptz;

ALTER TABLE public.hr_advisor_memory_facts
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz;

-- ---- Legal hold ----

ALTER TABLE public.hr_advisor_memory_facts
  ADD COLUMN IF NOT EXISTS legal_hold_reason_en text;

ALTER TABLE public.hr_advisor_memory_facts
  ADD COLUMN IF NOT EXISTS legal_hold_reason_fr text;

ALTER TABLE public.hr_advisor_memory_facts
  ADD COLUMN IF NOT EXISTS legal_hold_placed_by text;

ALTER TABLE public.hr_advisor_memory_facts
  ADD COLUMN IF NOT EXISTS legal_hold_placed_at timestamptz;

-- ---- Purpose + jurisdiction ----

ALTER TABLE public.hr_advisor_memory_facts
  ADD COLUMN IF NOT EXISTS purpose_en text;

ALTER TABLE public.hr_advisor_memory_facts
  ADD COLUMN IF NOT EXISTS purpose_fr text;

ALTER TABLE public.hr_advisor_memory_facts
  ADD COLUMN IF NOT EXISTS jurisdiction text;

-- ---- Provenance ----

ALTER TABLE public.hr_advisor_memory_facts
  ADD COLUMN IF NOT EXISTS proposed_by text;

ALTER TABLE public.hr_advisor_memory_facts
  ADD COLUMN IF NOT EXISTS confidence_score numeric
    check (confidence_score >= 0 and confidence_score <= 1);

ALTER TABLE public.hr_advisor_memory_facts
  ADD COLUMN IF NOT EXISTS creator_label text;

ALTER TABLE public.hr_advisor_memory_facts
  ADD COLUMN IF NOT EXISTS confirmed_by_label text;

-- ---- Source excerpt ----

ALTER TABLE public.hr_advisor_memory_facts
  ADD COLUMN IF NOT EXISTS source_excerpt_en text;

ALTER TABLE public.hr_advisor_memory_facts
  ADD COLUMN IF NOT EXISTS source_excerpt_fr text;

-- ---- Retrieval scope ----

ALTER TABLE public.hr_advisor_memory_facts
  ADD COLUMN IF NOT EXISTS retrieval_scope_type text
    check (retrieval_scope_type in ('workspace', 'case', 'conversation', 'workflow'));

ALTER TABLE public.hr_advisor_memory_facts
  ADD COLUMN IF NOT EXISTS retrieval_scope_id text;

-- ---- Index the new status column for the review queue filter ----

CREATE INDEX IF NOT EXISTS hr_advisor_memory_facts_status_idx
  ON public.hr_advisor_memory_facts (organization_id, status)
  WHERE forgotten_at is null;

-- ---- Expand audit actions ----

ALTER TABLE public.hr_advisor_memory_audit
  DROP CONSTRAINT IF EXISTS hr_advisor_memory_audit_action_check;

ALTER TABLE public.hr_advisor_memory_audit
  ADD CONSTRAINT hr_advisor_memory_audit_action_check check (
    action in (
      'create', 'confirm', 'correct', 'forget',
      'proposed', 'rejected', 'edited', 'restored', 'expired',
      'exported', 'legal_hold_added', 'legal_hold_removed',
      'review_requested', 'memory_disabled', 'memory_enabled'
    )
  );

-- ---- Backfill: derive status + sensitivity from existing columns ----

UPDATE public.hr_advisor_memory_facts
  SET status = CASE
    WHEN forgotten_at is not null THEN 'removed'
    WHEN confidence = 'confirmed' THEN 'confirmed'
    ELSE 'proposed'
  END
  WHERE status is null;

UPDATE public.hr_advisor_memory_facts
  SET sensitivity = CASE WHEN sensitive THEN 'restricted' ELSE 'standard' END
  WHERE sensitivity is null;

UPDATE public.hr_advisor_memory_facts
  SET advisor_usable = true
  WHERE advisor_usable is null
    AND forgotten_at is null;

UPDATE public.hr_advisor_memory_facts
  SET origin = CASE
    WHEN source_type = 'manual' THEN 'manual'
    WHEN source_type = 'inference' THEN 'inferred'
    ELSE 'explicit'
  END
  WHERE origin is null;

UPDATE public.hr_advisor_memory_facts
  SET classification = 'fact'
  WHERE classification is null;

-- ---- Update comments ----

COMMENT ON TABLE public.hr_advisor_memory_facts IS
  'Advisor Memory governed facts (one row = one fact). Soft-forget via forgotten_at. Migration 0155 added governance columns (status, classification, sensitivity, retention, legal hold, Advisor-usable, purpose, jurisdiction, provenance, retrieval scope).';

COMMENT ON COLUMN public.hr_advisor_memory_facts.status IS
  'Lifecycle status. When null, derived from confidence + forgotten_at for back-compat.';
COMMENT ON COLUMN public.hr_advisor_memory_facts.classification IS
  'Record kind (fact, preference, allegation, opinion, evidence, finding, decision, contextual). Allegations/opinions are not verified facts.';
COMMENT ON COLUMN public.hr_advisor_memory_facts.sensitivity IS
  'Sensitivity tier. When null, derived from the sensitive boolean for back-compat.';
COMMENT ON COLUMN public.hr_advisor_memory_facts.advisor_usable IS
  'Whether Advisor may retrieve this memory into context. Distinct from whether it is stored.';
COMMENT ON COLUMN public.hr_advisor_memory_facts.retrieval_scope_type IS
  'Where Advisor may use this memory. Distinct from the subject scope.';
COMMENT ON COLUMN public.hr_advisor_memory_facts.legal_hold_placed_at IS
  'When the legal hold was placed. While set, scheduled expiration/deletion is paused.';
